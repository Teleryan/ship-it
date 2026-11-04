/* ============================================================
   SHIP IT!: ANALYTICS TAB (master account only)
   KPI tiles, SVG charts (hover for values, click to zoom), All / Live / Test filter, completed-only filter,
   CSV downloads and a per-game detail view. Reads the records the game posts to /__games.
   Player games and bot simulations share one record shape; the "Simulations" toggle switches between them.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const esc = SI.esc;
const T = SI.stats = {};
const M = () => SI.U.master;
const AN = () => { const m = M(); return m.a || (m.a = { view: "players", env: "all", done: true, n: "all", mode: "all", detail: null }); };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const med = a => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const f1 = x => (Math.round(x * 10) / 10).toString();
const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "–";
const CAP = 20 * 60; // a round longer than 20 minutes means someone stepped away: count it as 20 minutes
const mmss = s => { s = Math.round(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

/* ---------- records ---------- */
T.expand = function (games) {
  const out = [];
  (games || []).forEach(g => { if (g.mode === "simbatch") (g.games || []).forEach(x => out.push(Object.assign({ sim: true, mode: "sim", env: "sim", tuned: g.label || x.tuned, label: g.label }, x))); else out.push(g); });
  return out;
};
const statusOf = g => g.status || (g.completed ? "complete" : "abandoned");
const envOf = g => g.sim ? "sim" : (g.test || /^test/.test(g.tuned || "")) ? "test" : "live";
const winVP = g => (g.scores || []).length ? Math.max.apply(null, g.scores.map(s => s.total)) : null;
const gapOf = g => { const t = (g.scores || []).map(s => s.total).sort((a, b) => b - a); return t.length > 1 ? t[0] - t[1] : null; };
function roundSecs(g) { // seconds for each round, capped; null when there is no timing
  if (g.sim) return null; const s = (g.snaps || []).filter(x => x.t != null).sort((a, b) => a.t - b.t); if (s.length < 2) return null;
  const out = []; for (let i = 1; i < s.length; i++) out.push(Math.min(CAP, (s[i].t - s[i - 1].t) / 1000)); return out;
}
function filtered(all, a) {
  return all.filter(g => (a.view === "sims" ? g.sim : !g.sim) && (a.env === "all" || a.view === "sims" || envOf(g) === a.env) && (!a.done || statusOf(g) === "complete") && (a.n === "all" || g.n === +a.n) && (a.view === "sims" || a.mode === "all" || g.mode === a.mode));
}

