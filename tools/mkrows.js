// Authoring source for D.tutorial (Variant C tutorial strings). Output is spliced into data.js.
// Markup: **bold**, blank line = paragraph break, {token} = live value.
const R = [];
const r = (id, when, title, btn, text) => R.push({ id, when, title, btn, text });
r("welcome","Step 1 · opening card","Welcome to Ship It!","Let's go",
"You run a game studio racing a Rival to ship the best game. Over 12 rounds you build a team, put it to work on the board, and build systems that score **Victory Points (VP)**. Most VP wins.\n\nThis version of the game is shaped by **four phases**: **Concept** (rounds 1-3) builds your skill bank, **Production** (4-8) and **Polish** (9-11) balance skills with Progress and Hype, and **Launch** (round 12) is the final push.\n\nThis guided game takes you through the whole game, one phase at a time. When every lesson has been shown the tips disappear and you finish on your own. You can stop the tips at any time with Stop coaching, or leave with the × button.");
r("win_vp","Step 2 · how you win","How you win","Next",
"The goal is simple: **finish round 12 with the most Victory Points (VP).**\n\nVP come from five places. The rest of this guide shows you how to earn each one:\n\n**1. The Progress and Hype races**: the biggest prizes.\n**2. Systems**: permanent engines that carry printed VP.\n**3. Objectives**: your secret goals.\n**4. Publisher gates**: reviews that pay for hitting a target.\n**5. Leftover Gold**: every {goldPerVP} Gold is 1 VP.\n\nSome things take VP away, so winning is as much about staying healthy as it is about racing.");
r("win_races","Step 3 · how you win · the races","The Progress and Hype races","Next",
"**Progress** and **Hype** are races. At the end of the game every studio is ranked on each track and VP are paid by rank. With **{nPlayers} players**, **1st place earns {raceFirst} VP** in each race and last place earns **{raceLast}**. Ties share the points.\n\n**Progress** comes from building your game on the board. **Hype** comes from promoting your game. Marketing is added to your Hype at the end of the game. Hype fades by **{hypeDecay}** every round.\n\nThese tracks show where every studio stands. The marker is the next publisher gate target.");
r("win_build","Step 4 · how you win · systems and gold","Systems, objectives and Gold","Next",
"**Systems** are permanent engines your studio builds. Every finished system scores its printed VP, and a Senior worker can be placed on a system for extra effects.\n\n**Objectives** are your secret cards. They pay VP if you completed them, and a finished system whose main skill matches a completed objective earns bonus **Synergy** VP.\n\n**Leftover Gold** is worth 1 VP for every {goldPerVP}, so money you do not need is never wasted.");
r("win_lose","Step 5 · how you win · what costs VP","What costs you VP","Next",
"Some things take VP away:\n\n**Tech Debt**: the studio with the most Debt loses the most VP.\n**Culture**: the studio with the lowest Culture loses the most VP.{burnLine}\n**Missed gates**: every publisher gate you miss costs VP, while passing one pays Gold or VP. We will meet gates at the end of round 1.\n\nThe winner is not just the fastest studio. It is the one that stays healthy while it races.");
r("loop","Step 6 · structure","How the game is structured","Next",
"The bar at the top shows where you are.\n\n**Phase start** happens 4 times in the game: Crisis, Reveal, Bid, Draft. It sets up the draft and the Crisis.\n\n**Round** happens 12 times: a blind Bid for turn order, then Income, Hire, Place, Build, Rest, Milestones, Upkeep. This is where your studio grows.\n\nWe will walk through each one the first time it comes up.");
r("objectives","Step 7 · pick objectives","Secret objectives","",
"First, choose your goals. Objectives are secret cards that pay VP at the end of the game, but only if you completed them.\n\nEach row offers 2 cards. Read what each one needs, pick one per row, then press **Confirm objectives**. Each card shows a skill icon. A finished system whose main skill matches a completed objective earns bonus VP.");
r("phasestart","Step 8 \u00b7 reveal and bid","Phase start: Reveal and Bid","Next",
"Phase 1 (Concept) has no Crisis card, so we start at **Reveal**: **{draftPool}** discipline cards are dealt face up. They are the people you can hire, and you see them before you bid. The pool is refilled after every pick.\n\nNext is **Bid**: everyone secretly bids gold, and the highest bid picks first in the draft and goes first in that round.\n\n**Every round starts with a bid**, not just the first round of a phase, so turn order is up for grabs each round. (This tutorial only bids once to keep things short.)");
r("boardintro","Step 9 · the board","The Board","Next",
"The **main board** is where your workers are assigned. Each row has a job. We will go through them one at a time.");
r("board_backlog","Step 9 · the board · Backlog","Backlog","Next",
"**Backlog** earns skills. Each skill belongs to one discipline category:\n\n**Bulb** = Ideas (Creative)\n**Brackets** = Code (Development)\n**Gear** = Process (Operations)\n**Megaphone** = Buzz (Marketing)\n\nA Junior earns **+1** of the spot's skill, a Senior **+2**.\n\nYou spend skills later to build systems, which your workers can then be assigned to for stronger benefits.");
r("board_prototype","Step 9 · the board · Prototype and Quality","Prototype and Quality","Next",
"**Prototype** generates **Progress**: how finished your game is.\n\n**Quality** fixes **Tech Debt**: the mess left behind by crunched work.");
r("board_pitch","Step 9 · the board · Pitch Deck","Pitch Deck","Next",
"**Pitch Deck** generates **Hype**: how much the world wants your game.");
r("board_jam","Step 9 · the board · Game Jam","Game Jam","Next",
"**Game Jam** needs a crew of 2 or 3 workers from different categories. It can earn skills or generate Progress.\n\nA worker earning skills is a worker not scoring: that is the central trade-off.");
r("board_perks","Step 9 · the board · Studio Perks","Studio Perks","Next",
"**Studio Perks** are special actions. **Each perk slot takes only one worker per round**, so whoever places first gets it. That is why turn order matters.\n\n**Talent**: recruit one extra worker from the pool, 1G cheaper.\n**Outsource**: a worker earns Gold.\n**Team Event**: send 2 workers with different roles (any two roles that are not the same) and pay 3G to gain +2 Culture.");
r("bid","Step 12 \u00b7 place a bid","Blind bid for turn order","",
"Type an amount and press **Lock in bid**. In a real game every round starts with this bid. **Every player pays their bid, win or lose**, and gold also pays for hiring, so do not overspend. Drafting itself is free.\n\nTry **1**.");
r("draft","Step 8 · draft","Draft: take a card","",
"Now the **Draft**. Players take turns picking one face-up card: press **Shortlist** on a card to pick that candidate, or tap it first to read more. You get **{picks}** picks. Each card is a discipline (Engineer, Artist, Designer and so on) and goes to your hand. **Drafting costs no gold**: you pay only when you hire. Pick a mix of disciplines, because systems need particular roles.");
r("hire","Step 14 \u00b7 income and hire","Income, salaries and Hire","",
"Round 1 began with **Income**: every studio received **{income}G**. Workers are then paid a **salary** every round (**{salaryJr}G** per Junior, **{salarySr}G** per Senior). You have none yet, so you paid nothing.\n\nYour hand holds the cards you drafted. A card is not a worker until you hire it, and **hiring is where gold is spent**. **Hire Junior** costs **{jrCost}G**. Seniors cannot be hired: they are promoted from Juniors later, in Production.\n\nClick a card, then press **Hire Junior**. Hire at least 2, then press **Done**.");
r("placeintro","Step 9 · place","Place: put workers to work","Next",
"Now you use the board. Players take turns placing **one worker at a time** on a tile that accepts them, going around the table until everyone passes.\n\nMost tiles hold **one worker**, so going early matters: the tile you want can be gone by your turn. That is what turn order is worth.\n\nHover over a greyed tile to see why it cannot be used.");
r("place1","Step 10 · first worker (nothing selected)","Place your first worker","",
"Step 1: **click one of your workers** in the Studio Workers panel above the board to select it. Press **Details** under a card any time to read about that worker.");
r("place1b","Step 11 · first worker (worker selected)","Place your first worker","",
"Step 2: green spots accept this worker. Greyed spots cannot be used (hover to see why). **Click a green spot**, then confirm.");
r("place1c","Step 12 · first worker (spot popup open)","Place your first worker","",
"Read the spot, then press **Place worker here** to confirm. The default choices are fine.");
r("place1d","Step 13 · first worker (worker popup open)","Place your first worker","",
"Press **Select this worker**. The spots they can use will turn green.");
r("place1w","Step 14 · first worker (Rival's turn)","Place your first worker","",
"The Rival is placing. You are next. Read the board while you wait.");
r("stats","Step 16 \u00b7 numbers","What your numbers mean","Next",
"The spot paid out instantly. What each number is for:\n\n**Gold** hires, recruits, and pays for systems and crunch.\n**Ideas, Code, Process and Buzz** (the four icons) come from earn spots and are spent on systems that need that role. They keep between rounds.\n**Progress** and **Hype** come from score spots and are what the race scoring rewards: the **Race tracks** panel shows where each studio stands, with the gate target marked. Hype fades by {hypeDecay} every round, so build it late.\n**Debt** is Tech Debt: high Debt costs VP. **Culture** is morale: the lowest Culture loses VP.{burnStats}");
r("place2","Step 15 · keep placing","Keep placing, or pass","",
"Each worker can work **once per round**. Place more workers if you want more skills.\n\nYou do not have to place everyone. **A worker you leave unplaced will rest** and recover from tiredness. When you are finished, press **Pass** at the top. Passing ends your placing for this round.");
r("build","Step 18 \u00b7 build a system","Build: spend your skills","",
"You have **{bank} skills** banked. The **Systems to Build** panel under the board shows what is available. Press **Open Systems to Build** to build: each card shows its cost in skills, plus Gold, and which workers it needs. Only systems you can afford are enabled. You can start **{buildsPerRound}** per round.\n\nA **System** is a permanent engine that scores VP at the end. Building it **commits one worker for every role it needs**: they cannot be placed until it is finished, and it does nothing until then. Stronger systems keep their crew busy longer (1 to 3 rounds).{freeBuild}\n\nBuild one, close the market with **×**, then press **Done**. It appears under **Building** in your studio panel with the round it finishes.");
r("build_rd","Step 18 \u00b7 R&D (after the build)","R&D: build faster","Next",
"Systems take several rounds to build, and their crew is busy until they finish.\n\n**R&D** is the spot that speeds this up. Send two workers from different disciplines (Creative + Development, or Operations + Marketing) and **system development is reduced by 1 round** for what you start building that round. You also skip the Gold crunch fee.\n\nPlan R&D for a round when you are about to start a big system.");
r("rest1","Step 19 \u00b7 tired workers and rest","Rest: tired workers","",
"Every worker who worked this round is now **Tired**. A Tired worker who works again becomes **Over-Tired**: no skill, and a chance they quit. A worker who sits out a round **rests and recovers**, so leaving someone unplaced keeps everyone healthy. Workers building a system show **Building** and cannot be placed until it is finished.{burnRest}\n\n{restTeam}\n\nPress **Done**.");
r("miles","Step 16 · milestones","Milestones","",
"Milestones are bonus goals in your hand, such as \"have 3 Seniors\". When one is met it shows **MET** and its **Cash in** button turns on. Cash in to take the gold. A greyed button means it is not met yet.\n\nEach milestone also has a **phase window**: it can only be completed while those phases are running, and a card whose window has passed is swapped for a new one at the next phase start. Click a milestone to read it and cash it in. Press **Done** when finished.");
r("upkeep","Step 21 \u00b7 upkeep","Upkeep","Next",
"**Upkeep** ran automatically: Hype faded, Culture moved toward 0, resting workers recovered, and Over-Tired workers risked quitting. Round 2 then started with a new **{income}G** Income and salaries. The Game Log shows what you paid.{burnUpkeep}");
r("burn_stats","Variant D · Burnout (numbers step)","Burnout: what it is","",
"\n\n**Burnout** (the battery icon) shows how worn out your team is, from 0 to {burnMax}. Overwork and unpaid salaries raise it. Calm rounds and Team Events lower it. Your studio card shows the number and its band.");
r("burn_rest","Variant D · Burnout (rest step)","Burnout: how it moves","",
"\n\n**Burnout** goes up at upkeep: +1 for every {burnOverStep} Over-Tired workers you placed this round (up to +{burnOverMax}), and +1 if your salaries were short by {burnUnpaidMin}G or more. A calm round lowers it by {burnRelief}, and a Team Event by {burnTeamRelief}.\n\nBands: **Energized** (Burnout 0 and Culture {energizedCulture}+) pays +{energizedGold}G each round. **Strained** ({burnStrainAt}+) loses {burnStrainHype} extra Hype at upkeep. **Burned out** ({burnBenchAt}+) benches your most tired worker each round. **Meltdown** ({burnQuitAt}) makes a worker quit and drops Burnout to {burnQuitReset}. High Burnout also costs VP at the end.");
r("burn_upkeep","Variant D · Burnout (upkeep step)","Burnout: upkeep","",
"\n\nBurnout was updated too. Check the number and band in your studio card.");
r("gates","Step 22 \u00b7 publisher gates","Publisher Gates","Next",
"The **Publisher Gates** panel is your deadline list. At the end of each phase the publisher reviews every studio: **pass** and you get funding, **miss** and you lose VP.\n\n**{gateName}** is due end of round {gateEnd}: {gateReqs}. Pass for +{gateFund}G, miss for −{gatePenalty} VP. The next one, **{gate2Name}**, is stricter. Requirements turn green as you meet them.");
r("r2hire","Step 23 \u00b7 round 2","Round 2: you drive","Let's play round 2",
"From here you choose for yourself. This round you will **recruit** a worker from the shared pool, **place** your team and leave someone out to rest, and **crunch** a build. The coach checks each one.\n\nFirst, **Hire**: you may hire another card from your hand (Junior {jrCost}G), or keep your gold. Press **Done** when ready.");
r("r2recruit","Step 24 \u00b7 recruit (round 2)","Recruit from the shared pool","",
"The **Recruitment** panel above the board is a **shared pool** with one worker from each of **{recruitN}** categories. It re-rolls every round. **Recruit** one for **{recruitCost}G**: you get a Junior at once, with no card needed, and you can place them this round. One recruit per round, and a rival can take the one you want.\n\nPress **Recruit** under a worker you like, then keep placing.");
r("r2place","Step 25 \u00b7 place (round 2)","Place your team","",
"Place your workers. **A worker you leave unplaced rests**, and in Production a Junior who has worked and then rested can be promoted, so leave at least one out.\n\nPress **Pass** when you are finished.");
r("r2crunch","Step 26 \u00b7 crunch (round 2)","Crunch: finish a build sooner","",
"A system keeps its crew busy for 1 to 3 rounds. **Crunch** takes one round off, so the crew is freed sooner. It costs **{crunchGold}G**, or makes one worker more tired. In the market, set **Build speed** to Crunch before you build.{freeBuild}\n\nBuild a system with Crunch, close the market with **×**, then press **Done**.");
r("r3","Step 27 \u00b7 rounds 2 and 3","Rounds 2 and 3: keep building","",
"Concept ends after round 3, and **Production** rewards Progress and Hype, so spend your bank on systems now.\n\n{hint}");
r("gateresult","Step 28 \u00b7 gate result","Concept gate result","Next",
"The first gate, **{gateName}**, was checked when Concept ended. {gateResult}");
r("gate_pass","Step 17 · gate result (passed)","","","You **passed** and received **{gateFund}G**.");
r("gate_miss","Step 18 · gate result (missed)","","","You **missed** it and lost **{gatePenalty} VP**.");
r("crisis","Step 29 \u00b7 crisis (round 4)","Production begins: a Crisis","Got it",
"Round 4 starts a new phase, and every phase after the first opens with a **Crisis card**, an event that hits every studio{crisisLine}.\n\nProduction brings more score spots, Buzz earn spots, bigger crews and **Seniors**.");
r("r4play","Step 30 \u00b7 bid, draft, hire, place (round 4)","Round 4: play your round","",
"Bid and draft work as before: every bid is paid, so pick the disciplines you need. Then hire Juniors, place, and leave someone out to rest so you can promote them.\n\n{hint}");
r("promote","Step 31 \u00b7 promote","Promote a Junior to Senior","",
"A Junior who has **worked** and is now **resting** can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr} and is the only worker who can **trigger your systems**.\n\nClick one of your workers in the Rest panel and press **Promote**. Choose one whose role matches a system you built, so it can trigger it next round.");
r("rest_nontrain","Rest · team management (without training)","Rest: team management","",
"This step is also where you **promote** and **release** workers. Nothing is ready yet: Seniors unlock in Production.");
r("rest_train","Rest · team management (with training)","Rest: team management","",
"This step is also where you **train** Juniors. Training costs **{trainCost}G**, gives **+{trainCulture} Culture**, and the worker **sits out the next round**. A Junior who has trained **{trainNeeded} times** can be promoted to Senior for free (Seniors unlock in Production). You will try it later.");
r("promote_train","Step 31 \u00b7 train and promote","Train a Junior, then promote","",
"Seniors are made by **training**. A Junior who **trains {trainNeeded} times** can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr} and is the only worker who can **trigger your systems**.\n\nTraining costs **{trainCost}G**, gives **+{trainCulture} Culture**, and the worker **sits out next round**. For this lesson one of your Juniors has already trained once.\n\nClick that Junior in the Rest panel, press **Train**, then press **Promote**. Choose one whose role matches a system you built, so it can trigger it next round.");
r("trigger","Step 32 \u00b7 trigger a system","A Senior triggers a system","",
"By round 5 your system should be finished and your Senior ready. A finished system leaves the Building list and joins your studio. When it is your turn to place, select your Senior, click the **system tile** in your systems panel below the board, and confirm: the system pays its bonus instead of the Senior using a board spot. Each system triggers once per round.\n\nHire or recruit first if you like.");
r("prod","Step 33 \u00b7 production","Production: balance your studio","",
"Play freely through Production (rounds 4 to 8): spend skills on systems, take score spots for Progress and Hype, and keep Debt and Culture healthy.\n\n{hint}");
r("polish","Step 34 \u00b7 polish","Polish begins","Got it",
"**Polish** runs rounds 9 to 11. Check the gate panel: the Beta Review is due at the end of round 11. Stronger systems commit their crew for longer (one round less with Crunch), and **builds stop in the last rounds** because they could not finish in time.");
r("polishfree","Step 19 · polish, free play","Polish","",
"{hint}");
r("convert","Step 36 \u00b7 launch and convert","Launch: convert your leftovers","",
"**Round 12 is Launch.** Nothing carries over, so spend your skills and Gold now. Place a worker on the **Convert** spot: it turns **{convertRate} skills of that worker's role** into **1 Progress or 1 Hype**. Leftover skills are otherwise worth nothing.\n\nSelect a worker, click Convert, choose Progress or Hype, and confirm. You can place other workers too.");
r("handover","Step 37 \u00b7 hand-over","That is every lesson","Finish the game",
"You have seen every part of the game: the round steps, the phases, recruiting, promoting, systems, crunch and Convert. The tips stop here.\n\nFinish round 12 on your own. The results screen explains where every VP came from.");
// Free-play hints (shown by the free steps through the {hint} token)
r("hint_hire","Hint · hire step","","","**Hire.** Recruit from your hand (Junior {jrCost}G). Cards you skip stay in your hand. The Talent spots on the board make hiring cheaper. Press **Done** when finished.");
r("hint_place","Hint · place step","","","**Place.** Select a worker, then a green spot. Leave a Tired worker unplaced so they rest and recover. Recruit from the shared pool if you like. **Pass** when finished.");
r("hint_build","Hint · build step","","","**Build.** Spend your skills on a system, then press **Done**. The **Systems to Build** panel under the board shows 2 per type; greyed ones cannot be built yet. Replace costs {refreshGold}G.");
r("hint_rest","Hint · rest step","","","**Rest.** Promote a Junior who worked and rested, or release a worker. Press **Done**.");
r("hint_miles","Hint · milestones step","","","**Milestones.** Cash in anything that is met, then press **Done**.");
r("hint_wait","Hint · other steps","","","Resolving…");
r("free_bid","Hint · free-play bid","","","Same blind bid as before. Remember that every bid is paid.");
r("free_draft","Hint · free-play draft","","","Draft again. Pick the disciplines your studio needs.");
// Messages shown when an off-script action is blocked
const m = (id, text) => r(id, "Blocked-action message", "", "", text);
m("msg_next","Press Next first"); m("msg_start","Press “Let's go” to begin"); m("msg_obj","Choose your objectives first");
m("msg_bid","Place your bid first"); m("msg_bid_small","Keep it small for now: bid 0 to 3G"); m("msg_draft","Pick a card from the draft");
m("msg_hire_sr","Seniors are promoted, not hired"); m("msg_hire_min","Hire at least 2 workers so you have something to place"); m("msg_hire_do","Hire from your hand, then press Done");
m("msg_place","Place a worker on a green spot"); m("msg_place_first","Place at least one worker first"); m("msg_place_pass","Keep placing, or press Pass");
m("msg_build_first","Try building one system first"); m("msg_build","Build a system, then press Done"); m("msg_rest","Press Done to continue"); m("msg_miles","Cash in a met milestone, or press Done");
m("msg_recruit","Recruit one worker from the shared pool first"); m("msg_crunch","Start this build with Crunch"); m("msg_promote","Promote a Junior who has worked and rested");
m("msg_promote_train","Train a Junior, then promote them"); m("msg_train_later","Training comes later: you will train a Junior and promote them in Production"); m("msg_promote_fit","Promote a worker whose role matches one of your systems"); m("msg_trigger","Place your Senior on the system tile"); m("msg_convert","Place a worker on the Convert spot"); m("msg_headhunt","Headhunting is an advanced rule for later");
// Interface labels
const u = (id, text) => r(id, "Coach label", "", "", text);
u("ui_back","← Back"); u("ui_fwd","Next"); u("ui_fwd_end","Back to the game"); u("ui_next","Next"); u("ui_stop","Stop coaching");
u("ui_wait","Rival is taking their turn…"); u("ui_step","Step {n} of {total}"); u("ui_review","review");
// Score explainer (shown on the results screen after a tutorial game)
r("explain_note","Results explainer · closing note","","","This is how your score was made, row by row. Start a real game to play for a higher one.");
r("explain_prodShare","Results explainer · row","Progress race","","VP for where your Progress ranks against the other studios: 1st place pays most, ties split the points.");
r("explain_hypeStrength","Results explainer · row","Hype race","","Where your Hype ranks. At the end of the game your Marketing is added to your Hype, so Marketing is permanent buzz while Hype itself fades every round.");
r("explain_debtPenalty","Results explainer · row","Tech Debt","","The studio with the most Debt loses the most VP; the studio with the least loses none. Debt comes from rushed spots and some systems; Quality workers, Engineers and Stability systems clear it.");
r("explain_culture","Results explainer · row","Culture","","The studio with the lowest Culture loses the most VP; the best loses none. Good culture also helps workers stay.");
r("explain_objectives","Results explainer · row","Objectives","","Your secret goals. VP only for the ones you completed.");
r("explain_synergy","Results explainer · row","Synergy","","Bonus when a built system's main skill matches the skill icon of a completed objective.");
r("explain_systems","Results explainer · row","Systems","","The printed VP on each system you built.");
r("explain_gold","Results explainer · row","Gold","","Leftover gold converts to VP at a fixed rate.");
r("explain_crisis","Results explainer · row","Crisis & Gates","","VP gained or lost from Crisis cards and Publisher Gates (passed gates can pay VP, missed ones cost VP).");
module.exports = R;
if (require.main === module) {
  const fs = require("fs"); let t = fs.readFileSync(require("path").join(__dirname, "..", "game", "data.js"), "utf8");
  const body = "D.tutorial = [\n" + R.map(x => "  " + JSON.stringify(x)).join(",\n") + "\n];\n\n";
  t = t.replace(/D\.tutorial = \[\n[\s\S]*?\n\];\n\n/, "");
  t = t.replace("D.gate = {", body + "D.gate = {");
  fs.writeFileSync(require("path").join(__dirname, "..", "game", "data.js"), t); console.log("rows", R.length);
}
