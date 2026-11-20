import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "./lib/render.ts";
import { CHAPTERS as BASE_CHAPTERS, TODO, type Chapter, type Page } from "./lib/site.ts";
import { layout, editor, denied } from "./lib/views.ts";
import { arrange, move, toSaved, type Saved } from "./lib/layout.ts";

const ROOT = import.meta.dir;
const DATA = process.env.HOSTING_DATA_DIR ?? join(ROOT, ".data");
const OWNERS: string[] = JSON.parse(readFileSync(join(ROOT, "content/access.json"), "utf8")).owners.map((e: string) => e.toLowerCase());

export type Share = { mode: "private" | "reducto" | "people"; emails: string[] };

const sharesFile = join(DATA, "shares.json");
const customFile = join(DATA, "custom-pages.json");
type Custom = Page & { chapter: number };
const readCustom = (): Custom[] => (existsSync(customFile) ? JSON.parse(readFileSync(customFile, "utf8")) : []);
const layoutFile = join(DATA, "layout.json");
const readLayout = (): Saved => (existsSync(layoutFile) ? JSON.parse(readFileSync(layoutFile, "utf8")) : []);
function chapters(): Chapter[] {
  const custom = readCustom();
  const saved = readLayout();
  const defaults: Chapter[] = [
    ...BASE_CHAPTERS.map((c) => ({ ...c, pages: [...c.pages, ...custom.filter((p) => p.chapter === c.number)] })),
    ...saved.filter((s) => !BASE_CHAPTERS.some((c) => c.number === s.number)).map((s) => ({ number: s.number, title: s.title, pages: custom.filter((p) => p.chapter === s.number) })),
  ];
  return arrange(defaults, saved);
}
function saveLayout(cs: Chapter[]) {
  mkdirSync(DATA, { recursive: true });
  writeFileSync(layoutFile, JSON.stringify(toSaved(cs), null, 2));
  queueMicrotask(() => broadcast("*"));
}
const pages = (): Page[] => [TODO, ...chapters().flatMap((c) => c.pages)];
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function addPage(chapter: number, title: string): Page | null {
  const c = chapters().find((x) => x.number === chapter);
  const name = slugify(title);
  if (!c || !name) return null;
  const dir = BASE_CHAPTERS.find((x) => x.number === chapter)?.pages[0].slug.split("/")[0] ?? slugify(c.title);
  const page: Custom = { chapter, slug: `${dir}/${name}`, path: `${dir}/${name}`, title: title.trim() };
  if (pages().some((p) => p.slug === page.slug)) return null;
  mkdirSync(DATA, { recursive: true });
  writeFileSync(customFile, JSON.stringify([...readCustom(), page], null, 2));
  queueMicrotask(() => broadcast("*"));
  return page;
}
const readShares = (): Record<string, Share> => (existsSync(sharesFile) ? JSON.parse(readFileSync(sharesFile, "utf8")) : {});
const shareOf = (slug: string): Share => readShares()[slug] ?? { mode: "private", emails: [] };

const repoFile = (slug: string) => join(ROOT, "content", `${slug}.md`);
const editedFile = (slug: string) => join(DATA, "pages", `${slug}.md`);
const historyDir = (slug: string) => join(DATA, "history", slug);

function source(slug: string): { markdown: string; edited: boolean } {
  const f = editedFile(slug);
  if (existsSync(f)) return { markdown: readFileSync(f, "utf8"), edited: true };
  if (existsSync(repoFile(slug))) return { markdown: readFileSync(repoFile(slug), "utf8"), edited: false };
  const title = pages().find((p) => p.slug === slug)?.title ?? slug;
  return { markdown: `# ${title}\n\nWrite here.\n`, edited: false };
}

function history(slug: string) {
  const dir = historyDir(slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, 30)
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as { at: string; by: string; file: string });
}

const listeners = new Set<ReadableStreamDefaultController<string>>();
function broadcast(slug: string) {
  for (const c of listeners) { try { c.enqueue(`data: ${JSON.stringify({ slug })}\n\n`); } catch { listeners.delete(c); } }
}
setInterval(() => { for (const c of listeners) { try { c.enqueue(": ping\n\n"); } catch { listeners.delete(c); } } }, 20000);

