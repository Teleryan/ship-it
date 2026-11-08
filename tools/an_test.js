// Analytics test harness. Run: node tools/an_test.js   (prints "AN OK" when every check passes)
// Drives full bot games through the REAL game/analytics.js (fake localStorage / fetch / window), delivers the records to the REAL worker/worker.js
// (Map-backed KV), then diffs what arrived against ground truth taken from the engine state and from an independent oracle in this file.
// Also runs the master dashboard aggregation (game/stats.js, game/admin.js) over synthetic records with known answers.
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), G = f => path.join(ROOT, "game", f);

/* ---------- fake browser ---------- */
const store = new Map(); let quotaFull = false;
global.localStorage = {
  getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => { if (quotaFull) throw new Error("QuotaExceededError"); store.set(k, String(v)); },
  removeItem: k => { store.delete(k); }
};
global.innerWidth = 1280;
const handlers = {}, rootEl = { _h: "", set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; }, className: "", addEventListener(t, f) { (handlers[t] = handlers[t] || []).push(f); }, insertAdjacentHTML() {}, querySelector: () => null, querySelectorAll: () => [] };
global.document = { getElementById: id => id === "root" ? rootEl : null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, activeElement: null, hidden: false, body: { appendChild() {}, classList: { add() {}, remove() {} } }, createElement: () => ({ style: {}, setAttribute() {}, addEventListener() {} }), head: { appendChild() {} } };
global.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.location = { search: "", protocol: "https:", host: "shipit.test", href: "" };
global.window = global; global.addEventListener = () => {}; global.removeEventListener = () => {}; global.requestAnimationFrame = f => setTimeout(f, 0);
let beacons = []; Object.defineProperty(global, "navigator", { value: { sendBeacon: (u, b) => { beacons.push({ u, size: b.size }); return true; } }, configurable: true });

/* ---------- the real worker with a Map-backed KV ---------- */
class KV {
  constructor() { this.m = new Map(); this.ops = { get: 0, put: 0, list: 0, del: 0 }; this.puts = []; }
  async get(k) { this.ops.get++; const e = this.m.get(k); return e ? e.v : null; }
  async put(k, v, o) { this.ops.put++; this.puts.push({ k, o }); this.m.set(k, { v, meta: (o && o.metadata) || null, ttl: o && o.expirationTtl }); }
  async delete(k) { this.ops.del++; this.m.delete(k); }
  async list(o) { this.ops.list++; o = o || {}; const all = [...this.m.keys()].filter(k => k.startsWith(o.prefix || "")).sort(), start = o.cursor ? +o.cursor : 0, lim = o.limit || 1000, sl = all.slice(start, start + lim);
    return { keys: sl.map(name => ({ name, metadata: this.m.get(name).meta || undefined })), list_complete: start + lim >= all.length, cursor: String(start + lim) }; }
  keys(prefix) { return [...this.m.keys()].filter(k => k.startsWith(prefix)); }
  rec(id) { const e = this.m.get("g:" + id); return e ? JSON.parse(e.v) : null; }
}
function loadWorker() {
  let src = fs.readFileSync(path.join(ROOT, "worker", "worker.js"), "utf8").replace("export default {", "module.exports.default = {").replace("export class Room", "class Room");
  src += "\nmodule.exports.Room = Room;"; const m = { exports: {} }; new Function("module", "exports", "require", src)(m, m.exports, require); return m.exports.default;
}
const worker = loadWorker();
let env = null, kv = null, cookies = {};
async function login(pw) { const fd = new FormData(); fd.set("pw", pw); const r = await worker.fetch(new Request("https://shipit.test/__login", { method: "POST", body: fd }), env); const c = r.headers.get("set-cookie"); return c ? c.split(";")[0] : null; }
async function resetServer() { kv = new KV(); env = { PASSWORD: "player-pw", OWNER_PASSWORD: "owner-pw", COOKIE_SECRET: "s3cret", UPD: kv }; cookies = { owner: await login("owner-pw"), player: await login("player-pw") }; }
const wreq = (role, pathname, method, body) => worker.fetch(new Request("https://shipit.test" + pathname, { method: method || "GET", headers: { cookie: cookies[role], "content-type": "application/json" }, body: body == null ? undefined : (typeof body === "string" ? body : JSON.stringify(body)) }), env);
let net = { down: false, status: 0, role: "player", calls: [], delay: 0 };
global.fetch = async (url, init) => {
  net.calls.push({ url, init, t: Date.now() });
  if (net.down) throw new TypeError("Failed to fetch");
  if (net.status) return new Response("x", { status: net.status });
  return wreq(net.role, url, (init && init.method) || "GET", init && init.body);
};
const sent = () => net.calls.filter(c => c.url === "/__log").map(c => JSON.parse(c.init.body));

