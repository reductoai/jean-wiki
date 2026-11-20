# GPU cluster observability and utilization

Next PRs, in order; none started.

<div class="ws-head">
<div class="ws-stat"><b>3</b><span>steps left</span></div>
<div class="ws-stat"><b>14</b><span>PRs merged</span></div>
<div class="ws-stat"><b>9</b><span>PRs open</span></div>
<div class="ws-stat"><b>6</b><span>impact measures</span></div>
</div>

## Next steps

<ol class="steps"><li class="now">vLLM 0.34 + FlashInfer 0.7.3: benchmark on one B200.</li><li>B200 node pools: upgrade 1.35.5 → 1.35.8 on use1, uss1, usw1 together.</li><li>usw3: review static ScaledObjects and node-local cache.</li></ol>

## Impact

<div class="impact-grid"><div class="impact-card"><div class="ic-label">usw1 qwen RF-DETR at 5 seats vs 6, 24 h</div><div class="ic-value">p99 <b>1.33 s</b>, under the <b>1.5 s</b> line in all <b>8</b> windows; same throughput as <b>6</b> seats; Modal share <b>26%</b> vs <b>15%</b> with demand +<b>10%</b>. Measured on usw1, <b>24</b> h to 2026-11-19 <b>11</b>:<b>47</b> PT.</div></div><div class="impact-card"><div class="ic-label">GPU cost per 1k pages</div><div class="ic-value"><b>$1.56 </b>(Nov <b>18</b>), <b>$1.87 </b>(Nov <b>17</b>), <b>$2.24 </b>(Nov <b>16</b>); <b>$5.73</b>–<b>$6.96</b> on the weekend.</div></div><div class="impact-card"><div class="ic-label">Modal prod spend</div><div class="ic-value"><b>$13.4K</b>, <b>$8.4K</b>, <b>$7.3K</b>, <b>$11.6K</b>, <b>$13.0K</b>, <b>$17.7K</b> per day (Nov <b>13 </b>→ <b>18</b>).</div></div><div class="impact-card"><div class="ic-label">GPU utilization (avg DCGM), Nov 18</div><div class="ic-value">use1 <b>26%</b>, uss1 <b>27%</b>, usw3 <b>28%</b>, usw1 <b>23%</b>; <b>5</b>–<b>11%</b> on the weekend.</div></div><div class="impact-card"><div class="ic-label">p99 per model call, Nov 18</div><div class="ic-value">FPP-35B <b>3.5 s</b> (<b>9.0 s</b> on Nov <b>13</b>), FPP-2B <b>5.0 s</b>.</div></div><div class="impact-card"><div class="ic-label">Fallbacks, Nov 18</div><div class="ic-value">FPP-2B <b>6.94M</b> (<b>30K</b>–<b>220K</b>/day before), FPP-35B <b>34K</b>, Triton router live fallbacks <b>81K</b> (<b>1.29M</b> on Nov <b>13</b>).</div></div></div>

## PRs

