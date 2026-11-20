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
    } else if (rm) {
      const d = await post("remove-section", { chapter: Number(rm.dataset.chapter) });
      if (!d.ok) alert(d.error);
    }
  });

  let dragged = null;
  const partAt = (e) => e.target.closest?.("nav.side .part[data-chapter]");
  const spot = (part, y) => {
    const links = [...part.querySelectorAll("a[data-slug]")].filter((a) => a !== dragged);
    const i = links.findIndex((a) => { const r = a.getBoundingClientRect(); return y < r.top + r.height / 2; });
    return { links, i: i < 0 ? links.length : i };
  };
  const clear = () => {
    document.querySelectorAll(".drop-here").forEach((x) => x.remove());
    document.querySelectorAll(".part.over").forEach((x) => x.classList.remove("over"));
  };
  document.addEventListener("dragstart", (e) => {
    const a = e.target.closest?.("nav.side a[data-slug]");
    if (!a) return;
    dragged = a;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", a.dataset.slug);
    a.classList.add("dragging");
  });
  document.addEventListener("dragend", () => { dragged?.classList.remove("dragging"); dragged = null; clear(); });
  document.addEventListener("dragover", (e) => {
    const part = partAt(e);
    if (!part || !dragged) return;
    e.preventDefault();
    document.querySelectorAll(".part.over").forEach((x) => x !== part && x.classList.remove("over"));
    part.classList.add("over");
    const { links, i } = spot(part, e.clientY);
    const mark = document.querySelector(".drop-here") ?? Object.assign(document.createElement("div"), { className: "drop-here" });
    if (links[i]) links[i].before(mark);
    else (part.querySelector(".section-tools") ?? part.lastChild).before(mark);
  });
  document.addEventListener("drop", async (e) => {
    const part = partAt(e);
    if (!part || !dragged) return;
    e.preventDefault();
    const { i } = spot(part, e.clientY);
    const d = await post("move", { slug: dragged.dataset.slug, chapter: Number(part.dataset.chapter), index: i });
    clear();
    if (!d.ok) alert(d.error);
  });
})();