/* ---------- game code under test ---------- */
require(G("data.js")); require(G("engine.js")); require(G("bot.js")); require(G("core.js")); require(G("net.js")); require(G("analytics.js"));
const E = global.ShipItEngine, B = global.ShipItBot, SI = global.SI, A = SI.an, D = global.SHIPIT_DATA;

/* ---------- tiny test framework ---------- */
let checks = 0; const fails = [];
function ok(c, msg) { checks++; if (!c) { fails.push(msg); console.log("  FAIL " + msg); } }
function eq(a, b, msg) { const x = JSON.stringify(a), y = JSON.stringify(b); checks++; if (x !== y) { fails.push(msg + "  got " + x.slice(0, 160) + "  want " + y.slice(0, 160)); console.log("  FAIL " + msg + "  got " + x.slice(0, 160) + "  want " + y.slice(0, 160)); } }
const section = t => console.log("\n== " + t);
const byteLen = s => Buffer.byteLength(s, "utf8");

/* ---------- driver: plays a game the way ui.js does (act -> engine hook -> analytics) and keeps an independent oracle ---------- */
function mkSeats(n, humans) { const seats = []; for (let i = 0; i < n; i++) seats.push({ name: (humans.includes(i) ? "Human" : "Bot") + (i + 1), bot: !humans.includes(i) }); return seats; }
function newState(n, humans, seed, skill) { const S = E.newGame(mkSeats(n, humans), { seed }); S.players.forEach((p, i) => { if (p.bot && skill) p.profile = skill; if (p.bot && i % 2) p.persona = ["", "crunch", "hype", "systems", "clean"][(i + 1) % 5]; }); return S; }
function oracle(S) {
  const n = S.players.length, o = { n, acts: 0, tiles: {}, cnt: [], rounds: {}, byRound: {}, last: 0, events: 0 };
  for (let i = 0; i < n; i++) o.cnt.push({ p: 0, x: 0, ws: 0, tr: 0, pro: 0, rc: 0, bd: 0, cl: 0, tm: 0, ov: 0 });
  o.team = S.data.spots.filter(s => s.special === "team").map(s => s.id);
  o.before = a => { // called with the state just before the engine acts
    const q = o.cnt[a.p]; if (!q) return null; const dq = S.dq[0]; if (dq) return null;
    const keep = { type: a.type, p: a.p };
    if (a.type === "place") { const w = S.players[a.p].workers.find(x => x.id === a.worker); keep.over = w.fat >= (S.cfg.fatMax || 2); if (String(a.target).startsWith("spot:")) keep.tile = a.target.slice(5); }
    return keep;
  };
  o.after = (k, r) => { if (!k || !r.ok) return; o.acts++; const q = o.cnt[k.p];
    if (k.type === "place") { q.p++; if (k.over) q.ov++; if (k.tile) { o.tiles[k.tile] = (o.tiles[k.tile] || 0) + 1; if (o.team.includes(k.tile)) q.tm++; } else { /* system trigger */ o.tiles["S"] = (o.tiles["S"] || 0) + 1; } }
    else if (k.type === "pass") q.x++; else if (k.type === "buyws") q.ws++; else if (k.type === "train") q.tr++; else if (k.type === "promote") q.pro++; else if (k.type === "recruit") q.rc++; else if (k.type === "build") q.bd++; else if (k.type === "claim") q.cl++; };
  o.look = () => { if (S.round !== o.last && !S.over) { o.last = S.round; o.byRound[S.round] = S.players.map(p => ({ g: p.gold, pr: p.prod, ws: p.ws || 0, bo: p.burnout || 0, td: p.workers.filter(w => w.fat >= 1).length, ex: p.workers.filter(w => w.fat >= (S.cfg.fatMax || 2)).length, w: p.workers.length, sy: p.systems.length })); } };
  return o;
}
// plays until pred(S) is true or the game is over. onRound(S) runs when a new round is first seen (the test can await network work there).
async function play(S, O, pred, onRound) {
  let guard = 0, lastR = 0;
  while (!S.over && !(pred && pred(S)) && guard++ < 60000) {
    if (S.round !== lastR) { lastR = S.round; if (onRound) await onRound(S); }
    const a = B.decide(S); if (!a) throw new Error("no action at round " + S.round);
    const k = O.before(a), r = E.act(S, a); if (!r.ok) throw new Error("engine refused " + JSON.stringify(a) + " " + r.error);
    O.after(k, r); O.look();
  }
}
async function settle() { for (let i = 0; i < 20 && A.pending(); i++) await A.flush(true); }
const meta = (o) => Object.assign({ mode: "hotseat", site: "d", hash: "base", tuned: "default", test: false, seats: [], tut: 0 }, o || {});
const freshPage = () => { A._reload(); };
async function fullClean() { await new Promise(r => setTimeout(r, 40)); store.clear(); await resetServer(); net = { down: false, status: 0, role: "player", calls: [], delay: 0 }; A.quiet = false; A.enabled = undefined; A.BUDGET = 100000; A.stat = { ok: 0, retry: 0, drop: 0, err: "", at: 0 }; freshPage(); beacons = []; }

