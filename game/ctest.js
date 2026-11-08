// Rule checks for the shipped game ("Variant D", config baked into data.js). Run: node ctest.js
global.window = undefined;
const E = require('./engine.js'), B = require('./bot.js'), D = require('./data.js');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m) } else console.log('ok  ', m) };
const mk = (seed, n) => E.newGame(Array.from({ length: n || 2 }, (_, i) => ({ name: 'P' + i, bot: true })), { seed });
const RES = ['ideas', 'code', 'process', 'buzz'];
const W = (id, disc, lvl) => ({ id, disc, lvl: lvl || 'Jr', fat: 0, placed: false, as: null, worked: false });
// advance with the bot until the predicate holds (no pending decisions)
function until(S, f) { let n = 0; while (!S.over && n++ < 20000 && !(f(S) && !S.dq.length)) { const a = B.decide(S); if (!a || !E.act(S, a).ok) break } return S }
const toStep = (S, step, round) => until(S, s => s.step === step && s.round >= (round || 1));
const rich = q => { q.gold = 40; RES.forEach(k => q[k] = 10) };

// ---- shape of the game ----
let S = mk(3);
ok(JSON.stringify(D.phases.map(p => p.rounds)) === '[[1,3],[4,8],[9,11],[12,12]]', 'phases: rounds 1-3, 4-8, 9-11, 12');
ok(S.players.every(p => p.hand === undefined) && S.draft === undefined, 'no hand and no draft');
ok(E.hireCost === undefined, 'no hire cost');
{ const seen = new Set(); const T = mk(4, 3); let g = 0; while (!T.over && g++ < 30000) { seen.add(T.step); const a = B.decide(T); if (!a || !E.act(T, a).ok) break }
  ok(T.over && [...seen].every(s => ['setup', 'crisis', 'place', 'rest'].includes(s)), 'steps are only setup, crisis, place, rest (saw ' + [...seen].join(',') + ')'); }
S = toStep(mk(5), 'place', 1);
{ const a = E.currentActor(S);
  ok(!E.act(S, { type: 'hire', p: a, card: 'x', lvl: 'Jr' }).ok && !E.act(S, { type: 'discard', p: a, card: 'x' }).ok && !E.act(S, { type: 'pick', p: a, card: 'x' }).ok, 'hire, discard and pick actions are gone'); }
ok(S.players.every(p => p.workers.length === S.cfg.startWorkers), 'every studio opens with ' + S.cfg.startWorkers + ' Juniors');

