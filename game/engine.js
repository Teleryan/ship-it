/* ============================================================
   SHIP IT!: RULES ENGINE  (no DOM, no browser APIs)
   State is plain JSON. All mutation goes through Engine.act(S, action).
   Runs unchanged in the browser, Node (tests / bot sims) or a Cloudflare Worker.
   ============================================================ */
(function (root) {
"use strict";
const D0 = root.SHIPIT_DATA || (typeof require !== "undefined" ? require("./data.js") : null);
const E = {};
const dn = d => ((D0 && D0.disciplines && D0.disciplines[d]) || {}).name || d;
const DISCS = ["ENG","ART","DES","QA","PX","DATA","ADV","PM","PROD"];
const CATS = ["Innovation","Stability","Reach","Revenue"];
let PHASE_ENDS = [2, 8, 11, 12];
const PHASE_OF_ROUND = r => r <= PHASE_ENDS[0] ? 0 : r <= PHASE_ENDS[1] ? 1 : r <= PHASE_ENDS[2] ? 2 : 3;
E.useCfg = function (cfg) {
  E.sysCostMult = cfg.sysCostMult || 1; PHASE_ENDS = (cfg.phaseEnds && cfg.phaseEnds.length === 4) ? cfg.phaseEnds : [2, 8, 11, 12];
  if (D0 && D0.phases) D0.phases.forEach((ph, i) => { ph.rounds = [i ? PHASE_ENDS[i - 1] + 1 : 1, PHASE_ENDS[i]]; });
};
const DISC_ALIAS = {Eng:"ENG",Art:"ART",Des:"DES",QA:"QA",PX:"PX",DATA:"DATA",Adv:"ADV"};
const clone = o => JSON.parse(JSON.stringify(o));
E.clone = clone;

/* ---------- RNG (seeded, state kept inside S so games are reproducible) ---------- */
function rnd(S) { // mulberry32
  let t = (S.seed = (S.seed + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rint(S, n) { return Math.floor(rnd(S) * n); }
function shuffle(S, a) { for (let i = a.length - 1; i > 0; i--) { const j = rint(S, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function log(S, m) { S.log.push({ r: S.round, m }); if (S.log.length > 600) S.log.shift(); }

/* ---------- Effect strings ---------- */
const RES = ["ideas", "code", "process", "buzz"];
const RES_OF = { Creative: "ideas", Development: "code", Operations: "process", Marketing: "buzz" };
const RES_NAME = { ideas: "Ideas", code: "Code", process: "Process", buzz: "Buzz" };
const CAT_OF = d => D0.disciplines[d].cat;
const STAT_KEY = { ideas:"ideas", code:"code", process:"process", buzz:"buzz", progress:"prod", marketing:"mktg", prod:"prod", mktg:"mktg", hype:"hype", culture:"culture", cult:"culture", debt:"debt" };
E.parseEffect = function (str) {
  const fx = { stats:{}, gold:0, draws:{ mile:0 }, keepMile:0, choice:null, per:null, notes:[] };
  if (!str) return fx;
  if (/\bOR\b/.test(str)) {
    fx.choice = str.split(/\s+OR\s+/).map(s => E.parseEffect(s.trim()));
    return fx;
  }
  str.split(",").map(s => s.trim()).filter(Boolean).forEach(tok => {
    let m;
    if ((m = tok.match(/^([+-]\d+)\s*(Progress|Prod|Marketing|Mktg|Hype|Culture|Cult|Debt|Ideas|Code|Process|Buzz)$/i))) {
      const k = STAT_KEY[m[2].toLowerCase()]; fx.stats[k] = (fx.stats[k] || 0) + parseInt(m[1], 10);
    } else if ((m = tok.match(/^([+-]\d+)G\s+per\s+(\w+)(?:\s*\(max\s*(\d+)G\))?$/i))) {
      fx.per = { gold: parseInt(m[1], 10), of: m[2], max: m[3] ? parseInt(m[3], 10) : 99 };
    } else if ((m = tok.match(/^([+-]\d+)G$/i))) {
      fx.gold += parseInt(m[1], 10);
    } else if ((m = tok.match(/^Draw\s+(\d+)\s+Mile/i))) {
      fx.draws.mile += parseInt(m[1], 10);
    } else if ((m = tok.match(/^Draw\s+(\d+)\s+Keep\s+(\d+)/i))) {
      fx.keepMile = parseInt(m[2], 10); fx.keepFrom = parseInt(m[1], 10);
    } else if (/^Mile$/i.test(tok)) { fx.draws.mile += 1; }
    else fx.notes.push(tok);
  });
  return fx;
};
E.describeEffect = function (str) { return str || ""; };

/* ---------- Config / data ---------- */
const LOOK0 = D0 ? clone({ disciplines: D0.disciplines, phases: D0.phases.map(p => ({ id: p.id, name: p.name, color: p.color })), categories: D0.categories, symbols: D0.symbols }) : null;
const lookRows = () => ({
  roles: Object.keys(LOOK0.disciplines).map(k => { const d = LOOK0.disciplines[k]; return { id: k, name: d.name || "", cat: d.cat || "", short: d.short || "", alt: d.alt || "", util: d.util || "", altUtil: d.altUtil || "", wild: (d.wild || []).slice() }; }),
  phases: LOOK0.phases.map(p => ({ id: p.id, name: p.name, color: p.color })),
  teams: Object.keys(LOOK0.categories).map(k => ({ id: k, color: LOOK0.categories[k].color })),
  symbols: Object.keys(LOOK0.symbols).map(k => ({ id: k, glyph: LOOK0.symbols[k].glyph, color: LOOK0.symbols[k].color, meaning: LOOK0.symbols[k].meaning }))
});
// writes the Studio's role, phase and team rows onto the shared data object (edited in place so the screens that hold references see it)
let LOOK_SIG = "";
E.applyLook = function (data) {
  if (!D0 || !LOOK0) return; const sig = JSON.stringify([data && data.roles, data && data.phases, data && data.teams, data && data.symbols]); if (sig === LOOK_SIG) return; LOOK_SIG = sig;
  const base = lookRows(), roles = (data && data.roles) || base.roles, phs = (data && data.phases) || base.phases, teams = (data && data.teams) || base.teams;
  roles.forEach(r => { const d = D0.disciplines[r.id], b = LOOK0.disciplines[r.id]; if (!d) return;
    ["name", "cat", "short", "alt", "util", "altUtil"].forEach(f => { const v = r[f]; if (v) d[f] = v; else if (f === "alt" || f === "altUtil") delete d[f]; else d[f] = b[f]; });
    const w = (r.wild || []).filter(x => D0.disciplines[x] && x !== r.id); if (w.length) d.wild = w; else delete d.wild; });
  Object.keys(D0.categories).forEach(c => { const cur = Object.keys(D0.disciplines).filter(k => D0.disciplines[k].cat === c), orig = LOOK0.categories[c].discs; D0.categories[c].discs = (cur.length === orig.length && cur.every(k => orig.includes(k))) ? orig.slice() : cur; });
  ((data && data.symbols) || base.symbols).forEach(y => { const t = D0.symbols[y.id]; if (t) { if (y.glyph) t.glyph = y.glyph; if (y.color) t.color = y.color; if (y.meaning) t.meaning = y.meaning; } });
  teams.forEach(t => { if (D0.categories[t.id] && t.color) D0.categories[t.id].color = t.color; });
  phs.forEach(p => { const ph = D0.phases[p.id]; if (ph) { if (p.name) ph.name = p.name; if (p.color) ph.color = p.color; } });
};
E.defaultData = function (cfg) {
  return clone(Object.assign(lookRows(), { spots:D0.spots, systems:D0.systems, milestones:D0.milestones, objectives:D0.objectives, crisis:D0.crisis, publisherGates:D0.publisherGates, gatePool:D0.gatePool, tutorial:D0.tutorial, text:D0.textRows ? D0.textRows() : [] }));
};
E.rawConfig = function () { return clone(D0.config); };
E.defaultConfig = function () { return clone(D0.config); };

/* ---------- New game ---------- */
E.newGame = function (seats, opts) {
  opts = opts || {};
  const cfg = Object.assign(E.rawConfig(), opts.config || {});
  const data = Object.assign(E.defaultData(cfg), opts.data || {});
  const N0 = seats.length;
  if (cfg.spotFxAdj) data.spots.forEach(sp => { if (cfg.spotFxAdj[sp.id] != null) sp.fx = cfg.spotFxAdj[sp.id]; });
  if (cfg.bigAdd && cfg.bigAdd[N0]) cfg.bigAdd[N0].forEach(id => { const sp = data.spots.find(x => x.id === id); if (sp) data.spots.push(Object.assign({}, sp, { id: id + "_b" })); });
  { const o = data.spots.find(x => x.id === "outsource"); if (o) { const jr = cfg.outsourceJrByN && cfg.outsourceJrByN[N0] != null ? cfg.outsourceJrByN[N0] : (cfg.outsourceJr == null ? 3 : cfg.outsourceJr), sr = cfg.outsourceSrByN && cfg.outsourceSrByN[N0] != null ? cfg.outsourceSrByN[N0] : (cfg.outsourceSr == null ? 5 : cfg.outsourceSr); if (jr != null && sr != null) o.note = "Jr +" + jr + "G / Sr +" + sr + "G"; } }
  if (cfg.launchCap) ["party", "press", "platform"].forEach(id => { const sp = data.spots.find(x => x.id === id); if (!sp) return; sp.mode = "single"; for (let k = 1; k < Math.ceil(N0 / 2); k++) data.spots.push(Object.assign({}, sp, { id: id + "_c" + k })); });
  E.useCfg(cfg); E.applyLook(data);
  if (D0.cScaleGates) D0.cScaleGates(data, cfg, seats.length);
  const S = {
    v: 1, seed: (opts.seed != null ? opts.seed : (Math.random() * 2 ** 31) | 0), cfg, data,
    round: 1, phase: 0, step: "setup", cur: 0, order: [], passed: [], log: [], dq: [], bids: {}, wid: 1,
    players: [], occ: {}, mod: {}, sched: [], pool: [], crisisCard: null,
    sysAvail: {}, invest: null, winner: null, scores: null, decks: {}, over: false
  };
  const N = seats.length;
  seats.forEach((s, i) => S.players.push({
    id: i, name: s.name || ("Player " + (i + 1)), bot: !!s.bot, color: ["#e74c3c","#3498db","#27ae60","#f39c12","#9b59b6","#16a085"][i],
    gold: cfg.startGold, ideas: 0, code: 0, process: 0, buzz: 0, prod: 0, mktg: 0, hype: 0, debt: 0, culture: 0, vpAdj: 0,
    workers: [], systems: [], building: [], recruited: 0, objectives: [], dropped: [], miles: [], claimed: [],
    hireDiscount: 0, burnout: 0, freeBuilds: 0, rd: false, flags: {}, swapObj: 0, swapMile: 0, promos: 0, hunts: 0, builds: 0,
    rs: {}, cs: { promotions: 0, fired: 0, reachGold: 0, noGoldBuilds: 0, bigBuild: false, hypeEver: false, debtEver: false, hypeStreak: 0, cashedTotal: 0 }
  }));
  if (cfg.startWorkers) S.players.forEach(p => { // L2: no hand to hire from, so each studio opens with a small team: one Junior from each of a few different categories
    const cats = shuffle(S, Object.keys(D0.categories));
    for (let i = 0; i < cfg.startWorkers; i++) { const ds = D0.categories[cats[i % cats.length]].discs.filter(d => d !== "QA"); p.workers.push({ id: S.wid++, disc: ds[rint(S, ds.length)], lvl: "Jr", fat: 0, placed: false, as: null, worked: false }); }
  });
  if (cfg.mileGoldAdj) data.milestones.forEach(m => { if (cfg.mileGoldAdj[m.name]) m.gold = Math.max(1, m.gold + cfg.mileGoldAdj[m.name]); });
  S.decks.mile = shuffle(S, data.milestones.map((m, i) => i));
  S.decks.obj = {};
  ["Platform","Genre","Audience","Wild"].forEach(t => S.decks.obj[t] = shuffle(S, data.objectives.map((o, i) => o.type === t ? i : -1).filter(i => i >= 0)));
  S.decks.crisis = [0,1,2].map(d => shuffle(S, data.crisis.filter(c => c.deck === d).map(c => c.id)));
  data.systems.forEach(s => S.sysAvail[s.name] = true);
  S.decks.sys = {}; S.market = {};
  E.CATS.forEach(cat => { S.decks.sys[cat] = shuffle(S, data.systems.filter(s => s.cat === cat).map(s => s.name)); S.market[cat] = []; });
  refillMarket(S);
  S.order = shuffle(S, S.players.map(p => p.id));
  if (cfg.gatesAtSetup) drawGates(S);
  S.players.forEach(p => {
    for (let i = 0; i < ((cfg.handSizeByN && cfg.handSizeByN[N] != null) ? cfg.handSizeByN[N] : cfg.handSize); i++) drawMile(S, p.id, true);
    const opts = {};
    Object.keys(S.decks.obj).forEach(t => { opts[t] = []; for (let i = 0; i < cfg.objDraw; i++) { const c = S.decks.obj[t].pop(); if (c != null) opts[t].push(c); } });
    S.dq.push({ t: "keepObj", p: p.id, opts });
  });
  log(S, "Game created: " + N + " players. Seed " + S.seed);
  E.advance(S);
  return S;
};

/* ---------- helpers ---------- */
const P = (S, i) => S.players[i];
E.phaseOfRound = PHASE_OF_ROUND;
// cultureFold (R5): Culture is not a separate track. Every Culture gain eases Burnout, every loss adds Burnout; readers see a virtual Culture of (base - Burnout).
const cul = (S, p) => S.cfg.cultureFoldBase - (p.burnout || 0);
E.cultureOf = cul;
// cultureFold: the three Culture-gated Crisis cards are re-read as Burnout bands so they still bite (protected = Burnout 2 or less, Departure = Burnout 4+, Burnout Wave = Burnout 3+)
const protectedFromCrisis = (S, p) => (p.burnout || 0) <= 2;
function statChange(S, pi, stat, d) {
  if (stat === "culture") { stat = "burnout"; d = -d; }
  const p = P(S, pi); if (!d) return 0;
  const cfg = S.cfg; const before = p[stat];
  let v = before + d;
  if (stat === "burnout") v = clamp(v, 0, cfg.burnMax || 6);
  else if (RES.includes(stat)) v = clamp(v, 0, cfg.resCap || 99);
  else v = Math.max(0, v);
  if (stat === "gold") {
    if (!S._nt) { if (d > 0) p.rs.gained = (p.rs.gained || 0) + d; else p.rs.spent = (p.rs.spent || 0) - d; } // income, bids and milestone gold are not "gained" or "spent" for milestones
  }
  p[stat] = v; const real = v - before;
  if (stat === "debt") { if (v > 0) p.cs.debtEver = true; if (real < 0) p.rs.debtRemoved = (p.rs.debtRemoved || 0) - real; }
  if (stat === "hype") { if (v > 0) p.cs.hypeEver = true; if (real > 0) p.rs.hypeGained = (p.rs.hypeGained || 0) + real; }
  if (stat === "prod" && S.invest && !S.invest.rewarded && v >= S.invest.firstAt) {
    S.invest.rewarded = true; p.vpAdj += S.invest.reward; log(S, p.name + " is first to " + S.invest.firstAt + " Progress: +" + S.invest.reward + " VP (Investor Pressure)");
  }
  return real;
}
E.statChange = statChange;
const gain = (S, pi, stat, d) => statChange(S, pi, stat, d);
const addVP = (S, pi, amt) => { P(S, pi).vpAdj += amt; };

function drawMile(S, pi, silent) {
  const dk = S.decks.mile; if (!dk.length) return null;
  const c = dk.pop(); P(S, pi).miles.push(c); if (!silent) log(S, P(S, pi).name + " draws a milestone"); return c;
}
// which disciplines may this worker act as (wild workers declare when placed / built-with)
function actsAs(w) { const d = D0.disciplines[w.disc]; return d.wild ? d.wild.concat([w.disc]) : [w.disc]; }
function countWeighted(p, disc) { return p.workers.reduce((a, w) => a + ((w.disc === disc || (w.as === disc)) ? (w.lvl === "Sr" ? 2 : 1) : 0), 0); }
function ownsDiscs(p, req) { // distinct workers for each requirement, wild workers flexible
  const pool = p.workers.map(w => actsAs(w)); const used = new Array(pool.length).fill(false);
  function go(i) {
    if (i === req.length) return true;
    for (let k = 0; k < pool.length; k++) if (!used[k] && pool[k].includes(req[i])) { used[k] = true; if (go(i + 1)) return true; used[k] = false; }
    return false;
  }
  return go(0);
}
/* build crew: one free (not already building) worker per role the system's cost names; wild workers are flexible. Returns worker ids, or null. */
function crewFor(p, req) {
  const free = p.workers.filter(w => !w.build); const used = {}; const out = [];
  function go(i) {
    if (i === req.length) return true;
    const cand = free.filter(w => !used[w.id] && actsAs(w).includes(req[i])).sort((a, b) => (a.lvl === "Sr") - (b.lvl === "Sr") || (D0.disciplines[a.disc].wild ? 1 : 0) - (D0.disciplines[b.disc].wild ? 1 : 0) || a.id - b.id);
    for (const w of cand) { used[w.id] = true; out.push(w.id); if (go(i + 1)) return true; out.pop(); used[w.id] = false; }
    return false;
  }
  return go(0) ? out.slice() : null;
}
E.crewFor = crewFor;
function sysCount(p, cat) { return p.systems.filter(s => s.cat === cat).length; }
function debtPct(S, p) {
  if (p.prod <= 0) return p.debt > 0 ? 100 : 0;
  return (p.debt / p.prod) * 100;
}
E.debtPct = debtPct;
function srAllowed(S) { return S.phase >= 1 || S.cfg.srAllowedPreProd; }
const promoCost = S => S.cfg["promoCost" + S.phase];
E.promoCost = promoCost;
E.promoGold = S => (S.cfg.promoGoldByN && S.cfg.promoGoldByN[S.players.length] != null) ? S.cfg.promoGoldByN[S.players.length] : 0;
function sysDef(S, name) { return S.data.systems.find(s => s.name === name); }

/* ---------- actor / flow ---------- */
E.currentActor = function (S) {
  E.useCfg(S.cfg);
  if (S.over) return -1;
  if (S.dq.length) { const d = S.dq[0]; return d.p == null ? -1 : d.p; }
  if (S.step === "rest" || S.step === "place") return S.order[S.cur] != null ? S.order[S.cur] : -1;
  return -1;
};

E.advance = function (S) {
  let guard = 0;
  while (guard++ < 500 && !S.over) {
    if (S.dq.length) {
      const d = S.dq[0];
      if (d.t === "auto") { S.dq.shift(); AUTO[d.fn](S, d.args || {}); continue; }
      return;
    }
    switch (S.step) {
      case "setup": beginPhase(S); continue;
      case "crisis": afterCrisis(S); continue;
      case "rest":
        if (S.cur >= S.order.length) { nextStep(S); continue; }
        return;
      case "place": placeAdvance(S); if (S.step === "place") return; continue;
      default: return;
    }
  }
};

function beginPhase(S) {
  S.phase = PHASE_OF_ROUND(S.round);
  S.mod = {};
  S.players.forEach(p => { p.flags.noMentor = false; });
  S.order = S.order.slice(); S.bids = {};
  log(S, "=== PHASE START: " + D0.phases[S.phase].name + " ===");
  S.players.forEach(p => { // milestones whose phase window has passed are swapped for fresh ones
    const old = p.miles.filter(id => mileExpired(S, S.data.milestones[id])); if (!old.length) return;
    p.miles = p.miles.filter(id => !old.includes(id));
    old.forEach(() => { for (let t = 0; t < 8; t++) { const c = drawMile(S, p.id, true); if (c == null) break; if (!mileExpired(S, S.data.milestones[c])) break; p.miles.splice(p.miles.indexOf(c), 1); } });
    log(S, p.name + " swaps " + old.length + " expired milestone" + (old.length > 1 ? "s" : ""));
  });
  if (S.phase === 2 && S.invest) { // Investor Pressure resolves at the end of Production
    S.players.forEach(p => { if (p.prod < S.invest.need) { addVP(S, p.id, -S.invest.penalty); log(S, p.name + " missed Investor Pressure target: -" + S.invest.penalty + " VP"); } });
    S.invest = null;
  }
  S.step = "crisis";
  if (S.cfg.crisisEnabled && S.phase >= 1) {
    const deck = S.decks.crisis[S.phase - 1]; const id = deck.pop();
    if (id) { S.crisisCard = id; startCrisis(S, S.data.crisis.find(c => c.id === id)); return; }
  }
  S.crisisCard = null;
}

// A new round opens (Upkeep ran first, except round 1): Income and salaries, turn order, then Place
function afterCrisis(S) { roundSetup(S); catchUpOrder(S); S.step = "place"; startPlace(S); }
// Catch-up order: no blind bid. The studio with the fewest VP right now acts first; ties go to the smaller team, then a coin flip. Round 1 keeps the setup order.
function catchUpOrder(S) {
  if (S.round <= 1 && !S.lastOrderSet) { S.lastOrderSet = 1; return; }
  const sc = E.score(S).map(x => x.total), ids = S.players.map(p => p.id), key = i => [sc[i], P(S, i).workers.length, rnd(S)], k = {}; ids.forEach(i => k[i] = key(i));
  ids.sort((a, b) => { for (let j = 0; j < 3; j++) if (k[a][j] !== k[b][j]) return k[a][j] - k[b][j]; return 0; });
  if (S.cfg.noRepeatFirst && S.prevFirst != null && ids[0] === S.prevFirst && ids.length > 1) { const f = ids.shift(); if (S.cfg.noRepeatFirst === 1) ids.push(f); else ids.splice(1, 0, f); }
  S.prevFirst = ids[0];
  S.order = ids; S.lastBids = {};
  log(S, "TURN ORDER (catch-up, fewest VP first): " + ids.map(i => P(S, i).name).join(" > "));
}
function roundSetup(S) {
  S.players.forEach(p => {
    p.rs = { spent: 0, gained: 0, spentRes: 0, hires: 0, placed: 0, triggers: 0, builds: 0, debtRemoved: 0, hypeGained: 0, discards: 0, cashed: 0, debtStart: p.debt };
    p.workers.forEach(w => { w.placed = false; w.benched = false; w.training = false; w.trainNow = false; if (w.trainLeft > 0) { w.benched = "Training"; w.trainLeft--; } });
    p.ws = S.cfg.wsMax ? Math.min(S.cfg.wsMax, S.cfg.wsFree || 0) : 0; p.wsUsed = 0; p.rd = false; p.rdDisc = 0; p.refreshed = 0; p.builds = 0; p.promos = 0; p.hunts = 0; p.swapObj = 0; p.swapMile = 0; p.recruited = 0; p.recruitExtra = 0;
    p.systems.forEach(s => s.t = false);
  });
  S.occ = {}; S.passed = []; S.closed = {};
  const kc = S.cfg.closeByN && S.cfg.closeByN[S.players.length];
  if (kc && S.phase < 3 && S.round >= (S.cfg.closeFromRound || 1)) {
    const cand = activeSpots(S).filter(sp => spotModeOf(sp) === "single" && !sp.special && !sp.excl && sp.id !== "ship");
    for (let i = cand.length - 1; i > 0; i--) { const j = rint(S, i + 1); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
    cand.slice(0, kc).forEach(sp => { S.closed[sp.id] = 1; });
    log(S, "INDUSTRY NEWS: " + cand.slice(0, kc).map(sp => sp.row + " (" + (sp.fx || sp.note || sp.id) + ")").join("; ") + " closed this round");
  }
  { completeBuilds(S); rollRecruit(S); S.players.forEach(p => { p.cs.crewRounds = (p.cs.crewRounds || 0) + p.workers.filter(w => w.build).length; }); }
  log(S, "--- ROUND " + S.round + " (" + D0.phases[S.phase].name + ") ---");
  S.players.forEach(p => {
    S._nt = 1; if (S.rnote && S.rnote.r === S.round) S.rnote.p[p.id] = { income: S.cfg.income + p.systems.reduce((s, sy) => { const d = sysDef(S, sy.name); return s + (d && d.inc ? d.inc : 0); }, 0), salary: 0, short: 0 }; gain(S, p.id, "gold", S.cfg.income);
    p.systems.forEach(sy => { const d = sysDef(S, sy.name); if (d && d.inc) { gain(S, p.id, "gold", d.inc); } }); S._nt = 0;
  });
  log(S, "INCOME: everyone +" + S.cfg.income + "G");
  S.players.forEach(p => {
    const sal = p.workers.reduce((t, w) => t + (w.lvl === "Sr" ? (S.cfg.salarySr || 0) : (S.cfg.salaryJr || 0)), 0);
    if (!sal) return;
    const pay = Math.min(sal, p.gold); p.gold -= pay;
    { const rn = S.rnote && S.rnote.r === S.round && S.rnote.p[p.id]; if (rn) { rn.salary = pay; rn.short = sal - pay; } }
    log(S, p.name + " pays salaries: -" + pay + "G (" + p.workers.filter(w => w.lvl !== "Sr").length + " Junior, " + p.workers.filter(w => w.lvl === "Sr").length + " Senior)" + (pay < sal ? ", short by " + (sal - pay) + "G" : ""));
    if (sal - pay >= (S.cfg.burnUnpaidMin || 1)) { p.rs.unpaid = true; const b = Math.min(S.cfg.burnUnpaidMax || 2, Math.ceil((sal - pay) / (S.cfg.burnUnpaidPer || 2))); const r = gain(S, p.id, "burnout", b); if (r) log(S, p.name + " could not pay everyone: Burnout +" + r); }
  });
  burnBands(S);
  if (S.rnote && S.rnote.r === S.round && S.rnote.snap) S.players.forEach((p, i) => {
    const sn = S.rnote.snap[i], rn = S.rnote.p[p.id] = S.rnote.p[p.id] || { income: 0, salary: 0, short: 0 };
    rn.hype = p.hype - sn.hype; rn.burn = (p.burnout || 0) - sn.burn; rn.lost = Math.max(0, sn.n - p.workers.length); rn.gold = p.gold - sn.gold;
    rn.band = E.burnBand(S, p); rn.goldNow = p.gold; rn.bonus = rn.gold - rn.income + rn.salary;
  });
}

// Variant D: a Junior can be promoted after enough trainings, or (promoByRest) after working and then sitting out a round, once they are no more than Tired
const restedJr = w => !!w.worked && !w.placed && !w.build && !w.trainNow && (w.fat || 0) <= 1;
function trainPromoWhy(S, w) {
  const c = S.cfg; if ((w.trained || 0) >= c.trainNeeded) return "";
  if (c.promoByRest && restedJr(w)) return "";
  return "Needs " + c.trainNeeded + " training" + (c.trainNeeded === 1 ? "" : "s") + (c.promoByRest ? ", or a round of rest after working" : "") + " (trained " + (w.trained || 0) + ")";
}
E.trainPromoWhy = trainPromoWhy;
const trainDur = S => Math.max(1, Math.floor(S.cfg.trainDuration || 1));
/* ---------- Variant D: Burnout track ---------- */
// Burnout (0 to burnMax) is a personal token. Printed bands: Energized (Burnout 0 and Culture high) pays Gold, Strained costs extra Hype at upkeep,
// Burned out benches the most tired worker for the round, Meltdown makes a worker quit.
E.burnBand = function (S, p) {
  const c = S.cfg, b = p.burnout || 0;
  if (b >= c.burnQuitAt) return "Meltdown";
  if (b >= c.burnBenchAt) return "Burned out";
  if (b >= c.burnStrainAt) return "Strained";
  if (b <= c.energizedBurnMax && cul(S, p) >= c.energizedCulture) return "Energized";
  return "Steady";
};
function burnBands(S) {
  S.players.forEach(p => {
    const c = S.cfg;
    if (E.burnBand(S, p) === "Energized" && c.energizedGold) { S._nt = 1; gain(S, p.id, "gold", c.energizedGold); S._nt = 0; log(S, p.name + " is Energized (Burnout " + p.burnout + (", Culture " + cul(S, p)) + "): +" + c.energizedGold + "G"); }
    if (p.burnout >= c.burnQuitAt && p.workers.length > 1) {
      const q = p.workers.filter(w => !w.build).sort((a, b) => (a.lvl === "Sr") - (b.lvl === "Sr") || b.fat - a.fat || a.id - b.id)[0];
      if (q) { log(S, p.name + " Meltdown: a " + q.lvl + " " + dn(q.disc) + " quits"); removeWorker(S, p.id, q.id); p.burnout = Math.min(p.burnout, c.burnQuitReset); }
    } else if (p.burnout >= c.burnBenchAt) {
      const q = p.workers.filter(w => !w.build && !w.benched).sort((a, b) => b.fat - a.fat || (a.lvl === "Sr") - (b.lvl === "Sr") || a.id - b.id)[0];
      if (q) { q.benched = "Burned out"; log(S, p.name + " is Burned out: " + q.lvl + " " + dn(q.disc) + " sits out this round"); }
    }
  });
}

/* ---------- build time, recruitment pool ---------- */
// A system you buy is held in p.building until its ready round, then joins p.systems (so triggers, passives and scoring only ever see finished systems).
function completeBuilds(S) {
  S.players.forEach(p => {
    const b = p.building || []; if (!b.length) return;
    p.building = b.filter(x => {
      if (x.rdy > S.round) return true;
      const def = sysDef(S, x.name); p.systems.push({ name: x.name, cat: x.cat, t: false }); p.rs.builds++;
      (x.crew || []).forEach(id => { const cw = p.workers.find(q => q.id === id); if (cw && cw.build === x.name) cw.build = null; });
      if (def.debt) { const dg = gain(S, p.id, "debt", def.debt); if (dg) log(S, p.name + " takes on Tech Debt +" + dg + " from finishing " + x.name); }
      if (def.once) applyFx(S, p.id, E.parseEffect(def.once), 1, {});
      log(S, p.name + "'s " + x.name + " is finished (" + def.cat + ")");
      return false;
    });
  });
}
E.recruitSize = function (S) { const n = S.players.length, c = S.cfg; return n <= 2 ? (c.recruitSize2 || 2) : n <= 4 ? (c.recruitSize34 || 3) : (c.recruitSize56 || 4); };
// A fresh shared pool every round: some categories, one random discipline from each. Take one by paying Gold (no worker needed).
function rollRecruit(S) {
  if (S.recruitRound === S.round) return; S.recruitRound = S.round;
  const size = E.recruitSize(S), cats = shuffle(S, Object.keys(D0.categories));
  const left = {}; cats.forEach(cat => { left[cat] = D0.categories[cat].discs.filter(d => !(S.phase === 0 && d === "QA" && !S.cfg.qaAllowedPreProd)); });
  S.recruit = [];
  cats.slice(0, size).forEach(cat => { const ds = left[cat]; S.recruit.push({ cat, disc: ds[rint(S, ds.length)], by: null }); });
  log(S, "RECRUITMENT: " + S.recruit.map(o => dn(o.disc)).join(", ") + " available");
}
// recruitLadder (L2): each worker taken from the pool this round makes the next one dearer; the Talent spot's extra recruit is 1G cheaper
E.recruitCost = function (S, pi) { const p = P(S, pi), c = S.cfg; const taken = (S.recruit || []).filter(o => o.by != null).length; return Math.max(0, (c.recruitCost == null ? 3 : c.recruitCost) + (c.recruitLadder || 0) * taken + (S.mod && S.mod.hireAdd && !protectedFromCrisis(S, p) ? S.mod.hireAdd : 0) - Math.min(p.hireDiscount || 0, 1)); };
E.canRecruit = function (S, pi, idx) {
  const p = P(S, pi); if (S.step !== "place") return { ok: false, reason: "Not available" };
  if (S.phase === 3 && !S.cfg.recruitInLaunch) return { ok: false, reason: "No hiring in Launch" };
  if (S.cfg.recruitMinRound && S.round < S.cfg.recruitMinRound) return { ok: false, reason: "Recruiting opens in round " + S.cfg.recruitMinRound };
  const o = (S.recruit || [])[idx]; if (!o) return { ok: false, reason: "No such offer" };
  if (o.by != null) return { ok: false, reason: "Already taken" };
  if ((p.recruited || 0) >= (S.cfg.recruitPerRound || 1) + (p.recruitExtra || 0)) return { ok: false, reason: "One hire per round" };
  const cost = E.recruitCost(S, pi); if (p.gold < cost) return { ok: false, reason: "Needs " + cost + "G" };
  return { ok: true, cost };
};

function nextStep(S) { // the Manage step is over: close the round
  S.cur = 0;
  S.players.forEach(p => { p.cs.hypeStreak = p.hype >= 10 ? p.cs.hypeStreak + 1 : 0; });
  roundEnd(S);
}

function beginRest(S) {
  S.step = "rest"; S.cur = 0;
}
function startPlace(S) {
  S.passed = []; S.cur = 0;
  // skip players who cannot ever place
  placeAdvance(S);
}
function canAnyPlace(S, pi) {
  if (P(S, pi).flags.skipLaunch && S.phase === 3) return false;
  const p = P(S, pi);
  if ((S.recruit || []).some((o, i) => E.canRecruit(S, pi, i).ok)) return true;
  const buy = S.cfg.wsMax && E.canBuyWs(S, pi).ok;
  return p.workers.some(w => !w.placed && placementOptions(S, pi, w).some(o => o.ok || (buy && o.wsNeed)));
}
function placeAdvance(S) {
  // find next player in cycle who hasn't passed & can place
  const n = S.order.length;
  for (let k = 0; k < n; k++) {
    const idx = (S.cur + k) % n; const pi = S.order[idx];
    if (S.passed.includes(pi)) continue;
    if (!canAnyPlace(S, pi)) {
      S.passed.push(pi);
      const left = P(S, pi).workers.filter(w => !w.placed).length;
      if (left) { // tell the player why their turn ended
        const msg = P(S, pi).name + (left > 1 ? " has " + left + " workers" : " has a worker") + " with no open tile that fits, so " + (left > 1 ? "they rest" : "that worker rests") + " this round";
        log(S, msg); (S.notices = S.notices || []).push({ r: S.round, p: pi, t: msg });
      }
      continue;
    }
    S.cur = idx; return;
  }
  // everyone passed -> the Manage step: build, train, promote and cash in milestones in one turn each
  log(S, "MANAGE: build, train, promote and cash in milestones"); beginRest(S);
}
function bumpPlace(S) { S.cur = (S.cur + 1) % S.order.length; }

/* ---------- Upkeep & round end ---------- */
// End of round (phase-end events): crisis hooks, gates, Hype banking. Returns true if the game ended.
function endOfRound(S) {
  // scheduled end-of-round crisis hooks
  S.sched = S.sched.filter(h => {
    if (h.round !== S.round) return true;
    if (h.kind === "conference") conferenceResolve(S, h);
    if (h.kind === "award") awardResolve(S, h);
    return false;
  });
  if (S.round === 1 && !S.cfg.gatesAtSetup) drawGates(S);
  if (S.round >= PHASE_ENDS[3] || PHASE_OF_ROUND(S.round + 1) !== S.phase) resolveGate(S);
  if (S.cfg.hypeBank && S.phase < 3 && PHASE_OF_ROUND(S.round + 1) !== S.phase) { // lock in: when a phase closes, Hype is banked as Marketing, which never fades
    S.players.forEach(q => { const x = Math.min(S.cfg.hypeBank, q.hype); if (x > 0) { q.hype -= x; q.mktg += x; log(S, q.name + " banks " + x + " Hype as Marketing"); } });
  }
  if (S.cfg.hypeLeadVP && S.phase < 3 && PHASE_OF_ROUND(S.round + 1) !== S.phase) { // press buzz: the studio with the most Hype when a phase closes earns VP
    const mx = Math.max.apply(null, S.players.map(q => q.hype)), tops = S.players.filter(q => q.hype === mx);
    if (tops.length === 1 && mx >= (S.cfg.hypeLeadMin || 1) && S.players.length >= (S.cfg.awardMinN || 0)) { tops[0].vpAdj += S.cfg.hypeLeadVP; S.hypeLead = (S.hypeLead || []).concat([{ phase: S.phase, id: tops[0].id, vp: S.cfg.hypeLeadVP }]); log(S, "HYPE LEADER: " + tops[0].name + " has the most Hype (" + mx + ") at the end of " + D0.phases[S.phase].name + ": +" + S.cfg.hypeLeadVP + " VP"); }
  }
  return false;
}
// Upkeep: Hype fades, Culture moves toward 0, Burnout, tired workers recover or quit
function upkeepPlayers(S) {
  S.players.forEach(p => {
    p.systems.forEach(sy => { const d = sysDef(S, sy.name); if (d && d.rule && d.rule.upk) { Object.keys(d.rule.upk).forEach(k => gain(S, p.id, k, d.rule.upk[k])); log(S, p.name + "'s " + d.name + ": " + d.pas); } });
    if (S.cfg.hypeIncStep) { const hg = Math.min(S.cfg.hypeIncMax || 2, Math.floor(p.hype / S.cfg.hypeIncStep)); if (hg) { S._nt = 1; gain(S, p.id, "gold", hg); S._nt = 0; log(S, p.name + " has " + p.hype + " Hype: Wishlists bring +" + hg + "G"); } }
    gainHypeDecay(S, p);
    {
      const oN = p.rs.overN || 0, st = S.cfg.burnOverStep || 2, add = Math.min(S.cfg.burnOverMax || 2, Math.floor(oN / st)); p.rs.overPlaced = add > 0;
      if (add) { const r = gain(S, p.id, "burnout", add); if (r) log(S, p.name + " ran " + oN + " Exhausted workers: Burnout +" + r); }
      if (E.burnBand(S, p) === "Strained" || p.burnout >= S.cfg.burnBenchAt) { const x = Math.min(p.hype, S.cfg.burnStrainHype || 1); if (x) { p.hype -= x; log(S, p.name + " is " + E.burnBand(S, p) + ": Hype -" + x + " extra"); } }
      if (!p.rs.overPlaced && !p.rs.unpaid) { const r = gain(S, p.id, "burnout", -(S.cfg.burnRelief || 1)); if (r) log(S, p.name + " had a calm round: Burnout " + r); }
    }
    // exhausted loss rolls, then recovery
    const lost = [];
    p.workers.forEach(w => {
      if (w.placed && w.overWhenPlaced) {
        const thresh = S.cfg.lossThreshBase;
        const roll = 1 + rint(S, 6);
        if (roll <= thresh) lost.push(w);
      }
      w.overWhenPlaced = false;
    });
    lost.forEach(w => { log(S, p.name + " loses an Exhausted " + w.lvl + " " + dn(w.disc)); removeWorker(S, p.id, w.id); });
    p.workers.forEach(w => { if (!w.placed && w.fat > 0) w.fat--; });
    p.flags.freeBuildUsed = false;
  });
  log(S, "UPKEEP: Hype -" + S.cfg.hypeDecay + ", Culture toward 0, workers recover");
}
// The round closes (gates), the next round opens with Upkeep (not in round 1), then Income and turn order. No Upkeep after the last round.
function roundEnd(S) {
  if (endOfRound(S)) return;
  if (S.round >= PHASE_ENDS[3]) return endGame(S);
  S.round++;
  // what changed between rounds, shown to the players when the new round opens
  S.rnote = { r: S.round, p: {}, snap: S.players.map(p => ({ gold: p.gold, hype: p.hype, burn: p.burnout || 0, n: p.workers.length })) };
  upkeepPlayers(S);
  if (PHASE_OF_ROUND(S.round) !== S.phase) return beginPhase(S);
  roundSetup(S); catchUpOrder(S); S.step = "place"; startPlace(S);
}
/* Publisher gates: a review at the end of each phase. Meet every requirement: funding tranche (+ VP). Miss: VP penalty. Best Progress among those who pass: bonus VP. */
/* Publisher gates are drawn once per game, at the end of round 1: one review per phase, picked from the pool for that phase. */
function drawGates(S) {
  if (S.gateSet) return;
  const pool = S.data.gatePool || [];
  if (!S.cfg.gatesRandom || !pool.length) { S.gateSet = (S.data.publisherGates || []).slice(); applyGateLevels(S); return; }
  S.gateSet = [0, 1, 2, 3].map(ph => { const opts = pool.filter(x => x.phase === ph); return opts.length ? opts[rint(S, opts.length)] : (S.data.publisherGates || []).find(x => x.phase === ph); }).filter(Boolean);
  applyGateLevels(S);
  log(S, "PUBLISHER GATES revealed: " + S.gateSet.map(g => g.name + (g.lvl && g.lvl !== "M" ? " (" + g.lvlName + ")" : "")).join(" > "));
}
/* Gate difficulty: the table picks a level (E/M/H) for each phase's gate at setup (cfg.gateLevels, one code per phase). Medium is the gate as printed.
   Easy and Hard scale the numeric targets (Progress, Marketing, Hype up with level; Debt limits tighten with level) and the funding, VP and miss penalty. */
function scaleReq(r, thr) {
  let m; const sc = n => Math.max(1, thr < 1 ? Math.floor(n * thr) : Math.ceil(n * thr));
  if ((m = r.match(/^(\d+)\+(\s*(?:Progress|Product|Marketing|Mktg)(?: value)?)$/))) return sc(+m[1]) + "+" + m[2];
  if ((m = r.match(/^(\d+)\+(\s*Hype(?: at Launch)?)$/))) return sc(+m[1]) + "+" + m[2];
  if ((m = r.match(/^Debt\s*<\s*(\d+)%$/))) return "Debt < " + Math.max(5, Math.min(95, Math.round(+m[1] / thr))) + "%";
  return r;
}
E.GATE_LEVELS = { E: "Easy", M: "Medium", H: "Hard" };
function applyGateLevels(S) {
  const lv = S.cfg.gateLevels; if (!lv || !lv.length) return;
  const defs = S.cfg.gateLevelDefs || {};
  S.gateSet = S.gateSet.map(g => {
    const L = lv[g.phase] || "M", d = defs[L]; if (!d || L === "M") return Object.assign({}, g, { lvl: "M", lvlName: "Medium" });
    const rnd = (v, k) => v ? Math.max(1, Math.round(v * (k == null ? 1 : k))) : v;
    return Object.assign({}, g, { lvl: L, lvlName: E.GATE_LEVELS[L], reqs: g.reqs.map(r => scaleReq(r, d.thr || 1)), fund: rnd(g.fund, d.reward), vp: S.cfg.gateVpFixed ? g.vp : rnd(g.vp, d.reward), penalty: rnd(g.penalty, d.penalty) });
  });
}
E.gateList = function (S) { return S.gateSet || (S.cfg.gatesRandom && (S.data.gatePool || []).length ? null : (S.data.publisherGates || [])); };
function resolveGate(S) {
  drawGates(S);
  const g = (S.gateSet || []).find(x => x.phase === S.phase); if (!g) return;
  S.gates = S.gates || [];
  const passed = [], failed = [];
  S.players.forEach(p => { (g.reqs.every(r => reqCheck(S, p, r)) ? passed : failed).push(p.id); });
  passed.forEach(id => { if (g.fund) gain(S, id, "gold", g.fund); if (g.vp) P(S, id).vpAdj += g.vp; });
  const missTxt = [];
  failed.forEach(id => { const pl = P(S, id), cap = S.cfg.gateLossCap || 99, pen = Math.max(0, Math.min(g.penalty, cap - (pl.gateLoss || 0))); pl.gateLoss = (pl.gateLoss || 0) + pen; pl.vpAdj -= pen; missTxt.push(pl.name + " -" + pen + " VP" + (pen < g.penalty ? " (cap of " + cap + " VP reached)" : "")); });
  let best = null;
  if (passed.length) { const mx = Math.max.apply(null, passed.map(id => P(S, id).prod)); const tops = passed.filter(id => P(S, id).prod === mx); if (tops.length === 1 && S.cfg.gateBestVP && S.players.length >= (S.cfg.awardMinN || 0)) { best = tops[0]; P(S, best).vpAdj += S.cfg.gateBestVP; } }
  S.gates.push({ phase: S.phase, name: g.name, lvl: g.lvl || "M", passed, failed, best });
  log(S, "GATE: " + g.name + " (" + g.reqs.join(", ") + "). Passed: " + (passed.map(id => P(S, id).name).join(", ") || "nobody") + (best != null ? ". Publisher's favorite: " + P(S, best).name : "") + (failed.length ? ". Missed: " + missTxt.join(", ") : "") + (g.fund ? ". Passing studios gain +" + g.fund + "G" : "") + (g.vp ? " and +" + g.vp + " VP" : ""));
}
function refillMarket(S) {
  const size = S.cfg.marketSize; if (!size) return;
  E.CATS.forEach(cat => { const m = S.market[cat], dk = S.decks.sys[cat]; while (m.length < size && dk.length) m.push(dk.pop()); });
}
E.reqOk = function (S, pi, r) { return reqCheck(S, P(S, pi), r); };
E.inMarket = function (S, def) { return !!S.sysAvail[def.name] && (!S.cfg.marketSize || (S.market[def.cat] || []).includes(def.name)); };
function gainHypeDecay(S, p) { if (S.cfg.decayFromRound && S.round < S.cfg.decayFromRound) return; const reach = p.systems.filter(y => y.cat === "Reach").length; const dec = Math.max(0, S.cfg.hypeDecay - reach * (S.cfg.reachFade || 0)); if (p.hype > 0) p.hype = Math.max(0, p.hype - dec); if (S.cfg.mergeMktg) p.mktg = p.hype; }
function removeWorker(S, pi, wid, toPool) {
  const p = P(S, pi); const i = p.workers.findIndex(w => w.id === wid); if (i < 0) return null;
  const w = p.workers.splice(i, 1)[0]; if (toPool !== false) S.pool.push({ disc: w.disc, lvl: w.lvl }); return w;
}

/* ============================================================
   PLACEMENT
   ============================================================ */
function activeSpots(S) { const dr = S.cfg.smallDrop, small = dr && dr.length && S.players.length <= (S.cfg.smallMax || 3); const bd = (S.cfg.dropByN && S.cfg.dropByN[S.players.length]) || []; return S.data.spots.filter(s => s.phases.includes(S.phase) && !(small && dr.includes(s.id)) && !bd.includes(S.phase + ":" + s.id)); }
E.activeSpots = activeSpots; E.RES = RES; E.RES_OF = RES_OF; E.RES_NAME = RES_NAME; E.CAT_OF = CAT_OF;
function catsOf(w) { const d = D0.disciplines[w.disc]; const out = [d.cat]; (d.wild || []).forEach(x => { const c = CAT_OF(x); if (!out.includes(c)) out.push(c); }); return out; }
/* Strike Team spots: every way to fill the other slots from rested, unplaced workers. A plan = { ids (sorted), wcat (the category the placing worker fills), cats {id: category} }. */
function crewPlans(S, p, w, spot) {
  if (w.fat >= 2) return [];
  const overOK = !!S.cfg.overCrew;
  const others = p.workers.filter(x => x.id !== w.id && !x.placed && !x.build && !x.benched && (x.fat < 2 || overOK));
  const seen = {}, out = [];
  spot.crew.forEach(alt => {
    const wcs = catsOf(w).slice(); if (alt.includes("Any") && !wcs.some(c => alt.includes(c))) wcs.push(catsOf(w)[0]);
    wcs.forEach(wc => {
      let i = alt.indexOf(wc); if (i < 0) i = alt.indexOf("Any"); if (i < 0) return;
      const rest = alt.slice(0, i).concat(alt.slice(i + 1));
      (function go(k, picks) {
        if (k === rest.length) {
          const ids = picks.map(x => x.id).sort((x, y) => x - y), key = ids.join(",");
          if (!seen[key]) { seen[key] = 1; out.push({ ids, wcat: wc, cats: picks.reduce((m, x) => (m[x.id] = x.cat, m), {}) }); }
          return;
        }
        others.forEach(x => {
          if (picks.some(y => y.id === x.id)) return;
          if (x.fat >= 2 && picks.some(y => y.over)) return;
          if (rest[k] === "Any") { if (x.disc === w.disc || picks.some(y => y.disc === x.disc)) return; go(k + 1, picks.concat({ id: x.id, cat: catsOf(x)[0], disc: x.disc, over: x.fat >= 2 })); return; }
          if (!catsOf(x).includes(rest[k])) return; go(k + 1, picks.concat({ id: x.id, cat: rest[k], disc: x.disc, over: x.fat >= 2 }));
        });
      })(0, []);
    });
  });
  return out;
}
E.crewText = function (spot) { return (spot.crew || []).map(a => a.join(" + ")).join(" or "); };
function spotModeOf(s) { return s.mode || (s.excl ? "single" : "single"); }
// Workstations: placing a worker on ANY board spot (main board or studio perk) uses one; triggering your own systems needs none. You power them up each round.
function isMainSpot() { return true; }
E.isMainSpot = isMainSpot;
E.wsCost = function (S, pi) { const p = P(S, pi), c = S.cfg; return (c.wsCost || 0) + (c.wsStep || 0) * Math.max(0, p.ws - (c.wsFree || 0)); };
E.canBuyWs = function (S, pi) { const p = P(S, pi), c = S.cfg; if (!c.wsMax || S.step !== "place") return { ok: false, reason: "Not available" }; if (p.ws >= c.wsMax) return { ok: false, reason: "You already have all " + c.wsMax + " workstations" }; const cost = E.wsCost(S, pi); if (p.gold < cost) return { ok: false, reason: "Needs " + cost + "G" }; return { ok: true, cost }; };
function spotUsableBy(S, pi, w, spot) {
  const r = spotUsableBase(S, pi, w, spot), p = P(S, pi);
  if (r.ok && S.cfg.wsMax && isMainSpot(S, spot) && p.wsUsed >= p.ws) return Object.assign({}, r, { ok: false, wsNeed: true, reason: p.ws >= S.cfg.wsMax ? "All " + S.cfg.wsMax + " workstations are in use" : "Needs a free workstation (buy one for " + E.wsCost(S, pi) + "G)" });
  return r;
}
function spotUsableBase(S, pi, w, spot) {
  // returns {ok, reason, as:[disciplines]}
  const p = P(S, pi);
  if (spot.srOnly && w.lvl !== "Sr") return { ok: false, reason: "Senior workers only" };
  const mode = spotModeOf(spot); const occ = S.occ[spot.id] || [];
  if (S.closed && S.closed[spot.id]) return { ok: false, reason: "Closed by Industry News this round" };
  if (mode === "single" && occ.length) return { ok: false, reason: "Occupied" };
  if (mode !== "single" && mode !== "open" && occ.includes(pi)) return { ok: false, reason: "You already used this spot" };
  let as = [];
  if (spot.discs.includes("ANY")) as = [w.disc];
  else as = actsAs(w).filter(d => spot.discs.includes(d));
  if (!as.length) return { ok: false, reason: "Needs " + spot.discs.join("/") };
  if (S.phase === 0 && !S.cfg.qaAllowedPreProd) as = as.filter(d => d !== "QA");
  if (!as.length) return { ok: false, reason: "No Quality workers in Concept" };
  if (spot.crew) {
    const plans = crewPlans(S, p, w, spot);
    if (!plans.length) return { ok: false, reason: "Needs a rested strike team: " + E.crewText(spot) };
    return { ok: true, as, plans };
  }
  if (spot.special === "convert") { const rk = RES_OF[CAT_OF(as[0])], rate = S.cfg.convertRate || 3; if (Math.floor((p[rk] || 0) / rate) < 1) return { ok: false, reason: "Needs " + rate + " " + RES_NAME[rk] + " to convert" }; }
  if (spot.cost && spot.cost.gold > p.gold) return { ok: false, reason: "Needs " + spot.cost.gold + "G" };
  if (spot.cost && spot.cost.res && E.resTotal(p) < spot.cost.res) return { ok: false, reason: "Needs " + spot.cost.res + " skills" };
  if (spot.special === "talent") {
    if (S.phase === 3 && !S.cfg.recruitInLaunch) return { ok: false, reason: "No hiring in Launch" };
    if (S.cfg.recruitMinRound && S.round < S.cfg.recruitMinRound) return { ok: false, reason: "Recruiting opens in round " + S.cfg.recruitMinRound };
    if (!(S.recruit || []).some(o => o.by == null)) return { ok: false, reason: "Nobody left in the recruitment pool" };
  }
  if (spot.special === "mentor") {
    if (S.phase === 2 && p.flags.noMentor) return { ok: false, reason: "Locked (Feature Creep: Delay)" };
    const jr = p.workers.find(x => x.lvl === "Jr" && x.id !== w.id && x.disc === w.disc);
    if (!jr) return { ok: false, reason: "No Junior of the same discipline to promote" };
    if (!srAllowed(S)) return { ok: false, reason: "No Senior workers in Concept" };
  }
  if (spot.special === "insight" || spot.id === "insight") { if (!S.decks.mile.length) return { ok: false, reason: "Milestone deck empty" }; }
  return { ok: true, as };
}
function placementOptions(S, pi, w) {
  const p = P(S, pi); const out = [];
  if (w.placed) return [{ ok: false, reason: "Already placed this round" }];
  if (w.build) return [{ ok: false, reason: "Busy building " + w.build }];
  if (w.trainNow) return [{ ok: false, reason: "In training this round" }];
  if (w.benched) return [{ ok: false, reason: "Sitting out this round (" + (w.benched === "Training" ? "Training" : "Burned out") + ")" }];
  if (S.phase === 3 && p.flags.skipLaunch) return [{ ok: false, reason: "Skipped (Last-Minute Bug: Delay)" }];
  activeSpots(S).forEach(spot => { const u = spotUsableBy(S, pi, w, spot); out.push(Object.assign({ target: "spot:" + spot.id, label: spot.row, kind: "spot", spot }, u)); });
  p.systems.forEach((s, i) => {
    const def = sysDef(S, s.name); const need = DISC_ALIAS[def.trig.replace(/^1\s*/, "")] || def.trig.replace(/^1\s*/, "");
    let o = { target: "sys:" + i, label: s.name, kind: "sys", sys: s, def };
    if (s.t) o = Object.assign(o, { ok: false, reason: "Already triggered this round" });
    else if (w.lvl !== "Sr") o = Object.assign(o, { ok: false, reason: "Senior workers only" });
    else if (!actsAs(w).includes(need)) o = Object.assign(o, { ok: false, reason: "Needs " + need });
    else o = Object.assign(o, { ok: true, as: [need] });
    out.push(o);
  });
  return out;
}
E.placementOptions = placementOptions;

function applyFx(S, pi, fx, mult, ctx) {
  const p = P(S, pi); ctx = ctx || {}; const m = mult || 1;
  const stats = Object.assign({}, fx.stats);
  if (ctx.alt === "fixdebt" && stats.prod > 0) { stats.debt = (stats.debt || 0) - stats.prod; delete stats.prod; }
  if (ctx.alt === "hype" && stats.prod > 0) { stats.hype = (stats.hype || 0) + stats.prod; delete stats.prod; }
  let removedDebt = 0;
  Object.keys(stats).forEach(k => {
    let d = stats[k] * (k === "debt" && stats[k] > 0 ? 1 : m);
    d = Math.round(d);
    const real = gain(S, pi, k, d); if (k === "debt" && real < 0) removedDebt -= real;
  });
  if (fx.gold) gain(S, pi, "gold", fx.gold * m);
  if (fx.per) {
    let n = 0; const of = fx.per.of;
    if (CATS.includes(of)) n = sysCount(p, of); else if (of === "Sr") n = p.workers.filter(w => w.lvl === "Sr").length;
    gain(S, pi, "gold", Math.min(fx.per.max, fx.per.gold * n));
  }
  for (let i = 0; i < fx.draws.mile; i++) drawMile(S, pi);
  if (fx.keepMile) {
    const opts = []; for (let i = 0; i < fx.keepFrom; i++) { const c = S.decks.mile.pop(); if (c != null) opts.push(c); }
    if (opts.length === 1) p.miles.push(opts[0]); else if (opts.length > 1) S.dq.unshift({ t: "keepMile", p: pi, opts, keep: fx.keepMile });
  }
  return removedDebt;
}

function doPlace(S, pi, wid, target, o) {
  o = o || {}; const p = P(S, pi); const w = p.workers.find(x => x.id === wid);
  if (!w) return err("No such worker");
  if (w.placed) return err("That worker has already been placed this round");
  if (w.build) return err("That worker is building a system");
  if (w.benched) return err("That worker is away this round: " + w.benched);
  const opt = placementOptions(S, pi, w).find(x => x.target === target);
  if (!opt) return err("Invalid target"); if (!opt.ok) return err(opt.reason);
  if (o.as && !opt.as.includes(o.as)) return err("That worker cannot act as " + o.as + " here. Options: " + opt.as.join(", "));
  const as = (o.as && opt.as.includes(o.as)) ? o.as : (w.as && opt.as.includes(w.as)) ? w.as : opt.as[0];
  if (DISCS.includes(w.disc) && D0.disciplines[w.disc].wild) w.as = as;
  const over = w.fat >= 2;
  if (over) { p.rs.overN = (p.rs.overN || 0) + 1; }
  w.worked = true; w.placed = true; if (over) w.overWhenPlaced = true; w.fat = Math.min(2, w.fat + 1);
  let plan = null;
  if (opt.kind === "spot" && opt.spot.crew) {
    const want = Array.isArray(o.crew) ? o.crew.map(Number).sort((x, y) => x - y).join(",") : "";
    plan = opt.plans.find(pl => pl.ids.join(",") === want);
    if (!plan && Array.isArray(o.crew)) return err("That strike team is not allowed. Partners are chosen from: " + opt.plans.map(pl => "[" + pl.ids.join(",") + "]").join(" "));
    if (!plan) plan = opt.plans[0];
    const names = plan.ids.map(id => { const pw = p.workers.find(x => x.id === id); const pover = pw.fat >= 2; if (pover) { pw.overWhenPlaced = true; p.rs.overN = (p.rs.overN || 0) + 1; log(S, p.name + "'s Exhausted " + pw.lvl + " " + dn(pw.disc) + " joins the strike team (Burnout risk)"); } pw.placed = true; pw.worked = true; pw.fat = Math.min(2, pw.fat + 1); p.rs.placed++; if (opt.spot.r && !pover) gain(S, pi, RES_OF[plan.cats[id]], Math.min(pw.lvl === "Sr" ? S.cfg.resSr : S.cfg.resJr, S.cfg.crewPartnerCap == null ? 9 : S.cfg.crewPartnerCap)); return pw.lvl + " " + pw.disc; });
    log(S, p.name + " forms a strike team for " + opt.spot.id + ": " + w.lvl + " " + dn(w.disc) + " + " + names.join(" + "));
  }
  if (opt.kind === "spot" && S.cfg.wsMax && isMainSpot(S, opt.spot)) p.wsUsed++;
  p.rs.placed++;
  if (opt.kind === "sys") {
    const def = opt.def; opt.sys.t = true; p.rs.triggers++; p.cs.trigTotal = (p.cs.trigTotal || 0) + 1;
    const fx = E.parseEffect(def.fx || def.each);
    if (def.fx || def.each) { let eff = def.fx ? fx : E.parseEffect(def.each); if (eff.choice) eff = eff.choice[(typeof o !== "undefined" && o && o.choice === 1) ? 1 : 0]; applyFx(S, pi, eff, 1, {}); }
    log(S, p.name + " triggers " + def.name + " with " + w.lvl + " " + as + " (" + (def.fx || def.each) + ")");
    return { ok: true };
  }
  const spot = opt.spot; const isLaunch = S.phase === 3;
  S.occ[spot.id] = (S.occ[spot.id] || []).concat([pi]);
  // skills: the placing worker earns the skill of the role they fill
  const rmul = spot.r || 0;
  const M = (over ? S.cfg.resOver : (w.lvl === "Sr" ? S.cfg.resSr : S.cfg.resJr)) * rmul;
  if (M) gain(S, pi, RES_OF[plan ? plan.wcat : CAT_OF(as)], M);
  if (!over && w.lvl === "Sr") p.rs.srPlaced = (p.rs.srPlaced || 0) + 1;
  const mult = isLaunch ? S.cfg.launchMult : 1;
  const fx = E.parseEffect(spot.fx);
  let alt = null;
  if (o.alt === "fixdebt" && as === "ENG") alt = "fixdebt"; if (o.alt === "hype" && as === "ART") alt = "hype";
  // Sr bonus
  let srb = "";
  if (w.lvl === "Sr" && !spot.special && !spot.r) { const b = o.bonus === "mktg" ? "mktg" : "prod"; gain(S, pi, b, S.cfg.srBonus * mult); srb = " (+" + S.cfg.srBonus + " " + b + ")"; }
  let removed = 0;
  if (fx.choice) { const pick = fx.choice[o.choice === 1 ? 1 : 0]; removed = applyFx(S, pi, pick, mult, { alt }); }
  else removed = applyFx(S, pi, fx, mult, { alt: alt });
  // discipline perks
  if (as === "ADV" && spot.mkt) gain(S, pi, "hype", 1 * mult);
  if (as === "DES" && p.rs.placed > 1 && !spot.special) {
    const k = ["prod","hype","mktg"].find(s => (fx.stats[s] || 0) > 0); if (k) gain(S, pi, k, 1);
  }
  if (as === "QA" && removed > 0) { gain(S, pi, "gold", removed); log(S, P(S, pi).name + " earns a Bug Bounty: +" + removed + "G for removing " + removed + " Tech Debt"); }
  // Innovation passives: upgrades to the core placement loop
  let noDebt = false;
  p.systems.forEach(sy => {
    const d = sysDef(S, sy.name); const r = d && d.rule; if (!r) return;
    if (r.rows && !r.rows.includes(spot.row)) return;
    if (r.as && !r.as.includes(as)) return;
    if (r.phase != null && r.phase !== S.phase) return;
    if (r.if) { const st = E.parseEffect(spot.fx || "").stats || {}; const ch = (E.parseEffect(spot.fx || "").choice || []).map(c => c.stats || {});
      const all = [st].concat(ch); const key = r.if.replace("-", ""); const neg = r.if[0] === "-";
      if (!all.some(x => neg ? (x[key] || 0) < 0 : (x[key] || 0) > 0)) return; }
    if (!r.rows && spot.special) return;
    if (r.nodebt) { if (spot.debt) { noDebt = true; log(S, p.name + "'s " + d.name + " prevents " + spot.debt + " Tech Debt"); } return; }
    if (r.gain) Object.keys(r.gain).forEach(k => { gain(S, pi, k, r.gain[k]); });
    if (r.gain) log(S, p.name + "'s " + d.name + ": " + d.pas);
  });
  // spot debt (red corner)
  if (spot.debt && !noDebt) gain(S, pi, "debt", spot.debt);
  // specials
  switch (spot.special) {
    case "workshop": spendRes(S, p, spot.cost.res); break;
    case "talent": p.hireDiscount += 1; p.recruitExtra = (p.recruitExtra || 0) + 1; log(S, p.name + " may recruit one more worker from the pool this round (1G off)"); break;
    case "team": gain(S, pi, "gold", -spot.cost.gold); gain(S, pi, "culture", S.cfg.teamEventCulture); gain(S, pi, "burnout", -(S.cfg.burnTeamRelief || 1)); break;
    case "outsource": { const Nn = S.players.length, bn = (m, k) => S.cfg[m] && S.cfg[m][Nn] != null ? S.cfg[m][Nn] : S.cfg[k]; gain(S, pi, "gold", w.lvl === "Sr" ? (bn("outsourceSrByN", "outsourceSr") == null ? 5 : bn("outsourceSrByN", "outsourceSr")) : (bn("outsourceJrByN", "outsourceJr") == null ? 3 : bn("outsourceJrByN", "outsourceJr"))); break; }
    case "rd": p.rd = true; p.rdDisc = S.cfg.rdDiscount || 0; break;
    case "convert": {
      const rk = RES_OF[CAT_OF(as)], rate = S.cfg.convertRate || 3, n = Math.floor((p[rk] || 0) / rate), k = o.conv === "hype" ? "hype" : "prod";
      if (n > 0) { p[rk] -= n * rate; gain(S, pi, k, n); p.rs.converted = (p.rs.converted || 0) + n * rate; p.cs.converted = (p.cs.converted || 0) + n * rate; log(S, p.name + " converts " + n * rate + " " + RES_NAME[rk] + " into " + n + " " + (k === "hype" ? "Hype" : "Progress")); }
      break;
    }
    case "mentor": {
      const jr = p.workers.find(x => x.id === o.jr && x.lvl === "Jr" && x.disc === w.disc) || p.workers.find(x => x.lvl === "Jr" && x.id !== w.id && x.disc === w.disc);
      if (jr) { jr.lvl = "Sr"; p.cs.promotions++; log(S, p.name + " mentors a Jr " + dn(jr.disc) + " to Sr"); }
      break;
    }
  }
  log(S, p.name + " places " + w.lvl + " " + as + " on " + spot.row + " (" + (spot.fx || spot.note || "") + ")" + srb + (M ? " +" + M + "M" : ""));
  return { ok: true };
}

/* ============================================================
   BUILD / HIRE / REST helpers
   ============================================================ */
function parseBuild(str) {
  const parts = str.split("+"); const m = parts[0].match(/^(\d+)([MG])$/);
  let cost = parseInt(m[1], 10); if (m[2] === "M" && E.sysCostMult && E.sysCostMult !== 1) cost = Math.max(1, Math.round(cost * E.sysCostMult));
  return { cost, cur: m[2], reqs: parts.slice(1).map(x => DISC_ALIAS[x] || x) };
}
E.parseBuild = parseBuild;
E.srDiscount = function (S, p) { return p && p.rs ? Math.max(0, (p.rs.srPlaced || 0) * (S.cfg.srBuildDiscount || 0)) : 0; };
E.resTotal = function (p) { return RES.reduce((t, k) => t + (p[k] || 0), 0); };
/* A system's printed cost "4M+Eng+QA" is paid in skills of the roles it needs: the total is split evenly across their categories (the first category gets any odd unit). */
/* synergy: a system's main skill is the one its printed cost asks for most (ties: first role listed). */
E.sysMainRes = function (def) {
  const b = parseBuild(def.build), need = E.buildNeed(b); let best = null;
  RES.forEach(k => { if (need[k] > 0 && (best === null || need[k] > need[best])) best = k; });
  return best;
};
E.buildNeed = function (b) {
  const need = { ideas: 0, code: 0, process: 0, buzz: 0 }; if (b.cur !== "M") return need;
  const cats = []; b.reqs.forEach(r => { const c = CAT_OF(r); if (!cats.includes(c)) cats.push(c); });
  if (!cats.length) return need;
  cats.forEach((c, i) => { need[RES_OF[c]] += Math.floor(b.cost / cats.length) + (i < b.cost % cats.length ? 1 : 0); });
  return need;
};
/* Full price of building a system for this player: skills to pay, shortfall covered by Gold, and Gold. R&D lowers the total (never below 1), shortfall first. */
E.buildCost = function (S, p, def, free) {
  const b = parseBuild(def.build), need = E.buildNeed(b); const orig = RES.reduce((t, k) => t + need[k], 0);
  let disc = 0;
  if (b.cur === "M" && !free && p && p.rdDisc > 0) disc = Math.min(p.rdDisc, Math.max(0, orig - 1));
  for (let i = 0; i < disc; i++) {
    let best = null; RES.forEach(k => { if (need[k] > 0 && (best === null || (need[k] - (p[k] || 0)) > (need[best] - (p[best] || 0)) || ((need[k] - (p[k] || 0)) === (need[best] - (p[best] || 0)) && need[k] > need[best]))) best = k; });
    need[best]--;
  }
  const total = RES.reduce((t, k) => t + need[k], 0), short = {}, pay = {}; let shortN = 0;
  RES.forEach(k => { short[k] = Math.max(0, need[k] - ((p && p[k]) || 0)); pay[k] = need[k] - short[k]; shortN += short[k]; });
  const cover = Math.min(shortN, S.cfg.resSubMax || 0);
  const gold = b.cur === "M" ? Math.max(0, Math.round(total * (S.cfg.sysGoldMult || 0)) - E.srDiscount(S, p)) + (S.cfg.sysGoldAdd || 0) : 0;
  return { b, need, total, orig, disc, short, shortN, pay, subGold: shortN * (S.cfg.resSubGold || 0), gold: gold + shortN * (S.cfg.resSubGold || 0), baseGold: gold, coverable: shortN <= (S.cfg.resSubMax || 0), cover };
};
E.buildGold = function (S, def, p) { return E.buildCost(S, p, def, false).gold; };
E.resText = function (o) { return RES.filter(k => o[k] > 0).map(k => o[k] + " " + RES_NAME[k]).join(" + ") || "nothing"; };
function spendRes(S, p, n) { for (let i = 0; i < n; i++) { let big = RES[0]; RES.forEach(k => { if (p[k] > p[big]) big = k; }); p[big]--; } }
function maxBuilds(S, p) { return S.cfg.buildsPerRound; }
/* rounds until a bought system is finished. Crunch (Gold or fatigue, or free after R&D) is the fast option. */
/* Rounds until a system is ready. Team rounds (bt, 1-3 by system power) are the rounds its workers stay committed; ready = this round + 1 + team rounds. A rush removes one team round. */
E.buildRounds = function (S, p, crunch, def) { const bt = def && def.bt != null ? def.bt : (S.cfg.buildDelay || 2) - 1; const rush = crunch || (p && p.rd && S.cfg.rdCrunch); return Math.max(0, bt - (rush ? (S.cfg.rushRounds == null ? 1 : S.cfg.rushRounds) : 0)); };
E.buildDelay = function (S, p, crunch, def) { return 1 + E.buildRounds(S, p, crunch, def); };
E.crunchWorker = function (p) { const c = p.workers.filter(w => w.fat < 2).sort((x, y) => x.fat - y.fat || x.id - y.id); return c[0] || null; };
E.canBuild = function (S, pi, name, free, crunch) {
  const p = P(S, pi), def = sysDef(S, name); if (!def) return { ok: false, reason: "Unknown tile" };
  const nb = p.building || [];
  {
    const d = E.buildDelay(S, p, crunch, def);
    if (S.round + d > PHASE_ENDS[3]) return { ok: false, reason: (crunch || (p.rd && S.cfg.rdCrunch)) ? "Would not finish before the game ends" : "Too late for a normal build" + (S.round + (S.cfg.crunchDelay || 1) <= 12 ? " (rush it with crunch)" : " (nothing finishes in time)") };
    if (crunch === "gold" && !(p.rd && S.cfg.rdCrunch) && p.gold < (S.cfg.crunchGold == null ? 2 : S.cfg.crunchGold) + E.buildCost(S, p, def, free).gold) return { ok: false, reason: "Crunch costs " + (S.cfg.crunchGold == null ? 2 : S.cfg.crunchGold) + "G more" };
    if (crunch === "fat" && !(p.rd && S.cfg.rdCrunch) && !E.crunchWorker(p)) return { ok: false, reason: "Every worker is already worn out" };
  }
  if (!S.sysAvail[name]) return { ok: false, reason: "Already taken" };
  if (S.cfg.marketSize && !(S.market[def.cat] || []).includes(name)) return { ok: false, reason: "Not in the market right now" };
  if (!free && p.builds >= maxBuilds(S, p)) return { ok: false, reason: "Build limit reached" };
  if (S.cfg.maxSystems && p.systems.length + nb.length >= S.cfg.maxSystems) return { ok: false, reason: "Studio is full (" + S.cfg.maxSystems + " systems)" };
  if (sysCount(p, def.cat) + nb.filter(x => x.cat === def.cat).length >= S.cfg.slotsPerCategory) return { ok: false, reason: def.cat + " slots full" };
  const b = parseBuild(def.build);
  if (b.reqs.length && !crewFor(p, b.reqs)) { return ownsDiscs(p, b.reqs) ? { ok: false, reason: "Workers busy building: need free " + b.reqs.map(r => (D0.disciplines[r] || {}).name || r).join(" and ") } : { ok: false, reason: "Needs workers: " + b.reqs.map(r => (D0.disciplines[r] || {}).name || r).join(" and ") }; }
  const bc = E.buildCost(S, p, def, free);
  if (b.cur === "M" && !free && !bc.coverable) return { ok: false, reason: "You have " + RES.filter(k => bc.short[k] > 0).map(k => (bc.need[k] - bc.short[k]) + " of " + bc.need[k] + " " + RES_NAME[k]).join(", ") };
  if (b.cur === "G" && p.gold < b.cost) return { ok: false, reason: "Needs " + b.cost + "G" };
  const bg = free ? 0 : bc.gold;
  if (bg && p.gold < bg) return { ok: false, reason: "Needs " + bg + " Gold" };
  return { ok: true };
};
function doBuild(S, pi, name, useFree, crunchIn) {
  const p = P(S, pi); const free = !!useFree && p.freeBuilds > 0;
  const crunch = crunchIn === "gold" || crunchIn === "fat" ? crunchIn : null;
  const chk = E.canBuild(S, pi, name, free, crunch); if (!chk.ok) return err(chk.reason);
  const def = sysDef(S, name), b = parseBuild(def.build);
  const bc = E.buildCost(S, p, def, free);
  if (b.cur === "M") { if (!free) { RES.forEach(k => { p[k] -= bc.pay[k]; }); p.rs.spentRes += bc.total; } p.cs.noGoldBuilds++; if (bc.orig >= 5) p.cs.bigBuild = true; }
  else { gain(S, pi, "gold", -b.cost); if (def.cat === "Reach") p.cs.reachGold += b.cost; }
  if (!free && b.cur === "M") { if (bc.gold) { gain(S, pi, "gold", -bc.gold); p.rs.spent += bc.gold; } if (bc.shortN) log(S, p.name + " covers " + bc.shortN + " missing skill(s) with " + bc.subGold + "G"); }
  if (free) { p.freeBuilds--; } else { p.builds++; if (p.rdDisc) { log(S, p.name + " uses the R&D discount (-" + p.rdDisc + " skills)"); p.rdDisc = 0; } }
  S.sysAvail[name] = false; if (S.market && S.market[def.cat]) { S.market[def.cat] = S.market[def.cat].filter(x => x !== name); refillMarket(S); }
  {
    const rush = !!crunch || (p.rd && S.cfg.rdCrunch), d = E.buildDelay(S, p, crunch, def), crewIds = E.buildRounds(S, p, crunch, def) > 0 ? (crewFor(p, b.reqs) || []) : [];
    crewIds.forEach(id => { p.workers.find(q => q.id === id).build = name; });
    if (crunch === "gold" && !(p.rd && S.cfg.rdCrunch)) { const cg = S.cfg.crunchGold == null ? 2 : S.cfg.crunchGold; gain(S, pi, "gold", -cg); p.rs.spent += cg; }
    else if (crunch === "fat" && !(p.rd && S.cfg.rdCrunch)) { const cw = E.crunchWorker(p); cw.fat = Math.min(2, cw.fat + 1); log(S, p.name + " crunches: " + cw.lvl + " " + dn(cw.disc) + " is more tired"); }
    p.building.push({ name, cat: def.cat, rdy: S.round + d, rush, crew: crewIds }); p.rs.crunched = (p.rs.crunched || 0) + (rush ? 1 : 0); if (rush) p.cs.crunched = (p.cs.crunched || 0) + 1;
    log(S, p.name + " starts building " + name + " (" + def.cat + "), ready in round " + (S.round + d) + (crewIds.length ? " (crew: " + crewIds.map(id => { const q = p.workers.find(z => z.id === id); return q.lvl + " " + q.disc; }).join(", ") + ")" : "") + (rush ? " (crunched)" : "") + (free ? " FREE" : ""));
    return { ok: true };
  }
  p.systems.push({ name, cat: def.cat, t: false }); p.rs.builds++;
  if (def.debt) gain(S, pi, "debt", def.debt);
  if (def.once) applyFx(S, pi, E.parseEffect(def.once), 1, {});
  log(S, p.name + " builds " + name + " (" + def.cat + ")" + (free ? " FREE" : ""));
  return { ok: true };
}

/* ============================================================
   ACTIONS
   ============================================================ */
function err(m) { return { ok: false, error: m }; }
E.act = function (S, a) {
  if (S.over) return err("Game over");
  if (a && a.type === "endgame") { log(S, "The game was ended early"); endGame(S); return { ok: true }; }
  const actor = E.currentActor(S);
  const r = S.dq.length ? resolveDecision(S, a) : stepAction(S, a, actor);
  if (r && r.ok) E.advance(S);
  return r;
};

function stepAction(S, a, actor) {
  const pi = a.p; const p = P(S, pi);
  if (pi !== actor) return err("Not your turn");
  switch (S.step) {
    case "place": {
      if (a.type === "pass") { S.passed.push(pi); return { ok: true }; }
      if (a.type === "recruit") {
        const c = E.canRecruit(S, pi, a.idx); if (!c.ok) return err(c.reason);
        const o = S.recruit[a.idx]; gain(S, pi, "gold", -c.cost); if (p.hireDiscount > 0) p.hireDiscount--;
        o.by = pi; p.workers.push({ id: S.wid++, disc: o.disc, lvl: "Jr", fat: 0, placed: false, as: null, worked: false }); p.recruited = (p.recruited || 0) + 1; p.rs.hires++; p.cs.recruits = (p.cs.recruits || 0) + 1;
        log(S, p.name + " recruits a Junior " + dn(o.disc) + " (" + c.cost + "G)"); bumpPlace(S); return { ok: true };
      }
      if (a.type === "buyws") {
        const c = E.canBuyWs(S, pi); if (!c.ok) return err(c.reason);
        gain(S, pi, "gold", -c.cost); p.ws++; p.rs.wsBought = (p.rs.wsBought || 0) + 1; log(S, p.name + " powers up a workstation (" + c.cost + "G, " + p.ws + " this round)"); return { ok: true };
      }
      if (a.type !== "place") return err("Place a worker or pass");
      const r = doPlace(S, pi, a.worker, a.target, a); if (r.ok) bumpPlace(S); return r;
    }
    case "rest": return restAction(S, a, p);
  }
  return err("Nothing to do");
}

function claimMile(S, p, a) {
  const pi = p.id;
  const idx = p.miles.indexOf(a.mile); if (idx < 0) return err("Not in hand");
  const m = S.data.milestones[a.mile]; if (!MILE_CHECK[m.name] || !mileOpen(S, m) || !MILE_CHECK[m.name](S, p)) return err(!mileOpen(S, m) ? "Not in this milestone's phase" : "Requirement not met");
  p.miles.splice(idx, 1); p.claimed.push(a.mile); S._nt = 1; gain(S, pi, "gold", m.gold); S._nt = 0; p.rs.cashed++; p.cs.cashedTotal++;
  drawMile(S, pi, true); log(S, p.name + " cashes in " + m.name + " (+" + m.gold + "G)"); return { ok: true };
}

function restAction(S, a, p) {
  const pi = p.id, c = S.cfg;
  switch (a.type) {
    case "claim": return claimMile(S, p, a);
    case "done": S.cur++; return { ok: true };
    case "build": return doBuild(S, pi, a.name, a.free, a.crunch);
    case "refresh": {
      const def = sysDef(S, a.name); if (!def || !S.cfg.marketSize || !(S.market[def.cat] || []).includes(a.name)) return err("Pick a market tile");
      if ((p.refreshed || 0) >= (S.cfg.marketRefreshesPerRound || 1)) return err("Already refreshed this round");
      if (p.gold < S.cfg.marketRefreshGold) return err("Needs " + S.cfg.marketRefreshGold + "G");
      const dk = S.decks.sys[def.cat]; if (!dk.length) return err("No more " + def.cat + " tiles");
      gain(S, pi, "gold", -S.cfg.marketRefreshGold); p.refreshed = (p.refreshed || 0) + 1;
      S.market[def.cat] = S.market[def.cat].filter(x => x !== a.name); dk.unshift(a.name); refillMarket(S);
      log(S, p.name + " refreshes the " + def.cat + " market (" + a.name + " is replaced)"); return { ok: true };
    }
    case "promote": {
      const w = p.workers.find(x => x.id === a.worker); if (!w || w.lvl !== "Jr") return err("Pick a Junior worker");
      if (!srAllowed(S)) return err("No Senior workers in Concept");
      if (p.promos >= c.promotionsPerRest) return err("Promotion limit reached");
      { const why = trainPromoWhy(S, w); if (why) return err(why); }
      const cost = E.promoGold(S); if (p.gold < cost) return err("Needs " + cost + "G");
      gain(S, pi, "gold", -cost); w.lvl = "Sr"; w.trained = 0; p.promos++; p.cs.promotions++; log(S, p.name + " promotes " + dn(w.disc) + " to Sr"); return { ok: true };
    }
    case "train": {
      const w = p.workers.find(x => x.id === a.worker); if (!w || w.lvl !== "Jr") return err("Pick a Junior worker");
      if (S.round >= PHASE_ENDS[3]) return err("The game ends this round: no time to train");
      if (w.placed || w.build) return err("A worker who worked or is building cannot train this round");
      if (w.training) return err("Already training");
      if ((p.rs.trains || 0) >= c.trainsPerRest) return err("Training limit reached this round");
      if (p.gold < c.trainCost) return err("Needs " + c.trainCost + "G");
      gain(S, pi, "gold", -c.trainCost); gain(S, pi, "culture", c.trainCulture); w.training = true; w.trained = (w.trained || 0) + 1; w.trainLeft = trainDur(S); p.rs.trains = (p.rs.trains || 0) + 1; p.cs.trainings = (p.cs.trainings || 0) + 1;
      log(S, p.name + " trains a Junior " + dn(w.disc) + " (" + w.trained + "/" + c.trainNeeded + "): -" + c.trainCost + "G, Culture +" + c.trainCulture + ". They sit out the next " + (trainDur(S) > 1 ? trainDur(S) + " rounds" : "round")); return { ok: true };
    }
  }
  return err("Invalid rest action");
}

/* ---------- Decisions ---------- */
function resolveDecision(S, a) {
  const d = S.dq[0]; const p = a.p; if (p !== d.p) return err("Not your decision");
  switch (d.t) {
    case "keepObj": {
      if (a.type !== "keepObj") return err("Choose objectives");
      Object.keys(d.opts).forEach(t => {
        const keep = (a.picks && a.picks[t] != null) ? a.picks[t] : d.opts[t][0];
        const ks = [].concat(keep).slice(0, S.cfg.objKeep);
        d.opts[t].forEach(id => { if (ks.includes(id)) P(S, p).objectives.push(id); else S.decks.obj[t].unshift(id); });
      });
      S.dq.shift(); log(S, P(S, p).name + " chose objectives"); return { ok: true };
    }
    case "bid": {
      if (a.type !== "bid") return err("Place a bid");
      const amt = Math.floor(a.amount); const pl = P(S, p);
      if (!(amt >= 0)) return err("Bid must be 0 or more"); if (amt > pl.gold) return err("You only have " + pl.gold + "G");
      S.bids[p] = amt; S.dq.shift(); return { ok: true };
    }
    case "choose": {
      if (a.type !== "choose") return err("Choose an option");
      const opt = d.options.find(o => o.k === a.k); if (!opt) return err("Bad option"); if (opt.disabled) return err(opt.reason || "Unavailable");
      S.dq.shift(); CRISIS_CHOICE[d.card](S, p, a.k, d); return { ok: true };
    }
    case "pickWorker": {
      if (a.type !== "pickWorker") return err("Pick a worker");
      const w = P(S, p).workers.find(x => x.id === a.worker); if (!w) return err("Pick a worker");
      if (d.srOnly && w.lvl !== "Sr") return err("Pick a Senior worker");
      S.dq.shift(); removeWorker(S, p, w.id); log(S, P(S, p).name + " loses " + w.lvl + " " + dn(w.disc) + " (" + d.reason + ")"); return { ok: true };
    }
    case "raidHire": {
      if (a.type === "skip") { S.dq.shift(); return { ok: true }; }
      if (a.type !== "raid") return err("Choose a worker to hire");
      const pl = P(S, p); const lvl = a.lvl === "Sr" && S.pool.length ? "Sr" : "Jr"; if (lvl === "Sr" && !srAllowed(S)) return err("No Sr yet");
      const cost = Math.floor((lvl === "Jr" ? S.cfg.jrCost : S.cfg.srCost) / 2); if (pl.gold < cost) return err("Needs " + cost + "G");
      const pi = S.pool.findIndex(x => x.disc === a.disc && x.lvl === lvl);
      if (pi < 0 && S.pool.length) return err("Not in released pile"); if (pi >= 0) S.pool.splice(pi, 1);
      gain(S, p, "gold", -cost); pl.workers.push({ id: S.wid++, disc: a.disc, lvl, fat: 0, placed: false, as: null });
      log(S, pl.name + " hires " + lvl + " " + dn(a.disc) + " from the raid for " + cost + "G"); S.dq.shift(); return { ok: true };
    }
    case "pivot": {
      if (a.type !== "pivot") return err("Choose"); const pl = P(S, p);
      if (a.replace) { const i = pl.objectives.indexOf(d.old); if (i >= 0) pl.objectives.splice(i, 1); }
      pl.objectives.push(d.fresh); S.dq.shift(); log(S, pl.name + " pivots Platform"); return { ok: true };
    }
    case "dropObj": {
      if (a.type !== "dropObj") return err("Choose an objective to remove"); const pl = P(S, p);
      if (!pl.objectives.includes(a.obj)) return err("Not your objective");
      pl.dropped.push(a.obj); pl.objectives.splice(pl.objectives.indexOf(a.obj), 1); d.left--; if (d.left <= 0 || !pl.objectives.length) S.dq.shift();
      log(S, pl.name + " removes an objective from scoring"); return { ok: true };
    }
    case "keepMile": {
      if (a.type !== "keepMile") return err("Choose a milestone");
      const pl = P(S, p); const keep = [].concat(a.keep != null ? a.keep : d.opts[0]).slice(0, d.keep);
      d.opts.forEach(id => { if (keep.includes(id)) pl.miles.push(id); else S.decks.mile.unshift(id); }); S.dq.shift(); return { ok: true };
    }
    case "patch": {
      if (a.type === "patchDone") { S.dq.shift(); return { ok: true }; }
      if (a.type !== "patchFix") return err("Spend skills or finish");
      const pl = P(S, p); const fix = S.data.crisis.find(c => c.id === "patch").params.fixes[a.idx]; if (!fix) return err("Bad fix");
      if (E.resTotal(pl) < fix[0]) return err("Needs " + fix[0] + " skills");
      for (let i = 0; i < fix[0]; i++) { let big = RES[0]; RES.forEach(k => { if (pl[k] > pl[big]) big = k; }); pl[big]--; }
      gain(S, p, "debt", -fix[1]);
      log(S, pl.name + " spends " + fix[0] + " skills: -" + fix[1] + " Debt"); return { ok: true };
    }
  }
  return err("Unknown decision");
}

/* ============================================================
   AUTO decisions
   ============================================================ */
const AUTO = {
  auction(S, args) {
    const bids = S.bids; const ids = S.players.map(p => p.id);
    ids.sort((a, b) => ((bids[b] || 0) - (bids[a] || 0)) || (P(S, a).workers.length - P(S, b).workers.length) || (rnd(S) - 0.5));
    const win = ids[0], second = ids[1];
    log(S, "AUCTION bids: " + ids.map(i => P(S, i).name + " " + (bids[i] || 0) + "G").join(", "));
    CRISIS_AUCTION[args.card](S, win, bids[win] || 0, second, bids[second] || 0);
    S.bids = {};
  },
  scheduleEnd() {}
};

/* ============================================================
   CRISIS CARDS
   ============================================================ */
function startCrisis(S, card) {
  log(S, "CRISIS: " + card.name + ": " + card.text);
  const order = S.order.slice();
  CRISIS_START[card.id](S, card, order);
}
const CRISIS_START = {
  investor(S, c) { S.invest = Object.assign({ rewarded: false }, c.params); },
  talentwar(S, c) { S.mod.hireAdd = c.params.add; S.mod.protect = c.params.protect; },
  platform(S, c, order) { order.forEach(pi => S.dq.push({ t: "choose", p: pi, card: "platform", options: c.options.map(o => Object.assign({}, o)) })); },
  earlyaccess(S, c, order) { S.bids = {}; order.forEach(pi => S.dq.push({ t: "bid", p: pi, purpose: "auction", card: c.id })); S.dq.push({ t: "auto", fn: "auction", args: { card: c.id } }); },
  raid(S, c, order) { order.forEach(pi => S.dq.push({ t: "raidHire", p: pi })); },
  creep(S, c, order) { order.forEach(pi => S.dq.push({ t: "choose", p: pi, card: "creep", options: c.options.map(o => Object.assign({}, o)) })); },
  departure(S, c, order) {
    order.forEach(pi => { const p = P(S, pi); if ((p.burnout || 0) >= 4 && p.workers.some(w => w.lvl === "Sr")) S.dq.push({ t: "pickWorker", p: pi, srOnly: true, reason: "Key Employee Departure" }); });
  },
  conference(S, c) { S.sched.push({ kind: "conference", round: S.round, params: c.params }); },
  breakthrough(S, c, order) { S.bids = {}; order.forEach(pi => S.dq.push({ t: "bid", p: pi, purpose: "auction", card: c.id })); S.dq.push({ t: "auto", fn: "auction", args: { card: c.id } }); },
  burnout(S, c, order) {
    order.forEach(pi => {
      const p = P(S, pi); const over = p.workers.filter(w => w.fat >= 2).length, tired = p.workers.filter(w => w.fat >= 1).length;
      if (tired >= c.params.tired) { gain(S, pi, "culture", -1); log(S, p.name + " has " + tired + " tired workers: -1 Culture"); }
      if (over >= c.params.overTired && !protectedFromCrisis(S, p)) S.dq.push({ t: "pickWorker", p: pi, reason: "Burnout Wave" });
    });
  },
  bug(S, c, order) {
    const mx = Math.max.apply(null, S.players.map(p => p.debt));
    order.filter(pi => P(S, pi).debt === mx).forEach(pi => {
      const p = P(S, pi); const opts = c.options.map(o => Object.assign({}, o));
      if (p.gold < 8 || !p.workers.length) { opts[0].disabled = true; opts[0].reason = p.workers.length ? "Needs 8G" : "No workers"; }
      S.dq.push({ t: "choose", p: pi, card: "bug", options: opts });
    });
  },
  viral(S, c, order) { S.bids = {}; order.forEach(pi => S.dq.push({ t: "bid", p: pi, purpose: "auction", card: c.id })); S.dq.push({ t: "auto", fn: "auction", args: { card: c.id } }); },
  buyout(S, c, order) { order.forEach(pi => S.dq.push({ t: "choose", p: pi, card: "buyout", options: c.options.map(o => Object.assign({}, o)) })); },
  award(S, c) { S.sched.push({ kind: "award", round: S.round, params: c.params }); },
  patch(S, c, order) { order.forEach(pi => S.dq.push({ t: "patch", p: pi })); }
};
const CRISIS_CHOICE = {
  platform(S, p, k) {
    const pl = P(S, p);
    if (k === "C") { gain(S, p, "mktg", 2); gain(S, p, "culture", -1); log(S, pl.name + " hedges: +2 Mktg, -1 Culture"); }
    else if (k === "B") {
      const fresh = S.decks.obj.Platform.pop(); const old = pl.objectives.find(id => S.data.objectives[id].type === "Platform");
      if (fresh == null) { log(S, "Platform deck empty"); return; }
      if (old == null) pl.objectives.push(fresh); else S.dq.unshift({ t: "pivot", p, old, fresh });
    } else log(S, pl.name + " stays the course");
  },
  creep(S, p, k) {
    const pl = P(S, p);
    if (k === "B") { gain(S, p, "prod", 3); gain(S, p, "debt", 5); }
    if (k === "C") { gain(S, p, "hype", -2); gain(S, p, "debt", -3); }
    if (k === "D") { gain(S, p, "prod", 2); pl.flags.noMentor = true; }
    log(S, pl.name + " chooses " + k + " (Feature Creep)");
  },
  bug(S, p, k) {
    const pl = P(S, p);
    if (k === "A") { gain(S, p, "gold", -8); S.dq.unshift({ t: "pickWorker", p, reason: "Last-Minute Bug fix" }); }
    if (k === "B") { pl.flags.doubleThresh = true; log(S, pl.name + " ships anyway: penalties doubled"); }
    if (k === "C") { pl.flags.skipLaunch = true; log(S, pl.name + " delays: skips Round 12 placement"); }
  },
  buyout(S, p, k, d) {
    const pl = P(S, p); const cp = S.data.crisis.find(c => c.id === "buyout").params;
    if (k === "accept") { const bvp = S.cfg.buyoutVP != null ? S.cfg.buyoutVP : cp.vp; addVP(S, pl.id, bvp); log(S, pl.name + " accepts the buyout: +" + bvp + " VP"); if (pl.objectives.length) S.dq.unshift({ t: "dropObj", p, left: Math.min(cp.remove, pl.objectives.length) }); }
  },
  raid() {}
};
const CRISIS_AUCTION = {
  earlyaccess(S, w, bid, s, sbid) {
    const cp = S.data.crisis.find(c => c.id === "earlyaccess").params;
    gain(S, w, "gold", -bid); gain(S, w, "gold", cp.winGold); gain(S, w, "hype", cp.winHype); gain(S, s, "gold", cp.secondGold);
    log(S, P(S, w).name + " wins Early Access (pays " + bid + "G): +" + cp.winGold + "G +" + cp.winHype + " Hype; " + P(S, s).name + " +" + cp.secondGold + "G");
  },
  breakthrough(S, w, bid) { gain(S, w, "gold", -bid); P(S, w).freeBuilds++; log(S, P(S, w).name + " wins Tech Breakthrough (pays " + bid + "G): 1 free system"); },
  viral(S, w, bid, s) {
    const cp = S.data.crisis.find(c => c.id === "viral").params;
    gain(S, w, "gold", -bid); gain(S, w, "hype", cp.winHype); gain(S, s, "hype", cp.secondHype);
    log(S, P(S, w).name + " wins Viral Moment (pays " + bid + "G): +" + cp.winHype + " Hype; " + P(S, s).name + " +" + cp.secondHype + " Hype");
  }
};
// ranking helper with tie-splitting (round down)
function rankAward(S, key, amounts) {
  const vals = S.players.map(p => ({ id: p.id, v: key(p) })).sort((a, b) => b.v - a.v);
  const out = {}; let i = 0;
  while (i < vals.length) {
    let j = i; while (j + 1 < vals.length && vals[j + 1].v === vals[i].v) j++;
    let sum = 0; for (let k = i; k <= j; k++) sum += amounts[k] || 0;
    const share = Math.floor(sum / (j - i + 1)); for (let k = i; k <= j; k++) out[vals[k].id] = share; i = j + 1;
  }
  return { out, vals };
}
function conferenceResolve(S, h) {
  const r = rankAward(S, p => p.mktg, [h.params.first, h.params.second]);
  Object.keys(r.out).forEach(id => { if (r.out[id]) gain(S, +id, "hype", r.out[id]); });
  const min = Math.min.apply(null, S.players.map(p => p.mktg));
  S.players.filter(p => p.mktg === min && S.players.length > 1 && !(S.players.every(q => q.mktg === min))).forEach(p => gain(S, p.id, "culture", h.params.last));
  log(S, "INDUSTRY CONFERENCE resolved");
}
function awardResolve(S, h) {
  const r = rankAward(S, p => p.hype, h.params.v);
  Object.keys(r.out).forEach(id => { addVP(S, +id, r.out[id]); });
  log(S, "AWARD NOMINATION: " + S.players.map(p => p.name + " +" + (r.out[p.id] || 0) + "VP").join(", "));
}

/* ============================================================
   MILESTONE REQUIREMENTS (all 40 auto-checked)
   ============================================================ */
const mkt = ["PX","DATA","ADV"];
const nSys = p => p.systems.length;
const catSet = p => new Set(p.systems.map(s => s.cat)).size;
const jr = p => p.workers.filter(w => w.lvl === "Jr").length, sr = p => p.workers.filter(w => w.lvl === "Sr").length;
const MILE_CHECK = {
  "First Promotion": (S, p) => p.cs.promotions >= 1,
  "Specialist Team": (S, p) => DISCS.some(d => p.workers.filter(w => w.disc === d).length >= 3),
  "Balanced Studio": (S, p) => ["Creative", "Development", "Operations", "Marketing"].filter(c => p.workers.filter(w => CAT_OF(w.disc) === c).length >= 2).length >= 3,
  "Exactly Five": (S, p) => p.workers.length === 5,
  "Lean Operation": (S, p) => p.rs.placed === 2 && p.workers.length >= 5,
  "All-Star Team": (S, p) => sr(p) >= 3,
  "Hiring Spree": (S, p) => p.workers.length >= 6,
  "Diverse Perspectives": (S, p) => new Set(p.workers.map(w => w.disc)).size >= 7,
  "Talent Scout": (S, p) => (p.cs.recruits || 0) >= 5,
  "Mentor Program": (S, p) => jr(p) >= 2 && sr(p) >= 2,
  "Budget Conscious": (S, p) => p.gold <= 2 && p.rs.spent >= 6,
  "Savings Account": (S, p) => p.gold >= 20,
  "Big Spender": (S, p) => p.rs.spent >= 12,
  "Gold Rush": (S, p) => p.rs.gained >= 8,
  "Investment Return": (S, p) => (p.cs.trigTotal || 0) >= 3,
  "Efficient Engine": (S, p) => p.cs.bigBuild,
  "Production Surge": (S, p) => p.rs.spentRes >= 5,
  "Bootstrapped": (S, p) => p.cs.noGoldBuilds >= 3,
  "Liquidation": (S, p) => p.rs.discards >= 2,
  "Double Recruit": (S, p) => p.recruited >= 2,
  "Milestone Hunter": (S, p) => (p.cs.cashedTotal || 0) >= 3,
  "Foundation": (S, p) => nSys(p) >= 1,
  "Category Focus": (S, p) => CATS.some(c => sysCount(p, c) >= 3),
  "Balanced Build": (S, p) => catSet(p) >= 3,
  "Quality First": (S, p) => p.debt === 0 && p.systems.length >= 2 && p.prod >= 5,
  "Tech Debt Accepted": (S, p) => p.debt === 5,
  "Rapid Prototype": (S, p) => nSys(p) >= 2,
  "Progress Push": (S, p) => p.prod >= 38,
  "Feature Complete": (S, p) => nSys(p) >= 4,
  "System Architect": (S, p) => nSys(p) >= 5,
  "Debt Recovery": (S, p) => p.rs.debtRemoved >= 3 && p.rs.debtStart >= 5,
  "Going Viral": (S, p) => p.hype >= 15,
  "Hype Train": (S, p) => p.rs.hypeGained >= 7,
  "Stealth Launch": (S, p) => p.hype === 0 && p.prod >= 10,
  "Marketing Push": (S, p) => p.mktg >= 20,
  "Influencer Network": (S, p) => sysCount(p, "Reach") >= 2,
  "Community Built": (S, p) => p.workers.filter(w => w.disc === "PX").length >= 2,
  "Ad Blitz": (S, p) => p.rs.hypeGained >= 10,
  "Peak Hype": (S, p) => p.hype >= 30,
  "Sustained Buzz": (S, p) => p.cs.hypeStreak >= 3,
  "Market Leader": (S, p) => p.mktg >= 6 && S.players.every(q => q.id === p.id || q.mktg < p.mktg)
};
E.MILE_CHECK = MILE_CHECK;
/* A milestone can only be completed inside its phase window (m.phases); a card whose window has passed is swapped out at the next phase start. */
const mileOpen = (S, m) => !m.phases || !m.phases.length || m.phases.includes(S.phase);
const mileExpired = (S, m) => !!(m.phases && m.phases.length) && Math.max.apply(null, m.phases) < S.phase;
E.mileWindow = (S, m) => mileOpen(S, m) ? "open" : mileExpired(S, m) ? "expired" : "later";
E.milestoneMet = (S, pi, idx) => { const m = S.data.milestones[idx]; const f = MILE_CHECK[m.name]; return !!(f && mileOpen(S, m) && f(S, P(S, pi))); };

/* ============================================================
   OBJECTIVE REQUIREMENTS (parsed from card text)
   ============================================================ */
const WNAME = { Engineer:"ENG", Artist:"ART", Art:"ART", Design:"DES", Designer:"DES", Analytics:"DATA", DATA:"DATA", PX:"PX", Community:"PX", Adv:"ADV", Advertising:"ADV", QA:"QA", Quality:"QA" };
function reqCheck(S, p, r) {
  let m;
  if ((m = r.match(/^(\d+)\+\s*(Progress|Product|Marketing|Mktg)(?: value)?$/))) return (/^Pro/.test(m[2]) ? p.prod : p.mktg) >= +m[1];
  if ((m = r.match(/^(\d+)\+\s*Hype(?: at Launch)?$/))) return p.hype >= +m[1];
  if ((m = r.match(/^Debt\s*<\s*(\d+)%$/))) return debtPct(S, p) < +m[1];
  if ((m = r.match(/^(\d+)%\s*Tech Debt at Launch$/))) return debtPct(S, p) <= +m[1] && p.debt === 0;
  if ((m = r.match(/^\+(\d+)\s*Culture$/))) return cul(S, p) >= +m[1];
  if ((m = r.match(/^(\d+)\+\s*(Innovation|Stability|Reach|Revenue)\s*systems$/))) return sysCount(p, m[2]) >= +m[1];
  if ((m = r.match(/^(\d+)\+\s*total systems built$/))) return p.systems.length >= +m[1];
  if ((m = r.match(/^(\d+)\+\s*systems each category$/))) return ["Innovation","Stability","Reach"].every(c => sysCount(p, c) >= +m[1]);
  if ((m = r.match(/^(\d+)\+\s*Sr workers$/))) return sr(p) >= +m[1];
  if ((m = r.match(/^(\d+) or fewer workers$/))) return p.workers.length <= +m[1];
  if ((m = r.match(/^(\d+)\+\s*(\w+)\s*workers?$/))) { const d = WNAME[m[2]]; return d ? countWeighted(p, d) >= +m[1] : false; }
  if ((m = r.match(/^Highest (Progress|Product|Marketing) Share %$/))) { const k = /^Pro/.test(m[1]) ? "prod" : "mktg"; return p[k] > 0 && S.players.every(q => q.id === p.id || q[k] < p[k]); }
  if (/^Launch by Round/.test(r)) return false; // cannot be satisfied: game always runs to Round 12 (flagged in review)
  return false;
}
E.objectiveStatus = function (S, pi, idx) {
  const o = S.data.objectives[idx], p = P(S, pi);
  const reqs = o.reqs.map(r => ({ r, ok: reqCheck(S, p, r) })); return { met: reqs.every(x => x.ok), reqs };
};

/* ============================================================
   SCORING
   ============================================================ */

/* ---------- race scoring (rank based) ---------- */
function rankTable(c, N) { // VP by rank (1 = best) for a track; steeper with raceCurve, pot = racePot per player
  const cur = c.raceCurveByN && c.raceCurveByN[N] != null ? c.raceCurveByN[N] : c.raceCurve, pot = c.racePotByN && c.racePotByN[N] != null ? c.racePotByN[N] : c.racePot;
  const w = []; for (let r = 1; r <= N; r++) w.push(Math.pow(N - r + 1, cur)); const sum = w.reduce((a, b) => a + b, 0);
  return w.map(x => Math.round(pot * N * x / sum));
}
E.rankTable = rankTable;
function rankScore(vals, table, inverse) { // vals: per player value; inverse: lower is better (returns same table, caller negates)
  const N = vals.length, idx = vals.map((v, i) => i).sort((a, b) => inverse ? vals[a] - vals[b] : vals[b] - vals[a]);
  const out = new Array(N).fill(0); let r = 0;
  while (r < N) { let t = r; while (t + 1 < N && vals[idx[t + 1]] === vals[idx[r]]) t++; let sum = 0; for (let k = r; k <= t; k++) sum += table[k]; const each = Math.floor(sum / (t - r + 1)); for (let k = r; k <= t; k++) out[idx[k]] = each; r = t + 1; }
  return out;
}
function lossTable(max, N) { const t = []; for (let k = 0; k < N; k++) t.push(N > 1 ? Math.round(max * (N - 1 - k) / (N - 1)) : 0); return t; } // rank 1 = worst
E.score = function (S) {
  const c = S.cfg, N = S.players.length;
  const pv = S.players.map(q => q.prod), hv = S.players.map(q => q.hype + Math.floor(q.mktg * c.mktgToHype)), dv = S.players.map(q => q.debt);
  const tab = rankTable(c, N), lt = lossTable(c.debtLossByN && c.debtLossByN[N] != null ? c.debtLossByN[N] : c.debtLossMax, N);
  const progRank = rankScore(pv, tab), hypeRank = rankScore(hv, tab), debtRank = rankScore(dv, lt, false).map((x, i) => dv[i] === Math.min.apply(null, dv) ? 0 : x); // best (lowest) Debt, including a tie for it, loses nothing
  return S.players.map((p, pl) => {
    const dp = debtPct(S, p), dbl = p.flags.doubleThresh ? 2 : 1;
    const thr = dp < c.cleanThresh ? "CLEAN" : dp <= c.stdThresh ? "STANDARD" : dp <= c.roughThresh ? "ROUGH" : "BLOCKED";
    const s = {};
    // Race scoring: Progress, Hype and Debt are ranked against the other studios (plus a small linear share of your own Progress/Hype)
    s.prodShare = progRank[pl] + Math.floor(p.prod / c.raceLinDiv); s.mktShare = 0;
    s.hypeStrength = hypeRank[pl] + Math.floor(hv[pl] / c.raceLinDiv);
    s.debtPenalty = -debtRank[pl];
    s.delivery = 0; s.culture = 0; s.launch = 0; s.reach = 0;
    s.burnout = c.burnVP[String(clamp(p.burnout || 0, 0, c.burnMax))] || 0;
    s.objectives = 0; s.synergy = 0; s.objList = [];
    p.objectives.forEach(id => {
      const st = E.objectiveStatus(S, p.id, id), o = S.data.objectives[id];
      s.objList.push({ id, name: o.name, met: st.met, vp: o.vp });
      const unmet = st.reqs.filter(x => !x.ok).length;
      if (!st.met && c.objPartial && st.reqs.length >= 2 && unmet === 1) { const h = Math.floor(o.vp / 2 * c.objVPMult); s.objectives += h; s.objList[s.objList.length - 1].partial = h; }
      if (st.met) {
        s.objectives += o.vp * c.objVPMult;
        if (c.synergyOn) p.systems.forEach(sy => { const d = sysDef(S, sy.name); if (o.res && E.sysMainRes(d) === o.res) s.synergy += d.syn * c.synergyMult; });
      }
    });
    s.systems = Math.round(p.systems.reduce((a, sy) => a + sysDef(S, sy.name).vp, 0) * c.sysVPMult * 10) / 10;
    s.reach = 0;
    if (c.reachMajorVP) { const rc = S.players.map(q => q.systems.filter(y => y.cat === "Reach").length), mx = Math.max.apply(null, rc); if (mx >= 2 && rc[pl] === mx && rc.filter(v => v === mx).length === 1) s.reach = c.reachMajorVP; }
    s.gold = Math.floor(p.gold / c.goldPerVP);
    s.crisis = p.vpAdj;
    s.total = Math.round((s.prodShare + s.hypeStrength + s.debtPenalty + s.burnout + s.objectives + s.synergy + s.systems + s.reach + s.gold + s.crisis) * 10) / 10;
    const effHype = thr === "ROUGH" ? p.hype * (dbl === 2 ? c.roughHypeMult / 2 : c.roughHypeMult) : p.hype;
    s.threshold = thr; s.debtPct = Math.round(dp * 10) / 10; s.hypePct = Math.round(clamp(effHype / c.hypeCap * 100, 0, 100)); s.prodPct = Math.round(clamp(p.prod / c.prodCap * 100, 0, 100));
    return { id: p.id, name: p.name, parts: s, total: s.total };
  });
};
function endGame(S) {
  S.over = true; S.step = "end"; S.scores = E.score(S);
  const sorted = S.scores.slice().sort((a, b) => b.total - a.total || P(S, a.id).debt - P(S, b.id).debt || P(S, b.id).gold - P(S, a.id).gold);
  S.winner = sorted[0].id; log(S, "GAME OVER. Winner: " + P(S, S.winner).name);
}

/* expose small helpers for UI / bots */
E.P = P; E.sysDef = sysDef; E.sysCount = sysCount; E.actsAs = actsAs; E.ownsDiscs = ownsDiscs; E.countWeighted = countWeighted;
E.maxBuilds = maxBuilds; E.srAllowed = srAllowed; E.rint = rint; E.rnd = rnd; E.clamp = clamp; E.CATS = CATS; E.DISCS = DISCS;
E.sysCount = sysCount; E.restAction = restAction;

root.ShipItEngine = E;
if (typeof module !== "undefined") module.exports = E;
})(typeof window !== "undefined" ? window : globalThis);
