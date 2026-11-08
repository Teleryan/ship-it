# SHIP IT! open design items: simulation review (version A)

Copy: `/home/claude/work/designer6` (A = 1 free desk, desks 2-4 cost 2G, 5th 3G, 6th 4G, 3 starting Juniors). `/home/claude/ship-it` untouched, nothing pushed. The container restarted mid-review; results were re-checked and the one lost batch (Team Event) was re-run.

## Edits made to the copy

| File | Change | Default behaviour |
|---|---|---|
| `game/bot.js` | `d.vp * 1.2` in `buildScore` became `d.vp * 1.2 / (cfg.vpPrint \|\| 1)`. Sim-only: lets pre-multiplied card VP be tested without changing the bot's valuation. | Unchanged |
| `game/bot.js` | `W.teamV` / `W.teamAt` bot weights: when set, the bot values the Team Event tile at `teamV` once its Burnout >= `teamAt` (default 3). Sim-only. | Unchanged (unset) |
| `game/engine.js` (`newGame`) | One line: `cfg.cfgByN[N]` is merged over the config for an N-player game, e.g. `{"2":{"income":8}}`. Needed to ship any 2P-only number. | Unchanged (key absent). Checked: `cfgByN:{"2":{"income":8}}` and `income:8` at 2P give identical results. |
| `tools/d6.js` (new) | Harness. Modes `exp`, `opt`, `allmax`; players; games; cfg JSON; seed base; flags `tiles,phase,persona,parts`. `_vpMul`, `_W`, `_profile` pseudo-keys. | New file |
| `tools/d6batch.sh`, `d6diag.js`, `d6pers.js`, `d6all.js`, `d6early.js` (new) | Batch runner (2 in parallel), blowout/variance decomposition, per-persona parts, seat/leader/opening analysis, early-game feel. | New files |

`D.config` is not modified. Every proposal below is an override passed to the sims, so the shipping edit is exactly the JSON quoted.

`npm test` prints `fails 0` and `npm run golden` is ok after the edits.

**Commands.** `node tools/d6.js <exp|opt|allmax> <players> <games> '<cfg json>' <seedBase> [flags]`. The default band is 33-63, and "blowout" means a winner-to-runner-up gap of 25 or more. `exp` is an all-Expert table with rotating personas, `opt` is one Optimizer (`max`) against Experts, `allmax` is all Optimizers. Seed bases 30000 and 50000 are independent; the full package was re-checked on 50000.

**Noise.** At 400 games the standard error is about 0.6-0.7 VP on Optimizer edge and about 1.5 points on band or blowout percentages. Differences smaller than that are noise. Several early "wins" disappeared on the second seed (see item 6).

## Baseline (A, 400 games, seed 30000)

| N | Expert table: band / blowouts / gold / Burnout / systems per studio / desks | Optimizer vs Experts: edge VP / win (fair) / systems opt-vs-exp / desks opt-vs-exp | All-Optimizer: band / blowouts / spread |
|---|---|---|---|
| 2 | 82% / 11% / 7.7 / 5.2 / 2.56 / 4.18 | +5.8 / 66% (50) / 2.53 vs 2.42 / 4.58 vs 4.14 | 91% / 9% / 11.9 |
| 3 | 93% / 5% / 8.4 / 5.0 / 2.65 / 3.88 | +6.3 / 54% (33) / 2.83 vs 2.68 / 4.31 vs 3.86 | 97% / 3% / 16.9 |
| 4 | 96% / 3% / 8.4 / 5.1 / 2.95 / 3.87 | +5.4 / 39% (25) / 3.11 vs 2.97 / 4.19 vs 3.88 | 97% / 1% / 19.1 |
| 5 | 97% / 2% / 7.0 / 4.9 / 2.64 / 3.69 | +6.1 / 37% (20) / 2.79 vs 2.58 / 4.03 vs 3.69 | 99% / 1% / 22.0 |

The "spread" column is the average winner-minus-last score. Context for later items: per-studio score at 4P is about 11 VP from Progress, 10 from Hype, 3 from Burnout (negative), 8 from objectives, 10 from systems, under 1 from synergy and about 2 from leftover Gold.

---