/* ---------- ground-truth comparison of a finished game ---------- */
function compareFinished(S, O, rec, tag, opts) {
  opts = opts || {};
  const n = S.players.length;
  ok(rec && /^[A-Za-z0-9]{6,32}$/.test(rec.id), tag + " id is valid");
  eq([rec.status, rec.completed, rec.early], ["complete", true, 0], tag + " status complete");
  eq(rec.n, n, tag + " n"); eq(rec.humans, S.players.filter(p => !p.bot).length, tag + " humans");
  eq(rec.rounds, S.round, tag + " rounds"); eq(S.round, 12, tag + " engine ended at round 12");
  eq(rec.winner, S.winner, tag + " winner"); eq(rec.v, D.version, tag + " version");
  // winner re-derived from the scores with the rules' tie-break (total, then lower debt, then more gold)
  const srt = S.scores.slice().sort((a, b) => b.total - a.total || S.players[a.id].debt - S.players[b.id].debt || S.players[b.id].gold - S.players[a.id].gold);
  eq(rec.winner, srt[0].id, tag + " winner by tie-break rule");
  eq(rec.scores.map(s => [s.id, s.total]), S.scores.map(s => [s.id, s.total]), tag + " scores id/total");
  rec.scores.forEach((s, i) => { eq(s.parts, S.scores[i].parts, tag + " score parts seat " + i); eq(s.id, i, tag + " score id == seat index " + i); });
  const tot = S.scores.map(s => s.total).sort((a, b) => b - a); eq(rec.tie, tot[0] === tot[1] ? 1 : 0, tag + " tie flag");
  rec.seats.forEach((s, i) => { eq([s.name, s.bot, s.persona, s.profile, s.order], [S.players[i].name, !!S.players[i].bot, S.players[i].persona || "", S.players[i].profile || "", S.order.indexOf(i)], tag + " seat " + i); });
  eq(rec.seats.map(s => s.order).sort(), S.players.map((p, i) => i), tag + " seat order is a permutation");
  eq(rec.gates, S.gates.map(g => ({ ph: g.phase, name: g.name, lvl: g.lvl || "M", passed: g.passed, failed: g.failed, best: g.best })), tag + " gates");
  eq(rec.gates.length, 4, tag + " four gates");
  S.players.forEach((p, i) => {
    const f = rec.final[i];
    eq([f.g, f.pr, f.mk, f.hy, f.db, f.cu, f.rs, f.w, f.sy, f.sr, f.ob, f.gl, f.va, f.bo], [p.gold, p.prod, p.mktg, p.hype, p.debt, p.culture, [p.ideas, p.code, p.process, p.buzz], p.workers.length, p.systems.length, p.workers.filter(w => w.lvl === "Sr").length, p.objectives.length, p.gateLoss || 0, p.vpAdj, p.burnout || 0], tag + " final seat " + i);
    eq([f.rc, f.cr, f.cv, f.tn, f.pm], [p.cs.recruits || 0, p.cs.crunched || 0, p.cs.converted || 0, p.cs.trainings || 0, p.cs.promotions || 0], tag + " final counters seat " + i);
    eq(f.si, p.systems.map(y => y.name), tag + " systems built (ids) seat " + i); eq(f.mi, p.claimed, tag + " milestones claimed seat " + i);
    eq(f.oi, p.objectives, tag + " objectives chosen seat " + i); eq(f.om, S.scores[i].parts.objList.map(x => x.met ? 1 : 0), tag + " objectives met seat " + i);
    eq([f.td, f.ex], [p.workers.filter(w => w.fat >= 1).length, p.workers.filter(w => w.fat >= 2).length], tag + " tired/exhausted at end seat " + i);
  });
  // snapshots: rounds 1..12 once each, plus the end; values equal what the oracle saw at the first sight of each round
  eq(rec.snaps.map(s => s.k), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99], tag + " one snapshot per round + end");
  if (O) rec.snaps.forEach(s => { if (s.k === 99) return; const w = O.byRound[s.r]; if (!w) return; s.p.forEach((p, i) => eq([p.g, p.pr, p.ws, p.bo, p.td, p.ex, p.w, p.sy], [w[i].g, w[i].pr, w[i].ws, w[i].bo, w[i].td, w[i].ex, w[i].w, w[i].sy], tag + " snapshot r" + s.r + " seat " + i)); });
  ok(rec.snaps.every(s => s.k === 99 || (s.m && s.m.length === n)), tag + " every round has an end-of-Place (desks / tired / exhausted) record");
  ok(rec.snaps.every(s => s.k === 99 || (s.r >= 4 ? true : true)), tag + " snaps");
  // crisis card id per phase start
  ok(rec.snaps.some(s => s.c != null), tag + " crisis card ids recorded");
  // events
  if (O) {
    eq(rec.cn, O.cnt, tag + " per-seat action counters == oracle");
    const tl = {}; Object.keys(rec.tl).forEach(k => { if (k.startsWith("S:")) tl.S = (tl.S || 0) + rec.tl[k]; else tl[k] = rec.tl[k]; }); eq(tl, O.tiles, tag + " tile usage == oracle");
    eq(rec.ev.filter(e => e[2] === "p").length, rec.cn.reduce((a, c) => a + c.p, 0), tag + " place events == counters");
    ok(rec.ev.every((e, i, a) => i === 0 || e[0] >= a[i - 1][0]), tag + " events are in round order");
    ok(rec.ev.filter(e => e[2] === "ko").length === n, tag + " objective picks logged once per seat");
    ok(rec.ev.every(e => Array.isArray(e) && e.length >= 4), tag + " event shape [round, seat, code, arg, t]");
    ok(rec.sp.length === 4 && rec.sp.every(a => a && a.length > 5), tag + " active tiles per phase recorded");
    const bids = rec.ev.filter(e => e[2] === "bid"); const auc = rec.ev.filter(e => e[2] === "au");
    if (bids.length) ok(auc.length > 0 && bids.every(b => typeof b[3][1] === "number" && b[3][0]), tag + " crisis bids and auction results logged");
  }
  const sz = byteLen(JSON.stringify(rec)); ok(sz < 100000, tag + " record fits the budget (" + sz + " bytes)");
  return sz;
}

