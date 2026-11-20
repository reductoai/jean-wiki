# Lower priority calls to the cluster

Problem. We pay for Modal dev and staging inference while production GPUs sit partly idle by day: decode pools averaged 11% to 36% GPU busy time from 09:00 to 18:00 PT over the measured week. Some evaluation calls could use models already on the clusters, but…

{{dashboard:lower-priority-calls}}

## Design: one priority for every call

Every call gets a priority, a class plus an org weight, and the router serves calls in priority order.

<figure class="diagram">
<svg viewBox="0 0 720 330" role="img" aria-label="Call classes from interactive to sheddable, and org weight" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="13">
  <defs><marker id="cpArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#5b6b8c"/></marker></defs>
  <text x="20" y="22" font-weight="600" fill="#34845f">Never dropped</text>
  <line x1="44" y1="40" x2="44" y2="196" stroke="#5b6b8c" stroke-width="1.5" marker-start="url(#cpArrow)" marker-end="url(#cpArrow)"/>
  <g>
    <rect x="70" y="36" width="250" height="34" rx="6" fill="#e6efea" stroke="#34845f"/><text x="84" y="58" font-weight="600">Interactive</text><text x="306" y="58" text-anchor="end" fill="#5b6b8c">target 5 s</text>
    <rect x="70" y="76" width="250" height="34" rx="6" fill="#e6efea" stroke="#34845f"/><text x="84" y="98" font-weight="600">Standard</text><text x="306" y="98" text-anchor="end" fill="#5b6b8c">20 s</text>
    <rect x="70" y="116" width="250" height="34" rx="6" fill="#f6efdf" stroke="#dba943"/><text x="84" y="138" font-weight="600">Batch</text><text x="306" y="138" text-anchor="end" fill="#5b6b8c">12 h</text>
    <rect x="70" y="156" width="250" height="34" rx="6" fill="#f6efdf" stroke="#dba943"/><text x="84" y="178" font-weight="600">Bulk</text><text x="306" y="178" text-anchor="end" fill="#5b6b8c">3 d</text>
  </g>
  <line x1="20" y1="212" x2="340" y2="212" stroke="#b5543c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="20" y="236" font-weight="600" fill="#b5543c">Sheddable</text>
  <rect x="70" y="248" width="250" height="34" rx="6" fill="#f6ebe8" stroke="#b5543c"/><text x="84" y="270" font-weight="600">Staging, autoeval, shadows</text>
  <text x="70" y="304" font-size="11" fill="#5b6b8c">spare cluster slots only; dev Modal at its deadline</text>
  <text x="400" y="22" font-weight="600" fill="#5b6b8c">Inside a class: share by org weight</text>
  <g font-size="12">
    <text x="400" y="58">Enterprise tier, weight 4</text><rect x="560" y="46" width="140" height="16" rx="3" fill="#34845f"/>
    <text x="400" y="88">Growth tier, weight 2</text><rect x="560" y="76" width="70" height="16" rx="3" fill="#34845f" opacity=".7"/>
    <text x="400" y="118">Standard tier, weight 1</text><rect x="560" y="106" width="35" height="16" rx="3" fill="#34845f" opacity=".5"/>
    <text x="400" y="148">Trial tier, weight 1</text><rect x="560" y="136" width="35" height="16" rx="3" fill="#34845f" opacity=".5"/>
  </g>
  <text x="400" y="182" font-size="11" fill="#5b6b8c">Slots each org gets while all of them wait.</text>
  <text x="400" y="198" font-size="11" fill="#5b6b8c">An org with nothing waiting gives its share away.</text>
  <rect x="400" y="226" width="300" height="56" rx="6" fill="#eceef3"/>
  <text x="414" y="248" font-size="12">An org can also move between classes:</text>
  <text x="414" y="268" font-size="12" fill="#5b6b8c">e.g. an enterprise batch job runs as Standard.</text>
</svg>
<figcaption class="diagram-caption">Targets are examples and will change. The order is the core, and it can differ by org.</figcaption>
</figure>

