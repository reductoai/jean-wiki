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
