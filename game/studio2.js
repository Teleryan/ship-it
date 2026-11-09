/* ============================================================
   SHIP IT!: DATA STUDIO TOOLS (master account only, loaded with studio.js)
   Filter bar, undo/redo, Changes view, live/display chips, validation, preview pane,
   CSV / JSON / ZIP round trip, publish to the test and live environments.
   Draft = what you are editing. Active = what new games use (set with "Apply to game").
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const E = root.ShipItEngine, D = root.SHIPIT_DATA, esc = SI.esc;
const X = SI.stu2 = {};
const V = X.state = () => { const U = SI.U; return U.stu || (U.stu = { q: "", ed: false, view: "table", note: "", hist: [], fut: [], sel: {}, drawer: false, msg: "", confirm: null, pub: null, tpl: "systems", zip: true, rg: 0 }); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = o => JSON.parse(JSON.stringify(o));
const TABNAME = { spots: "Board spots", systems: "Systems", milestones: "Milestones", objectives: "Objectives", crisis: "Crisis cards", tutorial: "Text", text: "Text", publisherGates: "Publisher gates", gatePool: "Gate pool", roles: "Roles", phases: "Phases", teams: "Teams", symbols: "Symbols" };
const TPLS = [["rules", "Rules (every rule value)"], ["spots", "Board spots"], ["systems", "Systems"], ["milestones", "Milestones"], ["objectives", "Objectives"], ["crisis", "Crisis cards"], ["tutorial", "Text (tutorial steps)"], ["text", "Text (other wording)"], ["publisherGates", "Publisher gates"], ["gatePool", "Gate pool"]];

/* ---------- live / display status of every field ---------- */
// live = the engine reads it when a new game starts. display = wording or symbols only.
const STAT = { spots: { note: "display" }, systems: { name: "display", sym: "display" }, milestones: { name: "display", text: "display" }, objectives: { name: "display", sym: "display" }, crisis: { name: "display", text: "display", flavor: "display" }, publisherGates: { name: "display", flavor: "display" }, gatePool: { name: "display", flavor: "display" }, text: { text: "display" } };
const TIP = { live: "The engine reads this when a new game starts, so changing it changes gameplay.", display: "Shown on cards and in text only. Gameplay does not change." };
X.stat = (tab, f) => (STAT[tab] && STAT[tab][f]) || "live";
X.chip = (tab, f) => { const s = (STAT[tab] && STAT[tab][f]) || "live"; return `<i class="chip ${s}" title="${esc(TIP[s])}">${s}</i>`; };

