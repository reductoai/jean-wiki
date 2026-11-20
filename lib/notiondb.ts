import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/** Dashboard rows for one workstream, read from the Notion databases in content/dashboards/notion.json. */
export type Dash = {
  stats: { label: string; value: string }[];
  apps: { name: string; state: string; status: string; note: string }[];
  steps: { step: string; detail: string; state: string; owner?: string; prs?: string }[];
  costs: { app: string; before: number; after: number }[];
  impact: { measure: string; value: string }[];
  prs: { pr: string; repo: string; state: string; note: string }[];
};
type Kind = keyof Dash;

const ROOT = join(import.meta.dir, "..");
const CFG = JSON.parse(readFileSync(join(ROOT, "content/dashboards/notion.json"), "utf8")) as { page: string; databases: Record<Kind, string> };
const DATA = process.env.HOSTING_DATA_DIR ?? join(ROOT, ".data");
const cacheFile = join(DATA, "notion-cache.json");
let cache: Record<string, Dash> = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
let synced = existsSync(cacheFile);

export const notionPage = `https://app.notion.com/p/${CFG.page}`;

export function dashboard(ws: string): Dash | null {
  if (synced) return cache[ws] ?? null;
  const seed = join(ROOT, "content/dashboards", `${ws}.json`);
  return existsSync(seed) ? JSON.parse(readFileSync(seed, "utf8")) : null;
}

const STATES = ["on", "wait", "later"];
const text = (p: any) => (p?.title ?? p?.rich_text ?? []).map((t: any) => t.plain_text).join("");
const pick: Record<Kind, (p: any) => any> = {
  stats: (p) => ({ label: text(p.Label), value: text(p.Value) }),
  apps: (p) => ({ name: text(p.Name), state: STATES.includes(p.State?.select?.name) ? p.State.select.name : "later", status: text(p.Status), note: text(p.Note) }),
  steps: (p) => ({ step: text(p.Step), detail: text(p.Detail), state: p.State?.select?.name ?? "next", owner: text(p.Owner), prs: text(p.PRs) }),
  costs: (p) => ({ app: text(p.App), before: p.Before?.number ?? 0, after: p.After?.number ?? 0 }),
  impact: (p) => ({ measure: text(p.Measure), value: text(p.Value) }),
  prs: (p) => ({ pr: text(p.PR), repo: text(p.Repo) || "api", state: p.State?.select?.name === "merged" ? "merged" : "open", note: text(p.Note) }),
};

