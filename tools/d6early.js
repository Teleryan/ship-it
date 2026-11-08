// First-round / early-game feel at a given starting-Junior count. usage: node tools/d6early.js <players> <games> <startWorkers> [expert|max]
global.window = undefined;
const path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const PERS = ["", "crunch", "hype", "systems", "clean"];
const n = +process.argv[2], games = +process.argv[3], sw = +process.argv[4], prof = process.argv[5] || "expert";
const snap = { 2: [], 3: [], 4: [] }; const placedR1 = [], placedR2 = [], idleR1 = [], ws1 = [], gold2 = [], burn4 = [];
for (let gi = 0; gi < games; gi++) {
  const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "B" + i, bot: true });
  const S = E.newGame(seats, { seed: 30000 + n * 1000 + gi, config: Object.assign({}, D.config, { startWorkers: sw }) });
  S.players.forEach((p, i) => { p.profile = prof; const q = PERS[(i + gi) % 5]; if (q && prof === "expert") p.persona = q; });
  let g = 0, lastR = 0, cnt = {}; 
  while (!S.over && g++ < 80000) {
    if (S.round !== lastR) {
      if (lastR === 1 || lastR === 2) S.players.forEach(p => { (lastR === 1 ? placedR1 : placedR2).push(cnt[p.id] || 0); if (lastR === 1) { idleR1.push(p.workers.length - (cnt[p.id] || 0)); ws1.push(p.ws || 0); } });
      if ([2, 3, 4].includes(S.round)) S.players.forEach(p => snap[S.round].push({ gold: p.gold, w: p.workers.length, prod: p.prod, hype: p.hype + p.mktg, sys: p.systems.length + p.building.length, bo: p.burnout || 0 }));
      lastR = S.round; cnt = {};
    }
    const before = S.players.map(p => p.workers.filter(w => w.placed).length);
    if (!B.step(S).ok) break;
    S.players.forEach((p, i) => { const a = p.workers.filter(w => w.placed).length; if (a > before[i]) cnt[p.id] = Math.max(cnt[p.id] || 0, a); });
  }
}
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
console.log(`startWorkers ${sw} (${n}P, ${prof}): R1 workers placed ${avg(placedR1).toFixed(2)}, idle in R1 ${avg(idleR1).toFixed(2)}, desks held end R1 ${avg(ws1).toFixed(2)}, R2 placed ${avg(placedR2).toFixed(2)}`);
for (const r of [2, 3, 4]) console.log(`  start of R${r}: gold ${avg(snap[r].map(x => x.gold)).toFixed(1)} workers ${avg(snap[r].map(x => x.w)).toFixed(1)} prog ${avg(snap[r].map(x => x.prod)).toFixed(1)} hype ${avg(snap[r].map(x => x.hype)).toFixed(1)} sys(incl building) ${avg(snap[r].map(x => x.sys)).toFixed(2)} burnout ${avg(snap[r].map(x => x.bo)).toFixed(2)}`);