<div class="pr-grid"><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15158"><b>#15158</b><span>merged</span><em>#15158 ✅ + Deploy — one main SHA across all Flux rollout cluster jobs.</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15153"><b>#15153</b><span>merged</span><em>#15153 ✅ — EFA device plugin opt-in, off on prod-gpu-usw1.</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15151"><b>#15151</b><span>merged</span><em>#15151 ✅ — cleanupOnFail false on all GPU clusters.</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15156"><b>#15156</b><span>open</span><em>#15156 🟡 — rollout-freeze-reaper retries Kubernetes API calls on HTTP 429.</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15259"><b>#15259</b><span>merged</span><em>#15259 ✅ — B200 sharing: guarantee each model's minimum, share the rest (use1/uss1:…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15374"><b>#15374</b><span>merged</span><em>#15374 ✅ — snapshot checkpoint completion grace 30m → 60m on use1, uss1, usw3. Opened…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15380"><b>#15380</b><span>merged</span><em>#15380 ✅ — Flux rollback never restores the pin it replaced; GKE wait is a wait_minutes…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15398"><b>#15398</b><span>merged</span><em>#15398 ✅ — a burst graph can restore from its baseline graph's checkpoint…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15409"><b>#15409</b><span>merged</span><em>Trial: #15409 ✅ + Deploy — reuse on for fpp-35b on uss1 only. Opened 2026-11-19 07:38 PT;…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15415"><b>#15415</b><span>merged</span><em>#15415 ✅ + Deploy failed on uss1 — turn off Dynamo NATS on all GPU clusters…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15453"><b>#15453</b><span>open</span><em>Rollout 2026-11-19 13:24 PT: usw1 ok. On uss1 the gate restored 6349ee after an…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15150"><b>#15150</b><span>open</span><em>#15150 🟡 — ship snapshot and flux-system logs on GPU clusters.</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15149"><b>#15149</b><span>merged</span><em>#15149 ✅ — pod restarts and CrashLoopBackOff.</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15152"><b>#15152</b><span>merged</span><em>#15152 ✅ — checkpoint-prune job failures.</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15154"><b>#15154</b><span>open</span><em>#15154 🟡 — Modal cold-start regression (snapshot restore vs plain).</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15155"><b>#15155</b><span>open</span><em>#15155 🟡 — DGD readiness and Triton ready pods.</em></a></div>

## Details

<details>
<summary>Plan</summary>

Next PRs, in order; none started.

- <b>vLLM 0.34 + FlashInfer 0.7.3:</b> benchmark on one B200.
- <b>B200 node pools:</b> upgrade 1.35.5 → 1.35.8 on use1, uss1, usw1 together.
  - Terraform; Jean applies.
- <b>usw3:</b> review static ScaledObjects and node-local cache.

</details>

<details>
<summary>Logs</summary>

✅ = merged. 🟡 = open, waiting on Jean's review.

