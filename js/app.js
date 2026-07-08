/* =============================================================================
 * AVD on GCC High — Landing Zone Assessment Workshop
 * app.js — navigation, mini-markdown renderer, state, JSON import/export
 * Runs fully client-side; persists to localStorage; no external dependencies.
 * ========================================================================== */
(function () {
  "use strict";

  const MODULES = (window.WORKSHOP_MODULES || []).slice().sort((a, b) => a.order - b.order);
  const STORAGE_KEY = "avd-gcch-lza-assessment.v1";
  const SCHEMA_VERSION = "1.0.0";

  /* ---------------------------------------------------------------------- *
   * State
   * ---------------------------------------------------------------------- */
  const state = {
    engagement: "",
    activeIndex: 0,
    answers: {}, // answers[moduleId][phase][questionId] = value
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
    panels.appendChild(pOverview);

    // Current state panel
    panels.appendChild(buildPhasePanel(mod, "currentState",
      "Record the current (as-is) state. Fields save automatically."));
    // Target state panel
    panels.appendChild(buildPhasePanel(mod, "toBeState",
      "Record the target (to-be) state and the associated design decisions."));

    view.appendChild(panels);

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

    $("#btnSave").addEventListener("click", () => save(false));
    $("#btnExport").addEventListener("click", exportJson);
    $("#btnImport").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ""; });
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
      if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); goTo(state.activeIndex + 1); }
      if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); goTo(state.activeIndex - 1); }
    });

    renderRail();
    renderModule();
    updateProgress();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
