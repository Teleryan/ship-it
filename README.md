# SHIP IT!
Board game prototype (vanilla JS) plus its Cloudflare Worker host.

## Environments
- `/` **Variant D (Burnout, lean loop)**: the current game. Round = Upkeep, Income, Order (fewest VP first), Place (Recruit is the only way to get workers), Manage (Build, Train/Promote, Milestones). Culture is folded into Burnout. Phase economy, Training (replaces releasing workers), smaller boards at 2-3 players, Insight tile off the board. Every tunable lives in `D.config` (`game/data.js`).
It is built from `game/` by `scripts/build.js`.

## Layout
- `game/` source: `engine.js` (rules), `bot.js`, `data.js` (all tunables), `ui.js`, `tutorial.js`, Studio (`studio*.js`), Analytics (`analytics.js` capture, `stats.js` charts, `simui.js` bot simulations), `rules.js` (generated reference).
- `worker/` Cloudflare Worker (routing, auth, rooms, analytics log).
- `tools/` command-line analysis: `kpi.js` (per-player-count KPI sweep), `tension.js`, `golden.js` (regression), and `mkref.js` / `mkref-pdf.js` (rebuild the printable rules pack and `game/rules.js`).
- Tests: `npm test` runs `game/test.js` (bot-play sweep, 2-6 players) and `game/ctest.js` (rule checks); each prints `fails 0`. `npm run fuzz` (`node game/fuzz.js [seeds]`) is the random-play fuzzer with invariant checks. `npm run golden` replays seeded bot games (`tools/golden.js`) and diffs them against `tests/golden.expected.txt`; run `npm run golden:update` after an intended rules or bot change. `node tools/kpi.js [games] [skill] [players]` and `node tools/tension.js` are balance sweeps. The guided tutorial is scripted in `tutorial.js` with text rows authored in `tools/mkrows.js` (run `node tools/mkrows.js` to splice them into `data.js`).

## Deploy
Push to `main` runs tests, builds, writes KV bundles and deploys the Worker. Secrets in GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Game passwords stay as Worker secrets only.

## Regenerating the rules reference
`node tools/mkref.js` writes `/home/claude/work/ref/` (HTML pack and `rules.js`); copy `rules.js` to `game/`.

## Design targets (KPIs)
Winner VP about 100 to 110 (100 to 140 allowed), median gap under 9 with blowouts (25+) at 4% or less, leftover Gold 7 to 10, end Burnout 3 to 4, 2 to 6 players. Check with `node tools/kpi.js 150 casual 2,3,4,5,6` and `node tools/tension.js 150 2,3,4,5,6` (skills: casual, novice, expert).
