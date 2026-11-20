# Routed R-1 mini to prod

Redeploy the autoeval-replay cron from current main (Jean): git fetch origin && git checkout origin/main, then uv run rd modal deploy cron prod autoeval-replay. Starts the judged auto_route leg from PR 15021.

<div class="ws-head">
<div class="ws-stat"><b>2</b><span>steps left</span></div>
<div class="ws-stat"><b>0</b><span>PRs merged</span></div>
<div class="ws-stat"><b>6</b><span>PRs open</span></div>
<div class="ws-stat"><b>6</b><span>impact measures</span></div>
</div>

## Next steps

<ol class="steps"><li class="now">Redeploy the autoeval-replay cron from current main (Jean): git fetch origin &amp;&amp; git checkout origin/main, then uv run rd modal…</li><li>Read results: judge score per leg. Routed should beat R-1 mini alone.</li></ol>

## Impact

<div class="impact-grid"><div class="impact-card"><div class="ic-label">Shadow, threshold 0.58</div><div class="ic-value"><b>28%</b> of pages to R-1; judge <b>9.32</b> vs <b>9.12</b> for R-1 mini alone and <b>9.45</b> for R-1 alone. Measured in shadow on prod traffic.</div></div><div class="impact-card"><div class="ic-label">Nov 19 threshold curve, 597 judged pages</div><div class="ic-value">R-1 mini alone <b>9.32,</b> routed at threshold <b>0.58</b> <b>9.48</b> with <b>19%</b> of pages sent to R-1, R-1 alone <b>9.53.</b> Measured in shadow on prod traffic, 2026-11-19; refreshed daily. The routed…</div></div><div class="impact-card"><div class="ic-value">PR <b>1 </b>#<b>15367</b> gates, routed 128-seat variant vs today's pick (b200-n128), one B200 container, rep-1k: <b>30.45</b> vs <b>30.24</b> pages/s at <b>128</b> in flight; no failed request <b>1</b> to <b>512</b> in flight;…</div></div><div class="impact-card"><div class="ic-label">Stress test, routed build, one container on dev</div><div class="ic-value">no failed request up to <b>512</b> in flight; <b>19.8</b> pages/s at <b>64</b> in flight on a B200, <b>10.8</b> on a B300.</div></div><div class="impact-card"><div class="ic-label">Shadow reliability (#15221, warm dev classes)</div><div class="ic-value">before, a cold class lost every strict R-1 mini page of one submit (<b>204</b> attempts); after, <b>53</b> of <b>53</b> and <b>52</b> of <b>52</b> succeeded.</div></div><div class="impact-card"><div class="ic-label">GPU cost per 1k pages</div><div class="ic-value">estimate only, about <b>$0.10</b> routed at <b>28%</b> against <b>$0.08</b> for R-1 mini and <b>$0.13</b> for R-1 (registry tables, at saturation).</div></div></div>

## PRs

<div class="pr-grid"><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15021"><b>#15021</b><span>open</span><em>Redeploy the autoeval-replay cron from current main (Jean): git fetch origin &amp;&amp; git…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15259"><b>#15259</b><span>open</span><em>Problem: at a full cluster, burst workers refuse calls (529), which go straight to Modal:…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14939"><b>#14939</b><span>open</span><em>\[2026-11-16 11:45 PT\] In progress: PR 14939 adds settings.alpha.auto_route. R-1 mini's…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15324"><b>#15324</b><span>open</span><em>Left out of the curve: 103 pages from 2 of the 14 submits (05:45 and 07:45 PT). The…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15367"><b>#15367</b><span>open</span><em>PR 1 #15367 gates, routed 128-seat variant vs today's pick (b200-n128), one B200…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15221"><b>#15221</b><span>open</span><em>Shadow reliability (#15221, warm dev classes): before, a cold class lost every strict R-1…</em></a></div>

## Details

<details>
<summary>Overview</summary>

# Plan

