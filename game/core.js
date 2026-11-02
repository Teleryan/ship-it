/* SHIP IT!: CORE (public). Shared helpers + tuning overrides; the Data Studio itself (studio.js) is owner-only. */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const E = root.ShipItEngine, B = root.ShipItBot, D = root.SHIPIT_DATA;
const KEY = "shipit.studio.v2"; // v2 stores only deliberate edits (differences from the shipped defaults)
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
SI.esc = esc;

SI.defaults = () => { const config = E.defaultConfig(); return { config, data: E.defaultData(config) }; };
SI.loadStudio = function () {
  const d = SI.defaults();
  try {
    const raw = root.localStorage && root.localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); if (o.config) Object.assign(d.config, o.config); if (o.data) Object.keys(o.data).forEach(k => { if (Array.isArray(o.data[k]) && o.data[k].length === d.data[k].length) d.data[k] = o.data[k]; }); }
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
  if (o.data) Object.keys(o.data).forEach(k => { if (Array.isArray(o.data[k]) && o.data[k].length === d.data[k].length) d.data[k] = o.data[k]; });
  return d;
};
})(typeof window !== "undefined" ? window : globalThis);