/* ---------- differences from the shipped baseline ---------- */
X.diffList = function (st) {
  const dc = E.defaultConfig(), dd = E.defaultData(dc), out = [], COLS = SI.studioCols;
  Object.keys(st.config).forEach(k => { if (k === "_meta" || same(st.config[k], dc[k])) return; const m = D.config._meta && D.config._meta[k]; out.push({ k: "cfg:" + k, where: "Rules", label: m ? m[0] : k, from: dc[k], to: st.config[k] }); });
  Object.keys(COLS).forEach(tab => (st.data[tab] || []).forEach((row, i) => { const def = dd[tab][i]; COLS[tab].forEach(c => { if (c[2] === "ro") return; if (!same(row[c[0]], def && def[c[0]])) out.push({ k: tab + "." + i + "." + c[0], where: TABNAME[tab], label: (row.name || row.id || "#" + i) + " · " + c[1].replace(/ \(.*$/, ""), from: def ? def[c[0]] : undefined, to: row[c[0]] }); }); }));
  (st.data.tutorial || []).forEach((row, i) => { const d = dd.tutorial.find(x => x.id === row.id) || {}; ["title", "btn", "text"].forEach(f => { if ((row[f] || "") !== (d[f] || "")) out.push({ k: "tutorial." + i + "." + f, where: "Text", label: row.id + " · " + f, from: d[f], to: row[f] }); }); });
  return out;
};
X.revert = function (st, k) {
  const dc = E.defaultConfig(), dd = E.defaultData(dc);
  if (k.indexOf("cfg:") === 0) { st.config[k.slice(4)] = clone(dc[k.slice(4)]); return; }
  const [tab, i, f] = k.split("."), row = st.data[tab][+i];
  const def = tab === "tutorial" ? dd.tutorial.find(x => x.id === row.id) : dd[tab][+i];
  if (!def) return;
  if (tab === "tutorial") { row[f] = clone(def[f] == null ? "" : def[f]); return; }
  if (def[f] === undefined) delete row[f]; else row[f] = clone(def[f]); // restore the exact shipped value (including null)
};
const fmt = v => { let t = v == null ? "(empty)" : typeof v === "object" ? JSON.stringify(v) : String(v); return t.length > 110 ? t.slice(0, 107) + "\u2026" : t; };
X.fmt = fmt;
// edited values per section, for the navigation badges
X.counts = function (st) { const out = {}; X.diffList(st).forEach(c => { const t = c.k.indexOf("cfg:") === 0 ? "rules" : c.k.split(".")[0], s = t === "text" ? "tutorial" : t; out[s] = (out[s] || 0) + 1; }); return out; };
X.changes = function (st) {
  const list = X.diffList(st);
  if (!list.length) return `<div class="sf-empty"><h3>No edits yet</h3><p>The draft matches the shipped defaults. Change a value in any section and it is listed here, with the shipped value next to it and a Reset button.</p></div>`;
  const by = {}; list.forEach(c => (by[c.where] = by[c.where] || []).push(c));
  return `<div class="sf-chg">` + Object.keys(by).map(w => `<section class="fg" data-hay-sec><header><h3>${esc(w)} <span class="cnt">${by[w].length}</span></h3></header><div class="chg-rows">` + by[w].map(c => `<div class="chg-r" data-ed="1" data-hay="${esc((c.where + " " + c.label + " " + ((SI.studioLabel && SI.studioLabel(c.k, st)) || "") + " " + fmt(c.from) + " " + fmt(c.to)).toLowerCase())}"><div class="chg-n">${esc((SI.studioLabel && SI.studioLabel(c.k, st)) || c.label)}</div><div class="chg-v"><span class="was" title="Shipped default">${esc(fmt(c.from))}</span><span class="arr" aria-hidden="true">\u2192</span><b title="Your draft">${esc(fmt(c.to))}</b></div><button class="btn sm" data-act="st-revert" data-v="${esc(c.k)}">Reset</button></div>`).join("") + "</div></section>").join("") + "</div>";
};

/* ---------- validation ---------- */
X.validate = function (st) {
  const errors = [], warnings = [], RES = ["", "ideas", "code", "process", "buzz"];
  (st.data.systems || []).forEach(d => { if (!RES.includes(d.res || "")) errors.push(`System "${d.name}": skill "${d.res}" must be ideas, code, process or buzz`); if (d.bt < 1 || d.bt > 4) warnings.push(`System "${d.name}": ${d.bt} build rounds (the usual range is 1 to 4)`); if (d.vp < 0) errors.push(`System "${d.name}": VP cannot be negative`); });
  (st.data.objectives || []).forEach(o => { if (!RES.includes(o.res || "")) errors.push(`Objective "${o.name}": skill "${o.res}" must be ideas, code, process or buzz`); if (o.vp > 14) warnings.push(`Objective "${o.name}": ${o.vp} VP is very high`); });
  ["publisherGates", "gatePool"].forEach(k => (st.data[k] || []).forEach(g => { if (!(g.reqs || []).length) errors.push(`Gate "${g.name}" has no requirements`); }));
  Object.keys(st.config).forEach(k => { const v = st.config[k]; if (typeof v === "number" && !isFinite(v)) errors.push(`Rule ${k} is not a number`); });
  const pe = st.config.phaseEnds; if (Array.isArray(pe) && pe.some((x, i) => i && x <= pe[i - 1])) errors.push("Phase ends must increase, for example [3,8,11,12]");
  return { errors, warnings };
};

/* ---------- history ---------- */
X.snap = function (st) { const v = V(); v.hist.push(JSON.stringify({ config: st.config, data: st.data })); if (v.hist.length > 80) v.hist.shift(); v.fut = []; };
function restore(U, json) { const o = JSON.parse(json); U.studio = { config: o.config, data: o.data }; SI.saveDraft(U.studio); }

const pill = (cls, txt, tip) => `<span class="pill ${cls}"${tip ? ` title="${esc(tip)}"` : ""}>${txt}</span>`;
X.status = function (st) {
  const U = SI.U, v = V(), n = X.diffList(st).length, val = X.validate(st), host = U.hosted, pub = v.pub || {}, pl = e => pub[e] && pub[e].version ? `v${pub[e].version}` : "defaults";
  const dh = SI.hashOf(st), ah = U.active ? SI.hashOf(U.active) : dh, pend = dh !== ah;
  return pill(n ? "mod" : "", `${n} edited value${n === 1 ? "" : "s"}`, "Values that differ from the shipped defaults")
    + pill(val.errors.length ? "bad" : "", `${val.errors.length} error${val.errors.length === 1 ? "" : "s"}`) + pill(val.warnings.length ? "warn" : "", `${val.warnings.length} warning${val.warnings.length === 1 ? "" : "s"}`)
    + pill(pend ? "warn" : "ok", pend ? "Draft not applied to new games yet" : "Applied: new games use this draft", `Draft ${dh} · in use for new games ${ah}`)
    + (host ? pill("", `Live ${pl("live")}`, "Version published to the live site") + pill("", `Test ${pl("test")}`, "Version published to the test site") : "")
    + (v.msg ? `<b class="pill msg" role="status">${esc(v.msg)}</b>` : "");
};
X.alerts = function (st) {
  const val = X.validate(st); if (!val.errors.length && !val.warnings.length) return "";
  return val.errors.map(m => `<div class="al bad">Error: ${esc(m)}</div>`).join("") + val.warnings.slice(0, 4).map(m => `<div class="al warn">Warning: ${esc(m)}</div>`).join("");
};
X.refresh = function () {
  const U = SI.U; if (!U.studio) return;
  const el = document.querySelector(".stu-status"); if (el) el.innerHTML = X.status(U.studio);
  const al = document.querySelector(".stu-alerts"); if (al) al.innerHTML = X.alerts(U.studio);
  if (SI.studioChrome) SI.studioChrome();
};
/* ---------- the sticky header: title, status, and every action ---------- */
X.head = function (st, extra) {
  const U = SI.U, v = V(), host = U.hosted;
  return `<header class="sf-head"><div class="sf-ttl"><h2 id="sf-h">Data Studio</h2><span class="sf-ver">${esc(D.version || "")}</span></div>
  <div class="sf-act">
    <span class="sf-grp"><button class="btn sm" data-act="st-undo" ${v.hist.length ? "" : "disabled"} title="Undo the last edit">Undo</button><button class="btn sm" data-act="st-redo" ${v.fut.length ? "" : "disabled"} title="Redo">Redo</button></span>
    <button class="btn sm ${v.confirm === "reset" ? "danger" : ""}" data-act="st-resetall" title="Throw away every edit and go back to the shipped defaults (can be undone)">${v.confirm === "reset" ? "Click again to reset ALL" : "Revert all"}</button>
    ${host ? `<span class="sf-grp"><button class="btn sm" data-act="st-publish" data-v="test" title="Publish the draft to the test environment">Publish to test</button><button class="btn sm ${v.confirm === "live" ? "danger" : ""}" data-act="st-publish" data-v="live" title="Publish the draft to the live site">${v.confirm === "live" ? "Click again: publish to LIVE" : "Publish to live"}</button></span>` : ""}
    <button class="btn primary" data-act="st-apply" title="Use the draft for new games on this device">Apply to game</button>${extra || ""}
    <button class="x sf-close" data-act="close" aria-label="Close Data Studio (Esc)">Close</button>
  </div>
  <div class="sf-sub"><div class="stu-status" aria-live="polite">${X.status(st)}</div>${host ? `<input id="stnote" class="sf-note" placeholder="Changelog note for the next publish (what changed and why)" value="${esc(v.note)}" maxlength="200" aria-label="Changelog note">` : ""}</div>
  <div class="stu-alerts">${X.alerts(st)}</div></header>`;
};
X.testUrl = () => "/?env=test";
/* ---------- Publish and Import/Export pages ---------- */
X.publishPanel = function () {
  const U = SI.U, v = V(), pub = v.pub || {}, row = (n, e) => { const o = pub[e]; return `<div class="pub-r"><b>${n}</b><span>${o && o.version ? `version ${o.version}${o.note ? " · " + esc(o.note) : ""}` : "shipped defaults (nothing published)"}</span></div>`; };
  if (!U.hosted) return `<div class="sf-empty"><h3>Publishing is not available here</h3><p>This copy is running without the game server, so only <b>Apply to game</b> (this browser) is available.</p></div>`;
  return `<div class="sf-page"><section class="fg"><header><h3>Published versions</h3><p>What the test and live sites use today. Publishing uploads only your edits; everything else stays on the shipped defaults.</p></header><div class="fg-body">${row("Live", "live")}${row("Test", "test")}</div></section>
  <section class="fg"><header><h3>Test environment</h3><p>Try a version with real players before it goes live.</p></header><div class="fg-body"><div class="row wrap" style="gap:8px"><button class="btn" data-act="st-loadtest">Load test version into draft</button><a class="btn" href="${X.testUrl()}" target="_blank" rel="noopener">Open test environment</a><button class="btn" data-act="st-copylink">Copy test link</button></div></div></section></div>`;
};
X.filesPanel = function () {
  const v = V();
  return `<div class="sf-page"><section class="fg"><header><h3>CSV round trip</h3><p>CSV files open in Excel or Google Sheets. Change a cell, then import: only changed values are applied to the draft.</p></header><div class="fg-body">
    <div class="f"><div class="f-lab"><label for="stutpl">Table</label></div><div class="f-ctl"><select id="stutpl">${TPLS.map(t => `<option value="${t[0]}" ${v.tpl === t[0] ? "selected" : ""}>${t[1]}</option>`).join("")}</select></div></div>
    <div class="row wrap" style="gap:8px;padding:6px 0"><button class="btn" data-act="st-csv-export">Export this CSV</button><label class="btn">Import CSV into draft<input type="file" accept=".csv,text/csv" data-stufile="csv" hidden></label></div>
    <div class="row wrap" style="gap:8px;padding:6px 0"><button class="btn" data-act="st-csv-all">Export all CSVs</button><label class="tg"><input type="checkbox" data-stf="zip" ${v.zip ? "checked" : ""}><span class="tg-track" aria-hidden="true"></span><span class="tg-txt">One zip file</span></label></div></div></section>
  <section class="fg"><header><h3>Overrides JSON</h3><p>The overrides file holds just your edits, not the whole game data.</p></header><div class="fg-body"><div class="row wrap" style="gap:8px"><button class="btn" data-act="st-json-export">Export overrides JSON</button><label class="btn">Load JSON into draft<input type="file" accept=".json,application/json" data-stufile="json" hidden></label></div></div></section></div>`;
};

/* ---------- CSV ---------- */
const cq = v => { v = String(v == null ? "" : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
function parseCsv(t) {
  const rows = []; let row = [], f = "", q = false; t = t.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; } else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ""));
}
const parseCell = (kind, v) => kind === "multi:phases" ? v.split(",").map(x => parseInt(x.trim(), 10)).filter(x => !Number.isNaN(x)) : /^multi:/.test(kind) ? v.split(",").map(x => x.trim()).filter(Boolean) : kind === "num" ? (parseFloat(v) || 0) : kind === "csv" ? v.split(",").map(s => s.trim()).filter(Boolean) : kind === "csvn" ? v.split(",").map(s => parseInt(s.trim(), 10)).filter(x => !Number.isNaN(x)) : kind === "semi" ? v.split(";").map(s => s.trim()).filter(Boolean) : v;
X.csvOf = function (st, tpl) {
  const rows = [];
  if (tpl === "rules") { rows.push(["key", "value", "meaning"]); Object.keys(st.config).forEach(k => { if (k === "_meta") return; const m = D.config._meta && D.config._meta[k]; const v = st.config[k]; rows.push([k, typeof v === "object" ? JSON.stringify(v) : v, m ? m[0] : ""]); }); }
  else if (tpl === "tutorial") { rows.push(["id", "when", "title", "btn", "text"]); (st.data.tutorial || []).forEach(r => rows.push([r.id, r.when, r.title, r.btn, r.text])); }
  else { const C = SI.studioCols[tpl]; rows.push(["#"].concat(C.map(c => c[0]))); (st.data[tpl] || []).forEach((r, i) => rows.push([i].concat(C.map(c => SI.cellVal(r[c[0]], c[2]))))); }
  return rows.map(r => r.map(cq).join(",")).join("\r\n") + "\r\n";
};
X.importCsv = function (st, tpl, text) {
  const rows = parseCsv(text); if (rows.length < 2) return { n: 0, err: "The file has no rows." };
  const head = rows[0].map(s => s.trim()), body = rows.slice(1); let n = 0; const set = (obj, f, val) => { if (!same(obj[f], val)) { obj[f] = val; n++; } };
  if (tpl === "rules") { const ki = head.indexOf("key"), vi = head.indexOf("value"); if (ki < 0 || vi < 0) return { n: 0, err: "Rules CSV needs key and value columns." }; body.forEach(r => { const k = r[ki]; if (!(k in st.config) || k === "_meta") return; const dv = st.config[k]; let val; if (typeof dv === "number") { val = parseFloat(r[vi]); if (Number.isNaN(val)) return; } else { try { val = JSON.parse(r[vi]); } catch (e) { return; } } set(st.config, k, val); }); return { n }; }
  if (tpl === "tutorial") { const ii = head.indexOf("id"); if (ii < 0) return { n: 0, err: "Text CSV needs an id column." }; body.forEach(r => { const row = (st.data.tutorial || []).find(x => x.id === r[ii]); if (!row) return; ["title", "btn", "text"].forEach(f => { const c = head.indexOf(f); if (c >= 0 && r[c] != null) set(row, f, r[c]); }); }); return { n }; }
  const C = SI.studioCols[tpl], idx = head.indexOf("#"), ni = head.indexOf("name"), list = st.data[tpl];
  body.forEach(r => { let i = idx >= 0 ? parseInt(r[idx], 10) : -1; if (!(i >= 0 && i < list.length) && ni >= 0) i = list.findIndex(x => x.name === r[ni]); if (!(i >= 0 && i < list.length)) return; C.forEach(c => { if (c[2] === "ro") return; const k = head.indexOf(c[0]); if (k >= 0 && r[k] != null) set(list[i], c[0], parseCell(c[2], r[k])); }); });
  return { n };
};