1. <b>Redeploy the autoeval-replay cron from current </b><b><code>main</code></b> (Jean): <code>git fetch origin && git checkout origin/main</code>, then <code>uv run rd modal deploy cron prod autoeval-replay</code>. Starts the judged <code>auto_route</code> leg from [PR 15021](https://github.com/reductoai/api/pull/15021).
2. <b>Read results</b>: judge score per leg. Routed should beat R-1 mini alone.
   - Routed share is the mean of <code>auto_routed</code> on the routed rows.
   - Leave out rows with <code>auto_route_outcome=mini_failed</code>: <code>b200-route</code> has no warm floor, so a cold start can send a page to R-1 without the head.

</details>

<details>
<summary>Promote to prod</summary>

Plan for Jean's stamp: three PRs that turn on routing for <code>auto_route</code> pages in prod, with the route head at threshold 0.58. Requests without <code>auto_route</code> don't change.

Today an <code>auto_route</code> page calls the Modal R-1 mini class directly. That class has no route head (the classifier that sends each page to R-1 mini or R-1), so nothing gets routed.

#### Jean's calls

1. <b>Scope.</b> Default: opt-in <code>auto_route</code> jobs only. Alternative: all R-1 mini traffic, which needs the fpp-35b guarantee resized first.
2. <b>Route head.</b> Default: ship the current one now, swap in the retrained one after tomorrow's new R-1. Alternative: wait for the retrain (paused until the new R-1).

#### Plan

1. Make the routed variant the R-1 mini Modal pick in stg, prod and prod\_eu together.
   - New variant at 128 seats, named by checkpoint date (the shadow build has 42).
   - Ships its performance table: one container, B200 and B300.
   - Gate: c=512 stress test on one container at 128 seats; unrouted output identical to today's pick.
   - prod\_au stays as is: it has no R-1 to route to.
   - Rollback: point the pick back to <code>b200-n128</code> and redeploy all regions.
2. Add the route head to the fpp-2b image on all three US clusters in one Flux rollout.
   - The patch targets the Modal image (vLLM 0.31); cluster fpp-2b runs Dynamo on vLLM 0.33, so it needs a port.
   - Gate: the same pages get the same route head score on cluster fpp-2b and on Modal.
   - Rollback: previous image tag.
3. Send <code>auto_route</code> pages through the inference router: cluster first, Modal spill.
   - Today the worker skips the router for them because cluster fpp-2b has no route head.
   - Rollback: revert; pages call Modal directly again.
4. Raise the R-1 worker waiting limit from 2 to 6 on all clusters, in one Flux rollout.
   - Problem: at a full cluster, burst workers refuse calls (529), which go straight to Modal: 411 on Nov 19, 06:00 to 14:00 PT, against 61 on Nov 17. Since [#15259](https://github.com/reductoai/api/pull/15259) the head splits calls between the baseline and burst pools at random, by worker count, so the small burst pool overflows.
   - Evidence (uss1, Nov 19, 09:55 to 09:58 PT): both pools took 7.9 calls/s per worker, yet each burst worker refused 24.6 calls a minute and each baseline worker 0.05. The router had leased every seat (393 of 440 in flight, 853 queued). The random split predicts about 300 burst refusals per baseline one; we measured 406 to 1. Samples are 15 s apart, so the burst pool passing its 132 seats is inferred.
   - Change: <code>DYN_DYNAMO_REQUEST_QUEUE_LIMIT</code> 2 to 6 for fpp-35b. The waiting limit is how many calls a worker queues before it refuses more. Spare room in a 6-worker burst pool goes from 12 to 36 seats.
   - Cost: an overflowing call waits behind 20 busy seats (0.6 to 0.7 s) instead of going to Modal at once.
   - Gate: head 529s per day, direct Modal calls and R-1 p99, before and after. Rollback: set it back to 2.
   - If not enough: dynamo-stable picks the pool by free seats, not worker count (new image and rollout).

#### Cluster capacity

- No change to the stamped [B200 sharing plan](https://app.notion.com/p/41c4a78a1c878179a3f4d03746e1ad63). fpp-2b keeps its 3 guaranteed B200s per cluster. Routed pages land on fpp-35b's guarantee (16 on uss1 and use1, 25 on usw3) and burst into shared GPUs (9 off-peak, 6 on weekdays, none on usw3).
- Load: at 0.58 the route head sent 28% of pages to R-1 (780 judged pages, Nov 18), so every 100 <code>auto_route</code> pages add about 28 R-1 pages.
- B300: the Modal class asks for "B200 or better", and the routed build ran 10.8 pages/s on a B300 against 19.8 on a B200. PR 1's performance run finds the cause; if it isn't fixed, PR 1 pins the class to B200.

#### Cost per 1k pages

GPU at saturation, from the registry tables: R-1 mini \$0.08, R-1 \$0.13, routed R-1 mini at 28% about \$0.10 (estimate). A routed page bills the customer at the R-1 rate. I'll measure cost per call before and after the cutover.

# Logs

- \[2026-11-16 11:45 PT\] In progress: [PR 14939](https://github.com/reductoai/api/pull/14939) adds <code>settings.alpha.auto_route</code>. R-1 mini's route head sends the pages it scores hard to R-1, and a job whose org has filled its R-1 mini pool runs on R-1.
  - \[2026-11-16 12:13 PT\] Pushed both review fixes: an AU job at its R-1 mini limit stays on R-1 mini ([aec894b](https://github.com/reductoai/api/pull/14939/commits/aec894ba4b)), and the head weights moved from git to Hugging Face at a pinned commit, with their env var in the registry ([792b5bf](https://github.com/reductoai/api/pull/14939/commits/792b5bf9df)). Uploaded with Jean's HF write token.
    - All four review threads answered and resolved; CI green.
    - \[2026-11-16 12:35 PT\] Codex re-reviewed the new head and raised three more on the full-pool rule. Fixed one (a split at the limit now moves to R-1 too, [88ebb26](https://github.com/reductoai/api/pull/14939/commits/88ebb2619d)); and the other two ([668f54d](https://github.com/reductoai/api/pull/14939/commits/668f54dd99)): the check now counts the job's own 3-page weight and ignores holds left by a dead worker.
    - \[2026-11-16 12:55 PT\] Ready to merge: CI green on <code>668f54d</code>, every Codex and Devin Review thread resolved. One Codex P2 answered, not fixed: two jobs enqueued in the same instant can both read "fits", and the second waits on R-1 mini instead of moving to R-1 (no over-admission).
    - Not run: the image build with the downloaded weights (its download and checksum commands pass), and a routed page through a real worker.
    - \[2026-11-16 13:20 PT\] Per Jean, the head moved to its own variant <code>b200-route</code> (dev shadow only, [e602fdf](https://github.com/reductoai/api/pull/14939/commits/e602fdf195)); the default R-1 mini image is stock again.
    - \[2026-11-16 14:25 PT\] Ready to merge: CI green on <code>c151ce0</code>, Codex found nothing, every review thread resolved. Review fixes since: the full-pool check replays the pool's gate (wake of parked jobs, job priority), and a batch job moved to R-1 starts on the R-1 lane.
- \[2026-11-16 14:40 PT\] In progress: [PR 15021](https://github.com/reductoai/api/pull/15021) (stacked on 14939) adds a third leg, R-1 mini + <code>auto_route</code> on <code>b200-route</code>, to the judged R-1 vs R-1 mini shadow. The two strict legs are unchanged.
  - Every leg's final output is judged against the same R-1 baseline, so routed vs R-1 mini alone reads off the dashboard.
  - Each routed row records where its page ran: <code>routed</code>, <code>kept</code>, <code>mini_failed</code> or <code>pool_full</code>.
  - Cost: one more one-page replay and judge call per pair, up to 1,000 pairs a day.
  - Not run: a real pair end to end (needs steps 1 and 2).
  - \[2026-11-17 10:38 PT\] Merged. Prod release with 14939 went out 2026-11-16 17:17 PT. The prod cron is still on the build from before the merge.
  - \[2026-11-17 11:50 PT\] Cron redeployed at 11:13 PT, but from an Oct 24 checkout (<code>e47f597</code>) without 15021. Its 11:45 PT submit sent no judged-shadow legs and restarted the paused <code>20260917_routed</code> vs legacy experiment. No judged <code>auto_route</code> pair yet.
  - \[2026-11-16 15:20 PT\] Rebased onto main after 14939 merged. Deployed the routed dev class as its own app <code>fpp-flash-b200-route</code> (<code>rd modal deploy single-model dev fpp-flash --env-var FPP_FLASH_SHADOW=b200-route</code>); shared dev <code>fpp-flash</code> untouched.
    - Head checked directly on that class: a text page stays on R-1 mini, a chart page routes to R-1.
    - First request after the deploy waited about 7 min of 503s (no warm floor).
    - A judged pair end to end did not run: a staging worker gets 401 from Modal dev, and prod workers need the prod release.
  - \[2026-11-16 14:50 PT\] Earlier head, before the rebase: CI green on <code>0fc3b05</code>, Codex found nothing, the one Devin Review finding (dashboard heading for the two candidates) fixed.

<b>Nov 17 (PT)</b>

<b>Autoeval dashboard: routing section</b>

- #15201 ✅ + Deploy (dashboard 16:44, autoeval cron 17:15): routed share, outcome split, score vs share graph. Routed pages no longer read as "R-1 mini failed"; rows graded before 17:15 keep the old label until they leave the 24 h window.

<b>Warm dev classes for the shadow</b>

- #15221 ✅ + Deploy (dev, 17:24): the hourly dev cron sets a floor of 1 on the stock and routed dev R-1 mini classes at :35.
  - Why: a cold stock class lost every strict R-1 mini page in the 14:45 submit (204 attempts). The 16:45 and 17:45 submits then succeeded 53 of 53 and 52 of 52.
- #15213 closed: a registry floor would also warm an idle B200 in every R-1 shadow's dev app.

<b>Head score log</b>

- Score log on in the routed dev class (redeployed 17:06). Scores join judged pairs by request id; no engine or gateway change.

<b>Threshold curve: 780 judged pages (Nov 18)</b>

The route head sends a page to R-1 when its score clears the threshold. Sweeping the threshold from never routing to always routing:

| Point | Pages sent to R-1 | Mean judge score |
| --- | --- | --- |
| R-1 mini only | 0% | 9.12 |
| Live threshold 0.58 | 28% | 9.32 |
| R-1 only | 100% | 9.45 |

At 0.58, sending 28% of pages to R-1 closes about 60% of the gap between R-1 mini and R-1. The curve keeps rising until about 60% of pages go to R-1, then goes flat. No threshold beats R-1 alone.

3 of the 780 pages carry the grader label "no page record". That is likely the grader timing out while it looks up the trace, not a routing error (not confirmed).

<b>Threshold curve, Nov 19: 597 judged pages</b>

At the live threshold 0.58, R-1 gets 19% of pages and closes about three quarters of the gap between R-1 mini and R-1. Over both days (1,608 pages) it is 24% of pages for about 64% of the gap (9.19, 9.37, 9.47). Same sweep as Nov 18, on pages judged from the 17:45 PT Nov 18 submit through 11:45 PT Nov 19.

| Point | Pages sent to R-1 | Mean judge score |
| --- | --- | --- |
| R-1 mini only | 0% | 9.32 |
| Live threshold 0.58 | 19% | 9.48 |
| R-1 only | 100% | 9.53 |

Left out of the curve: 103 pages from 2 of the 14 submits (05:45 and 07:45 PT). The routed dev class is no longer kept warm ([PR 15324](https://github.com/reductoai/api/pull/15324)) and did not start in time, so those pages ran on R-1 with no route head score. 5 of the 597 pages carry the grader label "no page record".

Open questions:

- Why 19% of pages were routed on Nov 19 against 28% on Nov 18.
- Why 61 more judged pairs have no route head score, beyond the 103 pages of the two lost submits.

<b>Judged reads</b> (mean judge score, R-1 / R-1 mini / auto\_route; pairs in parentheses)

- 13:45 submit, 49 pairs: kept 9.58 / 9.36 / 9.45 (33), routed 8.13 / 7.93 / 8.20 (15).
- 15:45 submit, 45 pairs: kept 9.65 / 9.65 / 9.70 (20), routed 8.14 / 7.81 / 8.57 (21).
- The 5 pairs outside kept and routed (1 at 13:45, 4 at 15:45) were judged too; the grader found no page record for them. The four at 15:45 have one in the traces now (2 kept, 2 routed); the one at 13:45 has none.

<b>Stress test, routed build, one container</b>

- No failed request up to 512 in flight; no output garbled by load.
- B200: 19.8 pages/s at 64 in flight (the earlier 11 pages/s was a B300 container). Gateway, streaming and the head cost nothing measurable.

</details>

<details>
<summary>Impact</summary>

- Shadow, threshold 0.58: 28% of pages to R-1; judge 9.32 vs 9.12 for R-1 mini alone and 9.45 for R-1 alone. Measured in shadow on prod traffic.
- Nov 19 threshold curve, 597 judged pages: R-1 mini alone 9.32, routed at threshold 0.58 9.48 with 19% of pages sent to R-1, R-1 alone 9.53. Measured in shadow on prod traffic, 2026-11-19; refreshed daily. The routed shadow leg is no longer kept warm, so some submits miss it.
- PR 1 [#15367](https://github.com/reductoai/api/pull/15367) gates, routed 128-seat variant vs today's pick (b200-n128), one B200 container, rep-1k: 30.45 vs 30.24 pages/s at 128 in flight; no failed request 1 to 512 in flight; 2,000 of 2,000 public-2k pages identical unrouted; 24 h shadow judge 9.31 vs 9.12 for R-1 mini alone. Measured on dev, 2026-11-18.
- Stress test, routed build, one container on dev: no failed request up to 512 in flight; 19.8 pages/s at 64 in flight on a B200, 10.8 on a B300.
- Shadow reliability ([#15221](https://github.com/reductoai/api/pull/15221), warm dev classes): before, a cold class lost every strict R-1 mini page of one submit (204 attempts); after, 53 of 53 and 52 of 52 succeeded.
- GPU cost per 1k pages: estimate only, about \$0.10 routed at 28% against \$0.08 for R-1 mini and \$0.13 for R-1 (registry tables, at saturation).

#### Routed Modal pick in prod ([#15367](https://github.com/reductoai/api/pull/15367)): not live yet (read 2026-11-19 09:45 PT)

<b>Prod still serves </b><b><code>b200-n128</code></b><b>.</b> The routed pick <code>20261028-b200-nvfp4-route</code> serves only in stg, because no prod release has shipped since #15367 merged at 2026-11-19 02:48 PT. The one prod release tried since then ([2026-11-19 09:38 PT](https://github.com/reductoai/api/actions/runs/44579409547)) failed the deployer allowlist: during the ElastiCache change, only raunakdoesdev, alvin-r and jingsong can deploy prod.

Pick per environment, from <code>modal app history</code> of <code>fpp-flash</code> and the <code>prod-deploy-record</code> deployments:

| Environment | Last <code>fpp-flash</code> deploy (PT) | Commit | R-1 mini pick |
| --- | --- | --- | --- |
| stg | 2026-11-19 07:55 (first with #15367: 02:59) | <code>2e17772</code> | <code>20261028-b200-nvfp4-route</code> |
| prod | 2026-11-18 17:41 | <code>e3783a1</code> | <code>b200-n128</code> |
| prod\_eu | 2026-11-18 17:41 | <code>e3783a1</code> | <code>b200-n128</code> |
| prod\_au | 2026-11-18 17:42 | <code>e3783a1</code> | <code>h100-int8</code> (as intended) |
| dev | 2026-11-16 13:38, by hand | <code>019b311</code> | <code>b200-n128</code> |

The prod release alone should move none of the numbers below, since no prod request sets <code>auto_route</code> yet. If a number moves, the unrouted path regressed.

<b>Before</b> (pick <code>b200-n128</code>): Modal <code>fpp-flash</code> class <code>R1Mini</code>, ok <code>model.call</code> rows, shadows excluded. Days are UTC days, which run 16:00 PT to 16:00 PT.

| Day | Region | Modal pages | Peak pages/s | Peak pages/s per ready container | p50 / p99 (s) | Failed attempts | Modal share of R-1 mini pages | Modal \$ | \$ per 1k Modal pages |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11-17 | US | 262,727 | 321 | 26.0 | 1.01 / 11.3 | 10,720 (3.9%, HTTP 503) | 18.1% | 1,094 | 4.16 |
| 11-18 | US | 6,003,835 | 3,593 | 15.0 | 0.85 / 4.4 | 151,038 (2.5%, HTTP 429) | 80.8% | 1,843 (estimate) | 0.31 |
| 11-19, to 09:40 PT | US | 74,281 | 54 | 12.5 | 1.23 / 5.6 | 0 | 8.2% | not billed yet |  |
| 11-17 | EU | 14,652 | 39 | 8.6 | 1.51 / 6.2 | 0 | 100% | 253 | 17.3 |
| 11-18 | EU | 17,092 | 32 | 5.3 | 1.92 / 4.2 | 1 | 100% | 720 (estimate) | 42.1 |
| 11-19, to 09:40 PT | EU | 2,919 | 4 | 4.0 | 1.78 / 6.1 | 0 | 100% | not billed yet |  |

How to read the before table:

- Modal share is the US fallback rate. In the US, Modal gets only the router's overflow from the GPU clusters. EU has no cluster, so it runs all of R-1 mini on Modal.
- Bursts skew 11-17 and 11-18. On 11-18, two bursts (11-17 16:00 to 18:00 PT and 11-18 11:00 to 13:00 PT) sent 5.9M pages to Modal, which scaled to 350 <code>R1Mini</code> containers. On 11-17, one hour (14:00 PT) carried 192k of the 263k pages. Compare the after window against hours of equal volume.
- Cost per 1k Modal pages tracks the warm floor, not the pages: 4.16 USD at 263k pages, 0.31 USD at 6.0M. Compare it only between days of equal volume.
- Prod containers peak below the benchmark. Before the merge, one B200 at 128 in flight did 30.45 pages/s routed and 30.24 control. The router gives each prod container 32 calls, so prod peaks lower.

<b>After</b>: fill in from the first full UTC day after the prod release that carries #15367.

</details>

