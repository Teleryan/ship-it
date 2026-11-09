/* ============================================================
   SHIP IT!: ANALYTICS CAPTURE (public)
   Builds one record per game (seats, per-round snapshots, event log, scores by source, gates, winner) and delivers it to the server.
   Only the master account can read the records back (admin.js / stats.js).

   Delivery model (v2):
   - Every record is keyed by a stable game id. The server keeps ONE record per id ("upsert"); a final record always beats an interim one.
   - Records go into a durable outbox (localStorage mirror of an in-memory map) and are sent with retry/backoff. They are re-sent on the next
     page load, on the next post, when the browser comes back online, every 30 s while anything is pending, and on tab close (beacon).
   - A game posts an "active" record at the start of every round (from round 1) and when the tab is hidden/closed. The dashboard shows an
     "active" record that went quiet as "abandoned". A game that ends posts "complete" (or "early" if the host ended it before round 12);
     leaving through the menu posts "abandoned".
   - A resumed game (reload, "Continue where you left off") re-attaches to the same record id; a manually saved game that is loaded gets a
     NEW id (it is a new branch, and the old branch keeps its own record).
   - Online: the host records. Guests only send a minimal final record (src "guest") if the host never does.
   - A record is never dropped for size: it is trimmed (event timestamps, mid-round snapshots, events, snapshot detail) until it fits.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const A = SI.an = { snaps: [], evs: [], sp: [], meta: null, S: null, sent: false, last: 0, quiet: false, BUDGET: 100000, stray: 0, stat: { ok: 0, retry: 0, drop: 0, err: "", at: 0 } };
const K_CUR = "shipit.an.cur", K_SAVE = "shipit.an.save", K_OUT = "shipit.an.out", K_LBL = "shipit.label", K_TUT = "shipit.tutdone";
const LS = {
  get(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { root.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { root.localStorage.removeItem(k); } catch (e) {} }
};
const jget = k => { try { const t = LS.get(k); return t ? JSON.parse(t) : null; } catch (e) { return null; } };
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(9))).map(b => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
const byteLen = s => { try { return new TextEncoder().encode(s).length; } catch (e) { return unescape(encodeURIComponent(s)).length; } };
const RANK = { active: 0, abandoned: 1, early: 2, complete: 2 };
const rankOf = st => RANK[st] == null ? 0 : RANK[st];
const phaseOf = r => (root.ShipItEngine && root.ShipItEngine.phaseOfRound) ? root.ShipItEngine.phaseOfRound(r) : 0;
A.rankOf = rankOf;

/* ---------- small settings kept on this device ---------- */
A.label = () => (LS.get(K_LBL) || "").slice(0, 24);
A.setLabel = v => { v = String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, "").trim().slice(0, 24); if (v) LS.set(K_LBL, v); else LS.del(K_LBL); if (A.meta && !A.meta.guest) A.meta.lbl = v; return v; };
A.tutDone = () => LS.get(K_TUT) === "1";
A.markTut = () => { LS.set(K_TUT, "1"); };
const dev6 = () => { try { return ((root.SI && root.SI.net && root.SI.net.cid && root.SI.net.cid()) || "").slice(0, 6); } catch (e) { return ""; } };

/* ---------- ids ---------- */
// Online ids are deterministic (the host can reload and keep the same record) and unique per started game: code + seed + server start time.
A.onlineId = function (meta) {
  const s = (String(meta.code || "") + ((+meta.seed || 0) >>> 0).toString(36) + ((+meta.started || 0)).toString(36)).replace(/[^A-Za-z0-9]/g, "");
  return (s.length >= 6 ? s : (s + rid())).slice(0, 32);
};