// ---- recruit, price ladder ----
{ // bought workstations last until the phase ends, then reset
  const T = toStep(mk(3, 3), 'place', 2); T.players[0].ws = 5;
  const T2 = until(T, s => s.round === 3 && s.step === 'place'); ok(T2.players[0].ws === 5, 'a bought workstation is back in the next round of the same phase');
  const T3 = until(T2, s => s.round === 4 && s.step === 'place'); ok(T3.players[0].ws === T3.cfg.wsFree, 'a new phase resets workstations to the free ones'); }
{ // workstations: kept across rounds inside a phase, reset at every phase start (rounds 4 and 9), more tests
  const T = toStep(mk(11, 3), 'place', 4); T.players[0].ws = 6;
  const T5 = until(T, s => s.round === 5 && s.step === 'place'); ok(T5.players[0].ws === 6, 'workstations bought in round 4 are still there in round 5');
  const T8 = until(T5, s => s.round === 8 && s.step === 'place'); ok(T8.players[0].ws === 6, 'and in the last round of Production (round 8)');
  const T9 = until(T8, s => s.round === 9 && s.step === 'place'); ok(T9.players.every(q => q.ws === T9.cfg.wsFree), 'round 9 (Polish) resets every studio to the free workstations'); }
{ // buying workstations: cost, the cap and no purchase without Gold
  const T = toStep(mk(12, 2), 'place', 5), a = E.currentActor(T), q = T.players[a]; q.ws = T.cfg.wsFree; q.gold = 10;
  const g0 = q.gold, r = E.act(T, { type: 'buyws', p: a }); ok(r.ok && q.ws === T.cfg.wsFree + 1 && q.gold === g0 - T.cfg.wsCost, 'buying a workstation costs ' + T.cfg.wsCost + 'G and adds one');
  { const seq = []; q.ws = T.cfg.wsFree; q.gold = 40; for (let i = T.cfg.wsFree; i < T.cfg.wsMax; i++) { const g1 = q.gold; ok(E.act(T, { type: 'buyws', p: a }).ok, 'buy desk ' + (i + 1)); seq.push(g1 - q.gold); }
  ok(JSON.stringify(seq) === '[2,2,2,3,4]', 'desks 2 to 6 cost 2, 2, 2, 3 and 4 Gold (got ' + seq + ')'); }
  q.ws = T.cfg.wsMax; ok(!E.act(T, { type: 'buyws', p: a }).ok, 'cannot buy past the workstation cap (' + T.cfg.wsMax + ')');
  q.ws = T.cfg.wsFree; q.gold = T.cfg.wsCost - 1; ok(!E.act(T, { type: 'buyws', p: a }).ok, 'cannot buy a workstation without the Gold'); }
{ // training in the Place step: a free action on your own turn
  const T = toStep(mk(13, 3), 'place', 5), a = E.currentActor(T), q = T.players[a], other = T.players.find(x => x.id !== a);
  q.gold = 10; q.rs.trains = 0; q.workers.forEach(w => { w.lvl = 'Jr'; w.placed = false; w.build = null; w.training = false; w.trainNow = false; w.benched = false });
  const w = q.workers[0], g0 = q.gold, cul0 = q.burnout;
  ok(!E.act(T, { type: 'train', p: other.id, worker: other.workers[0].id }).ok, 'training in Place is refused when it is not your turn');
  const r = E.act(T, { type: 'train', p: a, worker: w.id });
  ok(r.ok && q.gold === g0 - T.cfg.trainCost && w.trainNow && w.training && w.trained >= 1, 'train in Place costs ' + T.cfg.trainCost + 'G and the Junior is training now');
  ok(E.currentActor(T) === a, 'training does not use up your turn');
  ok(E.placementOptions(T, a, w)[0].ok === false, 'the trainee cannot be placed for the rest of this round');
  const tgt = E.placementOptions(T, a, q.workers[3] || q.workers[1]).find(o => o.ok); ok(!!tgt && E.act(T, { type: 'place', p: a, worker: w.id, target: tgt.target }).ok === false, 'placing the trainee on a tile that is open to others is rejected');
  q.rs.trains = T.cfg.trainsPerRest; ok(!E.act(T, { type: 'train', p: a, worker: q.workers[1].id }).ok, 'the per-round training limit also applies in Place');
  q.rs.trains = 0; q.gold = 0; ok(!E.act(T, { type: 'train', p: a, worker: q.workers[1].id }).ok, 'training in Place needs Gold');
  q.gold = 10; const Wn = q.workers[1]; Wn.placed = true; ok(!E.act(T, { type: 'train', p: a, worker: Wn.id }).ok, 'a worker already placed this round cannot train'); Wn.placed = false;
  const srv = q.workers[2]; srv.lvl = 'Sr'; ok(!E.act(T, { type: 'train', p: a, worker: srv.id }).ok, 'Seniors cannot train'); srv.lvl = 'Jr';
  // the trainee is available again next round
  const T2 = until(T, s => s.round === 6 && s.step === 'place'), w2 = T2.players[a].workers.find(x => x.id === w.id);
  ok(w2 && !w2.benched && !w2.trainNow, 'a worker trained in Place is back next round (no extra round away)'); }
{ // no training in the last round
  const T = toStep(mk(14, 2), 'place', 12), a = E.currentActor(T), q = T.players[a]; q.gold = 10; q.rs.trains = 0; q.workers.forEach(w => { w.lvl = 'Jr'; w.placed = false; w.build = null; w.training = false; w.trainNow = false; w.benched = false });
  ok(!E.act(T, { type: 'train', p: a, worker: q.workers[0].id }).ok, 'no training in round 12'); }
S = toStep(mk(3, 3), 'place', 3);
{ const a = E.currentActor(S), p = S.players[a];
  S.players.forEach(x => { x.gold = 20; x.hireDiscount = 0 }); const cost = E.recruitCost(S, a), n0 = p.workers.length;
  let r = E.act(S, { type: 'recruit', p: a, idx: 0 });
  ok(r.ok && p.workers.length === n0 + 1 && p.gold === 20 - cost, 'recruit costs ' + cost + 'G and adds a worker');
  const nw = p.workers[p.workers.length - 1]; ok(nw.lvl === 'Jr' && !nw.placed, 'recruit is a Jr, can be placed this round');
  ok(S.recruit[0].by === a, 'offer marked taken');
  ok(!E.canRecruit(S, a, 1).ok, 'second hire in the same round refused');
  const b = E.currentActor(S); ok(b !== a, 'recruiting uses the turn');
  ok(!E.canRecruit(S, b, 0).ok, 'taken offer unavailable to others');
  ok(E.canRecruit(S, b, 1).ok && E.recruitCost(S, b) === cost + 1, 'price ladder: next recruit costs 1G more'); }

