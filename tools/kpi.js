// KPI sweep for the shipped game (Variant D rules): winner VP, gap, blowouts, leftover Gold, Burnout, by player count.
// usage: node tools/kpi.js [games=200] [skill=casual|novice|expert|""] [players csv=2,3,4,5,6] ['{"cfg":"overrides"}']
// Seats rotate through the four personas. Seeds are fixed so two runs are comparable.
global.window = undefined;
const path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const games = +process.argv[2] || 200, skill = process.argv[3] === undefined ? "casual" : process.argv[3];
const counts = (process.argv[4] || "2,3,4,5,6").split(",").map(Number), ov = JSON.parse(process.argv[5] || "{}");
D.milestones = D.milestones.map(m => m.name === "Liquidation" ? { cat: "Workforce", gold: 4, name: "Double Recruit", text: "Recruit 2 workers from the shared pool in one round", phases: [1, 2] } : m); // as the Variant D build does
// shipped D rules: the build flips these flags on the C config
const cfg = Object.assign({}, D.config, D.configC, { varC: 1, burnout: 1, train: 1, smallDrop: ["insight"], smallMax: 6, hypeBank: 3, hireDiscard: 0 }, ov);
const PERS = ["", "crunch", "hype", "systems", "clean"];
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1), med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
for (const n of counts) {
  const R = [];
  for (let gi = 0; gi < games; gi++) {
    const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "Bot " + (i + 1), bot: true });
    const S = E.newGame(seats, { seed: 7000 + n * 1000 + gi, config: cfg });
    S.players.forEach((p, i) => { const q = PERS[(i + gi) % PERS.length]; if (q) p.persona = q; if (skill) p.profile = skill; });
    let g = 0; while (!S.over && g++ < 80000) { if (!B.step(S).ok) break; }
    if (S.over) R.push(S);
  }
  const win = R.map(S => Math.max(...S.scores.map(s => s.total))), gap = R.map(S => { const t = S.scores.map(s => s.total).sort((a, b) => b - a); return t[0] - t[1]; });
  const gold = R.flatMap(S => S.players.map(p => p.gold)), bo = R.flatMap(S => S.players.map(p => p.burnout || 0));
  const pc = (a, f) => Math.round(a.filter(f).length / (a.length || 1) * 100) + "%";
  console.log(`${n}P  games ${R.length} | winner med ${med(win).toFixed(1)} [${Math.min(...win).toFixed(0)}-${Math.max(...win).toFixed(0)}] in 100-140 ${pc(win, v => v >= 100 && v <= 140)} | gap med ${med(gap).toFixed(1)} blowouts(25+) ${pc(gap, v => v >= 25)} | leftover Gold ${avg(gold).toFixed(1)} | end Burnout ${avg(bo).toFixed(1)}`);
}
