// Copies a dashboard seed into the Notion databases: NOTION_TOKEN=... bun scripts/push-notion.ts <slug>...
import { readFileSync } from "node:fs";

const cfg = JSON.parse(readFileSync("content/dashboards/notion.json", "utf8"));
const token = process.env.NOTION_TOKEN!;
const rt = (s: string) => ({ rich_text: [{ text: { content: s.slice(0, 1900) } }] });
const title = (s: string) => ({ title: [{ text: { content: s.slice(0, 1900) } }] });
const sel = (s: string) => ({ select: { name: s } });
const props: Record<string, (r: any) => any> = {
  stats: (r) => ({ Label: title(r.label), Value: rt(r.value) }),
  apps: (r) => ({ Name: title(r.name), State: sel(r.state), Status: rt(r.status), Note: rt(r.note) }),
  steps: (r) => ({ Step: title(r.step), Detail: rt(r.detail), State: sel(r.state) }),
  costs: (r) => ({ App: title(r.app), Before: { number: r.before }, After: { number: r.after } }),
  impact: (r) => ({ Measure: title(r.measure || "Impact"), Value: rt(r.value) }),
  prs: (r) => ({ PR: title(r.pr), Repo: rt(r.repo), State: sel(r.state), Note: rt(r.note) }),
};
for (const slug of process.argv.slice(2)) {
  const seed = JSON.parse(readFileSync(`content/dashboards/${slug}.json`, "utf8"));
  for (const [kind, rows] of Object.entries(seed) as [string, any[]][]) {
    for (const [i, r] of rows.entries()) {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "notion-version": "2022-06-28", "content-type": "application/json" },
        body: JSON.stringify({ parent: { database_id: cfg.databases[kind] }, properties: { ...props[kind](r), Workstream: sel(slug), Order: { number: i } } }),
      });
      if (!res.ok) throw new Error(`${slug} ${kind} ${i}: ${res.status} ${await res.text()}`);
    }
  }
  console.log("pushed", slug);
}