- <b>Rollouts and config</b>
  - [#15158](https://github.com/reductoai/api/pull/15158) ✅ + Deploy — one main SHA across all Flux rollout cluster jobs.
  - [#15153](https://github.com/reductoai/api/pull/15153) ✅ — EFA device plugin opt-in, off on prod-gpu-usw1.
    - Terraform apply pending (Jean).
  - [#15151](https://github.com/reductoai/api/pull/15151) ✅ — cleanupOnFail false on all GPU clusters.
    - Deploys with the next Flux promote.
  - [#15156](https://github.com/reductoai/api/pull/15156) 🟡 — rollout-freeze-reaper retries Kubernetes API calls on HTTP 429.
  - [#15259](https://github.com/reductoai/api/pull/15259) ✅ — B200 sharing: guarantee each model's minimum, share the rest (use1/uss1: 16/4/3 + 9 shared off-peak, 16/7/3 + 6 weekdays; usw3 unchanged). Floor-priority baseline graphs + shared -burst graphs. CI green.
    - Stamped plan: <a href="https://app.notion.com/p/41c4a78a1c878179a3f4d03746e1ad63">B200 GPU sharing: guarantee each model's minimum, share the rest</a>
  - [#15374](https://github.com/reductoai/api/pull/15374) ✅ — snapshot checkpoint completion grace 30m → 60m on use1, uss1, usw3. Opened 2026-11-18 21:36 PT; CI green, Codex and Devin Review clean.
    - fpp-35b Filestore writes took 30m35s and 40m37s on uss1, failing the Nov 18 promote at the canary.
    - Merged 2026-11-19 01:20 PT; deploys with the next Flux promote.
  - [#15380](https://github.com/reductoai/api/pull/15380) ✅ — Flux rollback never restores the pin it replaced; GKE wait is a <code>wait_minutes</code> input (default 90, max 300). Opened 2026-11-18 23:25 PT, merged 2026-11-19 02:46 PT.
    - Workflow change, live on merge; no cluster deploy needed.
    - The Nov 18 uss1 rollback to 3117ac9 timed out at 90m and its failure handler re-pinned fbb93d4 ([run](https://github.com/reductoai/api/actions/runs/44460762567)).
  - [#15398](https://github.com/reductoai/api/pull/15398) ✅ — a burst graph can restore from its baseline graph's checkpoint (<code>worker.checkpoint.burstReuse</code>, off by default), so a model is captured once. Opened 2026-11-19 03:17 PT, merged 2026-11-19 07:35 PT.
    - No deploy needed: manifests are unchanged until a cluster sets the value.
    - Trial: [#15409](https://github.com/reductoai/api/pull/15409) ✅ + Deploy — reuse on for fpp-35b on uss1 only. Opened 2026-11-19 07:38 PT; CI green.
      - Deployed with the 6349ee1 promote ([run](https://github.com/reductoai/api/actions/runs/44591277834)), all four clusters, 2026-11-19 10:56 PT.
      - Result on uss1: burst pods restore from the baseline's checkpoint in 1.6 to 1.7 min (cold 4.7 to 6.2 min; the burst graph's own capture took 19 min and is gone).
      - Router traffic sent to Modal for fpp-35b: 0.7 to 0.8% after, 2.4 to 3.4% before (20 min window, not proven to be the trial).
  - [#15415](https://github.com/reductoai/api/pull/15415) ✅ + Deploy failed on uss1 — turn off Dynamo NATS on all GPU clusters (<code>global.nats.install: false</code>). Stamped by Jean. Opened 2026-11-19 08:50 PT.
    - NATS carries no traffic (TCP requests, ZMQ events), but new pods fail to start without it.
    - Merge after today's promote and the uss1 reuse trial: every frontend and worker rolls once, and checkpoints are recaptured.
    - Rollout 2026-11-19 13:24 PT: usw1 ok. On uss1 the gate restored 6349ee after an old-template burst worker (still with NATS\_SERVER) hit CrashLoopBackOff. use1 and usw3 not touched. Two-step follow-up [#15453](https://github.com/reductoai/api/pull/15453) 🟡, stamped by Jean: step 1 stops injecting NATS\_SERVER and keeps NATS up; step 2 removes NATS once every pod has rolled. Merge with a merge commit and roll one commit at a time.
- <b>Logs to Datadog</b>
  - [#15150](https://github.com/reductoai/api/pull/15150) 🟡 — ship snapshot and flux-system logs on GPU clusters.
- <b>Monitors</b>
  - [#15149](https://github.com/reductoai/api/pull/15149) ✅ — pod restarts and CrashLoopBackOff.
    - Datadog Terraform apply pending (Jean).
  - [#15152](https://github.com/reductoai/api/pull/15152) ✅ — checkpoint-prune job failures.
    - Datadog Terraform apply pending (Jean).
  - [#15154](https://github.com/reductoai/api/pull/15154) 🟡 — Modal cold-start regression (snapshot restore vs plain).
  - [#15155](https://github.com/reductoai/api/pull/15155) 🟡 — DGD readiness and Triton ready pods.
    - Needs cluster-observability applied first.
  - [#15160](https://github.com/reductoai/api/pull/15160) 🟡 — Flux drift on prod GPU clusters.
  - [#15166](https://github.com/reductoai/api/pull/15166) 🟡 — stuck model downloads and slow model loads.
    - Simplified: direct pre-commit copy and inlined pod identity; 41 lines removed. 115 targeted tests and all 35 CI checks pass; fresh review has no findings. Not merged or deployed. [Written by Devin](https://app.devin.ai/sessions/6b9e528e051548f2bb9e9e6829b51bb3)
  - [#15161](https://github.com/reductoai/api/pull/15161) ✅ — fix stuck and stale GPU monitors.
    - Datadog Terraform apply pending (Jean).
    - Delete MLE p95 monitors 25548843 and 25548845 in Datadog (Jean).
  - [#15168](https://github.com/reductoai/api/pull/15168) 🟡 — tag FPP shadow replay and autoeval judge calls so they leave the prod failed-calls alert.
  - [#15304](https://github.com/reductoai/api/pull/15304) ✅ — terminal-throughput monitor 27401592 imported to Terraform with a 20-job volume floor (stops prod\_au low-traffic false alerts).
    - Datadog Terraform apply pending (Jean).
- <b>Daily release scan</b> — 2026-11-18 07:54 PT
  - Done, read-only: Triton 26.11 / 2.75 ships [core #533](https://github.com/triton-inference-server/core/pull/533), a dynamic-batcher use-after-free fix whose vulnerable sequence exists in our 26.05 / 2.69 source. Proposed for Xavier: evaluate a core-only backport on one offline H200; no full CUDA/TensorRT upgrade and no demonstrated production incident.
  - Confirmed observability gap: a live FPP-2B worker exports three aggregate speculative-decoding counters that the chart blocks; Datadog US3 has no acceptance metrics or monitors. Proposed: collect those three counters, baseline 24 hours, then add a load-gated acceptance-regression warning.
  - Yesterday's vLLM/FlashInfer trial was not repeated. Both new proposals await approval; no PRs, image builds, benchmarks, monitor changes, or rollouts.
- <b>Triton router fallbacks</b> — 2026-11-18 17:29 PT
  - [#15355](https://github.com/reductoai/api/pull/15355) ✅ — tag reducto.triton\_[flash.live](http://flash.live)\_fallbacks with the error behind each router fallback (RouterUnavailable reason or exception type). CI green; Devin Review and Codex clean.
    - Router and usw1 logs don't show why table\_ensemble falls back (\~21% of calls vs 0.02% for ordering\_model); the tag confirms the cause.
    - Split-pool deadline fix dropped 2026-11-19 01:38 PT (Xavier): the table\_ensemble spike was the live\_fallbacks cumulative counter bug, fixed in [#15392](https://github.com/reductoai/api/pull/15392).

[Written by Devin](https://app.devin.ai/sessions/d3cac10495e344d4852c3c1d7abab943)

</details>

<details>
<summary>Impact</summary>

Baseline, measured 2026-11-18 19:00 PT. Each day ends 16:00 PT; Nov 14–15 is the weekend dip. Datadog US3 + Modal billing.

- usw1 qwen RF-DETR at 5 seats vs 6, 24 h: p99 1.33 s, under the 1.5 s line in all 8 windows; same throughput as 6 seats; Modal share 26% vs 15% with demand +10%. Measured on usw1, 24 h to 2026-11-19 11:47 PT.
- <b>GPU cost per 1k pages:</b> \$1.56 (Nov 18), \$1.87 (Nov 17), \$2.24 (Nov 16); \$5.73–\$6.96 on the weekend.
  - Self-hosted fleet \$17.4K/day (96 B200 × \$7.09/GPU-h + 8 H200 × \$5.72) + Modal prod, over prod pages (22.5M on Nov 18).
- <b>Modal prod spend:</b> \$13.4K, \$8.4K, \$7.3K, \$11.6K, \$13.0K, \$17.7K per day (Nov 13 → 18).
  - Nov 18 jump is fpp-flash \$6.3K (vs \$1.4K) during the FPP-2B fallback spike.
- <b>GPU utilization (avg DCGM), Nov 18:</b> use1 26%, uss1 27%, usw3 28%, usw1 23%; 5–11% on the weekend.
- <b>p99 per model call, Nov 18:</b> FPP-35B 3.5 s (9.0 s on Nov 13), FPP-2B 5.0 s.
- <b>Fallbacks, Nov 18:</b> FPP-2B 6.94M (30K–220K/day before), FPP-35B 34K, Triton router live fallbacks 81K (1.29M on Nov 13).
- <b>After:</b> updated as each PR's effect shows; B200 sharing after tonight's 19:00 PT promote.

</details>

