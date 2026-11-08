/* ============================================================
   SHIP IT!: BOT  (heuristic player used for solo play and balance sims)
   Pure logic; shares the engine's action format.
   ============================================================ */
(function (root) {
"use strict";
const E = root.ShipItEngine || require("./engine.js");
const B = {};
// strategy personas for balance testing (a player with no persona plays the neutral heuristic)
const NEUTRAL = { res: 1, crewCost: 3, prod: 1, mktg: 1, hype: 1, gold: 1, debt: 1, spotDebt: 0.3, buildBias: 0, cat: {}, workers: 0, bid: 1,
  // Bot knobs (tuned by self-play, see work/ctune.js)
  gate: 1, gateSurplus: 1.1, gatePace: 4, resVal: 1.5, recBase: 3.4, recReserve: 2, recMax: 0, srCap: 0.5, promoGold: 7, crunchGold: 16, crunchRound: 8, buildScale: 1, srVal: 1.2, convHold: 1, thr: 0.3 };
B.personas = {
  // Crunch Studio: Progress first, tolerates Tech Debt, big team
  crunch:  { prod: 1.5, mktg: 0.8, hype: 0.8, spotDebt: 0.6, cat: { Innovation: 1.5, Stability: 1 }, workers: 0, buildBias: 2 },
  // Hype Machine: Marketing and Hype first, Reach systems
  hype:    { prod: 0.7, mktg: 1.8, hype: 1.6, cat: { Reach: 2.5 } },
  // Systems Studio: builds early and often, Revenue engine, smaller team
  systems: { gold: 1.5, buildBias: 3, cat: { Innovation: 1, Reach: 1, Revenue: 3, Stability: 1 }, workers: -1 },
  // Clean Ship: low Debt, Stability systems, plays for a clean launch
  clean:   { debt: 1.8, spotDebt: 1.4, cat: { Stability: 2 }, gold: 1.1, resVal: 1.1, recMax: 1 }
};
/* Human-like profiles (separate from strategy personas). A player with no profile plays the standard bot.
   skill: how often the bot "slips" to a near-best option; noise: score jitter; quirk: per-game bias on what it likes;
   gate: how much it watches the publisher gate; deny: how much it takes a spot a rival wants; bidMode: contest-based bids;
   promoP: chance it remembers to promote; buildSkip: chance it passes on a build it could afford; commit: bonus for finishing a started system. */
B.profiles = {
  novice: { slip: 0.3, noise: 1.5, quirk: 0.4, gate: 0.25, deny: 0, bidMode: "random", promoP: 0.5, buildSkip: 0.3, commit: 0 },
  casual: { slip: 0.12, noise: 0.7, quirk: 0.25, gate: 0.7, deny: 0.5, bidMode: "contest", bidScale: 0.2, bidNoise: 0.5, promoP: 0.85, buildSkip: 0.08, commit: 0.8 },
  expert: { slip: 0, noise: 0.1, quirk: 0, gate: 1.2, deny: 1, bidMode: "contest", bidScale: 0.12, bidNoise: 0.1, promoP: 1, buildSkip: 0, commit: 0.3 }
};
// Optimizer: plays to win with every lever (no slips, no noise, buys desks up to the cap, builds whenever it can, trains early, contests rivals' tiles). Knobs found by random-search self-play against Expert bots (tools/btune.js) and checked on fresh seeds.
B.profiles.max = { slip: 0, noise: 0, quirk: 0, bidMode: "contest", bidScale: 0.12, bidNoise: 0, buildSkip: 0, gate: 1.3, deny: 1.4, commit: 0.6, deskReserve: 0, deskPenalty: 0.1, buildFloor: 1, trainGold: 3, promoP: 1, w: {"prod": 1.16, "mktg": 1.4, "hype": 1, "gold": 1, "debt": 1, "spotDebt": 0.3, "resVal": 1.5, "recBase": 3.4, "recReserve": 0, "recMax": 1, "srCap": 0.45, "promoGold": 7, "crunchGold": 15, "crunchRound": 9, "buildScale": 1, "buildBias": 0, "srVal": 0.96, "thr": 0.3, "gateSurplus": 0.97, "gatePace": 4.19, "workers": 0, "convHold": 1, "crewCost": 3} };
// Labels shown in the menu and lobby, easiest first. The ids ("", novice, casual, expert, max) are what the engine and saved configs use.
B.profileNames = [["novice", "Easy"], ["casual", "Medium"], ["", "Standard"], ["expert", "Hard"], ["max", "Hardest"]];
B.profileInfo = { novice: "Makes mistakes, often forgets to promote and mostly ignores publisher gates. A friendly first opponent.", casual: "Plays like a casual person: the odd slip, watches the gates, rarely forgets to promote.", "": "Steady and complete: no slips, plays the full strategy. The default.", expert: "No slips, watches the gates closely and takes tiles you want.", max: "The Optimizer: uses every lever (desks, training, builds) and contests your tiles. Expect to lose some." };
let PF = null;
const quirk = (S, p) => { if (!p.qk) p.qk = [E.rnd(S), E.rnd(S), E.rnd(S), E.rnd(S), E.rnd(S)]; return p.qk; };
let W = NEUTRAL;
// Progress and Hype are worth more while the phase's publisher gate is out of reach, less once it is safe
let GF = { prod: 1, hype: 1 };
function gateFactors(S, p) { // gate pressure, then the press-buzz (Hype leader) incentive
  gateFactors0(S, p);
  if (S.cfg.hypeBank && S.phase < 3) GF.hype *= 1 + Math.min(0.8, S.cfg.hypeBank * 0.12);
  if (S.cfg.hypeLeadVP && S.phase < 3) {
    const end = (S.cfg.phaseEnds || [])[S.phase] || S.round, rl = Math.max(1, end - S.round + 1);
    const rival = Math.max.apply(null, S.players.filter(q => q.id !== p.id).map(q => q.hype).concat([0])), gap = rival - p.hype;
    if (gap <= 4 + 2 * rl) GF.hype *= 1 + S.cfg.hypeLeadVP * 0.12;
  }
}
function gateFactors0(S, p) {
  GF = { prod: 1, hype: 1 };
  if (!S.gateSet) return;
  const g = S.gateSet.find(x => x.phase === S.phase); if (!g) return;
  const end = (S.cfg.phaseEnds || [])[S.phase] || S.round, rl = Math.max(1, end - S.round + 1);
  g.reqs.forEach(r => { const m = /^(\d+)\+ (Progress|Hype)/.exec(r); if (!m) return; const k = m[2] === "Progress" ? "prod" : "hype", def = +m[1] - (k === "prod" ? p.prod : p.hype);
    GF[k] = def <= 0 ? W.gateSurplus : 1 + W.gate * Math.min(1.3, def / (rl * W.gatePace)); });
}
const val = (fx) => {
  // rough value of an effect object
  const s = fx.stats || {}; return (s.prod || 0) * 1.3 * W.prod * GF.prod + (s.mktg || 0) * 1.1 * W.mktg + (s.hype || 0) * 0.9 * W.hype * GF.hype + (s.culture || 0) * 0.6 - (s.debt || 0) * 0.5 * W.debt + (fx.gold || 0) * 0.8 * W.gold + (fx.draws ? fx.draws.mile * 0.8 : 0);
};
B.cfg = { skill: 1 };

B.decide = function (S) {
  const pi = E.currentActor(S); if (pi < 0) return null;
  const p = S.players[pi]; const d = S.dq[0];
  W = Object.assign({}, NEUTRAL, S.cfg.botW || {}, ((S.cfg.botPersonas && Object.assign({}, B.personas, S.cfg.botPersonas) || B.personas)[p.persona]) || {}); PF = ((S.cfg.botProfiles && Object.assign({}, B.profiles, S.cfg.botProfiles) || B.profiles)[p.profile]) || null;
  if (PF && PF.w) W = Object.assign(W, PF.w);
  if (PF) { const q = quirk(S, p), k = PF.quirk; W.prod *= 1 + (q[0] - 0.5) * 2 * k; W.mktg *= 1 + (q[1] - 0.5) * 2 * k; W.hype *= 1 + (q[2] - 0.5) * 2 * k; W.gold *= 1 + (q[3] - 0.5) * 2 * k; W.debt *= 1 + (q[4] - 0.5) * 2 * k; W.gate *= PF.gate; }
  gateFactors(S, p);
  if (d) return decision(S, p, d);
  switch (S.step) {
    case "place": return place(S, p);
    case "rest": { const b = build(S, p); if (b.type === "build") return b; const m = mile(S, p); if (m.type === "claim") return m; return rest(S, p); }
  }
  return null;
};

function decision(S, p, d) {
  const rint = n => E.rint(S, n);
  switch (d.t) {
    case "keepObj": {
      const picks = {}; Object.keys(d.opts).forEach(t => { // prefer lowest requirements = highest vp-per-req
        const sc = id => { const o = S.data.objectives[id]; return o.vp - o.reqs.length * 1.5; };
        picks[t] = d.opts[t].slice().sort((a, b) => sc(b) - sc(a))[0];
      });
      return { type: "keepObj", p: p.id, picks };
    }
    case "bid": { // crisis auctions
      const room = Math.max(0, p.gold - 4);
      const amt = Math.min(p.gold, Math.min(room, 1 + rint(4)));
      return { type: "bid", p: p.id, amount: Math.max(0, Math.min(p.gold, amt)) };
    }
    case "choose": {
      const ok = d.options.filter(o => !o.disabled);
      let pick = ok[0];
      if (d.card === "creep") pick = ok.find(o => o.k === (p.debt > 8 ? "C" : "B")) || ok[0];
      if (d.card === "platform") pick = ok.find(o => o.k === "C") || ok[0];
      if (d.card === "bug") pick = ok.find(o => o.k === "B") || ok[0];
      if (d.card === "buyout") pick = ok.find(o => o.k === (p.objectives.length <= 2 ? "accept" : "decline")) || ok[0];
      return { type: "choose", p: p.id, k: pick.k };
    }
    case "pickWorker": {
      const ws = p.workers.filter(w => !d.srOnly || w.lvl === "Sr").sort((a, b) => b.fat - a.fat || (a.lvl === "Jr" ? -1 : 1));
      return { type: "pickWorker", p: p.id, worker: ws[0].id };
    }
    case "raidHire": {
      const cost = Math.floor(S.cfg.jrCost / 2);
      if (p.gold > cost + 3 && p.workers.length < 8) {
        const want = S.pool.length ? S.pool[0] : { disc: "ENG", lvl: "Jr" };
        const lvl = want.lvl === "Sr" && !E.srAllowed(S) ? "Jr" : want.lvl;
        if (p.gold >= Math.floor((lvl === "Jr" ? S.cfg.jrCost : S.cfg.srCost) / 2)) return { type: "raid", p: p.id, disc: want.disc, lvl };
      }
      return { type: "skip", p: p.id };
    }
    case "pivot": return { type: "pivot", p: p.id, replace: false };
    case "dropObj": return { type: "dropObj", p: p.id, obj: p.objectives.slice().sort((a, b) => S.data.objectives[a].vp - S.data.objectives[b].vp)[0] };
    case "keepMile": return { type: "keepMile", p: p.id, keep: d.opts.slice().sort((a, b) => S.data.milestones[b].gold - S.data.milestones[a].gold).slice(0, d.keep) };
    case "swapObjPick": return { type: "swapObjPick", p: p.id, pick: d.old };
    case "patch": {
      const fixes = S.data.crisis.find(c => c.id === "patch").params.fixes;
      for (let i = fixes.length - 1; i >= 0; i--) if (E.resTotal(p) >= fixes[i][0] && p.debt >= fixes[i][1]) return { type: "patchFix", p: p.id, idx: i };
      return { type: "patchDone", p: p.id };
    }
  }
  return null;
}

function bestPlan(S, p, plans) {
  const worth = pl => pl.ids.reduce((t, id) => { const x = p.workers.find(y => y.id === id); return t + (x.lvl === "Sr" ? 2 : 0) + x.fat; }, 0);
  return plans.slice().sort((a, b) => worth(a) - worth(b))[0];
}
function fxScore(S, p, w, o) {
  if (!o.ok) return -1e9;
  if (o.kind === "sys") {
    const d = o.def; const fx = E.parseEffect(d.fx || d.each); let v = val(fx) + 1;
    if (fx.per) v += 3; if (fx.stats && fx.stats.debt < 0 && p.debt < 3) v -= 3; return v;
  }
  const spot = o.spot; const fx = E.parseEffect(spot.fx); let v;
  if (fx.choice) v = Math.max(val(fx.choice[0]), val(fx.choice[1])); else v = val(fx);
  const rmul = spot.r || 0, resVal = W.resVal;
  const mom = (w.fat >= 2 ? S.cfg.resOver : (w.lvl === "Sr" ? S.cfg.resSr : S.cfg.resJr)) * rmul; v += mom * W.res * resVal + (w.lvl === "Sr" ? W.srVal : 0);
  v -= (spot.debt || 0) * W.spotDebt; if (w.fat >= 1) v -= 0.8; if (w.fat >= 2) v -= 2.5 + (1.2 + (p.burnout || 0) * 0.9);
  if (fx.stats && fx.stats.debt < 0) { v += p.debt > 3 ? 2 + Math.min(-fx.stats.debt * 1.5, p.debt) : -4; }
  if (spot.special === "talent") v = 2.2; if (spot.special === "team") v = p.culture < 0 ? 4 : 0.5; if (spot.special === "outsource") v = (w.lvl === "Sr" ? 5 : 3) * 0.9 - (p.gold < 4 ? -2 : 0);
  if (spot.special === "rd") v = E.resTotal(p) >= 3 ? 2.4 + W.crewCost : 0.1 + W.crewCost; if (spot.special === "workshop") v = E.resTotal(p) >= 8 ? v + 1 : 0.2; if (spot.special === "mentor") v = 4; if (spot.id === "insight") v = 1.8;
  if (spot.special === "convert") v = convGain(S, p, o) * 1.15 * W.convHold;
  if (spot.special === "rd") v = (p.rdBuild || E.resTotal(p) >= 6) ? 2.6 + W.crewCost : 0.2 + W.crewCost;
  if (o.plans) { const pl = bestPlan(S, p, o.plans); v += pl.ids.reduce((t, id) => t + (!spot.r ? 0 : Math.min(p.workers.find(x => x.id === id).lvl === "Sr" ? S.cfg.resSr : S.cfg.resJr, S.cfg.crewPartnerCap == null ? 9 : S.cfg.crewPartnerCap)) * resVal * W.res, 0) - pl.ids.length * W.crewCost; }
  if (spot.id === "crunch") v -= 1; return v + E.rnd(S) * 0.5;
}
// how much the best rival would value a spot that is still free: taking it away is worth part of that
function rivalWant(S, p, target) {
  let m = 0; const me = p.id;
  S.players.forEach(q => { if (q.id === me) return; q.workers.forEach(w => { if (w.placed || w.building) return; const o = E.placementOptions(S, q.id, w).find(x => x.target === target); if (o && o.ok !== false) { const sc = fxScore(S, q, w, o); if (sc > m) m = sc; } }); });
  return Math.max(0, m - 1);
}
function convGain(S, p, o) { const rk = E.RES_OF[E.CAT_OF(o.as[0])], rate = S.cfg.convertRate || 3; return Math.floor((p[rk] || 0) / rate); }
function recruitPick(S, p, bs) {
  if (!S.recruit) return null;
  const maxW = (S.phase === 0 ? 5 : S.phase === 1 ? 8 : 9) + W.workers + W.recMax, reserve = (S.phase >= 2 ? 3 : 2) + W.recReserve - 2;
  if (p.workers.length >= maxW) return null;
  const have = {}; p.workers.forEach(w => have[w.disc] = (have[w.disc] || 0) + 1);
  let pick = null, ps = -1e9;
  S.recruit.forEach((o, i) => {
    const c = E.canRecruit(S, p.id, i); if (!c.ok || p.gold - c.cost < reserve) return;
    let sc = W.recBase - (have[o.disc] || 0) * 1.2 + E.rnd(S) * 0.6; if (o.disc === "PM" || o.disc === "PROD") sc -= 1; if (["ENG", "DES", "ART", "ADV", "PX"].includes(o.disc)) sc += 0.6;
    sc -= Math.max(0, p.workers.length - 3) * 0.5; sc -= (S.phase >= 2 ? 1.5 : 0); if (sc > ps) { ps = sc; pick = i; }
  });
  return pick != null && ps > Math.min(bs, 4.2) - 0.8 ? { type: "recruit", p: p.id, idx: pick } : null;
}
// Train is a free action on your turn. A bot that has nothing worth placing uses a spare Junior (instead of passing) so the training does not cost a later round.
function trainInPlace(S, p) {
  if (typeof process !== "undefined" && process.env && process.env.BOT_NO_TRAIN_PLACE) return null;
  const c = S.cfg, srN = p.workers.filter(w => w.lvl === "Sr").length, cap = 1 + Math.floor(p.workers.length * W.srCap);
  const tr = p.workers.find(w => w.lvl === "Jr" && E.canTrain(S, p.id, w).ok && (w.trained || 0) < c.trainNeeded);
  if (tr && srN < cap && S.round < 11 && S.phase < 3 && p.gold >= (PF && PF.trainGold != null ? PF.trainGold : W.promoGold - 2) && p.workers.length >= 4 && (!PF || E.rnd(S) < PF.promoP)) return { type: "train", p: p.id, worker: tr.id };
  return null;
}
function place(S, p) {
  let best = null, bs = W.thr; const cands = [];
  const wsc = S.cfg.wsMax ? E.canBuyWs(S, p.id) : { ok: false };
  p.workers.forEach(w => E.placementOptions(S, p.id, w).forEach(o => { const buyable = o.wsNeed && wsc.ok && p.gold - wsc.cost >= (PF && PF.deskReserve != null ? PF.deskReserve : 2); let s = fxScore(S, p, w, buyable ? Object.assign({}, o, { ok: true }) : o); if (buyable) s -= wsc.cost * (PF && PF.deskPenalty != null ? PF.deskPenalty : 0.3); if (PF) { s += (E.rnd(S) - 0.5) * 2 * PF.noise; cands.push({ w, o, s }); } if (s > bs) { bs = s; best = { w, o }; } }));
  if (PF && cands.length) {
    cands.sort((a, b) => b.s - a.s);
    if (PF.deny) cands.slice(0, 6).forEach(c => { if (c.o.spot && (c.o.spot.mode || "single") === "single") c.s += PF.deny * 0.5 * rivalWant(S, p, c.o.target); });
    cands.sort((a, b) => b.s - a.s);
    let pick = cands[0]; if (PF.slip && E.rnd(S) < PF.slip) pick = cands[Math.min(cands.length - 1, E.rint(S, 3))];
    if (pick.s > W.thr) { best = { w: pick.w, o: pick.o }; bs = pick.s; } else { best = null; bs = 0; }
  }
  const rc = recruitPick(S, p, best ? bs : 0); if (rc) return rc;
  if (!best) { const tp = trainInPlace(S, p); if (tp) return tp; return { type: "pass", p: p.id }; }
  if (best.o.wsNeed) return { type: "buyws", p: p.id };
  const a = { type: "place", p: p.id, worker: best.w.id, target: best.o.target };
  if (best.w.lvl === "Sr") a.bonus = p.mktg < p.prod * 0.8 ? "mktg" : "prod";
  if (best.o.as) a.as = best.o.as[0];
  if (best.o.spot && best.o.spot.special === "convert") a.conv = p.hype < p.prod * 0.6 ? "hype" : "prod";
  if (best.o.plans) a.crew = bestPlan(S, p, best.o.plans).ids;
  if (best.o.spot && best.o.spot.special === "mentor") { const jr = p.workers.find(x => x.lvl === "Jr" && x.disc === best.w.disc); if (jr) a.jr = jr.id; }
  if (best.o.spot && E.parseEffect(best.o.spot.fx).choice) a.choice = p.mktg < p.prod ? 1 : 0;
  if (best.o.as && best.o.as[0] === "ENG" && p.debt > 6 && E.parseEffect(best.o.spot ? best.o.spot.fx : "").stats.prod > 0) a.alt = "fixdebt";
  return a;
}

function buildScore(S, p, d) {
  const b = E.parseBuild(d.build); const fx = E.parseEffect(d.fx || d.each || ""); let v = val(fx) + d.vp * 0.4 + d.syn * 0.8 - d.debt * 1.8 * W.debt - b.cost * (b.cur === "G" ? 0.35 : 0.25) - E.buildGold(S, d, p) * 0.3;
  if (d.pas) v += 3.5; if (d.inc) v += d.inc * Math.max(0, 12 - S.round - E.buildDelay(S, p, null, d)) * 0.8; if (d.cat === "Stability") v += p.debt > 3 ? 2 : -1; if (d.cat === "Revenue") v += 0.5; v += W.buildBias + (W.cat[d.cat] || 0);
  // synergy with held objectives
  p.objectives.forEach(id => { const o = S.data.objectives[id]; if (o.res && E.sysMainRes(d) === o.res) v += 1.5; });
  return v + E.rnd(S);
}
// normal builds finish two rounds later; rush when the clock is short (or the Gold is plentiful)
function bcrunch(S, p, d, free) {
  if (p.rd && S.cfg.rdCrunch) return undefined;
  const need = S.round + (S.cfg.buildDelay || 2) > 12, late = S.round >= W.crunchRound, rich = p.gold >= W.crunchGold;
  if (!(need || late || rich)) return undefined;
  const cg = S.cfg.crunchGold == null ? 2 : S.cfg.crunchGold, bg = free ? 0 : E.buildGold(S, d, p);
  if (p.gold - bg - cg >= 3) return "gold";
  const w = E.crunchWorker(p); if (w && (need || w.fat === 0)) return "fat";
  return undefined;
}
function build(S, p) {
  const free = p.freeBuilds > 0;
  let best = null, bs = 0;
  S.data.systems.forEach(d => {
    const ck = E.canBuild(S, p.id, d.name, free, bcrunch(S, p, d, free)); if (!ck.ok) return;
    const b = E.parseBuild(d.build);
    const fl = PF && PF.buildFloor != null ? PF.buildFloor : 3; if (b.cur === "G" && p.gold - b.cost < fl) return;
    const bgd = free ? 0 : E.buildGold(S, d, p); if (bgd && p.gold - bgd < Math.min(2, fl)) return;
    let s = buildScore(S, p, d) * W.buildScale; if (PF && PF.commit && (p.systems.length + (p.building || []).length) > 0) s += PF.commit * Math.min(3, p.systems.length + (p.building || []).length); if (s > bs) { bs = s; best = d; }
  });
  if (best && PF && PF.buildSkip && E.rnd(S) < PF.buildSkip) best = null;
  if (best) return { type: "build", p: p.id, name: best.name, free, crunch: bcrunch(S, p, best, free) };
  return { type: "done", p: p.id };
}

function rest(S, p) {
  const c = S.cfg; const cost = E.promoGold(S);
  const srN = p.workers.filter(w => w.lvl === "Sr").length, cap = 1 + Math.floor(p.workers.length * W.srCap);
  const rdy = p.workers.find(w => w.lvl === "Jr" && !E.trainPromoWhy(S, w));
  if (rdy && p.gold >= cost && p.promos < c.promotionsPerRest && srN < cap && E.srAllowed(S) && S.phase < 3 && (!PF || E.rnd(S) < PF.promoP)) return { type: "promote", p: p.id, worker: rdy.id };
  const tr = p.workers.find(w => w.lvl === "Jr" && !w.placed && !w.build && !w.training && (w.trained || 0) < c.trainNeeded);
  if (tr && (p.rs.trains || 0) < Math.min(c.trainsPerRest, 1) && srN < cap && S.round < 11 && S.phase < 3 && p.gold >= W.promoGold - 2 && p.workers.length >= 4 && (!PF || E.rnd(S) < PF.promoP)) return { type: "train", p: p.id, worker: tr.id };
  return { type: "done", p: p.id };
}

function mile(S, p) {
  const m = p.miles.find(id => E.milestoneMet(S, p.id, id));
  if (m != null) return { type: "claim", p: p.id, mile: m };
  return { type: "done", p: p.id };
}

// Tension probe for tools/tension.js: values every placement ignoring rivals' occupancy vs what is actually open
B.probe = function(S,pi){ const p=S.players[pi]; W = Object.assign({}, NEUTRAL, S.cfg.botW || {}, ((S.cfg.botPersonas && Object.assign({}, B.personas, S.cfg.botPersonas) || B.personas)[p.persona]) || {}); PF = ((S.cfg.botProfiles && Object.assign({}, B.profiles, S.cfg.botProfiles) || B.profiles)[p.profile]) || null; gateFactors(S,p); const orig=E.rnd; E.rnd=()=>0.5; const out=[]; try{ const occ=S.occ; const real={}; p.workers.forEach(w=>{ E.placementOptions(S,pi,w).forEach(o=>{ if(o.ok) real[w.id+'|'+o.target]=1; }); }); const sp=E.activeSpots(S); const occ2={}; Object.keys(occ).forEach(k=>{ const sd=sp.find(s=>s.id===k); if(!sd || (sd.mode||'single')!=='single' || occ[k].includes(pi) || occ[k].includes(-1)) occ2[k]=occ[k]; }); S.occ=occ2; try{ p.workers.forEach(w=>{ E.placementOptions(S,pi,w).forEach(o=>{ if(o.ok){ out.push({w:w.id,lvl:w.lvl,fat:w.fat,target:o.target,spot:o.spot&&o.spot.id,s:fxScore(S,p,w,o),avail:!!real[w.id+'|'+o.target]}); } }); }); } finally { S.occ=occ; } } finally { E.rnd=orig; } return out; };
B.step = function (S) { const a = B.decide(S); if (!a) return { ok: false, error: "no action" }; const r = E.act(S, a); if (!r.ok) r.action = a; return r; };
B.isBotTurn = function (S) { const pi = E.currentActor(S); return pi >= 0 && S.players[pi].bot; };
// run bots until a human must act (or the game ends). Returns number of steps.
B.run = function (S, max) {
  let n = 0; max = max || 5000;
  while (n++ < max && !S.over && B.isBotTurn(S)) { const r = B.step(S); if (!r.ok) { return { stuck: true, err: r.error, action: r.action, step: S.step, n }; } }
  return { n };
};
root.ShipItBot = B;
if (typeof module !== "undefined") module.exports = B;
})(typeof window !== "undefined" ? window : globalThis);
