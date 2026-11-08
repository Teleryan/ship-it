# SHIP IT! analytics audit and fix (work copy `/home/claude/work/an`)

Nothing was committed or pushed. `/home/claude/ship-it` was not touched. No rules, balance numbers or engine code changed (`game/engine.js`, `bot.js`, `data.js` are byte-identical; a test plays the same seeds with and without analytics and the final engine states are identical).

Status: `npm test` fails 0 (run twice, and it now also runs `tools/an_test.js`), `npm run golden` ok, `node tools/an_test.js` prints **AN OK** (1442 checks, about 12 s). `npm run build` succeeds (dist was restored to the original afterwards; rebuild and upload before Monday, see section e).

How it was tested: `tools/an_test.js` + `tools/an_test2.js` load the real `analytics.js`, the real `worker/worker.js` (Map-backed KV, real login cookies, real `/__log` `/__games` `/__clear`), the real `stats.js` / `admin.js`, and the real `ui.js` (stubbed DOM and a fake WebSocket room, so Start, Continue, Resume saved game, menu leave, tutorial, undo and online host/reload/rematch all run the actual UI code). Bot games for 2, 3, 4 and 5 players, with and without human-marked seats, are diffed against engine state and an independent oracle that counts the actions the driver submits.

---

## (a) The seven suspicions

Evidence for the "before" state came from running the original files (`git show HEAD:...`) in probe scripts.

| # | Suspicion | Verdict | Evidence |
|---|---|---|---|
| 1 | Resumed game never calls `SI.an.begin` | **Confirmed** | `ui.js` had only 2 `an.begin` call sites (`newGame`, host `enterGame`). `loadAuto`, `loadSave`, "Continue where you left off", "Resume saved game" and the boot-time autosave restore never attached analytics. Probe: play to round 5, reload, continue to the end: **0 records posted**. A reload also lost all in-memory snapshots. |
| 1b | Tutorial / vs-bot flow | **Partly confirmed** | "Play a game against a bot" (`tut-play`) did call `newGame`, so that game was recorded, but nothing said it came from the tutorial. Real defects found: starting the tutorial from inside a running game did not abandon the running game's record, and after "Free play" the tutorial game could be re-attached by Continue. Tutorial games were never recorded (correct) but the path was fragile. |
| 2 | Single fire-and-forget fetch | **Confirmed** | Probe: network down for the whole game, **0 records ever delivered**, no queue, no retry, no flush on tab close, failures invisible. |
| 3 | Abandonment | **Confirmed** | Only `abandon` (menu, round 2+) wrote a final record. Round-1 leave: 0 records. Tab close: no `pagehide`/`visibilitychange` handler. Online host leaving after the game ended via another seat's action: no record. Dashboard showed a quiet `active` record as "active" forever. |
| 4a | id collision, online | **Confirmed** | id was `code + seed.toString(36)`. Seed 1 gives `ABCD1` (5 chars) and a negative seed gives `ABCD-5`; both fail the server regex `^[A-Za-z0-9]{6,32}$` so the record was silently rejected with 400. Rematch with the same code and the same seed gives the **same id** (second game overwrites the first). In practice the lobby draws a random 31-bit seed, so collisions are improbable but the invalid-id case is real. |
| 4b | winner index vs score id | **Refuted** | In the engine `players[i].id === i`, `scores[i].id === i`, `S.winner` is a player id equal to the seat index. Verified in every harness game. Dashboard code that mixes `g.winner === i` and `g.winner === s.id` is therefore consistent. I switched stats.js to look scores up by id anyway. |
| 4c | seat order | **Refuted** | `S.order.indexOf(p.id)` is correct and is a permutation (checked for all games). |
| 4d | humans, rounds, flags | **Mostly fine** | `humans` and `rounds` were right. Real gaps: online records never had `test`/`hash`, and `tuned` was just "custom"/"default" (so a `?env=test` online game showed as live). Local Data Studio edits looked like "live". `early` ended games (host pressed End game) were stored as completed. No session label, no tutorial flag. |
| 5 | Content gaps | **Confirmed** | Snapshots had no desks, no Tired/Exhausted, no trains/promotions/recruits; no tile usage, no event log, no systems ids, no objectives chosen/met detail, no crisis bids/results, no milestone ids. Now present (schema in section d). |
| 6 | Dashboard accuracy | **Confirmed** | Band 38-68 hard-coded in 7 places (rules are 33-63). Abandoned and early games leaked into "Avg rounds", "Avg game length" and (when "Completed only" was off) into VP stats. Quiet `active` records were never timed out. Bot-only games could not be separated. Round timing across a missing snapshot produced a double-length round. No test/local-edit separation. `/__games` cap: see 7. |
| 7 | Server | **Confirmed** | Probe on the original worker: final record then a late interim post: **stored status became `active` (final lost)**. `/__games` listed up to 5000 keys, then fetched only the first 1500 in key order, which is random order (ids are random), so with more than 1500 games the dashboard silently showed a random subset. 1700 stored records returned 1500, no flag. Clock source was already server-side `recv` (fine); role was already stamped from the cookie (fine). |

