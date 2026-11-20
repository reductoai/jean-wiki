# Overshoot 1112 R-1 35B package

Overshoot's fpp_35b-b200-2026-11-12 package: the 1111 engine plus 8-bit vision attention, with scales calibrated for our 20261028 encoder (Reducto's weights unchanged; only vision_scales/ and the vision_scales entry of config.json added). 96 seats, 24576…

<div class="ws-head">
<div class="ws-stat"><b>0</b><span>steps left</span></div>
<div class="ws-stat"><b>0</b><span>PRs merged</span></div>
<div class="ws-stat"><b>2</b><span>PRs open</span></div>
<div class="ws-stat"><b>3</b><span>impact measures</span></div>
</div>

## Impact

<div class="impact-grid"><div class="impact-card"><div class="ic-label">Speed gate PASS</div><div class="ic-value">at C16, p50 <b>0.66x</b> prod; at C32, p50 <b>0.54x</b> prod. p99 at C64 is higher than prod (<b>24.77 s</b> vs <b>18.96 s</b>).</div></div><div class="impact-card"><div class="ic-label">For reference, 1109 on 11-09 (another day, another pod)</div><div class="ic-value"><b>1.93 </b>/ <b>14.30 </b>/ <b>16.48 </b>/ <b>18.63</b> pages/s at C1/<b>16</b>/<b>32</b>/<b>64.</b> C96 not measured.</div></div><div class="impact-card"><div class="ic-label">Quality</div><div class="ic-value">judge vs BF16 nets -3 (prod fold-44 +<b>2,</b> <b>1109</b> was -6); head to head <b>1112</b> nets +<b>6</b> over prod. No malformed markup on pages that stopped normally.</div></div></div>

## PRs

<div class="pr-grid"><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14671"><b>#14671</b><span>open</span><em>🟡 Autoeval: 1112 gets its own dev app fpp-flash-overshoot-1112 and domain…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14630"><b>#14630</b><span>open</span><em>PR https://github.com/reductoai/api/pull/14630: registers unpicked b200-1112-20; Devin…</em></a></div>

## Details

<details>
<summary>Summary</summary>

- Overshoot's fpp\_35b-b200-2026-11-12 package: the 1111 engine plus 8-bit vision attention, with scales calibrated for our 20261028 encoder (Reducto's weights unchanged; only <code>vision_scales/</code> and the <code>vision_scales</code> entry of config.json added). 96 seats, 24576 batched tokens, DFlash 31 draft tokens, one B200.
- Vendor claims (not yet reproduced): 11.77 pages/s at C12, 19.08 at C96 (+21% / +42% vs 1111); judge 13 wins / 66 ties / 1 loss vs BF16 on 81 pages.
- Ask (Jean, 2026-11-12): test it offline and put it behind autoeval. Nothing changes prod serving without Jean's approval.

</details>

<details>
<summary>Main result</summary>

Same Modal B200 pod, prod R-1 (b200-b300-fold-44) and 1112 alternated, 300 s per level, n=5 runs per arm. Latency is per page.

| Concurrency | prod pages/s | prod p50 / p90 / p99 (s) | 1112 pages/s | 1112 p50 / p90 / p99 (s) | 1112 / prod pages/s |  |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | 1.72 | 0.43 / 0.95 / 3.54 | 2.10 | 0.34 / 0.75 / 3.01 | 1.23x |  |
| C16 | 8.92 | 1.28 / 2.94 / 11.45 | 13.74 | 0.85 / 1.90 / 8.34 | 1.54x |  |
| C32 | 9.64 | 2.72 / 4.71 / 15.62 | 15.53 | 1.46 / 3.44 / 14.72 | 1.61x |  |
| C64 | 9.49 | 6.14 / 8.12 / 18.96 | 17.15 | 2.65 / 6.10 / 24.77 | 1.81x |  |