## 1. System VP presentation: ADOPT (b), exactly equivalent

**Recommendation.** Print the multiplied VP on the card and set `sysVPMult` to 1. Cards read 3 VP or 6 VP instead of 1 or 2; every system's `vp` field becomes `vp * 3`. All values are integers and there is no rescaling of any other scoring. Do not use (c) a label: it keeps a hidden multiplier, which is the thing the FTUE audit flagged as the biggest first-game surprise.

**Verification.** Sim: `node tools/d6.js exp 4 400 '{"_vpMul":3}' 30000`. `_vpMul` multiplies every system `vp` by 3 in game data, sets `sysVPMult 1`, and sets `vpPrint 3` so the bot's build valuation is unchanged. Results are bit-identical to baseline in all four cells run (Expert 2P and 4P, Optimizer 3P and 5P: same band, blowouts, gold, Burnout, systems, edge and win rate). So balance is unchanged by construction.

Option (a) (print the multiplied number but leave `sysVPMult 3`) is the same player-facing card, but leaves a dead multiplier in the rules and in the Data Studio. (b) removes it. Then update:
- `D.systems[*].vp` (x3).
- Tutorial `win_vp` ("Systems you build: printed VP x {sysMult}") becomes "the VP printed on the card".
- Rulebook and `ui.js` line 759, and the "VP" label in the detail panel.
- The audit token `{sysMult}` goes away.

**Synergy (the other hidden fraction): ADOPT removal.** Synergy is `syn * 0.5` per matching system, summed then rounded. That is a half-VP rule with a rounding step, and it is worth about 0.4 VP per studio. Sim: `{"synergyOn":0}` at 400 games:

| N | Expert band / blowouts | Optimizer edge |
|---|---|---|
| 2 | 82% / 9% (base 82 / 11) | 5.66 (base 5.79) |
| 3 | 93% / 5% | n/a |
| 4 | 95% / 3% (base 96 / 3) | 5.21 (base 5.37) |
| 5 | 98% / 2% | n/a |

No measurable change (winner drops about 0.5 VP). Removing it deletes the half-VP rule, the card "syn" number and the objective skill icon text. The bot still adds a small synergy term to its build score; harmless but note it. Confidence: high for (b), medium-high for synergy removal.

## 2. Team Event tile: REWORD now, keep the effect, optional cheap buff for playtest

**What it does.** Tile text shows `+1 Culture` (`spotFxAdj.team`). Real effect: pay 3G with a 2-worker Strike Team for -3 Burnout (Culture +1 folds into Burnout -1, plus `burnTeamRelief 2`). The D.spots base row also says `+2 Culture`, so three different numbers exist.

**Use.** The tile is never taken: 0.00 placements per game in every baseline cell at 2-5P. The bot values it near 0.5 and the crew cost makes it negative. So I forced the Optimizer to use it (`_W:{teamV:X}`), 4P, 400 games, base edge 5.37:

| Setting | Team uses per game | End Burnout (Optimizer) | Optimizer edge |
|---|---|---|---|
| `teamV` 8 | 3.1 | 3.4 | 4.52 |
| `teamV` 10 | 3.7 | 3.1 | 3.41 |
| `teamV` 13 | 4.2 | 2.7 | 1.43 |
| `teamV` 10, only at Burnout >= 4 | 2.6 | 3.4 | 4.96 |
| same + cost 2G | 2.6 | 3.3 | 5.06 |
| same + relief -4 (`burnTeamRelief 3`) | 2.5 | 3.2 | 5.15 |
| same + cost 2G + relief -4 | n/a | 3.1 | 5.47 |

(2P with `teamV` 10: edge 3.46; 5P: 5.35.)

**Reading.** At 3G for -3 it is a break-even rescue tile that costs a few VP if used reflexively. It is a trap for a bot, but a rational player can take it at Burnout 4-5 and roughly break even while avoiding Strained and Bench effects. The cost 2G + relief -4 version removes the penalty entirely (edge 5.47 vs 5.37 at 400 games; same noise caveat) and drops end Burnout by about 2.

