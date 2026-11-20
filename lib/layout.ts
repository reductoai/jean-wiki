import type { Chapter, Page } from "./site.ts";

/** Saved sidebar order: one entry per section, listing its page slugs top to bottom. */
export type Saved = { number: number; title: string; slugs: string[] }[];

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
      const p = bySlug.get(slug);
      if (p && !placed.has(slug)) { c.pages.push(p); placed.add(slug); }
    }
  }
  for (const d of defaults) for (const p of d.pages) {
    if (placed.has(p.slug)) continue;
    (out.find((o) => o.number === d.number) ?? out[out.length - 1]).pages.push(p);
    placed.add(p.slug);
  }
  return out;
}

export function move(chapters: Chapter[], slug: string, to: number, index: number): Chapter[] | null {
  const page = chapters.flatMap((c) => c.pages).find((p) => p.slug === slug);
  if (!page || !chapters.some((c) => c.number === to)) return null;
  const out = chapters.map((c) => ({ ...c, pages: c.pages.filter((p) => p.slug !== slug) }));
  const target = out.find((c) => c.number === to)!;
  target.pages.splice(Math.max(0, Math.min(index, target.pages.length)), 0, page);
  return out;
}

export const toSaved = (chapters: Chapter[]): Saved => chapters.map((c) => ({ number: c.number, title: c.title, slugs: c.pages.map((p) => p.slug) }));