/* ---------- charts ---------- */
const CH = {};
const niceMax = v => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
function draw(spec, W, H, id) {
  CH[id] = spec; const fs = W > 700 ? 11 : 14, L = W > 700 ? 46 : 50, R = 10, Tp = 10, B = spec.rot ? 44 : 26, pw = W - L - R, ph = H - Tp - B, n = spec.xs.length, S = spec.series;
  let lo = 0, hi = 0;
  if (spec.stacked) { for (let i = 0; i < n; i++) { let t = 0; S.forEach(s => { t += Math.max(0, s.v[i] || 0); }); hi = Math.max(hi, t); } }
  else S.forEach(s => s.v.forEach(v => { if (v != null) { hi = Math.max(hi, v); lo = Math.min(lo, v); } }));
  if (spec.min != null) lo = spec.min; hi = spec.max != null ? spec.max : niceMax(hi * 1.04); if (lo < 0) lo = -niceMax(-lo);
  const Y = v => Tp + ph - (v - lo) / ((hi - lo) || 1) * ph, bw = pw / Math.max(1, n);
  const X = i => spec.type === "line" ? L + (n === 1 ? pw / 2 : i * pw / (n - 1)) : L + bw * i + bw / 2;
  spec.geom = { L, R, W, H, pw, n, type: spec.type };
  let g = `<svg class="ch-svg" data-ch="${id}" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(spec.title)}">`;
  for (let k = 0; k <= 4; k++) { const v = lo + (hi - lo) * k / 4, y = Y(v); g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" style="stroke:var(--line)" stroke-width="1"/><text x="${L - 6}" y="${y + 3}" text-anchor="end" font-size="${fs}" style="fill:var(--mute)">${esc((spec.axis || spec.fmt || f1)(v))}</text>`; }
  if (lo < 0) g += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" style="stroke:var(--mute)" stroke-width="1"/>`;
  const every = Math.ceil(n / (W > 700 ? 18 : 9));
  spec.xs.forEach((x, i) => { if (i % every) return; const px = X(i); g += spec.rot ? `<text transform="translate(${px},${H - B + 12}) rotate(-30)" text-anchor="end" font-size="${fs}" style="fill:var(--mute)">${esc(x)}</text>` : `<text x="${px}" y="${H - 8}" text-anchor="middle" font-size="${fs}" style="fill:var(--mute)">${esc(x)}</text>`; });
  (spec.bands || []).forEach(b => { g += `<rect x="${L}" y="${Y(b[1])}" width="${pw}" height="${Math.max(1, Y(b[0]) - Y(b[1]))}" style="fill:var(--good);opacity:.1"/><text x="${W - R - 4}" y="${Y(b[1]) + 11}" text-anchor="end" font-size="${fs}" style="fill:var(--good)">${esc(b[2] || "")}</text>`; });
  if (spec.type === "line") {
    S.forEach(s => { let d = "", pen = false; s.v.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); pen = true; }); g += `<path d="${d}" fill="none" style="stroke:${s.c}" stroke-width="2" stroke-linejoin="round"/>`; if (n <= 16) s.v.forEach((v, i) => { if (v != null) g += `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.5" style="fill:${s.c}"/>`; }); });
  } else {
    const k = spec.stacked ? 1 : S.length, w = Math.min(46, bw * 0.78 / k);
    for (let i = 0; i < n; i++) { let up = 0, dn = 0; S.forEach((s, j) => { const v = s.v[i]; if (v == null) return; const x0 = spec.stacked ? X(i) - w / 2 : X(i) - w * k / 2 + w * j; let y1, y2; if (spec.stacked) { if (v >= 0) { y1 = Y(up + v); y2 = Y(up); up += v; } else { y1 = Y(dn); y2 = Y(dn + v); dn += v; } } else { y1 = Y(Math.max(0, v)); y2 = Y(Math.min(0, v)); } g += `<rect x="${x0.toFixed(1)}" y="${y1.toFixed(1)}" width="${(w - 1).toFixed(1)}" height="${Math.max(0.5, y2 - y1).toFixed(1)}" rx="2" style="fill:${s.c}"/>`; }); }
  }
  g += `<line class="xh" x1="0" x2="0" y1="${Tp}" y2="${Tp + ph}" style="stroke:var(--ink);opacity:0" stroke-width="1"/></svg>`;
  const leg = S.length > 1 || spec.legend ? `<div class="ch-leg">${S.map(s => `<span><i style="background:${s.c}"></i>${esc(s.n)}</span>`).join("")}</div>` : "";
  return g + leg;
}
function chart(id, spec) {
  if (spec.empty) return `<div class="chpanel"><h4>${esc(spec.title)}</h4><p class="mute">${esc(spec.empty)}</p></div>`;
  return `<div class="chpanel" data-zoom="${id}"><div class="row" style="justify-content:space-between"><h4>${esc(spec.title)}</h4><button class="btn sm" data-act="m-an-zoom" data-v="${id}" title="Open this chart full size">Zoom</button></div>${spec.note ? `<div class="mute" style="font-size:11px;margin:-2px 0 4px">${esc(spec.note)}</div>` : ""}${draw(spec, 520, 230, id)}</div>`;
}
let tip; const getTip = () => tip || (tip = Object.assign(document.createElement("div"), { className: "chtip" }), document.body.appendChild(tip), tip);
document.addEventListener("mousemove", e => {
  const svg = e.target && e.target.closest ? e.target.closest(".ch-svg") : null; const t = getTip();
  if (!svg) { t.style.display = "none"; document.querySelectorAll(".ch-svg .xh").forEach(l => { l.style.opacity = 0; }); return; }
  const sp = CH[svg.dataset.ch]; if (!sp || !sp.geom) return; const g = sp.geom, r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * g.W;
  let i = g.type === "line" ? Math.round((sx - g.L) / (g.pw / Math.max(1, g.n - 1))) : Math.floor((sx - g.L) / (g.pw / g.n)); i = Math.max(0, Math.min(g.n - 1, i)); if (g.n === 1) i = 0;
  const px = g.type === "line" ? g.L + (g.n === 1 ? g.pw / 2 : i * g.pw / (g.n - 1)) : g.L + g.pw / g.n * (i + 0.5), xh = svg.querySelector(".xh"); xh.setAttribute("x1", px); xh.setAttribute("x2", px); xh.style.opacity = g.type === "line" ? 0.5 : 0;
  t.innerHTML = `<b>${esc(sp.xs[i])}</b>` + sp.series.map(s => s.v[i] == null ? "" : `<div><i style="background:${s.c}"></i>${esc(s.n)}: <b>${esc((sp.fmt || f1)(s.v[i]))}</b></div>`).join("");
  t.style.display = "block"; t.style.left = Math.min(innerWidth - 220, e.clientX + 14) + "px"; t.style.top = Math.max(6, e.clientY - 10) + "px";
});
T.zoom = function (id) {
  const sp = CH[id]; if (!sp) return; const o = document.createElement("div"); o.className = "zoomov";
  o.innerHTML = `<div class="zbox"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(sp.title)}</h3><button class="btn sm" data-zclose="1" aria-label="Close">X</button></div>${sp.note ? `<div class="mute" style="font-size:12px">${esc(sp.note)}</div>` : ""}${draw(sp, 1100, 520, id + "z")}</div>`;
  o.addEventListener("click", ev => { if (ev.target === o || (ev.target.dataset && ev.target.dataset.zclose)) o.remove(); }); document.body.appendChild(o);
};
document.addEventListener("keydown", e => { if (e.key === "Escape") { const z = document.querySelector(".zoomov"); if (z) { z.remove(); e.stopPropagation(); } } }, true);

