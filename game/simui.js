/* ============================================================
   SHIP IT!: SIMULATIONS (master account only)
   Runs bot-versus-bot games in browser Web Workers, with the same record format as real games,
   and uploads them in batches so the Analytics tab can chart them next to player games.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const esc = SI.esc, E = root.ShipItEngine;
const KEY = "shipit.sim.cfg";
const SKILLS = [["", "Standard bot skill"], ["mix", "Mix of skill levels"], ["novice", "Novice"], ["casual", "Human-like"], ["expert", "Expert"]];
const PERS = [["", "Standard bot"], ["crunch", "Crunch Studio"], ["hype", "Hype Machine"], ["systems", "Systems Studio"], ["clean", "Clean Ship"]];
const dflt = () => ({ counts: [2, 3, 4, 5, 6], games: 40, seats: "rotate", data: "applied", skill: "", label: "", threads: Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) });
const cfg = () => { try { return Object.assign(dflt(), JSON.parse(root.localStorage.getItem(KEY) || "{}")); } catch (e) { return dflt(); } };
const SM = () => { const m = SI.U.master; return m.sim || (m.sim = { run: null, msg: "", last: null }); };
const f1 = x => (Math.round(x * 10) / 10).toString();

/* ---------- the worker: engine, bot and logger inside one blob ---------- */
const RUNNER = `
self.onmessage = function (ev) {
  const m = ev.data, E = self.ShipItEngine, B = self.ShipItBot, A = self.SI.an; A.quiet = true;
  const PERS = ["", "crunch", "hype", "systems", "clean"], SK = ["", "novice", "casual", "expert"], out = []; let err = 0;
  for (let k = 0; k < m.games; k++) {
    const gi = m.first + k, seats = []; for (let i = 0; i < m.n; i++) seats.push({ name: "Bot " + (i + 1), bot: true });
    try {
      const S = E.newGame(seats, { seed: m.seed0 + gi, config: m.config, data: m.data });
      S.players.forEach((p, i) => { const mode = m.seats; let q = ""; if (mode === "rotate") q = PERS[(i + gi) % PERS.length]; else if (mode === "random") q = PERS[Math.floor(((Math.sin((m.seed0 + gi) * 12.9898 + i * 78.233) * 43758.5453) % 1 + 1) % 1 * PERS.length)]; else if (mode !== "standard") q = mode; if (q) p.persona = q; });
      if (m.skill) S.players.forEach((p, i) => { p.profile = m.skill === "mix" ? SK[(i + gi * 3) % SK.length] : m.skill; });
      A.begin(S, { mode: "sim", site: m.site, hash: m.hash, tuned: "sim", seats: [] });
      let g = 0; while (!S.over && g++ < 80000) { const r = B.step(S); if (!r.ok) break; A.track(S); }
      A.track(S); if (!S.over) { err++; continue; }
      const rec = A.rec(S, true); rec.mode = "sim"; rec.tuned = m.label; delete rec.test; out.push(rec);
    } catch (e) { err++; } finally { if (k % 2 === 1) postMessage({ t: "p", n: m.n, done: 2 }); }
  }
  postMessage({ t: "done", n: m.n, recs: out, err: err, left: m.games % 2 });
};`;
let blobURL = null;
async function workerURL() {
  if (blobURL) return blobURL;
  const txt = await Promise.all(["data.js", "engine.js", "bot.js", "analytics.js"].map(f => fetch(f, { cache: "force-cache" }).then(r => { if (!r.ok) throw new Error(f + " " + r.status); return r.text(); })));
  blobURL = URL.createObjectURL(new Blob([txt.join("\n;\n") + "\n" + RUNNER], { type: "text/javascript" })); return blobURL;
}