<figure class="diagram">
<svg viewBox="0 0 720 210" role="img" aria-label="Worker resolves class and weight, router orders by due time, slots take the first call" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="13">
  <defs><marker id="cpA2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#5b6b8c"/></marker></defs>
  <rect x="10" y="40" width="190" height="120" rx="8" fill="#eceef3" stroke="#5b6b8c"/>
  <text x="24" y="64" font-weight="600">Worker</text>
  <text x="24" y="88" font-size="12">class: endpoint, async, lane</text>
  <text x="24" y="108" font-size="12">weight: org tier</text>
  <text x="24" y="128" font-size="12">+ per-org override row</text>
  <text x="24" y="148" font-size="11" fill="#5b6b8c">router keeps no org list</text>
  <line x1="200" y1="100" x2="250" y2="100" stroke="#5b6b8c" stroke-width="1.5" marker-end="url(#cpA2)"/>
  <text x="206" y="92" font-size="11" fill="#5b6b8c">/admit</text>
  <rect x="252" y="20" width="270" height="170" rx="8" fill="#ffffff" stroke="#5b6b8c"/>
  <text x="266" y="44" font-weight="600">Router queue, by due time</text>
  <rect x="266" y="56" width="242" height="26" rx="4" fill="#e6efea"/><text x="276" y="74" font-size="12">Interactive, org B, due in 3 s</text>
  <rect x="266" y="86" width="242" height="26" rx="4" fill="#e6efea"/><text x="276" y="104" font-size="12">Standard, org A, due in 4 s</text>
  <rect x="266" y="116" width="242" height="26" rx="4" fill="#f6efdf"/><text x="276" y="134" font-size="12">Batch, org A, due in 11 h</text>
  <rect x="266" y="152" width="242" height="26" rx="4" fill="#f6ebe8"/><text x="276" y="170" font-size="12">Sheddable: only if nothing above waits</text>
  <line x1="266" y1="147" x2="508" y2="147" stroke="#b5543c" stroke-dasharray="5 3"/>
  <line x1="522" y1="69" x2="572" y2="69" stroke="#5b6b8c" stroke-width="1.5" marker-end="url(#cpA2)"/>
  <rect x="574" y="40" width="136" height="60" rx="8" fill="#e6efea" stroke="#34845f"/>
  <text x="588" y="64" font-weight="600">Cluster slots</text><text x="588" y="84" font-size="12">first in line</text>
  <rect x="574" y="116" width="136" height="66" rx="8" fill="#f6efdf" stroke="#dba943"/>
  <text x="588" y="140" font-weight="600">Modal</text><text x="588" y="158" font-size="12">Interactive, Standard;</text><text x="588" y="172" font-size="12">others near due time</text>
</svg>
<figcaption class="diagram-caption">A Standard call near its due time goes before a fresh Interactive call, so no class waits forever.</figcaption>
</figure>

**Problem.** The router serves each namespace's calls in arrival order, plus an on/off `low` flag ([#15178](https://github.com/reductoai/api/pull/15178)). It cannot tell a 1-page interactive call from a 3-day bulk job, or an enterprise org from a trial org. So one org's burst makes everyone wait, and internal work is refused or competes with customers.

**Solution.** On `/admit`, the worker sends each call's class and weight:

- **Class:** how fast the call must finish. Calls above the line are never dropped. Sheddable calls below it run only on spare cluster slots.
- **Weight:** the org's share when calls of one class wait together, set by its tier or a per-org override row.

**How the router orders calls.** Each waiting call gets a due time: arrival plus its class target. The router serves the earliest due time first. It spaces one org's calls by a gap divided by the org's weight, so a burst spreads out and a quiet org slips in ahead. Sheddable calls go only when nothing above the line waits.

**Why it fits.** It reuses what exists. The queue stays one sorted set; only the score changes, from arrival time to due time. Org tiers and the override table (`org_concurrency_override`, synced to Redis) already drive throttling, and streaq already tags batch lanes. Changing an org's priority is a row edit, not a deploy. Defaults (one class, weight 1, gap 0) keep today's behavior.

**Guards**

- No org starves: weights run 1 to 8, never 0.
- Only Interactive and Standard calls count toward the Modal target. Batch and Bulk calls wait for cluster slots: the worker retries them later, as streaq batch lanes do, and uses Modal only near the due time.
- Sheddable is the `low` flag as merged: spare cluster slots under the controller's limit, never prod Modal, dev Modal at the workload's deadline.
- Kill switch, per namespace: set the gap to 0 and every class to Standard.

**Steps**

1. The worker sends class, org and weight on `/admit`; the router reads them and changes nothing.
2. The router orders calls by due time with per-org weighted spacing, off by default.
3. Turn it on in staging, then prod: Maverick first, then the FPP namespaces, all regions at once.
4. Set the tier-to-weight and class maps; lift single orgs with override rows.
5. Fold the `low` flag (step 2 of the page plan) in as the Sheddable class.

**How we know it works:** p99 admit wait per class and tier, missed targets per class, Modal share, and Sheddable work done, before vs after.

<details>
<summary>Open questions and sources</summary>

- Class targets: 5 s, 20 s, 12 h and 3 d are whiteboard examples.
- Class source: endpoint and sync vs async to start, or a customer-facing priority field too?
- Tier weights: start enterprise 4, growth 2, standard and trial 1?
- Sources: the per-org fair admission research in Notion, and [#15178](https://github.com/reductoai/api/pull/15178).

</details>

Full notes and logs: [lower priority calls in Notion](https://app.notion.com/p/41b4a78a1c878080b5c2c23c0a1e7661)
