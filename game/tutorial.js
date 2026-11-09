function wsPriceText(c){var ord=function(n){return n+(n==2?"nd":n==3?"rd":"th")},from=c.wsLadderFrom!=null?c.wsLadderFrom:c.wsFree,g=[];for(var k=c.wsFree+1;k<=c.wsMax;k++){var pr=c.wsCost+(c.wsStep||0)*Math.max(0,k-1-from),l=g[g.length-1];if(l&&l.pr==pr)l.to=k;else g.push({from:k,to:k,pr:pr})}return g.map(function(x){return (x.from==x.to?"the "+ord(x.from):"the "+ord(x.from)+" to "+ord(x.to))+" <b>"+x.pr+"G</b>"+(x.from==x.to?"":" each")}).join(", ")}
/* ============================================================
   SHIP IT!: GUIDED TUTORIAL
   A scripted first game (You vs. a Rival bot). Pure add-on: the engine is
   untouched. The script is state-driven: each step finishes when the game
   state says so: and a gate blocks off-script actions with a short reason.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {}, E = root.ShipItEngine, D = root.SHIPIT_DATA;
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const U = () => SI.U;
const me = S => S.players[0];
const actorIsMe = S => E.currentActor(S) === 0;
const b = t => "<b>" + t + "</b>";

SI.TUT_SEED = 20261031;
SI.TUT_CONFIG = { gatesRandom: 0, qaAllowedPreProd: 1, closeByN: {} };   // the shipped rules; only the random Industry News closures and random gates are off so the script stays steady

function canBuildAny(S, free) { return S.data.systems.some(d => E.canBuild(S, 0, d.name, free).ok); }
const RANK = { setup: 0, crisis: 0, place: 1, rest: 2 };
// true once the game has moved past `stage` of `round` (monotonic, so early/late states can't skip steps)
const after = (S, stage, round) => S.round > round || (S.round === round && RANK[S.step] > RANK[stage]);
/* step: kind  info = wait for the button · do = wait for game state · free = light hint, no restrictions
         done(S,T)  true when the step is finished
         allow(a,S) returns a message to BLOCK the action, or null to allow                              */
