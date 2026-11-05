// Deterministic golden regression: seeded bot games for 2-6 players, one line per game (rounds, final scores, hash of final player stats).
// usage: node tools/golden.js [gamesPerCount=8]      npm run golden  diffs the output against tests/golden.expected.txt
//        npm run golden:update  rewrites that file after an intended rules/bot change.
// Same seeds (7000+n*1000+gi), casual skill and persona rotation as tools/kpi.js. The log is not part of the hash.
global.window = undefined;
const path = require("path"), crypto = require("crypto"), G = path.join(__dirname, "..", "game");
const E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const games = +process.argv[2] || 8, PERS = ["", "crunch", "hype", "systems", "clean"];
for (const n of [2, 3, 4, 5, 6]) {
  for (let gi = 0; gi < games; gi++) {
    const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "Bot " + (i + 1), bot: true });
    const S = E.newGame(seats, { seed: 7000 + n * 1000 + gi });
    S.players.forEach((p, i) => { const q = PERS[(i + gi) % PERS.length]; if (q) p.persona = q; p.profile = "casual"; });
    let g = 0; while (!S.over && g++ < 80000) { if (!B.step(S).ok) break; }
    if (!S.over) { console.log(`${n}P game ${gi} NOT FINISHED round ${S.round} step ${S.step}`); continue; }
    const stats = S.players.map(p => [p.gold, p.prod, p.hype, p.mktg, p.debt, p.burnout || 0, p.workers.length, p.systems.length].join(","));
    const hash = crypto.createHash("sha1").update(stats.join(";")).digest("hex").slice(0, 10);
    console.log(`${n}P game ${gi} rounds ${S.round} scores ${S.scores.map(s => s.total).join("/")} hash ${hash}`);
  }
}