**Exact change.** Always: set the tile text to "Pay 3G (2 workers): lower Burnout by 3." Concretely `spotFxAdj.team = "-3 Burnout"` (the note already says Strike Team + 3G), and make `D.spots` `team.fx` match. Check nothing parses the string: `fx` is only read by `parseEffect` for generic tiles, and the `team` special applies its own numbers (engine line 767). Tutorial already computes `teamRelief` from config, so it stays right. Optional playtest candidate: `spotPatch.team.cost = {"gold":2}` and `burnTeamRelief 3`, with the text "-4 Burnout". Do not adopt that blind; it is only sim-checked against a forced-use bot.

Confidence: medium. Whether humans use the tile is a playtest question.

## 3. 2P table health: ADOPT income 8 at 2P only; blowouts stay around 10-12%

**Diagnosis (400 games).** 2P Expert table: winner median 40; the band misses are almost all winners under 33 (17%), not over 63 (1%). Gap SD is 15.4. Gap variance by source: systems 25%, Hype 23%, objectives 17%, Crisis 16%, leftover Gold 10%, Progress 4%. At 4P the same blowouts are 3%. So the 2P band problem is a too-low score ceiling (systems per studio 2.56 vs 2.95), while blowouts are a variance problem. They need different fixes.

**Sweep, 2P Expert table, 400 games, seed 30000 (base: band 82%, blowouts 11%, gold 7.7):**

| Change | Band | Blowouts | Gold | Verdict |
|---|---|---|---|---|
| `closeByN` 2: 1 | 83% | 10% | 8.0 | no help |
| `closeByN` 2: 0 | 83% | 12% | 8.5 | no help |
| `closeByN` 2: 3 | 76% | 13% | 7.7 | worse |
| 2P board = 3P board (restore 7 tiles) | 86% | 14% | 8.7 | band up, blowouts up |
| `startGold` 12 | 82% | 11% | 7.7 | no effect |
| `income` 6 | 62% | 6% | 6.0 | too poor |
| **`income` 8** | **88%** | **14%** | **9.4** | band fixed |
| `income` 9 | 92% | 10% | 13.4 | Gold guard broken |
| `sysVPMult` 4 | 86% | 14% | 7.7 | no |
| `objBonus` 3 / gate Hype x0.5 / gate levels E,E,M,H / no Crisis | 83 / 84 / 79 / 78% | 13 / 12 / 12 / 13% | n/a | no |
| income 8 + `raceCap` 45 / 39 | 87 / 85% | 14 / 13% | 9.4 | no |
| income 8 + `buyoutVP` 3 | 88% | 14% | 9.4 | no |
| income 8 + `hypeBank` 2 / 4 | 88 / 93% | 12 / 12% | 9.4 / 10.0 | band only |
| income 8 + `objBonus` 1, `hypeDecay` 3, no gate VP | 88 / 86 / 86% | 13 / 12 / 12% | 9.4 / 8.8 | no |
| income 8 + `goldPerVP` 3 | 88% | 15% | 9.4 | worse |
| income 9 + `sysVPMult` 2 | 91% | 9% | 13.4 | meets both, but Gold 13 and 2P-only card values are not printable |
| income 9 + `goldPerVP` 5 | 92% | 9% | 13.4 | meets both, Gold 13 |

**Recommendation (smallest change).** Add `cfgByN: {"2": {"income": 8}}` (rulebook: "In a 2-player game each studio gets 8G income"). Cost: one printed number. Verification on fresh seeds (50000, 400 games each): Expert 2P band 76% to 91%, blowouts 12% to 10%, gold 7.3 to 9.3, systems per studio 2.42 to 2.76 (this is with the full package of item 6, which does not touch 2P directly beyond income). With income 8 alone on seed 30000: 88% / 14%. With Optimizer: 2P edge unchanged (5.37 vs 5.8 base, win 62% vs fair 50%), band 89%, All-Optimizer 2P band 92%, blowouts 12%, Gold 8.5. 3-5P are unaffected by construction (`cfgByN` keys only 2).

**Not solved: blowouts under 10%.** No single lever moves blowouts reliably below 10% while the band is at or above 85%; every lever that lifts the band also lifts scores and with them absolute gaps (the 25 VP threshold is absolute). The two cells that reach 9% have 13 leftover Gold. Two honest options: accept 10-12% at 2P (typical 2P gap is 12 VP, SD 15), or restate the 2P blowout threshold as 25 VP only above a 45-VP winner. A persona fix for Crunch (item 5) cut 2P blowouts from 11 to 9% on its own, but lowered the band to 80%, so both together would be the next thing to try. Confidence: band fix high, blowout target low.

