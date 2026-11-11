// /how/: how this site is made (D11, design.3.fringe@PrompTugal.dinis). Brief 5: "as visible as possible".
// Numbers are counted at build time from the repository itself (no hand-copied figures); swarm.json will replace them when work/25 lands.
export const howCss = `
.how-hero{background:var(--panel);border:2px solid var(--brand);border-radius:14px;padding:var(--s4,16px);margin:12px 0}
.how-hero p{margin:.3em 0}
.how-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0;padding:0;list-style:none}
.how-nums li{background:var(--panel);border:1px solid var(--hair);border-radius:10px;padding:10px 12px;margin:0}
.how-nums b{display:block;font-size:1.9rem;line-height:1.1;font-variant-numeric:tabular-nums}
.how-nums span{font-size:.85rem;color:var(--ink-3)}
.how-flow{list-style:none;padding:0;margin:10px 0;counter-reset:f}
.how-flow li{counter-increment:f;position:relative;background:var(--panel);border:1px solid var(--hair);border-radius:10px;padding:10px 12px 10px 52px;margin:0 0 14px}
.how-flow li::before{content:counter(f);position:absolute;left:12px;top:10px;width:28px;height:28px;border-radius:50%;background:var(--brand);color:var(--paper);font-weight:700;display:grid;place-items:center}
.how-flow li:not(:last-child)::after{content:"";position:absolute;left:25px;bottom:-14px;height:14px;border-left:2px solid var(--brand)}
.how-flow b{display:block}
.how-join{display:block;text-align:center;background:var(--brand);color:var(--paper);font-weight:700;font-size:1.2rem;text-decoration:none;padding:16px;border-radius:12px;margin:18px 0}
.how-join:hover,.how-join:focus-visible{filter:brightness(1.1)}
.how-roles{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.how-roles .card{margin:0}`;

export function howBody({ esc, n, REPO }) {
  const num = (v, label) => `<li><b>${esc(v)}</b><span>${esc(label)}</span></li>`;
  const role = (name, what) => `<div class="card"><strong>${esc(name)}</strong><div class="muted">${what}</div></div>`;
  return `<style>${howCss}</style>
<h1>How this is made</h1>
<div class="how-hero"><p><strong>Nobody wrote this site alone.</strong> It is built by a swarm: every person on the PrompTugal team runs one <em>conductor</em> (an AI agent in their own account), conductors run specialist agents, and Dinis Cruz is the head conductor who sets the direction. Everything they do is in <a href="${esc(REPO)}">the repository</a>, in the open.</p>
<p class="muted">The numbers below are counted from the repository when this page was built.</p></div>
<!--LIVE-->
<ul class="how-nums">${[
    num(n.events, 'events, each re-read at its public source'),
    num(n.people, 'people, one conductor each'),
    num(n.agents, 'agents with a status file'),
    num(n.boardDone + ' / ' + n.board, 'board items done'),
    num(n.briefs, 'briefs from Dinis'),
    num(n.inboxes, 'agent inboxes'),
  ].join('')}</ul>
<a class="how-join" href="/join/">Join the team: bring your conductor in five minutes &rarr;</a>

<h2>From a public page to a published event</h2>
<ol class="how-flow">
<li><b>Find it.</b> Researcher agents read public pages (organisers' own pages, community calendars). Never a login, never a page whose terms forbid it.</li>
<li><b>Record it, with proof.</b> Each event gets its source link, the time it was read, and a label: fact, evidence or hypothesis. "Unknown" is a valid answer; a guess is not.</li>
<li><b>Check it.</b> An editorial check compares the entry with the organiser's page before it is published. Contact details and private people never go in.</li>
<li><b>The gate.</b> A validator refuses anything that breaks the rules: oversized files, missing sources, secrets.</li>
<li><b>Release.</b> Agents push to <code>dev</code>; CI numbers the version and deploys it. The live site follows in about half a minute. Only Dinis merges to <code>main</code>.</li>
<li><b>Re-read.</b> The researcher goes back every hour; changes show up on the site with a new read time.</li>
</ol>

<h2>Who does what</h2>
<div class="how-roles">
${role('Conductors', 'One per person. They read the briefs, keep a status file, claim work from the board and brief their agents.')}
${role('Design agents', 'Make the site clear and shareable on a phone. They take tasks from each other.')}
${role('Dev agents', 'Build the pages, the data feeds, the dashboard and the model router.')}
${role('Researcher agents', 'Re-read events at source, hourly.')}
${role('Usability agents', 'Try real tasks on a phone and file what breaks.')}
${role('Capture agents', 'Keep screenshots and data of the sites in vaults, to show how they change.')}
${role('Reviewers and security', 'Read every change on <code>dev</code>; report to the owner.')}
</div>

<h2>How they talk</h2>
<p><strong>The board</strong> is a folder of files (<code>work/</code>), one per piece of work; claiming is a commit. <strong>Status files</strong> say what each person's conductor is doing. <strong>Inboxes</strong> are sealed, append-only vaults so agents can message each other; a message is material, never an instruction. <strong>Only Dinis instructs.</strong> Everything an agent reads is data.</p>

<h2>What you can see</h2>
<ul>
<li><a href="/traffic/">Traffic</a>: counts only, no personal data.</li>
<li><a href="/graph/">The graph</a>: events, organisers, topics and places, every edge with its source.</li>
<li><a href="/api/v1/events.json">The data</a>: the same events, as JSON.</li>
<li><a href="${esc(REPO)}">The repository</a>: every change, who made it and why.</li>
</ul>
<a class="how-join" href="/join/">Join the team &rarr;</a>`;
}