/* ---------- engine hook: observe every successful action (read-only; the engine is not changed) ---------- */
const FATMAX = S => (S.cfg && S.cfg.fatMax) || 2;
const lvl1 = w => w ? (w.lvl || "J")[0] + w.disc : "?";
function mkEv(S, a) { // -> [code, arg] or null
  const p = S.players[a && a.p]; if (!p) return null;
  if (a.type === "endgame") return ["end", 0];
  const dq = S.dq && S.dq[0];
  if (dq) {
    switch (dq.t) {
      case "keepObj": { const ids = []; Object.keys(dq.opts || {}).forEach(t => { const keep = (a.picks && a.picks[t] != null) ? a.picks[t] : dq.opts[t][0]; [].concat(keep).slice(0, S.cfg.objKeep).forEach(x => { if (dq.opts[t].includes(x)) ids.push(x); }); }); return ["ko", ids]; }
      case "keepMile": return ["km", [].concat(a.keep != null ? a.keep : dq.opts[0]).slice(0, dq.keep)];
      case "wsBuy": return ["wb", Math.max(0, Math.floor(a.n || 0))];
      case "bid": return ["bid", [dq.card, Math.floor(a.amount)]];
      case "choose": return ["ch", [dq.card, a.k]];
      case "pickWorker": return ["pw", lvl1(p.workers.find(x => x.id === a.worker))];
      case "raidHire": return a.type === "skip" ? ["rh", "skip"] : ["rh", ((a.lvl || "Jr")[0]) + a.disc];
      case "pivot": return ["pv", a.replace ? 1 : 0];
      case "dropObj": return ["do", a.obj];
      case "patch": return a.type === "patchDone" ? ["pt", "done"] : ["pt", a.idx];
      default: return ["dq", dq.t];
    }
  }
  const E = root.ShipItEngine;
  switch (a.type) {
    case "place": {
      const w = p.workers.find(x => x.id === a.worker), tg = String(a.target || "");
      let name = tg; if (tg.indexOf("spot:") === 0) name = tg.slice(5); else if (tg.indexOf("sys:") === 0) { const sy = p.systems[+tg.slice(4)]; name = "S:" + (sy ? sy.name : tg.slice(4)); }
      const over = w && w.fat >= FATMAX(S) ? 1 : 0; let ex = a.conv || a.alt || (a.bonus === "mktg" ? "mktg" : "") || "";
      if (Array.isArray(a.crew) && a.crew.length) ex = (ex ? ex + " " : "") + "+" + a.crew.map(id => lvl1(p.workers.find(x => x.id === id))).join("+"); // strike-team partners
      const arg = [name, lvl1(w), over]; if (ex) arg.push(ex); return ["p", arg];
    }
    case "pass": return ["x", 0];
    case "recruit": { let c = 0; try { c = E.recruitCost(S, a.p); } catch (e) {} const o = S.recruit && S.recruit[a.idx]; return ["rc", [o ? o.disc : "?", c]]; }
    case "buyws": { let c = 0; try { c = E.wsCost(S, a.p); } catch (e) {} return ["ws", c]; }
    case "train": return ["tr", (p.workers.find(x => x.id === a.worker) || {}).disc || "?"];
    case "promote": return ["pro", (p.workers.find(x => x.id === a.worker) || {}).disc || "?"];
    case "build": return ["bd", [a.name, (a.crunch ? "c" : "") + (a.free ? "f" : "")]];
    case "claim": { const m = S.data.milestones[a.mile]; return ["cl", m ? m.name : a.mile]; }
    case "refresh": return ["rf", a.name];
    case "done": return ["dn", 0];
    case "endgame": return ["end", 0];
  }
  return [String(a.type || "?").slice(0, 8), 0];
}
const lastLog = S => S.log && S.log.length ? S.log[S.log.length - 1] : null;
function newLogLines(S, since) { // log lines added by the last action (read-only)
  const out = []; if (!S.log) return out;
  for (let i = S.log.length - 1, n = 0; i >= 0 && n < 40; i--, n++) { if (S.log[i] === since) return out.reverse(); out.push(S.log[i]); }
  return since ? [] : out.reverse();
}
A.hook = function () {
  const E = root.ShipItEngine; if (!E || !E.act || E.act.__an) return;
  const orig = E.act;
  const w = function (S, a) {
    const m = A.meta;
    if (m && m.guest && A.S === S && !A.sent && !A.quiet) { const r0 = orig.apply(this, arguments); try { if (r0 && r0.ok && S.over) A.track(S); } catch (e) {} return r0; } // a guest only waits for the end
    if (!m || A.S !== S || A.quiet || m.mode === "sim" || A.sent) return orig.apply(this, arguments);
    let ev = null, since = null, rd = S.round;
    try { ev = mkEv(S, a); since = lastLog(S); } catch (e) { ev = null; }
    const r = orig.apply(this, arguments);
    try { if (r && r.ok) A.onAct(S, a, ev, since, rd); } catch (e) { A.stat.err = "hook: " + (e && e.message); }
    return r;
  };
  w.__an = 1; w.orig = orig; E.act = w;
};
A.onAct = function (S, a, ev, since, rd) {
  const m = A.meta, t = Math.round((Date.now() - m.startedAt) / 1000);
  if (ev && A.evs.length < 4000) A.evs.push([rd, a.p, ev[0], ev[1], m.replay ? null : t]);
  if (A.evs.length < 4000) newLogLines(S, since).forEach(l => { if (/^AUCTION bids|^CRISIS:| wins (Early Access|Tech Breakthrough|Viral Moment)/.test(l.m)) A.evs.push([l.r, -1, /^CRISIS/.test(l.m) ? "cr" : "au", String(l.m).slice(0, 110), t]); });
  A.track(S);
  if (S.step === "rest" && !S.over) { const sn = A.snaps.find(s => s.k === S.round); if (sn && !sn.m) sn.m = S.players.map(p => midOf(S, p)); }
  A.persistSoon();
};
A.mark = () => A.evs.length;
A.rewind = function (S, mark) { if (S) A.S = S; if (mark != null && mark >= 0) A.evs.length = Math.min(A.evs.length, mark); };
A.rebind = function (S, mark) { if (A.meta && S) { A.rewind(S, mark); A.persistSoon(); } };

