# Inference observability

inference-health-internal: Latency, Reliability, Efficiency, Automations views

{{dashboard:inference-observability}}

## Details

<details>
<summary>Plan</summary>

- inference-health-internal: Latency, Reliability, Efficiency, Automations views
  - Merge [#13977](https://github.com/reductoai/api/pull/13977) (carries #14382 and #14045)
- GPU alerts
  - Cancel downtime <code>442992579</code> (scope <code>*</code>, mutes \~44 inference monitors since Jun 17)
- Standard per-model monitors
  - After a week of firing data: delete the hand-written monitors the generic set covers
  - Move generic routes from <code>#inference-alerts-testing</code> to <code>#inference-alerts</code>
  - Default (decision): page only on failed customer calls and GPU hardware faults; rest to Slack
- Coverage per prod model
  - R-1, R-1 mini, Magpie, Maverick, Triton: failed calls, latency, capacity, GPU health; one panel + one alert each, small PRs per area
- Uniform tags, then one dashboard
  - <code>model_role</code> / <code>model_version</code> on <code>model.call</code> spans
  - Model dropdown on the Terraform "Reducto Inference" dashboard; drop duplicate dashboards
  - Default (decision): inference-health site for daily health and COGS, Datadog for live triage
- GPU hardware signals and logs
  - use1 / uss1 to the dcgm-exporter chart (XID)
  - GCP container logs: failed requests only (default, decision)
- Weekly check of active downtimes and unactioned alerts → <code>#inference-alerts-testing</code>

</details>

<details>
<summary>Logs</summary>

- inference-health-internal
  - COGS Worker + 6-hourly snapshot [#13195](https://github.com/reductoai/api/pull/13195) ✅ + Deploy
  - Modal bill read 7 days at a time [#14675](https://github.com/reductoai/api/pull/14675) ✅ + Deploy
  - Efficiency [#14382](https://github.com/reductoai/api/pull/14382) ✅ into #13977; Automations [#14045](https://github.com/reductoai/api/pull/14045) folded into #14382
  - Latency / Reliability [#13977](https://github.com/reductoai/api/pull/13977) open, blocked on Jean's review
- Standard per-model monitors
  - Span metrics + generic monitors [#14670](https://github.com/reductoai/api/pull/14670) ✅ (Scalr apply not checked)
  - Traffic stopped, idle GPUs, empty answers [#14707](https://github.com/reductoai/api/pull/14707) ✅, downtime timezone [#14765](https://github.com/reductoai/api/pull/14765) ✅
  - <code>finish_reason</code> from typed completions [#14715](https://github.com/reductoai/api/pull/14715) ✅ + Deploy
- GPU alerts
  - GPU monitor fixes [#14439](https://github.com/reductoai/api/pull/14439) ✅ + Apply (live 2026-11-12T11:28:00)
  - usw3 dcgm-exporter [#14440](https://github.com/reductoai/api/pull/14440) ✅ + Apply, [#14451](https://github.com/reductoai/api/pull/14451) ✅, [#14738](https://github.com/reductoai/api/pull/14738) ✅, pod tags [#14834](https://github.com/reductoai/api/pull/14834) ✅
  - usw3 in GKE B200 monitors [#14431](https://github.com/reductoai/api/pull/14431) ✅, in decode-speed drift [#14756](https://github.com/reductoai/api/pull/14756) ✅
  - Envoy failed-request logs [#14434](https://github.com/reductoai/api/pull/14434) ✅ + Apply
- Dashboards
  - Serving Paths: router cluster vs Modal share + usw3 tab (API edits, 2026-11-12)
  - FPP route health: one latency table per model × platform [#14825](https://github.com/reductoai/api/pull/14825) ✅ (Scalr apply not checked)
  - FPP route health: page fallback rate split into R-1 and R-1 mini [#15036](https://github.com/reductoai/api/pull/15036) ✅ + Apply

<details>
<summary>Moved</summary>

- <b>Alert inventory ✅</b> (2026-11-11): 103 alerts by section, Keep / Merge / Fix / Drop, M1–M11 merges

- [Inference alerts and metrics by latency, throughput, reliability](https://app.notion.com/p/4164a78a1c878130b9cedf20c586076c)

- <b>Inference router alerts ✅:</b> [#13738](https://github.com/reductoai/api/pull/13738) → [#14012](https://github.com/reductoai/api/pull/14012) → [#14211](https://github.com/reductoai/api/pull/14211) → [#14623](https://github.com/reductoai/api/pull/14623) → EU paging [#14871](https://github.com/reductoai/api/pull/14871)
- Old page (one-dashboard analysis, standard observability design, full log):

- [Inference observability: reference (Nov 11–13 page)](https://app.notion.com/p/41a4a78a1c8781e29890d97eebc0e480)

</details>

</details>

<details>
<summary>Impact</summary>

- Failed/fallback pages caught and false pages: not measured yet; measure before vs after once it ships.
- False pages: three monitors paged on healthy traffic, e.g. qwen-rfdetr "100% on Modal" read 99% when the real share was 1.7%; Gemini 3.7 Flash empty answers above 2% came from one org's custom prompt (4,067 of 4,207). Fix: [#15391](https://github.com/reductoai/api/pull/15391) with [#15394](https://github.com/reductoai/api/pull/15394) stacked, not merged yet.

</details>