/* ---------- download helpers + a small ZIP writer (stored, no compression) ---------- */
function dl(name, data, type) { const b = data instanceof Blob ? data : new Blob([data], { type: type || "text/plain" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
X.dl = dl;
let CT; function crc32(u) { if (!CT) { CT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CT[n] = c >>> 0; } } let c = -1; for (let i = 0; i < u.length; i++) c = CT[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
X.zip = function (files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  files.forEach(f => {
    const nm = enc.encode(f.name), d = enc.encode(f.data), crc = crc32(d), lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, nm.length, true);
    parts.push(new Uint8Array(lh.buffer), nm, d);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nm); off += 30 + nm.length + d.length;
  });
  const csz = central.reduce((a, b) => a + b.length, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csz, true); end.setUint32(16, off, true);
  return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/zip" });
};

/* ---------- server calls ---------- */
async function jget(u) { const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error(r.status); return r.json(); }
X.loadPub = async function () {
  const U = SI.U, v = V(); if (!U.hosted || v.pub) return; v.pub = {}; const site = SI.net.site();
  try { v.pub = { live: await jget("/__config?env=live&site=" + site), test: await jget("/__config?env=test&site=" + site) }; SI.render(); } catch (e) {}
};
X.apply = function (U) { SI.saveStudio(U.studio); SI.clearDraft(); U.active = clone({ config: U.studio.config, data: U.studio.data }); if (D.applyText) D.applyText(U.active.data.text); };

/* ---------- actions ---------- */
SI.studioAct = async function (act, t, ctx) {
  const U = ctx.U, v = V(), st = U.studio, val = t.dataset.v;
  const done = m => { if (m != null) v.msg = m; SI.saveDraft(U.studio); ctx.render(); };
  try {
    switch (act) {
      case "st-view": v.view = val; v.confirm = null; ctx.render(); return;
      case "st-nav": { v.confirm = null; if (val.charAt(0) === "@") v.view = val.slice(1); else { U.tab = val; v.view = "table"; } v.refocus = '.nv[data-v="' + val + '"]'; ctx.render(); return; }
      case "st-sel": v.sel[U.tab] = +val; v.refocus = '.li[data-i="' + val + '"]'; ctx.render(); return;
      case "st-rg": v.rg = +val; v.refocus = '.li[data-i="' + val + '"]'; ctx.render(); return;
      case "st-tg": v.tg = val; v.refocus = '.li[data-i="' + t.dataset.i + '"]'; ctx.render(); return;
      case "st-clearq": v.q = ""; v.refocus = "#stq"; ctx.render(); return;
      case "st-revertrow": { X.snap(st); X.diffList(st).filter(c => c.k.indexOf(val + ".") === 0).forEach(c => X.revert(st, c.k)); done("Item reset to the shipped values"); return; }
      case "st-revertgrp": { const g = SI.studioRuleGroups(st)[+val]; X.snap(st); if (g) { const dc = E.defaultConfig(); g.keys.forEach(k => { if (!same(st.config[k], dc[k])) X.revert(st, "cfg:" + k); }); } done("Group reset to the shipped values"); return; }
      case "st-drawer": v.view = v.view === "files" ? "table" : "files"; ctx.render(); return;
      case "st-undo": if (v.hist.length) { v.fut.push(JSON.stringify({ config: st.config, data: st.data })); restore(U, v.hist.pop()); v.msg = "Undone"; ctx.render(); } return;
      case "st-redo": if (v.fut.length) { v.hist.push(JSON.stringify({ config: st.config, data: st.data })); restore(U, v.fut.pop()); v.msg = "Redone"; ctx.render(); } return;
      case "st-revert": X.snap(st); X.revert(st, val); done("Reverted"); return;
      case "st-resetall": if (v.confirm !== "reset") { v.confirm = "reset"; ctx.render(); return; } X.snap(st); U.studio = SI.defaults(); v.confirm = null; done("Draft reset to the shipped baseline"); return;
      case "st-apply": { const val2 = X.validate(st); if (val2.errors.length) { v.msg = "Fix the errors first"; ctx.render(); return; } X.apply(U); v.msg = "Applied: new games on this device use " + SI.hashOf(U.active); ctx.render(); return; }
      case "st-csv-export": dl("shipit-" + v.tpl + ".csv", X.csvOf(st, v.tpl), "text/csv"); return;
      case "st-csv-all": { const files = TPLS.map(t2 => ({ name: "shipit-" + t2[0] + ".csv", data: X.csvOf(st, t2[0]) })); if (v.zip) dl("shipit-data-csv.zip", X.zip(files)); else files.forEach((f, i) => setTimeout(() => dl(f.name, f.data, "text/csv"), i * 250)); return; }
      case "st-json-export": dl("shipit-overrides.json", JSON.stringify(SI.diffOf(st), null, 1), "application/json"); return;
      case "st-copylink": { const u = location.origin + X.testUrl(); try { await navigator.clipboard.writeText(u); v.msg = "Test link copied"; } catch (e) { v.msg = u; } ctx.render(); return; }
      case "st-loadtest": { const o = await jget("/__config?env=test&site=" + SI.net.site()); if (!o || !o.ovr) { v.msg = "No test version is published yet"; ctx.render(); return; } X.snap(st); U.studio = SI.applyDiff(JSON.parse(o.ovr)); done("Loaded test v" + o.version + " into the draft"); return; }
      case "st-publish": {
        const e = val, errs = X.validate(st).errors; if (errs.length) { v.msg = "Fix the errors first"; ctx.render(); return; }
        if (e === "live" && v.confirm !== "live") { v.confirm = "live"; ctx.render(); return; } v.confirm = null;
        const r = await fetch("/__config", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ env: e, site: SI.net.site(), ovr: JSON.stringify(SI.diffOf(st)), note: v.note || "" }) }); const o = await r.json(); if (!r.ok) throw new Error(o.error || r.status);
        v.pub = null; v.msg = "Published to " + e + " as version " + o.version; ctx.render(); X.loadPub(); return;
      }
    }
  } catch (er) { v.msg = "Failed: " + er.message; ctx.render(); }
};