## 4. Starting Juniors 3 vs 4 at 3-5P: REJECT 4, keep 3

| N | Expert band / blowouts, 3 Jr | Expert band / blowouts, 4 Jr | Edge, 3 Jr (seed 30000 / 50000) | Edge, 4 Jr (seed 30000 / 50000) |
|---|---|---|---|---|
| 3 | 93% / 5% | 91% / 5% | 6.3 / n/a | 7.6 / n/a |
| 4 | 96% / 3% | 94% / 4% | 5.4 / 4.9 | 6.6 / 5.7 |
| 5 | 97% / 2% | 94% / 2% | 6.1 / n/a | 6.7 / n/a |

Pooled gain is about +1.0 VP of edge (+1.3 at 3P, +1.2 and +0.7 at 4P, +0.7 at 5P), i.e. 1-2 points of win rate, with each reading at 1-2 standard errors. The cost is 2-3 band points at every count plus the known 2P damage, and one more salary line (about 1G) in a tutorial that already teaches payroll and the single-desk limit. First-round feel (`tools/d6early.js`, 4P, 20 games, 3 Jr): about 2.5 of 3 Juniors placed in round 1, 0.5 idle, 2.2 desks held at the end of round 1, Gold about 17.8 at the start of round 2. A fourth Junior would give a player one more idle worker in round 1 (desk limited), so it adds a decision the tutorial does not yet support. Not worth it. Confidence: medium-high.

## 5. Dead tiles, traps and the Crunch archetype

**Usage per game at 4P Expert, by phase (400 games; round map Concept 1-3, Production 4-8, Polish 9-11, Launch 12).**
- Launch (round 12): `press` 0.35, `platform` 0.49, `ship` 0.28, `party` 0.53, `contract` 0.11. Real tiles: `launchcrew` 1.58, `keynote` 1.04, `warroom` 0.73. At 5P `launchCap` makes up to 3 copies of each of party, press and platform, so those three types alone are 9 physical tiles.
- Polish (rounds 9-11): `plan1` 0.25, `contract` 0.28, `playtest1` 0.12, `test2` 0.44, `create2` 0.43, `vslice` 0.53, `labcrew` 0.73 (versus 1-3 for the live tiles). All are also used in earlier phases, so I only narrowed phases rather than deleting.
- Traps: `crunchbonus` (6G for +3 Progress or +3 Hype) is used 1.4-2.2 per game by Experts but only 0.3 by the Optimizer; it loses about 0.5 VP versus keeping the Gold. `fundraise` is roughly neutral and used 3 per game; leave it.

**Proposal, tested (4P unless noted, 400 games, seed 30000).**
1. Remove Launch `press`, `platform`, `ship`: `spotPatch` with `phases: []` for each. 3P/4P/5P Expert: band 93 / 96 / 97%, blowouts 5 / 2 / 2% (baseline 93 / 96 / 97%, 5 / 3 / 2%). Optimizer 4P edge 5.09 vs 5.37 (noise).
2. Merge those into `party`: `spotPatch.party.fx = "+2 Progress, +2 Culture OR +2 Hype, +2 Culture"`. `party` use rises to 1.55 per game, which is about the sum of the three it replaces (0.35 + 0.49 + 0.53), so demand moved rather than vanished. Expert 4P band 95% / 3%, Optimizer edge 5.22. End Burnout drops to 4.6 (more Culture at the end).
3. Remove Polish `contract` and `playtest1` (`phases: []`) and narrow `plan1` to `[0,1]`, `test2` to `[1]`. Optimizer 4P edge 4.83 (noise), Expert band 97% / 2%.
4. Combined (items 1-3), 400 games, seed 30000: Expert 3 / 4 / 5P band 94 / 95 / 96%, blowouts 5 / 3 / 2%; Optimizer 3 / 4 / 5P edge 7.0 / 4.9 / 5.9, win 54 / 39 / 41%. All-Optimizer 4P band 96%, blowouts 4%. Physical saving: 5 tile types plus all their launch copies (about 10-13 tiles at 5P).
5. `crunchbonus` cost 4G instead of 6G: Optimizer edge 5.07 and use unchanged. No gain, do not bother; consider deleting the tile instead.

