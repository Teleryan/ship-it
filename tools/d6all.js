// Table dynamics: seat/turn-order advantage, runaway leaders, dominant openings. usage: node tools/d6all.js <mode allmax|exp|opt> <players> <games> ['{cfg}'] [seedBase]
global.window = undefined;
const path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const PERS = ["", "crunch", "hype", "systems", "clean"];
const mode = process.argv[2], n = +process.argv[3], games = +process.argv[4], ov = JSON.parse(process.argv[5] || "{}"), sb = +process.argv[6] || 30000;
const seatWin = new Array(n).fill(0), lead = { 4: [0, 0], 7: [0, 0], 10: [0, 0] }, open = {}, openN = {}, desks1 = {}, firstPos = new Array(n).fill(0);
let G2 = 0, comebackFromLast = 0, lastN = 0, pairs = 0;
for (let gi = 0; gi < games; gi++) {
  const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "B" + i, bot: true });
  const S = E.newGame(seats, { seed: sb + n * 1000 + gi, config: Object.assign({}, D.config, ov) });
  S.players.forEach((p, i) => { if (mode === "allmax") { p.profile = "max"; } else { p.profile = "expert"; const q = PERS[(i + gi) % 5]; if (q) p.persona = q; } });
  const occ1 = {}, snap = {}; let lastR = 0, lastOcc = {}, g = 0;
  const rec = r => { for (const k in lastOcc) lastOcc[k].forEach(pi => { (occ1[pi] = occ1[pi] || {}); if (r <= 2) occ1[pi][k] = 1; }); };
  while (!S.over && g++ < 80000) {
    if (S.round !== lastR) { if (lastR >= 1) rec(lastR); if ([4, 7, 10].includes(S.round)) snap[S.round] = E.score(S).map(s => s.total); lastR = S.round; lastOcc = {}; }
    for (const k in S.occ) lastOcc[k] = S.occ[k].slice();
    if (!B.step(S).ok) break;
  }
  if (!S.over) continue; G2++;
  const t = S.scores.map(s => s.total), best = Math.max(...t), w = t.map((v, i) => v === best ? i : -1).filter(i => i >= 0);
  w.forEach(i => { seatWin[i] += 1 / w.length; });
  for (const r of [4, 7, 10]) { const sc = snap[r]; if (!sc) continue; const m = Math.max(...sc), ls = sc.map((v, i) => v === m ? i : -1).filter(i => i >= 0); if (ls.length === 1) { lead[r][1]++; if (w.includes(ls[0])) lead[r][0]++; } }
  if (snap[7]) { const sc = snap[7], mn = Math.min(...sc), li = sc.indexOf(mn); lastN++; if (t[li] === best) comebackFromLast++; }
  S.players.forEach((p, i) => { const win = t[i] === best ? 1 / w.length : 0; Object.keys(occ1[i] || {}).forEach(k => { open[k] = (open[k] || 0) + win; openN[k] = (openN[k] || 0) + 1; }); });
}
console.log(mode + " " + n + "P games " + G2 + " | win by seat index (start-of-game seat) " + seatWin.map(x => Math.round(x / G2 * 100) + "%").join("/") + " (fair " + Math.round(100 / n) + "%)");
console.log("leader wins: after R3 " + Math.round(lead[4][0] / lead[4][1] * 100) + "%, after R6 " + Math.round(lead[7][0] / lead[7][1] * 100) + "%, after R9 " + Math.round(lead[10][0] / lead[10][1] * 100) + "% (fair " + Math.round(100 / n) + "%) | last place after R6 wins " + Math.round(comebackFromLast / lastN * 100) + "%");
const rows = Object.keys(open).filter(k => openN[k] > G2 * n * 0.1).map(k => ({ k, uses: openN[k], win: open[k] / openN[k] })).sort((a, b) => b.win - a.win);
console.log("win rate of players who took tile in rounds 1-2 (tile: win%, n) fair " + Math.round(100 / n) + "%: " + rows.map(r => r.k + " " + Math.round(r.win * 100) + "% n" + r.uses).join(", "));
