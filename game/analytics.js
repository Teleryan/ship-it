/* ============================================================
   SHIP IT!: ANALYTICS CAPTURE (public)
   Builds one record per game (seats, per-round snapshots, scores by source, gates, winner) and sends it to the server.
   Only the master account can read the records back (admin.js).
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const A = SI.an = { snaps: [], meta: null, sent: false };
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(9))).map(b => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
A.begin = function (S, meta) { // meta: {mode, site, code, seats:[{name,kind,persona,cid}], ovrHash}
  A.snaps = []; A.sent = false; A.last = 0;
  A.meta = Object.assign({ startedAt: Date.now(), id: rid() }, meta);
  if (meta.code) A.meta.id = meta.code + (S.v ? "" : "") + (meta.seed || "").toString(36);
  A.track(S);
};
A.track = function (S) {
  if (!A.meta || !S || A.sent) return;
  if (S.round !== A.last || S.over) {
    // one snapshot at the first sight of each round, plus the end
    const key = S.over ? 99 : S.round; if (A.snaps.some(s => s.k === key)) return;
    A.last = S.round;
    A.snaps.push({ k: key, r: S.round, ph: S.phase, c: S.crisisCard != null ? (S.crisisCard.id != null ? S.crisisCard.id : S.crisisCard) : null,
      p: S.players.map(p => ({ g: p.gold, pr: p.prod, mk: p.mktg, hy: p.hype, db: p.debt, cu: p.culture, rs: [p.ideas, p.code, p.process, p.buzz], w: p.workers.length, sy: p.systems.length, ob: p.objectives.length, ml: p.claimed.length, va: p.vpAdj, sr: p.workers.filter(w => w.lvl === "Sr").length, bd: (p.building || []).length })) });
  }
  if (S.over) A.finish(S, true);
};
A.finish = function (S, completed) {
  if (!A.meta || A.sent) return; A.sent = true;
  const m = A.meta, D = root.SHIPIT_DATA;
  const rec = {
    id: m.id, v: D && D.version, site: m.site, env: S.cfg.envLabel || "A", mode: m.mode, code: m.code || null, completed: !!completed,
    n: S.players.length, humans: S.players.filter(p => !p.bot).length, startedAt: m.startedAt, endedAt: Date.now(), rounds: S.round,
    tuned: m.tuned || "default", test: !!m.test, winner: completed ? S.winner : null,
    seats: S.players.map((p, i) => ({ name: p.name, bot: !!p.bot, persona: p.persona || "", acct: (m.seats && m.seats[i] && m.seats[i].cid || "").slice(0, 6), order: S.order.indexOf(p.id) })),
    scores: completed && S.scores ? S.scores.map(s => ({ id: s.id, total: s.total, parts: s.parts })) : null,
    gates: (S.gates || []).map(g => ({ ph: g.phase, name: g.name, passed: g.passed, failed: g.failed, best: g.best })),
    final: S.players.map(p => ({ g: p.gold, pr: p.prod, mk: p.mktg, hy: p.hype, db: p.debt, cu: p.culture, rs: [p.ideas, p.code, p.process, p.buzz], w: p.workers.length, sy: p.systems.length, ob: p.objectives.length, gl: p.gateLoss || 0, va: p.vpAdj, sr: p.workers.filter(w => w.lvl === "Sr").length, bd: (p.building || []).length, rc: (p.cs && p.cs.recruits) || 0, cr: (p.cs && p.cs.crunched) || 0, cv: (p.cs && p.cs.converted) || 0 })),
    snaps: A.snaps, steps: S.step === "end" ? undefined : undefined
  };
  A.sent = true;
  try { fetch("/__log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(rec), keepalive: true }).catch(() => {}); } catch (e) {}
  return rec;
};
A.abandon = function (S) { if (A.meta && !A.sent && S && S.round >= 2 && !S.over) A.finish(S, false); A.meta = null; };
A.stop = function () { A.meta = null; };
})(typeof window !== "undefined" ? window : globalThis);