const blk = () => "Press Next first";
/* ---------- tutorial: a full play-through. Every string lives in D.tutorial (Data Studio > Tutorial) ---------- */
let ROWS = null;
function loadRows() {
  ROWS = {}; (D.tutorial || []).forEach(r => { ROWS[r.id] = r; });
  const u = U(), over = u && u.studio && u.studio.data && u.studio.data.tutorial;
  (over || []).forEach(r => { if (r && r.id && ROWS[r.id]) ROWS[r.id] = Object.assign({}, ROWS[r.id], { title: r.title, btn: r.btn, text: r.text }); });
}
const rw = id => { if (!ROWS) loadRows(); return ROWS[id] || { title: "", btn: "", text: "" }; };
const MSG = id => rw(id).text;
// text markup: **bold**, blank line = paragraph, single newline = line break, {token} = live value
function fmt(s, tok) {
  const h = esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
  return h.replace(/\{(\w+)\}/g, (m, k) => tok && tok[k] != null ? tok[k] : m);
}
const hintId = S => ({ place: "hint_place", rest: "hint_manage" }[S.step] || "hint_wait");
function tokens(S) {
  const c = S.cfg, p = me(S), gs = S.gateSet && S.gateSet.length ? S.gateSet : S.data.publisherGates;
  const g = gs.find(x => x.phase === 0) || gs[0] || {}, g2 = gs.find(x => x.phase === 1) || gs[1] || {}, g3 = gs.find(x => x.phase === 2) || gs[2] || {};
  const done = (S.gates || []).find(x => x.phase === 0);
  const crisis = S.crisisCard && S.data.crisis.find(x => x.id === S.crisisCard);
  const t = {
    income: c.income, salaryJr: c.salaryJr, salarySr: c.salarySr, resJr: c.resJr, resSr: c.resSr, hypeDecay: c.hypeDecay,
    recruitCost: c.recruitCost, recruitN: S.recruit ? S.recruit.length : E.recruitSize(S),
    buildDelay: c.buildDelay, crunchGold: c.crunchGold, rdSkills: c.rdSkills == null ? 2 : c.rdSkills, trainSkillCost: c.trainSkillCost == null ? 1 : c.trainSkillCost, trainSkillWord: (c.trainSkillCost == null ? 1 : c.trainSkillCost) === 1 ? "skill" : "skills",
    sysWait: c.instantBuild ? "" : " and one worker per role it needs sits out until it is finished (1 to 3 rounds)",
    rdWhat: c.instantBuild ? "two workers from different disciplines give you <b>" + (c.rdSkills == null ? 2 : c.rdSkills) + " skills of your choice</b>." : "two workers from different disciplines make a system built this round <b>1 round shorter</b>, with no crunch fee.", buildsPerRound: c.buildsPerRound, bank: p.ideas + p.code + p.process + p.buzz,
    convertRate: c.convertRate || 3, refreshGold: c.marketRefreshGold, gateName: esc(g.name || ""), gate2Name: esc(g2.name || ""), gate3Name: esc(g3.name || ""), gateReqs: esc((g.reqs || []).join(", ")),
    gateEnd: (c.phaseEnds || [])[g.phase || 0] || "", gateFund: g.fund || 0, gatePenalty: g.penalty || 0, gateMiss: E.gateEff(S, g).miss.replace("-", "lose "), gateVP: E.gateEff(S, g).vp, baseVP: c.baseVP || 0, raceDen: c.raceDen || 3, objPer: c.objGraded || 1, objBonus: c.objBonus || 0,
    crisisName: crisis ? "<b>" + esc(crisis.name) + "</b>" : "a <b>Crisis</b>",
    sysMult: c.sysVPMult || 1, payroll: (c.startWorkers || 0) * (c.salaryJr || 0), teamCost: ((S.data.spots.find(x => x.id === "team") || {}).cost || {}).gold || 0,
    nPlayers: S.players.length, gateLossCap: c.gateLossCap || 4, goldPerVP: c.goldPerVP || 3, raceFirst: (E.rankTable(c, S.players.length) || [])[0], raceLast: (E.rankTable(c, S.players.length) || []).slice(-1)[0],
    burnVP: (function () { var ks = Object.keys(c.burnVP || {}).filter(function (k) { return (c.burnVP[k] || 0) < 0 }).map(Number).sort(function (a, b) { return a - b }), o = []; ks.forEach(function (k) { var v = c.burnVP[k], l = o[o.length - 1]; if (l && l.v === v && l.to === k - 1) l.to = k; else o.push({ from: k, to: k, v: v }) }); return o.map(function (x) { return (x.from === x.to ? x.from : x.from + "-" + x.to) + ": " + x.v + " VP" }).join(", ") })(), cultureBase: c.cultureFoldBase,
    hypeBank: c.hypeBank || 0, trainCost: c.trainCost, trainCulture: c.trainCulture, trainNeeded: c.trainNeeded,
    freeBuild: p.freeBuilds ? " <b>A free build is on the house this round.</b>" : "",
    recruitMinRound: c.recruitMinRound || 2, decayFromRound: c.decayFromRound || 4,
    incomeNow: (S.rnote && S.rnote.p && S.rnote.p[0] ? S.rnote.p[0].income : c.income), salaryNow: (S.rnote && S.rnote.p && S.rnote.p[0] ? S.rnote.p[0].salary : p.workers.reduce((a, w) => a + (w.lvl === "Sr" ? c.salarySr : c.salaryJr), 0)),
    goldNow: (S.rnote && S.rnote.p && S.rnote.p[0] && S.rnote.p[0].goldNow != null ? S.rnote.p[0].goldNow : p.gold),
    burnMax: c.burnMax, burnOverStep: c.burnOverStep, burnOverMax: c.burnOverMax, burnUnpaidMin: c.burnUnpaidMin, burnRelief: c.burnRelief, burnTeamRelief: c.burnTeamRelief,
    energizedCulture: c.energizedCulture, energizedGold: c.energizedGold, burnStrainAt: c.burnStrainAt, burnStrainHype: c.burnStrainHype, burnBenchAt: c.burnBenchAt, burnQuitAt: c.burnQuitAt, burnQuitReset: c.burnQuitReset
  };
  { const pg = (c.promoGoldByN && c.promoGoldByN[2]) || 0; t.promoCostText = pg ? "it costs " + pg + "G" : "it is free"; }
  t.startWorkers = c.startWorkers; t.recruitLadder = c.recruitLadder; t.trainTimes = c.trainNeeded + (c.trainNeeded === 1 ? " time" : " times"); t.wsFree = c.wsFree; t.wsCost = c.wsCost;  t.wsPrices = wsPriceText(c); t.wsMax = c.wsMax;
  t.foldNote = "\n\nThere is no separate Culture track: <b>Culture is " + c.cultureFoldBase + " minus Burnout</b>. Anything that gives Culture (Team Events, Training, some tiles) lowers Burnout, and anything that costs Culture raises it.";
  t.trainEffect = "lowers <b>Burnout</b> by " + c.trainCulture;
  t.teamRelief = c.teamEventCulture + c.burnTeamRelief; t.teamEventEffect = "to lower Burnout by " + t.teamRelief;
  t.burnOverPer = c.burnOverStep > 1 ? c.burnOverStep + " Exhausted workers" : "Exhausted worker";
  const td = c.trainDuration || 1; t.trainAway = td > 1 ? "sit out the next " + td + " rounds" : "sit out the next round";
  t.promoLesson = c.trainNeeded > 1 ? " For this lesson one of your Juniors has already trained " + (c.trainNeeded - 1) + " time" + (c.trainNeeded > 2 ? "s" : "") + "." : "";
  t.promoRest = c.promoByRest ? " A Junior who worked and then sits out a round can also be promoted without training." : "";
  t.gateResult = done ? fmt(rw(done.passed.includes(0) ? "gate_pass" : "gate_miss").text, t) : "";
  t.hint = fmt(rw(hintId(S)).text, t);
  return t;
}
const deskLeft = S => { const p = me(S); return Math.max(0, (p.ws == null ? Math.min(S.cfg.wsMax, S.cfg.wsFree) : p.ws) - (p.wsUsed || 0)); };
const placedN = S => me(S).workers.filter(w => w.placed).length;
const sysOpt = S => me(S).workers.some(w => w.lvl === "Sr" && !w.placed && E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok));
const srIds = S => me(S).workers.filter(w => w.lvl === "Sr" && !w.placed && E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok)).map(w => w.id);
const convOpt = S => me(S).workers.some(w => !w.placed && E.placementOptions(S, 0, w).some(o => o.ok && o.spot && o.spot.special === "convert"));
const trigOk = (S, w) => { const lv = w.lvl, pl = w.placed; w.lvl = "Sr"; w.placed = false; let ok = false; try { ok = E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok); } finally { w.lvl = lv; w.placed = pl; } return ok; };
const eligibleJr = S => me(S).workers.filter(w => w.lvl === "Jr" && !w.placed && !w.build);
const S0 = () => U().S, placedTrain = S => !!(S && S.occ && S.occ.train && S.occ.train.includes(0));
// make a step whose title, button and text come from the editable rows
function mk(id, o) {
  const st = Object.assign({ id, rid: id }, o);
  const rowId = () => st.rv ? st.rv() : st.rid;
  Object.defineProperty(st, "title", { get: () => rw(rowId()).title, enumerable: true });
  Object.defineProperty(st, "btn", { get: () => rw(rowId()).btn || "Next", enumerable: true });
  // a line that starts with ">> " is the "do this now" call to action: the coach shows it in its own gold box, above the explanation
  st.parts = (S) => {
    const raw = String(rw(st.vid ? st.vid(S) : rowId()).text || ""), lines = raw.split("\n"), rest = []; let cta = "";
    lines.forEach(l => { if (!cta && /^>>\s/.test(l)) cta = l.replace(/^>>\s*/, ""); else rest.push(l); });
    const tk = tokens(S);
    return { cta: cta ? fmt(cta, tk) : "", body: fmt(rest.join("\n").replace(/^\n+/, ""), tk) };
  };
  st.text = (S, T) => { const p = st.parts(S); return p.cta ? p.cta + (p.body ? "<br><br>" + p.body : "") : p.body; };
  return st;
}
const info = (id, o) => mk(id, Object.assign({ kind: "info", allow: () => MSG("msg_next") }, o));
const softInfo = (id, o) => info(id, Object.assign({ soft: true, allow: () => null }, o));
const doing = (id, o) => mk(id, Object.assign({ kind: "do" }, o));
const play = (id, o) => mk(id, Object.assign({ kind: "free", allow: () => null }, o));
// Build lives in the Manage (rest) step, so "after build" means "built, or unable to, during Manage"
const cantBuild = S => !(canBuildAny(S, false) || (me(S).freeBuilds && canBuildAny(S, true)));
const builtInManage = (S, r, crunch) => S.round > r || (S.round === r && S.step === "rest" && (crunch ? (me(S).rs.crunched || 0) >= 1 : (me(S).building || []).length + me(S).systems.length >= 1));
const reachedRound = (S, r, stage) => S.round > r || (S.round === r && RANK[S.step] >= RANK[stage]);