---

## (b) Defects fixed (file, before -> after)

### `game/analytics.js` (rewritten, 50 -> about 330 lines)
- **Resume support.** `A.resume(S, {kind})` re-attaches a reloaded game to its record. The in-progress record (meta, snapshots, events) is mirrored into `localStorage` (`shipit.an.cur`); the autosave now carries the record id (`an`). A manual save also stores the analytics state (`shipit.an.save`); loading a manual save starts a **new id** with `from = original id` (a branch), so two plays of the same save cannot overwrite each other. Old autosaves with no analytics state still record, flagged `part: 1`. A finished game that is reloaded is not recorded twice.
- **Durable outbox.** `A.post` queues the record (latest record per id, a final is never replaced by an interim), mirrored to `shipit.an.out`. Sent with `fetch` (`keepalive` only when under 60 kB), serialized per id, retried with exponential backoff (2 s doubling up to 5 min) on network errors, 5xx, 401 and 429; dropped only on permanent 400/403/413. Retried on page load, on the next post, on `online`, on tab becoming visible and every 30 s while anything is pending. `pagehide` / `visibilitychange(hidden)` post an `active` record and hand the queue to `navigator.sendBeacon`. Works from memory if `localStorage` is full or blocked. `A.stat` keeps counts and the last error; the menu shows "N game records waiting to upload" if anything is stuck. Nothing is sent when the game is not served by the Worker (`A.enabled = false`).
- **Interim posts every round** from round 1 (was round 2+). `A.interimEvery` can halve writes (see section c).
- **Never lose or double a game.** `begin` auto-abandons a still-running tracked game; `abandon` records any round (was round 2+ only); the tracker is bound to one state object (`A.S`), strays are counted (`A.stray`, asserted 0 in tests).
- **Size.** Records are budgeted at 100000 bytes (UTF-8 bytes, server limit is 120000 characters). `A.fit` trims in order: event timestamps, mid-round snapshots, the event log, snapshot detail, all but first and last snapshot, all snapshots, finally per-seat id lists. Scores, winner, gates, final state and counters are never dropped. Real 5-player games are about 30 kB, so trimming does not trigger in practice (tested at budgets from 30000 down to 2500).
- **Engine observer.** `A.hook()` wraps `ShipItEngine.act` once. It reads state before the call, calls the original with the same arguments and `this`, returns its result unchanged, and swallows its own errors. It builds the event log, takes snapshots after every action (so all-bot batches that run 25 steps per tick cannot skip a round), and captures the end-of-Place snapshot. Not active in sims, for guests, or for other state objects (tutorial).
- **Online.** id is now deterministic `code + seed + server start time` (valid for any seed, unique per rematch, identical after a host reload). Host records, resumes after reload, and keeps events across a reconnect. A guest keeps a `watch` and posts a minimal `src: "guest"` final only if it sees the game end; the server lets the host's record win.
- **New fields**: `status` now `active | abandoned | complete | early`; `early`, `tie`, `src`, `seq`, `lbl` (session label), `dev`, `tut`, `res`, `part`, `from`, `vw`, `sk`, event log `ev`, counters `cn`, tile usage `tl`, active tiles per phase `sp`, plus the per-round and final additions in section d.

