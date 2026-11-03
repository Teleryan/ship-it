/* SHIP IT!: CORE (public). Shared helpers + tuning overrides; the Data Studio itself (studio.js) is owner-only. */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const E = root.ShipItEngine, B = root.ShipItBot, D = root.SHIPIT_DATA;
const KEY = "shipit.studio.v2"; // v2 stores only deliberate edits (differences from the shipped defaults)
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
SI.esc = esc;

// array data normally has to match the default length; the tutorial list is matched by row id so rows can be added later without losing edits
const mergeRows = (def, over) => { const m = {}; (over || []).forEach(r => { if (r && r.id) m[r.id] = r; }); return def.map(r => m[r.id] ? Object.assign({}, r, { title: m[r.id].title, btn: m[r.id].btn, text: m[r.id].text }) : r); };
const putData = (d, k, v) => { if (!Array.isArray(v)) return; if (k === "tutorial") d.data[k] = mergeRows(d.data[k], v); else if (v.length === d.data[k].length) d.data[k] = v; };
SI.defaults = () => { const config = E.defaultConfig(); return { config, data: E.defaultData(config) }; };
SI.loadStudio = function () {
  const d = SI.defaults();
  try {
    const raw = root.localStorage && root.localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); if (o.config) Object.assign(d.config, o.config); if (o.data) Object.keys(o.data).forEach(k => putData(d, k, o.data[k])); }
  } catch (e) {}
  return d;
};
SI.saveStudio = function (st) {
  try {
    const d = SI.defaults(); const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const config = {}; Object.keys(st.config).forEach(k => { if (k !== "_meta" && !same(st.config[k], d.config[k])) config[k] = st.config[k]; });
    const data = {}; Object.keys(st.data).forEach(k => { if (!same(st.data[k], d.data[k])) data[k] = st.data[k]; });
    root.localStorage.setItem(KEY, JSON.stringify({ config, data }));
  } catch (e) {}
};
SI.resetStudio = function () { try { root.localStorage.removeItem(KEY); } catch (e) {} return SI.defaults(); };

/* ---- tuning overrides: a diff (config + data) on top of shipped defaults, used by live/test publishing and online rooms ---- */
SI.diffOf = function (st) {
  const d = SI.defaults(); const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const config = {}; Object.keys(st.config).forEach(k => { if (k !== "_meta" && !same(st.config[k], d.config[k])) config[k] = st.config[k]; });
  const data = {}; Object.keys(st.data).forEach(k => { if (!same(st.data[k], d.data[k])) data[k] = st.data[k]; });
  return { config, data };
};
SI.applyDiff = function (o) {
  const d = SI.defaults(); if (!o) return d;
  if (o.config) Object.assign(d.config, o.config);
  if (o.data) Object.keys(o.data).forEach(k => putData(d, k, o.data[k]));
  return d;
};

/* ---- draft (what the Data Studio is editing) vs active (what new games use); hash stamps each game with the data it started from ---- */
const KEYD = "shipit.studio.draft";
SI.hash = function (o) { const t = typeof o === "string" ? o : JSON.stringify(o || {}); let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, "0"); };
SI.hashOf = st => { const d = SI.diffOf(st); return Object.keys(d.config).length + Object.keys(d.data).length ? SI.hash(d) : "base"; };
SI.saveDraft = function (st) { try { root.localStorage.setItem(KEYD, JSON.stringify(SI.diffOf(st))); } catch (e) {} };
SI.loadDraft = function () { try { const raw = root.localStorage.getItem(KEYD); if (raw) return SI.applyDiff(JSON.parse(raw)); } catch (e) {} return null; };
SI.clearDraft = function () { try { root.localStorage.removeItem(KEYD); } catch (e) {} };
})(typeof window !== "undefined" ? window : globalThis);