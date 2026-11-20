import type { Heading } from "./render.ts";
import type { Chapter, Page, Source } from "./site.ts";


type Share = { mode: "private" | "reducto" | "people"; emails: string[] };
type Nav = { todo: Page | null; chapters: Chapter[] };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const head = (base: string, title: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Jean's wiki</title>
<link rel="stylesheet" href="${base}static/wiki.css">
<script>window.WIKI_BASE=${JSON.stringify(base)}</script>
</head>`;

const shareLabel = (s?: Share) =>
  !s || s.mode === "private" ? "Private" : s.mode === "reducto" ? "Shared with Reducto" : `Shared with ${s.emails.length} ${s.emails.length === 1 ? "person" : "people"}`;

export function layout(o: { base: string; page: Page; nav: Nav; body: string; headings: Heading[]; owner: boolean; share?: Share }) {
  const { base, page, nav } = o;
  const link = (p: Page, label: string) =>
    `<a href="${base}${p.path}" class="${p.slug === page.slug ? "active" : ""}">${label}</a>`;
  const order = [nav.todo, ...nav.chapters.flatMap((c) => c.pages)].filter(Boolean) as Page[];
  const i = order.findIndex((p) => p.slug === page.slug);
  const prev = i > 0 ? order[i - 1] : null;
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : null;
  return `${head(base, page.title)}
<body>
<header class="top"><a class="brand" href="${base}">Jean's wiki</a>
${o.owner ? `<div class="actions"><span class="share-state">${shareLabel(o.share)}</span><a class="button" href="?edit">Edit and share</a></div>` : ""}
<button class="menu" aria-label="Menu" onclick="document.body.classList.toggle('nav-open')">☰</button></header>
<nav class="side">
${nav.todo ? `<div class="part">${link(nav.todo, "Todo")}</div>` : ""}
${nav.chapters.map((c) => `<div class="part"><div class="chapter">${c.number}&nbsp; ${esc(c.title)}</div>
${c.pages.map((p, j) => link(p, `<span class="num">${c.number}.${j + 1}</span> ${esc(p.title)}`)).join("\n")}
${o.owner ? `<button class="new-page" data-chapter="${c.number}">+ New page</button>` : ""}</div>`).join("\n")}
</nav>
<main><article>${o.body}${sourcesBox(page)}</article>
<footer class="pager">${prev ? `<a href="${base}${prev.path}">← ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="${base}${next.path}">${esc(next.title)} →</a>` : ""}</footer>
</main>
<aside class="toc">${o.headings.length ? `<div class="toc-title">On this page</div>${o.headings.map((h) => `<a class="d${h.depth}" href="#${h.id}">${esc(h.text)}</a>`).join("")}` : ""}</aside>
<script src="${base}static/diagram.js"></script>
<script>window.WIKI_BASE=${JSON.stringify(base)}</script><script src="${base}static/newpage.js"></script>
</body></html>`;
}

export function editor(o: { base: string; page: Page; markdown: string; edited: boolean; history: { at: string; by: string; file: string }[]; share: Share }) {
  const { base, page } = o;
  const pt = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " PT";
  return `${head(base, `Edit ${page.title}`)}
<body class="editing" data-page="${page.slug}">
<header class="top"><a class="brand" href="${base}">Jean's wiki</a><div class="actions">
<a class="button ghost" href="${base}${page.path}">Cancel</a><button class="button" id="save">Save</button></div></header>
<div class="editor">
<section class="pane"><div class="pane-title">Markdown · ${esc(page.title)}</div>
<textarea id="md" spellcheck="true">${esc(o.markdown)}</textarea>
<p class="hint"><code>{{notion:workstreams#Heading}}</code> shows a section of a synced Notion page, <code>{{diagram:router}}</code> the router diagram.</p></section>
<section class="pane"><div class="pane-title">Preview</div><article id="preview"></article></section>
<section class="pane side-pane">
<div class="pane-title">Share this page</div>
<label><input type="radio" name="mode" value="private" ${o.share.mode === "private" ? "checked" : ""}> Only me</label>
<label><input type="radio" name="mode" value="reducto" ${o.share.mode === "reducto" ? "checked" : ""}> Anyone at Reducto with the link</label>
<label><input type="radio" name="mode" value="people" ${o.share.mode === "people" ? "checked" : ""}> These people</label>
<textarea id="emails" placeholder="name@reducto.ai, one per line">${esc(o.share.emails.join("\n"))}</textarea>
<button class="button" id="share">Update sharing</button><span id="share-state"></span>
<div class="pane-title">History</div>
<a href="#" data-version="repo">Version in git</a>${o.edited ? "" : " (current)"}
${o.history.map((h) => `<a href="#" data-version="${h.file}">${pt(h.at)} · ${esc(h.by || "unknown")}</a>`).join("")}
</section></div>
<script src="${base}static/diagram.js"></script>
<script src="${base}static/editor.js"></script>
</body></html>`;
}

export function denied(base: string, who: string) {
  return `${head(base, "Private page")}<body class="denied"><main><article>
<h1>This page is private</h1><p>${who ? `You are signed in as ${esc(who)}. ` : ""}Ask Jean to share it with you.</p>
</article></main></body></html>`;
}


function sourcesBox(page: Page) {
  if (!page.sources?.length) return "";
  const group = (label: string, items: Source[]) =>
    items.length ? `<div class="src-group">${label}</div><ul>${items.map((s) => `<li><a href="${s.url}">${s.kind ? `<code>${esc(s.title)}</code>` : esc(s.title)}</a></li>`).join("")}</ul>` : "";
  return `<details class="sources"><summary>Sources</summary>${group("Notion", page.sources.filter((s) => !s.kind))}${group("Code in reductoai/api", page.sources.filter((s) => s.kind === "code"))}</details>`;
}
