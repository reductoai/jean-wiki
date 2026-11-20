(() => {
  const NODES = {
    flag: { x: 20, y: 20, w: 150, label: "Share flag", sub: "PostHog", info: "Per app and region, the share flag sets what percent of calls go through the router. At 0 the app calls Modal directly." },
    worker: { x: 20, y: 160, w: 150, label: "App worker", sub: "router client", info: "Before each model call, the worker asks the router for a seat with /admit, then calls the place the router picked and returns the lease." },
    router: { x: 270, y: 160, w: 170, label: "Router", sub: "admit queue", info: "A Go service on its own nodes in each environment. It grants a seat when a GPU or a ready Modal container has room, and queues the call otherwise." },
    valkey: { x: 270, y: 300, w: 170, label: "Valkey", sub: "queue, leases, caps", info: "Each environment has its own Valkey. It holds the queue, the leases and the caps. Only pods with the Valkey token reach it." },
    controller: { x: 540, y: 300, w: 170, label: "Controller", sub: "caps and floors", info: "Reads capacity from the GPU clusters and Modal, writes the caps the router admits against, and sets each Modal app's target and floor." },
    gpu: { x: 540, y: 40, w: 170, label: "Reducto GPUs", sub: "our clusters", info: "Our own GPU clusters. Cheapest seats, so the router fills them first." },
    modal: { x: 540, y: 160, w: 170, label: "Modal", sub: "warm containers", info: "Modal containers take what our GPUs cannot. Floors keep a few warm; the controller raises the target when the queue grows." },
  };
  const H = 56;
  const c = (n) => [NODES[n].x + NODES[n].w / 2, NODES[n].y + H / 2];
  const EDGES = {
    share: ["flag", "worker"], admit: ["worker", "router"], state: ["router", "valkey"], caps: ["controller", "valkey"],
    readGpu: ["gpu", "controller"], scale: ["controller", "modal"], callGpu: ["worker", "gpu"], callModal: ["worker", "modal"],
  };
  const SCENARIOS = {
    "A GPU has room": [
      ["share", "The share flag sends this call through the router."],
      ["admit", "The worker asks the router for a seat."],
      ["state", "The router checks the caps in Valkey and finds a free GPU seat."],
      ["callGpu", "The worker runs the call on our GPU and returns the lease."],
    ],
    "Burst": [
      ["admit", "Many calls arrive at once and ask for seats."],
      ["state", "Our GPUs are full, so the router queues the calls in Valkey."],
      ["scale", "The controller sees the queue and raises the Modal target."],
      ["callModal", "Calls get seats on ready Modal containers as they free up."],
    ],
    "Admit deadline": [
      ["admit", "A call waits in the router queue."],
      ["state", "No seat frees up before the admit deadline (23 s for R-1)."],
      ["callModal", "The worker falls back and calls Modal directly. This counts as a fallback."],
    ],
  };
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent?.appendChild(e);
    return e;
  };
  function path(name) {
    const [a, b] = EDGES[name];
    const [x1, y1] = c(a), [x2, y2] = c(b);
    if (name === "callGpu") return `M${x1 + 40} ${y1 - H / 2} C ${x1 + 60} 60, 420 60, ${NODES.gpu.x} ${y2}`;
    if (name === "callModal") return `M${x1 + 75} ${y1 + 10} C 230 260, 470 260, ${NODES.modal.x} ${y2 + 14}`;
    if (name === "readGpu") return `M${NODES.gpu.x + NODES.gpu.w} ${y1} C 760 ${y1}, 760 ${y2}, ${NODES.controller.x + NODES.controller.w} ${y2}`;
    return `M${x1} ${y1} L${x2} ${y2}`;
  }
  function build(root) {
    root.innerHTML = "";
    const bar = document.createElement("div");
    bar.className = "diagram-bar";
    const svg = el("svg", { viewBox: "0 0 770 380", role: "img", "aria-label": "Inference router diagram" }, root);
    root.prepend(bar);
    const caption = document.createElement("p");
    caption.className = "diagram-caption";
    caption.textContent = "Click a part, or play a scenario.";
    root.appendChild(caption);
    el("defs", {}, svg).innerHTML = '<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker>';
    const edges = {};
    for (const name in EDGES) edges[name] = el("path", { d: path(name), class: "edge", "marker-end": "url(#arrow)" }, svg);
    const nodes = {};
    for (const [id, n] of Object.entries(NODES)) {
      const g = el("g", { class: "node", tabindex: 0 }, svg);
      el("rect", { x: n.x, y: n.y, width: n.w, height: H, rx: 10 }, g);
      el("text", { x: n.x + n.w / 2, y: n.y + 24, class: "label" }, g).textContent = n.label;
      el("text", { x: n.x + n.w / 2, y: n.y + 42, class: "sub" }, g).textContent = n.sub;
      const show = () => { clear(); g.classList.add("on"); caption.innerHTML = `<b>${n.label}.</b> ${n.info}`; };
      g.addEventListener("click", show);
      g.addEventListener("keydown", (e) => e.key === "Enter" && show());
      nodes[id] = g;
    }
    const dot = el("circle", { r: 6, class: "dot", opacity: 0 }, svg);
    let run = 0;
    function clear() {
      run++;
      Object.values(nodes).forEach((g) => g.classList.remove("on"));
      Object.values(edges).forEach((e) => e.classList.remove("on"));
      dot.setAttribute("opacity", 0);
      bar.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
    }
    async function play(name, button) {
      clear();
      button.classList.add("on");
      const me = run;
      for (const [edge, text] of SCENARIOS[name]) {
        if (me !== run) return;
        Object.values(edges).forEach((e) => e.classList.remove("on"));
        edges[edge].classList.add("on");
        EDGES[edge].forEach((n) => nodes[n].classList.add("on"));
        caption.textContent = text;
        const p = edges[edge], len = p.getTotalLength();
        dot.setAttribute("opacity", 1);
        for (let t = 0; t <= 1 && me === run; t += 0.025) {
          const pt = p.getPointAtLength(len * t);
          dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
          await new Promise((r) => setTimeout(r, 22));
        }
        await new Promise((r) => setTimeout(r, 900));
        EDGES[edge].forEach((n) => nodes[n].classList.remove("on"));
      }
      if (me === run) dot.setAttribute("opacity", 0);
    }
    for (const name in SCENARIOS) {
      const b = document.createElement("button");
      b.textContent = `▶ ${name}`;
      b.onclick = () => play(name, b);
      bar.appendChild(b);
    }
  }
  window.renderDiagrams = (scope = document) => scope.querySelectorAll('.diagram[data-diagram="router"]').forEach(build);
  window.renderDiagrams();
})();
