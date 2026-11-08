# SHIP IT! UX / first-time-user pass (version A, rules locked)

Work copy: `/home/claude/work/ux` (branch `main`, nothing committed). `/home/claude/ship-it` and the live `/home/claude/work/ref` were not touched. Only presentation, copy, flow, tutorial scripting and UI changed: no engine rules, no numbers (golden output is byte-identical).

Screens: `shots/before/` and `shots/after/` (`d_*` = guided tutorial at 1440x900, `p_*` = tutorial at 390x844, `g/` and `gp/` = full 2-player game vs a bot at desktop and phone, `lobby*.png` = online lobby). Same step ids in before and after where the step still exists, so `before/d_11_place1.png` pairs with `after/d_05_place1.png` (the index changed because 6 cards moved away).

## Verification (all run against this copy)

| Check | Result |
|---|---|
| `/tmp/tuttest2.js` scripted harness (path pointed at the copy via a scratch copy) | prints `FINAL`, no BLOCKED/ACT FAIL |
| `npm test` (twice) | `fails 0`, `fails 0` |
| `npm run golden` | `golden ok`, **no `golden:update` needed**: no engine output changed |
| `node tools/ftue_audit.js` | 1 finding: the known `Hiring Spree` milestone name. The old 89-word `burnout` length warning is gone, so this is below the known 2 |
| Engine fuzz through the tutorial (`fuzz.js`, 6 styles x 120 runs) | 720/720 `FINAL`, every lesson visited |
| Real-UI fuzz (`ui_fuzz.js`, Playwright, clicks through `SI.act`, Back/Forward review, blocked actions, a mid-tutorial reload) | desktop 3/3, phone 3/3 reach the end of the guide, 0 page errors |
| Real-UI full tutorial, desktop and phone (`ui_run.js`) | reaches `handover`, 0 page errors. A last-minute regression was caught and fixed: the new banner event feed (`.turnbanner .ev`) pushed the phone page to 470-1194 px wide; fixed with `min-width:0` (`styles.css`, end), after which scrollWidth is 390 on every step. Residual phone flags: `rest1` overlap, `promote` off-screen at measure time (see a#4) |
| Real-UI full 2-player game vs bot, desktop and phone (`game_run.js`) | game over, scores shown, 0 JavaScript errors (the first desktop run died on a Playwright click race in the test script, not the game; script hardened, rerun finished). Shots in `shots/after/g` and `gp` were regenerated; the phone tutorial `p_*` and lobby shots predate the `.ev` overflow fix, so phone tutorial screens may show the wider page. The only console lines are `Failed to load resource` for Google Fonts, `/__config`, and analytics POSTs: they come from the static `python -m http.server` and do not exist on the real host |
| Bot skill order (2P, profile vs Standard, 120 games each) | Easy 26% win, Medium 34%, Standard 50%, Hard 56%, Hardest 55% (Hard and Hardest are not separable at this sample size) |
| `mkref.js` rebuilt rules | `game/rules.js` byte-identical to HEAD. `mkref.js` now writes to `$SHIPIT_OUT` (default is the old live path), so a rebuild cannot clobber `/home/claude/work/ref` |

## (a) Ranked issues found

Severity: **H** = a first-time player is likely to get lost, mis-play or lose trust; **M** = friction or a wrong signal; **L** = polish. Status: Fixed / Open.

| # | Sev | Issue | Where | Status |
|---|---|---|---|---|
| 1 | H | 10 information cards plus the objectives pick before the first placement (`welcome, win_vp, objectives, phasestart, order, team, boardintro, board_backlog, board_prototype, income, placeintro`) | `tutorial.js STEPS` | Fixed: first action is card 3 (`objectives`), first placement is lesson 6 |
| 2 | H | Between-round screens never said what the new round did to you. `roundIntroModal` (income, salaries, Hype fade, Burnout) is **dead code**: nothing calls it. The round screen showed only turn order, Gold and a worker count; the phase screen was an 9-column table plus a wall of text | `ui.js stepScreens, roundIntroModal` | Fixed (one layout, signed deltas) |
| 3 | H | Banner told a bot's turn "select a worker, then a highlighted tile (or Pass)" under the label "Bot thinking" in the same style as your turn. It was also the only turn cue | `ui.js banner` | Fixed |
| 4 | H | Phone: coach card covered its own target (OVERLAP in 7 steps: `objectives, boardintro, placeintro, place1, board_perks, gates, polish`) and 2 targets were off screen (`r2crunch`, `convert`). Header took 240 px | `tutorial.js`, `styles.css` | Mostly fixed. Last phone run: 2 residual flags, `rest1` (large Milestones/board target mostly under the bottom-sheet coach) and `promote` (target below the fold when measured; the page scrolls to it on selection). Not fully closed, watch on Monday |
| 5 | H | The promote lesson was silently skipped for 40-60% of players (a Junior trained or promoted in round 2 or 3 satisfied `promote.done`), and the Train button sat on every worker card from round 1 | `tutorial.js` | Fixed: train/promote blocked until the lesson, Train button hidden; `promote` now visited in 100% of fuzz runs |
| 6 | H | Tutorial said an objective's skill icon "gives bonus VP to a finished system with the same main skill". Synergy scoring is off in version A (`synergyOn: 0`). Live VP panel also said "Objectives and synergy are secret" | `mkrows.js objectives`, `ui.js liveVpPanel` | Fixed |
| 7 | M | "Step 12 of 39" counted steps a player never sees and gave no remaining count | `tutCoach` | Fixed ("Lesson 6 of 33 · 27 to go", shrinks honestly when a lesson is skipped) |
| 8 | M | No separate "what to do now". The action was the last sentence of a paragraph | `mkrows.js`, `tutCoach` | Fixed: gold "Your move" box, one line, above the explanation |
| 9 | M | `place1` highlighted the workers **and** the whole board at once | `tutorial.js` | Fixed: workers first, board after a worker is selected |
| 10 | M | Red toast (the colour of a refusal) for neutral notices ("Player 2 recruited ...") | `ui.js toast` | Fixed (blue = notice, red = refusal) |
| 11 | M | Buying a desk, recruiting or training could not be taken back in an obvious way (Undo existed only in the top bar, hidden in the tutorial) | `ui.js act` | Fixed in the real game: Undo toast for 6.5 s |
| 12 | M | Disabled reasons lived in tooltips only: Buy workstation, lobby Start, market card reasons at 10 px | `wsLine`, `lobbyView`, `marketModal` | Fixed (inline text, 13 px) |
| 13 | M | Bot skill list: Standard / Novice / Human-like / Expert / Optimizer (hardest), no explanations | `bot.js`, `ui.js` | Fixed: Easy / Medium / Standard / Hard / Hardest with a one-line description |
| 14 | M | Menu overflowed to 410 px at 390 px width | `styles.css` | Fixed |
| 15 | M | After the guide the results button said "Start a real game" and started the default **4-seat game with 2 humans** | `resultsModal` | Fixed: "Play a game against a bot" (2 seats), "Read the rules", "Replay the guide" |
| 16 | M | Heading and label colours (phase, player, category) were 3.0-3.5:1 on the dark panels | `ui.js` | Fixed (lightened for text; swatches keep the true colour) |
| 17 | M | ~100 text nodes at 10-11 px on the board screen; Details/Train buttons 21 px tall on phone | `styles.css` | Fixed to 12 px floor (body is 14 px); buttons 34 px on phone |
| 18 | M | Autosave only resumed on a same-tab reload; the hosted menu had no way back to a game in progress, and an old save could resume against a changed script | `ui.js`, `tutorial.js` | Fixed: "Continue where you left off" button, `SI.TUT_VER` guard |
| 19 | L | Round 1 showed two greyed Recruit tiles with "opens in round 2" | `recruitPanel` | Fixed (one-line empty state) |
| 20 | L | Nothing explained Tired / Exhausted on the cards | `workersPanel` | Fixed (legend appears only while a worker has the state, plus badge tooltips) |
| 21 | L | A taken tile gave no reason when nothing was selected | `spotTile` | Fixed ("Taken by ...") |
| 22 | L | Lobby seat rows wrapped randomly; Start was disabled with no reason | `lobbyView` | Fixed |
| 23 | L | Crisis card pop-up had no label and a differently placed button | `crisisIntroModal` | Fixed (same footer as every other screen) |
| 24 | L | `Development` category chip is 4.4:1 (white on blue) | `onCol` | Open, see (c) |
| 25 | L | Online lobby could not be exercised end to end without the server | n/a | Open (rendered with a mocked room only) |

## (b) Changes made (file, before -> after)

### Tutorial flow (`tools/mkrows.js` -> `game/data.js D.tutorial`, `game/tutorial.js`)

New order (33 steps, was 39): `welcome, win_vp, objectives, team, board_backlog, place1, stats, ws1, place2, build, tired, rest1, income, upkeep, r2recruit, board_perks, r2place, r2crunch, burnout, gates, r3, gateresult, races, hype_bank, crisis, r4play, promote, trigger, prod, polish, polishfree, convert, handover`.

- **Before first placement:** 5 cards -> `welcome, win_vp, objectives(action), team, board_backlog`. Removed as separate cards: `phasestart` (folded into `crisis`, where a phase start first happens), `order` (folded into `upkeep`, round 2, where order first matters), `boardintro` + `board_prototype` + `placeintro` (the board is one card, Prototype/Pitch/Debt moved to `races` in round 4, "tiles hold one worker" moved into `place1`), `income` (moved to round 2).
- **Progressive disclosure:** Gold income and salaries (`income`) now appear at the start of round 2 with the player's own live numbers ("+7G income, -3G salaries, you started with 18G"; tokens `incomeNow, salaryNow, goldNow` from `S.rnote`). `upkeep` = Upkeep and turn order, highlighting the "Turn order" badge. `board_perks` follows the first recruit. `burnout` follows the first crunch. `gates` moves to round 3 (the round the first gate is due). `board_jam` became a tip inside `r3`. `hype_bank` now says "From round {decayFromRound}".
- **One moment each:** one-desk `ws1` then `place2` (highlights only the Buy workstation button); recruit `r2recruit`; build `build`; crunch `r2crunch`; train+promote `promote` (rv `promote_train`, Train hidden until then, `train`/`promote` blocked in `rest1`, `r2crunch` and `r3` with `msg_train_later`); gates `gates` + `gateresult`; Burnout `burnout`; convert `convert`.
- **"Your move" box:** a row line that starts with `>> ` is shown in its own gold box (`mk().parts`, `st.cta`). Waiting for the Rival turns it into a grey "Next up" box with "Rival is taking their turn...".
- **Honest progress:** `Lesson {n} of {total} · {left} to go` (`T.vis` counts the lessons actually shown).
- **Leave / replay / resume:** "Stop coaching" is now "Skip guide" (a quiet link, away from the primary button); the welcome card says it saves as you go; menu "Continue where you left off" (`hasAuto`, `loadAuto`, `SI.TUT_VER`); results "Replay the guide".
- **Highlight:** `place1` = workers only until one is selected, then the board; `place2` = the Buy button only; `rest1` = Done + Milestones; `upkeep` = the order badge; `income` = the Gold tile.
- **Hand-over:** `handover` text now names the three next steps; the results screen shows them as buttons (`tut-play`, `rules`, `tutorial`).
- **Copy fix:** removed the false "skill icon gives bonus VP" sentence from `objectives`; free build token is now inline.
- `tools/ftue_audit.js`: one claim re-pointed (`hype_bank` carries the "From round N" claim). Nothing else.

### Round transitions (`game/ui.js`, `game/styles.css`)

One layout for every between-step screen (`stepShell`, `rsSec`, `rsTable`, `rsNotes`, `dl`): round rail + phase pill, then **What just happened** (a turn-ordered table with `+7 income · -3 salaries`, Hype and Burnout deltas, each signed and coloured, plus the first-player sentence "You go first" / "Player 2 goes first, then you"), **What changed for you** (max 4 bullets: finished systems, Exhausted workers, Burnout band, quits), Industry News, **Your first move**, and one primary button in the same place ("Start placing", sticky at the bottom). Phase starts add the **gate result per studio** (Passed +3 Gold / Missed -1 VP per requirement), the **next gate**, a collapsed Standings table and "New on the board". Round 12 adds a three-line "Final round checklist". Round 1 shows starting Gold/Juniors, first player and the first gate. Final results add "who won and where from" and the What-next buttons.

Persistent status: a 12-segment **round rail** in the top bar; the banner is sticky on desktop and carries phase, round and step ("Production · Round 4/12 · Place"), a **last 3 events** feed, "YOUR TURN" (gold, with a play-arrow glyph, not colour alone) versus "WAITING FOR <name> ..." (animated dots) with a specific instruction ("Pick a worker, then a green tile. 3 workers left · 1 workstation free", "No free workstation. Buy one for 2G, or press Pass."). `Pass: done placing` and `Done` carry tooltips explaining what they end.

### Heuristics fixes

Undo toast (`act`, `toast(m, ms, kind)`); info vs error toast; inline reasons (`wsLine`, lobby, market); `fatLegend`; "Taken by"; round-1 recruit empty state; Easy/Medium/Standard/Hard/Hardest select with a description line in the menu and a labelled Skill / Style pair per bot seat in the lobby (`skillSelect`, `B.profileInfo`; engine ids unchanged); phone header (secondary buttons moved into Menu, which now also holds Milestones, Log and End game); 44 px targets on phone (selects, buttons, tabs); 12 px type floor; lightened text colours (`lite`); results swipe hint on phone; toasts at the top on phone so they never cover the primary button.

## (c) Deliberately not changed

- **Any rule, number, bot behaviour or engine output.** Bot skill ids and balance untouched; only labels and descriptions. Golden unchanged.
- **Per-step "skip this lesson".** Skipping `place2` would leave the game in Place with `build` blocking Pass: a dead end. "Skip guide" (stop coaching, keep this game) is the safe escape and is tested.
- **A fixed bottom Pass/Done bar on phone.** Right call for thumbs, but it competes with the coach sheet and the Undo toast. Candidate for after Monday.
- **Sticky banner on phone.** It would take 90-170 px of an 844 px screen. The phone header carries the round rail and phase instead.
- **Dropping `hype_bank` or `gateresult`.** Round 4 still has 4 cards (gate result, Progress/Hype, Hype bank, Crisis). Each is a new event or scoring fact; merging them would put two ideas on one card. Watch observation 5.
- **`Development` chip 4.4:1 and Details/Train buttons at 34 px on phone** (not 44): both are tight inside fixed-size cards. Both clear WCAG AA large-target and are listed as open.
- **Data Studio**: tutorial rows keep their `id/title/btn/text` fields; `>> ` is plain text in `text`, so editing still works. Stale rows (`boardintro`, `board_prototype`, `placeintro`, `phasestart`, `order`, `board_jam`, `stats` text) were deleted from `D.tutorial`; saved overrides with those ids are ignored.
- **Online lobby/in-game flow** was rendered with a mocked room, not played with two real devices.
- **`dist/`** is not rebuilt: run `npm run build` before shipping.
- **Known stale milestone name "Hiring Spree"** (key in `MILE_CHECK`): same as the previous audit.

## (d) First-time-player test script for Monday (10 observations)

Sit behind the player. Do not explain. Note the lesson number shown in the coach (e.g. "Lesson 9 of 33").

1. **Cards 1-5 (lessons 1-5).** Do they read or tap through? Time to lesson 6 (first placement). Anyone who stops before it: which card?
2. **Objectives (lesson 3).** Do they choose or just press Confirm? Can they say what an objective is afterwards?
3. **First placement (6).** Do they click a worker, then a green tile, without the Back button? Do they notice the gold "Your move" box?
4. **Desk lesson (7-8).** After placing, do they find "0 free of 1" and press Buy workstation, or pass? Do they think Buy ends the turn?
5. **Round 2 start (12-13).** Do they look at the Gold tile and the Turn order badge when the card points at them? Can they say why the Rival goes first?
6. **Recruit (14).** Do they understand the shared pool (the 3G price after the Rival took one)? Do they recruit before placing?
7. **Crunch and Burnout (17-18).** Do they notice the Tired / Exhausted legend under the workers? Do they then place an Exhausted worker anyway?
8. **Round 4 (21-24).** Four cards in a row. Does attention drop? Which one gets "I don't get it"? Do they know a Crisis pop-up needs an answer?
9. **Promote (27).** Do they use Train then Promote without help, and pick a role that matches a system?
10. **After the game.** Which "What next?" button do they press? Do they then start a real game and, in round 2 of that game, read the "Round N begins" screen or click through it?

Also log: any tap on a greyed tile, any Back press, any "Skip guide" press (and at which lesson), any Undo-toast use, and confidence on a 1-5 scale after lessons 8, 20 and the end.
