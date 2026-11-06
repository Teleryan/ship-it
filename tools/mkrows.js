// Authoring source for D.tutorial (guided-game strings). Output is spliced into data.js by `node tools/mkrows.js`.
// Markup: **bold**, blank line = paragraph break, {token} = live value.
const R = [];
const r = (id, when, title, btn, text) => R.push({ id, when, title, btn, text });
r("welcome","Step 1 · opening card","Welcome to Ship It!","Let's go",
"You run a game studio competing against a Rival to ship the best game. Over 12 rounds you will build a team, put your workers to work on the board, and build systems that score **Victory Points (VP)**. The studio with the most VP wins.\n\nThe game has four phases. **Concept** (rounds 1 to 3) is where you build up a bank of skills. **Production** (rounds 4 to 8) and **Polish** (rounds 9 to 11) ask you to balance skills against Progress and Hype. **Launch** (round 12) is the final push.\n\nThis guided game teaches you one phase at a time. Once every lesson has been shown, the tips disappear and you finish on your own. Select **Stop coaching** to turn the tips off at any time, or **×** to leave.");
r("win_vp","Step 2 · how you win","How you win","Next",
"The goal is simple: **finish round 12 with the most Victory Points (VP).**\n\nVP come from five sources, and this guide explains each one:\n\n**1. The Progress and Hype races**: the biggest prizes.\n**2. Systems**: permanent engines that carry printed VP.\n**3. Objectives**: your secret goals.\n**4. Publisher gates**: reviews that pay you for hitting a target.\n**5. Leftover Gold**: every {goldPerVP} Gold is worth 1 VP.\n\nSome things also take VP away, so winning means staying healthy as well as racing.");
r("win_races","Step 3 · how you win · the races","The Progress and Hype races","Next",
"**Progress** and **Hype** are races. At the end of the game, every studio is ranked on each track and paid VP by rank. With **{nPlayers} players**, 1st place earns **{raceFirst} VP** in each race and last place earns **{raceLast}**. Ties share the points.\n\n**Progress** measures how finished your game is, and you earn it by building on the board. **Hype** measures how much the world wants your game, and you earn it by promoting. At the end of the game, your Marketing (a score that never fades) is added to your Hype. Hype fades by **{hypeDecay}** every round, so it is worth banking (explained later).\n\nThe Race tracks panel shows where every studio stands. The marker shows the next publisher gate target.");
r("win_build","Step 4 · how you win · systems and gold","Systems and objectives","Next",
"**Systems** are permanent engines that your studio builds. Every finished system scores its printed VP and can be triggered for extra effects later in the game.\n\n**Objectives** are secret cards. They pay VP only if you complete them. A finished system whose main skill matches a completed objective earns bonus VP called **Synergy**.");
r("win_lose","Step 5 · how you win · what costs VP","What costs you VP","Next",
"Three things take VP away:\n\n**Tech Debt**: the studio with the most Debt loses the most VP.\n{burnLine}\n\n**Missed gates**: each publisher gate you miss costs VP. Gates are explained after round 1.\n\nThe winner is not just the fastest studio. It is the one that stays healthy while it races.");
r("hype_bank","Production start · banking Hype","Banking Hype","Got it",
"At the end of every phase, each studio **banks up to {hypeBank} Hype as Marketing**. Unlike Hype, Marketing never fades.\n\nSo Hype you build early is not wasted: bank it before the phase ends and it stays with you.");
r("loop","Step 6 · structure","How the game is structured","Next",
"The bar at the top shows where you are in the game.\n\nEach of the 4 **phases** begins with a **Phase start**: a **Crisis** event, then a **Reveal** of the new board.\n\nEach of the 12 **rounds** has the same steps:\n**Upkeep**: tired workers recover and Hype fades (skipped in round 1).\n**Income**: every studio is paid Gold.\n**Order**: decides who acts first.\n**Place**: take turns placing workers on the board. Instead of placing, you can **Recruit** a new worker.\n**Manage**: build systems, train or promote workers, and cash in Milestones.\n\nWe will explain each step the first time it comes up.");
r("objectives","Step 7 · pick objectives","Secret objectives","",
"First, choose your goals. **Objectives** are secret cards that pay VP at the end of the game, but only if you complete them.\n\nEach row offers 2 cards. Read what each card requires, choose one card per row, then press **Confirm objectives**. Each card shows a skill icon: a finished system whose main skill matches a completed objective earns bonus VP.");
r("boardintro","Step 9 · the board","The Board","Next",
"The **main board** is where you send your workers. Each row has a different job, and we will go through them one at a time.");
r("board_backlog","Step 9 · the board · Backlog","Backlog","Next",
"**Backlog** spots earn skills. Each skill has an icon and belongs to one discipline:\n\n**Light bulb** = Ideas (Creative)\n**Brackets** = Code (Development)\n**Gear** = Process (Operations)\n**Megaphone** = Buzz (Marketing)\n\nA Junior earns **+1** of the spot's skill, and a Senior earns **+2**.\n\nYou spend skills later to build systems. Workers can then be placed on those systems for stronger effects.");
r("board_prototype","Step 9 · the board · Prototype and Quality","Prototype and Quality","Next",
"**Prototype** spots generate **Progress**, which measures how finished your game is.\n\n**Quality** spots fix **Tech Debt**, the mess left behind by rushed (crunched) work.");
r("board_pitch","Step 9 · the board · Pitch Deck","Pitch Deck","Next",
"**Pitch Deck** spots generate **Hype**, which measures how much the world wants your game.");
r("board_jam","Step 9 · the board · Game Jam","Game Jam","Next",
"**Game Jam** needs a strike team: 2 or 3 workers from different disciplines working together. It earns skills or generates Progress.\n\nA worker who earns skills is not scoring, so every placement is a trade-off.");
r("board_perks","Step 9 · the board · Studio Perks","Studio Perks","Next",
"**Studio Perks** are special actions. **Each perk takes only one worker per round**, so whoever places first gets it. This is why turn order matters.\n\n**Talent**: recruit one extra worker from the pool, for 1G less.\n**Outsource**: a worker earns Gold.\n**Team Event**: send 2 workers with different roles and pay 3G {teamEventEffect}.");
r("place1","Step 10 · first worker (nothing selected)","Place your first worker","",
"Step 1: **click one of your workers** in the Studio Workers panel above the board to select it. You can press the **i** button on a worker card at any time to read about that worker.");
r("place1b","Step 11 · first worker (worker selected)","Place your first worker","",
"Step 2: green spots can take this worker. Greyed spots cannot be used (hover over one to see why). **Click a green spot**, then confirm.");
r("place1c","Step 12 · first worker (spot popup open)","Place your first worker","",
"Read the spot's description, then press **Place worker here** to confirm. The default choices are fine.");
r("place1d","Step 13 · first worker (worker popup open)","Place your first worker","",
"Press **Select this worker**. The spots this worker can use will turn green.");
r("place1w","Step 14 · first worker (Rival's turn)","Place your first worker","",
"The Rival is placing a worker. You are next, so use the time to look over the board.");
r("stats","Step 16 · numbers","What your numbers mean","Next",
"The spot paid out right away. Here is what each number is for:\n\n**Gold** pays for recruiting, building systems and crunch.\n**Ideas, Code, Process and Buzz** (the four skill icons) come from Backlog spots. You spend them on systems that need that discipline, and they carry over between rounds.\n**Progress** and **Hype** come from scoring spots and decide the race scoring. The **Race tracks** panel shows where each studio stands.\n**Debt** is Tech Debt: the more you have, the more VP you lose. {burnStats}");
r("place2","Step 15 · keep placing","Keep placing, or pass","",
"Each worker can work **once per round**. Place more workers if you want more skills or points.\n\nYou do not have to place everyone. **A worker you leave unplaced rests** and recovers from tiredness. When you are finished, press **Pass**. Passing ends your turns for this round.");
r("build_rd","Step 18 · R&D (after the build)","R&D: build faster","Next",
"Systems take several rounds to build, and the workers committed to one are busy until it is finished.\n\n**R&D** speeds this up. Send two workers from different disciplines (Creative + Development, or Operations + Marketing) and **system development is 1 round shorter** for whatever you start building that round. You also skip the Gold fee for crunch.\n\nUse R&D in a round when you are about to start a big system.");
r("upkeep","Step 21 · upkeep","Upkeep","Next",
"**Upkeep** ran automatically: Hype faded, resting workers recovered, and Over-Tired workers risked quitting. Income and salaries then followed. The Game Log shows what you paid.{burnUpkeep}\n\nFrom now on, every round begins with Upkeep.");
r("burn_stats","Variant D · Burnout (numbers step)","Burnout: what it is","",
"\n\n**Burnout** (the battery icon) shows how worn out your team is, on a scale from 0 to {burnMax}. Your studio card shows the number and its band.");
r("burn_rest","Variant D · Burnout (rest step)","Burnout: how it moves","",
"\n\n**Burnout** goes up at Upkeep: +1 for every {burnOverPer} you placed this round (up to +{burnOverMax}), and +1 if your salaries were short by {burnUnpaidMin}G or more. A calm round lowers it by {burnRelief}, and a Team Event lowers it by {burnTeamRelief}.\n\nBurnout bands: **Energized** (Burnout 0) pays +{energizedGold}G each round. **Strained** ({burnStrainAt}+) loses {burnStrainHype} extra Hype at Upkeep. **Burned out** ({burnBenchAt}+) benches your most tired worker each round. **Meltdown** ({burnQuitAt}) makes a worker quit and resets Burnout to {burnQuitReset}.{foldNote}");
r("burn_upkeep","Variant D · Burnout (upkeep step)","Burnout: upkeep","",
"\n\nBurnout was updated too. Check the number and band on your studio card.");
r("gates","Step 22 · publisher gates","Publisher Gates","Next",
"The **Publisher Gates** panel is your list of deadlines. At the end of each phase, the publisher reviews every studio: if you **pass**, you receive funding, and if you **miss**, you lose VP.\n\n**{gateName}** is due at the end of round {gateEnd}: {gateReqs}. Pass it for +{gateFund}G, or miss it and lose {gatePenalty} VP. The next gate, **{gate2Name}**, is stricter. Each requirement turns green when you meet it.");
r("r2place","Step 25 · place (round 2)","Place your team","",
"Place your workers, and leave at least one unplaced so they can rest (a rested worker can be promoted later).\n\nPress **Pass** when you are finished.");
r("r2crunch","Step 26 · crunch (round 2)","Crunch: finish a build sooner","",
"A system keeps its team busy for 1 to 3 rounds. **Crunch** takes one round off, so the team is freed sooner. It costs **{crunchGold}G**, or it makes one worker more tired. In the Systems to Build window, set **Build speed** to Crunch before you build.{freeBuild}\n\nBuild a system with Crunch (the window closes by itself), then press **Done**.");
r("r3","Step 27 · rounds 2 and 3","Rounds 2 and 3: keep building","",
"Concept ends after round 3, and **Production** rewards Progress and Hype, so spend your skill bank on systems now.\n\n{hint}");
r("gateresult","Step 28 · gate result","Concept gate result","Next",
"The first gate, **{gateName}**, was checked when Concept ended. {gateResult}");
r("gate_pass","Step 17 · gate result (passed)","","",
"You **passed** and received **{gateFund}G**.");
r("gate_miss","Step 18 · gate result (missed)","","",
"You **missed** it and lost **{gatePenalty} VP**.");
r("crisis","Step 29 · crisis (round 4)","Production begins: a Crisis","Got it",
"Round 4 starts a new phase. Every phase after the first begins with a **Crisis card**: an event that affects every studio{crisisLine}.\n\nProduction brings more scoring spots, more Buzz spots, bigger teams and **Seniors** (experienced workers).");
r("promote","Step 31 · promote","Promote a Junior to Senior","",
"A Junior who has **worked** and is now **resting** can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr}, and is the only kind of worker who can **trigger your systems**.\n\nClick one of your workers in the Rest panel and press **Promote**. Choose one whose role matches a system you built, so it can trigger that system next round.");
r("rest_train","Rest · team management (with training)","Rest: team management","",
"This step is also where you **train** Juniors. Training costs **{trainCost}G**, {trainEffect}, and the worker **{trainAway}**. A Junior who has trained **{trainTimes}** can be promoted to Senior for free (Seniors unlock in Production).{promoRest} You will try this later.");
r("promote_train","Step 31 · train and promote","Train a Junior, then promote","",
"Seniors are made by **training**. A Junior who has **trained {trainTimes}** can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr}, and is the only kind of worker who can **trigger your systems**.\n\nTraining costs **{trainCost}G**, {trainEffect}, and the worker **{trainAway}**.{promoLesson}{promoRest}\n\nClick that Junior in the Rest panel, press **Train**, then press **Promote**. Choose a Junior whose role matches a system you built, so they can trigger it next round.");
r("trigger","Step 32 · trigger a system","A Senior triggers a system","",
"By round 5, your system should be finished and your Senior ready. A finished system leaves the Building list and joins your studio. On your turn to place, select your Senior, click the **system tile** in your systems panel below the board, and confirm. The system pays its bonus instead of the Senior using a board spot. Each system can be triggered once per round.\n\nYou can Recruit first if you like.");
r("prod","Step 33 · production","Production: balance your studio","",
"Play freely through Production (rounds 4 to 8): spend skills on systems, take scoring spots for Progress and Hype, and keep Debt and Burnout under control.\n\n{hint}");
r("polish","Step 34 · polish","Polish begins","Got it",
"**Polish** covers rounds 9 to 11. Check the Publisher Gates panel: the Beta Review is due at the end of round 11. Stronger systems keep their team busy for longer (one round less with Crunch), and **builds stop in the last rounds** because they could not finish in time.");
r("polishfree","Step 19 · polish, free play","Polish","",
"{hint}");
r("convert","Step 36 · launch and convert","Launch: convert your leftovers","",
"**Round 12 is Launch.** Nothing carries over, so spend your skills and Gold now. Place a worker on the **Convert** spot: it turns **{convertRate} skills of that worker's role** into **1 Progress or 1 Hype**. Leftover skills are otherwise worth nothing.\n\nSelect a worker, click Convert, choose Progress or Hype, and confirm. You can place other workers too.");
r("handover","Step 37 · hand-over","That is every lesson","Finish the game",
"You have now seen every part of the game: the round steps, the phases, recruiting, promoting, systems, crunch and Convert. The tips stop here.\n\nFinish round 12 on your own. The results screen explains where every VP came from.");
r("hint_place","Hint · place step","","",
"**Place.** Select a worker, then a green spot. Leave Tired workers unplaced to rest. You can Recruit from the shared pool if you like. Press **Pass** when you are finished.");
r("hint_build","Hint · build step","","",
"**Build.** Spend your skills on a system, then press **Done**. The **Systems to Build** panel under the board shows 2 cards per type; greyed cards cannot be built yet. Replacing the cards costs {refreshGold}G.");
r("hint_wait","Hint · other steps","","",
"Resolving…");
r("msg_next","Blocked-action message","","",
"Press Next first");
r("msg_start","Blocked-action message","","",
"Press “Let's go” to begin");
r("msg_obj","Blocked-action message","","",
"Choose your objectives first");
r("msg_place","Blocked-action message","","",
"Place a worker on a green spot");
r("msg_place_first","Blocked-action message","","",
"Place at least one worker first");
r("msg_place_pass","Blocked-action message","","",
"Keep placing, or press Pass");
r("msg_build_first","Blocked-action message","","",
"Try building one system first");
r("msg_build","Blocked-action message","","",
"Build a system, then press Done");
r("msg_rest","Blocked-action message","","",
"Press Done to continue");
r("msg_recruit","Blocked-action message","","",
"Recruit one worker from the shared pool first");
r("msg_crunch","Blocked-action message","","",
"Start this build with Crunch");
r("msg_promote","Blocked-action message","","",
"Promote a Junior who has worked and rested");
r("msg_promote_train","Blocked-action message","","",
"Train a Junior, then promote them");
r("msg_train_later","Blocked-action message","","",
"Training comes later: you will train and promote a Junior in Production");
r("msg_promote_fit","Blocked-action message","","",
"Promote a worker whose role matches one of your systems");
r("msg_trigger","Blocked-action message","","",
"Place your Senior on the system tile");
r("msg_convert","Blocked-action message","","",
"Place a worker on the Convert spot");
r("msg_headhunt","Blocked-action message","","",
"Headhunting is an advanced rule for later");
r("ui_back","Coach label","","",
"← Back");
r("ui_fwd","Coach label","","",
"Next");
r("ui_fwd_end","Coach label","","",
"Back to the game");
r("ui_next","Coach label","","",
"Next");
r("ui_stop","Coach label","","",
"Stop coaching");
r("ui_wait","Coach label","","",
"Rival is taking their turn…");
r("ui_step","Coach label","","",
"Step {n} of {total}");
r("ui_review","Coach label","","",
"review");
r("explain_note","Results explainer · closing note","","",
"This is how your score was made, row by row. Start a real game to play for a higher one.");
r("explain_prodShare","Results explainer · row","Progress race","",
"VP for where your Progress ranks against the other studios: 1st place pays most, ties split the points.");
r("explain_hypeStrength","Results explainer · row","Hype race","",
"Where your Hype ranks against the other studios. Your Marketing is added to your Hype at the end of the game: Marketing is permanent, while Hype fades every round.");
r("explain_debtPenalty","Results explainer · row","Tech Debt","",
"The studio with the most Debt loses the most VP, and the studio with the least loses none. Debt comes from crunched spots and some systems. Quality workers, Engineers and Stability systems clear it.");
r("explain_culture","Results explainer · row","Culture","",
"The studio with the lowest Culture loses the most VP; the best loses none. Good culture also helps workers stay.");
r("explain_objectives","Results explainer · row","Objectives","",
"Your secret goals. VP only for the ones you completed.");
r("explain_synergy","Results explainer · row","Synergy","",
"Bonus when a built system's main skill matches the skill icon of a completed objective.");
r("explain_systems","Results explainer · row","Systems","",
"The printed VP on each system you built.");
r("explain_gold","Results explainer · row","Gold","",
"Leftover Gold converts to VP at a fixed rate.");
r("explain_crisis","Results explainer · row","Crisis & Gates","",
"VP gained or lost from Crisis cards and Publisher Gates (passed gates can pay VP, missed ones cost VP).");
r("phasestart","Step 8 · reveal and order","Phase start: Reveal","Next",
"Each phase begins with a **Crisis** and a **Reveal**. The Crisis is an event card that affects every studio; it first appears in Production. The Reveal shows the board for the new phase.\n\nThere is no drafting and no bidding. At the start of every round, the **Order** step decides who acts first: **the studio with the fewest VP goes first**, so a leader cannot claim the best tiles every round. Round 1 uses a fixed order.\n\nEvery studio starts with **{startWorkers} Juniors** (new, basic workers). You get more workers by using **Recruit**, which opens in round 2.");
r("placeintro","Step 14 · income and place","Income, salaries and Place","Next",
"Round 1 began with **Income**: every studio received **{income}G**. Each round, every worker is also paid a **salary** ({salaryJr}G per Junior and {salarySr}G per Senior).\n\nNow you use the board. Players take turns placing **one worker at a time** on a tile that accepts them, going around until everyone has passed.\n\nMost tiles hold **only one worker**, so going early matters. That is what turn order is worth. Hover over a greyed tile to see why you cannot use it.");
r("ws1","Step 17 · workstations","Workstations: your desks","Next",
"Your workers need a desk to work at. Each round you get **{wsFree} workstations**; the counter is in your studio panel.\n\nTaking **any board tile** uses **one workstation**, including Studio Perks. Triggering one of your **own systems** does not.\n\nIf you run out, you can **buy another for {wsCost}G**, up to **{wsMax}** in total. Workstations are free again next round, so the limit is how many tiles you can take in a single round, not a lasting cost. With your small starting team, you will not reach the limit yet.");
r("build","Step 20 · manage: build","Manage: build a system","",
"The **Place** step is over, so the **Manage** step begins. This is a single turn in which you do everything else: **Build** systems, **Train or Promote** workers, and **cash in Milestones**.\n\nYou have **{bank} skills** banked. Press **Open Systems to Build**. Each card shows its cost in skills and Gold, and which workers it needs. You can start **{buildsPerRound}** per round.\n\nA **system** is a permanent engine that scores VP at the end. Building one **commits one worker for each role it needs**, and those workers cannot be placed until it is finished (1 to 3 rounds).{freeBuild}\n\nBuild one now (the window closes by itself), then continue.");
r("rest1","Step 21 · manage: rest","Manage: tired workers and milestones","",
"Every worker who worked this round is now **Tired**. A Tired worker who works again becomes **Over-Tired**: they earn no skill and may quit. A worker who sits out a round **rests and recovers**, so leaving someone unplaced keeps your team healthy.{burnRest}\n\nYour **Milestones** are at the top. They are bonus goals, such as \"have 3 Seniors\". When you meet one, it shows **MET**: press **Cash in** to take the Gold. A milestone can only be completed during its phase.\n\n{restTeam}\n\nPress **Done** to end your Manage turn.");
r("r2recruit","Step 23 · round 2","Round 2: recruit and place","Let's play round 2",
"From here you choose for yourself. This round you will **recruit** a worker, **place** your team (leaving someone out to rest), and **crunch** a build. The coach checks each task.\n\nThe **Recruitment** panel is a shared pool of **{recruitN}** workers. **Recruit** one for **{recruitCost}G**, plus {recruitLadder}G for each worker another studio has already taken this round. You get a Junior immediately. Press **Recruit** under a worker you like.");
r("r4play","Step 30 · place and manage (round 4)","Round 4: play your round","",
"Recruit if the pool has someone you need, place your workers, and leave someone out to rest so you can promote them.\n\n{hint}");
r("hint_manage","Hint · manage step","","",
"**Manage.** Build a system, train or promote a Junior, and cash in any Milestone you have met. Then press **Done**.");

module.exports = R;
if (require.main === module) {
  const fs = require("fs"); let t = fs.readFileSync(require("path").join(__dirname, "..", "game", "data.js"), "utf8");
  const body = "D.tutorial = [\n" + R.map(x => "  " + JSON.stringify(x)).join(",\n") + "\n];\n\n";
  t = t.replace(/D\.tutorial = \[\n[\s\S]*?\n\];\n\n/, "");
  t = t.replace("D.gate = {", body + "D.gate = {");
  fs.writeFileSync(require("path").join(__dirname, "..", "game", "data.js"), t); console.log("rows", R.length);
}
