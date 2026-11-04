# SHIP IT!
Board game prototype (vanilla JS) plus its Cloudflare Worker host.

## Environments
- `/` **Variant D (Burnout)**: the current game. Phase economy, Burnout track, Training (replaces releasing workers), Insight tile off the board.
- `/c/` Variant C (Phases): the same game without Burnout/Training, and with Insight.
- `/a/` classic scoring, `/b/` pool scoring: kept for comparison tests.
All four are built from `game/` by `scripts/build.js` (flag substitutions: `varC`, `burnout`, `train`, `smallDrop`).

## Layout
- `game/` source: `engine.js` (rules), `bot.js`, `data.js` (all tunables), `ui.js`, `tutorial.js`, Studio (`studio*.js`), Analytics (`analytics.js` capture, `stats.js` charts, `simui.js` bot simulations), `rules.js` (generated reference).
- `worker/` Cloudflare Worker (routing, auth, rooms, analytics log).
- `tools/` command-line analysis: `kpi.js` (per-player-count KPI sweep), `csim.js`, `csweep.js`, `cgaps.js`, `cgapsrc.js`, `cdiag.js`, `ctune.js`, `h2h.js`, `psweep.js`, and `mkref.js` / `mkref-pdf.js` (rebuild the printable rules pack and `game/rules.js`).
- Tests: `npm test` (engine rules, variants, tutorial). `node game/fuzz.js` and `fuzzc.js` are random-play fuzzers.

## Deploy
Push to `main` runs tests, builds, writes KV bundles and deploys the Worker. Secrets in GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Game passwords stay as Worker secrets only.

## Regenerating the rules reference
`node tools/mkref.js` writes `/home/claude/work/ref/` (HTML pack and `rules.js`); copy `rules.js` to `game/`.

## Design targets (KPIs)
Winner VP 100 to 140, median gap 25 or less with blowouts rare, Gold tighter as the table grows, 2 to 6 players.
