/* =============================================================================
 * AVD on GCC High — Landing Zone Assessment Workshop
 * app.js — navigation, mini-markdown renderer, state, JSON import/export
 * Runs fully client-side; persists to localStorage; no external dependencies.
 * ========================================================================== */
(function () {
  "use strict";

  const MODULES = (window.WORKSHOP_MODULES || []).slice().sort((a, b) => a.order - b.order);
  const STORAGE_KEY = "avd-gcch-lza-assessment.v1";
  const LIBRARY_KEY = "avd-gcch-lza-assessment.library.v1";
  const SCHEMA_VERSION = "1.0.0";

  /* ---------------------------------------------------------------------- *
   * State
   * ---------------------------------------------------------------------- */
  const state = {
    engagement: "",
    activeIndex: 0,
    answers: {}, // answers[moduleId][phase][questionId] = value
    tools: {},   // tools[toolId] = { ...toolState } (e.g. bandwidth estimator)
    updatedAt: null
  };

  function ensurePath(moduleId, phase) {
    state.answers[moduleId] = state.answers[moduleId] || {};
    state.answers[moduleId][phase] = state.answers[moduleId][phase] || {};
    return state.answers[moduleId][phase];
  }

  /* ---------------------------------------------------------------------- *
   * Persistence
   * ---------------------------------------------------------------------- */
  function save(silent) {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (!silent) toast("Saved to this browser");
    } catch (e) {
      if (!silent) toast("Save failed: " + e.message, true);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state.engagement = parsed.engagement || "";
      state.answers = parsed.answers || {};
      state.tools = parsed.tools || {};
      state.activeIndex = parsed.activeIndex || 0;
      state.updatedAt = parsed.updatedAt || null;
    } catch (_) { /* ignore corrupt storage */ }
  }

  /* ---------------------------------------------------------------------- *
   * Mini Markdown renderer (headings, bold, italic, code, lists, links,
   * blockquotes, paragraphs). Escapes HTML first for safety.
   * ---------------------------------------------------------------------- */
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, (_, c) => "<code>" + c + "</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function renderMarkdown(md) {
    const lines = escapeHtml(md.replace(/\r\n/g, "\n")).split("\n");
    let html = "";
    let list = null; // 'ul' | 'ol'
    let para = [];

    const flushPara = () => {
      if (para.length) { html += "<p>" + inline(para.join(" ")) + "</p>"; para = []; }
    };
    const closeList = () => { if (list) { html += "</" + list + ">"; list = null; } };

    for (let raw of lines) {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) { flushPara(); closeList(); continue; }

      let m;
      if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
        flushPara(); closeList();
        const lvl = m[1].length;
        html += "<h" + lvl + ">" + inline(m[2]) + "</h" + lvl + ">";
      } else if ((m = line.match(/^>\s?(.*)$/))) {
        flushPara(); closeList();
        html += '<blockquote>' + inline(m[1]) + "</blockquote>";
      } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
        flushPara();
        if (list !== "ul") { closeList(); html += "<ul>"; list = "ul"; }
        html += "<li>" + inline(m[1]) + "</li>";
      } else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
        flushPara();
        if (list !== "ol") { closeList(); html += "<ol>"; list = "ol"; }
        html += "<li>" + inline(m[1]) + "</li>";
      } else {
        if (list) closeList();
        para.push(line.trim());
      }
    }
    flushPara(); closeList();
    return html;
  }

  /* ---------------------------------------------------------------------- *
   * DOM helpers
   * ---------------------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);
  function el(tag, cls, attrs) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k]));
    return n;
  }

  /* ---------------------------------------------------------------------- *
   * Progress
   * ---------------------------------------------------------------------- */
  function moduleCounts(mod) {
    const total = (mod.currentState.length + mod.toBeState.length);
    let done = 0;
    ["currentState", "toBeState"].forEach(phase => {
      mod[phase].forEach(q => { if (isAnswered(effectiveValue(mod, phase, q))) done++; });
    });
    return { done, total };
  }

  function isAnswered(v) {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return String(v).trim() !== "";
  }

  // A phase ("currentState" | "toBeState") is complete when every question in
  // that phase across all non-conclusion modules has an answer.
  function phaseComplete(phase) {
    return MODULES.filter(m => m.id !== "conclusion").every(m =>
      (m[phase] || []).every(q => isAnswered(effectiveValue(m, phase, q)))
    );
  }

  // Read a single answer (with prepopulation applied) by module/phase/question id.
  function findAnswer(moduleId, phase, questionId) {
    const m = MODULES.find(x => x.id === moduleId);
    if (!m) return null;
    const q = (m[phase] || []).find(x => x.id === questionId);
    if (!q) return null;
    return effectiveValue(m, phase, q);
  }

  /* Prepopulation: a target question may declare `default` (a static assumed
   * value) or `inheritFrom` (carry the matching current-state answer forward).
   * These provide parity with the Current State tab while letting the facilitator
   * override anything that actually changes. */
  function phaseStore(modId, phase) {
    return (state.answers[modId] && state.answers[modId][phase]) || {};
  }

  function resolveDefault(mod, q) {
    if (q.inheritFrom) {
      const cs = phaseStore(mod.id, "currentState");
      const v = cs[q.inheritFrom];
      if (v != null && !(Array.isArray(v) && v.length === 0) && String(v).trim() !== "") return v;
    }
    if (q.default !== undefined) return q.default;
    return undefined;
  }

  function effectiveValue(mod, phase, q) {
    const store = phaseStore(mod.id, phase);
    if (Object.prototype.hasOwnProperty.call(store, q.id)) return store[q.id];
    return resolveDefault(mod, q);
  }

  function isPrepopulated(mod, phase, q) {
    const store = phaseStore(mod.id, phase);
    if (Object.prototype.hasOwnProperty.call(store, q.id)) return false;
    return resolveDefault(mod, q) !== undefined;
  }

  function updateProgress() {
    let done = 0, total = 0;
    MODULES.forEach(m => { const c = moduleCounts(m); done += c.done; total += c.total; });
    const pct = total ? Math.round((done / total) * 100) : 0;
    $("#progressFill").style.width = pct + "%";
    $("#progressLabel").textContent = pct + "% complete \u2022 " + done + "/" + total + " answered";
  }

  /* ---------------------------------------------------------------------- *
   * Rail (module navigation)
   * ---------------------------------------------------------------------- */
  function renderRail() {
    const rail = $("#rail");
    rail.innerHTML = "";
    MODULES.forEach((mod, i) => {
      const c = moduleCounts(mod);
      const item = el("button", "rail__item" + (i === state.activeIndex ? " is-active" : ""));
      item.setAttribute("type", "button");
      const complete = c.total > 0 && c.done === c.total;
      item.innerHTML =
        '<span class="rail__icon">' + mod.icon + '</span>' +
        '<span class="rail__text">' +
          '<span class="rail__title">' + (i) + '. ' + mod.short + '</span>' +
          '<span class="rail__sub">' + mod.minutes + ' min</span>' +
        '</span>' +
        '<span class="rail__badge ' + (complete ? "is-complete" : "") + '">' + c.done + '/' + c.total + '</span>';
      item.addEventListener("click", () => goTo(i));
      rail.appendChild(item);
    });
  }

  /* ---------------------------------------------------------------------- *
   * Reference dock
   * ---------------------------------------------------------------------- */
  function renderDock(mod) {
    const body = $("#dockBody");
    body.innerHTML = "";
    mod.references.forEach(ref => {
      const card = el("a", "refcard");
      card.href = ref.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.innerHTML =
        '<span class="refcard__title">' + ref.title + '</span>' +
        (ref.note ? '<span class="refcard__note">' + ref.note + '</span>' : "") +
        '<span class="refcard__url">' + ref.url.replace(/^https?:\/\//, "") + '</span>';
      body.appendChild(card);
    });
  }

  /* ---------------------------------------------------------------------- *
   * Question rendering
   * ---------------------------------------------------------------------- */
  function phaseCode(phase) { return phase === "currentState" ? "C" : "T"; }
  function questionRef(mod, phase, index) { return mod.order + "." + phaseCode(phase) + (index + 1); }

  function renderQuestion(mod, phase, q, index) {
    const store = ensurePath(mod.id, phase);
    const wrap = el("div", "q");
    const label = el("label", "q__label");
    label.setAttribute("for", mod.id + "-" + phase + "-" + q.id);
    const num = el("span", "q__num");
    num.textContent = questionRef(mod, phase, index);
    label.appendChild(num);
    label.appendChild(document.createTextNode(q.label));
    if (isPrepopulated(mod, phase, q)) {
      const pf = el("span", "q__prefill");
      pf.textContent = q.inheritFrom ? "prefilled from current" : "prefilled (assumed)";
      pf.title = "Prepopulated with the assumed steady-state value. Edit to change.";
      label.appendChild(pf);
    }
    wrap.appendChild(label);
    if (q.help) { const h = el("p", "q__help"); h.textContent = q.help; wrap.appendChild(h); }

    const name = mod.id + "-" + phase + "-" + q.id;
    const initial = effectiveValue(mod, phase, q);
    const commit = (val) => { store[q.id] = val; save(true); updateProgress(); renderRail(); markPhaseMeta(mod); };

    if (q.type === "text") {
      const inp = el("input", "q__input", { type: "text", id: name });
      if (q.placeholder) inp.placeholder = q.placeholder;
      inp.value = initial || "";
      inp.addEventListener("input", () => commit(inp.value));
      wrap.appendChild(inp);

    } else if (q.type === "textarea") {
      const ta = el("textarea", "q__input q__textarea", { id: name, rows: "3" });
      if (q.placeholder) ta.placeholder = q.placeholder;
      ta.value = initial || "";
      ta.addEventListener("input", () => commit(ta.value));
      wrap.appendChild(ta);

    } else if (q.type === "select") {
      const sel = el("select", "q__input", { id: name });
      const ph = el("option"); ph.value = ""; ph.textContent = "— select —"; sel.appendChild(ph);
      q.options.forEach(o => { const op = el("option"); op.value = o; op.textContent = o; sel.appendChild(op); });
      sel.value = initial || "";
      sel.addEventListener("change", () => commit(sel.value));
      wrap.appendChild(sel);

    } else if (q.type === "radio") {
      const group = el("div", "q__options");
      q.options.forEach(o => {
        const id = name + "-" + slug(o);
        const opt = el("label", "opt");
        const r = el("input", null, { type: "radio", name: name, id: id });
        r.value = o; if (initial === o) r.checked = true;
        r.addEventListener("change", () => commit(o));
        opt.appendChild(r); opt.appendChild(document.createTextNode(o));
        group.appendChild(opt);
      });
      wrap.appendChild(group);

    } else if (q.type === "checkbox") {
      const group = el("div", "q__options");
      const current = Array.isArray(initial) ? initial.slice() : [];
      q.options.forEach(o => {
        const opt = el("label", "opt");
        const c = el("input", null, { type: "checkbox" });
        c.value = o; if (current.indexOf(o) > -1) c.checked = true;
        c.addEventListener("change", () => {
          const arr = Array.isArray(store[q.id]) ? store[q.id].slice()
            : (Array.isArray(initial) ? initial.slice() : []);
          const idx = arr.indexOf(o);
          if (c.checked && idx === -1) arr.push(o);
          if (!c.checked && idx > -1) arr.splice(idx, 1);
          commit(arr);
        });
        opt.appendChild(c); opt.appendChild(document.createTextNode(o));
        group.appendChild(opt);
      });
      wrap.appendChild(group);
    }
    return wrap;
  }

  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

  function markPhaseMeta(mod) {
    // update the little "answered" counters on phase headers if present
    document.querySelectorAll("[data-phase-meta]").forEach(node => {
      const phase = node.getAttribute("data-phase-meta");
      const total = mod[phase].length;
      let done = 0; mod[phase].forEach(q => { if (isAnswered(effectiveValue(mod, phase, q))) done++; });
      node.textContent = done + "/" + total;
    });
  }

  /* ---------------------------------------------------------------------- *
   * Module view
   * ---------------------------------------------------------------------- */
  function renderModule() {
    const mod = MODULES[state.activeIndex];
    const view = $("#moduleView");
    view.innerHTML = "";

    // Header
    const head = el("header", "module__head");
    head.innerHTML =
      '<div class="module__eyebrow">Module ' + state.activeIndex + ' of ' + (MODULES.length - 1) +
        ' \u2022 ' + mod.minutes + ' minutes</div>' +
      '<h2 class="module__title">' + mod.icon + ' ' + mod.title + '</h2>' +
      '<p class="module__tagline">' + mod.tagline + '</p>';
    view.appendChild(head);

    if (mod.id === "conclusion") {
      view.appendChild(renderConclusion(mod));
    } else {
      // Tabs
      const tabs = el("div", "tabs");
      const panels = el("div", "panels");
      const tabDefs = [
        { key: "overview", label: "Overview & Sources" },
        { key: "currentState", label: "Current State (as-is)" },
        { key: "toBeState", label: "Target State (to-be)" }
      ];
      tabDefs.forEach((t, ti) => {
        const btn = el("button", "tab" + (ti === 0 ? " is-active" : ""));
        btn.type = "button"; btn.textContent = t.label; btn.dataset.tab = t.key;
        btn.addEventListener("click", () => {
          tabs.querySelectorAll(".tab").forEach(b => b.classList.remove("is-active"));
          panels.querySelectorAll(".panel").forEach(p => p.classList.remove("is-active"));
          btn.classList.add("is-active");
          panels.querySelector('[data-panel="' + t.key + '"]').classList.add("is-active");
        });
        tabs.appendChild(btn);
      });
      view.appendChild(tabs);

      // Overview panel
      const pOverview = el("div", "panel is-active", { "data-panel": "overview" });
      const intro = el("div", "prose");
      intro.innerHTML = renderMarkdown(mod.intro);
      pOverview.appendChild(intro);
      if (mod.tool === "bandwidth") pOverview.appendChild(renderBandwidthCalculator());
      panels.appendChild(pOverview);

      // Current state panel
      panels.appendChild(buildPhasePanel(mod, "currentState",
        "Record the current (as-is) state. Fields save automatically."));
      // Target state panel
      panels.appendChild(buildPhasePanel(mod, "toBeState",
        "Record the target (to-be) state and the associated design decisions."));

      view.appendChild(panels);
    }

    renderDock(mod);
    markPhaseMeta(mod);
    $("#moduleTimer").textContent = mod.minutes + " min";
    $("#btnPrev").disabled = state.activeIndex === 0;
    $("#btnNext").disabled = state.activeIndex === MODULES.length - 1;
    view.parentElement.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildPhasePanel(mod, phase, blurb) {
    const panel = el("div", "panel", { "data-panel": phase });
    const bar = el("div", "phasebar");
    bar.innerHTML = '<p class="phasebar__blurb">' + blurb + '</p>' +
      '<span class="phasebar__meta" data-phase-meta="' + phase + '">0/0</span>';
    panel.appendChild(bar);
    const form = el("div", "form");
    mod[phase].forEach((q, i) => form.appendChild(renderQuestion(mod, phase, q, i)));
    panel.appendChild(form);
    return panel;
  }

  /* ---------------------------------------------------------------------- *
   * Bandwidth estimator (Network module Overview panel)
   * Per-user rates are Microsoft's recommended values for a single 1080p
   * monitor at 30 fps (Network guidelines / Remote Desktop workloads).
   * ---------------------------------------------------------------------- */
  const BANDWIDTH_PROFILES = [
    { key: "light",  label: "Light",  mbps: 1.5, example: "Data entry, CLI, basic LOB apps" },
    { key: "medium", label: "Medium", mbps: 3,   example: "Word, static web, consultants" },
    { key: "heavy",  label: "Heavy",  mbps: 5,   example: "Outlook, PowerPoint, dynamic web, dev" },
    { key: "power",  label: "Power",  mbps: 15,  example: "CAD/CAM, 3D, photo/video edit, ML" }
  ];

  function fmtBandwidth(mbps) {
    if (!mbps) return "0 Mbps";
    if (mbps >= 1000) return (Math.round(mbps / 100) / 10) + " Gbps";
    return (Math.round(mbps * 10) / 10) + " Mbps";
  }

  function renderBandwidthCalculator() {
    state.tools = state.tools || {};
    const data = state.tools.bandwidth = state.tools.bandwidth || {};
    data.counts = data.counts || {};
    if (typeof data.monitors !== "number") data.monitors = 1;
    if (typeof data.headroom !== "number") data.headroom = 20;

    const wrap = el("section", "calc");

    const head = el("div", "calc__head");
    head.innerHTML =
      '<h3 class="calc__title">Bandwidth estimator</h3>' +
      '<p class="calc__sub">Estimates aggregate network bandwidth for a host pool at peak concurrency. ' +
      'Per-user rates are Microsoft\u2019s recommended values for a single 1080p monitor at 30&nbsp;fps ' +
      '(<a href="https://learn.microsoft.com/en-us/windows-server/remote/remote-desktop-services/network-guidance" target="_blank" rel="noopener noreferrer">Network guidelines</a>). ' +
      'Real usage varies with resolution, frame rate, and codec \u2014 see ' +
      '<a href="https://learn.microsoft.com/en-us/azure/virtual-desktop/rdp-bandwidth" target="_blank" rel="noopener noreferrer">RDP bandwidth requirements</a>.</p>';
    wrap.appendChild(head);

    const table = el("table", "calc__table");
    const thead = el("thead");
    thead.innerHTML = '<tr><th>Workload</th><th class="calc__ex-th">Example</th>' +
      '<th class="calc__num">Per user</th><th class="calc__num">Concurrent users</th>' +
      '<th class="calc__num">Subtotal</th></tr>';
    table.appendChild(thead);
    const tbody = el("tbody");

    const subCells = {};
    let rawOut, headOut, perUserOut, usersOut;

    function recompute() {
      let raw = 0, users = 0;
      BANDWIDTH_PROFILES.forEach(p => {
        const n = Math.max(0, parseInt(data.counts[p.key], 10) || 0);
        const sub = n * p.mbps * data.monitors;
        raw += sub; users += n;
        if (subCells[p.key]) subCells[p.key].textContent = fmtBandwidth(sub);
      });
      const withHead = raw * (1 + data.headroom / 100);
      if (rawOut) rawOut.textContent = fmtBandwidth(raw);
      if (headOut) headOut.textContent = fmtBandwidth(withHead);
      if (perUserOut) perUserOut.textContent = users > 0 ? fmtBandwidth(raw / users) : "\u2014";
      if (usersOut) usersOut.textContent = users.toLocaleString();
      save(true);
    }

    BANDWIDTH_PROFILES.forEach(p => {
      const tr = el("tr");
      const tdName = el("td", "calc__wl"); tdName.textContent = p.label;
      const tdEx = el("td", "calc__ex"); tdEx.textContent = p.example;
      const tdRate = el("td", "calc__num"); tdRate.textContent = p.mbps + " Mbps";
      const tdIn = el("td", "calc__num");
      const inp = el("input", "calc__input", { type: "number", min: "0", step: "1", inputmode: "numeric" });
      inp.placeholder = "0";
      inp.value = (data.counts[p.key] != null) ? data.counts[p.key] : "";
      inp.addEventListener("input", () => { data.counts[p.key] = inp.value; recompute(); });
      tdIn.appendChild(inp);
      const tdSub = el("td", "calc__num calc__subtotal"); tdSub.textContent = "0 Mbps";
      subCells[p.key] = tdSub;
      tr.appendChild(tdName); tr.appendChild(tdEx); tr.appendChild(tdRate);
      tr.appendChild(tdIn); tr.appendChild(tdSub);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    const controls = el("div", "calc__controls");
    function control(labelText, value, min, step, onChange) {
      const lab = el("label", "calc__ctrl");
      const span = el("span", "calc__ctrl-label"); span.textContent = labelText;
      const inp = el("input", "calc__input", { type: "number", min: String(min), step: String(step), inputmode: "numeric" });
      inp.value = value;
      inp.addEventListener("input", () => onChange(inp));
      lab.appendChild(span); lab.appendChild(inp);
      controls.appendChild(lab);
    }
    control("Monitors per user", data.monitors, 1, 1, (inp) => {
      data.monitors = Math.max(1, parseInt(inp.value, 10) || 1); recompute();
    });
    control("Headroom %", data.headroom, 0, 5, (inp) => {
      data.headroom = Math.max(0, parseInt(inp.value, 10) || 0); recompute();
    });
    wrap.appendChild(controls);

    const results = el("div", "calc__results");
    function metric(labelText, accent) {
      const m = el("div", "calc__metric" + (accent ? " calc__metric--accent" : ""));
      const v = el("strong", "calc__metric-value"); v.textContent = "\u2014";
      const l = el("span", "calc__metric-label"); l.textContent = labelText;
      m.appendChild(v); m.appendChild(l);
      results.appendChild(m);
      return v;
    }
    usersOut = metric("Concurrent users");
    rawOut = metric("Raw aggregate at peak");
    headOut = metric("Plan-for capacity (with headroom)", true);
    perUserOut = metric("Average per active user");
    wrap.appendChild(results);

    const note = el("p", "calc__note");
    note.textContent = "Multi-monitor scaling is a linear approximation. Add capacity for voice/video " +
      "conferencing, 4K video, and bulk file transfers, and validate with real-user monitoring and " +
      "load tests before sizing circuits. Estimates are planning aids, not a substitute for measured bandwidth.";
    wrap.appendChild(note);

    recompute();
    return wrap;
  }

  /* ---------------------------------------------------------------------- *
   * Conclusion page + Markdown report
   * ---------------------------------------------------------------------- */
  function renderConclusion(mod) {
    const wrap = el("div", "panels");
    const panel = el("div", "panel is-active");
    const intro = el("div", "prose");
    intro.innerHTML = renderMarkdown(mod.intro);
    panel.appendChild(intro);

    const actions = el("div", "report__actions");
    const btnDl = el("button", "btn btn--primary", { type: "button" });
    btnDl.textContent = "Download Markdown (.md)";
    const btnPrev = el("button", "btn", { type: "button" });
    btnPrev.textContent = "Preview report";
    const btnCopy = el("button", "btn", { type: "button" });
    btnCopy.textContent = "Copy to clipboard";
    const btnTests = el("button", "btn", { type: "button" });
    btnTests.textContent = "Download acceptance tests (.ps1)";
    actions.appendChild(btnDl); actions.appendChild(btnPrev); actions.appendChild(btnCopy); actions.appendChild(btnTests);
    panel.appendChild(actions);

    const pre = el("pre", "report__preview");
    pre.style.display = "none";
    panel.appendChild(pre);

    btnDl.addEventListener("click", downloadMarkdown);
    btnPrev.addEventListener("click", () => {
      if (pre.style.display === "none") {
        pre.textContent = buildMarkdown();
        pre.style.display = "block";
        btnPrev.textContent = "Hide preview";
      } else {
        pre.style.display = "none";
        btnPrev.textContent = "Preview report";
      }
    });
    btnCopy.addEventListener("click", () => {
      const md = buildMarkdown();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(md).then(
          () => toast("Report copied to clipboard"),
          () => toast("Copy failed", true)
        );
      } else {
        toast("Clipboard not available", true);
      }
    });

    btnTests.addEventListener("click", downloadAcceptanceTests);

    // --- Parameterized Bicep generator ---------------------------------- *
    const gen = el("div", "gencard");
    const currentDone = phaseComplete("currentState");
    const targetDone = phaseComplete("toBeState");

    const genHead = el("div", "gencard__head");
    genHead.innerHTML =
      '<h3 class="gencard__title">Generate AVD workload (Bicep)</h3>' +
      '<p class="gencard__sub">Download a parameterized Bicep template that provisions the AVD control ' +
      'plane (host pool, application group, workspace) plus optional session hosts, with parameter ' +
      'defaults derived from your chosen input source. Credentials are <code>@secure()</code> parameters ' +
      'with no defaults \u2014 no UPNs, service principals, usernames, or passwords are written into the file.</p>';
    gen.appendChild(genHead);

    const genRow = el("div", "gencard__row");
    const sel = el("select", "q__input gencard__select", { id: "bicepSource" });
    const optW = el("option"); optW.value = "wellArchitected"; optW.textContent = "Well-Architected baseline";
    sel.appendChild(optW);
    const optC = el("option");
    optC.value = "currentState";
    optC.textContent = "Current State (as-is)" + (currentDone ? "" : " \u2014 incomplete");
    optC.disabled = !currentDone;
    sel.appendChild(optC);
    const optT = el("option");
    optT.value = "toBeState";
    optT.textContent = "Target State (to-be)" + (targetDone ? "" : " \u2014 incomplete");
    optT.disabled = !targetDone;
    sel.appendChild(optT);

    const btnBicep = el("button", "btn btn--primary", { type: "button" });
    btnBicep.innerHTML = "Download Bicep (.bicep)<span class=\"badge-preview\">Preview</span>";
    genRow.appendChild(sel);
    genRow.appendChild(btnBicep);
    const btnDeploy = el("button", "btn", { type: "button" });
    btnDeploy.innerHTML = "Deploy to Azure\u2026<span class=\"badge-preview\">Preview</span>";
    genRow.appendChild(btnDeploy);
    gen.appendChild(genRow);

    const genNote = el("p", "gencard__note");
    genNote.textContent = (currentDone && targetDone)
      ? "All phases complete \u2014 every source is available."
      : "Current State or Target State is incomplete, so only the Well-Architected baseline"
        + (currentDone ? " and Current State" : "") + (targetDone ? " and Target State" : "")
        + " can be generated. Complete every field in a phase to unlock its template.";
    gen.appendChild(genNote);

    btnBicep.addEventListener("click", () => downloadBicep(sel.value));
    btnDeploy.addEventListener("click", () => openDeployModal(sel.value));

    panel.appendChild(gen);

    wrap.appendChild(panel);
    return wrap;
  }

  function mdValue(v) {
    if (v == null) return "_(not answered)_";
    if (Array.isArray(v)) return v.length ? v.join("; ") : "_(not answered)_";
    const s = String(v).trim();
    return s === "" ? "_(not answered)_" : s;
  }

  function buildMarkdown() {
    const L = [];
    const title = state.engagement
      ? state.engagement + " \u2014 AVD Enterprise-Scale Landing Zone Assessment"
      : "AVD Enterprise-Scale Landing Zone Assessment";
    L.push("# " + title);
    L.push("");
    L.push("_Current State \u2192 Well Architected \u2192 Target State_");
    L.push("");
    L.push("Generated: " + new Date().toISOString());
    let done = 0, total = 0;
    MODULES.forEach(m => { const c = moduleCounts(m); done += c.done; total += c.total; });
    L.push("");
    L.push("Overall completion: **" + done + "/" + total + "** answered.");
    L.push("");
    L.push("---");

    MODULES.filter(m => m.id !== "conclusion").forEach(m => {
      L.push("");
      L.push("## " + m.order + ". " + m.title);
      if (m.tagline) { L.push(""); L.push("_" + m.tagline + "_"); }

      if (m.currentState && m.currentState.length) {
        L.push("");
        L.push("### Current State (as-is)");
        L.push("");
        m.currentState.forEach((q, i) => {
          L.push("- **" + questionRef(m, "currentState", i) + " " + q.label + ":** " +
            mdValue(effectiveValue(m, "currentState", q)));
        });
      }

      if (m.references && m.references.length) {
        L.push("");
        L.push("### Well-Architected references");
        L.push("");
        m.references.forEach(r => {
          L.push("- [" + r.title + "](" + r.url + ")" + (r.note ? " \u2014 " + r.note : ""));
        });
      }

      if (m.toBeState && m.toBeState.length) {
        L.push("");
        L.push("### Target State (to-be)");
        L.push("");
        m.toBeState.forEach((q, i) => {
          const flag = isPrepopulated(m, "toBeState", q) ? " _(assumed)_" : "";
          L.push("- **" + questionRef(m, "toBeState", i) + " " + q.label + ":** " +
            mdValue(effectiveValue(m, "toBeState", q)) + flag);
        });
      }

      L.push("");
      L.push("---");
    });

    return L.join("\n");
  }

  function downloadMarkdown() {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const name = "avd-eslz-assessment" +
      (state.engagement ? "-" + slug(state.engagement) : "") +
      "-" + new Date().toISOString().slice(0, 10) + ".md";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
    toast("Markdown report downloaded");
  }

  /* ---------------------------------------------------------------------- *
   * Acceptance tests (Pester) derived from target-state decisions
   * ---------------------------------------------------------------------- */
  function psEscape(s) { return String(s).replace(/'/g, "''"); }

  function buildAcceptanceTests() {
    const L = [];
    const eng = state.engagement || "AVD Enterprise-Scale Landing Zone";
    L.push("#Requires -Version 5.1");
    L.push("<#");
    L.push(".SYNOPSIS");
    L.push("  Acceptance tests derived from the target-state (to-be) decisions of the");
    L.push("  " + eng + " assessment.");
    L.push(".DESCRIPTION");
    L.push("  Pester v5 tests. Each 'It' maps to a target-state question by its reference");
    L.push("  (e.g., 1.T1). Machine-verifiable decisions are emitted as Pending so you can");
    L.push("  implement the Azure/Gov conformance check; free-text and assumed values are");
    L.push("  flagged, and questions with no recorded decision are skipped.");
    L.push("  Run: Invoke-Pester -Path .\\<file>.Tests.ps1 -Output Detailed");
    L.push("  Generated: " + new Date().toISOString());
    L.push("#>");
    L.push("");
    L.push("BeforeDiscovery {");
    L.push("    # TODO: establish context for the deployed environment under test, e.g.:");
    L.push("    # Connect-AzAccount -Environment AzureUSGovernment");
    L.push("    # Set-AzContext -Subscription '<subscription-id>'");
    L.push("}");
    L.push("");

    MODULES.filter(m => m.id !== "conclusion").forEach(m => {
      const questions = m.toBeState || [];
      if (!questions.length) return;
      L.push("Describe '" + psEscape(m.order + ". " + m.title) + "' {");
      L.push("");
      L.push("    Context 'Target State (to-be)' {");
      L.push("");
      questions.forEach((q, i) => {
        const ref = questionRef(m, "toBeState", i);
        const val = effectiveValue(m, "toBeState", q);
        const answered = isAnswered(val);
        const assumed = isPrepopulated(m, "toBeState", q);
        const closed = (q.type === "radio" || q.type === "select" || q.type === "checkbox");
        const expected = Array.isArray(val) ? val.join("; ") : (val == null ? "" : String(val));
        const name = "[" + ref + "] " + q.label + (answered ? " = " + expected : "");
        if (!answered) {
          L.push("        It '" + psEscape(name) + "' -Skip {");
          L.push("            Set-ItResult -Skipped -Because 'No target decision recorded (" + ref + ").'");
          L.push("        }");
        } else if (!closed) {
          L.push("        It '" + psEscape(name) + "' -Tag 'Manual' {");
          L.push("            # Expected (" + ref + "): " + psEscape(expected));
          L.push("            Set-ItResult -Inconclusive -Because 'Free-text / documentation decision — verify manually.'");
          L.push("        }");
        } else if (assumed) {
          L.push("        It '" + psEscape(name) + "' -Tag 'Assumed' {");
          L.push("            # Expected (" + ref + ", assumed default): " + psEscape(expected));
          L.push("            Set-ItResult -Pending -Because 'Prefilled / assumed value — confirm before enforcing.'");
          L.push("        }");
        } else {
          L.push("        It '" + psEscape(name) + "' -Tag 'Conformance' {");
          L.push("            # Expected (" + ref + "): " + psEscape(expected));
          L.push("            # TODO: assert the deployed environment matches the expected value above.");
          L.push("            Set-ItResult -Pending -Because 'Implement Azure conformance check for " + ref + ".'");
          L.push("        }");
        }
        L.push("");
      });
      L.push("    }");
      L.push("}");
      L.push("");
    });

    return L.join("\n");
  }

  function downloadAcceptanceTests() {
    const ps = buildAcceptanceTests();
    const blob = new Blob([ps], { type: "text/plain" });
    const name = "avd-eslz" +
      (state.engagement ? "-" + slug(state.engagement) : "") +
      "-acceptance-" + new Date().toISOString().slice(0, 10) + ".Tests.ps1";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
    toast("Acceptance tests downloaded");
  }

  /* ---------------------------------------------------------------------- *
   * Bicep generator — parameterized AVD workload
   * Source of parameter defaults: Well-Architected baseline, Current State,
   * or Target State. No secrets (UPNs, SPNs, usernames, passwords) are ever
   * written into the output: credential parameters are @secure() with no
   * defaults, and only non-sensitive design values are mapped from answers.
   * ---------------------------------------------------------------------- */
  const WORKLOAD_VM = {
    light:  { vmSize: "Standard_D4as_v5",  maxSession: 16, disk: "Premium_LRS", profile: "Light" },
    medium: { vmSize: "Standard_D4as_v5",  maxSession: 8,  disk: "Premium_LRS", profile: "Medium" },
    heavy:  { vmSize: "Standard_D8as_v5",  maxSession: 6,  disk: "Premium_LRS", profile: "Heavy" },
    power:  { vmSize: "Standard_D16as_v5", maxSession: 2,  disk: "Premium_LRS", profile: "Power" }
  };

  function parseConcurrent(text) {
    if (!text) return null;
    const s = String(text);
    const m = s.match(/([\d,]+)\s*concurrent/i) || s.match(/concurrent[^\d]*([\d,]+)/i);
    let n;
    if (m) {
      n = parseInt(m[1].replace(/,/g, ""), 10);
    } else {
      const all = s.match(/[\d,]+/g);
      if (all && all.length) n = parseInt(all[0].replace(/,/g, ""), 10);
    }
    return (n && n > 0) ? n : null;
  }

  function dominantWorkload() {
    const b = state.tools && state.tools.bandwidth;
    if (!b || !b.counts) return null;
    let best = null, bestN = 0;
    Object.keys(b.counts).forEach(k => {
      const n = parseInt(b.counts[k], 10) || 0;
      if (n > bestN) { bestN = n; best = k; }
    });
    return best;
  }

  function mapLocation(regionArr) {
    const map = {
      "US Gov Virginia": "usgovvirginia",
      "US Gov Arizona": "usgovarizona",
      "US Gov Texas": "usgovtexas"
    };
    if (Array.isArray(regionArr)) {
      for (let i = 0; i < regionArr.length; i++) { if (map[regionArr[i]]) return map[regionArr[i]]; }
    }
    return null;
  }

  function deriveBicepParams(source) {
    // Well-Architected baseline: cost- and performance-optimized defaults.
    const p = {
      location: "usgovvirginia",
      hostPoolName: "hp-avd-gcch",
      hostPoolType: "Pooled",
      loadBalancerType: "BreadthFirst",
      maxSessionLimit: 8,
      personalDesktopAssignmentType: "Automatic",
      workspaceName: "ws-avd-gcch",
      appGroupName: "dag-avd-gcch",
      sessionHostCount: 2,
      vmSize: "Standard_D4as_v5",
      osDiskType: "Premium_LRS",
      useFslogix: true,
      startVmOnConnect: true,
      validationEnvironment: false,
      workloadProfile: "Medium"
    };
    if (source === "wellArchitected") return p;

    // Host pool type from the current OS mix (as-is context, either source).
    const osMix = findAnswer("intro", "currentState", "current_host_os");
    if (Array.isArray(osMix) && osMix.length) {
      const multi = osMix.some(o => /multi-session/i.test(o));
      const personal = osMix.some(o => /single-session|personal/i.test(o));
      if (multi) {
        p.hostPoolType = "Pooled";
      } else if (personal) {
        p.hostPoolType = "Personal";
        p.loadBalancerType = "Persistent";
        p.maxSessionLimit = 1;
      }
    }

    // Profile solution.
    const profile = findAnswer("intro", "currentState", "current_profile_solution");
    if (profile) p.useFslogix = /fslogix/i.test(profile);

    // Workload sizing from the bandwidth estimator (dominant workload profile).
    const wl = dominantWorkload();
    if (wl && WORKLOAD_VM[wl]) {
      p.vmSize = WORKLOAD_VM[wl].vmSize;
      p.osDiskType = WORKLOAD_VM[wl].disk;
      p.workloadProfile = WORKLOAD_VM[wl].profile;
      if (p.hostPoolType === "Pooled") p.maxSessionLimit = WORKLOAD_VM[wl].maxSession;
    }

    // Concurrency → session host count.
    const scaleText = source === "toBeState"
      ? (findAnswer("intro", "toBeState", "target_scale") || findAnswer("finops", "currentState", "usage_concurrency"))
      : findAnswer("intro", "currentState", "current_user_count");
    const concurrent = parseConcurrent(scaleText);
    if (concurrent) p.sessionHostCount = Math.max(1, Math.ceil(concurrent / p.maxSessionLimit));

    // Region — the target state records an explicit Gov region selection.
    if (source === "toBeState") {
      const loc = mapLocation(findAnswer("network", "toBeState", "target_region"));
      if (loc) p.location = loc;
    }

    return p;
  }

  function buildBicep(source) {
    const p = deriveBicepParams(source);
    const eng = state.engagement || "AVD Enterprise-Scale Landing Zone";
    const srcLabel = source === "currentState" ? "Current State (as-is)"
      : source === "toBeState" ? "Target State (to-be)"
      : "Well-Architected baseline";
    const bool = (b) => (b ? "true" : "false");
    const L = [];

    L.push("// " + "=".repeat(76));
    L.push("// Azure Virtual Desktop workload \u2014 parameterized Bicep");
    L.push("// Engagement : " + eng);
    L.push("// Source     : " + srcLabel);
    L.push("// Generated  : " + new Date().toISOString());
    L.push("//");
    L.push("// SECURITY: This template hardcodes NO secrets. Administrator and domain-join");
    L.push("// credentials are parameters with no defaults (adminPassword / domainJoinPassword");
    L.push("// are @secure()). Supply them at deploy time, ideally via a Key Vault reference.");
    L.push("// Deploy target subscription and resource group are chosen at deploy time and are");
    L.push("// not embedded here. Example:");
    L.push("//   az deployment group create -g <rg> -f main.bicep \\");
    L.push("//     -p adminUsername=<user> adminPassword=<secret> subnetResourceId=<id>");
    L.push("// " + "=".repeat(76));
    L.push("");
    L.push("targetScope = 'resourceGroup'");
    L.push("");
    L.push("@description('Azure region for the AVD resources.')");
    L.push("param location string = '" + p.location + "'");
    L.push("");
    L.push("@description('Environment tag applied to all resources.')");
    L.push("param environmentTag string = 'gcch'");
    L.push("");
    L.push("@description('Host pool name.')");
    L.push("param hostPoolName string = '" + p.hostPoolName + "'");
    L.push("");
    L.push("@description('Host pool type.')");
    L.push("@allowed([ 'Pooled', 'Personal' ])");
    L.push("param hostPoolType string = '" + p.hostPoolType + "'");
    L.push("");
    L.push("@description('Load balancing algorithm (pooled host pools).')");
    L.push("@allowed([ 'BreadthFirst', 'DepthFirst', 'Persistent' ])");
    L.push("param loadBalancerType string = '" + p.loadBalancerType + "'");
    L.push("");
    L.push("@description('Maximum concurrent sessions per session host (pooled).')");
    L.push("@minValue(1)");
    L.push("param maxSessionLimit int = " + p.maxSessionLimit);
    L.push("");
    L.push("@description('Assignment type for personal host pools.')");
    L.push("@allowed([ 'Automatic', 'Direct' ])");
    L.push("param personalDesktopAssignmentType string = '" + p.personalDesktopAssignmentType + "'");
    L.push("");
    L.push("@description('Start VM on connect (cost optimization).')");
    L.push("param startVmOnConnect bool = " + bool(p.startVmOnConnect));
    L.push("");
    L.push("@description('Deploy the host pool as a validation environment.')");
    L.push("param validationEnvironment bool = " + bool(p.validationEnvironment));
    L.push("");
    L.push("@description('Desktop application group name.')");
    L.push("param appGroupName string = '" + p.appGroupName + "'");
    L.push("");
    L.push("@description('Workspace name.')");
    L.push("param workspaceName string = '" + p.workspaceName + "'");
    L.push("");
    L.push("@description('Number of session host VMs to deploy (0 = control plane only).')");
    L.push("@minValue(0)");
    L.push("param sessionHostCount int = " + p.sessionHostCount);
    L.push("");
    L.push("@description('Session host VM size.')");
    L.push("param vmSize string = '" + p.vmSize + "'");
    L.push("");
    L.push("@description('OS disk storage type.')");
    L.push("@allowed([ 'Standard_LRS', 'StandardSSD_LRS', 'Premium_LRS' ])");
    L.push("param osDiskType string = '" + p.osDiskType + "'");
    L.push("");
    L.push("@description('Resource ID of the subnet the session hosts attach to. Required when sessionHostCount > 0.')");
    L.push("param subnetResourceId string = ''");
    L.push("");
    L.push("@description('Marketplace image for the session hosts (Windows 11 multi-session + M365 by default).')");
    L.push("param imageReference object = {");
    L.push("  publisher: 'microsoftwindowsdesktop'");
    L.push("  offer: 'office-365'");
    L.push("  sku: '" + (p.hostPoolType === "Personal" ? "win11-23h2-avd" : "win11-23h2-avd-m365") + "'");
    L.push("  version: 'latest'");
    L.push("}");
    L.push("");
    L.push("@description('Local administrator user name for the session hosts. No default \u2014 supply at deploy time.')");
    L.push("param adminUsername string");
    L.push("");
    L.push("@secure()");
    L.push("@description('Local administrator password. No default \u2014 supply securely at deploy time.')");
    L.push("param adminPassword string");
    L.push("");
    L.push("@description('AD DS / Entra Domain Services domain to join (leave empty to skip domain join).')");
    L.push("param domainToJoin string = ''");
    L.push("");
    L.push("@description('UPN of the domain-join account. No default \u2014 supply at deploy time.')");
    L.push("param domainJoinUserPrincipalName string = ''");
    L.push("");
    L.push("@secure()");
    L.push("@description('Password for the domain-join account. No default \u2014 supply securely at deploy time.')");
    L.push("param domainJoinPassword string = ''");
    L.push("");
    L.push("@description('Base time used to derive the host pool registration token expiry. Do not override.')");
    L.push("param baseTime string = utcNow('u')");
    L.push("");
    L.push("var deploySessionHosts = sessionHostCount > 0 && !empty(subnetResourceId)");
    L.push("var tokenExpiration = dateTimeAdd(baseTime, 'PT2H')");
    L.push("var commonTags = {");
    L.push("  environment: environmentTag");
    L.push("  workloadProfile: '" + p.workloadProfile + "'");
    L.push("  source: '" + srcLabel + "'");
    L.push("}");
    L.push("");
    L.push("resource hostPool 'Microsoft.DesktopVirtualization/hostPools@2024-04-03' = {");
    L.push("  name: hostPoolName");
    L.push("  location: location");
    L.push("  tags: commonTags");
    L.push("  properties: {");
    L.push("    hostPoolType: hostPoolType");
    L.push("    loadBalancerType: hostPoolType == 'Pooled' ? loadBalancerType : 'Persistent'");
    L.push("    maxSessionLimit: maxSessionLimit");
    L.push("    personalDesktopAssignmentType: hostPoolType == 'Personal' ? personalDesktopAssignmentType : null");
    L.push("    preferredAppGroupType: 'Desktop'");
    L.push("    startVMOnConnect: startVmOnConnect");
    L.push("    validationEnvironment: validationEnvironment");
    L.push("    registrationInfo: {");
    L.push("      expirationTime: tokenExpiration");
    L.push("      registrationTokenOperation: 'Update'");
    L.push("    }");
    L.push("  }");
    L.push("}");
    L.push("");
    L.push("resource appGroup 'Microsoft.DesktopVirtualization/applicationGroups@2024-04-03' = {");
    L.push("  name: appGroupName");
    L.push("  location: location");
    L.push("  tags: commonTags");
    L.push("  properties: {");
    L.push("    hostPoolArmPath: hostPool.id");
    L.push("    applicationGroupType: 'Desktop'");
    L.push("  }");
    L.push("}");
    L.push("");
    L.push("resource workspace 'Microsoft.DesktopVirtualization/workspaces@2024-04-03' = {");
    L.push("  name: workspaceName");
    L.push("  location: location");
    L.push("  tags: commonTags");
    L.push("  properties: {");
    L.push("    applicationGroupReferences: [ appGroup.id ]");
    L.push("  }");
    L.push("}");
    L.push("");
    L.push("resource sessionHostNic 'Microsoft.Network/networkInterfaces@2023-11-01' = [for i in range(0, sessionHostCount): if (deploySessionHosts) {");
    L.push("  name: '${hostPoolName}-nic-${i}'");
    L.push("  location: location");
    L.push("  tags: commonTags");
    L.push("  properties: {");
    L.push("    ipConfigurations: [ {");
    L.push("      name: 'ipconfig'");
    L.push("      properties: {");
    L.push("        privateIPAllocationMethod: 'Dynamic'");
    L.push("        subnet: { id: subnetResourceId }");
    L.push("      }");
    L.push("    } ]");
    L.push("  }");
    L.push("}]");
    L.push("");
    L.push("resource sessionHost 'Microsoft.Compute/virtualMachines@2023-09-01' = [for i in range(0, sessionHostCount): if (deploySessionHosts) {");
    L.push("  name: '${hostPoolName}-vm-${i}'");
    L.push("  location: location");
    L.push("  tags: commonTags");
    L.push("  properties: {");
    L.push("    hardwareProfile: { vmSize: vmSize }");
    L.push("    osProfile: {");
    L.push("      computerName: '${take(replace(hostPoolName, '-', ''), 11)}${i}'");
    L.push("      adminUsername: adminUsername");
    L.push("      adminPassword: adminPassword");
    L.push("    }");
    L.push("    storageProfile: {");
    L.push("      imageReference: imageReference");
    L.push("      osDisk: {");
    L.push("        createOption: 'FromImage'");
    L.push("        managedDisk: { storageAccountType: osDiskType }");
    L.push("      }");
    L.push("    }");
    L.push("    networkProfile: {");
    L.push("      networkInterfaces: [ { id: sessionHostNic[i].id } ]");
    L.push("    }");
    L.push("    licenseType: 'Windows_Client'");
    L.push("  }");
    L.push("}]");
    L.push("");
    L.push("// NOTE: Domain/Entra join and AVD agent registration are applied to each session");
    L.push("// host via extensions in your pipeline, using domainToJoin / domainJoinUserPrincipalName /");
    L.push("// domainJoinPassword and the secure host pool registration token below.");
    L.push("");
    L.push("output hostPoolResourceId string = hostPool.id");
    L.push("output applicationGroupResourceId string = appGroup.id");
    L.push("output workspaceResourceId string = workspace.id");
    L.push("");
    L.push("@secure()");
    L.push("@description('Host pool registration token for enrolling session hosts.')");
    L.push("output hostPoolRegistrationToken string = hostPool.properties.registrationInfo.token");
    L.push("");

    return L.join("\n");
  }

  function downloadBicep(source) {
    if ((source === "currentState" && !phaseComplete("currentState")) ||
        (source === "toBeState" && !phaseComplete("toBeState"))) {
      toast("That phase is incomplete \u2014 choose Well-Architected or complete the phase.", true);
      return;
    }
    const text = buildBicep(source);
    const blob = new Blob([text], { type: "text/plain" });
    const srcSlug = source === "currentState" ? "current-state"
      : source === "toBeState" ? "target-state" : "well-architected";
    const name = "avd-workload-" + srcSlug +
      (state.engagement ? "-" + slug(state.engagement) : "") +
      "-" + new Date().toISOString().slice(0, 10) + ".bicep";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
    toast("Bicep template downloaded");
  }

  /* ---------------------------------------------------------------------- *
   * Deploy — ARM JSON + device-code deploy command
   * The static app cannot execute Azure CLI or reach the device-code endpoint
   * directly (CORS / file:// origin), so "Deploy" produces a self-contained,
   * one-shot command that signs in with `az login --use-device-code`, embeds
   * the generated ARM template, prompts for any missing parameters, and runs
   * `az deployment group create`. Credentials are prompted at runtime by the
   * command (Read-Host) and are never stored or written into the file.
   * ---------------------------------------------------------------------- */
  function sourceLabel(source) {
    return source === "currentState" ? "Current State (as-is)"
      : source === "toBeState" ? "Target State (to-be)"
      : "Well-Architected baseline";
  }

  function buildArmTemplate(source) {
    const p = deriveBicepParams(source);
    const sku = p.hostPoolType === "Personal" ? "win11-23h2-avd" : "win11-23h2-avd-m365";
    return {
      "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
      languageVersion: "2.0",
      contentVersion: "1.0.0.0",
      parameters: {
        location: { type: "string", defaultValue: p.location, metadata: { description: "Azure region for the AVD resources." } },
        environmentTag: { type: "string", defaultValue: "gcch" },
        hostPoolName: { type: "string", defaultValue: p.hostPoolName },
        hostPoolType: { type: "string", defaultValue: p.hostPoolType, allowedValues: ["Pooled", "Personal"] },
        loadBalancerType: { type: "string", defaultValue: p.loadBalancerType, allowedValues: ["BreadthFirst", "DepthFirst", "Persistent"] },
        maxSessionLimit: { type: "int", defaultValue: p.maxSessionLimit, minValue: 1 },
        personalDesktopAssignmentType: { type: "string", defaultValue: p.personalDesktopAssignmentType, allowedValues: ["Automatic", "Direct"] },
        startVmOnConnect: { type: "bool", defaultValue: p.startVmOnConnect },
        validationEnvironment: { type: "bool", defaultValue: p.validationEnvironment },
        appGroupName: { type: "string", defaultValue: p.appGroupName },
        workspaceName: { type: "string", defaultValue: p.workspaceName },
        sessionHostCount: { type: "int", defaultValue: p.sessionHostCount, minValue: 0 },
        vmSize: { type: "string", defaultValue: p.vmSize },
        osDiskType: { type: "string", defaultValue: p.osDiskType, allowedValues: ["Standard_LRS", "StandardSSD_LRS", "Premium_LRS"] },
        subnetResourceId: { type: "string", defaultValue: "" },
        imageReference: { type: "object", defaultValue: { publisher: "microsoftwindowsdesktop", offer: "office-365", sku: sku, version: "latest" } },
        adminUsername: { type: "string" },
        adminPassword: { type: "securestring" },
        baseTime: { type: "string", defaultValue: "[utcNow('u')]" }
      },
      variables: {
        deploySessionHosts: "[and(greater(parameters('sessionHostCount'), 0), not(empty(parameters('subnetResourceId'))))]",
        tokenExpiration: "[dateTimeAdd(parameters('baseTime'), 'PT2H')]",
        commonTags: { environment: "[parameters('environmentTag')]", workloadProfile: p.workloadProfile, source: sourceLabel(source) }
      },
      resources: {
        hostPool: {
          type: "Microsoft.DesktopVirtualization/hostPools",
          apiVersion: "2024-04-03",
          name: "[parameters('hostPoolName')]",
          location: "[parameters('location')]",
          tags: "[variables('commonTags')]",
          properties: {
            hostPoolType: "[parameters('hostPoolType')]",
            loadBalancerType: "[if(equals(parameters('hostPoolType'), 'Pooled'), parameters('loadBalancerType'), 'Persistent')]",
            maxSessionLimit: "[parameters('maxSessionLimit')]",
            personalDesktopAssignmentType: "[if(equals(parameters('hostPoolType'), 'Personal'), parameters('personalDesktopAssignmentType'), null())]",
            preferredAppGroupType: "Desktop",
            startVMOnConnect: "[parameters('startVmOnConnect')]",
            validationEnvironment: "[parameters('validationEnvironment')]",
            registrationInfo: { expirationTime: "[variables('tokenExpiration')]", registrationTokenOperation: "Update" }
          }
        },
        appGroup: {
          type: "Microsoft.DesktopVirtualization/applicationGroups",
          apiVersion: "2024-04-03",
          name: "[parameters('appGroupName')]",
          location: "[parameters('location')]",
          tags: "[variables('commonTags')]",
          properties: { hostPoolArmPath: "[resourceId('Microsoft.DesktopVirtualization/hostPools', parameters('hostPoolName'))]", applicationGroupType: "Desktop" },
          dependsOn: ["hostPool"]
        },
        workspace: {
          type: "Microsoft.DesktopVirtualization/workspaces",
          apiVersion: "2024-04-03",
          name: "[parameters('workspaceName')]",
          location: "[parameters('location')]",
          tags: "[variables('commonTags')]",
          properties: { applicationGroupReferences: ["[resourceId('Microsoft.DesktopVirtualization/applicationGroups', parameters('appGroupName'))]"] },
          dependsOn: ["appGroup"]
        },
        sessionHostNic: {
          copy: { name: "sessionHostNic", count: "[length(range(0, parameters('sessionHostCount')))]" },
          condition: "[variables('deploySessionHosts')]",
          type: "Microsoft.Network/networkInterfaces",
          apiVersion: "2023-11-01",
          name: "[format('{0}-nic-{1}', parameters('hostPoolName'), range(0, parameters('sessionHostCount'))[copyIndex()])]",
          location: "[parameters('location')]",
          tags: "[variables('commonTags')]",
          properties: {
            ipConfigurations: [{ name: "ipconfig", properties: { privateIPAllocationMethod: "Dynamic", subnet: { id: "[parameters('subnetResourceId')]" } } }]
          }
        },
        sessionHost: {
          copy: { name: "sessionHost", count: "[length(range(0, parameters('sessionHostCount')))]" },
          condition: "[variables('deploySessionHosts')]",
          type: "Microsoft.Compute/virtualMachines",
          apiVersion: "2023-09-01",
          name: "[format('{0}-vm-{1}', parameters('hostPoolName'), range(0, parameters('sessionHostCount'))[copyIndex()])]",
          location: "[parameters('location')]",
          tags: "[variables('commonTags')]",
          properties: {
            hardwareProfile: { vmSize: "[parameters('vmSize')]" },
            osProfile: {
              computerName: "[format('{0}{1}', take(replace(parameters('hostPoolName'), '-', ''), 11), range(0, parameters('sessionHostCount'))[copyIndex()])]",
              adminUsername: "[parameters('adminUsername')]",
              adminPassword: "[parameters('adminPassword')]"
            },
            storageProfile: {
              imageReference: "[parameters('imageReference')]",
              osDisk: { createOption: "FromImage", managedDisk: { storageAccountType: "[parameters('osDiskType')]" } }
            },
            networkProfile: { networkInterfaces: [{ id: "[resourceId('Microsoft.Network/networkInterfaces', format('{0}-nic-{1}', parameters('hostPoolName'), range(0, parameters('sessionHostCount'))[copyIndex()]))]" }] },
            licenseType: "Windows_Client"
          },
          dependsOn: ["[format('sessionHostNic[{0}]', range(0, parameters('sessionHostCount'))[copyIndex()])]"]
        }
      },
      outputs: {
        hostPoolResourceId: { type: "string", value: "[resourceId('Microsoft.DesktopVirtualization/hostPools', parameters('hostPoolName'))]" },
        applicationGroupResourceId: { type: "string", value: "[resourceId('Microsoft.DesktopVirtualization/applicationGroups', parameters('appGroupName'))]" },
        workspaceResourceId: { type: "string", value: "[resourceId('Microsoft.DesktopVirtualization/workspaces', parameters('workspaceName'))]" }
      }
    };
  }

  // Non-secret infrastructure parameters that carry defaults (overridable in the
  // deploy modal). Credentials are intentionally excluded — they are prompted at
  // runtime by the generated command and never stored.
  function deployOverrideParams(source) {
    const p = deriveBicepParams(source);
    return [
      { key: "hostPoolName", label: "Host pool name", value: p.hostPoolName },
      { key: "hostPoolType", label: "Host pool type", value: p.hostPoolType },
      { key: "loadBalancerType", label: "Load balancer type", value: p.loadBalancerType },
      { key: "maxSessionLimit", label: "Max sessions/host", value: p.maxSessionLimit },
      { key: "personalDesktopAssignmentType", label: "Personal assignment", value: p.personalDesktopAssignmentType },
      { key: "startVmOnConnect", label: "Start VM on connect", value: p.startVmOnConnect },
      { key: "validationEnvironment", label: "Validation environment", value: p.validationEnvironment },
      { key: "appGroupName", label: "App group name", value: p.appGroupName },
      { key: "workspaceName", label: "Workspace name", value: p.workspaceName },
      { key: "sessionHostCount", label: "Session host count", value: p.sessionHostCount },
      { key: "vmSize", label: "VM size", value: p.vmSize },
      { key: "osDiskType", label: "OS disk type", value: p.osDiskType }
    ];
  }

  function buildDeployCommand(source, ctx) {
    const arm = JSON.stringify(buildArmTemplate(source), null, 2);
    const L = [];
    L.push("#Requires -Version 5.1");
    L.push("<#");
    L.push(" .SYNOPSIS  Deploy the AVD workload (" + sourceLabel(source) + ") to Azure.");
    L.push(" Uses device-code sign-in. Credentials are prompted at runtime and are NOT");
    L.push(" stored in this command. Paste the whole block into a PowerShell terminal");
    L.push(" that has the Azure CLI (az) installed.");
    L.push("#>");
    L.push("$ErrorActionPreference = 'Stop'");
    L.push("");
    L.push("# 1) Device-code sign-in to the selected cloud (follow the code + URL shown)");
    L.push("az cloud set --name " + ctx.cloud);
    L.push("az login --use-device-code");
    if (ctx.subscriptionId) {
      L.push("az account set --subscription '" + psEscape(ctx.subscriptionId) + "'");
    } else {
      L.push("# TODO: set your subscription: az account set --subscription '<subscription-id>'");
    }
    L.push("");
    L.push("# 2) Ensure the target resource group exists");
    L.push("az group create --name '" + psEscape(ctx.resourceGroup || "<resource-group>") + "' --location '" + psEscape(ctx.location) + "' | Out-Null");
    L.push("");
    L.push("# 3) Write the generated ARM template to a temp file");
    L.push("$templateJson = @'");
    arm.split("\n").forEach(line => L.push(line));
    L.push("'@");
    L.push("$templateFile = Join-Path ([IO.Path]::GetTempPath()) ('avd-workload-' + [Guid]::NewGuid().ToString('N') + '.json')");
    L.push("Set-Content -Path $templateFile -Value $templateJson -Encoding utf8");
    L.push("");
    L.push("# 4) Prompt for credentials at runtime (never stored in this command)");
    L.push("$adminUsername = Read-Host 'Local administrator username for session hosts'");
    L.push("$adminSecure   = Read-Host 'Local administrator password' -AsSecureString");
    L.push("$adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecure))");
    L.push("");
    L.push("# 5) Deploy");
    const prm = [];
    prm.push("location='" + psEscape(ctx.location) + "'");
    (ctx.overrides || []).forEach(o => { prm.push(o.key + "='" + psEscape(String(o.value)) + "'"); });
    if (ctx.subnetResourceId) prm.push("subnetResourceId='" + psEscape(ctx.subnetResourceId) + "'");
    const head = "az deployment group create --resource-group '" + psEscape(ctx.resourceGroup || "<resource-group>") +
      "' --name '" + psEscape(ctx.deploymentName) + "' --template-file $templateFile `";
    L.push(head);
    L.push("  --parameters " + prm.join(" ") + " `");
    L.push("  --parameters \"adminUsername=$adminUsername\" \"adminPassword=$adminPassword\"");
    L.push("");
    L.push("Remove-Item $templateFile -Force");
    return L.join("\n");
  }

  function openDeployModal(source) {
    if ((source === "currentState" && !phaseComplete("currentState")) ||
        (source === "toBeState" && !phaseComplete("toBeState"))) {
      toast("That phase is incomplete \u2014 choose Well-Architected or complete the phase.", true);
      return;
    }
    const p = deriveBicepParams(source);
    const overrides = deployOverrideParams(source);

    const overlay = el("div", "modal-overlay");
    const modal = el("div", "modal");
    overlay.appendChild(modal);

    const close = () => { document.body.removeChild(overlay); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    const head = el("div", "modal__head");
    head.innerHTML =
      '<h3 class="modal__title">Deploy to Azure \u2014 ' + sourceLabel(source) + '</h3>' +
      '<p class="modal__sub">Signs in with <code>az login --use-device-code</code> and deploys the generated ' +
      'AVD template. This browser can\u2019t run Azure CLI, so the app builds a one-shot command \u2014 fill in the ' +
      'fields below, then copy it into a PowerShell terminal. Administrator credentials are prompted at runtime ' +
      'by the command and are never stored or written into it.</p>';
    modal.appendChild(head);

    const form = el("div", "modal__form");
    modal.appendChild(form);

    const ctx = {
      cloud: (p.location.indexOf("usgov") === 0) ? "AzureUSGovernment" : "AzureCloud",
      subscriptionId: "",
      resourceGroup: "",
      location: p.location,
      deploymentName: "avd-" + (source === "currentState" ? "current" : source === "toBeState" ? "target" : "waf") +
        "-" + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, ""),
      subnetResourceId: "",
      overrides: overrides.map(o => ({ key: o.key, label: o.label, value: o.value }))
    };

    const pre = el("pre", "modal__preview");

    const field = (labelText, help, node) => {
      const w = el("div", "modal__field");
      const l = el("label", "modal__label"); l.textContent = labelText;
      w.appendChild(l);
      if (help) { const h = el("p", "modal__help"); h.textContent = help; w.appendChild(h); }
      w.appendChild(node);
      return w;
    };

    // Cloud
    const cloudSel = el("select", "q__input");
    [["AzureUSGovernment", "Azure Government (GCC High / DoD)"], ["AzureCloud", "Azure Public"]].forEach(([v, t]) => {
      const o = el("option"); o.value = v; o.textContent = t; if (v === ctx.cloud) o.selected = true; cloudSel.appendChild(o);
    });
    cloudSel.addEventListener("change", () => { ctx.cloud = cloudSel.value; refresh(); });
    form.appendChild(field("Azure cloud", null, cloudSel));

    // Subscription (required)
    const subIn = el("input", "q__input", { type: "text", placeholder: "00000000-0000-0000-0000-000000000000" });
    subIn.addEventListener("input", () => { ctx.subscriptionId = subIn.value.trim(); refresh(); });
    form.appendChild(field("Subscription ID (required)", "The subscription to deploy into.", subIn));

    // Resource group (required)
    const rgIn = el("input", "q__input", { type: "text", placeholder: "rg-avd-prod" });
    rgIn.addEventListener("input", () => { ctx.resourceGroup = rgIn.value.trim(); refresh(); });
    form.appendChild(field("Resource group (required)", "Created if it does not already exist.", rgIn));

    // Location
    const locIn = el("input", "q__input", { type: "text" });
    locIn.value = ctx.location;
    locIn.addEventListener("input", () => { ctx.location = locIn.value.trim(); refresh(); });
    form.appendChild(field("Location", "Azure region name (e.g., usgovvirginia).", locIn));

    // Deployment name
    const dnIn = el("input", "q__input", { type: "text" });
    dnIn.value = ctx.deploymentName;
    dnIn.addEventListener("input", () => { ctx.deploymentName = dnIn.value.trim(); refresh(); });
    form.appendChild(field("Deployment name", null, dnIn));

    // Subnet (conditionally required)
    const subnetIn = el("input", "q__input", { type: "text", placeholder: "/subscriptions/.../subnets/avd" });
    subnetIn.addEventListener("input", () => { ctx.subnetResourceId = subnetIn.value.trim(); refresh(); });
    const shc = Number(p.sessionHostCount) || 0;
    form.appendChild(field("Session host subnet resource ID" + (shc > 0 ? " (required for session hosts)" : " (optional)"),
      shc > 0 ? "Required to deploy the " + shc + " session host VM(s). Leave empty to deploy the control plane only."
              : "Only needed when session hosts are deployed.", subnetIn));

    // Advanced overrides
    const details = el("details", "modal__advanced");
    const summary = el("summary"); summary.textContent = "Advanced parameters (prefilled from your inputs)";
    details.appendChild(summary);
    const grid = el("div", "modal__grid");
    ctx.overrides.forEach(o => {
      const inp = el("input", "q__input", { type: "text" });
      inp.value = String(o.value);
      inp.addEventListener("input", () => { o.value = inp.value; refresh(); });
      grid.appendChild(field(o.label, null, inp));
    });
    details.appendChild(grid);
    form.appendChild(details);

    // Credentials note
    const credNote = el("p", "modal__note");
    credNote.innerHTML = "The generated command prompts for the <strong>administrator username and password</strong> " +
      "at runtime (<code>Read-Host</code>) \u2014 no usernames, passwords, UPNs, or service principals are written into it.";
    form.appendChild(credNote);

    // Preview + actions
    const previewWrap = el("div", "modal__previewwrap");
    const previewHead = el("div", "modal__previewhead");
    previewHead.textContent = "Deploy command (PowerShell + Azure CLI)";
    previewWrap.appendChild(previewHead);
    previewWrap.appendChild(pre);
    modal.appendChild(previewWrap);

    const actions = el("div", "modal__actions");
    const status = el("span", "modal__status");
    const btnCopy = el("button", "btn btn--primary", { type: "button" });
    btnCopy.textContent = "Copy deploy command";
    const btnDl = el("button", "btn", { type: "button" });
    btnDl.textContent = "Download .ps1";
    const btnClose = el("button", "btn", { type: "button" });
    btnClose.textContent = "Close";
    actions.appendChild(btnCopy); actions.appendChild(btnDl); actions.appendChild(btnClose); actions.appendChild(status);
    modal.appendChild(actions);

    function valid() { return ctx.subscriptionId && ctx.resourceGroup && ctx.location; }
    function refresh() {
      pre.textContent = buildDeployCommand(source, ctx);
      const ok = valid();
      btnCopy.disabled = !ok; btnDl.disabled = !ok;
      status.textContent = ok ? "" : "Enter subscription ID, resource group, and location to enable.";
    }

    btnCopy.addEventListener("click", () => {
      const text = buildDeployCommand(source, ctx);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => toast("Deploy command copied \u2014 paste into a PowerShell terminal"),
          () => toast("Copy failed", true)
        );
      } else { toast("Clipboard not available", true); }
    });
    btnDl.addEventListener("click", () => {
      const text = buildDeployCommand(source, ctx);
      const blob = new Blob([text], { type: "text/plain" });
      const srcSlug = source === "currentState" ? "current-state" : source === "toBeState" ? "target-state" : "well-architected";
      const name = "deploy-avd-workload-" + srcSlug + "-" + new Date().toISOString().slice(0, 10) + ".ps1";
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
      toast("Deploy command downloaded");
    });
    btnClose.addEventListener("click", close);

    document.body.appendChild(overlay);
    refresh();
    subIn.focus();
  }

  /* ---------------------------------------------------------------------- *
   * Navigation
   * ---------------------------------------------------------------------- */
  function goTo(i) {
    state.activeIndex = Math.max(0, Math.min(MODULES.length - 1, i));
    save(true);
    renderRail();
    renderModule();
  }

  /* ---------------------------------------------------------------------- *
   * Export / Import
   * ---------------------------------------------------------------------- */
  function buildExport() {
    const out = {
      schema: "avd-gcch-landing-zone-assessment",
      schemaVersion: SCHEMA_VERSION,
      engagement: state.engagement || null,
      generatedAt: new Date().toISOString(),
      summary: MODULES.map(m => {
        const c = moduleCounts(m);
        return { id: m.id, title: m.title, answered: c.done, total: c.total };
      }),
      modules: MODULES.map(m => ({
        id: m.id,
        title: m.title,
        minutes: m.minutes,
        currentState: collectPhase(m, "currentState"),
        toBeState: collectPhase(m, "toBeState")
      }))
    };
    return out;
  }

  function collectPhase(mod, phase) {
    const store = (state.answers[mod.id] && state.answers[mod.id][phase]) || {};
    const obj = {};
    mod[phase].forEach((q, i) => {
      const explicit = Object.prototype.hasOwnProperty.call(store, q.id);
      const value = explicit ? store[q.id]
        : (resolveDefault(mod, q) != null ? resolveDefault(mod, q) : (q.type === "checkbox" ? [] : ""));
      const entry = { ref: questionRef(mod, phase, i), label: q.label, value: value };
      if (!explicit && resolveDefault(mod, q) !== undefined) entry.prepopulated = true;
      obj[q.id] = entry;
    });
    return obj;
  }

  function exportJson() {
    const data = buildExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const name = "avd-gcch-lza-assessment" +
      (state.engagement ? "-" + slug(state.engagement) : "") +
      "-" + new Date().toISOString().slice(0, 10) + ".json";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
    toast("Exported " + name);
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        state.engagement = data.engagement || "";
        $("#engagementName").value = state.engagement;
        state.answers = {};
        (data.modules || []).forEach(m => {
          ["currentState", "toBeState"].forEach(phase => {
            const src = m[phase] || {};
            const dest = ensurePath(m.id, phase);
            Object.keys(src).forEach(qid => {
              const entry = src[qid];
              dest[qid] = entry && Object.prototype.hasOwnProperty.call(entry, "value") ? entry.value : entry;
            });
          });
        });
        save(true);
        renderRail(); renderModule(); updateProgress();
        toast("Imported assessment");
      } catch (e) {
        toast("Import failed: not valid assessment JSON", true);
      }
    };
    reader.readAsText(file);
  }

  /* ---------------------------------------------------------------------- *
   * Saved-workshop library (named, multi-slot, stored in this browser)
   * ---------------------------------------------------------------------- */
  function loadLibrary() {
    try { return JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]") || []; }
    catch (_) { return []; }
  }
  function persistLibrary(lib) {
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib)); }
    catch (e) { toast("Could not save library: " + e.message, true); }
  }

  function saveToLibrary() {
    let name = (state.engagement || "").trim();
    if (!name) {
      name = (window.prompt("Name this workshop:", "") || "").trim();
      if (!name) { toast("Save cancelled \u2014 a name is required", true); return; }
      state.engagement = name;
      $("#engagementName").value = name;
    }
    const lib = loadLibrary();
    const snap = JSON.parse(JSON.stringify({ engagement: state.engagement, activeIndex: state.activeIndex, answers: state.answers }));
    const now = new Date().toISOString();
    const existing = lib.find(w => (w.name || "").toLowerCase() === name.toLowerCase());
    if (existing) { existing.savedAt = now; existing.data = snap; }
    else { lib.push({ id: "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name, savedAt: now, data: snap }); }
    persistLibrary(lib);
    save(true);
    toast("Saved \u201C" + name + "\u201D to this browser");
  }

  function newWorkshop() {
    const ok = window.confirm("Start a new workshop?\n\nThis clears the current working copy. Use Save to keep it in this browser, or Export it first, if you don't want to lose it.");
    if (!ok) return;
    state.engagement = "";
    state.activeIndex = 0;
    state.answers = {};
    state.updatedAt = null;
    $("#engagementName").value = "";
    save(true);
    renderRail(); renderModule(); updateProgress();
    toast("Started a new workshop");
  }

  function openWorkshop(id) {
    const w = loadLibrary().find(x => x.id === id);
    if (!w) { toast("Workshop not found", true); return; }
    const d = w.data || {};
    state.engagement = d.engagement || w.name || "";
    state.activeIndex = d.activeIndex || 0;
    state.answers = d.answers ? JSON.parse(JSON.stringify(d.answers)) : {};
    $("#engagementName").value = state.engagement;
    save(true);
    renderRail(); renderModule(); updateProgress();
    hideLibrary();
    toast("Opened \u201C" + w.name + "\u201D");
  }

  function deleteWorkshop(id) {
    const lib = loadLibrary();
    const w = lib.find(x => x.id === id);
    if (!w) return;
    if (!window.confirm("Delete \u201C" + w.name + "\u201D from this browser? This cannot be undone.")) return;
    persistLibrary(lib.filter(x => x.id !== id));
    renderLibrary();
    toast("Deleted \u201C" + w.name + "\u201D");
  }

  function renderLibrary() {
    const list = $("#libraryList");
    list.innerHTML = "";
    const lib = loadLibrary().slice().sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
    if (!lib.length) {
      const empty = el("p", "library__empty");
      empty.textContent = "No saved workshops yet. Use Save to store one in this browser.";
      list.appendChild(empty);
      return;
    }
    lib.forEach(w => {
      const row = el("div", "library__item");
      const open = el("button", "library__open", { type: "button" });
      const nm = el("span", "library__name"); nm.textContent = w.name;
      const meta = el("span", "library__meta");
      meta.textContent = "Saved " + (w.savedAt ? new Date(w.savedAt).toLocaleString() : "");
      open.appendChild(nm); open.appendChild(meta);
      open.addEventListener("click", () => openWorkshop(w.id));
      const del = el("button", "library__del", { type: "button", title: "Delete", "aria-label": "Delete " + w.name });
      del.textContent = "\u2715";
      del.addEventListener("click", (e) => { e.stopPropagation(); deleteWorkshop(w.id); });
      row.appendChild(open); row.appendChild(del);
      list.appendChild(row);
    });
  }

  function showLibrary() { renderLibrary(); $("#libraryPanel").hidden = false; }
  function hideLibrary() { const p = $("#libraryPanel"); if (p) p.hidden = true; }
  function toggleLibrary() { const p = $("#libraryPanel"); if (p.hidden) showLibrary(); else hideLibrary(); }

  /* ---------------------------------------------------------------------- *
   * Toast
   * ---------------------------------------------------------------------- */
  let toastTimer;
  function toast(msg, isError) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast is-show" + (isError ? " is-error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, 2600);
  }

  /* ---------------------------------------------------------------------- *
   * Wire up
   * ---------------------------------------------------------------------- */
  function init() {
    load();
    $("#engagementName").value = state.engagement || "";
    $("#engagementName").addEventListener("input", (e) => { state.engagement = e.target.value; save(true); });

    $("#btnNew").addEventListener("click", newWorkshop);
    $("#btnSave").addEventListener("click", saveToLibrary);
    $("#btnOpen").addEventListener("click", toggleLibrary);
    $("#libraryClose").addEventListener("click", hideLibrary);
    $("#btnExport").addEventListener("click", exportJson);
    $("#btnImport").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ""; });
    document.addEventListener("click", (e) => {
      const p = $("#libraryPanel");
      if (!p || p.hidden) return;
      if (p.contains(e.target) || e.target.id === "btnOpen") return;
      hideLibrary();
    });
    $("#btnPrev").addEventListener("click", () => goTo(state.activeIndex - 1));
    $("#btnNext").addEventListener("click", () => goTo(state.activeIndex + 1));

    $("#btnTheme").addEventListener("click", () => {
      const b = document.body;
      b.dataset.theme = b.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY + ".theme", b.dataset.theme); } catch (_) {}
    });
    try {
      const th = localStorage.getItem(STORAGE_KEY + ".theme");
      if (th) document.body.dataset.theme = th;
    } catch (_) {}

    $("#btnDockToggle").addEventListener("click", () => {
      document.querySelector(".layout").classList.toggle("dock-collapsed");
    });

    // Keyboard: Alt+Arrow to move between modules
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideLibrary();
      if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); goTo(state.activeIndex + 1); }
      if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); goTo(state.activeIndex - 1); }
    });

    renderRail();
    renderModule();
    updateProgress();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