### `game/ui.js` (57 lines changed)
- `newGame`: `SI.an.abandon()` then `begin(...)` with `tut` flag (0 never done, 1 done before, 2 started from "Play a game against a bot"); `U.prev` hack removed.
- `anResume()` called after `loadAuto` (boot path and Continue) and `loadSave`; autosave payload now `{S, tut, tg, an}`.
- `startTutorial` abandons a running tracked game; tutorial games are marked (`U.tutGame`) so Continue/Resume never records them.
- Undo: `snapshot()` is prefixed with the analytics event count and `restore()` rewinds the event log and re-binds the tracker.
- Online `enterGame` -> `anOnline()`: host `begin`/`resume`, guest `watch`, reconnects keep state. `SI.an.enabled = !!whoami`.
- Menu: optional **Session label** input (24 chars, stored in `localStorage`, sent with every record).
- Unrelated bug found by the test and fixed: if the **last action of an online game came from a guest seat**, the host never sent `{t:"over"}`, so the room stayed "playing" and **Rematch did not work**. Now the host sends it after applying any action that ends the game.

### `worker/worker.js` (backward compatible)
- `/__log` upsert: one record per id. Rank `active < abandoned < early = complete`; a lower rank never overwrites a higher one; equal rank needs `seq >=` (older interim ignored); at equal rank a host record beats a guest fallback. Legacy records without `status` are ranked from `completed`. Answers `{ok:true, kept:true}` when ignoring so clients stop retrying. Rejects non-object bodies. Metadata `{r: recv, s: status, n}` is stored with every key. `recv` and `role` are still server-set.
- `/__games`: lists keys with metadata, sorts by `recv` newest first, pages with `offset`/`limit` (800 per page, 400 for sims), returns `total`, `more`, `now`. Lists up to 40 pages of keys (was 5), so more than 5000 records are counted. Legacy keys without metadata sort last. Old clients still work (they get the newest 800).
- Known limit unchanged: read-then-write is not atomic (see c).

### `game/stats.js`, `game/admin.js`, `game/core.js`
- `SI.BAND = [33, 63]` (core.js); stats.js and admin.js read it (7 hard-coded 38/68 replaced).
- `statusOf`: an `active` record quiet for 30 minutes (server `recv` clock, `/__games` now returns server time) shows as **abandoned**; `early` is its own status. VP, gap, rounds and length statistics use finished (`complete`) games only, whatever the "Completed only" toggle says. KPI tile shows "N finished · N left · N in progress · N ended early" and ties.
- New filters: **Games with humans / Bot-only games / both** (default: with humans), **session label**, environment **Local edits** (default tuning but non-base data hash). Table "Builds and data in view" (version / hash / tuning) shows mixed data at a glance. Board tile usage table (placements, games available, Team Event). Game detail shows flags, per-seat action counters and tiles used.
- `roundSecs` only uses consecutive rounds that both have a time (a missing snapshot no longer doubles a round).
- Buttons: **All records (JSON)**, **Events CSV**, **Delete shown records** (confirm click; deletes exactly the filtered list). Games CSV gets version, label, tie, tutorial, resumed, bot skill, desks bought, trainings, promotions, tired/exhausted/burnout at end, Team Event uses, systems built. Rounds CSV gets burnout, desks, tired, exhausted and end-of-Place values.
- `admin.js` `loadAll` reads every page; `SI.adminRefresh`, `SI.adminSummary` exposed (tests).

### `package.json`, `tools/`
- `npm test` now ends with `node tools/an_test.js`; `npm run an` runs it alone. New files `tools/an_test.js`, `tools/an_test2.js`.

---

## (c) Found but not fixed (and why)