/* ---------- panel ---------- */
SI.simPanel = function () {
  const c = cfg(), s = SM(), r = s.run;
  let h = `<div class="panel simcfg"><div class="row wrap" style="gap:12px"><b>Run simulations</b><span class="mute">Bots play full games in your browser; results are saved to the Simulations list.</span></div>
  <div class="row wrap" style="gap:12px;margin-top:8px"><span>Players: ${[2, 3, 4, 5, 6].map(n => `<label style="margin-right:6px"><input type="checkbox" data-simn="${n}" ${c.counts.includes(n) ? "checked" : ""}> ${n}</label>`).join("")}</span>
  <label>Games per count <input id="sim-games" type="number" min="1" max="400" value="${c.games}" style="width:70px"></label>
  <label>Seat styles <select id="sim-seats"><option value="rotate" ${c.seats === "rotate" ? "selected" : ""}>Rotate through the four styles</option><option value="random" ${c.seats === "random" ? "selected" : ""}>Random styles</option><option value="standard" ${c.seats === "standard" ? "selected" : ""}>All standard bots</option>${PERS.slice(1).map(p => `<option value="${p[0]}" ${c.seats === p[0] ? "selected" : ""}>All ${p[1]}</option>`).join("")}</select></label>
  <label>Bot skill <select id="sim-skill">${SKILLS.map(o => `<option value="${o[0]}" ${c.skill === o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select></label>
  <label>Data <select id="sim-data"><option value="applied" ${c.data === "applied" ? "selected" : ""}>Applied (new games)</option><option value="draft" ${c.data === "draft" ? "selected" : ""}>Studio draft</option><option value="base" ${c.data === "base" ? "selected" : ""}>Shipped baseline</option></select></label>
  <label>Label <input id="sim-label" placeholder="e.g. bt 3 test" value="${esc(c.label)}" maxlength="40" style="width:160px"></label>
  <label>Threads <input id="sim-threads" type="number" min="1" max="8" value="${c.threads}" style="width:55px"></label></div>
  <div class="row wrap" style="gap:8px;margin-top:10px">${r ? `<button class="btn sm" data-act="m-sim-stop">Stop</button><span class="mute">${esc(s.msg)}</span>` : `<button class="btn primary sm" data-act="m-sim-run">Run simulations</button><span class="mute">${esc(s.msg)}</span>`}</div>`;
  if (r) { const pc = r.total ? Math.round(r.done / r.total * 100) : 0; h += `<div class="bar" style="margin-top:8px"><i style="width:${pc}%;background:var(--prod)"></i></div><div class="mute" style="font-size:12px">${r.done} of ${r.total} games · ${pc}%</div>`; }
  if (s.last) h += `<div class="mute" style="margin-top:8px;font-size:12px">Last run (${esc(s.last.label)}): ${s.last.rows.map(x => `${x.n}P: ${x.games} games, winner ${f1(x.win)}${x.err ? `, ${x.err} failed` : ""}`).join(" · ")}. Saved as ${s.last.batches} batch${s.last.batches === 1 ? "" : "es"}.</div>`;
  return h + "</div>";
};
const slot = () => { const el = document.getElementById("sim-slot"); if (el) el.innerHTML = SI.simPanel(); };
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(9))).map(b => b.toString(36).padStart(2, "0")).join("").slice(0, 16);

SI.simAct = async function (act, t, ctx) {
  const s = SM();
  if (act === "m-sim-stop") { if (s.run) { s.run.stop = true; s.run.workers.forEach(w => w.terminate()); s.run.finish(true); } return; }
  if (act !== "m-sim-run" || s.run) return;
  const counts = [2, 3, 4, 5, 6].filter(n => { const el = document.querySelector(`[data-simn="${n}"]`); return el && el.checked; });
  const c = { counts, games: Math.max(1, Math.min(400, +document.getElementById("sim-games").value || 40)), seats: document.getElementById("sim-seats").value, data: document.getElementById("sim-data").value, skill: document.getElementById("sim-skill").value, label: document.getElementById("sim-label").value.trim(), threads: Math.max(1, Math.min(8, +document.getElementById("sim-threads").value || 2)) };
  try { root.localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
  if (!counts.length) { s.msg = "Pick at least one player count."; slot(); return; }
  const U = ctx.U, st = c.data === "draft" ? U.studio : c.data === "base" ? SI.defaults() : (U.active || U.studio), hash = SI.hashOf(st);
  const label = c.label || (c.data + " " + hash);
  let url; try { url = await workerURL(); } catch (e) { s.msg = "Could not load the simulator files: " + e.message; slot(); return; }
  const CH = 10, jobs = []; counts.forEach((n, ci) => { for (let f = 0; f < c.games; f += CH) jobs.push({ n, first: f, games: Math.min(CH, c.games - f), seed0: (Date.now() % 100000) + ci * 100000 }); });
  const run = s.run = { total: counts.length * c.games, done: 0, workers: [], recs: {}, errs: {}, stop: false };
  s.msg = "Starting…";
  const t0 = Date.now();
  run.finish = async function (aborted) {
    run.workers.forEach(w => w.terminate()); s.run = null;
    const all = [].concat.apply([], Object.keys(run.recs).map(k => run.recs[k]));
    if (!all.length) { s.msg = aborted ? "Stopped." : "No games finished."; slot(); return; }
    s.msg = "Saving " + all.length + " games…"; slot();
    const batches = []; Object.keys(run.recs).forEach(k => { for (let i = 0; i < run.recs[k].length; i += 40) batches.push({ id: rid(), mode: "simbatch", label, hash, ts: Date.now(), n: +k, games: run.recs[k].slice(i, i + 40) }); });
    let ok = 0; for (const b of batches) { try { const r = await fetch("/__log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); if (r.ok) ok++; } catch (e) {} }
    const rows = Object.keys(run.recs).map(k => { const g = run.recs[k]; return { n: k, games: g.length, err: run.errs[k] || 0, win: g.reduce((a, x) => a + Math.max.apply(null, x.scores.map(q => q.total)), 0) / (g.length || 1) }; });
    s.last = { label, rows, batches: ok }; s.msg = (aborted ? "Stopped. " : "Done in " + Math.round((Date.now() - t0) / 1000) + "s. ") + (ok === batches.length ? "Saved." : "Shown here, but only " + ok + " of " + batches.length + " batches were saved to the server.");
    const m = SI.U.master; if (m) { m.sims = (m.sims || []).concat(batches); m.a = m.a || {}; m.a.view = "sims"; } SI.render();
  };
  let next = 0, active = 0;
  const feed = w => {
    if (run.stop) return; if (next >= jobs.length) { w.terminate(); active--; if (!active) run.finish(false); return; }
    const j = jobs[next++]; w.postMessage(Object.assign({ seats: c.seats, skill: c.skill, config: st.config, data: st.data, site: SI.net.site(), hash, label }, j));
  };
  for (let i = 0; i < c.threads; i++) {
    const w = new Worker(url); run.workers.push(w); active++;
    w.onmessage = ev => { const m = ev.data; if (m.t === "p") { run.done += m.done; s.msg = "Running on " + c.threads + " thread" + (c.threads === 1 ? "" : "s"); slot(); } else if (m.t === "done") { (run.recs[m.n] = run.recs[m.n] || []).push.apply(run.recs[m.n], m.recs); run.errs[m.n] = (run.errs[m.n] || 0) + m.err; run.done += m.left; feed(w); } };
    w.onerror = ev => { s.msg = "A worker failed: " + (ev.message || "error"); active--; if (!active && s.run === run) run.finish(false); };
    feed(w);
  }
  slot();
};
})(typeof window !== "undefined" ? window : globalThis);
