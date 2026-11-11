# OpenRouter traces to Grafana Cloud: the steps, and what the traces carry

> grafana.1.fringe@PrompTugal.dinis, 2026-11-11T19:15Z, work/51. Read at https://openrouter.ai/docs/guides/features/broadcast/grafana (verbatim) and https://openrouter.ai/docs/guides/features/broadcast (part summarised; check the Privacy and sampling parts in the dashboard), 2026-11-11T19:15Z.

## Our rule

No model request or response text is kept (CLAUDE.md; tips can carry private words). So: **Privacy Mode ON** for the Grafana destination, and OpenRouter's separate input/output logging toggle stays **off**.

## What the traces carry (facts, from the docs)

- **By default, the prompt and the completion text** ("The input messages and model output (with multimodal content stripped for efficiency)").
- **With Privacy Mode on for that destination** (verbatim): "prompt and completion content and provider error text are excluded from traces. All other trace data — token usage, costs, timing, model information, and custom metadata — is still sent normally."
- Always: service.name openrouter, gen_ai.request.model / response.model, input / output / total tokens, finish reason, cost, latency and router timing, model parameters (gen_ai.request.*), and user.id / session.id / trace.metadata.* **only if the caller sends them**. admin/tools/llm.mjs sends none of these today (read 2026-11-11T19:15Z), so nothing about a person goes in metadata.
- Options: a sampling rate per destination (1.0 = all) and an API-key include/exclude filter.

## The steps (Dinis; the token never goes into chat or git)

1. **grafana.com > My Account > your stack > OpenTelemetry (Configure)**. Copy:
   - the **OTLP endpoint**, like `https://otlp-gateway-prod-<region>.grafana.net` (the base, without `/otlp`; not the `*.grafana.net` dashboard URL);
   - the **Instance ID** (a number).
2. **grafana.com > My Account > Security > Access Policies > Create access policy**:
   - name `openrouter-traces`, realm: **this one stack only**;
   - scopes: **traces:write** only, nothing else;
   - **Add token**, name `openrouter`, with an expiry. It starts `glc_`. Copy it straight into step 3.
3. **openrouter.ai > Settings > Observability > Grafana Cloud**: Base URL (step 1), Instance ID (step 1), API Key (step 2). **Tick Privacy Mode.** Sampling 1.0. Test Connection, Save, then Enable Broadcast. Leave input/output logging off.
4. In Grafana: **Explore > Tempo**, query `{resource.service.name="openrouter"}`. Open one span and check that it has no prompt or completion text. Then I build the model-calls panels (calls, tokens, cost and latency by model) from these traces.

## Where it overlaps

elastic.1's fringe-models index already holds the router's ledger summaries (counts, cost) in Kibana. The Grafana traces add per-call latency and provider timing, which the ledger lacks. Neither holds any text.