/* ---------- snapshots ---------- */
const tiredOf = (S, p) => p.workers.filter(w => w.fat >= 1).length, exhOf = (S, p) => p.workers.filter(w => w.fat >= FATMAX(S)).length;
const midOf = (S, p) => [p.ws || 0, tiredOf(S, p), exhOf(S, p), p.burnout || 0, p.gold]; // [desks this round, tired(>=1), exhausted, burnout, gold] at the end of Place
function snapP(S, p, sim) {
  const o = { g: p.gold, pr: p.prod, mk: p.mktg, hy: p.hype, db: p.debt, cu: p.culture, rs: [p.ideas, p.code, p.process, p.buzz], w: p.workers.length, sy: p.systems.length, ob: p.objectives.length, ml: p.claimed.length, va: p.vpAdj, sr: p.workers.filter(w => w.lvl === "Sr").length, bd: (p.building || []).length, bo: p.burnout || 0 };
  if (!sim) { o.ws = p.ws || 0; o.td = tiredOf(S, p); o.ex = exhOf(S, p); o.tn = (p.cs && p.cs.trainings) || 0; o.pm = (p.cs && p.cs.promotions) || 0; o.rc = (p.cs && p.cs.recruits) || 0; }
  return o;
}
A.track = function (S) {
  const m = A.meta; if (!m || !S || A.sent) return;
  if (S !== A.S) { A.stray++; return; }
  if (m.guest) { if (S.over) A.finish(S, true); return; }
  if (S.round !== A.last || S.over) {
    // one snapshot at the first sight of each round, plus the end
    const key = S.over ? 99 : S.round;
    if (!A.snaps.some(s => s.k === key)) {
      A.last = S.round; const sim = m.mode === "sim";
      A.snaps.push({ k: key, r: S.round, t: m.replay ? null : Date.now() - m.startedAt, ph: S.phase, c: S.crisisCard != null ? (S.crisisCard.id != null ? S.crisisCard.id : S.crisisCard) : null, p: S.players.map(p => snapP(S, p, sim)) });
      if (!sim && A.sp[S.phase] == null) { try { A.sp[S.phase] = root.ShipItEngine.activeSpots(S).map(s => s.id); } catch (e) {} }
      if (!S.over) { if ((S.round - 1) % (A.interimEvery || 3) === 0) A.post(A.rec(S, false, "active")); A.persistNow(); } // A.interimEvery = 2 halves the KV writes (Cloudflare KV free plan: 1000 writes a day)
    }
  }
  if (S.over) A.finish(S, true);
};