// ---- Senior-only systems, strike teams, spots ----
S = toStep(mk(5), 'place', 4);
{ const pi = E.currentActor(S), q = S.players[pi];
  q.systems = [{ name: 'Unit Tests', cat: 'Stability', t: false }]; q.workers.push(W(999, 'QA', 'Jr'), W(1000, 'QA', 'Sr'));
  let o = E.placementOptions(S, pi, q.workers.find(w => w.id === 999)).find(x => x.target === 'sys:0');
  ok(o && !o.ok && /Senior/.test(o.reason), 'Jr cannot trigger a system');
  o = E.placementOptions(S, pi, q.workers.find(w => w.id === 1000)).find(x => x.target === 'sys:0'); ok(o && o.ok, 'Sr can trigger a system'); }
{ // strike team: needs the right rested categories
  const T = toStep(mk(6, 4), 'place', 3); const pi = E.currentActor(T), q = T.players[pi];
  const spot = E.activeSpots(T).find(s => s.crew && s.crew.length === 1 && s.crew[0].length === 2 && s.crew[0].every(c => c !== 'Any') && !T.occ[s.id] && (s.phases || []).includes(T.phase));
  ok(!!spot, 'a two-category strike team spot is on the board');
  if (spot) {
    const [c1, c2] = spot.crew[0], disc = c => D.categories[c].discs.find(d => d !== 'QA');
    q.workers = [W(901, disc(c1)), W(902, disc(c2))]; q.ws = 9; q.wsUsed = 0;
    let o = E.placementOptions(T, pi, q.workers[0]).find(x => x.target === 'spot:' + spot.id);
    ok(o && o.ok && o.plans && o.plans[0].ids.join() === '902', 'strike team forms from a rested worker of the other category');
    q.workers[1].placed = true; o = E.placementOptions(T, pi, q.workers[0]).find(x => x.target === 'spot:' + spot.id);
    ok(o && !o.ok && /strike team/i.test(o.reason), 'strike team refused when the partner already worked');
    q.workers[1].placed = false; const r0 = E.act(T, { type: 'place', p: pi, worker: 901, target: 'spot:' + spot.id }); ok(!r0.ok && /Choose which/.test(r0.error), 'a strike team needs the player to choose the partner'); const r = E.act(T, { type: 'place', p: pi, worker: 901, target: 'spot:' + spot.id, crew: [902] });
    ok(r.ok && q.workers[0].placed && q.workers[0].fat === 1 && q.workers[1].fat === 1 && T.occ[spot.id].includes(pi), 'strike team placement tires both workers and occupies the spot'); } }
{ // single spots are exclusive
  const T = toStep(mk(7, 2), 'place', 3); const pi = E.currentActor(T), q = T.players[pi], oth = T.players.find(p => p.id !== pi);
  const spot = E.activeSpots(T).find(s => (s.mode || 'single') === 'single' && !s.crew && !s.special && s.discs.includes('ENG') && (s.phases || []).includes(T.phase));
  if (spot) { T.occ[spot.id] = [oth.id]; q.workers.push(W(950, 'ENG')); const o = E.placementOptions(T, pi, q.workers.find(w => w.id === 950)).find(x => x.target === 'spot:' + spot.id);
    ok(o && !o.ok && /Occupied/.test(o.reason), 'an occupied single spot is refused'); } else ok(false, 'found a single ENG spot'); }