/* ---------- inputs that are not buttons ---------- */
document.addEventListener("input", e => {
  const t = e.target; if (!t || !SI.U || !SI.U.stu && !t.id) return;
  if (t.id === "stq") { const v = V(); v.q = t.value.trim().toLowerCase(); if (SI.studioFilter) SI.studioFilter(); }
  if (t.id === "stnote") V().note = t.value;
});
document.addEventListener("change", e => {
  const t = e.target; if (!t || !SI.U) return; const v = V();
  if (t.dataset && t.dataset.stf === "ed") { v.ed = t.checked; if (SI.studioFilter) SI.studioFilter(); }
  if (t.dataset && t.dataset.stf === "zip") { v.zip = t.checked; }
  if (t.dataset && (t.dataset.cfg || t.dataset.cfgjson || t.dataset.path || t.dataset.mpath) && SI.studioSync) SI.studioSync(t);
  if (t.id === "stutpl") { v.tpl = t.value; }
  if (t.dataset && t.dataset.stufile && t.files && t.files[0]) {
    const kind = t.dataset.stufile, fr = new FileReader(); fr.onload = () => {
      const U = SI.U, st = U.studio; try {
        if (kind === "json") { const o = JSON.parse(fr.result); X.snap(st); U.studio = SI.applyDiff(o.config || o.data ? o : {}); v.msg = "Loaded overrides JSON into the draft"; }
        else { X.snap(st); const r = X.importCsv(st, v.tpl, String(fr.result)); if (r.err) { v.hist.pop(); v.msg = r.err; } else v.msg = r.n + " value" + (r.n === 1 ? "" : "s") + " changed from the CSV"; }
      } catch (er) { v.msg = "Could not read the file: " + er.message; }
      SI.saveDraft(SI.U.studio); SI.render();
    }; fr.readAsText(t.files[0]); t.value = "";
  }
});
})(typeof window !== "undefined" ? window : globalThis);
