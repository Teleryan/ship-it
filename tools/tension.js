// Tension + KPI sweep: blowouts, gap, leftover Gold, and worker-placement contention. usage: node tools/tension.js [games] [players csv] ['{cfg overrides}']
global.window = undefined;
const path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const games = +process.argv[2] || 60, counts = (process.argv[3] || "2,3,4,5,6").split(",").map(Number), ov = JSON.parse(process.argv[4] || "{}");
// the shipped rules are simply D.config; the optional JSON argument overrides single keys
const cfg = Object.assign({}, D.config, ov);
const PERS = ["", "crunch", "hype", "systems", "clean"];
const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; }, avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const pc = (a, f) => Math.round(a.filter(f).length / (a.length || 1) * 100);
for (const n of counts) {
  const win = [], gap = [], gold = [], bo = [], pers = {}; let turns = 0, blocked = 0, regret = 0, val = 0, idle = 0, avail = 0, fillN = 0, fillD = 0, gateMiss = 0, pl = 0, sysN = 0;
  for (let gi = 0; gi < games; gi++) {
    const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "B" + i, bot: true });
    const S = E.newGame(seats, { seed: 7000 + n * 1000 + gi, config: cfg });
    S.players.forEach((p, i) => { const q = PERS[(i + gi) % PERS.length]; if (q) p.persona = q; p.profile = "casual"; });
    let g = 0;
    while (!S.over && g++ < 80000) {
      const act = E.currentActor(S), step = S.step, dq = S.dq.length;
      if (step === "place" && !dq && act >= 0) {
        const pr = B.probe(S, act), av = pr.filter(x => x.avail);
        const bu = pr.length ? Math.max(...pr.map(x => x.s)) : 0, ba = av.length ? Math.max(...av.map(x => x.s)) : 0;
        turns++; val += ba; if (bu > ba + 0.05) { blocked++; regret += bu - ba; }
      }
      const r = B.step(S); if (!r.ok) break;
      if (step === "place" && S.step !== "place") { // end of Place: single-slot fill
        const sp = E.activeSpots(S).filter(s => (s.mode || "single") === "single" && !["OUTSOURCE"].includes(s.row));
        sp.forEach(s => { fillD++; if ((S.occ[s.id] || []).length) fillN++; });
      }
    }
    if (!S.over) continue;
    const t = S.scores.map(s => s.total).sort((a, b) => b - a);
    win.push(t[0]); gap.push(t[0] - t[1]); S.players.forEach(p => { gold.push(p.gold); bo.push(p.burnout || 0); sysN += p.systems.length; pl++; });
    S.players.forEach(p => { if (p.gateLoss > 0) gateMiss++; });
  }
  console.log(`${n}P w${win.length} | win ${med(win).toFixed(0)} [${Math.min(...win)}-${Math.max(...win)}] | gap ${med(gap).toFixed(1)} blow ${pc(gap, v => v >= 25)}% (>=15: ${pc(gap, v => v >= 15)}%) | leftG ${avg(gold).toFixed(1)} | burn ${avg(bo).toFixed(1)} | blocked ${Math.round(blocked / turns * 100)}% regret ${(regret / Math.max(1, blocked)).toFixed(1)} | fill ${Math.round(fillN / Math.max(1, fillD) * 100)}% | sys ${(sysN / pl).toFixed(1)} | gateLoss ${Math.round(gateMiss / pl * 100)}%`);
}