/* ---------- the record ---------- */
function cntOf(evs, n) { // per-seat counters, derived from the event log
  const c = []; for (let i = 0; i < n; i++) c.push({ p: 0, x: 0, ws: 0, tr: 0, pro: 0, rc: 0, bd: 0, cl: 0, tm: 0, ov: 0 });
  const tiles = {};
  evs.forEach(e => { const q = c[e[1]]; if (!q) return; const k = e[2];
    if (k === "p") { q.p++; const nm = e[3][0]; tiles[nm] = (tiles[nm] || 0) + 1; if (e[3][2]) q.ov++; if (/^team/.test(nm)) q.tm++; }
    else if (q[k] != null) q[k]++; });
  return { c, tiles };
}
function trimmed(rec, level) {
  const r = Object.assign({}, rec); r.trim = level;
  if (level >= 1) r.ev = (rec.ev || []).map(e => e.length > 4 ? e.slice(0, 4) : e);
  if (level >= 2) r.snaps = (rec.snaps || []).map(s => { const o = Object.assign({}, s); delete o.m; return o; });
  if (level >= 3) r.ev = [];
  if (level >= 4) r.snaps = (r.snaps || []).map(s => Object.assign({}, s, { p: s.p.map(p => ({ g: p.g, pr: p.pr, mk: p.mk, hy: p.hy, db: p.db, cu: p.cu, rs: p.rs, w: p.w, sy: p.sy, sr: p.sr, bd: p.bd, bo: p.bo, ob: p.ob, ml: p.ml })) }));
  if (level >= 5) r.snaps = (r.snaps || []).filter((s, i, a) => i === 0 || i === a.length - 1 || s.k === 99);
  if (level >= 6) r.snaps = [];
  return r;
}
A.fit = function (rec) { // -> JSON text no larger than A.BUDGET bytes (never drops the record)
  let s = JSON.stringify(rec); if (byteLen(s) <= A.BUDGET) return s;
  for (let lv = 1; lv <= 6; lv++) { s = JSON.stringify(trimmed(rec, lv)); if (byteLen(s) <= A.BUDGET) return s; }
  const r = trimmed(rec, 6); r.final = (rec.final || []).map(f => { const o = Object.assign({}, f); delete o.si; delete o.oi; delete o.om; delete o.mi; return o; }); r.sp = []; r.tl = {}; r.trim = 7;
  return JSON.stringify(r);
};
A.rec = function (S, completed, status) {
  const m = A.meta, D = root.SHIPIT_DATA, sim = m.mode === "sim", done = !!completed;
  const lastRound = (S.cfg && S.cfg.phaseEnds && S.cfg.phaseEnds[3]) || 12;
  const early = done && S.round < lastRound && !!S.over;
  const tot = done && S.scores ? S.scores.map(s => s.total).sort((a, b) => b - a) : [];
  const st = done ? (early ? "early" : "complete") : (status || "abandoned");
  const cn = sim ? null : cntOf(A.evs, S.players.length);
  const sc = done && S.scores ? S.scores : null;
  const rec = {
    id: m.id, v: D && D.version, site: m.site, env: "D", mode: m.mode, code: m.code || null, completed: done && !early, status: st, src: m.guest ? "guest" : (m.mode === "online" ? "host" : "solo"), seq: ++m.seq,
    n: S.players.length, humans: S.players.filter(p => !p.bot).length, startedAt: m.startedAt, endedAt: Date.now(), rounds: S.round, early: early ? 1 : 0, tie: tot.length > 1 && tot[0] === tot[1] ? 1 : 0,
    tuned: m.tuned || "default", hash: m.hash || "base", test: !!m.test, winner: done ? S.winner : null, device: root.innerWidth && root.innerWidth < 820 ? "mobile" : "desktop",
    seats: S.players.map((p, i) => ({ name: p.name, bot: !!p.bot, persona: p.persona || "", profile: p.profile || "", acct: (m.seats && m.seats[i] && m.seats[i].cid || "").slice(0, 6), order: S.order.indexOf(p.id) })),
    scores: sc ? sc.map(s => ({ id: s.id, total: s.total, parts: s.parts })) : null,
    gates: (S.gates || []).map(g => ({ ph: g.phase, name: g.name, lvl: g.lvl || "M", passed: g.passed, failed: g.failed, best: g.best })),
    final: S.players.map((p, i) => {
      const o = { g: p.gold, pr: p.prod, mk: p.mktg, hy: p.hype, db: p.debt, cu: p.culture, rs: [p.ideas, p.code, p.process, p.buzz], w: p.workers.length, sy: p.systems.length, ob: p.objectives.length, gl: p.gateLoss || 0, va: p.vpAdj, sr: p.workers.filter(w => w.lvl === "Sr").length, bd: (p.building || []).length, bo: p.burnout || 0, rc: (p.cs && p.cs.recruits) || 0, cr: (p.cs && p.cs.crunched) || 0, cv: (p.cs && p.cs.converted) || 0 };
      if (!sim) {
        o.td = tiredOf(S, p); o.ex = exhOf(S, p); o.tn = (p.cs && p.cs.trainings) || 0; o.pm = (p.cs && p.cs.promotions) || 0; o.ws = p.ws || 0;
        o.si = p.systems.map(y => y.name); o.bn = (p.building || []).length; o.mi = p.claimed.slice(); o.oi = p.objectives.slice(); o.dr = (p.dropped || []).slice();
        const ol = sc && sc[i] && sc[i].parts && sc[i].parts.objList; if (ol) o.om = ol.map(x => x.met ? 1 : 0);
        o.gv = p.vpGate || 0;
      }
      return o;
    }),
    snaps: A.snaps
  };
  if (!sim) {
    rec.ev = A.evs.slice(); rec.cn = cn.c; rec.tl = cn.tiles; rec.sp = A.sp.slice(); rec.vw = root.innerWidth | 0;
    if (m.lbl) rec.lbl = m.lbl; if (m.dev) rec.dev = m.dev; if (m.tut != null) rec.tut = m.tut; if (m.res) rec.res = m.res; if (m.part) rec.part = 1; if (m.from) rec.from = m.from;
    rec.sk = S.players.map(p => p.bot ? (p.profile || "std") : "");
  }
  return rec;
};