// ---- build: delay, crunch, completion, limits (build lives in the Rest step) ----
const VC = () => D.systems.find(s => s.name === 'Version Control');
const mkBuild = (seed, round, inst) => { const T = mk(seed); T.cfg.instantBuild = inst ? 1 : 0; toStep(T, 'rest', round || 4); const pi = E.currentActor(T), q = T.players[pi]; q.rd = false; q.systems = []; q.building = []; q.builds = 0; q.freeBuilds = 0; rich(q);
  q.workers = [W(901, 'ENG'), W(902, 'QA')]; T.sysAvail['Version Control'] = true; T.market.Stability = ['Version Control']; return { T, pi, q } };
{ const { T, pi, q } = mkBuild(6); const rd0 = T.round;
  let r = E.act(T, { type: 'build', p: pi, name: 'Version Control' });
  ok(r.ok && q.building.length === 1 && q.building[0].rdy === rd0 + 2 && q.systems.length === 0, 'normal build is ready in 2 rounds');
  ok(q.workers.find(w => w.id === 901).build === 'Version Control', 'build commits its crew worker');
  ok(!E.canBuild(T, pi, 'Version Control').ok, 'a built tile leaves the market'); }
{ const { T, pi, q } = mkBuild(6); const g1 = q.gold, base = E.buildCost(T, q, VC(), false).gold;
  const r = E.act(T, { type: 'build', p: pi, name: 'Version Control', crunch: 'gold' });
  ok(r.ok && q.building[0].rdy === T.round + 1 && q.gold === g1 - base - T.cfg.crunchGold, 'crunch with Gold: ready next round, costs ' + T.cfg.crunchGold + 'G extra');
  const rr = T.round; until(T, s => s.round > rr);
  ok(q.systems.some(s => s.name === 'Version Control') && q.building.length === 0, 'the rushed system joins the studio at the next round'); }
{ const { T, pi, q } = mkBuild(6);
  const r = E.act(T, { type: 'build', p: pi, name: 'Version Control', crunch: 'fat' }); ok(r.ok && q.building[0].rdy === T.round + 1 && q.workers.some(w => w.fat > 0), 'crunch with fatigue: ready next round, a worker is more tired'); }
{ const { T, pi, q } = mkBuild(6); q.rd = true; ok(E.buildDelay(T, q, undefined, VC()) === 1, 'R&D makes the build a free rush'); }
{ const { T, pi, q } = mkBuild(6); q.workers = [W(901, 'ART')]; ok(!E.canBuild(T, pi, 'Version Control').ok, 'build needs the right crew'); }
{ const { T, pi, q } = mkBuild(6); q.builds = T.cfg.buildsPerRound; ok(!E.canBuild(T, pi, 'Version Control').ok, 'build limit per round'); }
{ const { T, pi, q } = mkBuild(6); q.gold = 0; RES.forEach(k => q[k] = 0); ok(!E.canBuild(T, pi, 'Version Control').ok, 'build needs skills and Gold'); }
{ const { T, pi, q } = mkBuild(7, 11); ok(T.round === 11, 'reached round 11');
  ok(!E.canBuild(T, pi, 'Version Control', false, undefined).ok, 'normal build blocked in round 11'); ok(E.canBuild(T, pi, 'Version Control', false, 'gold').ok, 'crunched build allowed in round 11'); }

// ---- instant build (toggle): no build time, crunch = bonus Progress, R&D = skills of choice ----
{ const { T, pi, q } = mkBuild(6, 4, true); const g1 = q.gold, p1 = q.prod;
  const r = E.act(T, { type: 'build', p: pi, name: 'Version Control' });
  ok(r.ok && q.systems.some(s => s.name === 'Version Control') && q.building.length === 0, 'instant: system joins the studio at once');
  ok(!q.workers.some(w => w.build), 'instant: no crew is locked'); ok(q.prod === p1, 'instant: no crunch, no bonus Progress'); }
{ const { T, pi, q } = mkBuild(6, 4, true); const g1 = q.gold, p1 = q.prod, base = E.buildCost(T, q, VC(), false).gold;
  const r = E.act(T, { type: 'build', p: pi, name: 'Version Control', crunch: 'gold' });
  ok(r.ok && q.prod === p1 + T.cfg.crunchProgress && q.gold === g1 - base - T.cfg.crunchGold, 'instant: crunch with Gold = +' + T.cfg.crunchProgress + ' Progress for ' + T.cfg.crunchGold + 'G'); }
{ const { T, pi, q } = mkBuild(6, 4, true); const r = E.act(T, { type: 'build', p: pi, name: 'Version Control', crunch: 'fat' });
  ok(r.ok && q.workers.some(w => w.fat > 0) && q.prod >= 0, 'instant: crunch by tiring a worker still tires one'); }
{ const { T, pi, q } = mkBuild(7, 12, true); ok(E.canBuild(T, pi, 'Version Control').ok, 'instant: building is allowed in the last round'); }
{ const { T, pi, q } = mkBuild(6, 4, true); q.rd = true; ok(E.buildDelay(T, q, undefined, VC()) === 0 && !E.rdFree(T, q), 'instant: R&D no longer rushes builds'); }
{ const T = mk(31, 2); T.cfg.instantBuild = 1; toStep(T, 'place', 3); const pi = E.currentActor(T), q = T.players[pi];
  q.workers.push(W(960, 'ENG'), W(961, 'PROD'), W(962, 'ART')); q.workers.forEach(w => { w.placed = false; w.build = null; w.fat = 0 }); q.ws = 9; q.ideas = 0; q.code = 0; q.process = 0; q.buzz = 0;
  const rd = E.activeSpots(T).find(s => s.special === 'rd'); if (rd) { const o = E.placementOptions(T, pi, q.workers.find(w => w.id === 960)).find(x => x.target === 'spot:rd');
    const r = o && o.ok ? E.act(T, { type: 'place', p: pi, worker: 960, target: 'spot:rd', as: o.as && o.as[0], crew: o.plans && o.plans[0] ? o.plans[0].ids : undefined, rd: ['code', 'code'] }) : { ok: false };
    ok(r.ok && q.code >= 2, 'instant: R&D gives the two chosen skills'); } else ok(true, 'R&D not on this board phase'); }

