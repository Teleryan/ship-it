// Random-play fuzzer for the shipped rules: legal-looking random actions (with the bot as fallback), then invariant checks.
// Run: node game/fuzz.js [seedsPerCount=60]   (npm run fuzz)
global.window = undefined;
const E = require('./engine.js'), B = require('./bot.js');
const cnt = {}; let errs = 0; const seeds = +process.argv[2] || 60;
const R = (S, n) => E.rint(S, n);
function fuzzAct(S) {
  const pi = E.currentActor(S), p = S.players[pi], d = S.dq[0], tries = [];
  if (d) {
    if (d.t === 'choose') { const ok = d.options.filter(o => !o.disabled); tries.push({ type: 'choose', p: pi, k: ok[R(S, ok.length)].k }); }
    else if (d.t === 'raidHire') { tries.push({ type: 'raid', p: pi, disc: E.DISCS[R(S, E.DISCS.length)], lvl: R(S, 2) ? 'Sr' : 'Jr' }); tries.push({ type: 'skip', p: pi }); }
    else if (d.t === 'pivot') tries.push({ type: 'pivot', p: pi, replace: !!R(S, 2) });
    else if (d.t === 'keepMile') tries.push({ type: 'keepMile', p: pi, keep: [d.opts[R(S, d.opts.length)]] });
    else if (d.t === 'bid') { tries.push({ type: 'bid', p: pi, amount: R(S, p.gold + 3) }); }
    else if (d.t === 'patch') { tries.push({ type: 'patchFix', p: pi, idx: R(S, 3) }); tries.push({ type: 'patchDone', p: pi }); }
    else tries.push(B.decide(S));
  } else if (S.step === 'rest') {
    const k = ['promote', 'train', 'build', 'build', 'refresh', 'claim', 'done', 'done'][R(S, 8)];
    if (k === 'promote' && p.workers.length) tries.push({ type: 'promote', p: pi, worker: p.workers[R(S, p.workers.length)].id });
    else if (k === 'train' && p.workers.length) tries.push({ type: 'train', p: pi, worker: p.workers[R(S, p.workers.length)].id });
    else if (k === 'build') { const sy = S.data.systems[R(S, S.data.systems.length)]; tries.push({ type: 'build', p: pi, name: sy.name, crunch: ['gold', 'fat', undefined][R(S, 3)], free: !!R(S, 2) }); }
    else if (k === 'refresh') { const cat = E.CATS[R(S, E.CATS.length)]; if ((S.market[cat] || []).length) tries.push({ type: 'refresh', p: pi, name: S.market[cat][0] }); }
    else if (k === 'claim' && p.miles.length) tries.push({ type: 'claim', p: pi, mile: p.miles[R(S, p.miles.length)] });
    tries.push({ type: 'done', p: pi });
  } else if (S.step === 'place') {
    const opts = []; p.workers.forEach(w => E.placementOptions(S, pi, w).forEach(o => { if (o.ok) opts.push({ w, o }); }));
    if (opts.length) {
      const x = opts[R(S, opts.length)];
      const a = { type: 'place', conv: R(S, 2) ? 'hype' : 'prod', p: pi, worker: x.w.id, target: x.o.target, as: x.o.as ? x.o.as[R(S, x.o.as.length)] : undefined, bonus: R(S, 2) ? 'mktg' : 'prod', alt: ['fixdebt', 'hype', undefined][R(S, 3)], choice: R(S, 2) };
      if (x.o.plans) a.crew = x.o.plans[R(S, x.o.plans.length)].ids;
      if (x.o.spot && x.o.spot.special === 'mentor') { const jr = p.workers.find(y => y.lvl === 'Jr' && y.disc === x.w.disc); if (jr) a.jr = jr.id; }
      tries.push(a);
    }
    if (R(S, 4) === 0) tries.unshift({ type: 'recruit', p: pi, idx: R(S, 5) });
    if (R(S, 8) === 0) tries.unshift({ type: 'buyws', p: pi });
    tries.push({ type: 'pass', p: pi });
  } else tries.push(B.decide(S));
  for (const a of tries) { if (!a) continue; const r = E.act(S, a); if (r.ok) return true; }
  const a = B.decide(S); const r = E.act(S, a);
  if (!r.ok) { errs++; console.log('STUCK', S.step, JSON.stringify(a), r.error); return false; }
  return true;
}
for (const n of [2, 3, 4, 5]) {
  for (let seed = 1; seed <= seeds; seed++) {
    const seats = []; for (let i = 0; i < n; i++) seats.push({ name: 'P' + (i + 1) });
    const S = E.newGame(seats, { seed }); let k = 0;
    try { while (!S.over && k++ < 20000) { if (!fuzzAct(S)) break; } } catch (e) { console.log('EXC', n, seed, e.stack.split('\n').slice(0, 5).join('|')); errs++; break; }
    if (!S.over) { console.log('NOT OVER', n, seed, S.step, S.round, JSON.stringify(S.dq[0])); errs++; }
    S.log.forEach(l => { const m = l.m.match(/^CRISIS: ([^:]+)/); if (m) cnt[m[1].trim()] = (cnt[m[1].trim()] || 0) + 1; });
    S.players.forEach(p => {
      ['gold', 'prod', 'mktg', 'hype', 'debt'].forEach(f => { if (!(p[f] >= 0) || !Number.isFinite(p[f])) { console.log('BAD', f, p[f]); errs++; } });
      if (p.burnout < 0 || p.burnout > S.cfg.burnMax) { console.log('BAD burnout', p.burnout); errs++; }
      if (p.systems.length + p.building.length > S.cfg.maxSystems) { console.log('too many systems', p.systems.length, p.building.length); errs++; }
      const ids = p.workers.map(w => w.id); if (new Set(ids).size !== ids.length) { console.log('dup worker'); errs++; }
      ['ideas', 'code', 'process', 'buzz'].forEach(r => { if (p[r] < 0 || p[r] > S.cfg.resCap) { console.log('BAD res', r, p[r]); errs++; } });
      p.building.forEach(b => { if (!(b.rdy > S.round - 1) || b.rdy > 13) { console.log('BAD building', JSON.stringify(b), S.round); errs++; } });
      if (p.systems.some(x => p.building.some(y => y.name === x.name))) { console.log('dup sys'); errs++; }
      if (p.hand !== undefined) { console.log('hand resurfaced'); errs++; }
    });
  }
}
console.log('errs', errs); console.log(cnt);
process.exitCode = errs ? 1 : 0;