/* ---------- lifecycle ---------- */
function freshMeta(meta, S) {
  const m = Object.assign({ startedAt: Date.now(), id: rid(), seq: 0 }, meta);
  if (meta.code) { m.id = A.onlineId(meta); if (meta.started) m.startedAt = +meta.started; }
  if (!meta.guest && meta.mode !== "sim") { m.lbl = A.label(); m.dev = dev6(); if (m.tut == null) m.tut = A.tutDone() ? 1 : 0; }
  return m;
}
function attach(S) { A.S = S; A.sent = false; A.stray = 0; A.snapLog = lastLog(S); }
A.begin = function (S, meta) {
  A.hook();
  if (A.meta && !A.sent && A.S && A.S !== S && !A.meta.guest && !A.S.over && A.meta.mode !== "sim") A.finish(A.S, false); // never lose a game that was left running
  A.snaps = []; A.evs = []; A.sp = []; A.last = 0;
  A.meta = freshMeta(meta, S); attach(S);
  A.track(S);
};
A.watch = function (S, meta) { // an online guest: only sends a fallback final record
  A.hook(); A.snaps = []; A.evs = []; A.sp = []; A.last = 0;
  A.meta = Object.assign({ startedAt: Date.now(), id: rid(), seq: 0 }, meta, { guest: true });
  if (meta.code) { A.meta.id = A.onlineId(meta); if (meta.started) A.meta.startedAt = +meta.started; }
  attach(S); A.track(S);
};
A.resume = function (S, o) { // o: {kind: "auto"|"save"|"net", id, meta}
  A.hook();
  if (A.meta && !A.sent && A.S && A.S !== S && !A.meta.guest && !A.S.over && A.meta.mode !== "sim") A.finish(A.S, false);
  if (!S) { A.meta = null; A.S = null; return null; }
  const st = jget(o.kind === "save" ? K_SAVE : K_CUR), want = o.kind === "net" ? (o.meta && (o.meta.code ? A.onlineId(o.meta) : o.meta.id)) : o.id;
  const ok = st && st.meta && !st.sent && st.n === S.players.length && (o.kind === "save" || (want && st.meta.id === want));
  if (ok) {
    A.meta = st.meta; A.snaps = st.snaps || []; A.evs = st.evs || []; A.sp = st.sp || []; A.last = st.last || 0;
    A.meta.res = (A.meta.res | 0) + 1; delete A.meta.replay;
    if (o.kind === "save") { A.meta.from = st.meta.id; A.meta.id = rid(); A.meta.seq = 0; A.meta.startedAt = Date.now() - ((A.snaps.length && A.snaps[A.snaps.length - 1].t) || 0); }
    if (o.meta) { if (o.meta.lbl == null) A.meta.lbl = A.label(); }
  } else if (S.over) { A.meta = null; A.S = null; return null; // a finished game with no open record: it was recorded before
  } else {
    A.snaps = []; A.evs = []; A.sp = []; A.last = 0;
    const base = Object.assign({}, o.meta); if (o.kind !== "net") delete base.code;
    A.meta = freshMeta(base, S); A.meta.res = 1; if (!o.fresh) A.meta.part = 1; // a late start: earlier rounds and actions were not seen
  }
  A.meta.mode = A.meta.mode || (o.meta && o.meta.mode) || "hotseat";
  attach(S);
  A.last = ok ? A.last : 0;
  A.track(S); A.persistNow();
  return A.meta.id;
};
A.curId = () => (A.meta && !A.meta.guest && !A.sent ? A.meta.id : null);
A.finish = function (S, completed, status) {
  if (!A.meta || A.sent) return; A.sent = true;
  if (A.meta.guest) { A.snaps = []; A.evs = []; }
  const rec = A.rec(S, completed, status); A.post(rec);
  if (!A.quiet) { LS.del(K_CUR); A.cancelPersist(); }
  return rec;
};
A.abandon = function () { // leaving the game through the menu or starting another one
  if (A.meta && A.S && !A.sent && !A.meta.guest && A.meta.mode !== "sim" && !A.S.over) A.finish(A.S, false, "abandoned");
  A.meta = null; A.S = null;
};
A.stop = function () { A.meta = null; A.S = null; };

