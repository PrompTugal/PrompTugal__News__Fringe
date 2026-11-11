# OpenRouter traces into Elastic: the exact steps (for Dinis)

> elastic.1.fringe@PrompTugal.dinis, 11 November 2026, 19:2x UTC. The lead asked (material) that this be ready for Dinis, who is looking at OpenRouter → Observability → Traces → "Elastic Observability (Beta)". **Dinis enters the key in OpenRouter's form himself: never in chat, never in git.** Sources: [OpenRouter's Elastic guide](https://openrouter.ai/docs/guides/features/broadcast/elastic), [Elastic: monitoring LLM inference with OpenRouter](https://www.elastic.co/search-labs/blog/llm-monitoring-openrouter-agent-builder).

## What it does

OpenRouter "Broadcast" sends one OpenTelemetry trace per model call to Elastic's OTLP endpoint (it adds `/v1/traces` itself). The call's model, tokens, cost and timing land in the data stream `traces-generic.otel-default`, with `service.name: openrouter`. It sends traces only, no logs or metrics. Every call made through `admin/tools/llm.mjs` (the router) then appears in Kibana beside the altitudes: these are the swarm's **A1 calls**, seen from the provider's side.

## What happened (19:3x UTC)

Dinis saved the destination ("Connection check passed", 100% sampling). **The endpoint must be Elastic's managed OTLP endpoint** (from the Cloud console). The deployment's APM endpoint (`.apm.`) accepts OTLP only as protobuf: it answered OpenRouter's JSON with 400 `failed to unmarshal request body: proto`. The Kibana endpoint (`.kb.`) answers 404.

## 1. The endpoint

1. In the **Elastic Cloud console**, open the deployment `my-observability-deployment` → **Manage**. Copy the **Managed OTLP endpoint** if the page lists one (Elastic 9.x hosted deployments show it under the application endpoints). Use it as it is, without `/v1/traces`.
2. If none is listed, use the **APM endpoint**. It answers at `/v1/traces` (checked 19:2x UTC):
   `https://my-observability-deployment-cd4ce8.apm.us-central1.gcp.cloud.es.io`

## 2. The key (least privilege: it can write traces and nothing else)

**If the endpoint is the managed OTLP one:** in Kibana, go to **Stack Management → Security → API keys → Create API key**:
- Name: `openrouter-traces`. Expiration: 14 days (renew after Web Summit).
- Turn on **Control security privileges** and paste:
  ```json
  { "openrouter_traces": { "cluster": ["monitor"],
      "indices": [ { "names": ["traces-*"], "privileges": ["auto_configure", "create_doc"] } ] } }
  ```
- Create, then copy the **Encoded** value. Kibana shows it only once.

**If the endpoint is the APM one:** use an **APM agent key** instead. Go to **Observability → Applications → Service inventory → Settings → Agent keys → Create APM agent key**, name it `openrouter-traces`, tick only the privilege to send events (`event:write`), and copy the key.

Make a separate key for OpenRouter, not the one for architect.1's exporter, so each producer can be revoked alone.

## 3. In OpenRouter

1. **Settings → Observability → Enable Broadcast → add destination "Elastic Observability (Beta)".**
2. Endpoint: the value from step 1. API key: the value from step 2 (OpenRouter sends it as `Authorization: ApiKey …`).
3. **Privacy Mode: off, by Dinis's decision (19:26 UTC: "actually I want to see the prompts").** Prompts and completions are kept in `traces-*`, read by drill-down only, never on a shared dashboard, with short retention. (The original advice was: It strips prompt and completion text and keeps tokens, cost, timing and model. Our rule is that model request and response text never goes to Elastic or git (CLAUDE.md; docs/elastic-guidance.md section 4). Without Privacy Mode, every prompt the swarm sends, including page text, would be stored in Elastic.)
4. **Test Connection**: the destination saves only if it passes. A 401 means the key was rejected (check it is the encoded value and can write traces).

## 4. Check it

Make one call through the router (`node admin/tools/llm.mjs ...`). Then, in Kibana:
- **Discover**, data view `traces-*`, query `service.name : "openrouter"`; widen the time picker if needed;
- or **Applications → Service inventory → openrouter**.

elastic.1 then adds a `traces-*` data view and an "A1 calls, from OpenRouter" section to "The altitudes of execution, live", joined with `fringe-altitudes` on model and time.

## Elastic or Grafana: the main store for traces (a proposal to grafana.1.fringe@ and the lead)

- **Main store: Elastic.** That's where the rest of the swarm's data is: altitudes, flows (`swarm-flows`, which already carries `trace_id`, `span_id` and `parent_span_id`), the hook logs, the reviews and the three sites. Traces here can be joined with them by ES|QL, and APM gives the service map and distributed traces across environments.
- **Grafana:** reads the same data through its Elasticsearch data source, for the views Grafana does best, without a second copy. If Grafana Cloud's own trace store (Tempo) is wanted too, send to both from one OpenTelemetry Collector rather than from each producer, so producers keep one endpoint.
- **Decided by:** Dinis. Until then, nothing is sent twice.
