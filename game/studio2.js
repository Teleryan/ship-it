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
const V = X.state = () => { const U = SI.U; return U.stu || (U.stu = { q: "", ed: false, view: "table", note: "", hist: [], fut: [], sel: {}, drawer: false, msg: "", confirm: null, pub: null, tpl: "systems", zip: true }); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = o => JSON.parse(JSON.stringify(o));
const TABNAME = { spots: "Board spots", systems: "Systems", milestones: "Milestones", objectives: "Objectives", crisis: "Crisis cards", tutorial: "Text", text: "Text", publisherGates: "Publisher gates", gatePool: "Gate pool", roles: "Roles", phases: "Phases", teams: "Teams" };
const TPLS = [["rules", "Rules (every rule value)"], ["spots", "Board spots"], ["systems", "Systems"], ["milestones", "Milestones"], ["objectives", "Objectives"], ["crisis", "Crisis cards"], ["tutorial", "Text (tutorial steps)"], ["text", "Text (other wording)"], ["publisherGates", "Publisher gates"], ["gatePool", "Gate pool"]];

/* ---------- live / display status of every field ---------- */
// live = the engine reads it when a new game starts. display = wording or symbols only.
const STAT = { spots: { note: "display" }, systems: { name: "display", sym: "display" }, milestones: { name: "display", text: "display" }, objectives: { name: "display", sym: "display" }, crisis: { name: "display", text: "display", flavor: "display" }, publisherGates: { name: "display", flavor: "display" }, gatePool: { name: "display", flavor: "display" }, text: { text: "display" } };
const TIP = { live: "The engine reads this when a new game starts, so changing it changes gameplay.", display: "Shown on cards and in text only. Gameplay does not change." };
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
  const def = tab === "tutorial" ? dd.tutorial.find(x => x.id === row.id) : dd[tab][+i]; if (def) row[f] = clone(def[f] == null ? "" : def[f]);
};
const fmt = v => { let t = v == null ? "(empty)" : typeof v === "object" ? JSON.stringify(v) : String(v); return t.length > 110 ? t.slice(0, 107) + "…" : t; };
X.changes = function (st) {
  const v = V(), list = X.diffList(st).filter(c => !v.q || (c.where + " " + c.label + " " + fmt(c.from) + " " + fmt(c.to)).toLowerCase().includes(v.q));
  if (!list.length) return `<p class="mute">${v.q ? "No changes match the search." : "The draft matches the shipped baseline. Nothing has been edited."}</p>`;
  return `<div class="scroll-y"><table class="dt"><thead><tr><th>Where</th><th>Item</th><th>Baseline</th><th>Draft</th><th></th></tr></thead><tbody>` + list.map(c => `<tr><td class="mute">${esc(c.where)}</td><td>${esc(c.label)}</td><td class="mute">${esc(fmt(c.from))}</td><td><b>${esc(fmt(c.to))}</b></td><td><button class="btn sm" data-act="st-revert" data-v="${esc(c.k)}">Revert</button></td></tr>`).join("") + "</tbody></table></div>";
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

X.status = function (st) {
  const U = SI.U, v = V(), n = X.diffList(st).length, val = X.validate(st), host = U.hosted, pub = v.pub || {}, pl = e => pub[e] && pub[e].version ? `v${pub[e].version}` : "defaults";
  return `${n} edited value${n === 1 ? "" : "s"} · <span style="color:${val.errors.length ? "var(--bad)" : "inherit"}">${val.errors.length} error${val.errors.length === 1 ? "" : "s"}</span> · ${val.warnings.length} warning${val.warnings.length === 1 ? "" : "s"} · draft <span class="mono">${SI.hashOf(st)}</span>${U.active ? ` · in use for new games <span class="mono">${SI.hashOf(U.active)}</span>` : ""}${host ? ` · Live ${pl("live")} · Test ${pl("test")}` : ""}${v.msg ? ` · <b style="color:var(--gold)">${esc(v.msg)}</b>` : ""}`;
};
X.refresh = function () { const el = document.querySelector(".stu-status"), U = SI.U; if (el && U.studio) el.innerHTML = X.status(U.studio); };
/* ---------- the frame above every Studio tab ---------- */
X.frame = function (st, tab, tabs) {
  const U = SI.U, v = V(), n = X.diffList(st).length, val = X.validate(st), host = U.hosted;
  const pub = v.pub || {}; const pl = e => pub[e] && pub[e].version ? `v${pub[e].version}` : "defaults";
  let h = '<div class="tabs">' + tabs.map(t => `<button class="tab ${tab === t[0] ? "on" : ""}" data-act="studio-tab" data-v="${t[0]}">${t[1]}</button>`).join("") + "</div>";
  const groups = ["Tutorial steps"].concat(Array.from(new Set((st.data.text || []).map(r => r.group))));
  if (tab === "tutorial") h += `<div class="row wrap stu-bar"><label class="row" style="gap:6px">Wording group <select data-stf="tg">${groups.map(g => `<option ${(v.tg || groups[0]) === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></label></div>`;
  if (tab !== "sim") h += `<div class="row wrap stu-bar"><input id="stq" placeholder="Search name, text, code" value="${esc(v.q)}" style="min-width:220px"><label class="row" style="gap:5px"><input type="checkbox" data-stf="ed" ${v.ed ? "checked" : ""}> Edited only</label>
    <span class="seg"><button class="btn sm ${v.view === "table" ? "primary" : ""}" data-act="st-view" data-v="table">Table</button><button class="btn sm ${v.view === "changes" ? "primary" : ""}" data-act="st-view" data-v="changes">Changes (${n})</button></span></div>`;
  h += `<div class="row wrap stu-bar"><button class="btn sm" data-act="st-undo" ${v.hist.length ? "" : "disabled"}>Undo</button><button class="btn sm" data-act="st-redo" ${v.fut.length ? "" : "disabled"}>Redo</button>
    <button class="btn sm" data-act="st-resetall" style="${v.confirm === "reset" ? "border-color:var(--bad)" : ""}">${v.confirm === "reset" ? "Click again to reset ALL" : "Reset all"}</button>
    <input id="stnote" placeholder="Changelog note (what changed and why)" value="${esc(v.note)}" maxlength="200" class="grow" style="min-width:200px">
    <button class="btn sm primary" data-act="st-apply" title="Use the draft for new games on this device">Apply to game</button>
    ${host ? `<button class="btn sm" data-act="st-publish" data-v="test">Publish to test environment</button><button class="btn sm" data-act="st-publish" data-v="live" style="${v.confirm === "live" ? "border-color:var(--bad)" : ""}">${v.confirm === "live" ? "Click again: publish to LIVE" : "Publish to live"}</button>
    <button class="btn sm" data-act="st-loadtest">Load test version into draft</button><a class="btn sm" href="${X.testUrl()}" target="_blank" rel="noopener">Open test environment</a><button class="btn sm" data-act="st-copylink">Copy test link</button>` : ""}
    <button class="btn sm ${v.drawer ? "primary" : ""}" data-act="st-drawer">CSV and files</button></div>`;
  if (v.drawer) h += `<div class="panel stu-drawer"><div class="row wrap"><label class="row" style="gap:6px">Template <select id="stutpl">${TPLS.map(t => `<option value="${t[0]}" ${v.tpl === t[0] ? "selected" : ""}>${t[1]}</option>`).join("")}</select></label>
    <button class="btn sm" data-act="st-csv-export">Export this CSV</button><label class="btn sm">Import CSV into draft<input type="file" accept=".csv,text/csv" data-stufile="csv" hidden></label>
    <label class="row" style="gap:5px"><input type="checkbox" data-stf="zip" ${v.zip ? "checked" : ""}> one zip file</label><button class="btn sm" data-act="st-csv-all">Export all CSVs</button></div>
    <div class="row wrap" style="margin-top:8px"><button class="btn sm" data-act="st-json-export">Export overrides JSON</button><label class="btn sm">Load JSON into draft<input type="file" accept=".json,application/json" data-stufile="json" hidden></label>
    <span class="mute">CSV files open in Excel or Google Sheets. Change a cell, then import: only changed values are applied. The overrides JSON holds just your edits.</span></div></div>`;
  h += `<div class="stu-status mute">${X.status(st)}</div>`;
  if (val.errors.length || val.warnings.length) h += `<div class="mute" style="font-size:12px;margin:0 0 6px">${val.errors.map(m => `<div style="color:var(--bad)">Error: ${esc(m)}</div>`).join("")}${val.warnings.slice(0, 4).map(m => `<div>Warning: ${esc(m)}</div>`).join("")}</div>`;
  return h;
};
X.testUrl = () => { const s = SI.net && SI.net.site ? SI.net.site() : "c"; return (s === "b" ? "/b/" : s === "a" ? "/a/" : "/") + "?env=test"; };

/* ---------- preview pane ---------- */
function cardOf(tab, r) {
  if (tab === "systems" && SI.sysPreview) { try { return `<div class="mgrid" style="display:block">${SI.sysPreview(r)}</div>`; } catch (e) {} }
  if (tab === "crisis" && SI.crisisPreview) { try { return SI.crisisPreview(r); } catch (e) {} }
  if (tab === "objectives" && SI.symTag) { try { return `<div class="sys" style="width:100%"><div class="t">${esc(r.name)} ${SI.symTag(r)}</div><div class="meta">${esc(r.type)} · ${r.vp} VP</div>${(r.reqs || []).map(q => `<div class="e">${esc(q)}</div>`).join("")}</div>`; } catch (e) {} }
  if (tab === "milestones") return `<div class="sys" style="width:100%"><div class="t">${esc(r.name)}</div><div class="e" style="color:var(--gold)">+${r.gold} Gold</div><div class="e">${esc(r.text)}</div></div>`;
  if (tab === "publisherGates" || tab === "gatePool") return `<div class="sys" style="width:100%"><div class="t">${esc(r.name)}</div><div class="meta">Phase ${(r.phase | 0) + 1} publisher gate</div>${(r.reqs || []).map(q => `<div class="e">${esc(q)}</div>`).join("")}<div class="e">Pass: +${r.fund} Gold${r.vp ? ", +" + r.vp + " VP" : ""}</div><div class="e">Miss: ${r.penalty} penalty</div><div class="mute" style="font-size:11px">${esc(r.flavor)}</div></div>`;
  const COLS = SI.studioCols[tab] || [];
  return `<div class="sys" style="width:100%"><div class="t">${esc(r.name || r.id || "")}</div>` + COLS.filter(c => c[0] !== "name" && r[c[0]] !== "" && r[c[0]] != null).map(c => `<div class="e"><span class="mute">${esc(c[1].replace(/ \(.*$/, ""))}:</span> ${esc(SI.cellVal(r[c[0]], c[2]))}</div>`).join("") + "</div>";
}
X.preview = function (tab, st, def, sel) {
  const row = st.data[tab][sel]; if (!row) return "";
  const base = def[sel], diff = base && !same(row, base);
  return `<div class="stu-prev"><div class="mute" style="margin-bottom:6px">Preview${diff ? ": baseline and draft" : ""}</div>` + (diff ? `<div class="pv2"><div><small class="mute">Baseline</small>${cardOf(tab, base)}</div><div><small class="mute">Draft</small>${cardOf(tab, row)}</div></div>` : cardOf(tab, row)) + "</div>";
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
      case "st-sel": (v.sel[U.tab] = +val); ctx.render(); return;
      case "st-drawer": v.drawer = !v.drawer; ctx.render(); return;
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
  if (t.id === "stq") { const v = V(); v.q = t.value.trim().toLowerCase(); document.querySelectorAll("[data-hay]").forEach(el => { el.hidden = !((!v.q || el.dataset.hay.includes(v.q)) && (!v.ed || el.dataset.ed === "1")); }); }
  if (t.id === "stnote") V().note = t.value;
});
document.addEventListener("change", e => {
  const t = e.target; if (!t || !SI.U) return; const v = V();
  if (t.dataset && t.dataset.stf === "ed") { v.ed = t.checked; SI.render(); }
  if (t.dataset && t.dataset.stf === "zip") { v.zip = t.checked; }
  if (t.dataset && t.dataset.stf === "tg") { v.tg = t.value; SI.render(); }
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