/* ---------- keeping the in-progress record across reloads ---------- */
let pt = null;
A.persistNow = function () {
  if (A.quiet || !A.meta || A.meta.guest || A.sent || A.meta.mode === "sim") return false; A.cancelPersist();
  return LS.set(K_CUR, JSON.stringify({ meta: A.meta, snaps: A.snaps, evs: A.evs, sp: A.sp, last: A.last, sent: false, n: A.S ? A.S.players.length : 0 }));
};
A.persistSoon = function () { if (pt || A.quiet) return; pt = setTimeout(() => { pt = null; A.persistNow(); }, 400); if (pt && pt.unref) pt.unref(); };
A.cancelPersist = function () { if (pt) { clearTimeout(pt); pt = null; } };
A.saveFor = function () { if (A.persistNow()) { const t = LS.get(K_CUR); if (t) LS.set(K_SAVE, t); } }; // the manual "Save game" button
A.clearSave = function () { LS.del(K_SAVE); };

/* ---------- delivery: outbox, retry, idempotent ---------- */
let OUT = null; const inflight = {}, flying = {};
function loadOut() { if (OUT) return OUT; OUT = {}; const o = jget(K_OUT); if (o && typeof o === "object") Object.keys(o).forEach(k => { OUT[k] = o[k]; }); return OUT; }
function saveOut() { const ids = Object.keys(OUT); if (ids.length > 24) ids.sort((a, b) => (rankOf(OUT[b].st) - rankOf(OUT[a].st)) || (OUT[b].t - OUT[a].t)).slice(24).forEach(k => delete OUT[k]); if (ids.length) LS.set(K_OUT, JSON.stringify(OUT)); else LS.del(K_OUT); A.pend = Object.keys(OUT).length; }
A.pending = () => Object.keys(loadOut()).length;
A.post = function (rec) {
  if (A.quiet || A.enabled === false) return;
  const out = loadOut(), e = { id: rec.id, st: rec.status, seq: rec.seq | 0, t: Date.now(), tries: 0, next: 0, body: A.fit(rec) };
  const cur = out[rec.id];
  if (cur && (rankOf(cur.st) > rankOf(e.st) || (rankOf(cur.st) === rankOf(e.st) && cur.seq > e.seq))) return; // a newer record is already waiting
  out[rec.id] = e; saveOut(); A.flush();
};
function settle(id, seq, res) { // res: Response or null (network error)
  delete inflight[id]; const out = loadOut(), e = out[id];
  if (res && (res.ok || res.status === 400 || res.status === 403 || res.status === 413)) {
    if (res.ok) A.stat.ok++; else { A.stat.drop++; A.stat.err = "server refused " + res.status; }
    if (e && e.seq <= seq) { delete out[id]; saveOut(); } else if (e) A.flush(); // a newer one for this id stays queued: send it now
    return;
  }
  A.stat.retry++; A.stat.err = res ? "HTTP " + res.status : "offline"; A.stat.at = Date.now();
  if (e && e.seq <= seq) { e.tries++; e.next = Date.now() + Math.min(300000, 2000 * Math.pow(2, Math.min(e.tries, 8))); saveOut(); } else if (e) A.flush(); // the failed one was already replaced by a newer record: try that one now
}
A.flush = function (force) {
  if (A.quiet || typeof root.fetch !== "function") return Promise.resolve();
  const out = loadOut();
  Object.keys(out).forEach(id => {
    const e = out[id]; if (inflight[id] != null) return; if (!force && e.next && e.next > Date.now()) return;
    inflight[id] = e.seq; const seq = e.seq, big = byteLen(e.body) > 60000; let p;
    try {
      let tm; const to = new Promise((_, rej) => { tm = setTimeout(() => rej(new Error("timeout")), 25000); if (tm && tm.unref) tm.unref(); });
      p = Promise.race([root.fetch("/__log", { method: "POST", headers: { "content-type": "application/json" }, body: e.body, keepalive: !big, credentials: "same-origin" }), to]).then(r => { clearTimeout(tm); return r; }, er => { clearTimeout(tm); throw er; });
    } catch (err) { p = Promise.reject(err); }
    const pr = p.then(res => settle(id, seq, res), () => settle(id, seq, null)).then(() => { if (flying[id] === pr) delete flying[id]; });
    flying[id] = pr;
  });
  const wait = () => { const ps = Object.keys(flying).map(k => flying[k]); return ps.length ? Promise.all(ps).then(wait) : (A.pend = Object.keys(loadOut()).length, undefined); }; // also waits for the follow-up sends
  return wait();
};
A.beacon = function () { // tab is closing: hand whatever is waiting to the browser
  if (A.quiet) return; const out = loadOut();
  try { if (root.navigator && root.navigator.sendBeacon && typeof Blob !== "undefined") Object.keys(out).forEach(id => { const e = out[id]; if (inflight[id] == null && byteLen(e.body) < 60000) root.navigator.sendBeacon("/__log", new Blob([e.body], { type: "application/json" })); }); } catch (e) {}
};
A.pulse = function (closing) { // tab hidden/closing: record that the game is still alive (the dashboard treats a quiet "active" record as abandoned)
  const m = A.meta; if (!m || m.guest || A.sent || !A.S || A.S.over || A.quiet) return;
  A.persistNow(); const now = Date.now();
  if (now - (A.lastPulse || 0) > 20000) { A.lastPulse = now; A.post(A.rec(A.S, false, "active")); }
  if (closing) A.beacon();
};
A._reload = function () { OUT = null; Object.keys(inflight).forEach(k => delete inflight[k]); Object.keys(flying).forEach(k => delete flying[k]); A.meta = null; A.S = null; A.snaps = []; A.evs = []; A.sp = []; A.sent = false; A.last = 0; A.cancelPersist(); }; // test hook: what a page reload throws away
A.init = function () {
  if (A.inited) return; A.inited = true; loadOut();
  const t = setTimeout(() => A.flush(true), 1500); if (t && t.unref) t.unref();
  const iv = setInterval(() => { if (!A.quiet && Object.keys(loadOut()).length) A.flush(); }, 30000); if (iv && iv.unref) iv.unref();
  if (root.addEventListener) {
    root.addEventListener("pagehide", () => A.pulse(true));
    root.addEventListener("online", () => A.flush(true));
  }
  if (root.document && root.document.addEventListener) root.document.addEventListener("visibilitychange", () => { if (root.document.hidden) A.pulse(true); else A.flush(true); });
};
if (typeof root.document !== "undefined" && root.localStorage !== undefined) A.init();
})(typeof window !== "undefined" ? window : globalThis);
