// Bot-play sweep: every player count, 20 seeds each, must finish without errors. Run: node test.js
global.window = undefined;
const E = require('./engine.js'), B = require('./bot.js');
let fails = 0;
for (const n of [2, 3, 4, 5]) {
  for (let seed = 1; seed <= 20; seed++) {
    const seats = []; for (let i = 0; i < n; i++) seats.push({ name: 'P' + (i + 1), bot: true });
    let S, r;
    try { S = E.newGame(seats, { seed }); r = B.run(S, 20000); } catch (e) { console.log('EXC', n, seed, e.stack.split('\n').slice(0, 4).join('|')); fails++; break; }
    if (!S.over) { console.log('STUCK', n, seed, JSON.stringify(r), 'step', S.step, 'round', S.round, 'dq', JSON.stringify(S.dq[0])); fails++; break; }
    if (!S.scores || S.scores.length !== n || !S.scores.every(s => Number.isFinite(s.total))) { console.log('BAD SCORES', n, seed); fails++; break; }
  }
}
console.log('fails', fails);