// ---- convert (Launch) ----
S = toStep(mk(8), 'place', 12);
{ const pi = E.currentActor(S), q = S.players[pi]; q.ideas = 7; q.workers.push(W(902, 'ART')); q.ws = 9; const pr0 = q.prod;
  const r = E.act(S, { type: 'place', p: pi, worker: 902, target: 'spot:convert', conv: 'prod' });
  ok(r.ok && q.ideas === 1 && q.prod === pr0 + 2, 'convert 6 Ideas into 2 Progress (3:1)'); }

// ---- rest: promote, train ----
const mkRest = seed => { const T = mk(seed); toStep(T, 'rest', 4); const pi = E.currentActor(T), p = T.players[pi];
  p.workers.forEach(w => { w.placed = false; w.build = null; w.lvl = 'Jr'; w.trained = 0; w.training = false; w.trainNow = false; w.trainLeft = 0; w.benched = false; w.worked = false; w.fat = 0 });
  p.rs.trains = 0; p.promos = 0; p.gold = 10; p.culture = 0; return { T, pi, p } };
{ const { T, pi, p } = mkRest(10); const [w1, w2] = p.workers;
  w1.worked = true; w1.fat = 1;
  let r = E.act(T, { type: 'promote', p: pi, worker: w2.id }); ok(!r.ok, 'cannot promote a worker who has not worked');
  const g = p.gold, pg = E.promoGold(T); r = E.act(T, { type: 'promote', p: pi, worker: w1.id }); ok(r.ok && w1.lvl === 'Sr' && p.gold === g - pg, 'promote a rested worker who has worked (' + pg + 'G at this player count)');
  w2.worked = true; w2.fat = 1; r = E.act(T, { type: 'promote', p: pi, worker: w2.id }); ok(!r.ok, 'promotion limit per Rest'); }
{ const { T, pi, p } = mkRest(10); const w = p.workers[0]; w.worked = true; w.fat = 2;
  ok(E.act(T, { type: 'promote', p: pi, worker: w.id }).ok, 'a worker who worked earlier and sits out this round can be promoted even if Exhausted (rest lowers fatigue at Upkeep)'); }
{ const { T, pi, p } = mkRest(11); const w = p.workers[0], g0 = p.gold, b0 = p.burnout;
  let r = E.act(T, { type: 'train', p: pi, worker: w.id });
  ok(r.ok && p.gold === g0 - T.cfg.trainCost && p.burnout === Math.max(0, b0 - T.cfg.trainCulture) && w.training && w.trained === 1 && w.trainLeft >= 1, 'train: costs ' + T.cfg.trainCost + 'G, eases Burnout, trainee sits out next round');
  ok(!E.act(T, { type: 'train', p: pi, worker: w.id }).ok, 'a worker already training cannot train again');
  ok(E.act(T, { type: 'promote', p: pi, worker: w.id }).ok && w.lvl === 'Sr', 'one training is enough to promote (trainNeeded ' + T.cfg.trainNeeded + ')');
  ok(!E.act(T, { type: 'fire', p: pi, worker: p.workers[1].id }).ok, 'releasing workers is not possible');
  p.workers[1].placed = true; ok(!E.act(T, { type: 'train', p: pi, worker: p.workers[1].id }).ok, 'a worker who worked this round cannot train');
  p.workers[1].placed = false; p.gold = 0; ok(!E.act(T, { type: 'train', p: pi, worker: p.workers[1].id }).ok, 'training needs Gold');
  p.gold = 10; p.rs.trains = T.cfg.trainsPerRest; ok(!E.act(T, { type: 'train', p: pi, worker: p.workers[1].id }).ok, 'training limit per round');
  p.rs.trains = 0; const tw = p.workers[2]; E.act(T, { type: 'train', p: pi, worker: tw.id });
  const rr = T.round; until(T, s => s.round > rr && s.step === 'place');
  ok(tw.benched === 'Training' && E.placementOptions(T, T.players.indexOf(p), tw)[0].ok === false, 'a trainee sits out the next round'); }
{ const { T, pi } = mkRest(12); ok(!E.act(T, { type: 'recruit', p: pi, idx: 0 }).ok, 'recruiting is a Place action, not a Rest action'); }