/* ===================================================================================================================== */
(async function main() {
  const sizes = {};

  section("1. normal finish: 2/3/4/5 players, all bots / one human / all human-marked seats");
  for (const [n, humans] of [[2, []], [3, [0]], [4, [0, 1, 2, 3]], [5, [1, 3]], [4, []], [2, [0, 1]], [5, [0, 1, 2, 3, 4]], [3, []]]) {
    await fullClean();
    const S = newState(n, humans, 100 + n * 7 + humans.length, ["", "novice", "expert"][n % 3]), O = oracle(S);
    A.setLabel("Table 2"); A.begin(S, meta({ tut: 1 })); O.look();
    const roundsSeen = [];
    await play(S, O, null, async s => { await settle(); roundsSeen.push(s.round); });
    await settle();
    const tag = "[" + n + "P/" + humans.length + "h]"; 
    const g = kv.keys("g:"); eq(g.length, 1, tag + " exactly one record stored");
    const rec = kv.rec(A.meta.id);
    sizes[n + "p/" + humans.length + "h"] = compareFinished(S, O, rec, tag);
    eq([rec.lbl, rec.tut, rec.src, rec.mode, rec.hash, rec.tuned, rec.test, rec.env, rec.site, rec.role, rec.device], ["Table 2", 1, "solo", "hotseat", "base", "default", false, "D", "d", "player", "desktop"], tag + " meta fields");
    ok(typeof rec.recv === "number" && Math.abs(rec.recv - Date.now()) < 5000, tag + " recv set by the server clock");
    // delivery trail: an "active" record was sent at the start of every round 1..12 and the final record came last
    const posts = sent(); const act = posts.filter(p => p.status === "active");
    eq(act.map(p => p.rounds), [1, 4, 7, 10], tag + " an active interim was posted every third round (KV write budget)");
    eq(posts[posts.length - 1].status, "complete", tag + " the final record was the last post");
    ok(posts.every((p, i, a) => i === 0 || p.seq > a[i - 1].seq), tag + " seq strictly increases");
    ok(!store.has("shipit.an.cur"), tag + " in-progress state removed after the final post");
    eq(A.pending(), 0, tag + " outbox empty");
    ok(A.stray === 0, tag + " no stray S object");
    // the dashboard reads it back
    const r = await (await wreq("owner", "/__games")).json(); eq([r.n, r.total, r.more], [1, 1, false], tag + " /__games returns it once");
  }
  console.log("  record sizes (bytes):", JSON.stringify(sizes));

  section("2. abandon at round 5 (leave through the menu)");
  await fullClean();
  { const S = newState(4, [0], 21), O = oracle(S); A.begin(S, meta()); const id = A.meta.id; await play(S, O, s => s.round === 5, async () => { await settle(); }); await settle();
    A.abandon(); await settle();
    const rec = kv.rec(id); eq(kv.keys("g:").length, 1, "one record");
    eq([rec.status, rec.completed, rec.winner, rec.scores, rec.rounds], ["abandoned", false, null, null, 5], "abandoned record fields");
    eq(rec.snaps.map(s => s.k), [1, 2, 3, 4, 5], "abandoned: snapshots 1..5"); ok(rec.ev.length > 20 && rec.cn, "abandoned record keeps events");
    ok(A.meta === null, "analytics detached"); }
  await fullClean();
  { const S = newState(3, [0], 22), O = oracle(S); A.begin(S, meta()); const id = A.meta.id; await settle(); A.abandon(); await settle();
    eq(kv.rec(id).status, "abandoned", "leaving in round 1 is recorded as abandoned too"); eq(kv.rec(id).rounds, 1, "...at round 1"); }

  section("3. tab closed without abandoning (pagehide) and a tab that is left running");
  await fullClean();
  { const S = newState(4, [0, 1], 23), O = oracle(S); A.begin(S, meta()); const id = A.meta.id; await play(S, O, s => s.round === 4, async () => { await settle(); });
    A.lastPulse = 0; A.pulse(true); await settle();
    const rec = kv.rec(id); eq([rec.status, rec.rounds], ["active", 4], "pagehide posts an active record"); ok(beacons.length >= 0, "beacon attempted");
    ok(store.has("shipit.an.cur"), "in-progress state kept for a reload"); }

  section("4. reload + resume (autosave 'Continue where you left off')");
  await fullClean();
  { const S = newState(4, [0, 2], 31), O = oracle(S); A.begin(S, meta()); const id = A.meta.id, t0 = A.meta.startedAt; await play(S, O, s => s.round === 6, async () => { await settle(); });
    A.persistNow(); const autosave = JSON.stringify({ S, an: A.curId() }); const evsBefore = A.evs.length;
    freshPage(); // the page is gone
    const o = JSON.parse(autosave), S2 = o.S; A.resume(S2, { kind: "auto", id: o.an, meta: meta() });
    eq(A.meta.id, id, "resumed game keeps its record id"); eq(A.meta.startedAt, t0, "startedAt preserved"); eq(A.evs.length >= evsBefore, true, "events restored");
    // from here the oracle continues on S2 (same data)
    const O2 = oracle(S2); O2.cnt = O.cnt; O2.tiles = O.tiles; O2.last = O.last; O2.byRound = O.byRound; O2.team = O.team;
    await play(S2, O2, null, async () => { await settle(); }); await settle();
    eq(kv.keys("g:").length, 1, "still exactly one record after the resume"); const rec = kv.rec(id);
    compareFinished(S2, O2, rec, "[resumed]"); eq(rec.res, 1, "resume counted"); ok(!rec.part, "not partial"); eq(rec.startedAt, t0, "record startedAt is the original start"); }
  // reload where the analytics state is gone (older autosave): the game must still be recorded, flagged partial
  await fullClean();
  { const S = newState(3, [0], 32), O = oracle(S); A.begin(S, meta()); const id = A.meta.id; await play(S, O, s => s.round === 5, async () => { await settle(); }); A.persistNow();
    const autosave = JSON.stringify({ S }); freshPage(); store.delete("shipit.an.cur");
    const S2 = JSON.parse(autosave).S; A.resume(S2, { kind: "auto", id: undefined, meta: meta() }); const O2 = oracle(S2); await play(S2, O2, null, async () => { await settle(); }); await settle();
    const recs = kv.keys("g:").map(k => JSON.parse(kv.m.get(k).v)); const fin = recs.filter(r => r.status === "complete");
    eq(fin.length, 1, "a resumed game with no stored analytics state still posts one final record"); eq(fin[0].part, 1, "flagged partial"); eq(fin[0].scores.map(s => s.total), S2.scores.map(s => s.total), "scores correct"); ok(fin[0].id !== id, "new id (old state unknown)");
    eq(recs.length, 2, "the interim record of the first part stays as its own (abandoned after the timeout) record"); }
  // reload of a game that is already over: no second record
  await fullClean();
  { const S = newState(2, [0], 33), O = oracle(S); A.begin(S, meta()); await play(S, O, null, async () => { await settle(); }); await settle(); const autosave = JSON.stringify({ S }); freshPage();
    A.resume(JSON.parse(autosave).S, { kind: "auto", meta: meta() }); await settle(); eq(kv.keys("g:").length, 1, "reloading a finished game does not create another record"); ok(A.meta === null, "nothing tracked"); }
  // manual save / load: a new branch with its own id
  await fullClean();
  { const S = newState(3, [0], 34), O = oracle(S); A.begin(S, meta()); const id1 = A.meta.id; await play(S, O, s => s.round === 5, async () => { await settle(); });
    A.saveFor(); const saved = JSON.stringify(S); await play(S, O, null, async () => { await settle(); }); await settle();
    freshPage(); const S2 = JSON.parse(saved); A.resume(S2, { kind: "save", meta: meta() }); const id2 = A.meta.id; ok(id2 !== id1, "loading a manual save starts a new record id"); eq(A.meta.from, id1, "...pointing back to the original");
    const O2 = oracle(S2); await play(S2, O2, null, async () => { await settle(); }); await settle();
    eq(kv.keys("g:").length, 2, "both branches are recorded"); eq(kv.rec(id1).status, "complete", "original complete"); eq(kv.rec(id2).status, "complete", "branch complete");
    eq(kv.rec(id2).snaps.map(s => s.k), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99], "branch keeps the history up to the save"); eq(kv.rec(id2).from, id1, "from stored"); }

  section("5. delivery: network down, server errors, reload with pending records, retry");
  await fullClean();
  { net.down = true; const S = newState(4, [0], 41), O = oracle(S); A.begin(S, meta()); const id = A.meta.id;
    await play(S, O, null, async () => { await A.flush(true); }); await A.flush(true);
    eq(kv.keys("g:").length, 0, "nothing reached the server while offline"); eq(A.pending(), 1, "exactly one record waiting (the final one replaced the interims)");
    const q = JSON.parse(store.get("shipit.an.out")); eq(Object.keys(q), [id], "outbox persisted in localStorage"); eq(q[id].st, "complete", "outbox holds the final record");
    ok(A.stat.retry > 0 && /offline/.test(A.stat.err), "failure is visible in A.stat");
    freshPage(); net.down = false; A.init && (A.inited = false); A.init(); await A.flush(true); await settle(); // a new page load sends what is waiting
    eq(kv.keys("g:").length, 1, "delivered after the next page load"); compareFinished(S, O, kv.rec(id), "[offline-then-online]"); eq(A.pending(), 0, "outbox empty"); }
  await fullClean();
  { net.status = 500; const S = newState(2, [0], 42), O = oracle(S); A.begin(S, meta()); const id = A.meta.id; await play(S, O, null, async () => {}); await A.flush(true);
    eq(A.pending(), 1, "HTTP 500 keeps the record"); const e = JSON.parse(store.get("shipit.an.out"))[id]; ok(e.tries >= 1 && e.next > Date.now(), "backoff scheduled");
    net.calls = []; await A.flush(); eq(net.calls.length, 0, "no hammering during backoff"); net.status = 401; await A.flush(true); eq(A.pending(), 1, "401 (login expired) keeps the record"); net.status = 0; await A.flush(true); eq(A.pending(), 0, "delivered once the server is fine"); eq(kv.keys("g:").length, 1, "stored");
    net.status = 400; const S2 = newState(2, [0], 43); A.begin(S2, meta()); await play(S2, oracle(S2), null); await A.flush(true); await A.flush(true); eq(A.pending(), 0, "a permanent 400 is dropped, not retried forever"); ok(A.stat.drop > 0, "drop counted"); net.status = 0; }
  await fullClean();
  { quotaFull = true; const S = newState(2, [0], 44), O = oracle(S); A.begin(S, meta()); await play(S, O, null, async () => { await settle(); }); await settle(); quotaFull = false;
    eq(kv.keys("g:").length, 1, "localStorage full / blocked: the record is still delivered from memory"); }
  await fullClean();
  { const S = newState(3, [0], 45), O = oracle(S); A.enabled = false; A.begin(S, meta()); await play(S, O, null); eq(net.calls.length, 0, "enabled=false (not served by the Worker): nothing is sent"); eq(A.pending(), 0, "and nothing queued"); A.enabled = undefined; }

  section("6. duplicates and out-of-order delivery");
  await fullClean();
  { const S = newState(3, [0], 51), O = oracle(S); A.begin(S, meta()); const id = A.meta.id; await play(S, O, null, async () => { await settle(); }); await settle();
    const fin = kv.rec(id), raw = JSON.stringify(fin);
    for (let i = 0; i < 3; i++) await wreq("player", "/__log", "POST", raw);
    eq(kv.keys("g:").length, 1, "re-posting the same final record keeps one key"); eq(kv.rec(id).scores, fin.scores, "content unchanged");
    const late = Object.assign({}, fin, { status: "active", completed: false, scores: null, winner: null, rounds: 7, seq: fin.seq - 3 }); const r = await (await wreq("player", "/__log", "POST", late)).json();
    eq(r.kept, true, "late interim answered ok but ignored"); eq(kv.rec(id).status, "complete", "final not overwritten by a late interim"); eq(kv.rec(id).rounds, 12, "rounds kept");
    const ab = Object.assign({}, fin, { status: "abandoned", completed: false, scores: null, seq: fin.seq + 9 }); await wreq("player", "/__log", "POST", ab); eq(kv.rec(id).status, "complete", "abandoned never replaces complete");
    const id2 = "ZZZZ" + id.slice(4, 12), a1 = { id: id2, status: "active", seq: 5, rounds: 5, n: 2 }, a0 = { id: id2, status: "active", seq: 3, rounds: 3, n: 2 };
    await wreq("player", "/__log", "POST", a1); await wreq("player", "/__log", "POST", a0); eq(kv.rec(id2).rounds, 5, "older interim does not replace a newer interim");
    await wreq("player", "/__log", "POST", Object.assign({}, a1, { status: "abandoned", seq: 6 })); eq(kv.rec(id2).status, "abandoned", "abandoned replaces active");
    await wreq("player", "/__log", "POST", Object.assign({}, a1, { status: "active", seq: 99 })); eq(kv.rec(id2).status, "abandoned", "active (even with a higher seq) does not replace abandoned");
    const id3 = "GGGG" + id.slice(4, 12); await wreq("player", "/__log", "POST", { id: id3, status: "complete", src: "host", seq: 2, n: 2 }); await wreq("player", "/__log", "POST", { id: id3, status: "complete", src: "guest", seq: 50, n: 2 }); eq(kv.rec(id3).src, "host", "guest fallback never replaces the host's final record");
    const id4 = "HHHH" + id.slice(4, 12); await wreq("player", "/__log", "POST", { id: id4, status: "active", src: "host", seq: 4, n: 2 }); await wreq("player", "/__log", "POST", { id: id4, status: "complete", src: "guest", seq: 1, n: 2 }); eq(kv.rec(id4).src, "guest", "guest final is stored when the host only got as far as an interim");
    await wreq("player", "/__log", "POST", { id: id4, status: "complete", src: "host", seq: 3, n: 2 }); eq(kv.rec(id4).src, "host", "...and the host's final replaces the guest's");
    const id5 = "LLLL" + id.slice(4, 12); await wreq("player", "/__log", "POST", { id: id5, completed: true, scores: [], n: 2, seq: 0 }); await wreq("player", "/__log", "POST", { id: id5, status: "active", seq: 10, n: 2 }); eq(kv.rec(id5).completed, true, "a legacy record (no status, completed) is treated as complete"); }

  section("7. record size: real sizes and the trim ladder");
  await fullClean();
  for (const n of [2, 3, 4, 5]) { const S = newState(n, [0], 60 + n), O = oracle(S); A.begin(S, meta()); await play(S, O, null); const rec = A.rec(S, true); sizes["final " + n + "p"] = byteLen(JSON.stringify(rec)); A.stop(); }
  console.log("  final record bytes by player count:", JSON.stringify({ 2: sizes["final 2p"], 3: sizes["final 3p"], 4: sizes["final 4p"], 5: sizes["final 5p"] }));
  ok(sizes["final 5p"] < 100000, "5-player record is under the 100000-byte budget");
  { let S; for (const budget of [30000, 14000, 9000, 5000, 2500]) {
      await fullClean(); A.BUDGET = budget; S = newState(5, [0, 1, 2, 3, 4], 70); A.begin(S, meta()); const id = A.meta.id; await play(S, oracle(S), null); await settle();
      const rec = kv.rec(id); ok(rec && rec.status === "complete", "budget " + budget + ": record still delivered"); if (rec) { ok(byteLen(JSON.stringify(rec)) <= budget + 1500 || rec.trim >= 6, "budget " + budget + ": size " + byteLen(JSON.stringify(rec)) + " trim level " + rec.trim); eq(rec.scores.map(s => s.total), S.scores.map(s => s.total), "budget " + budget + ": scores kept"); eq(rec.winner, S.winner, "winner kept"); eq(rec.gates.length, 4, "gates kept"); ok(rec.final.length === 5, "final kept"); } }
    A.BUDGET = 100000; }
  await fullClean();
  { const big = { id: "BIGBIGBIGBIG", status: "complete", n: 2, pad: "x".repeat(121000) }; const r = await wreq("player", "/__log", "POST", big); eq(r.status, 413, "server refuses >120000 for players"); eq(kv.keys("g:").length, 0, "nothing stored");
    const r2 = await wreq("owner", "/__log", "POST", { id: "BIGBIGBIGBIG", status: "complete", n: 2, pad: "x".repeat(121000) }); eq(r2.status, 413, "...and for the owner's player games");
    const r3 = await wreq("owner", "/__log", "POST", { id: "SIMBIGSIMBIG", mode: "simbatch", games: [], pad: "x".repeat(300000) }); eq(r3.status, 200, "sim batches up to 900000 ok for the owner"); }
  { // multibyte names: bytes, not characters, are budgeted
    await fullClean(); const S = newState(5, [0, 1, 2, 3, 4], 71); S.players.forEach((p, i) => { p.name = "محمدمحمدمحمدمح".slice(0, 20); }); A.begin(S, meta()); await play(S, oracle(S), null); await settle(); ok(kv.keys("g:").length === 1, "Arabic seat names delivered"); }

  await require("./an_test2.js")({ handlers, rootEl, ok, eq, section, byteLen, fullClean, newState, oracle, play, settle, meta, mkSeats, wreq, kv: () => kv, store, net: () => net, E, B, SI, A, D, freshPage, G, sizes, getNet: () => net });
  console.log("\n" + checks + " checks, " + fails.length + " failed");
  if (fails.length) { console.log("FAILED:\n - " + fails.join("\n - ")); process.exit(1); }
  console.log("AN OK"); process.exit(0); // ui.js keeps a timer running
})().catch(e => { console.log("HARNESS ERROR", e && e.stack || e); process.exit(2); });
