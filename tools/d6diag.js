// What makes blowouts? usage: node tools/d6diag.js <players> <games> ['{cfg}'] [mode=exp]
global.window = undefined;
const path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const PERS = ["", "crunch", "hype", "systems", "clean"];
const n = +process.argv[2], games = +process.argv[3], ov = JSON.parse(process.argv[4] || "{}");
const rows = [];
for (let gi = 0; gi < games; gi++) {
  const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "B" + i, bot: true });
  const S = E.newGame(seats, { seed: 30000 + n * 1000 + gi, config: Object.assign({}, D.config, ov) });
  S.players.forEach((p, i) => { p.profile = "expert"; const q = PERS[(i + gi) % 5]; if (q) p.persona = q; });
  let g = 0, mid = null; while (!S.over && g++ < 80000) { if (S.round === 7 && !mid) mid = S.players.map(p => ({ prod: p.prod, hype: p.hype, vpAdj: p.vpAdj, gold: p.gold, ws: p.workers.length, sys: p.systems.length })); if (!B.step(S).ok) break; }
  if (!S.over) continue;
  const o = S.scores.map((s, i) => ({ i, t: s.total, p: s.parts })).sort((a, b) => b.t - a.t);
  rows.push({ gap: o[0].t - o[o.length - 1].t, w: o[0], l: o[o.length - 1], mid, wi: o[0].i, li: o[o.length - 1].i });
}
const keys = ["prodShare", "hypeStrength", "debtPenalty", "burnout", "objectives", "synergy", "systems", "gold", "crisis", "total"];
const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
for (const [name, f] of [["all", () => true], ["gap>=25", r => r.gap >= 25], ["gap<25", r => r.gap < 25]]) {
  const rs = rows.filter(f); if (!rs.length) continue;
  console.log(name + " (" + rs.length + ") mean gap " + avg(rs.map(r => r.gap)).toFixed(1) + " | winner-minus-loser by part: " + keys.map(k => k + " " + avg(rs.map(r => (r.w.p[k] || 0) - (r.l.p[k] || 0))).toFixed(1)).join(", "));
}
const bl = rows.filter(r => r.gap >= 25 && r.mid);
console.log("blowouts: final winner led at R7 in prod/hype/sys:", ["prod", "hype", "sys"].map(k => Math.round(bl.filter(r => r.mid[r.wi][k] > r.mid[r.li][k]).length / bl.length * 100) + "%").join(" "), "| winner R7 vpAdj-gate minus loser:", avg(bl.map(r => r.mid[r.wi].vpAdj - r.mid[r.li].vpAdj)).toFixed(1));
const lo = rows.filter(r => r.w.t < 33).length / rows.length, hi = rows.filter(r => r.w.t > 63).length / rows.length;
console.log("winner<33 " + Math.round(lo * 100) + "% winner>63 " + Math.round(hi * 100) + "%");
// variance decomposition of the signed gap between seat 0 and seat 1 (share of var(gap) explained by each part: cov(partDiff, totalDiff)/var(totalDiff))
{
  const sg = [];
  for (let gi = 0; gi < Math.min(games, 400); gi++) {
    const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "B" + i, bot: true });
    const S = E.newGame(seats, { seed: 30000 + n * 1000 + gi, config: Object.assign({}, D.config, ov) });
    S.players.forEach((p, i) => { p.profile = "expert"; const q = PERS[(i + gi) % 5]; if (q) p.persona = q; });
    let g = 0; while (!S.over && g++ < 80000) { if (!B.step(S).ok) break; }
    if (!S.over) continue; sg.push(S.scores[0].parts.total - S.scores[1].parts.total + 0); sg[sg.length - 1] = { t: S.scores[0].parts.total - S.scores[1].parts.total, d: keys.reduce((o, k) => (o[k] = (S.scores[0].parts[k] || 0) - (S.scores[1].parts[k] || 0), o), {}) };
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length, tm = mean(sg.map(r => r.t)), vt = mean(sg.map(r => (r.t - tm) ** 2));
  console.log("var decomposition of seat0-seat1 gap (sd " + Math.sqrt(vt).toFixed(1) + "): " + keys.filter(k => k !== "total").map(k => { const m = mean(sg.map(r => r.d[k])); return k + " " + Math.round(mean(sg.map(r => (r.d[k] - m) * (r.t - tm))) / vt * 100) + "%"; }).join(", "));
}