let STEPS = [
  /* ---- cards 1-5: the goal, your pick, your team, the board. First action: objectives (card 3). First placement: lesson 6. ---- */
  info("welcome", { center: true, hold: true, hl: () => null, allow: () => MSG("msg_start") }),
  info("win_vp", { center: true, hl: () => null }),
  doing("objectives", { hl: () => ".modal.decision .mb, .modal.decision .mf .btn.primary", done: S => !S.dq.some(d => d.t === "keepObj" && d.p === 0), allow: a => a.type === "keepObj" ? null : MSG("msg_obj"), noSkip: true }),
  info("team", { hl: () => "[data-tut=workers]" }),
  info("board_backlog", { hl: () => "[data-row=EARN]" }),
  /* ---- round 1: workstations, place, build ---- */
  info("ws1", { hl: () => ".pt[data-pid='0'] [data-tut=ws]" }),
  doing("buy1", { hl: () => ".modal.decision .mb, .modal.decision .mf .btn.primary", done: S => !S.dq.some(d => d.t === "wsBuy" && d.p === 0), allow: a => a.type === "wsBuy" ? null : MSG("msg_wsbuy") }),
  doing("place1", { hl: () => (U().sel == null ? "[data-tut=workers] .wk:not(.placed)" : "[data-tut=board]"),
    vid: S => !actorIsMe(S) ? "place1w" : U().detail && U().detail.k === "spot" ? "place1c" : U().detail && U().detail.k === "worker" ? "place1d" : U().sel == null ? "place1" : "place1b",
    done: S => after(S, "place", 1) || (S.round === 1 && S.step === "place" && me(S).rs.placed >= 1),
    allow: a => a.type === "place" ? null : a.type === "pass" ? MSG("msg_place_first") : MSG("msg_place") }),
  info("stats", { hl: () => ".pt[data-pid='0'] .stats.res" }),
  doing("place2", { hl: S => placedN(S) >= 2 || deskLeft(S) === 0 ? "[data-act=pass]" : (U().sel != null ? ".spot.ok" : "[data-tut=workers] .wk.pick"),
    done: S => after(S, "place", 1) || S.round > 1, allow: a => (a.type === "place" || a.type === "pass" || a.type === "recruit") ? null : MSG("msg_place_pass") }),
  doing("build", { hl: () => (U().modal === "market" ? ".modal [data-act=build]:not([disabled])" : "[data-tut=market]"), done: S => builtInManage(S, 1),
    allow: (a, S) => a.type === "build" ? null : a.type === "done" ? ((me(S).builds >= 1 || !(canBuildAny(S, false) || (me(S).freeBuilds && canBuildAny(S, true)))) ? null : MSG("msg_build_first")) : MSG("msg_build") }),
  info("tired", { hl: () => "[data-tut=workers]" }),
  doing("rest1", { hl: () => "[data-tut=miles],[data-tut=done]", done: S => after(S, "rest", 1), allow: a => a.type === "train" ? MSG("msg_train_later") : (a.type === "done" || a.type === "claim") ? null : MSG("msg_rest") }),
  /* ---- round 2: what the new round did, recruit, perks, burnout ---- */
  info("income", { hl: () => ".pt[data-pid='0'] .st.rs.g" }),
  info("upkeep", { hl: () => ".pt[data-pid='0'] .ordbadge" }),
  doing("r2buy", { hl: () => ".modal.decision .mb, .modal.decision .mf .btn.primary", done: S => S.round > 2 || !S.dq.some(d => d.t === "wsBuy" && d.p === 0), allow: a => a.type === "wsBuy" ? null : MSG("msg_wsbuy") }),
  doing("r2recruit", { hl: () => "[data-tut=recruit]", done: S => me(S).recruited >= 1 || S.round > 2,
    allow: (a, S) => (a.type === "buyws" || a.type === "place" || a.type === "recruit") ? null : a.type === "pass" ? MSG("msg_recruit") : MSG("msg_recruit") }),
  info("board_perks", { hl: () => ".shared" }),
  doing("r2place", { hl: () => "[data-tut=workers]", done: S => reachedRound(S, 2, "rest"), allow: a => (a.type === "buyws" || a.type === "place" || a.type === "pass" || a.type === "recruit") ? null : MSG("msg_place_pass") }),
  info("burnout", { hl: () => ".pt[data-pid='0'] .st.bo" }),
  /* ---- round 3: strike teams, the first gate ---- */
  doing("r2done", { hl: () => "[data-tut=done]", done: S => S.round >= 3, allow: a => (a.type === "train" || a.type === "promote") ? MSG("msg_train_later") : null }),
  info("gates", { hl: () => "[data-tut=gates]" }),
  play("r3", { hl: () => null, done: S => S.round >= 4, allow: a => (a.type === "train" || a.type === "promote") ? MSG("msg_train_later") : null }),
  /* ---- production ---- */
  softInfo("crisis", { hl: () => "[data-tut=crisis]" }),
  softInfo("gateresult", { hl: () => "[data-tut=gates]" }),
  softInfo("races", { hl: () => "[data-tut=tracks]" }),
  softInfo("hype_bank", { hl: () => "[data-tut=tracks]" }),
  doing("promote", { rv: () => "promote_train", hl: () => placedTrain(S0()) ? "[data-act=pass]" : U().sel != null ? ".spot[data-id=train]" : "[data-tut=workers] .wk.pick", done: S => me(S).workers.some(w => w.lvl === "Sr") || S.round > 4,
    allow: (a, S) => a.type === "place" ? (a.target === "spot:train" ? ((!trigOk(S, me(S).workers.find(w => w.id === a.worker) || {}) && eligibleJr(S).some(w => trigOk(S, w))) ? MSG("msg_promote_fit") : null) : MSG("msg_promote_train")) : a.type === "pass" || a.type === "recruit" ? MSG("msg_promote_train") : null }),
  play("r4play", { hl: () => null, done: S => reachedRound(S, 4, "rest") }),
  doing("trigger", { hl: () => "[data-tut=workers]", done: S => me(S).rs.triggers >= 1 || reachedRound(S, 5, "rest") || (S.round >= 5 && !sysOpt(S)),
    allow: (a, S) => a.type === "place" ? (srIds(S).includes(a.worker) && !String(a.target).startsWith("sys:") ? MSG("msg_trigger") : null) : a.type === "pass" ? MSG("msg_trigger") : null }),
  play("prod", { hl: () => null, done: S => S.round >= 9 }),
  softInfo("polish", { hl: () => "[data-tut=gates]" }),
  play("polishfree", { hl: () => null, done: S => S.round >= 12 }),
  /* ---- launch and hand-over ---- */
  doing("convert", { hl: () => ".spot[data-id=convert]", done: S => me(S).cs.converted > 0 || reachedRound(S, 12, "rest") || (S.round === 12 && S.step === "place" && !convOpt(S)),
    allow: a => a.type === "pass" ? MSG("msg_convert") : null }),
  info("handover", { final: true, soft: true, hl: () => null, allow: () => null })
];