// ---- burnout ----
{ let allOk = true, seen = 0;
  for (const n of [2, 4, 6]) for (let sd = 1; sd <= 6; sd++) { const T = mk(sd, n); B.run(T, 40000); if (!T.over) allOk = false; T.players.forEach(p => { if (p.burnout < 0 || p.burnout > T.cfg.burnMax) allOk = false; seen += p.burnout }); if (!T.scores.every(x => typeof x.parts.burnout === 'number')) allOk = false }
  ok(allOk && seen > 0, 'bot games finish, Burnout stays on the track and is scored');
  const T = mk(5), p = T.players[0]; p.burnout = 0; p.culture = 2;
  ok(E.burnBand(T, p) === 'Energized', 'band: Energized at Burnout 0'); p.burnout = 2; ok(E.burnBand(T, p) === 'Steady', 'band: Steady');
  p.burnout = T.cfg.burnStrainAt; ok(E.burnBand(T, p) === 'Strained', 'band: Strained'); p.burnout = T.cfg.burnBenchAt; ok(E.burnBand(T, p) === 'Burned out', 'band: Burned out'); p.burnout = T.cfg.burnQuitAt; ok(E.burnBand(T, p) === 'Meltdown', 'band: Meltdown');
  E.statChange(T, 0, 'burnout', 99); ok(p.burnout === T.cfg.burnMax, 'Burnout is capped at the top of the track'); E.statChange(T, 0, 'burnout', -99); ok(p.burnout === 0, 'Burnout cannot go below 0');
  const b = p.burnout; E.statChange(T, 0, 'culture', -1); ok(p.burnout === b + 1, 'a Culture loss adds Burnout'); E.statChange(T, 0, 'culture', 2); ok(p.burnout === Math.max(0, b + 1 - 2), 'a Culture gain eases Burnout');
  p.burnout = 0; ok(E.cultureOf(T, p) === T.cfg.cultureFoldBase, 'Culture reads as base minus Burnout'); p.burnout = 4; ok(E.cultureOf(T, p) === T.cfg.cultureFoldBase - 4, 'Burnout 4 reads as lower Culture'); }
{ // Burned out benches the most tired worker at Income
  const T = toStep(mk(13), 'rest', 3); const p = T.players[0]; p.burnout = T.cfg.burnBenchAt; p.workers.forEach(w => { w.fat = 0; w.build = null }); p.workers[1].fat = 1;
  const rr = T.round; until(T, s => s.round > rr && s.step === 'place');
  ok(T.players[0].workers.some(w => w.benched === 'Burned out') || T.players[0].burnout < T.cfg.burnBenchAt, 'Burned out benches a worker (or a calm round eased it first)'); }
{ const T = toStep(mk(13), 'rest', 3); const p = T.players[0]; p.burnout = T.cfg.burnQuitAt; p.workers.forEach(w => { w.build = null }); const n = p.workers.length;
  const rr = T.round; until(T, s => s.round > rr && s.step === 'place'); ok(T.players[0].workers.length <= n, 'Meltdown never adds workers'); }

// ---- milestones ----
{ const T = toStep(mk(14), 'rest', 4); const pi = E.currentActor(T), p = T.players[pi];
  ok(p.miles.length > 0, 'players hold a milestone hand');
  ok(!E.act(T, { type: 'claim', p: pi, mile: -1 }).ok, 'claim with a bad id is refused');
  const idx2 = T.data.milestones.findIndex(m => m.name === 'First Promotion'); ok(idx2 >= 0, 'test milestone exists');
  if (!p.miles.includes(idx2)) p.miles.push(idx2); p.cs.promotions = 0;
  ok(!E.act(T, { type: 'claim', p: pi, mile: idx2 }).ok, 'milestone refused when the requirement is not met');
  p.cs.promotions = 1; const m = T.data.milestones[idx2], g0 = p.gold, nc = p.claimed.length, inWin = !m.phases || !m.phases.length || m.phases.includes(T.phase);
  const r = E.act(T, { type: 'claim', p: pi, mile: idx2 });
  ok(inWin ? (r.ok && p.gold === g0 + m.gold && p.claimed.length === nc + 1 && !p.miles.includes(idx2)) : !r.ok, 'milestone pays its Gold once the requirement is met inside its phase window'); }
{ const T = mk(14); T.phase = 0; const m = T.data.milestones.find(m => m.phases && m.phases.length && !m.phases.includes(0));
  ok(E.mileWindow(T, m) !== 'open', 'a milestone outside its phase window is not open'); }

