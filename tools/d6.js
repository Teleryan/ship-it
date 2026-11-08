// Designer-6 sim harness (NEW file in the copy). One cell = one (mode, players, config) experiment.
// usage: node tools/d6.js <mode exp|opt|allmax> <players> <games> ['{"cfgKey":value,...}'] [seedBase=30000] [flags e.g. tiles,persona]
//  exp    : all-Expert table, personas rotate (same as tools/kpi.js expert) plus extra metrics
//  opt    : seat (gi % n) is the Optimizer (profile max), the rest Experts with rotating personas (as tools/btune.js)
//  allmax : every seat is the Optimizer (persona none)
// cfg overrides may contain {"_profile":{..},"_W":{..}} to tweak the Optimizer.
global.window = undefined;
const path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const PERS = ["", "crunch", "hype", "systems", "clean"];
const LO = +(process.env.LO || 33), HI = +(process.env.HI || 63);
function run(mode, n, games, ov, seedBase, flags) {
  ov = ov || {}; flags = flags || "";
  const prof = Object.assign({}, B.profiles, { max: Object.assign({}, B.profiles.max, ov._profile || {}, ov._W ? { w: Object.assign({}, B.profiles.max.w, ov._W) } : {}) });
  const pers = Object.assign({}, B.personas, { maxp: ov._W ? Object.assign({}, ov._W) : {} });
  const cfgOv = Object.assign({}, ov); delete cfgOv._profile; delete cfgOv._W; delete cfgOv._vpMul; if (ov._vpMul) { cfgOv.sysVPMult = 1; cfgOv.vpPrint = ov._vpMul; }
  const R = { games: 0, win: [], gap: [], gold: [], bo: [], sys: [], desks: [], optVP: [], rivVP: [], optWin: 0, optSys: [], optDesk: [], optGold: [], optBo: [], expSys: [], expDesk: [], persWins: {}, persSeats: {}, tile: {}, tileOpt: {}, winSeatOrder: [], spread: [], parts: {}, firstWins: 0, leadR6: 0, leadR6Win: 0, leadN: 0 };
  for (let gi = 0; gi < games; gi++) {
    const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "Bot " + (i + 1), bot: true });
    const cfg = Object.assign({}, D.config, { botProfiles: prof, botPersonas: pers }, cfgOv);
    const S = E.newGame(seats, { seed: seedBase + n * 1000 + gi, config: cfg });
    if (ov._vpMul) S.data.systems.forEach(d => { d.vp = d.vp * ov._vpMul; });
    const me = gi % n;
    S.players.forEach((p, i) => {
      if (mode === "exp") { p.profile = "expert"; const q = PERS[(i + gi) % PERS.length]; if (q) p.persona = q; }
      else if (mode === "allmax") { p.profile = "max"; p.persona = "maxp"; }
      else if (i === me) { p.profile = "max"; p.persona = "maxp"; }
      else { p.profile = "expert"; const q = PERS[(i + gi) % PERS.length]; if (q) p.persona = q; }
    });
    const peak = S.players.map(() => 0); let lastRound = 0, lastOcc = {}, g = 0, r6 = null;
    const flush = () => { const ph = lastRound <= 3 ? 0 : lastRound <= 8 ? 1 : lastRound <= 11 ? 2 : 3; for (const k in lastOcc) { if (flags.includes('phase')) { const kk = k.replace(/_(b|c\d)$/, '') + '@P' + ph; R.tile[kk] = (R.tile[kk] || 0) + lastOcc[k].length; continue; } R.tile[k] = (R.tile[k] || 0) + lastOcc[k].length; if (mode === "opt") R.tileOpt[k] = (R.tileOpt[k] || 0) + lastOcc[k].filter(x => x === me).length; } };
    while (!S.over && g++ < 80000) {
      S.players.forEach((p, i) => { if (p.ws > peak[i]) peak[i] = p.ws; });
      if (S.round !== lastRound) { flush(); lastRound = S.round; lastOcc = {}; if (S.round === 7 && !r6) r6 = S.players.map(p => 0); }
      for (const k in S.occ) lastOcc[k] = S.occ[k].slice();
      if (!B.step(S).ok) break;
    }
    flush();
    if (!S.over) continue;
    R.games++;
    const t = S.scores.map(s => s.total), best = Math.max.apply(null, t), srt = t.slice().sort((a, b) => b - a);
    R.win.push(best); R.gap.push(srt[0] - srt[1]); R.spread.push(srt[0] - srt[srt.length - 1]);
    S.players.forEach((p, i) => { R.gold.push(p.gold); R.bo.push(p.burnout || 0); R.sys.push(p.systems.length); R.desks.push(peak[i]);
      const pe = p.persona || "none"; R.persSeats[pe] = (R.persSeats[pe] || 0) + 1; if (t[i] === best) R.persWins[pe] = (R.persWins[pe] || 0) + 1 / t.filter(v => v === best).length;
      Object.keys(S.scores[i].parts).forEach(k => { const v = S.scores[i].parts[k]; if (typeof v === "number") R.parts[k] = (R.parts[k] || 0) + v; }); });
    if (mode === "opt") {
      const p = S.players[me]; R.optVP.push(t[me]); t.forEach((v, i) => { if (i !== me) R.rivVP.push(v); });
      if (t[me] === best) R.optWin += 1 / t.filter(v => v === best).length;
      R.optSys.push(p.systems.length); R.optDesk.push(peak[me]); R.optGold.push(p.gold); R.optBo.push(p.burnout || 0);
      S.players.forEach((q, i) => { if (i !== me) { R.expSys.push(q.systems.length); R.expDesk.push(peak[i]); } });
    }
  }
  return R;
}
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1), med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
const pc = (a, f) => Math.round(a.filter(f).length / (a.length || 1) * 100);
const sd = a => { const m = avg(a); return Math.sqrt(avg(a.map(x => (x - m) * (x - m)))); };
function summarize(mode, n, R, flags) {
  const o = { n, games: R.games, band: pc(R.win, v => v >= LO && v <= HI), lo: pc(R.win, v => v < LO), hi: pc(R.win, v => v > HI), blow: pc(R.gap, v => v >= 25), winMed: med(R.win), gapMed: med(R.gap), gold: +avg(R.gold).toFixed(1), bo: +avg(R.bo).toFixed(1), sys: +avg(R.sys).toFixed(2), desks: +avg(R.desks).toFixed(2), spread: +avg(R.spread).toFixed(1) };
  if (mode === "opt") { o.optVP = +avg(R.optVP).toFixed(1); o.rivVP = +avg(R.rivVP).toFixed(1); o.edge = +(avg(R.optVP) - avg(R.rivVP)).toFixed(2); o.optWin = Math.round(R.optWin / R.games * 100); o.fair = Math.round(100 / n); o.optSys = +avg(R.optSys).toFixed(2); o.expSys = +avg(R.expSys).toFixed(2); o.optDesk = +avg(R.optDesk).toFixed(2); o.expDesk = +avg(R.expDesk).toFixed(2); o.optGold = +avg(R.optGold).toFixed(1); o.optBo = +avg(R.optBo).toFixed(1); o.se = +(sd(R.optVP) / Math.sqrt(R.optVP.length) * 1.3).toFixed(2); }
  if (mode === "exp" || flags.includes("persona")) { o.pers = {}; Object.keys(R.persSeats).forEach(k => o.pers[k] = Math.round(R.persWins[k] ? R.persWins[k] / R.persSeats[k] * 100 : 0)); }
  if (flags.includes("parts")) { o.parts = {}; Object.keys(R.parts).forEach(k => o.parts[k] = +(R.parts[k] / (R.games * n)).toFixed(1)); }
  if (flags.includes("tiles")) { const per = {}; Object.keys(R.tile).forEach(k => per[k] = +(R.tile[k] / R.games).toFixed(2)); o.tiles = per; if (mode === "opt") { o.tilesOpt = {}; Object.keys(R.tileOpt).forEach(k => o.tilesOpt[k] = +(R.tileOpt[k] / R.games).toFixed(2)); } }
  return o;
}
function fmt(mode, o) {
  let s = `${mode} ${o.n}P g${o.games} | band ${o.band}% (lo ${o.lo} hi ${o.hi}) blow ${o.blow}% win med ${o.winMed} | gold ${o.gold} burn ${o.bo} sys/studio ${o.sys} desks ${o.desks}`;
  if (mode === "opt") s += ` | OPT ${o.optVP} vs ${o.rivVP} edge ${o.edge}(+-${o.se}) win ${o.optWin}% (fair ${o.fair}) sys ${o.optSys}/${o.expSys} desks ${o.optDesk}/${o.expDesk} gold ${o.optGold} burn ${o.optBo}`;
  if (mode === "allmax") s += ` | spread ${o.spread}`;
  if (o.pers) s += " | persona win% " + JSON.stringify(o.pers);
  return s;
}
module.exports = { run, summarize, fmt };
if (require.main === module) {
  const [mode, n0, g0, c0, sb, fl] = process.argv.slice(2);
  const n = +n0, games = +g0, ov = JSON.parse(c0 || "{}"), flags = fl || "";
  const R = run(mode, n, games, ov, +sb || 30000, flags), o = summarize(mode, n, R, flags);
  console.log(fmt(mode, o) + (c0 && c0 !== "{}" ? "  cfg=" + c0 : ""));
  if (o.tiles) console.log("tiles/game " + JSON.stringify(o.tiles));
  if (o.tilesOpt) console.log("tiles/game (optimizer) " + JSON.stringify(o.tilesOpt));
  if (o.parts) console.log("parts/studio " + JSON.stringify(o.parts));
}
