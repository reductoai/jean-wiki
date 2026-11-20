// Builds a visual workstream page from a Notion fetch result: bun scripts/workstream.ts <fetch.json> <slug> [title]
import { notionToMarkdown } from "../lib/notion.ts";

const [file, slug, titleArg] = process.argv.slice(2);
const raw = JSON.parse(await Bun.file(file).text());
const body = raw.text.match(/<content>([\s\S]*)<\/content>/)?.[1] ?? raw.text;
const md = notionToMarkdown(body).replace(/\n{3,}/g, "\n\n").trim();
const title = titleArg ?? raw.title.replace(/^[^\p{L}\p{N}]+/u, "").trim();
const id = raw.url.match(/p\/([0-9a-f]{32})/)?.[1] ?? "";

const plain = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\\([$~_*])/g, "$1").replace(/\*\*/g, "").trim();
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const nums = (s: string) => esc(s).replace(/(?<![\w.-])(\$?\d[\d,.]*\s?(?:%|ms|s|K|M|GPUs?|USD|x)?)(?![\w-])/g, "<b>$1</b>");

const parts = md.split(/^(?=#{1,3} )/m);
const intro = /^#{1,3} /.test(parts[0]) ? "" : parts.shift()!;
const sections = parts.map((p) => ({ title: plain(p.split("\n", 1)[0].replace(/^#+\s*/, "")), body: p.slice(p.indexOf("\n") + 1).trim() }));
const find = (re: RegExp) => sections.find((s) => re.test(s.title));
const topItems = (text: string) => text.split("\n").filter((l) => /^(- |\d+\. )/.test(l)).map((l) => plain(l.replace(/^(- |\d+\. )/, ""))).filter(Boolean);

const prs = new Map<string, { merged: boolean; text: string }>();
for (const line of md.split("\n")) {
  for (const m of line.matchAll(/github\.com\/reductoai\/([\w-]+)\/pull\/(\d+)/g)) {
    const key = m[1] === "api" ? `#${m[2]}` : `${m[1]}#${m[2]}`;
    const merged = /✅|✓|\bmerged\b/i.test(line);
    const prev = prs.get(key);
    prs.set(key, { merged: merged || !!prev?.merged, text: prev?.text ?? clip(plain(line.replace(/^\s*(- |\d+\. )/, "")), 90) });
  }
}
const merged = [...prs.values()].filter((p) => p.merged).length;

const firstLine = intro.split("\n").find((l) => plain(l).length > 20) ?? sections[0]?.body.split("\n")[0] ?? "";
const goalLine = plain(firstLine.replace(/^\s*(- |\d+\. )/, ""));
const plan = find(/plan|next|steps|solution|todo/i);
const steps = (plan ? topItems(plan.body) : topItems(intro)).filter((s) => !/^(done\b|✅)/i.test(s) && !/✅/.test(s)).slice(0, 6);
const impactSec = find(/impact|result/i);
const impact = impactSec ? topItems(impactSec.body).slice(0, 6) : [];
const problem = find(/problem|why/i);

const prState = (p: { merged: boolean }) => (p.merged ? "merged" : "open");
const seed = {
  steps: steps.map((s, i) => ({ step: clip(s, 130), detail: "", state: i ? "next" : "now" })),
  impact: impact.map((s) => {
    const [label, ...rest] = s.split(":");
    const hasLabel = rest.length > 0 && label.length < 60;
    return { measure: hasLabel ? label : "", value: clip(hasLabel ? rest.join(":").trim() : s, 180) };
  }),
  prs: [...prs].map(([k, p]) => ({ pr: `#${k.split("#")[1]}`, repo: k.startsWith("#") ? "api" : k.split("#")[0], state: prState(p), note: p.text })),
};
await Bun.write(`content/dashboards/${slug}.json`, JSON.stringify(seed, null, 1));

let out = `# ${title}\n\n${clip(goalLine, 260)}\n\n`;
const problemLine = problem ? plain(problem.body.split("\n").find((l) => plain(l)) ?? "").replace(/^- /, "") : "";
if (problem && !goalLine.startsWith(problemLine.slice(0, 40))) out += `<div class="callout">\n\n**Problem.** ${clip(problemLine, 300)}\n\n</div>\n\n`;
out += `{{dashboard:${slug}}}\n\n`;
out += `## Details\n\n`;
if (intro.trim()) out += `<details>\n<summary>Overview</summary>\n\n${intro.trim()}\n\n</details>\n\n`;
for (const s of sections) out += `<details>\n<summary>${esc(s.title)}</summary>\n\n${s.body.replace(/^###/gm, "####")}\n\n</details>\n\n`;
await Bun.write(`content/workstreams/${slug}.md`, out);
console.log(JSON.stringify({ slug: `workstreams/${slug}`, path: `workstreams/${slug}`, title, notion: id }));
