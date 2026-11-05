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
  const g = gs.find(x => x.phase === 0) || gs[0] || {}, g2 = gs.find(x => x.phase === 1) || gs[1] || {};
  const done = (S.gates || []).find(x => x.phase === 0);
  const crisis = S.crisisCard && S.data.crisis.find(x => x.id === S.crisisCard);
  const t = {
    income: c.income, salaryJr: c.salaryJr, salarySr: c.salarySr, resJr: c.resJr, resSr: c.resSr, hypeDecay: c.hypeDecay,
    recruitCost: c.recruitCost, recruitN: S.recruit ? S.recruit.length : E.recruitSize(S),
    buildDelay: c.buildDelay, crunchGold: c.crunchGold, buildsPerRound: c.buildsPerRound, bank: p.ideas + p.code + p.process + p.buzz,
    convertRate: c.convertRate || 3, refreshGold: c.marketRefreshGold, gateName: esc(g.name || ""), gate2Name: esc(g2.name || ""), gateReqs: esc((g.reqs || []).join(", ")),
    gateEnd: (c.phaseEnds || [])[g.phase || 0] || "", gateFund: g.fund || 0, gatePenalty: g.penalty || 0,
    crisisLine: crisis ? ": <b>" + esc(crisis.name) + "</b>. " + esc(crisis.text) : "",
    nPlayers: S.players.length, goldPerVP: c.goldPerVP || 3, raceFirst: (E.rankTable(c, S.players.length) || [])[0], raceLast: (E.rankTable(c, S.players.length) || []).slice(-1)[0],
    burnLine: "<br><b>Burnout</b> and Culture share one track (Culture is " + c.cultureFoldBase + " minus Burnout)" + ": an exhausted studio loses VP at the end (" + [3, 4, 5, 6].map(k => k + ": " + (((c.burnVP || {})[k]) || 0)).join(", ") + ").",
    hypeBank: c.hypeBank || 0, trainCost: c.trainCost, trainCulture: c.trainCulture, trainNeeded: c.trainNeeded,
    freeBuild: p.freeBuilds ? "<br><br><b>A free build is on the house this round.</b>" : "",
    burnMax: c.burnMax, burnOverStep: c.burnOverStep, burnOverMax: c.burnOverMax, burnUnpaidMin: c.burnUnpaidMin, burnRelief: c.burnRelief, burnTeamRelief: c.burnTeamRelief,
    energizedCulture: c.energizedCulture, energizedGold: c.energizedGold, burnStrainAt: c.burnStrainAt, burnStrainHype: c.burnStrainHype, burnBenchAt: c.burnBenchAt, burnQuitAt: c.burnQuitAt, burnQuitReset: c.burnQuitReset
  };
  t.startWorkers = c.startWorkers; t.recruitLadder = c.recruitLadder;
  t.foldNote = "\n\nThere is no separate Culture track: <b>Culture is " + c.cultureFoldBase + " minus Burnout</b>. Anything that gives Culture (Team Events, Training, some tiles) lowers Burnout, and anything that costs Culture raises it.";
  t.trainEffect = "lowers <b>Burnout</b> by " + c.trainCulture + " (that is +" + c.trainCulture + " Culture)";
  t.teamEventEffect = "to lower Burnout by " + (c.teamEventCulture + c.burnTeamRelief);
  t.burnOverPer = c.burnOverStep > 1 ? c.burnOverStep + " Over-Tired workers" : "Over-Tired worker";
  const td = c.trainDuration || 1; t.trainAway = td > 1 ? "sits out the next " + td + " rounds" : "sits out the next round";
  t.promoLesson = c.trainNeeded > 1 ? " For this lesson one of your Juniors has already trained " + (c.trainNeeded - 1) + " time" + (c.trainNeeded > 2 ? "s" : "") + "." : "";
  t.promoRest = c.promoByRest ? " A Junior who worked and then sits out a round can also be promoted without training." : "";
  t.restTeam = fmt(rw("rest_train").text, t);
  ["burnStats", "burnRest", "burnUpkeep"].forEach(k => { t[k] = fmt(rw("burn_" + k.slice(4).toLowerCase()).text, t); });
  t.gateResult = done ? fmt(rw(done.passed.includes(0) ? "gate_pass" : "gate_miss").text, t) : "";
  t.hint = fmt(rw(hintId(S)).text, t);
  return t;
}
const sysOpt = S => me(S).workers.some(w => w.lvl === "Sr" && !w.placed && E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok));
const srIds = S => me(S).workers.filter(w => w.lvl === "Sr" && !w.placed && E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok)).map(w => w.id);
const convOpt = S => me(S).workers.some(w => !w.placed && E.placementOptions(S, 0, w).some(o => o.ok && o.spot && o.spot.special === "convert"));
const trigOk = (S, w) => { const lv = w.lvl, pl = w.placed; w.lvl = "Sr"; w.placed = false; let ok = false; try { ok = E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok); } finally { w.lvl = lv; w.placed = pl; } return ok; };
const eligibleJr = S => me(S).workers.filter(w => w.lvl === "Jr" && !w.placed && (S.cfg.train ? !w.build && !w.training : w.worked));
// make a step whose title, button and text come from the editable rows
function mk(id, o) {
  const st = Object.assign({ id, rid: id }, o);
  const rowId = () => st.rv ? st.rv() : st.rid;
  Object.defineProperty(st, "title", { get: () => rw(rowId()).title, enumerable: true });
  Object.defineProperty(st, "btn", { get: () => rw(rowId()).btn || "Next", enumerable: true });
  st.text = (S, T) => fmt(rw(st.vid ? st.vid(S) : rowId()).text, tokens(S));
  return st;
}
const info = (id, o) => mk(id, Object.assign({ kind: "info", allow: () => MSG("msg_next") }, o));
const softInfo = (id, o) => info(id, Object.assign({ soft: true, allow: () => null }, o));
const doing = (id, o) => mk(id, Object.assign({ kind: "do" }, o));
const play = (id, o) => mk(id, Object.assign({ kind: "free", allow: () => null }, o));
// Build lives in the Manage (rest) step, so "after build" means "built, or unable to, during Manage"
const cantBuild = S => !(canBuildAny(S, false) || (me(S).freeBuilds && canBuildAny(S, true)));
const builtInManage = (S, r, crunch) => S.round > r || (S.round === r && S.step === "rest" && (crunch ? me(S).cs.crunched >= 1 : (me(S).building || []).length + me(S).systems.length >= 1));
const reachedRound = (S, r, stage) => S.round > r || (S.round === r && RANK[S.step] >= RANK[stage]);

