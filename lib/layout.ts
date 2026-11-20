import type { Chapter, Page } from "./site.ts";

/** Saved sidebar order: one entry per section, its slugs top to bottom, which page each nested slug sits under, and subsection titles. */
export type Saved = { number: number; title: string; slugs: string[]; under?: Record<string, string>; subs?: Record<string, string> }[];

export const isSub = (slug: string) => slug.startsWith("§");

/** Keep one level of nesting, under a top-level item of the same section, and list each item's children right after it. */
export function tidy(pages: Page[]): Page[] {
  const top = new Set(pages.filter((p) => !p.parent).map((p) => p.slug));
  const fixed = pages.map((p) => (p.parent && (!top.has(p.parent) || p.parent === p.slug || p.sub) ? { ...p, parent: undefined } : p));
  return fixed.filter((p) => !p.parent).flatMap((t) => [t, ...fixed.filter((p) => p.parent === t.slug)]);
}

export function arrange(defaults: Chapter[], saved: Saved): Chapter[] {
  if (!saved.length) return defaults;
  const bySlug = new Map(defaults.flatMap((c) => c.pages).map((p) => [p.slug, p]));
  const placed = new Set<string>();
  const out: Chapter[] = [
    ...saved.map((s) => ({ number: s.number, title: s.title, pages: [] as Page[] })),
    ...defaults.filter((d) => !saved.some((s) => s.number === d.number)).map((d) => ({ ...d, pages: [] as Page[] })),
  ];
  for (const s of saved) {
    const c = out.find((o) => o.number === s.number)!;
    for (const slug of s.slugs) {
      if (placed.has(slug)) continue;
      const p = isSub(slug) ? { slug, path: "", title: s.subs?.[slug] ?? "Subsection", sub: true } : bySlug.get(slug);
      if (!p) continue;
      c.pages.push(s.under?.[slug] ? { ...p, parent: s.under[slug] } : p);
      placed.add(slug);
    }
  }
  for (const d of defaults) {
    for (const p of d.pages) {
      if (placed.has(p.slug)) continue;
      (out.find((o) => o.number === d.number) ?? out[out.length - 1]).pages.push(p);
      placed.add(p.slug);
    }
  }
  return out.map((c) => ({ ...c, pages: tidy(c.pages) }));
}

/** Move a page (with its children) to `index` in section `to`, nested under `parent` when given. */
export function move(chapters: Chapter[], slug: string, to: number, index: number, parent?: string): Chapter[] | null {
  const from = chapters.find((c) => c.pages.some((p) => p.slug === slug));
  const target = chapters.find((c) => c.number === to);
  if (!from || !target) return null;
  const page = from.pages.find((p) => p.slug === slug)!;
  const kids = from.pages.filter((p) => p.parent === slug);
  if (parent) {
    const host = target.pages.find((p) => p.slug === parent);
    if (!host || host.parent || parent === slug || page.sub || kids.length) return null;
  }
  const group = [{ ...page, parent: parent || undefined }, ...kids];
  const out = chapters.map((c) => ({ ...c, pages: c.pages.filter((p) => p.slug !== slug && p.parent !== slug) }));
  const t = out.find((c) => c.number === to)!;
  t.pages.splice(Math.max(0, Math.min(index, t.pages.length)), 0, ...group);
  return out.map((c) => ({ ...c, pages: tidy(c.pages) }));
}

export const toSaved = (chapters: Chapter[]): Saved =>
  chapters.map((c) => ({
    number: c.number,
    title: c.title,
    slugs: c.pages.map((p) => p.slug),
    under: Object.fromEntries(c.pages.filter((p) => p.parent).map((p) => [p.slug, p.parent!])),
    subs: Object.fromEntries(c.pages.filter((p) => p.sub).map((p) => [p.slug, p.title])),
  }));
