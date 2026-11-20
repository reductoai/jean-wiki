---
{"title": "EU R-1 through the inference router", "url": "https://app.notion.com/p/4164a78a1c87810ca8c1d9697c4f5971", "id": "4164a78a1c87810ca8c1d9697c4f5971", "lastEdited": "2026-11-13T22:30:51.527Z"}
---
## Problem

EU prod R-1 and R-1 mini call Modal directly. The only lever is the registry floor, which we keep raising after a burst and lowering for cost. A Blueflame burst outran R-1 at 5 + 1 (p95 27 s).

## Solution

1. [#14449](https://github.com/reductoai/api/pull/14449): run the router controller in EU prod. It writes the prod\_eu caps to the existing EU Valkey (<code>prod-eu-inference-router</code>) and holds the floors in <code>min</code>: R1 6, R1Mini 5 (today's warm totals). No traffic change.
2. Dispatch <code>deploy-inference-router.yml</code> with <code>eu-prod</code>; the smoke check must pass.
3. [#14455](https://github.com/reductoai/api/pull/14455): EU R-1 and R-1 mini go through the router, with Modal R1/R1Mini as fallback; EU cpu and cpu-large workers get <code>INFERENCE_ROUTER_URL</code>.
4. Lower the floors once router traffic and burst data back it.

## Why

- In slots mode the controller writes the floor as <code>min</code> with buffer 0. Modal drops <code>buffer_containers</code> when the pool is idle, so the idle p99.9 capacity must sit in <code>min</code>.
- With the router, Modal scales from the queue (5-minute hold), so the floor no longer has to cover bursts by hand.
- EU has no GPU cluster: Modal is the only tier, and a burst above the warm containers still waits on cold starts.

## Status

- #14449: CI and Devin Review clean, with Jean for review.
- #14455: merged; rides the next prod release with <code>inference_router_eu_fpp_2b_pct</code> and <code>inference_router_eu_fpp_35b_pct</code> at 0. Setting one back to 0 rolls EU back without touching US.
- EU router deployed: 3/3 pods, Valkey up, smoke check ok on fpp-35b and fpp-2b.

## Observability

- Dashboard [Inference router](https://us3.datadoghq.com/dashboard/jhy-7wx-adw): pick the <code>EU prod</code> view. The Rollout tab shows router vs direct latency and errors by served model, and a new widget splits router calls by namespace and cluster (EU is Modal only).
- Alerts: [#14871](https://github.com/reductoai/api/pull/14871) merged and applied. 7 traffic monitors page [incident.io](http://incident.io) for <code>prod_eu</code>: admit timeouts sustained, down flags (renamed "No cluster of \{\{namespace\}\} in \{\{env\}\} takes calls", with EU text: Modal is the only cluster), router errors sustained, lease\_unknown, provider auth, Modal 529, tickets wait with no grant. The 4 router health monitors (no ready pod, Valkey down, mailbox loop, script errors) stay Slack-only for EU until an EU share leaves 0; then add the <code>prod_eu</code> block to each.