Decision: adopt 1-3 as one change set (neutral in sims, strictly fewer components); playtest the party wording ("Final Push"). Reject the `crunchbonus` buff. Confidence: medium-high that balance is unaffected, but the sims cannot tell whether humans find the single Launch tile less interesting.

**The Crunch archetype (4P all-Expert, 400 games).** Crunch wins 9-10% (fair 25%). Its parts versus the table: Progress +4 VP, Hype -4, systems -5 (2.0 built vs 3.4), Debt -1, objectives -1, leftover Gold 4.4 vs 8.4. It is dominated by symmetry: Progress and Hype pay the same rate (1 VP per 3), so a single-track plan gains nothing and gives up systems and objectives.

Rule levers tried (4P, Crunch win rate; baseline 9-10%): `raceTop` 2 sole-Progress-leader bonus: 13%; `raceTop` 3: 11%; `debtLossByN[4]` 3: 14%; `raceTop` 3 + debt 3: 10%; `hypeDecay` 3: 15%; `srBonus` 2: 11%; `sysVPMult` 2: 15% (but winners fall 3-4 VP); `sysVPMult` 2 + income 8: 14%; `raceDen` 2: 14%; `salaryJr` 0: 10%. None reaches 18% on rules alone, and none is noise-proof (+-1.6 points).

Persona retune (a bot change, no rule change): `botPersonas.crunch = {prod 1.5, mktg 0.8, hype 0.8, spotDebt 0.6, cat {Innovation 1.5, Stability 1}, workers 0, buildBias 2}` gives Crunch **18%** at 4P (fair 25%), table band unchanged, and at 2P Crunch 43% with 2P blowouts 9%. So the weakness is the persona being too extreme (zero Hype), not a rules hole. A human who keeps a Hype floor is viable. Recommendation: do not touch rules; retune the persona and call "pure Progress" a deliberately weak line. Confidence: medium (one config, 400 games).

## 6. Skill edge: no single cheap lever; keep A plus the package below

The Optimizer already wins 1.5-1.9x its fair share at 3-5P (edge 5-6 VP). Levers tried, 4P Optimizer, 400 games, seed 30000 (base edge 5.37, SE about 0.65):

| Lever | Edge | Band | Verdict |
|---|---|---|---|
| `startWorkers` 4 | 6.63 | 96% | seed 50000: 5.65 vs 4.94 base; about +1.0 pooled; see item 4 |
| `trainCost` 2 | 6.60 | 97% | **Seed 50000: 4.68 vs 4.94. 3P 5.58 vs 6.3, 5P 5.57 vs 6.07. Rejected: seed-30000 fluke.** It also drops 2P Expert band to 73% |
| `hypeBank` 5 | 5.69 | 97% | +0.3, noise |
| `wsStep` 2 / `wsStep` 0 | 5.60 / 5.33 | 96-97% | noise |
| `recruitCost` 3 / `recruitLadder` 2 | 5.09 / 4.68 | 96 / 94% | lowers scores and edge |
| `income` 6 | 5.36 | 92% | band cost |
| `objDraw` 3 | 5.00 | 95% | noise |
| `buildsPerRound` 2 | 4.67 | 96% | lowers edge |
| `wsFree` 2 | 4.85 | 94% (hi 6%) | lowers edge, inflates scores |
| `crunchGold` 3 / `buildDelay` 1 / market refresh | 5.41 / 5.34 / 5.37 | 95-96% | no effect |

Of 14 single changes, only `startWorkers` 4 has a consistent positive sign across counts and seeds (+1.0 VP), and item 4 rejects it for its cost. I would not tune the edge further: it is large already, and the Optimizer was tuned on these rules so any rule change handicaps it. Recommended: leave it.