// ---- gates ----
{ const T = mk(21); let g = 0;
  while (!T.over && !T.gateSet && g++ < 4000) if (!B.step(T).ok) break;
  ok(T.gateSet && T.gateSet.length === 4 && T.gateSet.every((x, i) => x.phase === i), 'one publisher gate per phase is drawn after round 1'); }
{ const mkG = lv => { const T = E.newGame([{ name: 'A', bot: true }, { name: 'B', bot: true }], { seed: 21, config: { gateLevels: lv } }); let g = 0; while (!T.over && !T.gateSet && g++ < 4000) if (!B.step(T).ok) break; return T };
  const M = mkG(null), H = mkG(['H', 'H', 'H', 'H']), Z = mkG(['E', 'M', 'H', 'E']);
  ok(M.gateSet.every(g => !g.lvl || g.lvl === 'M'), 'no gateLevels: gates are Medium as printed');
  ok(H.gateSet.every(g => g.lvl === 'H'), 'Hard on every phase');
  const pen = S => S.gateSet.reduce((t, g) => t + g.penalty, 0), sum = S => S.gateSet.reduce((t, g) => t + (g.fund || 0) + (g.vp || 0), 0);
  ok(pen(H) > pen(M), 'Hard gates have bigger miss penalties'); ok(sum(H) >= sum(M), 'Hard gates pay at least as much');
  ok(Z.gateSet.map(g => g.lvl).join('') === 'EMHE', 'levels follow the phase order given');
  const num = g => g.reqs.map(r => +((r.match(/^(\d+)\+/) || [])[1] || 0)).reduce((a, b) => a + b, 0);
  ok(H.gateSet.reduce((t, g) => t + num(g), 0) > M.gateSet.reduce((t, g) => t + num(g), 0), 'Hard gates have higher targets');
  ok(H.gateSet.concat(M.gateSet).every(g => g.reqs.every(x => !/Debt < (0|100)/.test(x))), 'Debt limits stay in range'); }
{ // a gate pays funding to a studio that meets it and costs VP when missed (resolved at the end of the phase, round 3)
  const T = mk(22); toStep(T, 'rest', 3); const gate = T.gateSet[0];
  ok(T.round === 3 && gate.phase === 0, 'reached the end of Phase 1 with its gate drawn');
  const need = parseInt(gate.reqs[0], 10), p0 = T.players[0], p1 = T.players[1];
  p0.prod = need + 5; p1.prod = 0; p0.debt = 0; p1.debt = 0; const v0 = p0.vpAdj, v1 = p1.vpAdj, n = (T.gates || []).length;
  until(T, s => s.round > 3 || s.over); const res = T.gates[n];
  ok(res && res.phase === 0 && res.passed.includes(0) && res.failed.includes(1), 'gate: the studio at target passes, the one below fails');
  ok(p1.vpAdj === v1 - gate.penalty && p0.vpAdj === v0 + (gate.vp || 0), 'a missed gate costs its VP penalty'); }

// ---- crisis cards, incl. auctions ----
function crisisGame(card, seed, n) {
  const T = mk(seed, n || 3), deck = T.data.crisis.find(c => c.id === card).deck; T.decks.crisis[deck].push(card); // top of the deck
  let g = 0;
  while (!T.over && g++ < 30000 && T.crisisCard !== card) { const a = B.decide(T); if (!a || !E.act(T, a).ok) break }
  return T;
}
for (const [card, seed] of [['earlyaccess', 31], ['breakthrough', 32], ['viral', 33]]) {
  const T = crisisGame(card, seed, 3);
  if (T.crisisCard !== card) { ok(false, card + ' reached'); continue }
  ok(T.dq.filter(d => d.t === 'bid').length === 3 && T.dq.some(d => d.t === 'auto' && d.fn === 'auction'), card + ': every studio bids, then the auction resolves');
  T.players.forEach(p => { p.gold = 20; p.hype = 0 }); T.players.forEach(p => p.freeBuilds = 0);
  const bids = [3, 7, 1]; let i = 0; while (T.dq.length && T.dq[0].t === 'bid') { const pi = T.dq[0].p; if (i === 0) { ok(!E.act(T, { type: 'bid', p: pi, amount: 9999 }).ok, card + ': a bid above your Gold is refused'); ok(!E.act(T, { type: 'bid', p: pi, amount: -1 }).ok, card + ': a negative bid is refused'); } const r = E.act(T, { type: 'bid', p: pi, amount: bids[pi] }); if (!r.ok) break; i++ }
  ok(i === 3 && !T.dq.some(d => d.t === 'auto'), card + ': bids accepted and the auction resolved');
  const L = T.log.map(l => l.m).join('\n'), w = T.players[1];
  ok(new RegExp('P1 wins .*pays 7G').test(L), card + ': the highest bidder wins and pays his bid');
  if (card === 'breakthrough') ok(w.freeBuilds === 1 && T.players[0].freeBuilds === 0, 'Tech Breakthrough: the winner gets a free build');
  if (card === 'viral') ok(w.hype > 0, 'Viral Moment: the winner gains Hype');
  if (card === 'earlyaccess') ok(w.hype > 0 && /P0 \+\d+G/.test(L), 'Early Access: the winner gains Hype, the runner-up gets Gold'); }
