// per-persona mean score parts in an all-Expert table. usage: node tools/d6pers.js <players> <games> ['{cfg}'] [seedBase]
global.window = undefined;
const path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const PERS = ["", "crunch", "hype", "systems", "clean"];
const n = +process.argv[2], games = +process.argv[3], ov = JSON.parse(process.argv[4] || "{}"), sb = +process.argv[5] || 30000;
const acc = {}, keys = ["prodShare", "hypeStrength", "debtPenalty", "burnout", "objectives", "synergy", "systems", "gold", "crisis", "gateVP", "total"];
for (let gi = 0; gi < games; gi++) {
  const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "B" + i, bot: true });
  const S = E.newGame(seats, { seed: sb + n * 1000 + gi, config: Object.assign({}, D.config, ov) });
  S.players.forEach((p, i) => { p.profile = "expert"; const q = PERS[(i + gi) % 5]; if (q) p.persona = q; });
  let g = 0; while (!S.over && g++ < 80000) { if (!B.step(S).ok) break; }
  if (!S.over) continue;
  const best = Math.max(...S.scores.map(s => s.total));
  S.players.forEach((p, i) => { const k = p.persona || "none", a = acc[k] = acc[k] || { n: 0, win: 0, wk: 0, sys: 0, prod: 0, hype: 0, debt: 0, gold: 0 }; a.n++; if (S.scores[i].total === best) a.win++; keys.forEach(x => a[x] = (a[x] || 0) + (S.scores[i].parts[x] || 0)); a.wk += p.workers.length; a.sys += p.systems.length; a.prod += p.prod; a.hype += p.hype + p.mktg; a.debt += p.debt; a.gold += p.gold; });
}
for (const k of Object.keys(acc)) { const a = acc[k]; console.log(k.padEnd(8) + " win " + Math.round(a.win / a.n * 100) + "% | " + keys.map(x => x.replace("Strength", "").replace("Share", "") + " " + (a[x] / a.n).toFixed(1)).join(" ") + " | workers " + (a.wk / a.n).toFixed(1) + " sys " + (a.sys / a.n).toFixed(1) + " prod " + (a.prod / a.n).toFixed(0) + " hype+wl " + (a.hype / a.n).toFixed(0) + " debt " + (a.debt / a.n).toFixed(1) + " gold " + (a.gold / a.n).toFixed(1)); }