1. **KV upsert is read-then-write, not atomic.** Two writes to the same id inside the same second from different Cloudflare locations could race. The client serializes sends per id and a final is only ever sent after earlier sends for that id returned, so one browser cannot race itself. A Durable Object per game would remove the gap but is a larger change.
2. **KV write volume.** Each game is about 13 PUTs (12 round posts plus final) plus tab-hide pulses. The Cloudflare KV **free plan allows 1000 writes per day** (about 70 games). If the account is on the free plan set `SI.an.interimEvery = 2` (or 3) before deploying, or move to the paid plan. I could not check the plan from here.
3. **Subrequest limit.** `/__games` does 800 KV gets per page, under the historic 1000 limit; if the plan is stricter, lower the page size constant in `worker.js` (`800`).
4. **Online late joiner / host with lost storage**: if the host's `localStorage` is cleared mid-game, the record continues but earlier events and snapshots are gone (`part: 1`). A guest's fallback record has scores, gates and final state but no snapshots or events (`src: "guest"`).
5. **Two tabs of the same browser playing two hot-seat games at once** share the single autosave slot (existing limitation) and the in-progress analytics slot; the record id check turns a mismatch into a `part` record instead of mixing data.
6. **Resume downtime** counts in `endedAt - startedAt` (admin.js legacy "Avg minutes"). stats.js caps each round at 20 minutes so its timings are not affected.
7. **Tutorial progress (where people stop) is not recorded**, only whether the guide was finished (`tut`). Not requested; would need a hook in `tutorial.js`.
8. **`env: "D"`** is a constant; `tuned` / `hash` / `test` / `v` carry the real distinctions.
9. **Old records** (before this change) lack the new fields; the dashboard tolerates them. Existing test data should be cleared before Monday anyway.
10. **Simulation batches**: still capped at 400 per list and large (up to 900 kB each); sim ids/behaviour unchanged. Sim records stay lean (no events, under 16 kB per game).
11. The `dist/shipit-site.json` bundle and the deployed worker are **not** updated by me (see checklist).

---

## (d) Final record schema

One JSON object per game id in KV key `g:<id>` (sim batches: `s:<id>`). About **25 kB for a 4-player game** (2P 13.5 kB, 3P 19 kB, 4P 24.6 kB, 5P 29 kB; an `active` interim is the same shape so far). Hard budget 100000 bytes.

Top level
- `id` game id. Hot-seat: 16 random chars. Online: `code + seed(base36) + server start time(base36)`.
- `v` app version string (`D.version`), `site` "d", `env` "D".
- `mode` `hotseat | online | sim`; `code` room code or null; `src` `solo | host | guest`.
- `status` `active | abandoned | complete | early`; `completed` true only for `complete`; `early` 1 if ended before round 12; `tie` 1 if first and second share the top total; `seq` post counter (higher = newer).
- `n` players, `humans` non-bot seats, `rounds` last round reached, `winner` seat index (= player id) or null, `startedAt`/`endedAt` device ms, `recv` server ms, `role` account that posted (`owner` or `player`; set by the server).
- `tuned` tuning label (default, `live vN`, `test vN`), `hash` hash of the data diff ("base" = shipped defaults), `test` true for `?env=test`.
- `lbl` session label, `dev` first 6 chars of the device id, `tut` 0/1/2 (tutorial never done / done before / started from the tutorial button), `res` times resumed, `part` 1 if history before a resume or late join is missing, `from` id of the original game when this is a loaded manual save, `device` mobile|desktop, `vw` viewport width, `trim` present only if the size ladder ran.
- `seats[]` `{name, bot, persona, profile (bot skill preset), acct (online account, 6 chars), order (turn-order slot)}`; `sk[]` skill per bot seat.
- `scores[]` `{id, total, parts{prodShare, hypeStrength, debtPenalty, burnout, objectives, synergy, systems, reach, gold, crisis, gateVP, ... objList[{id,name,met,vp,full}], threshold, debtPct...}}` (null unless finished).
- `gates[]` `{ph, name, lvl E/M/H, passed[seat ids], failed[], best}` per gate resolved.
- `final[]` per seat at the end: `g` gold, `pr` progress, `mk` marketing, `hy` hype, `db` debt, `cu` culture, `rs[ideas,code,process,buzz]`, `w` workers, `sr` seniors, `sy` systems, `bd` systems still under construction, `ob` objective count, `gl` gate VP lost, `va` VP adjustment, `bo` burnout, `rc` recruits, `cr` crunched builds, `cv` skills converted (round-12 convert), `td` tired (fatigue >= 1) and `ex` exhausted workers, `tn` trainings, `pm` promotions, `ws` desks in the last round, `si[]` system names built, `mi[]` milestone ids claimed, `oi[]` objective ids held, `om[]` 1/0 met flag per held objective, `dr[]` objectives dropped, `gv` gate VP net.
- `snaps[]` one per round at first sight (`k` round, `99` = end): `r` round, `t` ms since start (null if unknown), `ph` phase, `c` crisis card id (phase start rounds), `p[]` per seat `{g,pr,mk,hy,db,cu,rs[4],w,sy,ob,ml,va,sr,bd,bo, ws desks, td tired, ex exhausted, tn,pm,rc}`; `m[]` per seat at the end of Place `[desks this round, tired, exhausted, burnout, gold]` (this is where desks bought show, because desks reset each round).
- `ev[]` event log, tuples `[round, seat, code, arg, seconds]` (seat -1 = table). Codes: `p` place `[tile or "S:<system>", "<J|S><disc>", exhausted 0/1, extra (choice, conv, "+partner")]`, `x` pass, `rc` recruit `[disc, cost]`, `ws` buy desk (cost), `tr` train (disc), `pro` promote, `bd` build `[system, "c" crunch / "f" free]`, `cl` claim milestone (name), `rf` market refresh, `dn` done with Manage, `ko` objectives kept (ids), `km` milestones kept, `bid` `[crisis card, amount]`, `ch` crisis choice `[card, option]`, `pw` worker lost, `rh` raid hire, `pv` `do` `pt` pivot / drop objective / patch, `au` auction result text, `end` ended early.
- `cn[]` per seat counters derived from `ev`: `p` placements, `x` passes, `ws` desks bought, `tr`, `pro`, `rc`, `bd`, `cl`, `tm` Team Event placements, `ov` placements while Exhausted.
- `tl{}` placements per board tile id over the game; `sp[]` active tile ids for each phase (so unused tiles = `sp` minus `tl`).

