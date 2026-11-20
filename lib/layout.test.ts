import { expect, test } from "bun:test";
import { arrange, move, toSaved } from "./layout.ts";

const pg = (slug: string) => ({ slug, path: slug, title: slug });
const defaults = [
  { number: 1, title: "Router", pages: [pg("r/a"), pg("r/b")] },
  { number: 2, title: "Workstreams", pages: [pg("w/c"), pg("w/d")] },
];

test("a moved page stays in its new section, and pages added later keep their default section", () => {
  const moved = move(defaults, "w/d", 1, 0)!;
  const saved = toSaved([...moved, { number: 3, title: "Ideas", pages: [] }]);
  const later = [defaults[0], { ...defaults[1], pages: [...defaults[1].pages, pg("w/e")] }];
  const cs = arrange(later, saved);
  expect(cs.map((c) => c.title)).toEqual(["Router", "Workstreams", "Ideas"]);
  expect(cs[0].pages.map((p) => p.slug)).toEqual(["w/d", "r/a", "r/b"]);
  expect(cs[1].pages.map((p) => p.slug)).toEqual(["w/c", "w/e"]);
  expect(cs[2].pages).toEqual([]);
});

test("moving within a section reorders it and unknown targets are refused", () => {
  expect(move(defaults, "r/a", 1, 1)![0].pages.map((p) => p.slug)).toEqual(["r/b", "r/a"]);
  expect(move(defaults, "r/a", 9, 0)).toBeNull();
  expect(move(defaults, "nope", 1, 0)).toBeNull();
});

test("pages nest under a page or a subsection, move with their parent, and survive a save", () => {
  const withSub = [{ ...defaults[0], pages: [...defaults[0].pages, { slug: "§x", path: "", title: "Active", sub: true }] }, defaults[1]];
  let cs = move(withSub, "w/c", 1, 3, "§x")!;
  cs = move(cs, "w/d", 1, 1, "r/a")!;
  expect(cs[0].pages.map((p) => [p.slug, p.parent])).toEqual([["r/a", undefined], ["w/d", "r/a"], ["r/b", undefined], ["§x", undefined], ["w/c", "§x"]]);
  cs = arrange([{ ...defaults[0], pages: [...defaults[0].pages] }, { ...defaults[1] }], toSaved(cs));
  expect(cs[0].pages.find((p) => p.slug === "§x")?.title).toBe("Active");
  cs = move(cs, "r/a", 2, 0)!;
  expect(cs[1].pages.map((p) => [p.slug, p.parent])).toEqual([["r/a", undefined], ["w/d", "r/a"]]);
  expect(move(cs, "r/a", 1, 0, "r/b")).toBeNull();
});
