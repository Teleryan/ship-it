# SHIP IT! FTUE audit: guided tutorial and rules text (version A: 1 free desk, 2/2/2/3/4G ladder, 3 starting Juniors)

Work copy: `/home/claude/work/ftue`. `/home/claude/ship-it` was not touched. Nothing was committed or pushed.

Verification after the changes: `npm test` prints `fails 0`, `npm run golden` is ok, the scripted harness reaches `FINAL`, and 750 randomised "human" playthroughs (5 styles x 150: random, buys every desk, never buys a desk, passes fast, always crunches) all reach `FINAL` with no dead end. Desktop 1440x900 and phone 390x844 were checked with Playwright screenshots.

Tools:
- `tools/ftue_audit.js` (new, in the copy). It renders every step through a scripted playthrough, then checks:
  - leftover placeholders, `**` and double punctuation, and step length;
  - a stale-vocabulary list, run over the tutorial, the rulebook, and the spot, crisis and milestone text;
  - about 40 numeric claims in the tutorial and rulebook against D.config and engine behaviour (Team Event relief is measured by calling the engine);
  - two chips in the Launch board UI.
  - Run `node tools/ftue_audit.js`. Exit code 1 means a finding other than a length warning.
  - Against untouched HEAD it reported 57 findings. It now reports 2 (a length warning and the known milestone name in (b) #3).
- Playthrough drivers live in the scratchpad: `.../scratchpad/fuzz.js <style> <runs>` and `.../scratchpad/ui_run.js` (Playwright; W, H, TAG, SHOTS env vars).

---

## (a) Mismatches found AND fixed

| # | Where | Before | After |
|---|---|---|---|
| 1 | `ws1` | Prices rendered as literal `**2G**, **2G**, **2G**, **3G**, **4G**` (visible in the UI). Cause: `wsPriceText` emitted markdown after `fmt` had already converted bold. | Prices now live in `place2`: "the 2nd to 4th **2G** each, the 5th **3G**, the 6th **4G**", properly bold. |
| 2 | `burnout` vs `board_perks` vs rulebook | Burnout step said a Team Event lowers Burnout by **2**. The perks step and rulebook ref page said 3. The rulebook Key rules said "-1 on a calm round or a Team Event". | All say **-3**. Measured in the engine: `teamEventCulture` 1 (which the Culture fold turns into -1 Burnout) plus `burnTeamRelief` 2. Key rules now read "-1 on a calm round, -3 on a Team Event". |
| 3 | `win_vp`, `build`, explainer row "Systems", `PARTS` | "Systems... scores its **printed VP**". | "printed VP x 3". The engine has `sysVPMult` 3; the rulebook and results screen already said x3. |
| 4 | `races` and `explain_*` rows | "There are no rank prizes..." (a trace of old scoring). Old explainer rows: "1st place pays most, ties split the points", "Culture: lowest Culture loses the most VP". | Plain "every 3 points is 1 VP". Explainer rows now take live tokens (`{raceDen}`, `{goldPerVP}`, `{sysMult}`, `{objPer}`, `{objBonus}`, `{burnVP}`), so they cannot drift. |
| 5 | Results explainer ("How your N VP was made") | No Burnout row, so the rows did not sum to the total (the engine's score includes `burnout`, 0 to -4 VP). | Burnout row added. A bot game checks out: rows sum to 51, total 51. |
| 6 | `crisis` | "...every studio: Early Access Offer. All players secretly bid Gold... keep their gold.." Double period; the full card text duplicated the pop-up. | "This one is **Early Access Offer**. Read the card in the pop-up and make your choice. If it asks for a bid, a bid of **0** is safe." (new `crisisName` token) |
| 7 | `tired` | "A Tired worker who works again becomes Exhausted: they earn no skill and add Burnout." Wrong: in the engine a Tired worker works normally; only placing an already-Exhausted worker is overwork. | "...can work again, but then becomes **Exhausted**, and an Exhausted worker you place earns no skill and adds Burnout." Now matches the rulebook worker table. |
| 8 | `board_prototype`, explainer | Tech Debt "left behind by rushed (crunched) work" and "debt from crunched spots". Crunching a build adds no Debt in the engine. | "left by risky spots and systems (they carry a red Debt mark)". |
| 9 | `upkeep`, `hype_bank`, rulebook | Hype described as fading every round, including round 2. The engine has `decayFromRound` 4. `hype_bank` appears after the first bank has already happened. | `upkeep`: "From round 4, Hype also fades by 2". `hype_bank`: "From now on Hype fades... (this just happened for the first time)". Rulebook says "from round 4" in three places. |
| 10 | `polish` | "Beta Review" hard-coded. | `{gate3Name}` token. |
| 11 | Terminology | "strike team" (lowercase) in `board_jam`. Rulebook used "desk N costs" and "Rush". | "Strike Team". "workstations 2 to 4 cost 2G each, workstation 5 costs 3G...". "Crunch" everywhere, including the Systems guide, the timeline and the R&D spot note ("Gold rush fee" became "Gold crunch fee"). |
| 12 | Rulebook | "every 3th space", "(they also still give 1 less)", "1 per 1 Exhausted workers", "risks a 1-in-6 quit at Upkeep" (no quit roll exists: `lossThreshBase` is 0). | "every third space", "(its tile also pays 1 less, as usual)", "1 per Exhausted worker", quit-roll clause removed. |
| 13 | Cards, spots, engine strings (wording only, behaviour unchanged) | Talent: "Hire one more worker... pool hire". Studio Raid: "hire... If the released pile has Seniors". Tech Breakthrough: "ignores Momentum cost". Milestones: "spending on hires, recruits...". Engine reason "No hiring in Launch". Engine log "UPKEEP: ... Culture toward 0". | Talent: "Recruit one more worker...". Studio Raid: "recruit 1 Junior of any role at HALF cost (1G). Seniors cannot be recruited." Tech Breakthrough: "(no skills or Gold to pay; it still needs workers)". Milestones: "on recruits, builds or crunch". Engine: "No recruiting in Launch"; the log no longer mentions Culture. |
| 14 | UI: Launch board scoring chips (`raceRules`) | DEBT chip showed "1st most -10 · least 0" (the engine's `debtLossByN` at 2 players is 3/0). A CULTURE chip "1st lowest -8" appeared although no Culture VP exists. | DEBT uses `debtLossByN`. The chip is replaced by BURNOUT "2: -1 · 3: -1 · 4: -2 · 5: -3 · 6: -4". |
| 15 | UI: Studio Raid pop-up | "Hire a released worker at half cost... Released pile". It also offered Sr buttons that actually gave a Junior at the Senior price. | "Recruit a Junior at half cost", Juniors only. |
| 16 | Tutorial logic | `r2crunch` treated "crunched ever" (`cs.crunched`, cumulative) as done, so a player who crunched in round 1 silently skipped the lesson (48% of random runs). | Uses this round's `rs.crunched`. The lesson now shows in 100% of runs. |
| 17 | Wording | "they sits out", "lowers Burnout by 1 (that is +1 Culture)". | "they sit out", "lowers Burnout by 1". |
| 18 | `hint_wait` | "Resolving…" was the whole text of `polishfree` and part of `r4play` / `prod`. | "Resolve any pop-up (a Crisis card or a choice), then play your round." |

## (b) Mismatches found but NOT fixed (need a design or content decision)

1. **System cards print "1 VP" but score 3.** Tutorial and rulebook now say "x 3", but the card still shows the unmultiplied number (the UI shows `def.vp`; the engine scores `vp x sysVPMult`). Likely the biggest first-game surprise. Either print the multiplied VP on the card or label the number.
2. **The Team Event tile reads "+1" heart (Culture)** while the effect is -3 Burnout (+3 on the folded Culture track). `spotFxAdj.team` could say "+3 Culture". Left alone because I did not verify that nothing parses that string.
3. **Milestone name "Hiring Spree"** is stale, but it is a key in `MILE_CHECK` and `mileGoldAdj`. It is the one STALE line the audit still reports.
4. **`D.copy` (data.js, "classic tutorial" and screens table)** holds many dormant draft, bid, hire, shortlist, Momentum and release strings. No current screen uses them as far as I could tell, but the Data Studio would surface them. Recommend deleting the classic rows.
5. **Outsource spot note** says "Jr +3G / Sr +5G". The live tile is patched to +2/+4 at 2 players via `outsourceJrByN`.
6. **Glossary tags** (Flexible, Amplifier, Reliable "when swaps are off", Dedicated "Bug Bounty") were not tied to current engine behaviour. Check them against `D.disciplines`.
7. **"tile" vs "spot".** UI and tutorial say "spot"; the rulebook says "tile". Pick one for the physical rulebook.
8. **`dist/` was not rebuilt.** Run `npm run build` before shipping.
9. **`burnout` step is 89 words** (target 85). Left as is: it is a single read-only reference card.

## (c) Ranked FTUE issues, with the change made

**1. Information wall before the first action.** The first placement is at step 12: 10 info cards plus the objectives pick come first (welcome, win_vp, objectives, phasestart, order, team, boardintro, backlog, prototype, income, placeintro). Before the changes it was 11 info cards.
- Done: `board_pitch` merged into `board_prototype` (both rows highlighted); wording trimmed throughout.
- Still recommended: move `phasestart`, `order` and `income` to after the first placement; none is needed to place a worker.
- Total steps went from 42 to 39 (`board_pitch`, `build_rd` and `culture` merged away).

**2. Round-1 Manage is a 6-card info stack** (build, build_rd, tired, burnout, culture, board_perks). The player has felt no Burnout yet, and 8 new terms arrive (Tired, Exhausted, Burnout, Energized, Strained, Burned out, Meltdown, Culture).
- Done: `build_rd` folded into `board_perks` (R&D is a Studio Perk); `culture` folded into `burnout`. New order: build, tired, burnout, board_perks, rest1.
- Before (`tired`): "A Tired worker who works again becomes Exhausted: they earn no skill and add Burnout."
- After: "A Tired worker can work again, but then becomes Exhausted, and an Exhausted worker you place earns no skill and adds Burnout. A worker who sits out a round rests and recovers one step."

**3. The desk lesson (start with 1 desk, buy more at 2G).**
- Timing is good: `place1`, then `stats`, then `ws1` (the counter reads "0 free of 1"), then `place2`. The player runs out right after the first placement, holding 15G with nothing else to spend it on, so they understand why.
- Problems found: `ws1` was 134 words with literal `**`; `place2` gave no recommendation; its highlight covered the workers panel instead of the Buy button.
- Before (`ws1`, tail): "...Press Buy workstation to add a desk, up to 6 in total: the 2nd costs **2G**, the 3rd costs **2G**, ... Each one costs more than the last, so buy only as many as you can use well. A desk you buy stays with you for the rest of the phase... When a new phase begins, you are back to 1 and buy again."
- After `ws1` (Next, 55 words): "Every placement needs a **workstation** (a desk). You start with just **1**, so you can place **one worker per round** until you buy more. The counter is in your studio panel. Taking **any board spot**, including Studio Perks, uses one. Triggering one of your own systems does not."
- After `place2` (76 words, retitled "Buy a workstation, or pass"): "You are out of workstations. To place a second worker, press **Buy workstation** in your studio panel (2G for the next one), then place. Extra ones cost: the 2nd to 4th **2G** each, the 5th **3G**, the 6th **4G** (up to 6 in all). They stay for the rest of the phase, and a new phase resets you to 1. Workers you do not place **rest**... When you are finished, press **Pass**."
- `place2` now highlights only the Buy button.
- Remaining gap: the "back to 1 each phase" reset is easy to forget until round 4 and round 9. See P3.

**4. The win condition was incomplete and said "printed VP".**
- Before (`win_vp`): "VP come from five sources: the Progress and Hype races, the systems you build, your secret objectives, publisher gates, and leftover Gold (every 4 Gold is worth 1 VP). Each one is explained when it first comes up in play."
- After, as a list with the x3 and the two penalties: "Progress and Hype: every 3 points is 1 VP / Systems you build: printed VP x 3 / Objectives: your secret goals / Publisher gates: pass for funding, miss and lose VP / Leftover Gold: every 4 Gold is 1 VP. You lose VP for Tech Debt and high Burnout."

**5. Crisis step.** It duplicated the pop-up, had a double period, and gave no help with a numeric bid field. The bid defaults to 0 and the step now says 0 is safe. See (a) #6.

**6. First-placement coaching.** "Step 1: click one of your workers..." sat under a header reading "STEP 13 OF 42". Now: "**Click one of your workers** in the Studio Workers panel to select it." and "Now **click a green spot**: green means this worker can use it..."

**7. Phone layout.** The coach card was 511 to 576 px high on an 844 px screen (`welcome`, `ws1`, `build`) and covered the highlighted target.
- Done: the scroll-clear threshold in `tutHighlight0` is now `cr.top > innerHeight*0.2` (was 0.4), and text cuts bring the worst steps to about 330 to 430 px.
- Very long smooth scrolls (for example `promote` on a phone) take about 3 s to settle, but the target ends in view.

**8. Lessons that are silently skipped (not dead ends).**
- `promote` is skipped if the player already promoted in round 2 or 3 (`r2crunch` and `r3` do not block train or promote). It was skipped in 40 to 60% of random runs.
- `convert` is skipped if no worker's role has 3 skills left (about 45% of random runs), so "unspent skills score nothing" is never shown. Consider showing the Launch tip without the action.

**9. `r3` title and hint.** The title is now "Round 3: keep building", and the body adds "Production opens more Progress and Hype spots".

**Word counts.** Steps now average 47 words, max 89 (`burnout`); 10 steps are over 60 words. Before: average 49, max 134. Most steps name one action. The exceptions are `rest1` ("Cash in... then press Done") and `place2` ("buy a workstation ... press Pass"), which are chained on purpose.

Blocked-action messages were reviewed; they all say what to do. Two were sharpened:
- `msg_crunch`: "Start this build with Crunch" became "Set Build speed to Crunch, then build".
- `msg_trigger`: "Place your Senior on the system tile" became "Select your Senior, then click your system tile".

**Dead ends and getting stuck.** None found.
- The 750 randomised playthroughs never reached a state where every allowed action was blocked. Styles included spending all Gold on desks and recruits, and never buying a desk.
- Safety nets I checked: `place1` needs only 1 desk. `r2recruit` is rigged with the Gold to recruit. The round-1 build is rigged with a free build if nothing else is buildable. `r2crunch` is rigged +4G and allows Done if nothing is buildable. `promote` is rigged with Gold and a trained Junior.
- Weak spots: one-time rigs (a player who spends the rigged Gold before the step) and the Done-allowed-if-nothing-buildable escape in `r2crunch` that silently skips the lesson.

## (d) First-time-player playtest observations to watch for

- **P1** After `place1`, does the player notice "0 free of 1" and press Buy workstation before `place2` tells them to? Do they buy all 5 desks in round 1 (13G)? That would starve round-2 recruiting and crunch; the tutorial rigs Gold for those steps, which hides the damage.
- **P2** Do they read "Buy workstation · 2G" as a turn-ending action? It is free and does not end the turn.
- **P3** Do they notice in round 4 and round 9 that bought desks reset to 1? Expect "where did my desks go?".
- **P4** Do they understand the free build in `build` is a tutorial gift, and then fail to build in round 2 where it is not free?
- **P5** Do they read the card's "1 VP" as the final value and undervalue systems (unfixed issue 1)?
- **P6** Do they choose objectives without understanding the skill icon and synergy sentence?
- **P7** Do they press **Got it** on the Crisis step before resolving the bid pop-up? Both are allowed. On a phone, does the pop-up hide the coach button?
- **P8** Do they treat Burnout bands as something to optimise in round 1? Do they remember that the penalty applies to placing an Exhausted worker, not a Tired one?
- **P9** Do they understand that recruit cost rises with other studios' recruits? Rival recruiting first changes the price.
- **P10** Round 4: do they promote a Junior whose role matches a built system? With one promotion per round they can pick wrong and never trigger. The `trigger` step is skipped if no system can be triggered.
- **P11** Round 12: do they still hold skills for `convert`, or have they spent them all on systems?
- **P12** Drop-off: measure it at `objectives` (the first decision) and at `income` / `placeintro` (the last cards before the first action).
- **P13** Phone: confirm the highlighted Buy workstation and Open Systems to Build buttons are never hidden under the coach box (it takes 40 to 50% of the screen).

## (e) Changed files (`git diff --stat` in the copy)

```
 game/data.js     | 109 ++++++-----   D.tutorial regenerated by mkrows; Talent/R&D/crisis/milestone wording; copy key "No recruiting in Launch"
 game/engine.js   |   6 +--           two reason strings, one log line; no rule or number changes
 game/rules.js    |   2 +-            regenerated by mkref
 game/tutorial.js |  51 +++---        wsPriceText, tokens, step list 42 -> 39, r2crunch fix, place2 highlight, scroll threshold, explainer tokens + Burnout row
 game/ui.js       |   6 +--           raceRules Debt/Burnout chips; Studio Raid pop-up wording, Juniors only
 tools/mkref.js   |  20 +++---        workstation ladder, Crunch wording, Team Event/Burnout line, typos, Hype-fade start, quit-roll clause
 tools/mkrows.js  | 116 ++++-----     all tutorial strings: rewrites, 3 rows removed, explain_burnout added
 tools/ftue_audit.js (new, untracked)  audit script
 7 files changed, 150 insertions(+), 160 deletions(-)
```

Engine rule behaviour is unchanged and golden output is identical. mkref was run via a path-patched copy (`SHIPIT_SRC` pointed at the copy's `game/`, output redirected to the scratchpad); the resulting `game/rules.js` was copied in. `/home/claude/work/ref` was not touched.