<table header-row="true" header-column="true">
<colgroup>
<col width="235.66666666666666" />
<col width="91.65972900390625" />
<col width="97.65972900390625" />
<col width="84.00000762939453" />
<col />
</colgroup>
<tr>
<td>
Concurrency
</td>
<td>
p50
</td>
<td>
p90
</td>
<td>
p99
</td>
<td>
Throughput
</td>
</tr>
<tr>
<td>
1
</td>
<td>
0.34
</td>
<td>
0.75
</td>
<td>
3.01
</td>
<td>
2.10
</td>
</tr>
<tr>
<td>
16
</td>
<td>
0.85
</td>
<td>
1.90
</td>
<td>
8.34
</td>
<td>
13.74
</td>
</tr>
<tr>
<td>
32
</td>
<td>
1.46
</td>
<td>
3.44
</td>
<td>
14.72
</td>
<td>
15.53
</td>
</tr>
<tr>
<td>
64
</td>
<td>
2.65
</td>
<td>
6.10
</td>
<td>
24.77
</td>
<td>
17.15
</td>
</tr>
</table>

- Speed gate PASS: at C16, p50 0.66x prod; at C32, p50 0.54x prod. p99 at C64 is higher than prod (24.77 s vs 18.96 s).
- For reference, 1109 on 11-09 (another day, another pod): 1.93 / 14.30 / 16.48 / 18.63 pages/s at C1/16/32/64. C96 not measured.
- Quality: judge vs BF16 nets -3 (prod fold-44 +2, 1109 was -6); head to head 1112 nets +6 over prod. No malformed markup on pages that stopped normally.

</details>

<details>
<summary>Current status</summary>