function save(slug: string, markdown: string, by: string) {
  queueMicrotask(() => broadcast(slug));
  const at = new Date().toISOString();
  const stamp = at.replace(/[:.]/g, "-");
  mkdirSync(join(DATA, "pages", slug, ".."), { recursive: true });
  mkdirSync(historyDir(slug), { recursive: true });
  writeFileSync(editedFile(slug), markdown);
  writeFileSync(join(historyDir(slug), `${stamp}.md`), markdown);
  writeFileSync(join(historyDir(slug), `${stamp}.json`), JSON.stringify({ at, by, file: `${stamp}.md` }));
}

const tokenFile = join(DATA, "agent-token");
function agentToken(): string {
  if (process.env.WIKI_AGENT_TOKEN) return process.env.WIKI_AGENT_TOKEN;
  if (!existsSync(tokenFile)) {
    mkdirSync(DATA, { recursive: true });
    writeFileSync(tokenFile, crypto.randomUUID() + crypto.randomUUID(), { mode: 0o600 });
  }
  return readFileSync(tokenFile, "utf8").trim();
}
const TOKEN = agentToken();
const email = (req: Request) => {
  const auth = req.headers.get("authorization") ?? "";
  if (auth === `Bearer ${TOKEN}`) return `agent:${(req.headers.get("x-agent-name") ?? "devin").replace(/[^\w.@-]/g, "").slice(0, 60)}`;
  return (req.headers.get("x-reducto-user-email") ?? process.env.WIKI_DEV_EMAIL ?? "").toLowerCase();
};
const isOwner = (who: string) => OWNERS.includes(who) || who.startsWith("agent:");
const canRead = (who: string, slug: string) => {
  if (isOwner(who)) return true;
  const s = shareOf(slug);
  return (s.mode === "reducto" && who !== "") || (s.mode === "people" && s.emails.includes(who));
};