/* ---------- lifecycle ---------- */
SI.tutNew = function () {
  SI.tutSteps = STEPS; loadRows();
  const cfg = Object.assign(E.defaultConfig(), SI.TUT_CONFIG);
  const S = E.newGame([{ name: "You", bot: false }, { name: "Rival", bot: true }], { seed: SI.TUT_SEED, config: cfg, data: E.clone(E.defaultData(cfg)) });
  return S;
};
SI.TUT_VER = 3;   // bump when STEPS change, so an old autosaved tutorial is never resumed against a different script
SI.tutInit = () => ({ idx: 0, ack: {}, auto: false, gaveFree: false, rev: null, vis: {}, ver: SI.TUT_VER });
const cur = () => { const u = U(); return u.tut ? STEPS[Math.min(u.tut.idx, STEPS.length - 1)] : null; };

SI.tutTick = function () {
  const u = U(), T = u.tut; if (!T || !u.S) return;
  const S = u.S; let guard = 0;
  while (T.idx < STEPS.length - 1 && guard++ < 30) {
    const st = STEPS[T.idx];
    const done = st.kind === "info" ? !!T.ack[st.id] : st.done(S, T);
    if (!done) break;
    T.idx++; u.sel = null;
  }
  // rigs: make sure the player can do what the current step teaches
  const st = STEPS[T.idx]; T.gave = T.gave || {}; (T.vis = T.vis || {})[st.id] = 1;
  const key = st.id + ":" + S.round;
  if (st.id === "build") {
    if (!T.gaveFree) {
      if (actorIsMe(S) && !S.dq.length && S.step === "rest") {
        T.gaveFree = true; T.gave[key] = true;
        if (!canBuildAny(S, false) && me(S).freeBuilds < 1) me(S).freeBuilds = 1;
      }
    }
  }
  if (st.id === "r2recruit" && !T.gave[key] && S.step === "place" && actorIsMe(S)) { T.gave[key] = true; const cost = E.recruitCost(S, 0); if (me(S).gold < cost) me(S).gold = cost; }
  if (st.id === "promote" && !T.gave[key] && S.step === "place" && actorIsMe(S) && !S.dq.length) { T.gave[key] = true; { const n = S.cfg.trainSkillCost || 1, m = me(S); ["ideas", "code", "process", "buzz"].forEach(k => { if ((m[k] || 0) < n) m[k] = n; }); } }
};
SI.tutHold = () => SI.tutLockMode() === "hard";
SI.tutGate = function (a) {
  const u = U(), T = u.tut; if (!T || T.auto) return null;
  const st = cur(); if (!st) return null;
  if (a && a.type === "place" && a.target === "spot:train" && st.id !== "promote") return MSG("msg_train_later"); // the Training tile is taught in round 4
  if (a && a.type === "place" && u.S.round < 3 && /^spot:/.test(a.target || "")) { const sp = u.S.data.spots.find(x => "spot:" + x.id === a.target); if (sp && sp.crew) return MSG("msg_strike_later"); } // strike teams are taught in round 3
  if (a && a.type === "wsBuy" && st.id !== "buy1" && st.id !== "r2buy") return null; // desks are bought at the start of every round
  if (!st.allow) return null;
  return st.allow(a, u.S);
};
// hard = nothing but the coach is clickable; soft = the board is locked but popups still work (Crisis decisions)
SI.tutLockMode = function () {
  const u = U(), T = u.tut; if (!T || T.auto || !u.S) return "";
  if (T.rev != null) return "hard";
  const st = cur(); if (!st || st.kind !== "info" || st.wrap) return "";
  return (st.id === "crisis" || st.soft) ? "soft" : "hard";
};
/* Detail popups stay locked until the lesson that teaches them (the draft step: "tap a card to read more"). */
SI.tutAllowsDetail = function () {
  const u = U(), T = u.tut; if (!T || T.auto || !u.S) return true;
  if (T.rev != null) return false;
  const i = SI.tutSteps.findIndex(s => s.id === "place1"); return i < 0 || T.idx >= i;
};
/* The Train button on a worker card is hidden until the lesson that teaches it (it only tempts a first-time player to spend Gold early). */
SI.tutHideTrain = function () {
  const u = U(), T = u.tut; if (!T || T.auto || !u.S) return false;
  const i = STEPS.findIndex(s => s.id === "promote"); return i >= 0 && T.idx < i;
};
SI.tutBack = function () { const T = U().tut; if (!T) return; if (T.rev == null) T.rev = Math.max(0, T.idx - 1); else T.rev = Math.max(0, T.rev - 1); };
SI.tutFwd = function () { const T = U().tut; if (!T || T.rev == null) return; T.rev++; if (T.rev >= T.idx) T.rev = null; };
SI.tutAck = function () { const T = U().tut, st = cur(); if (T && st) T.ack[st.id] = true; };
SI.tutFinished = function () { const T = U().tut, st = cur(); return !!(T && st && st.final && T.ack[st.id]); };