- 🟢 Archived and checked: <code>s3://reducto-shared-ml-workspace/external/fpp/fpp_35b-b200-2026-11-12/</code> (315 files; image tar sha256 <code>001fb86c…68968f7</code>).
- 🟢 rep-1k offline A/B done (Main result above).
- 🟢 Wide offline set (Jean's prod gate), 9,999 readable pages of <code>v2_10k_quota_balanced_v1_pdf_pages</code>, C16, one B200 per arm: PASS. Judge, 1112 vs prod: 99 wins / 9,817 ties / 83 losses, net +16 (bar -300), \$228.91. No request errors.

| Arm | valid | malformed on normal stop | pages/s | p50 / p90 / p99 (s) |
| --- | --- | --- | --- | --- |
| prod fold-44 | 9,954 | 2 | 8.02 | 1.44 / 3.25 / 10.24 |
| 1112 | 9,955 | 5 | 10.16 | 1.20 / 2.69 / 6.23 |

- 🟡 Autoeval: 1112 gets its own dev app <code>fpp-flash-overshoot-1112</code> and domain <code>full_page_parse_r1_overshoot_1112_replay</code> ([#14671](https://github.com/reductoai/api/pull/14671), per-candidate shadows); <code>modal/dev</code> untouched, 1109 retired with it. 🟢 Live since 2026-11-12 14:26 PT (prod workers e487f61115; sampler and cron from overlay f7af8586ee; R1 floor min 4 + buffer 2). 24 h gate ends 2026-11-13 14:26 PT.
- Prod gate: wide set + ≥1 day autoeval before any prod recommendation.

</details>

<details>
<summary>Steps</summary>



</details>

<details>
<summary>1. Archive 🟢</summary>

- 2026-11-12 02:05 PT: archive started (315 files). One empty file failed the streamed multipart upload; reuploaded.
- 2026-11-12 02:40 PT: all 315 files in S3; the 314 non-image files match SHA256SUMS. Against 1109, the engine changes 2 files (<code>vision_attention_8bit.py</code>, <code>vision_fused.py</code>) plus the reference outputs; the weights are the 1028 ones (1109 shipped a retrained encoder).
- Uploading the package (no image tar) to HF branch <code>overshoot-b200-20261112</code> of <code>reducto/fpp_35b_20261028</code> (Jean's write token), as for 1109, so Modal can build it.

</details>

<details>
<summary>2. Offline A/B 🟡</summary>

- HF branch <code>overshoot-b200-20261112</code> at <code>77996273</code> (314 files checked); weights on dev volume <code>20260901.inference</code> at <code>/2026/11/12/fpp_35b_overshoot_1112/weights</code>.
- Package selfcheck (shipped <code>selfcheck.py --weights</code> on a Modal B200): all 9 groups on; default mode 16/16 within the reference outputs, deterministic mode 16/16 identical. PASS.
- rep-1k quality (C=CONCURRENCY driver, 1000 pages each): package 993 valid, 6 repetition stops, 1 length, 0 errors, 0 malformed (stop but rejected); prod fold-44 993 valid, 5 repetition stops, 2 length, 0 malformed. BF16 reference (pod-a, earlier run) 997 valid.
- Speed (pods s1 prod->package x3, s2 package->prod x2; 300 s levels, n=5 per arm): prod fold-44 1.72 / 8.92 / 9.64 / 9.49 pages/s at C1/16/32/64; 1112 2.10 / 13.74 / 15.53 / 17.15 (1.23x / 1.54x / 1.61x / 1.81x). Speed gate PASS (C16 p50 0.66x, C32 p50 0.54x). 1109 on 11-09: 1.93 / 14.30 / 16.48 / 18.63 (other day).
- Comparative judge (gpt-6.1-sol xhigh, rep-1k): BF16 vs 1112 11/975/14 (-3); prod vs 1112 14/978/8 (+6); BF16 vs prod fold-44 13/976/11 (+2). 1109 was -6 vs BF16. Inside the -30 bar.
- Malformed markup through R-1's prod block parser: zero parse errors on stop-finished pages in any arm; every rejected page is a repetition/length stop (1112 7, prod 7, BF16 3). rep-1k can't resolve 1109's 0.57% prod regression; the autoeval shadow is the check.
- Wide set (9,999 pages, C16, one B200 each; prod pod 20 min, 1112 16 min):

| Arm | valid | rep. stops | length | stop but malformed | pages/s | p50 / p90 / p99 (s) |
| --- | --- | --- | --- | --- | --- | --- |
| prod fold-44 | 9954 | 33 | 10 | 2 (0.02%) | 8.02 | 1.44 / 3.25 / 10.24 |
| 1112 | 9955 | 30 | 9 | 5 (0.05%) | 10.16 | 1.20 / 2.69 / 6.23 |

- Stop-but-malformed: 1112 2 inverted bboxes, 2 text outside blocks, 1 unknown <code>q&a</code> block; prod 1 empty, 1 <code>q&a</code>. Far below 1109's 0.57%. 0 request errors in both arms. Judge prod vs 1112 running.

</details>

<details>
<summary>3. Autoeval 🟡</summary>

- 11-12 11:45 AM PT: Jean wants 1112 as its own experiment in its own app. #14669 (shared-slot flip) closed in favor of [#14671](https://github.com/reductoai/api/pull/14671). Deploy order: prod workers on #14671, dev app (warm min 4 / buffer 2), then sampler + cron from the overlay between :00 and :45.

</details>

<details>
<summary>Status (11-12 4:50 AM PT)</summary>

- PR [https://github.com/reductoai/api/pull/14630](https://github.com/reductoai/api/pull/14630): registers unpicked b200-1112-20; Devin Review round 1 fixed (hacky table arms, vllm import check).
- Hold: modal/dev stays on 1109 until its soak drains (switch-off \~7:15 PM PT Nov 12 + 1-2 h; session 6822e20b). Then flip modal/dev + DEV\_PICK to b200-1112-20 (also on overlay devin/1794445000-autoeval-overlay-1109-soak), warm the dev R1 floor. Cron deploy is Jean's call.

</details>

<details>
<summary>Status (11-12 7:15 AM PT)</summary>

- #14630 merged (Jean). Its only FPP Flash redeploy was stg (fpp-flash v168 at fea64a0, 6:49 AM PT): healthy, serving 200s, staging inference smoke and integration tests passed. Picks unchanged: stg/prod/EU/AU on b200-b300-fold-44, dev on b200-1109-20. Prod/EU/AU not redeployed (manual prod deploy); the next one will roll fpp-flash once because r1.yaml changed, same pick.
- Next: new PR flipping modal/dev + DEV\_PICK to b200-1112-20 once the soak session says the 1109 backlog drained (tonight PT).

</details>

<details>
<summary>Impact</summary>

- Offline, same B200 pod, prod package (fold-44) to 1112: 1.72 to 2.10 pages/s at 1 in flight, 8.92 to 13.74 at 16, 9.64 to 15.53 at 32, 9.49 to 17.15 at 64 (1.23x to 1.81x).
- p99 per page: 11.45 to 8.34 s at 16 in flight, 18.96 to 24.77 s at 64 (worse).
- Wide set, 9,999 pages at 16 in flight: 8.02 to 10.16 pages/s, p99 10.24 to 6.23 s; judge net +16 (bar -300).
- Prod: the R-1 Modal prod pick is now <code>b200-1112-20</code> (registry on <code>main</code>, read Nov 18). Prod pages/s and GPU cost per 1k pages before vs after that pick change: not measured yet.

</details>