---

## (e) Owner checklist for Monday

Before the first session
1. `npm run build`, then upload `dist/shipit-site.json` at `/__upload`, and deploy `worker/worker.js` (both are needed: the new client posts `status/seq` and the new dashboard pages `/__games`). Confirm the Cloudflare plan allows the KV write volume (about 13 writes per game; free plan is 1000/day) or set `SI.an.interimEvery = 2`.
2. Master -> Tuning: set Live and Test back to shipped defaults (PLAYTEST.md). Check the menu version line reads `Playtest 1 · A rules · 9 Nov 2026`.
3. **Clear smoke-test data**: Master -> Analytics, make the filter show only the junk (for example tuning/env **Test**, or label your smoke tests "SMOKE" while you test, then filter on that label), click **Delete shown records**, click again to confirm. Real data is never touched because only the filtered list is deleted. The red "Delete all analytics records" button in the legacy view is not needed any more.
4. Play one 2-player smoke game with label "SMOKE" on a second device, finish it, and check it appears.

After the first real session
1. Master -> Analytics -> Refresh. The KPI tile **Games** should read "N finished · N left · N in progress"; N finished must equal the games you saw end.
2. Table **Builds and data in view** should have exactly one row (one version, hash `base`, tuning `default`). More than one row = mixed data.
3. Open a game (Open button): flags line shows label, tutorial state, version; "What each seat did" shows desks, Team Event, trains.
4. A game someone left must show **abandoned** (or **in progress** for the first 30 minutes). A reload mid-game must still show one game, `resumed 1x`.
5. If the menu shows "N game records waiting to upload" on a player's device, that device was offline or logged out; open the game while signed in and it uploads by itself.
6. Check the 33 to 63 band tile and "ties".

Export
- **Games CSV** (one row per seat), **Rounds CSV** (one row per seat per round), **Events CSV** (every action), **All records (JSON)** (raw, complete, including event log). All respect the current filters except JSON (everything).

Per-session cleanup without deleting real data
- Use the **Session label** field on the menu. Filter by label, then **Delete shown records**. Use the environment buttons (Live / Test / Local edits) to separate data from `?env=test` pages and from a Data Studio with unpublished edits.

---

## (f) git diff --stat

```
 game/admin.js     |  10 +-
 game/analytics.js | 338 ++++++++++++++++++++++++++++++++++++++++++++++++++----
 game/core.js      |   1 +
 game/stats.js     |  99 +++++++++++-----
 game/ui.js        |  57 +++++----
 package.json      |   3 +-
 worker/worker.js  |  36 ++++--
 7 files changed, 456 insertions(+), 88 deletions(-)
```
Untracked (new): `tools/an_test.js`, `tools/an_test2.js`, `ANALYTICS_REPORT.md`.