function basePath(pathname: string): string {
  if (process.env.HOSTING_BASE_PATH) return process.env.HOSTING_BASE_PATH.replace(/\/?$/, "/");
  const m = pathname.match(/^\/(?:internal|external)\/jean-wiki\//);
  return m ? m[0] : "/";
}

const html = (body: string, status = 200) => new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
const json = (body: unknown, status = 200) => Response.json(body, { status });

if (process.env.NOTION_TOKEN) {
  const { refresh } = await import("./lib/notiondb.ts");
  const tick = () => refresh(process.env.NOTION_TOKEN!).then((changed) => changed && broadcast("*")).catch((e) => console.error("notion refresh:", e.message));
  tick();
  setInterval(tick, 20000);
}

if (process.env.WIKI_GIT_SYNC) {
  const git = async (...args: string[]) => {
    const p = Bun.spawn(["git", ...args], { cwd: ROOT, stdout: "pipe", stderr: "ignore", timeout: 20000 });
    const out = await new Response(p.stdout).text();
    await p.exited;
    return out.trim();
  };
  let pulling = false;
  setInterval(async () => {
    if (pulling) return;
    pulling = true;
    try {
      const before = await git("rev-parse", "HEAD");
      await git("pull", "--ff-only", "-q", process.env.WIKI_GIT_SYNC!, "main");
      if ((await git("rev-parse", "HEAD")) !== before) broadcast("*");
    } finally {
      pulling = false;
    }
  }, 30000);
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  idleTimeout: 0,
  async fetch(req) {
    const url = new URL(req.url);
    const base = basePath(url.pathname);
    const path = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname.replace(/^\//, "");
    const who = email(req);

    if (path.startsWith("static/")) {
      const file = Bun.file(join(ROOT, "public", path.slice("static/".length).replace(/\.\./g, "")));
      return (await file.exists()) ? new Response(file) : new Response("Not found", { status: 404 });
    }

    if (path.startsWith("api/")) {
      if (req.method === "POST" && path === "api/new-page") {
        if (!isOwner(who)) return json({ error: "only the wiki owner can do this" }, 403);
        const { chapter, title } = await req.json();
        const page = addPage(Number(chapter), String(title ?? ""));
        return page ? json({ ok: true, path: page.path }) : json({ error: "pick a new, non-empty title" }, 400);
      }
      if (req.method === "POST" && path === "api/new-section") {
        if (!isOwner(who)) return json({ error: "only the wiki owner can do this" }, 403);
        const title = String((await req.json()).title ?? "").trim();
        const cs = chapters();
        if (!slugify(title) || cs.some((c) => c.title.toLowerCase() === title.toLowerCase())) return json({ error: "pick a new, non-empty title" }, 400);
        const number = Math.max(0, ...cs.map((c) => c.number)) + 1;
        saveLayout([...cs, { number, title, pages: [] }]);
        return json({ ok: true, chapter: number });
      }
      if (req.method === "POST" && path === "api/remove-section") {
        if (!isOwner(who)) return json({ error: "only the wiki owner can do this" }, 403);
        const { chapter } = await req.json();
        const cs = chapters();
        const c = cs.find((x) => x.number === Number(chapter));
        if (!c || c.pages.length) return json({ error: "only an empty section can be removed" }, 400);
        saveLayout(cs.filter((x) => x !== c));
        return json({ ok: true });
      }
      if (req.method === "POST" && path === "api/move") {
        if (!isOwner(who)) return json({ error: "only the wiki owner can do this" }, 403);
        const { slug, chapter, index } = await req.json();
        const cs = move(chapters(), String(slug), Number(chapter), Number(index ?? Infinity));
        if (!cs) return json({ error: "unknown page or section" }, 400);
        saveLayout(cs);
        return json({ ok: true });
      }
      if (req.method === "GET" && path === "api/events") {
        if (!who) return json({ error: "sign in" }, 403);
        let ctl: ReadableStreamDefaultController<string>;
        const stream = new ReadableStream<string>({ start(c) { ctl = c; listeners.add(c); c.enqueue(": open\n\n"); }, cancel() { listeners.delete(ctl); } });
        return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" } });
      }
      if (req.method === "GET" && path === "api/pages") {
        if (!isOwner(who)) return json({ error: "only the wiki owner can do this" }, 403);
        return json({ pages: pages().map((p) => ({ slug: p.slug, path: p.path, title: p.title })), chapters: chapters().map((c) => ({ number: c.number, title: c.title })) });
      }
      const slug = url.searchParams.get("page") ?? "";
      const page = pages().find((p) => p.slug === slug);
      if (!page) return json({ error: "unknown page" }, 404);
      if (!isOwner(who)) return json({ error: "only the wiki owner can do this" }, 403);
      if (req.method === "POST" && path === "api/preview") {
        const { markdown } = await req.json();
        return json({ html: render(markdown, base).html });
      }
      if (req.method === "GET" && path === "api/page") return json(source(slug));
      if (req.method === "POST" && path === "api/save") {
        const { markdown } = await req.json();
        if (typeof markdown !== "string") return json({ error: "markdown required" }, 400);
        save(slug, markdown, who);
        return json({ ok: true });
      }
      if (req.method === "GET" && path === "api/version") {
        const file = url.searchParams.get("file") ?? "";
        const f = file === "repo" ? repoFile(slug) : join(historyDir(slug), file.replace(/[^\w.-]/g, ""));
        return existsSync(f) ? json({ markdown: readFileSync(f, "utf8") }) : json({ error: "not found" }, 404);
      }
      if (req.method === "POST" && path === "api/share") {
        const body = (await req.json()) as Share;
        const shares = readShares();
        shares[slug] = { mode: body.mode, emails: (body.emails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean) };
        mkdirSync(DATA, { recursive: true });
        writeFileSync(sharesFile, JSON.stringify(shares, null, 2));
        return json({ ok: true, share: shares[slug] });
      }
      return json({ error: "not found" }, 404);
    }

    const page = pages().find((p) => p.path === path || p.path === `${path}/`);
    if (!page) return html(layout({ base, page: TODO, nav: navFor(who), body: "<h1>Not found</h1>", headings: [], owner: false }), 404);
    if (!canRead(who, page.slug)) return html(denied(base, who), 403);

    const { markdown, edited } = source(page.slug);
    if (url.searchParams.has("edit") && isOwner(who)) {
      return html(editor({ base, page, markdown, edited, history: history(page.slug), share: shareOf(page.slug) }));
    }
    const { html: body, headings } = render(markdown, base);
    return html(layout({ base, page, nav: navFor(who), body, headings, owner: isOwner(who), share: shareOf(page.slug) }));
  },
});

function navFor(who: string) {
  const visible = (p: Page) => canRead(who, p.slug);
  return { todo: visible(TODO) ? TODO : null, chapters: chapters().map((c) => ({ ...c, pages: c.pages.filter(visible) })).filter((c) => c.pages.length || isOwner(who)) };
}

console.log(`jean-wiki on :${server.port}`);