for (const card of ['platform', 'creep', 'buyout', 'bug', 'patch', 'raid', 'departure', 'burnout', 'conference', 'award', 'investor', 'talentwar']) {
  const T = crisisGame(card, 40 + card.length, 3); if (T.crisisCard !== card) { ok(false, card + ' reached'); continue }
  const done = until(T, s => s.step === 'place' || s.over); ok(done.step === 'place' || done.over, 'crisis ' + card + ' resolves and play continues'); }

// ---- scoring by rank ----
{ const T = mk(50, 3); T.players.forEach(p => { p.prod = 0; p.hype = 0; p.mktg = 0; p.debt = 0; p.gold = 0; p.vpAdj = 0; p.burnout = 0; p.objectives = []; p.systems = [] });
  T.players[0].prod = 30; T.players[1].prod = 20; T.players[2].prod = 10; const s = E.score(T), tab = E.rankTable(T.cfg, 3);
  ok(s[0].parts.prodShare > s[1].parts.prodShare && s[1].parts.prodShare > s[2].parts.prodShare, 'Progress is scored by rank');
  ok(s[0].parts.prodShare === Math.floor(30 * T.cfg.raceNum / T.cfg.raceDen) && s[1].parts.prodShare === Math.floor(20 * T.cfg.raceNum / T.cfg.raceDen), 'Progress scores 1 VP per raceDen points');
  T.players[1].prod = 30; const s2 = E.score(T); ok(s2[0].parts.prodShare === s2[1].parts.prodShare, 'a tie splits (and rounds down) the rank VP');
  T.players[2].debt = 6; T.players[2].prod = 10; const s3 = E.score(T); ok(s3[2].parts.debtPenalty <= s3[0].parts.debtPenalty, 'the studio with most Debt takes the biggest Debt penalty');
  T.players[0].hype = 9; ok(E.score(T)[0].parts.hypeStrength > E.score(T)[1].parts.hypeStrength, 'Hype is scored by rank');
  T.players[0].gold = 20; ok(E.score(T)[0].parts.gold === Math.floor(20 / T.cfg.goldPerVP), 'leftover Gold converts to VP');
  T.players[0].burnout = 5; ok(E.score(T)[0].parts.burnout === (T.cfg.burnVP['5'] || 0), 'Burnout VP follows the printed track'); }

// ---- 2-5 players ----
for (const n of [2, 3, 4, 5]) { const T = mk(60 + n, n); const R = toStep(mk(60 + n, n), 'place', 1); const spots = E.activeSpots(T).length; B.run(T, 40000);
  ok(T.over && T.scores.length === n && T.winner != null && T.players.every(p => p.workers.length >= 1), n + ' players: a bot game finishes with scores and a winner');
  ok(spots > 0, n + ' players: board has spots (' + spots + ')');
  ok(R.recruit.length === E.recruitSize(R), n + ' players: recruitment pool size ' + R.recruit.length); }
{ const cnt = n => { const T = mk(3, n); T.phase = 1; return E.activeSpots(T).length }; ok(cnt(2) < cnt(4) && cnt(4) <= cnt(6), 'smaller tables play on a smaller board (' + [2, 4, 6].map(cnt).join('/') + ' spots)'); }

/* bot difficulty presets: every preset finishes a game at every table size, and the Optimizer preset really differs from Standard */
{ const names = B.profileNames.map(x => x[0]);
  ok(names.length >= 5 && names.includes('novice') && names.includes('max'), 'bot skill presets are listed (' + names.map(x => x || 'standard').join(', ') + ')');
  const play = (pf, n, seed) => { const T = mk(seed, n); T.players.forEach((p, i) => { if (i === 0) p.profile = pf }); let g = 0; while (!T.over && g++ < 80000) { if (!B.step(T).ok) break } return T };
  names.forEach(pf => [2, 3, 4, 5].forEach(n => { const T = play(pf, n, 11); ok(T.over && T.winner != null, 'preset "' + (pf || 'standard') + '" finishes a ' + n + '-player game') }));
  const a = play('', 4, 21), b = play('max', 4, 21);
  ok(JSON.stringify(a.scores.map(s => s.total)) !== JSON.stringify(b.scores.map(s => s.total)), 'the Optimizer preset plays differently from Standard (profile is picked up from the saved config)'); }
console.log('fails', fails);