/* ---------- coach card ---------- */
SI.tutCoach = function () {
  const u = U(), T = u.tut; if (!T) return "";
  const S = u.S; const rv = T.rev != null; const st = rv ? STEPS[T.rev] : cur(); const n = STEPS.length; const at = rv ? T.rev : T.idx;
  const L = id => esc(rw(id).text);
  if (T.auto) {
    if (S.over) return "";
    return `<div class="coach"><button class="x" data-act="tut-exit" aria-label="Exit tutorial">×</button><div class="cp">Fast-forward</div><div class="ct">Round ${S.round} of 12 · ${esc(D.phases[S.phase].name)}…</div></div>`;
  }
  const P = typeof st.parts === "function" ? st.parts(S) : { cta: "", body: SI.L(st.text) };
  // honest progress: lessons seen so far, plus the lessons still ahead (a lesson that was skipped because you already did it is not counted)
  let seen = 0; for (let i = 0; i <= at; i++) if ((T.vis || {})[STEPS[i].id] || i === at) seen++;
  const ahead = n - 1 - T.idx, total = (T.vis ? Object.keys(T.vis).length : seen) + ahead, left = Math.max(0, total - seen);
  const waiting = !rv && st.kind === "do" && S.dq.length === 0 && E.currentActor(S) > 0;
  const back = at > 0 ? `<button class="btn" data-act="tut-back">${L("ui_back")}</button>` : "";
  const stop = !rv && !st.final && !st.center ? `<button class="btn ghost" data-act="tut-free" title="Leave the guide and keep playing this game">${L("ui_stop")}</button>` : "";
  let btns = "";
  if (rv) btns = back + `<button class="btn primary" data-act="tut-fwd">${T.rev + 1 >= T.idx ? L("ui_fwd_end") : L("ui_fwd")}</button>`;
  else if (st.kind === "info") btns = back + `<button class="btn primary" data-act="tut-next">${esc(st.btn || "Next")}</button>` + stop;
  else btns = back + stop;
  const stepTxt = fmt(rw("ui_step").text, { n: Math.min(seen, total), total, left }) + (rv ? " · " + L("ui_review") : "");
  const cta = P.cta ? `<div class="cta${waiting ? " wait" : ""}"><span class="ctl">${waiting ? "Next up" : "Your move"}</span>${P.cta}</div>` : "";
  const status = waiting ? `<div class="cw" role="status">${L("ui_wait")}</div>` : "";
  return `<div class="coach ${st.center ? "center" : ""} k-${st.kind}" role="dialog" aria-label="Guided tutorial">${st.center ? "" : '<button class="x" data-act="tut-exit" aria-label="Exit tutorial">×</button>'}
    <div class="cp">${stepTxt}</div><div class="prog" aria-hidden="true"><i style="width:${Math.round(Math.min(seen, total) / total * 100)}%"></i></div>
    <div class="ctt">${esc(st.title)}</div>${cta}${P.body ? `<div class="ct">${P.body}</div>` : ""}${status}${btns ? `<div class="cb">${btns}</div>` : ""}</div>${st.center ? '<div class="coach-dim"></div>' : ""}`;
};
/* ---------- spotlight: dim everything except the highlighted area (the coach box sits above it) ---------- */
let spotEl = null, spotSel = null;
function spotDraw() {
  const els = spotSel && !document.querySelector('.overlay') ? Array.from(document.querySelectorAll(spotSel)).filter(e => e.getClientRects().length) : [];
  if (!els.length) { if (spotEl) { spotEl.remove(); spotEl = null; } return; }
  const W = window.innerWidth, H = window.innerHeight;
  const holes = els.map(e => { const r = e.getBoundingClientRect(); return `<rect x="${r.left - 6}" y="${r.top - 6}" width="${r.width + 12}" height="${r.height + 12}" rx="10" fill="black"/>`; }).join("");
  if (!spotEl) { spotEl = document.createElement("div"); spotEl.id = "tutspot"; document.body.appendChild(spotEl); }
  spotEl.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><mask id="tsm"><rect width="${W}" height="${H}" fill="white"/>${holes}</mask></defs><rect width="${W}" height="${H}" fill="rgba(0,0,0,.7)" mask="url(#tsm)"/></svg>`;
}
window.addEventListener("scroll", () => { if (spotSel) spotDraw(); }, true);
window.addEventListener("resize", () => { if (spotSel) spotDraw(); });
SI.tutSpotClear = function () { spotSel = null; spotDraw(); };
SI.tutHighlight = function (rootEl) { spotSel = null; try { tutHighlight0(rootEl); } finally { spotDraw(); } };
function tutHighlight0(rootEl) {
  const u = U(), T = u.tut; if (!T || T.auto) return;
  const st = T.rev != null ? STEPS[T.rev] : cur(); if (!st || !st.hl) return;
  if (u.detail) { const acts = rootEl.querySelectorAll('.modal [data-tut=act]:not([disabled])'); if (acts.length) { acts.forEach(el => el.classList.add('tut-hl')); return; } }
  const sel = st.hl(u.S); if (!sel) return;
  try {
    // a worker is selected during Place: unmask the spots it can use too, so the player can see where to put it
    const extra = (u.sel != null && u.S && u.S.step === "place" && sel.indexOf(".spot.ok") < 0 && rootEl.querySelector(".spot.ok")) ? ".spot.ok" : null;
    const all = extra ? sel + "," + extra : sel;
    const els = rootEl.querySelectorAll(all); els.forEach(el => el.classList.add("tut-hl")); if (els.length && !u.detail) spotSel = all;
    // bring the highlighted area into view (above the coach box): the page itself or, on desktop, the .left/.right column that scrolls
    const el = extra ? rootEl.querySelector(extra) : els[0];
    // two-column layout: dock the coach box under the other column so it never sits on the highlighted panel
    { const cb = rootEl.querySelector(".coach:not(.center)"); if (cb) { const bw = /workstation/i.test(cb.textContent) ? rootEl.querySelector('[data-act=buyws]') : null; // the hint mentions buying a desk: keep that button clear too
      cb.classList.toggle("dockl", !!(window.innerWidth > 980 && ((el && el.closest(".right")) || (bw && bw.closest(".right"))))); } }
    if (el && el.getBoundingClientRect && !u.detail && !rootEl.querySelector(".overlay")) {
      const coach = rootEl.querySelector(".coach");
      // leave room under the columns for the whole coach box, so the highlighted panel can scroll clear of it
      if (coach) { const need = Math.ceil(coach.getBoundingClientRect().height) + 28; if (rootEl.style.getPropertyValue("--coachH") !== need + "px") rootEl.style.setProperty("--coachH", need + "px"); }
      const cr = coach ? coach.getBoundingClientRect() : null;
      const sc = el.closest(".left,.right"), scrolls = sc && sc.scrollHeight > sc.clientHeight + 2 && getComputedStyle(sc).overflowY !== "visible";
      const box = scrolls ? sc.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
      const top = Math.max(box.top, 0) + 16;
      let bottom = Math.min(box.bottom, window.innerHeight) - 16;
      if (cr && cr.top > window.innerHeight * 0.2 && cr.right > box.left && cr.left < box.right) bottom = Math.min(bottom, cr.top - 12); // the coach covers the lower part of this column
      // several highlighted pieces (e.g. a button and its panel): keep the whole group clear of the coach card, not just the first piece
      const r = (() => { const rs = extra ? [] : Array.from(els).filter(x => x.getClientRects().length).map(x => x.getBoundingClientRect()); if (rs.length < 2) return el.getBoundingClientRect(); const t0 = Math.min.apply(null, rs.map(a => a.top)), b0 = Math.max.apply(null, rs.map(a => a.bottom)); return { top: t0, bottom: b0, height: b0 - t0 }; })();
      if (r.top < top || r.bottom > bottom) {
        const room = bottom - top, dy = r.height > room ? r.top - top : r.top - top - Math.max(0, (room - r.height) / 2);
        (scrolls ? sc : window).scrollBy({ top: dy, behavior: "smooth" });
      }
    }
  } catch (e) {}
};

/* ---------- autoplay + score explainer ---------- */
SI.tutAuto = function () { const u = U(), T = u.tut; T.auto = true; u.S.players[0].bot = true; };
const PARTS = [
  ["prodShare", "Progress race", "1 VP for every {raceDen} points of Progress."],
  ["hypeStrength", "Hype race", "1 VP for every {raceDen} points of Hype. Your Wishlists are added to your Hype at the end of the game."],
  ["debtPenalty", "Tech Debt", "The studio with the most Debt loses the most VP; the studio with the least loses none. Debt comes from tiles and systems with a red Debt mark; Quality workers, Engineers and Stability systems clear it."],
  ["burnout", "Burnout", "High Burnout at the end of the game costs VP."],
  ["objectives", "Objectives", "Your secret goals: {objPer} VP for each requirement you met, plus {objBonus} if you met them all."],
  ["systems", "Systems", "The VP printed on each system card you built."],
    ["gold", "Gold", "Every {goldPerVP} leftover Gold is 1 VP."],
  ["crisis", "Crisis & Gates", "VP gained or lost from Crisis cards and Publisher Gates (passed gates can pay VP, missed ones cost VP)."]
];
SI.tutScoreExplainer = function (S) {
  const r = S.scores.find(x => x.id === 0); if (!r) return "";
  const note = fmt(rw("explain_note").text, tokens(S));
  const tk = tokens(S);
  const PT = PARTS.map(p => [p[0], rw("explain_" + p[0]).title || p[1], rw("explain_" + p[0]).text || p[2]]);
  const q = r.parts;
  return `<div class="explain"><h3>How your ${b(Math.round(r.total) + " VP")} was made</h3>
  <p class="mute" style="margin:2px 0 8px">Your row, in plain language. You finished with ${b(S.players[0].debt + " Debt")} and ${b(S.players[0].mktg + " Wishlists")}.</p>
  <table class="scoretbl"><tbody>${PT.map(p => `<tr><td style="white-space:nowrap">${esc(p[1])}</td><td class="mono" style="text-align:right;padding:0 10px">${(+q[p[0]]).toFixed(0)}</td><td class="mute" style="font-size:12px;text-align:left">${fmt(p[2], tk)}</td></tr>`).join("")}</tbody></table>
  <p class="mute" style="margin-top:8px">${note}</p></div>`;
};

SI.tutSteps = STEPS;
if (typeof module !== "undefined") module.exports = SI;
})(typeof window !== "undefined" ? window : globalThis);