let STEPS = [
  info("welcome", { center: true, hold: true, hl: () => null, allow: () => MSG("msg_start") }),
  /* ---- how you win, before phases and rounds ---- */
  info("win_vp", { center: true, hl: () => null }),
  info("win_races", { hl: () => "[data-tut=tracks]" }),
  info("win_build", { hl: () => "[data-tut=market]" }),
  info("win_lose", { hl: () => ".pt[data-pid='0'] .stats" }),
  info("loop", { hl: () => "[data-tut=steps]" }),
  doing("objectives", { hl: () => ".modal", done: S => !S.dq.some(d => d.t === "keepObj" && d.p === 0), allow: a => a.type === "keepObj" ? null : MSG("msg_obj") }),
  info("phasestart", { hl: () => "[data-tut=steps]" }),
  info("boardintro", { hl: () => "[data-tut=board]" }),
  info("board_backlog", { hl: () => "[data-row=EARN]" }),
  info("board_prototype", { hl: () => "[data-row=PROGRESS]" }),
  info("board_pitch", { hl: () => "[data-row=HYPE]" }),
  info("board_jam", { hl: () => "[data-row=CREW]" }),
  info("board_perks", { hl: () => ".shared" }),
  info("placeintro", { hl: () => "[data-tut=board]" }),
  doing("place1", { hl: () => (U().sel == null ? "[data-tut=workers] .wk:not(.placed)" : ".spot.ok"),
    vid: S => !actorIsMe(S) ? "place1w" : U().detail && U().detail.k === "spot" ? "place1c" : U().detail && U().detail.k === "worker" ? "place1d" : U().sel == null ? "place1" : "place1b",
    done: S => after(S, "place", 1) || (S.round === 1 && S.step === "place" && me(S).rs.placed >= 1),
    allow: a => a.type === "place" ? null : a.type === "pass" ? MSG("msg_place_first") : MSG("msg_place") }),
  info("stats", { hl: () => ".pt[data-pid='0'] .stats" }),
  doing("recruit1", { hl: () => "[data-tut=recruit]", done: S => me(S).recruited >= 1 || S.round > 1 || after(S, "place", 1),
    allow: a => (a.type === "place" || a.type === "recruit") ? null : MSG("msg_recruit") }),
  doing("place2", { hl: () => "[data-tut=workers]", done: S => after(S, "place", 1), allow: a => (a.type === "place" || a.type === "pass" || a.type === "recruit") ? null : MSG("msg_place_pass") }),
  doing("build", { hl: () => (U().modal === "market" ? ".modal [data-act=build]:not([disabled])" : "[data-tut=market]"), done: S => builtInManage(S, 1),
    allow: (a, S) => a.type === "build" ? null : a.type === "done" ? ((me(S).builds >= 1 || !(canBuildAny(S, false) || (me(S).freeBuilds && canBuildAny(S, true)))) ? null : MSG("msg_build_first")) : MSG("msg_build") }),
  info("build_rd", { hl: () => "[data-spot=rd]" }),
  doing("rest1", { hl: () => "[data-tut=workers]", done: S => after(S, "rest", 1), allow: a => a.type === "train" ? MSG("msg_train_later") : (a.type === "done" || a.type === "claim") ? null : MSG("msg_rest") }),
  info("upkeep", { hl: () => "[data-tut=steps]" }),
  info("gates", { hl: () => "[data-tut=gates]" }),
  /* ---- round 2: recruit, rest, crunch ---- */
  doing("r2recruit", { hl: () => "[data-tut=recruit]", done: S => me(S).recruited >= 1 || S.round > 2,
    allow: (a, S) => (a.type === "place" || a.type === "recruit") ? null : a.type === "pass" ? MSG("msg_recruit") : MSG("msg_recruit") }),
  doing("r2place", { hl: () => "[data-tut=workers]", done: S => reachedRound(S, 2, "rest"), allow: a => (a.type === "place" || a.type === "pass" || a.type === "recruit") ? null : MSG("msg_place_pass") }),
  doing("r2crunch", { hl: () => (U().modal === "market" ? ".modal [data-act=build]:not([disabled])" : "[data-tut=market]"), done: S => builtInManage(S, 2, true),
    allow: (a, S) => a.type === "build" ? (a.crunch || (S.cfg.rdCrunch && me(S).rd) ? null : MSG("msg_crunch")) : a.type === "done" ? ((me(S).cs.crunched >= 1 || !(canBuildAny(S, false) || (me(S).freeBuilds && canBuildAny(S, true)))) ? null : MSG("msg_crunch")) : null }),
  play("r3", { hl: () => null, done: S => S.round >= 4 }),
  /* ---- production ---- */
  softInfo("gateresult", { hl: () => "[data-tut=gates]" }),
  softInfo("hype_bank", { hl: () => "[data-tut=tracks]" }),
  softInfo("crisis", { hl: () => "[data-tut=crisis]" }),
  play("r4play", { hl: () => null, done: S => reachedRound(S, 4, "rest") }),
  doing("promote", { rv: () => "promote_train", hl: () => "[data-tut=rest]", done: S => me(S).workers.some(w => w.lvl === "Sr") || S.round > 4,
    allow: (a, S) => a.type === "claim" ? null : a.type === "train" ? (S.cfg.train && !trigOk(S, me(S).workers.find(w => w.id === a.worker) || {}) && eligibleJr(S).some(w => trigOk(S, w)) ? MSG("msg_promote_fit") : null) : a.type === "promote" ? (eligibleJr(S).some(w => trigOk(S, w)) && !trigOk(S, me(S).workers.find(w => w.id === a.worker) || {}) ? MSG("msg_promote_fit") : null) : a.type === "done" ? (eligibleJr(S).length ? MSG(S.cfg.train ? "msg_promote_train" : "msg_promote") : null) : MSG(S.cfg.train ? "msg_promote_train" : "msg_promote") }),
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
SI.tutInit = () => ({ idx: 0, ack: {}, auto: false, gaveFree: false, rev: null });
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
  const st = STEPS[T.idx]; T.gave = T.gave || {};
  const key = st.id + ":" + S.round;
  if (st.id === "build" || st.id === "r2crunch") {
    if (!T.gaveFree && st.id === "build" || (st.id === "r2crunch" && !T.gave[key])) {
      if (actorIsMe(S) && !S.dq.length && S.step === "rest") {
        T.gaveFree = true; T.gave[key] = true;
        if (!canBuildAny(S, false) && me(S).freeBuilds < 1) me(S).freeBuilds = 1;
        if (st.id === "r2crunch") me(S).gold += (S.cfg.crunchGold || 2) + 2;   // so a gold crunch is affordable
      }
    }
  }
  if (st.id === "r2recruit" && !T.gave[key] && S.step === "place" && actorIsMe(S)) { T.gave[key] = true; const cost = E.recruitCost(S, 0); if (me(S).gold < cost) me(S).gold = cost; }
  if (st.id === "promote" && !T.gave[key] && S.step === "rest" && actorIsMe(S) && !S.dq.length) {
    T.gave[key] = true;
    // make sure a Junior who fits one of the player's systems can be promoted, so the next lesson (a Senior triggers a system) can be played
    if (S.cfg.train) { const w = me(S).workers.find(x => x.lvl === "Jr" && !x.placed && !x.build && trigOk(S, x)) || me(S).workers.find(x => x.lvl === "Jr" && !x.placed && !x.build); if (w) { w.trained = Math.max(w.trained || 0, S.cfg.trainNeeded - 1); } if (me(S).gold < S.cfg.trainCost) me(S).gold = S.cfg.trainCost; }
    else if (!eligibleJr(S).some(w => trigOk(S, w))) { const w = me(S).workers.find(x => x.lvl === "Jr" && trigOk(S, x)) || (eligibleJr(S).length ? null : me(S).workers.find(x => x.lvl === "Jr")); if (w) { w.worked = true; w.placed = false; } }
  }
};
SI.tutHold = () => SI.tutLockMode() === "hard";
SI.tutGate = function (a) {
  const u = U(), T = u.tut; if (!T || T.auto) return null;
  const st = cur(); if (!st || !st.allow) return null;
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
  let body = SI.L(typeof st.text === "function" ? st.text(S, T) : st.text);
  const waiting = !rv && st.kind === "do" && S.dq.length === 0 && E.currentActor(S) > 0;
  const back = at > 0 ? `<button class="btn" data-act="tut-back">${L("ui_back")}</button>` : "";
  const stop = !rv && !st.final && !st.center ? `<button class="btn" data-act="tut-free">${L("ui_stop")}</button>` : "";
  let btns = "";
  if (rv) btns = back + `<button class="btn primary" data-act="tut-fwd">${T.rev + 1 >= T.idx ? L("ui_fwd_end") : L("ui_fwd")}</button>`;
  else if (st.wrap) btns = `<button class="btn primary" data-act="tut-next">Play the full game with the coach</button><button class="btn" data-act="tut-auto">Fast-forward &amp; explain the score</button><button class="btn" data-act="tut-free">Keep playing without the coach</button>${back}<button class="btn" data-act="tut-exit">Back to menu</button>`;
  else if (st.kind === "info") btns = back + `<button class="btn primary" data-act="tut-next">${esc(st.btn || "Next")}</button>` + stop;
  else btns = back + stop;
  const stepTxt = fmt(rw("ui_step").text, { n: Math.min(at + 1, n), total: n });
  return `<div class="coach ${st.center ? "center" : ""}">${st.center ? "" : '<button class="x" data-act="tut-exit" aria-label="Exit tutorial">×</button>'}
    <div class="cp">${stepTxt}${rv ? " · " + L("ui_review") : ""}</div><div class="ctt">${esc(st.title)}</div><div class="ct">${body}</div>
    ${waiting ? `<div class="cw">${L("ui_wait")}</div>` : ""}${btns ? `<div class="cb">${btns}</div>` : ""}
    <div class="prog"><i style="width:${Math.round((at + 1) / n * 100)}%"></i></div></div>${st.center ? '<div class="coach-dim"></div>' : ""}`;
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
    const el = extra ? rootEl.querySelector(extra) : els[0]; if (el && el.getBoundingClientRect && !u.detail) {
      const coach = rootEl.querySelector(".coach"), cr = coach ? coach.getBoundingClientRect() : null;
      const sc = el.closest(".left,.right"), scrolls = sc && sc.scrollHeight > sc.clientHeight + 2 && getComputedStyle(sc).overflowY !== "visible";
      const box = scrolls ? sc.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
      const top = Math.max(box.top, 0) + 16;
      let bottom = Math.min(box.bottom, window.innerHeight) - 16;
      if (cr && cr.top > window.innerHeight * 0.4 && cr.right > box.left && cr.left < box.right) bottom = Math.min(bottom, cr.top - 12); // the coach covers the lower part of this column
      const r = el.getBoundingClientRect();
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
  ["prodShare", "Progress race", "VP for where your Progress ranks against the other studios: 1st place pays most, ties split the points."],
  ["hypeStrength", "Hype race", "Where your Hype ranks. At the end of the game your Marketing is added to your Hype, so Marketing is permanent buzz while Hype itself fades every round."],
  ["debtPenalty", "Tech Debt", "The studio with the most Debt loses the most VP; the studio with the least loses none. Debt comes from crunched spots and some systems; Quality workers, Engineers and Stability systems clear it."],
  ["culture", "Culture", "The studio with the lowest Culture loses the most VP; the best loses none. Good culture also helps workers stay."],
  ["objectives", "Objectives", "Your secret goals. VP only for the ones you completed."],
  ["synergy", "Synergy", "Bonus when a built system shares a symbol with a completed objective."],
  ["systems", "Systems", "The printed VP on each system you built."],
    ["gold", "Gold", "Leftover gold converts to VP at a fixed rate."],
  ["crisis", "Crisis & Gates", "VP gained or lost from Crisis cards and Publisher Gates (passed gates can pay VP, missed ones cost VP)."]
];
SI.tutScoreExplainer = function (S) {
  const r = S.scores.find(x => x.id === 0); if (!r) return "";
  const note = esc(rw("explain_note").text);
  const PT = PARTS.filter(p => p[0] !== "culture").map(p => [p[0], rw("explain_" + p[0]).title || p[1], rw("explain_" + p[0]).text || p[2]]);
  const q = r.parts;
  return `<div class="explain"><h3>How your ${b(Math.round(r.total) + " VP")} was made</h3>
  <p class="mute" style="margin:2px 0 8px">Your row, in plain language. You finished with ${b(S.players[0].debt + " Debt")} and ${b(S.players[0].mktg + " Marketing")}.</p>
  <table class="scoretbl"><tbody>${PT.map(p => `<tr><td style="white-space:nowrap">${esc(p[1])}</td><td class="mono" style="text-align:right;padding:0 10px">${(+q[p[0]]).toFixed(0)}</td><td class="mute" style="font-size:12px;text-align:left">${esc(p[2])}</td></tr>`).join("")}</tbody></table>
  <p class="mute" style="margin-top:8px">${note}</p></div>`;
};

SI.tutSteps = STEPS;
if (typeof module !== "undefined") module.exports = SI;
})(typeof window !== "undefined" ? window : globalThis);
