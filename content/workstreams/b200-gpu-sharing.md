# B200 GPU sharing

Plan for Jean's stamp: guarantee each B200 model's minimum, share the rest. One PR reworking #15259, all regions. Nothing changes until you stamp it.

{{dashboard:b200-gpu-sharing}}

## Details

<details>
<summary>Overview</summary>

Plan for Jean's stamp: guarantee each B200 model's minimum, share the rest. One PR reworking [#15259](https://github.com/reductoai/api/pull/15259), all regions. Nothing changes until you stamp it.

1. Guarantee: split each model into a baseline pool at its minimum (high priority, can preempt) and a burst pool at lower priority, as fpp-2b already works. Maverick's weekday floor becomes a scheduled baseline: +3 from 04:00 to 19:00 PT on weekdays.
2. Share: drop #15259's 19/8/5 caps so each burst pool can grow to its minimum plus the shared GPUs. Burst pods compete equally; only baseline pods take GPUs back.
3. Numbers (fpp-35b / maverick / fpp-2b guaranteed, then shared): use1 and uss1 16/4/3 off-peak (9 shared), 16/7/3 weekdays (6 shared); usw3 25/4/3 (0 shared, unchanged).
4. Why not just uncap: today's chart protects only 23 GPUs, which misses maverick's weekday +3. Tuesday's 9:28 pm PT Pending was maverick burst losing to fpp-35b burst, not a floor breach.
5. Risks: preempting a burst pod drops its in-flight requests, and the replacement cold-starts. Burst pods can still sit Pending when every model bursts at once. The new baseline worker changes the DGD graph, so cutover goes one model at a time, as the fpp-2b migration did.
6. Before rollout: test that floors recover at saturation and at the weekday switch.

Workstream: <a href="https://app.notion.com/p/41b4a78a1c87810f8533dda3777fba9f">GPU cluster observability and utilization</a>

</details>

<details>
<summary>Impact</summary>

Before: B200 clusters, days ending 16:00 PT, Datadog US3 + Modal billing. After: rollout snapshot below; the two-hour fleet fpp-35b Modal share was 2.32% (19,306 of 831,800 successful router responses) at 2026-11-19 09:02 PT, versus 4.42% before this rollout and the 21% baseline. Longer-window impact metrics remain pending; measured from Nov 19 once the promote ([#15259](https://github.com/reductoai/api/pull/15259) + [#15322](https://github.com/reductoai/api/pull/15322), after 19:00 PT Nov 18) lands, then over a weekday and a weekend.

- <b>Pending GPU pods, use1/uss1:</b> 7 → 24 at 17:28 PT, Nov 18 (Mary). After: 3 on use1 (2 fpp-2b burst, 1 Maverick burst), 0 on uss1 and usw3 at 2026-11-19 09:02 PT, after [Flux run 44553386110](https://github.com/reductoai/api/actions/runs/44553386110) succeeded. No Pending Triton series for usw1 in Datadog; live pod count not verified.
- <b>Utilization (avg DCGM), Nov 16 / 17 / 18:</b> use1 17/22/26%, uss1 17/22/27%, usw3 22/26/28%. After: pending.
- <b>p99 per call, Nov 18:</b> FPP-35B 3.5 s, FPP-2B 5.0 s. After: pending.
- <b>Fallbacks to Modal, Nov 17 / 18:</b> FPP-2B 219K / 6.94M, FPP-35B 22K / 34K. After: pending.
- <b>Modal fpp-flash spend, Nov 16 / 17 / 18:</b> \$0.8K / \$1.4K / \$6.3K. After: pending.
- <b>GPU cost per 1k pages, Nov 17 / 18:</b> B200 fleet (\$16.3K/day at \$7.09/GPU-h) \$1.00 / \$0.73; all-in with Modal and H200 \$1.87 / \$1.56. After: pending.

</details>