**Recommended final package.** Everything below is one JSON override (`/tmp/claude-0/-home-claude/1859f66f-a66a-5b3f-90a6-b48599551acb/scratchpad/pkg.json` (raw sim output in the sibling `out/` folder)), tested together on fresh seeds (50000, 400 games per cell, 200 for All-Optimizer):
```
{"spotPatch":{"launchcrew_b":{"fx":"+7 Progress, +4 Hype"},"keynote_b":{"fx":"+3 Hype, +1 Wishlists"},
  "press":{"phases":[]},"platform":{"phases":[]},"ship":{"phases":[]},
  "party":{"fx":"+2 Progress, +2 Culture OR +2 Hype, +2 Culture"},
  "plan1":{"phases":[0,1]},"test2":{"phases":[1]},"contract":{"phases":[]},"playtest1":{"phases":[]}},
 "cfgByN":{"2":{"income":8}}, "synergyOn":0, "sysVPMult":1 with every system vp x3 (_vpMul:3)}
```

| N | Table | Band | Blowouts | Gold left | End Burnout | Systems per studio | Optimizer edge | Optimizer win (fair) |
|---|---|---|---|---|---|---|---|---|
| 2 | A (Expert / Optimizer) | 76% / 89% | 12% / 14% | 7.3 / 7.3 | 5.1 / 5.0 | 2.42 / 2.58 | 5.31 | 62% (50) |
| 2 | Package | 91% / 92% | 10% / 12% | 9.3 / 8.2 | 4.9 / 4.9 | 2.76 / 2.87 | 5.30 | 65% (50) |
| 3 | A | 92% / 94% | 4% / 4% | 8.3 / 8.1 | 5.0 / 5.0 | 2.71 / 2.71 | 5.63 | 49% (33) |
| 3 | Package | 94% / 95% | 4% / 4% | 7.9 / 7.6 | 4.6 / 4.5 | 2.72 / 2.68 | 5.58 | 48% (33) |
| 4 | A | 95% / 96% | 3% / 2% | 8.4 / 8.4 | 5.1 / 5.1 | 3.02 / 3.05 | 4.94 | 38% (25) |
| 4 | Package | 95% / 96% | 3% / 1% | 8.2 / 8.1 | 4.6 / 4.6 | 3.02 / 3.07 | 4.55 | 39% (25) |
| 5 | A | 94% / 96% | 2% / 3% | 7.2 / 7.0 | 4.9 / 4.9 | 2.63 / 2.66 | 5.83 | 33% (20) |
| 5 | Package | 96% / 98% | 2% / 1% | 6.8 / 6.6 | 4.3 / 4.3 | 2.62 / 2.67 | 5.89 | 39% (20) |

Guards: band at or above 85% everywhere (2P fixed); blowouts under 10% at 3-5P and 10% at 2P Expert (12% Optimizer); Gold left in 6-10 everywhere; end Burnout 4.3-4.9 (slightly under the ~5 target at 4-5P because the merged `party` tile gives more Culture; if you want exactly 5, change `party` to +1 Culture). Optimizer edge is unchanged within noise (4.55-5.89, SEs about 0.6). All-Optimizer package: 3P band 96% / blowouts 1% / Gold 7.2 / spread 15.5; 5P 97% / 1% / 6.2 / 19.3; 2P 93% / 13% / 8.4; 4P 96% / 4% / 7.7 / 18.9.

## 7. "Tile" vs "spot": use "tile" in the rulebook and the physical game; keep "spot" as an internal id name

Counts in the repo: `ui.js` spot 104 / tile 13; `tutorial.js` spot 10 / tile 1; `data.js` spot 72 / tile 22; `mkref.js` (rulebook generator) spot 10 / tile 38; `engine.js` spot 87 / tile 4. The code and UI are "spot" because that is the developer name for the data model; the rulebook already says "tile", and the player-facing nouns are physical: you place a worker on a board tile, a Team Event tile, a Talent tile. In a printed game, "spot" reads as a place on the board in the abstract and clashes with "space" on the track; "tile" matches the cardboard. Recommendation: rulebook and tutorial/UI strings say "tile" (about 120 player-visible strings in `ui.js`, `tutorial.js` and `D.copy`), code identifiers (`spotPatch`, `D.spots`, `activeSpots`) stay unchanged. Caveat: "tile" is slightly wrong for the multi-slot Launch rows and the two-copy `_b` tiles, but that is the same word as the component they print. Confidence: judgement, no sim.

