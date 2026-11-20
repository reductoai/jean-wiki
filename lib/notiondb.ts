import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/** Dashboard rows for one workstream, read from the Notion databases in content/dashboards/notion.json. */
export type Dash = {
  stats: { label: string; value: string }[];
  apps: { name: string; state: string; status: string; note: string }[];
  steps: { step: string; detail: string; state: string }[];
  costs: { app: string; before: number; after: number }[];
};
type Kind = keyof Dash;

const ROOT = join(import.meta.dir, "..");
const CFG = JSON.parse(readFileSync(join(ROOT, "content/dashboards/notion.json"), "utf8")) as { page: string; databases: Record<Kind, string> };
const DATA = process.env.HOSTING_DATA_DIR ?? join(ROOT, ".data");
const cacheFile = join(DATA, "notion-cache.json");
let cache: Record<string, Dash> = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};

export const notionPage = `https://app.notion.com/p/${CFG.page}`;

export function dashboard(ws: string): Dash | null {
  if (cache[ws]) return cache[ws];
  const seed = join(ROOT, "content/dashboards", `${ws}.json`);
  return existsSync(seed) ? JSON.parse(readFileSync(seed, "utf8")) : null;
}

const STATES = ["on", "wait", "later"];
const text = (p: any) => (p?.title ?? p?.rich_text ?? []).map((t: any) => t.plain_text).join("");
const pick: Record<Kind, (p: any) => any> = {
  stats: (p) => ({ label: text(p.Label), value: text(p.Value) }),
  apps: (p) => ({ name: text(p.Name), state: STATES.includes(p.State?.select?.name) ? p.State.select.name : "later", status: text(p.Status), note: text(p.Note) }),
  steps: (p) => ({ step: text(p.Step), detail: text(p.Detail), state: p.State?.select?.name ?? "next" }),
  costs: (p) => ({ app: text(p.App), before: p.Before?.number ?? 0, after: p.After?.number ?? 0 }),
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
      next[ws] ??= { stats: [], apps: [], steps: [], costs: [] };
      (next[ws][kind] as any[]).push(pick[kind](row.properties));
    }
  }
  const changed = JSON.stringify(next) !== JSON.stringify(cache);
  if (changed) {
    cache = next;
    mkdirSync(DATA, { recursive: true });
    writeFileSync(cacheFile, JSON.stringify(cache));
  }
  return changed;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const prLinks = (s: string) => esc(s).replace(/#(\d{4,6})/g, '<a href="https://github.com/reductoai/api/pull/$1">#$1</a>');

export function dashboardHtml(ws: string): string {
  const d = dashboard(ws);
  if (!d) return `_No dashboard rows for "${ws}" yet._`;
  let out = `<div class="ws-head">${d.stats.map((s) => `<div class="ws-stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>\n\n`;
  if (d.apps.length) {
    const order = ["on", "wait", "later"];
    const apps = [...d.apps].sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state));
    out += `## Apps\n\n<div class="app-grid">${apps.map((a) => `<div class="app-card ${esc(a.state)}"><div class="ac-name">${esc(a.name)}</div><div class="ac-state">${esc(a.status)}</div><div class="ac-note">${prLinks(a.note)}</div></div>`).join("")}</div>\n\n`;
  }
  const steps = d.steps.filter((s) => s.state !== "done");
  if (steps.length) out += `## Next steps\n\n<ol class="steps">${steps.map((s) => `<li${s.state === "now" ? ' class="now"' : ""}><b>${esc(s.step)}</b>${s.detail ? `: ${prLinks(s.detail)}` : ""}</li>`).join("")}</ol>\n\n`;
  if (d.costs.length) {
    out += `## Cost per call\n\nUSD per 1k calls (per 1k pages for R-1 and R-1 mini), all regions, before and after the move.\n\n<div class="cost-bars"><div class="cb-legend"><span class="cb before"></span> before <span class="cb after good"></span> after</div>${d.costs.map((c) => {
      const m = Math.max(c.before, c.after) || 1, ch = c.before ? Math.round(((c.after - c.before) / c.before) * 100) : 0, cls = c.after <= c.before ? "good" : "bad";
      return `<div class="cb-row"><div class="cb-app">${esc(c.app)}</div><div class="cb-bars"><div class="cb before" style="width:${(c.before / m) * 100}%"><span>${c.before}</span></div><div class="cb after ${cls}" style="width:${(c.after / m) * 100}%"><span>${c.after}</span></div></div><div class="cb-ch ${cls}">${ch > 0 ? "+" : ""}${ch}%</div></div>`;
    }).join("")}</div>\n\n`;
  }
  return out + `<p class="source">Cards, steps and chart come from <a href="${notionPage}">Jean's wiki content</a> in Notion. Edit the rows there; this page updates within a minute.</p>\n\n`;
}
