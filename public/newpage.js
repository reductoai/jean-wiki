(() => {
  const B = window.WIKI_BASE;
  const post = (p, body) => fetch(`${B}api/${p}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
  document.addEventListener("click", async (e) => {
    const np = e.target.closest(".new-page"), ns = e.target.closest(".new-section"), rm = e.target.closest(".remove-section");
    if (np) {
      const title = prompt("New page title");
      if (!title) return;
      const d = await post("new-page", { chapter: np.dataset.chapter, title });
      if (d.ok) location.href = `${B}${d.path}?edit`; else alert(d.error);
    } else if (ns) {
      const title = prompt("New section title");
      if (!title) return;
      const d = await post("new-section", { title });
      if (!d.ok) alert(d.error);
    } else if (nsub) {
      const title = prompt("New subsection title");
      if (!title) return;
      const d = await post("new-subsection", { chapter: Number(nsub.dataset.chapter), title });
      if (!d.ok) alert(d.error);
    } else if (rsub) {
      e.preventDefault();
      const d = await post("remove-subsection", { slug: rsub.dataset.slug });
      if (!d.ok) alert(d.error);
    } else if (rm) {
      const d = await post("remove-section", { chapter: Number(rm.dataset.chapter) });
      if (!d.ok) alert(d.error);
    }
  });

  let dragged = null;
  const partAt = (e) => e.target.closest?.("nav.side .part[data-chapter]");
  const isChild = (el) => el.dataset.parent !== undefined;
  // Where a drop lands: before an item (taking its parent), or nested under a top-level item when over its middle.
  const spot = (part, y) => {
    const slug = dragged.dataset.slug;
    const items = [...part.querySelectorAll("[data-slug]:not(button)")].filter((a) => a !== dragged && a.dataset.parent !== slug);
    const canNest = !dragged.classList.contains("subhead") && !document.querySelector(`nav.side [data-parent="${CSS.escape(slug)}"]`);
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (y < r.top + r.height * 0.3) return { items, i, parent: items[i].dataset.parent };
      if (y < r.top + r.height * 0.7 && canNest && !isChild(items[i])) {
        let end = i + 1;
        while (items[end] && items[end].dataset.parent === items[i].dataset.slug) end++;
        return { items, i: end, parent: items[i].dataset.slug, host: items[i] };
      }
      if (y < r.bottom && isChild(items[i]) && !(items[i + 1] && items[i + 1].dataset.parent === items[i].dataset.parent)) return { items, i: i + 1, parent: items[i].dataset.parent };
    }
    return { items, i: items.length };
  };
  const clear = () => {
    document.querySelectorAll(".drop-here").forEach((x) => x.remove());
    document.querySelectorAll(".part.over, .nest-target").forEach((x) => x.classList.remove("over", "nest-target"));
  };
  document.addEventListener("dragstart", (e) => {
    const a = e.target.closest?.("nav.side [data-slug][draggable]");
    if (!a) return;
    dragged = a;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", a.dataset.slug);
    a.classList.add("dragging");
  });
  document.addEventListener("dragend", () => {
    dragged?.classList.remove("dragging");
    dragged = null;
    clear();
  });
  document.addEventListener("dragover", (e) => {
    const part = partAt(e);
    if (!part || !dragged) return;
    e.preventDefault();
    clear();
    part.classList.add("over");
    const { items, i, parent, host } = spot(part, e.clientY);
    if (host) return host.classList.add("nest-target");
    const mark = Object.assign(document.createElement("div"), { className: `drop-here${parent ? " child" : ""}` });
    if (items[i]) items[i].before(mark);
    else (part.querySelector(".section-tools") ?? part.lastChild).before(mark);
  });
  document.addEventListener("drop", async (e) => {
    const part = partAt(e);
    if (!part || !dragged) return;
    e.preventDefault();
    const { i, parent } = spot(part, e.clientY);
    const d = await post("move", { slug: dragged.dataset.slug, chapter: Number(part.dataset.chapter), index: i, parent });
    clear();
    if (!d.ok) alert(d.error);
  });
})();