## 8. New problems the sims reveal

All-Optimizer tables (A, 200-300 games):

| N | Band / blowouts | Systems | Desks | Gold left | Winner-minus-last spread |
|---|---|---|---|---|---|
| 2 | 91% / 9% | 2.37 | 4.51 | 7.0 | 11.9 |
| 3 | 97% / 3% | 2.80 | 4.23 | 8.3 | 16.9 |
| 4 | 97% / 1% | 3.13 | 4.13 | 8.0 | 19.1 |
| 5 | 99% / 1% | 2.74 | 3.92 | 6.3 | 22.0 |

Findings:
- **No dominant tile or opening.** Win rate of players who took any single tile in rounds 1-2 stays within 24-31% at 4P Expert (fair 25), and 24-27% at 4P All-Optimizer; `outsource` (taken 8.8 times per game) is slightly below fair (24%, 30% at 3P, 49% at 2P), so it is a default pick rather than a strong one. Weak openers in Expert tables: `proto1` 16% and `kickoff` 19% at 4P. `talent1` (8-10 uses per game) and `outsource` (8.8 per game) are taken nearly every round they are open: they are the "forced pick" tiles. Worth a playtest note: a single-slot tile that is always taken is a turn-order tax. Not fixed.
- **No runaway leader or first-seat edge.** Leader after round 6 wins 39% (4P Expert), 40% (4P All-Optimizer), 50% (3P), 64% (2P), against fair 25/25/33/50. The last-place studio after round 6 wins 15% at 4P and 39% at 2P: comebacks exist. Seat 0 wins 25-30% at 4P All-Optimizer and 38% at 3P (n=300, within about 2 standard errors). Not conclusive; watch turn-order fairness in playtest.
- **Optimizer tables are healthy**, with band 91-99% and blowouts 1-9%. Systems per studio is a flat 2.4-3.1 and desks 3.9-4.5, the interior optimum noted before.
- **Not measured**: kingmaking. The bots only "deny" for their own gain, so a human who throws a game cannot be simulated here.
- **Bot defect.** The Team Event is never chosen by any bot (item 2), so Burnout is only managed by calm rounds; the sims therefore cannot say whether humans will manage Burnout better than 5 at the end.

---

## Ranked action list

1. Print the multiplied VP on cards and set `sysVPMult 1` (`_vpMul 3`). Zero balance change, removes the biggest first-game surprise.
2. Adopt `cfgByN {"2":{"income":8}}` (2P band 76-82% to 88-91%).
3. Remove `synergyOn` (half-VP and rounding rule worth 0.4 VP per studio).
4. Reword the Team Event tile to "-3 Burnout" (and make `D.spots` and `spotFxAdj` agree).
5. Remove Launch `press`/`platform`/`ship`, merge into `party`, narrow Polish `plan1`/`test2`, drop `contract`/`playtest1`. Neutral in sims, saves 5 tile types.
6. Rulebook says "tile" everywhere player-visible; code keeps "spot".
7. Keep 3 starting Juniors; do not touch training cost (`trainCost` 2 looked good on one seed and failed on the next).
8. Retune the Crunch persona (bot only) to restore a Hype floor; leave rules.
9. Do not chase more Optimizer edge.

## Questions only a human playtest can answer

- Does anyone take the Team Event, and at what Burnout? Is 3G plus two workers for -3 too dear, or is cost 2G / -4 needed?
- Is 2P at income 8 fun and fair, or do blowouts feel worse at 10-12%? What gap feels like a blowout in a 2-player game?
- Do players read "3 VP" and "6 VP" system cards as huge next to a 1 VP-per-3-Progress track?
- With the Launch tiles merged, does round 12 feel too narrow for the 3rd and 4th worker?
- Is `talent1` or `outsource` a "must take first" tile for the first player in order?
- Is a pure-Progress (Crunch) line fun even if it wins less often? Does a human keep a Hype floor naturally?
- Does the first-round desk limit with 3 Juniors feel like a puzzle or a restriction?
- Does anyone use the Hype or Wishlist plans enough to justify the Wishlist rules?