async function query(db: string, token: string): Promise<any[]> {
  const rows: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await fetch(`https://api.notion.com/v1/databases/${db}/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "notion-version": "2022-06-28", "content-type": "application/json" },
      body: JSON.stringify({ sorts: [{ property: "Order", direction: "ascending" }], page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`Notion ${r.status}`);
    const page = await r.json();
    rows.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return rows;
}

/** Re-reads every database; returns true when any row changed. */
export async function refresh(token: string): Promise<boolean> {
  const next: Record<string, Dash> = {};
  for (const kind of Object.keys(CFG.databases) as Kind[]) {
    for (const row of await query(CFG.databases[kind], token)) {
      const ws = row.properties.Workstream?.select?.name;
      if (!ws) continue;
      next[ws] ??= { stats: [], apps: [], steps: [], costs: [], impact: [], prs: [] };
      (next[ws][kind] as any[]).push(pick[kind](row.properties));
    }
  }
  const changed = !synced || JSON.stringify(next) !== JSON.stringify(cache);
  if (changed) {
    synced = true;
    cache = next;
    mkdirSync(DATA, { recursive: true });
    writeFileSync(cacheFile, JSON.stringify(cache));
  }
  return changed;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const nums = (s: string) => esc(s).replace(/(?<![\w.-])(\$?\d[\d,.]*\s?(?:%|ms|s|K|M|GPUs?|USD|x)?)(?![\w-])/g, "<b>$1</b>");
const prLinks = (s: string) => esc(s).replace(/#(\d{4,6})/g, '<a href="https://github.com/reductoai/api/pull/$1">#$1</a>');

export function dashboardHtml(ws: string, planHref = ""): string {
  const found = dashboard(ws);
  if (!found) return `_No dashboard rows for "${ws}" yet._`;
  const d: Dash = { stats: [], apps: [], steps: [], costs: [], impact: [], prs: [], ...found };
  const steps = d.steps.filter((s) => s.state !== "done");
  const mergedPrs = d.prs.filter((p) => p.state === "merged").length;
  const stats = d.stats.length ? d.stats : [
    { value: String(steps.length), label: "steps left" },
    { value: String(mergedPrs), label: "PRs merged" },
    { value: String(d.prs.length - mergedPrs), label: "PRs open" },
    { value: String(d.impact.length), label: "impact measures" },
  ];
  let out = `<div class="ws-head">${stats.map((s) => `<div class="ws-stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>\n\n`;
  if (d.apps.length) {
    const order = ["on", "wait", "later"];
    const apps = [...d.apps].sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state));
    out += `## Apps\n\n<div class="app-grid">${apps.map((a) => `<div class="app-card ${esc(a.state)}"><div class="ac-name">${esc(a.name)}</div><div class="ac-state">${esc(a.status)}</div><div class="ac-note">${prLinks(a.note)}</div></div>`).join("")}</div>\n\n`;
  }
  if (d.steps.length) {
    const now = d.steps.filter((s) => s.state === "now");
    out += `## Plan\n\n${progress(d.steps)}${now.length ? `<ol class="steps">${now.map((s) => `<li class="now"><b>${esc(s.step)}</b>${s.owner ? ` <span class="owner">${esc(s.owner)}</span>` : ""}</li>`).join("")}</ol>` : ""}${planHref ? `<p><a class="plan-link" href="${planHref}">Full plan: every step, its detail and PRs →</a></p>` : ""}\n\n`;
  }
  if (d.costs.length) {
    out += `## Cost per call\n\nUSD per 1k calls (per 1k pages for R-1 and R-1 mini), all regions, before and after the move.\n\n<div class="cost-bars"><div class="cb-legend"><span class="cb before"></span> before <span class="cb after good"></span> after</div>${d.costs.map((c) => {
      const m = Math.max(c.before, c.after) || 1, ch = c.before ? Math.round(((c.after - c.before) / c.before) * 100) : 0, cls = c.after <= c.before ? "good" : "bad";
      return `<div class="cb-row"><div class="cb-app">${esc(c.app)}</div><div class="cb-bars"><div class="cb before" style="width:${(c.before / m) * 100}%"><span>${c.before}</span></div><div class="cb after ${cls}" style="width:${(c.after / m) * 100}%"><span>${c.after}</span></div></div><div class="cb-ch ${cls}">${ch > 0 ? "+" : ""}${ch}%</div></div>`;
    }).join("")}</div>\n\n`;
  }
  if (d.impact.length) out += `## Impact\n\n<div class="impact-grid">${d.impact.map((m) => `<div class="impact-card">${m.measure ? `<div class="ic-label">${esc(m.measure)}</div>` : ""}<div class="ic-value">${nums(m.value)}</div></div>`).join("")}</div>\n\n`;
  if (d.prs.length) out += `## PRs\n\n<div class="pr-grid">${d.prs.map((p) => `<a class="pr-chip mini ${p.state}" title="${esc(p.note).replace(/>/g, "&gt;")}" href="https://github.com/reductoai/${encodeURIComponent(p.repo)}/pull/${encodeURIComponent(p.pr.replace(/\D/g, ""))}"><b>${esc(p.pr)}</b><span>${p.state}</span></a>`).join("")}</div>\n\n`;
  return out + `<p class="source">Numbers, cards and steps come from <a href="${notionPage}">Jean's wiki content</a> in Notion. Edit the rows there; this page updates within a minute.</p>\n\n`;
}

const STEP_LABEL: Record<string, string> = { done: "Done", now: "In progress", next: "Next" };

function progress(steps: Dash["steps"]): string {
  const count = (st: string) => steps.filter((s) => (STEP_LABEL[s.state] ? s.state : "next") === st).length;
  const seg = (st: string) => (count(st) ? `<span class="pg ${st}" style="flex:${count(st)}"></span>` : "");
  return `<div class="progress"><div class="pg-bar">${seg("done")}${seg("now")}${seg("next")}</div><div class="pg-legend"><span><i class="pg done"></i>${count("done")} done</span><span><i class="pg now"></i>${count("now")} in progress</span><span><i class="pg next"></i>${count("next")} next</span></div></div>`;
}

/** PR references in a step: "#123" is reductoai/api, "repo#123" another reductoai repo. */
function stepPrs(s: Dash["steps"][number], prs: Dash["prs"]): string {
  const refs = new Map<string, { repo: string; num: string }>();
  const add = (text: string, re: RegExp) => {
    for (const m of text.matchAll(re)) refs.set(`${m[1] ?? "api"}#${m[2]}`, { repo: m[1] ?? "api", num: m[2] });
  };
  add(s.prs ?? "", /(?:([\w-]+)#|#)(\d{1,6})\b/g);
  add(`${s.step} ${s.detail}`, /(?:([\w-]+)#|#)(\d{2,6})\b/g);
  return [...refs.values()].map(({ repo, num }) => {
    const row = prs.find((p) => p.pr.replace(/\D/g, "") === num && (p.repo || "api") === repo);
    const state = row?.state ?? "";
    return `<a class="pr-chip mini ${state}" href="https://github.com/reductoai/${encodeURIComponent(repo)}/pull/${num}"><b>${repo === "api" ? "" : esc(repo)}#${num}</b>${state ? `<span>${state}</span>` : ""}</a>`;
  }).join("");
}

/** The Plan subpage: every step in order, with its state, owner, detail and PR chips. */
export function planHtml(ws: string, overviewHref = ""): string {
  const found = dashboard(ws);
  if (!found?.steps?.length) return `_No plan steps for "${ws}" yet. Add rows to the Steps database with Workstream "${ws}"._`;
  const d: Dash = { stats: [], apps: [], steps: [], costs: [], impact: [], prs: [], ...found };
  const items = d.steps.map((s, i) => {
    const st = STEP_LABEL[s.state] ? s.state : "next";
    return `<li class="pstep ${st}"><div class="ps-num">${st === "done" ? "✓" : i + 1}</div><div class="ps-body"><div class="ps-head"><b>${esc(s.step)}</b><span class="ps-state ${st}">${STEP_LABEL[st]}</span>${s.owner ? `<span class="owner">${esc(s.owner)}</span>` : ""}</div>${s.detail ? `<div class="ps-detail">${nums(s.detail).replace(/#(\d{4,6})/g, '<a href="https://github.com/reductoai/api/pull/$1">#$1</a>')}</div>` : ""}<div class="ps-prs">${stepPrs(s, d.prs)}</div></div></li>`;
  }).join("");
  return `${progress(d.steps)}\n\n<ol class="plan">${items}</ol>\n\n<p class="source">Steps come from the Steps database in <a href="${notionPage}">Jean's wiki content</a>: one row per step, in Order. Edit them there; this page updates within a minute.${overviewHref ? ` <a href="${overviewHref}">Back to the overview</a>` : ""}</p>\n\n`;
}
