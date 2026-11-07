// Optimizer-bot evaluation and tuner. Seat 0 (rotated) plays profile "max" with the given overrides; the others play the Expert profile with rotating personas.
// usage: node tools/btune.js eval [players=4] [games=40] ['{"profile":{...},"W":{...}}']
//        node tools/btune.js tune [players=4] [games=30] [iters=30] [seed=1]   (random-perturbation hill climb; prints the best vector)
global.window = undefined;
const path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const PERS = ["", "crunch", "hype", "systems", "clean"];
function run(n, games, over, base0) {
  const prof = Object.assign({}, B.profiles, { max: Object.assign({}, B.profiles.max, (over || {}).profile || {}) });
  const pers = Object.assign({}, B.personas, { maxp: (over || {}).W || {} });
  let sum = 0, wins = 0, rank = 0, rival = 0, nr = 0, win = [], det = { desks: 0, sys: 0, trains: 0, gold: 0, workers: 0 };
  for (let gi = 0; gi < games; gi++) {
    const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "Bot " + (i + 1), bot: true });
    const cfg = Object.assign({}, D.config, { botProfiles: prof, botPersonas: pers });
    const S = E.newGame(seats, { seed: (base0 || 20000) + n * 1000 + gi, config: cfg });
    const me = gi % n;
    S.players.forEach((p, i) => { if (i === me) { p.profile = "max"; p.persona = "maxp"; } else { p.profile = "expert"; const q = PERS[(i + gi) % PERS.length]; if (q) p.persona = q; } });
    let g = 0, peak = 0; while (!S.over && g++ < 80000) { if (S.players[me].ws > peak) peak = S.players[me].ws; if (!B.step(S).ok) break; }
    if (!S.over) continue;
    const t = S.scores.map(s => s.total), mine = t[me], best = Math.max.apply(null, t);
    sum += mine; if (mine === best) wins++; rank += 1 + t.filter(v => v > mine).length; win.push(best);
    t.forEach((v, i) => { if (i !== me) { rival += v; nr++; } });
    const p = S.players[me]; det.desks += peak; det.sys += p.systems.length; det.trains += (p.cs && p.cs.trainings) || 0; det.gold += p.gold; det.workers += p.workers.length;
  }
  const k = games;
  return { vp: sum / k, win: wins / k, rank: rank / k, rival: rival / (nr || 1), diff: sum / k - rival / (nr || 1), winnerMax: Math.max.apply(null, win), det: Object.keys(det).reduce((o, x) => (o[x] = +(det[x] / k).toFixed(1), o), {}) };
}
if (require.main === module) {
  const [cmd, n0, g0, a3, a4] = process.argv.slice(2), n = +n0 || 4, games = +g0 || 40;
  if (cmd === "eval") { const r = run(n, games, JSON.parse(a3 || "{}")); console.log(n + "P optimizer vs experts: VP " + r.vp.toFixed(1) + " (rivals " + r.rival.toFixed(1) + ", diff " + r.diff.toFixed(1) + ") | win " + Math.round(r.win * 100) + "% (fair " + Math.round(100 / n) + "%) | avg rank " + r.rank.toFixed(2) + " | peak winner " + r.winnerMax + " | per game: " + JSON.stringify(r.det)); }
}
module.exports = { run };

// ---- tuner ----
const SPACE = {
  profile: { gate: [0.5, 2.2], deny: [0, 2.5], commit: [0, 2], deskReserve: [0, 5], deskPenalty: [0, 0.6], buildFloor: [0, 6], trainGold: [2, 10], promoP: [1, 1] },
  W: { prod: [0.5, 2], mktg: [0.4, 2], hype: [0.4, 2], gold: [0.5, 2], debt: [0.4, 2.2], spotDebt: [0, 1.2], resVal: [0.6, 2.5], recBase: [2, 5], recReserve: [0, 5], recMax: [-1, 3], srCap: [0.2, 0.9], promoGold: [3, 12], crunchGold: [6, 24], crunchRound: [5, 11], buildScale: [0.5, 2], buildBias: [-1, 6], srVal: [0, 3], thr: [0, 1], gateSurplus: [0.6, 1.6], gatePace: [2, 8], workers: [-1, 2], convHold: [0.5, 1.5], crewCost: [1, 5] }
};
function start() {
  const o = { profile: {}, W: {} }, P = B.profiles.max;
  Object.keys(SPACE.profile).forEach(k => { o.profile[k] = P[k] != null ? P[k] : (SPACE.profile[k][0] + SPACE.profile[k][1]) / 2; });
  Object.keys(SPACE.W).forEach(k => { o.W[k] = (k in { prod: 1, mktg: 1, hype: 1, gold: 1, debt: 1, resVal: 1.5, recBase: 3.4, recReserve: 2, recMax: 0, srCap: 0.5, promoGold: 7, crunchGold: 16, crunchRound: 8, buildScale: 1, buildBias: 0, srVal: 1.2, thr: 0.3, gateSurplus: 1.1, gatePace: 4, workers: 0, convHold: 1, crewCost: 3, spotDebt: 0.3 }) ? { prod: 1, mktg: 1, hype: 1, gold: 1, debt: 1, resVal: 1.5, recBase: 3.4, recReserve: 2, recMax: 0, srCap: 0.5, promoGold: 7, crunchGold: 16, crunchRound: 8, buildScale: 1, buildBias: 0, srVal: 1.2, thr: 0.3, gateSurplus: 1.1, gatePace: 4, workers: 0, convHold: 1, crewCost: 3, spotDebt: 0.3 }[k] : 1; });
  return o;
}
const clamp = (v, r) => Math.max(r[0], Math.min(r[1], v));
function mutate(o, rng) {
  const c = JSON.parse(JSON.stringify(o)), groups = ["profile", "W"], k = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < k; i++) {
    const g = groups[rng() < 0.3 ? 0 : 1], keys = Object.keys(SPACE[g]), key = keys[Math.floor(rng() * keys.length)], r = SPACE[g][key];
    let v = c[g][key] + (rng() - 0.5) * (r[1] - r[0]) * 0.4; v = clamp(v, r);
    c[g][key] = ["buildFloor", "trainGold", "deskReserve", "recMax", "crunchRound", "promoGold", "crunchGold", "recReserve"].includes(key) ? Math.round(v) : +v.toFixed(2);
  }
  return c;
}
function score(o, base0) { const r = [3, 4, 5].map(n => run(n, 36, o, base0)); return { s: r.reduce((t, x) => t + x.diff, 0) / r.length, r }; }
if (require.main === module && process.argv[2] === "tune") {
  const iters = +process.argv[5] || 30, seed = +process.argv[6] || 1; let st = seed * 7919 % 2147483647; const rng = () => (st = st * 48271 % 2147483647) / 2147483647;
  let best = start(), bs = score(best, 20000 + seed * 100); console.log("start diff", bs.s.toFixed(2));
  for (let it = 0; it < iters; it++) {
    const c = mutate(best, rng), cs = score(c, 20000 + seed * 100);
    if (cs.s > bs.s) { best = c; bs = cs; console.log("it " + it + " diff " + bs.s.toFixed(2)); }
  }
  console.log("BEST " + JSON.stringify(best)); console.log("diff " + bs.s.toFixed(2));
}