/* ---------- numbers ---------- */
const PARTS = (gs) => { const k = {}; gs.forEach(g => (g.scores || []).forEach(s => Object.keys(s.parts || {}).forEach(p => { if (typeof s.parts[p] === "number" && s.parts[p] !== 0 && !/Pct$|^threshold$|^total$/.test(p)) k[p] = 1; }))); return Object.keys(k); };
const NICE = { prodShare: "Progress share", mktShare: "Marketing share", hypeStrength: "Hype (race)", delivery: "Delivery", debtPenalty: "Debt penalty", culture: "Culture", objectives: "Objectives", synergy: "Synergy", systems: "Systems", launch: "Launch", milestones: "Milestones", gold: "Gold", gates: "Gates", bank: "Bank" };
const nice = k => NICE[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
function perRound(gs, fn) { // average per player at the start of each round
  const R = {}; gs.forEach(g => (g.snaps || []).forEach(s => { if (s.k === 99) return; (s.p || []).forEach(p => { const r = R[s.r] = R[s.r] || { n: 0, v: {} }; r.n++; const o = fn(p); Object.keys(o).forEach(k => { r.v[k] = (r.v[k] || 0) + (o[k] || 0); }); }); }));
  const rs = Object.keys(R).map(Number).sort((a, b) => a - b); return { rs, get: k => rs.map(r => R[r].v[k] / R[r].n) };
}
T.kpis = function (gs, a) {
  const done = gs.filter(g => g.scores), win = done.map(winVP).filter(v => v != null), gaps = done.map(gapOf).filter(v => v != null);
  const lens = gs.map(g => { const r = roundSecs(g); return r ? r.reduce((x, y) => x + y, 0) / 60 : null; }).filter(v => v != null);
  const rl = [].concat.apply([], gs.map(g => roundSecs(g) || [])); const names = new Set(); gs.forEach(g => (g.seats || []).forEach(s => { if (!s.bot && s.name) names.add(s.name.toLowerCase()); }));
  const t = [["Games", gs.length], [a.view === "sims" ? "Bot seats" : "Players (distinct names)", a.view === "sims" ? gs.reduce((x, g) => x + g.n, 0) : names.size], ["Avg players per game", f1(avg(gs.map(g => g.n)))]];
  if (a.view !== "sims") t.push(["Avg game length", lens.length ? Math.round(avg(lens)) + " min" : "–", lens.length ? "median " + Math.round(med(lens)) : ""], ["Avg round length", rl.length ? mmss(avg(rl)) : "–", rl.length ? "median " + mmss(med(rl)) : ""]);
  t.push(["Avg rounds", f1(avg(gs.map(g => g.rounds || 0)))], ["Avg winner VP", win.length ? f1(avg(win)) : "–", win.length ? "median " + f1(med(win)) : ""], ["Winner in 100 to 140", win.length ? pct(win.filter(v => v >= 100 && v <= 140).length, win.length) : "–", "goal"], ["Median VP gap", gaps.length ? f1(med(gaps)) : "–", gaps.length ? "blowouts " + pct(gaps.filter(x => x >= 25).length, gaps.length) : ""]);
  return `<div class="kpis">${t.map(k => `<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b>${k[2] ? `<span>${k[2]}</span>` : ""}</div>`).join("")}</div>`;
};
T.charts = function (gs, a) {
  const out = [], done = gs.filter(g => g.scores);
  const eco = perRound(gs, p => ({ g: p.g, i: p.rs[0], c: p.rs[1], p: p.rs[2], b: p.rs[3], pr: p.pr, mk: p.mk, hy: p.hy, db: p.db, cu: p.cu, w: p.w, sy: p.sy, ob: p.ob, ml: p.ml, sr: p.sr, bd: p.bd }));
  const xs = eco.rs.map(r => "R" + r); const L = (n, c, k) => ({ n, c, v: eco.get(k) });
  out.push(chart("c1", eco.rs.length ? { type: "line", title: "Economy: what each player holds at the start of each round", note: "Average per player. Skills held, not earned.", xs, series: [L("Gold", "var(--gold)", "g"), L("Ideas", "var(--ideas)", "i"), L("Code", "var(--code)", "c"), L("Process", "var(--process)", "p"), L("Buzz", "var(--buzz)", "b")] } : { title: "Economy", empty: "No round data yet." }));
  out.push(chart("c2", eco.rs.length ? { type: "line", title: "Progress and tracks by round", note: "Average per player.", xs, series: [L("Progress", "var(--pr)", "pr"), L("Marketing", "var(--mk)", "mk"), L("Hype", "var(--hype)", "hy"), L("Tech Debt", "var(--bad)", "db"), L("Culture", "#7bd88f", "cu")] } : { title: "Progress and tracks", empty: "No round data yet." }));
  out.push(chart("c3", eco.rs.length ? { type: "line", title: "Studio growth by round", note: "Average per player. Crews are workers committed to a system under construction.", xs, series: [L("Workers", "var(--code)", "w"), L("Seniors", "var(--process)", "sr"), L("Systems built", "var(--gold)", "sy"), L("Crews building", "var(--buzz)", "bd"), L("Objectives held", "var(--ideas)", "ob"), L("Milestones claimed", "var(--hype)", "ml")] } : { title: "Studio growth", empty: "No round data yet." }));
  const byN = {}; done.forEach(g => { (byN[g.n] = byN[g.n] || []).push(g); }); const ns = Object.keys(byN).sort();
  out.push(chart("c4", ns.length ? { type: "bar", title: "Winner and last-place VP by player count", note: "Green band = the 100 to 140 goal for the winner.", xs: ns.map(n => n + " players"), bands: [[100, 140, "goal"]], series: [{ n: "Winner (average)", c: "var(--good)", v: ns.map(n => avg(byN[n].map(winVP))) }, { n: "Last place (average)", c: "var(--bad)", v: ns.map(n => avg(byN[n].map(g => Math.min.apply(null, g.scores.map(s => s.total))))) }] } : { title: "Winner and last-place VP", empty: "No completed games yet." }));
  const keys = PARTS(done), wsum = {}, asum = {}; let np = 0, nw = 0;
  done.forEach(g => g.scores.forEach(s => { np++; const w = g.winner === s.id; if (w) nw++; keys.forEach(k => { const v = s.parts && s.parts[k] || 0; asum[k] = (asum[k] || 0) + v; if (w) wsum[k] = (wsum[k] || 0) + v; }); }));
  out.push(chart("c5", keys.length ? { type: "bar", title: "Where the score comes from", note: "Average VP per player from each source; winners next to everyone.", xs: keys.map(nice), rot: 1, series: [{ n: "All players", c: "var(--prod)", v: keys.map(k => asum[k] / np) }, { n: "Winners", c: "var(--gold)", v: keys.map(k => nw ? wsum[k] / nw : 0) }] } : { title: "Where the score comes from", empty: "No completed games yet." }));
  const rl = {}; gs.forEach(g => { const r = roundSecs(g); if (r) r.forEach((s, i) => { (rl[i + 1] = rl[i + 1] || []).push(s); }); }); const rk = Object.keys(rl).map(Number).sort((x, y) => x - y);
  out.push(chart("c6", rk.length ? { type: "line", title: "Average round length", note: "Minutes. A round over 20 minutes counts as 20 (someone stepped away).", xs: rk.map(r => "R" + r), series: [{ n: "Minutes", c: "var(--gold)", v: rk.map(r => avg(rl[r]) / 60) }], fmt: x => f1(x) + " min" } : { title: "Average round length", empty: a.view === "sims" ? "Simulated games have no human timing." : "No timing data yet." }));
  const lens = gs.map(g => { const r = roundSecs(g); return r ? r.reduce((x, y) => x + y, 0) / 60 : null; }).filter(v => v != null), bk = {}; lens.forEach(m => { const b = Math.floor(m / 10) * 10; bk[b] = (bk[b] || 0) + 1; });
  const bmax = lens.length ? Math.floor(Math.max.apply(null, lens) / 10) * 10 : 0, bx = []; for (let b = 0; b <= bmax; b += 10) bx.push(b);
  out.push(chart("c7", lens.length ? { type: "bar", title: "Game length", note: "Number of games in each 10-minute bucket.", xs: bx.map(b => b + "–" + (b + 10)), series: [{ n: "Games", c: "var(--code)", v: bx.map(b => bk[b] || 0) }], fmt: x => String(Math.round(x)) } : { title: "Game length", empty: a.view === "sims" ? "Simulated games have no human timing." : "No timing data yet." }));
  const slot = {}; done.forEach(g => { if (g.winner == null) return; const o = (g.seats || []).map(s => s.order); const wi = g.winner; g.seats.forEach((s, i) => { const key = g.n + "|" + (s.order + 1); const q = slot[key] = slot[key] || { g: 0, w: 0 }; q.g++; if (i === wi) q.w++; }); });
  const sx = [1, 2, 3, 4, 5, 6].map(i => "Turn slot " + i);
  out.push(chart("c8", Object.keys(slot).length ? { type: "bar", title: "Win rate by turn-order slot", note: "Percent of games won from each slot. An even game sits at 100 divided by the number of players.", xs: sx, fmt: x => Math.round(x) + "%", series: ns.map((n, k) => ({ n: n + " players", c: ["var(--pre)", "var(--prod)", "var(--pol)", "var(--gold)", "var(--launch)"][k % 5], v: [1, 2, 3, 4, 5, 6].map(i => { const q = slot[n + "|" + i]; return q && q.g ? q.w / q.g * 100 : null; }) })) } : { title: "Win rate by turn-order slot", empty: "No completed games yet." }));
  const gt = {}; gs.forEach(g => (g.gates || []).forEach(x => { const q = gt[x.name] = gt[x.name] || { p: 0, f: 0 }; q.p += (x.passed || []).length; q.f += (x.failed || []).length; })); const gk = Object.keys(gt);
  out.push(chart("c9", gk.length ? { type: "bar", title: "Publisher gates: pass rate", note: "Share of studios that met each gate.", xs: gk, rot: gk.length > 4 ? 1 : 0, fmt: x => Math.round(x) + "%", max: 100, series: [{ n: "Passed", c: "var(--good)", v: gk.map(k => gt[k].p / ((gt[k].p + gt[k].f) || 1) * 100) }] } : { title: "Publisher gates", empty: "No gate data yet." }));
  { const hasBo = gs.some(g => (g.snaps || []).some(s => (s.p || []).some(p => p.bo))); if (hasBo) { const bo = perRound(gs, p => ({ b: p.bo || 0 })); out.push(chart("c10", { type: "line", title: "Burnout by round", note: "Average Burnout per player at the start of each round (0 to 6). Strained from 3, Burned out from 5.", xs: bo.rs.map(r => "R" + r), series: [{ n: "Burnout", c: "var(--bad)", v: bo.get("b") }], min: 0, max: 6 })); } }
  { const ty = {}; done.forEach(g => { const avgT = avg(g.scores.map(z => z.total)); g.seats.forEach((x, i) => { const k = x.bot ? (x.persona || "standard") + (x.profile ? " · " + x.profile : "") : "human", q = ty[k] = ty[k] || { g: 0, w: 0, vp: 0, d: 0, ex: 0 }; q.g++; q.vp += g.scores[i] ? g.scores[i].total : 0; q.d += (g.scores[i] ? g.scores[i].total : 0) - avgT; q.ex += 100 / g.n; if (g.winner === i) q.w++; }); });
    const tk = Object.keys(ty).sort(); if (tk.length > 1) { out.push(chart("c11", { type: "bar", title: "Win rate by player type", note: "Share of seats that won, next to the rate an even table would give. Persona · skill level.", xs: tk, rot: 1, fmt: x => Math.round(x) + "%", series: [{ n: "Win rate", c: "var(--good)", v: tk.map(k => ty[k].w / ty[k].g * 100) }, { n: "Even-table rate", c: "var(--line)", v: tk.map(k => ty[k].ex / ty[k].g) }] }));
      out.push(chart("c12", { type: "bar", title: "Average VP by player type", note: "Average final VP, and how far above or below the table average each type finishes.", xs: tk, rot: 1, series: [{ n: "Average VP", c: "var(--prod)", v: tk.map(k => ty[k].vp / ty[k].g) }, { n: "VP vs table average", c: "var(--gold)", v: tk.map(k => ty[k].d / ty[k].g) }] })); } }
  return out.join("");
};

/* ---------- tables ---------- */
const tbl = (head, rows, cls) => `<div class="scroll-x"><table class="scoretbl ${cls || ""}"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
T.tables = function (gs, a) {
  const done = gs.filter(g => g.scores), byN = {}; done.forEach(g => { (byN[g.n] = byN[g.n] || []).push(g); });
  const rows = Object.keys(byN).sort().map(n => { const x = byN[n], w = x.map(winVP), gp = x.map(gapOf).filter(v => v != null), lens = x.map(g => { const r = roundSecs(g); return r ? r.reduce((p, q) => p + q, 0) / 60 : null; }).filter(v => v != null);
    return [n, x.length, f1(med(w)), f1(avg(w)), f1(Math.min.apply(null, w)) + " – " + f1(Math.max.apply(null, w)), pct(w.filter(v => v >= 100 && v <= 140).length, w.length), f1(med(gp)), pct(gp.filter(v => v >= 25).length, gp.length), lens.length ? Math.round(avg(lens)) + " min" : "–"]; });
  let h = `<h3>Games by player count <span class="mute" style="text-transform:none;letter-spacing:0">(goal: winner 100 to 140, no blowouts)</span></h3>` + (rows.length ? tbl(["Players", "Games", "Median winner VP", "Average", "Low to high", "In 100 to 140", "Median gap", "Blowouts (25+)", "Avg length"], rows) : '<p class="mute">No completed games match the filters.</p>');
  const per = {}; done.forEach(g => g.seats.forEach((s, i) => { const k = s.bot ? (s.persona || "standard bot") + (s.profile ? " · " + s.profile : "") : "human"; const q = per[k] = per[k] || { g: 0, w: 0, vp: 0 }; q.g++; q.vp += g.scores[i] ? g.scores[i].total : 0; if (g.winner === i) q.w++; }));
  if (Object.keys(per).length) h += `<h3>Win rate by player type</h3>` + tbl(["Player type", "Seats played", "Win rate", "Average VP"], Object.keys(per).sort().map(k => [esc(k), per[k].g, pct(per[k].w, per[k].g), f1(per[k].vp / per[k].g)]));
  { const pn = {}; done.forEach(g => g.seats.forEach((x, i) => { const k = x.bot ? (x.persona || "standard bot") + (x.profile ? " · " + x.profile : "") : "human", q = (pn[k] = pn[k] || {}), c = (q[g.n] = q[g.n] || { g: 0, w: 0, vp: 0, d: 0 }); c.g++; const t = g.scores[i] ? g.scores[i].total : 0, avgT = avg(g.scores.map(z => z.total)); c.vp += t; c.d += t - avgT; if (g.winner === i) c.w++; }));
    const ks = Object.keys(pn).sort(), nn = Object.keys(byN).sort();
    if (ks.length > 1 && nn.length) h += `<h3>Player type by player count <span class="mute" style="text-transform:none;letter-spacing:0">(win rate · average VP · VP vs table average; an even game wins 100 divided by players)</span></h3>` + tbl(["Player type"].concat(nn.map(n => n + " players")), ks.map(k => [esc(k)].concat(nn.map(n => { const c = pn[k][n]; return c ? `${pct(c.w, c.g)} · ${f1(c.vp / c.g)} · ${c.d / c.g >= 0 ? "+" : ""}${f1(c.d / c.g)} (${c.g})` : "–"; })))); }
  if (a.view === "sims") { const lab = {}; gs.forEach(g => { const k = g.label || "(no label)"; const q = lab[k] = lab[k] || { g: 0, w: [] }; q.g++; const w = winVP(g); if (w != null) q.w.push(w); }); h += `<h3>Simulation batches by label</h3>` + tbl(["Label", "Games", "Avg winner VP"], Object.keys(lab).map(k => [esc(k), lab[k].g, f1(avg(lab[k].w))])); }
  const recent = gs.slice().sort((x, y) => (y.endedAt || 0) - (x.endedAt || 0)).slice(0, 200);
  h += `<h3>Recent games <span class="mute" style="text-transform:none;letter-spacing:0">(newest 200 of ${gs.length})</span></h3>` + tbl(["When", "Mode", "Env", "Players", "Winner", "VP", "Gap", "Rounds", "Status", ""], recent.map(g => { const w = winVP(g); return [g.endedAt ? new Date(g.endedAt).toLocaleString() : "", esc(g.mode + (g.code ? " " + g.code : "")), envOf(g), g.n, g.winner != null && g.seats[g.winner] ? esc(g.seats[g.winner].name) : "–", w != null ? f1(w) : "–", gapOf(g) != null ? f1(gapOf(g)) : "–", g.rounds, statusOf(g), `<button class="btn sm" data-act="m-an-open" data-v="${esc(g.id)}">Open</button>`]; }));
  return h;
};

/* ---------- one game ---------- */
T.detail = function (g) {
  const rs = (g.snaps || []).filter(s => s.k !== 99), xs = rs.map(s => "R" + s.r), cols = ["var(--prod)", "var(--gold)", "var(--pol)", "var(--hype)", "var(--code)", "var(--ideas)"];
  const seatLine = (key, title, k) => chart("d" + k, { type: "line", title, xs, series: g.seats.map((s, i) => ({ n: s.name + (s.bot ? " (bot)" : ""), c: cols[i % 6], v: rs.map(r => key(r.p[i])) })) });
  let h = `<div class="row wrap"><button class="btn sm" data-act="m-an-back">Back to the list</button><b>${esc(g.mode)}${g.code ? " " + esc(g.code) : ""}</b><span class="mute">${g.endedAt ? new Date(g.endedAt).toLocaleString() : ""} · ${g.n} players · ${g.rounds} rounds · ${statusOf(g)} · data ${esc(g.hash || g.tuned || "base")}</span></div>`;
  if (g.scores) { const keys = PARTS([g]); h += `<h3>Final scores</h3>` + tbl(["Seat", "Name", "Turn slot", "Total"].concat(keys.map(nice)), g.scores.map(s => { const st = g.seats[s.id] || {}; return [s.id + 1, esc(st.name || "") + (st.bot ? " (bot" + (st.persona ? ", " + esc(st.persona) : "") + ")" : "") + (g.winner === s.id ? " ★" : ""), (st.order != null ? st.order + 1 : ""), "<b>" + f1(s.total) + "</b>"].concat(keys.map(k => f1(s.parts && s.parts[k] || 0))); })); }
  if ((g.gates || []).length) h += `<h3>Publisher gates</h3>` + tbl(["Gate", "Phase", "Passed (seats)", "Missed (seats)"], g.gates.map(x => [esc(x.name), (x.ph | 0) + 1, (x.passed || []).map(i => i + 1).join(", ") || "–", (x.failed || []).map(i => i + 1).join(", ") || "–"]));
  h += `<div class="charts">` + seatLine(p => p.pr, "Progress by round", 1) + seatLine(p => p.g, "Gold by round", 2) + seatLine(p => p.hy, "Hype by round", 3) + seatLine(p => p.sy, "Systems built by round", 4) + `</div>`;
  return h;
};

/* ---------- CSV ---------- */
const cq = v => { v = String(v == null ? "" : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
T.csv = function (gs, kind) {
  const rows = [];
  if (kind === "games") {
    const keys = PARTS(gs); rows.push(["game_id", "started", "env", "mode", "status", "players", "humans", "rounds", "play_minutes", "avg_round_seconds", "winner_seat", "data_hash", "device", "seat", "name", "bot", "persona", "turn_slot", "total_vp"].concat(keys.map(k => "vp_" + k), ["gold", "ideas", "code", "process", "buzz", "progress", "marketing", "hype", "debt", "culture", "workers", "seniors", "systems", "objectives"]));
    gs.forEach(g => { const r = roundSecs(g) || []; g.seats.forEach((s, i) => { const f = (g.final || [])[i] || {}, sc = (g.scores || [])[i] || {}; rows.push([g.id, g.startedAt ? new Date(g.startedAt).toISOString() : "", envOf(g), g.mode, statusOf(g), g.n, g.humans, g.rounds, r.length ? (r.reduce((x, y) => x + y, 0) / 60).toFixed(1) : "", r.length ? Math.round(avg(r)) : "", g.winner != null ? g.winner + 1 : "", g.hash || g.tuned || "", g.device || "", i + 1, s.name, s.bot ? 1 : 0, s.persona || "", s.order != null ? s.order + 1 : "", sc.total != null ? sc.total : ""].concat(keys.map(k => sc.parts && sc.parts[k] != null ? sc.parts[k] : ""), [f.g, (f.rs || [])[0], (f.rs || [])[1], (f.rs || [])[2], (f.rs || [])[3], f.pr, f.mk, f.hy, f.db, f.cu, f.w, f.sr, f.sy, f.ob])); }); });
  } else {
    rows.push(["game_id", "round", "seconds_into_game", "seat", "gold", "ideas", "code", "process", "buzz", "progress", "marketing", "hype", "debt", "culture", "workers", "seniors", "systems", "objectives", "milestones", "crews_building"]);
    gs.forEach(g => (g.snaps || []).forEach(s => { if (s.k === 99) return; (s.p || []).forEach((p, i) => rows.push([g.id, s.r, s.t != null ? Math.round(s.t / 1000) : "", i + 1, p.g, p.rs[0], p.rs[1], p.rs[2], p.rs[3], p.pr, p.mk, p.hy, p.db, p.cu, p.w, p.sr, p.sy, p.ob, p.ml, p.bd])); }));
  }
  return rows.map(r => r.map(cq).join(",")).join("\r\n") + "\r\n";
};

/* ---------- the tab ---------- */
const sel = (key, vals, cur) => `<select data-an="${key}">${vals.map(v => `<option value="${v[0]}" ${String(v[0]) === String(cur) ? "selected" : ""}>${esc(v[1])}</option>`).join("")}</select>`;
T.render = function (ctx) {
  const m = M(), a = AN(), all = T.expand((m.games || []).concat(m.sims || [])); T.all = all;
  if (a.detail) { const g = all.find(x => x.id === a.detail); if (g) return T.detail(g); a.detail = null; }
  const gs = filtered(all, a); T.cur = gs;
  const simN = all.filter(g => g.sim).length, plN = all.length - simN;
  let h = `<div class="row wrap an-bar"><span class="seg"><button class="btn sm ${a.view === "players" ? "primary" : ""}" data-act="m-an-view" data-v="players">Player games (${plN})</button><button class="btn sm ${a.view === "sims" ? "primary" : ""}" data-act="m-an-view" data-v="sims">Simulations (${simN})</button></span>`;
  if (a.view === "players") h += `<span class="seg">${[["all", "All"], ["live", "Live"], ["test", "Test"]].map(e => `<button class="btn sm ${a.env === e[0] ? "primary" : ""}" data-act="m-an-env" data-v="${e[0]}">${e[1]}</button>`).join("")}</span>`;
  h += `${sel("n", [["all", "Any player count"], [2, "2 players"], [3, "3 players"], [4, "4 players"], [5, "5 players"], [6, "6 players"]], a.n)}${a.view === "players" ? sel("mode", [["all", "Any mode"], ["hotseat", "Hot-seat"], ["online", "Online"]], a.mode) : ""}<label class="row" style="gap:5px"><input type="checkbox" data-an="done" ${a.done ? "checked" : ""}> Completed only</label><button class="btn sm" data-act="m-refresh">Refresh</button><button class="btn sm" data-act="m-an-csv" data-v="games">Games CSV</button><button class="btn sm" data-act="m-an-csv" data-v="rounds">Rounds CSV</button></div>`;
  if (a.view === "sims") h += `<div id="sim-slot">${SI.simPanel ? SI.simPanel(ctx) : ""}</div>`;
  if (!gs.length) return h + `<p class="mute">${all.length ? "No games match these filters." : "No games recorded yet."} Every game on the hosted site sends a record at the start of each round from round 2 and when it ends.</p>`;
  return h + T.kpis(gs, a) + `<p class="mute" style="font-size:11px;margin:4px 0">Timing: any round over 20 minutes counts as 20 minutes, so a tea break does not skew the averages. Skills are what each player holds at the start of the round.</p><div class="charts">${T.charts(gs, a)}</div>` + T.tables(gs, a);
};
SI.statsRender = T.render;
SI.statsAct = function (act, t, ctx) {
  const a = AN(), v = t.dataset.v;
  if (act === "m-an-view") { a.view = v; a.detail = null; a.n = "all"; }
  else if (act === "m-an-env") a.env = v;
  else if (act === "m-an-open") a.detail = v;
  else if (act === "m-an-back") a.detail = null;
  else if (act === "m-an-zoom") { T.zoom(v); return; }
  else if (act === "m-an-csv") { SI.stu2 && SI.stu2.dl("shipit-" + v + "-" + new Date().toISOString().slice(0, 10) + ".csv", T.csv(T.cur || [], v), "text/csv"); return; }
  ctx.render();
};
document.addEventListener("change", e => { const t = e.target; if (!t || !t.dataset || !t.dataset.an || !SI.U || !SI.U.master) return; const a = AN(); if (t.dataset.an === "done") a.done = t.checked; else a[t.dataset.an] = t.value; SI.render(); });
})(typeof window !== "undefined" ? window : globalThis);
