// Authoring source for D.tutorial (guided-game strings). Output is spliced into data.js by `node tools/mkrows.js`.
// Markup: **bold**, blank line = paragraph break, {token} = live value.
const R = [];
const r = (id, when, title, btn, text) => R.push({ id, when, title, btn, text });
r("welcome","Step 1 · opening card","Welcome to Ship It!","Let's go",
"You run a game studio competing against a Rival to ship the best game. Over 12 rounds you will build a team, put your workers to work on the board, and build systems that score **Victory Points (VP)**. The studio with the most VP wins.\n\nThe game has four phases. **Concept** runs from rounds 1 to 3, **Production** from rounds 4 to 8, and **Polish** from rounds 9 to 11. **Launch**, round 12, is the final push. Throughout, you build your team and their skills while balancing game progress, hype, team culture and tech debt.\n\nThis guided game introduces each idea as it comes up. When the lessons are done, the tips disappear and you finish on your own. Select **Stop coaching** to turn the tips off, or **×** to leave.");
r("win_vp","Step 2 · how you win","How you win","Next",
"**Finish round 12 with the most Victory Points (VP).**\n\nVP come from five sources: the **Progress and Hype races**, the **systems** you build, your secret **objectives**, **publisher gates**, and **leftover Gold** (every {goldPerVP} Gold is worth 1 VP).\n\nEach one is explained when it first comes up in play.");
r("races","Production start · the races","The Progress and Hype races","Next",
"Progress and Hype are races. At the end of the game, every **{raceDen} points** of Progress earns **1 VP**, and every {raceDen} points of Hype earns **1 VP**. There are no rank prizes, so every point you earn counts.\n\n**Progress** measures how finished your game is, and you earn it from Prototype spots. **Hype** measures how much the world wants your game, and you earn it from Pitch Deck spots. The Race tracks panel shows where every studio stands.");
r("hype_bank","Production start · banking Hype","Banking Hype","Got it",
"Hype fades by {hypeDecay} every round. To keep it, each studio **banks up to {hypeBank} Hype as Wishlists** at the end of every phase.\n\nWishlists never fade, and they are added to your Hype at the end of the game. Publisher Gates count Hype only.");
r("objectives","Step 7 · pick objectives","Secret objectives","",
"**Objectives** are secret cards that pay VP at the end of the game, but only if you complete them.\n\nEach row offers 2 cards. Read what each card requires, choose one card per row, then press **Confirm objectives**. Each card shows a skill icon: a finished system whose main skill matches a completed objective earns bonus VP. Each requirement you meet scores {objPer} VP, and meeting every requirement scores {objBonus} more.");
r("boardintro","Step 9 · the board","The Board","Next",
"The **main board** is where you send your workers. We will look at each row in turn.");
r("board_backlog","Step 9 · the board · Backlog","Backlog","Next",
"**Backlog** spots earn skills. Each skill has an icon and belongs to one discipline:\n\n**Light bulb** = Ideas (Creative)\n**Brackets** = Code (Development)\n**Gear** = Process (Operations)\n**Megaphone** = Buzz (Marketing)\n\nA Junior earns **+1** of the spot's skill, and a Senior earns **+2**.\n\nYou spend skills later to build systems.");
r("board_prototype","Step 9 · the board · Prototype and Quality","Prototype and Quality","Next",
"**Prototype** spots generate **Progress**, which measures how finished your game is.\n\n**Quality** spots fix **Tech Debt**, the mess left behind by rushed (crunched) work. The studio with the most Debt at the end of the game loses the most VP.");
r("board_pitch","Step 9 · the board · Pitch Deck","Pitch Deck","Next",
"**Pitch Deck** spots generate **Hype**, which measures how much the world wants your game.");
r("board_jam","Step 9 · the board · Game Jam","Game Jam","Next",
"**Game Jam** needs a strike team: 2 or 3 workers from different disciplines working together. It earns skills or generates Progress.");
r("board_perks","Step 9 · the board · Studio Perks","Studio Perks","Next",
"**Studio Perks** are special actions. **Each perk takes only one worker per round**, so whoever places first gets it.\n\n**Talent**: recruit one extra worker from the pool, for 1G less.\n**Outsource**: a worker earns Gold.\n**Team Event**: send 2 workers with different roles and pay 3G {teamEventEffect}.");
r("income","Step 14 · income and salaries","Income and salaries","Next",
"Round 1 began with **Income**: every studio received **{income}G**.\n\nEach round, every worker is also paid a **salary**: {salaryJr}G per Junior, or {salarySr}G per Senior (a more experienced worker you will meet later).");
r("place1","Step 10 · first worker (nothing selected)","Place your first worker","",
"Step 1: **click one of your workers** in the Studio Workers panel above the board to select it.");
r("place1b","Step 11 · first worker (worker selected)","Place your first worker","",
"Step 2: green spots can take this worker. Greyed spots cannot be used (hover over one to see why). **Click a green spot**, then confirm.");
r("place1c","Step 12 · first worker (spot popup open)","Place your first worker","",
"Read the spot's description, then press **Place worker here** to confirm. The default choices are fine.");
r("place1d","Step 13 · first worker (worker popup open)","Place your first worker","",
"Press **Select this worker**. The spots this worker can use will turn green.");
r("place1w","Step 14 · first worker (Rival's turn)","Place your first worker","",
"The Rival is placing a worker. You are next, so use the time to look over the board.");
r("stats","Step 16 · numbers","Your skills","Next",
"The spot paid out right away. The four icons in your studio panel are your **skills**: Ideas, Code, Process and Buzz. They come from Backlog spots, you spend them on systems that need that discipline, and they carry over between rounds.");
r("place2","Step 15 · keep placing","Keep placing, or pass","",
"Each worker can work **once per round**.\n\nYou do not have to place everyone. **A worker you leave unplaced rests** and recovers from tiredness. If none of your remaining workers fits an open tile, your turn ends and they rest. When you are finished, press **Pass**.");
r("build_rd","Step 18 · R&D (after the build)","R&D: build faster","Next",
"**R&D** speeds up building. Send two workers from different disciplines (Creative + Development, or Operations + Marketing) and **system development is 1 round shorter** for whatever you start building that round. You also skip the Gold fee for crunch.");
r("tired","Step 21 · tired workers","Tired workers","Next",
"Every worker who worked this round is now **Tired**. A Tired worker who works again becomes **Exhausted**: they earn no skill and add Burnout. A worker who sits out a round **rests and recovers**.");
r("burnout","Step 21 · burnout","Burnout: how it moves","Next",
"**Burnout** shows how worn out your team is, from 0 to {burnMax}. It goes up at Upkeep: +1 for every {burnOverPer} you placed this round (up to +{burnOverMax}), and +1 if your salaries were short by {burnUnpaidMin}G or more. A calm round lowers it by {burnRelief}, and a Team Event lowers it by {burnTeamRelief}.\n\nBurnout bands: **Energized** (Burnout 0) pays +{energizedGold}G each round. **Strained** ({burnStrainAt}+) loses {burnStrainHype} extra Hype at Upkeep. **Burned out** ({burnBenchAt}+) benches your most tired worker each round. **Meltdown** ({burnQuitAt}) makes a worker quit.");
r("culture","Step 21 · culture and burnout VP","Culture and Burnout VP","Next",
"**Culture** is the other side of the same track: it equals {cultureBase} minus your Burnout. Team Events, Training and other Culture gains lower Burnout, and Culture losses raise it.\n\nAt the end of the game, high Burnout costs VP ({burnVP}).");
r("upkeep","Step 21 · upkeep","Upkeep","Next",
"**Upkeep** ran automatically: Hype faded and resting workers recovered. It happens at the start of every round after round 1.");
r("gates","Step 22 · publisher gates","Publisher Gates","Next",
"The **Publisher Gates** panel is your list of deadlines. At the end of each phase, the publisher reviews every studio: if you **pass**, you receive funding, and if you **miss**, you lose VP.\n\n**{gateName}** is due at the end of round {gateEnd}: {gateReqs}. Pass it for +{gateFund}G. Each requirement you miss costs 1 VP, so a near miss hurts less than a total miss. Only the last gate also pays VP for passing.");
r("r2place","Step 25 · place (round 2)","Place your team","",
"Place your workers, and leave at least one unplaced so they can rest. Press **Pass** when you are finished.");
r("r2crunch","Step 26 · crunch (round 2)","Crunch: finish a build sooner","",
"A system keeps its team busy for 1 to 3 rounds. **Crunch** takes one round off, so the team is freed sooner. It costs **{crunchGold}G**, or it makes one worker more tired. In the Systems to Build window, set **Build speed** to Crunch before you build.{freeBuild}\n\nBuild a system with Crunch, then press **Done**.");
r("r3","Step 27 · rounds 2 and 3","Rounds 2 and 3: keep building","",
"Concept ends after round 3, and **Production** rewards Progress and Hype, so spend your skill bank on systems now.\n\n{hint}");
r("gateresult","Step 28 · gate result","Concept gate result","Next",
"The first gate, **{gateName}**, was checked when Concept ended. {gateResult}");
r("gate_pass","Step 17 · gate result (passed)","","",
"You **passed** and received **{gateFund}G**.");
r("gate_miss","Step 18 · gate result (missed)","","",
"You **missed** it and lost **1 VP** for each requirement you did not meet.");
r("crisis","Step 29 · crisis (round 4)","Production begins: a Crisis","Got it",
"Round 4 starts a new phase. Every phase after the first begins with a **Crisis card**: an event that affects every studio{crisisLine}.");
r("promote","Step 31 · promote","Promote a Junior to Senior","",
"A Junior who has **worked** and is now **resting** can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr}, and is the only kind of worker who can **trigger your systems**.\n\nClick one of your workers in the Manage panel and press **Promote**. Choose one whose role matches a system you built, so it can trigger that system next round.");
r("promote_train","Step 31 · train and promote","Train a Junior, then promote","",
"Seniors are made by **training**. A Junior who has **trained {trainTimes}** can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr} and can trigger your systems.\n\nTraining costs **{trainCost}G**, {trainEffect}, and the worker **{trainAway}**.{promoLesson}{promoRest}\n\nClick that Junior in the Manage panel, press **Train**, then press **Promote**. Choose a Junior whose role matches a system you built, so they can trigger it next round.");
r("trigger","Step 32 · trigger a system","A Senior triggers a system","",
"By round 5, your system should be finished and your Senior ready. On your turn to place, select your Senior, click the **system tile** in your systems panel below the board, and confirm. The system pays its bonus instead of the Senior using a board spot. Each system can be triggered once per round.");
r("prod","Step 33 · production","Production: balance your studio","",
"Play freely through Production (rounds 4 to 8): spend skills on systems, take scoring spots for Progress and Hype, and keep Debt and Burnout under control.\n\n{hint}");
r("polish","Step 34 · polish","Polish begins","Got it",
"**Polish** covers rounds 9 to 11. The Beta Review gate is due at the end of round 11, so check the Publisher Gates panel. Builds stop in the last rounds, because they could not finish in time.");
r("polishfree","Step 19 · polish, free play","Polish","",
"{hint}");
r("convert","Step 36 · launch and convert","Launch: convert your leftovers","",
"**Round 12 is Launch.** Unspent skills score nothing, so turn them into points. Place a worker on the **Convert** spot: it turns **{convertRate} skills of that worker's role** into **1 Progress or 1 Hype**.\n\nSelect a worker, click Convert, choose Progress or Hype, and confirm.");
r("handover","Step 37 · hand-over","That is every lesson","Finish the game",
"That covers the lessons, and the tips stop here.\n\nFinish round 12 on your own. The results screen shows where every VP came from.");
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
"1 VP for every 3 points of Progress.");
r("explain_hypeStrength","Results explainer · row","Hype race","",
"1 VP for every 3 points of Hype. Your Wishlists are added to your Hype at the end of the game: Wishlists are permanent, while Hype fades every round.");
r("explain_debtPenalty","Results explainer · row","Tech Debt","",
"The studio with the most Debt loses the most VP, and the studio with the least loses none. Debt comes from crunched spots and some systems. Quality workers, Engineers and Stability systems clear it.");
r("explain_culture","Results explainer · row","Culture","",
"The studio with the lowest Culture loses the most VP; the best loses none. Good culture also helps workers stay.");
r("explain_objectives","Results explainer · row","Objectives","",
"Your secret goals: 1 VP for each requirement you met, plus 2 if you met them all.");
r("explain_synergy","Results explainer · row","Synergy","",
"Bonus when a built system's main skill matches the skill icon of a completed objective.");
r("explain_systems","Results explainer · row","Systems","",
"The printed VP on each system you built.");
r("explain_gold","Results explainer · row","Gold","",
"Leftover Gold converts to VP at a fixed rate.");
r("explain_crisis","Results explainer · row","Crisis & Gates","",
"VP gained or lost from Crisis cards and Publisher Gates (passed gates can pay VP, missed ones cost VP).");
r("phasestart","Step 8 · reveal and order","Phase start: Crisis and Reveal","Next",
"Each phase begins with a **Phase start**. It has two parts:\n\n**Crisis**: an event card that affects every studio. The first one appears when Production begins.\n**Reveal**: the board for the new phase is shown.");
r("order","Step 8 · order","Order: who goes first","Next",
"At the start of every round, **Order** decides who acts first: **the studio with the fewest VP goes first**. Round 1 uses a fixed order.");
r("team","Step 8 · your team","Your starting team","Next",
"These are your workers. Every studio starts with **{startWorkers} Juniors**: your basic workers. You can add more later with **Recruit**, which opens in round 2.");
r("placeintro","Step 14 · income and place","Place: taking turns","Next",
"Now you use the board. Players take turns placing **one worker at a time** on a tile that accepts them, going around until everyone has passed.\n\nMost tiles hold **only one worker**, so going early matters. Hover over a greyed tile to see why you cannot use it.");
r("ws1","Step 17 · workstations","Workstations: your desks","Next",
"Your workers need a desk to work at. You start with **{wsFree} workstations**, and they come back to you every round; the counter is in your studio panel.\n\nTaking **any board tile** uses **one workstation**, including Studio Perks. Triggering one of your **own systems** does not.\n\nIf you run out, you can **buy another for {wsCost}G**, up to **{wsMax}** in total. A workstation you buy stays with you for the rest of the phase and comes back to you every round. When a new phase begins, you are back to {wsFree} and must buy extra ones again.");
r("build","Step 20 · manage: build","Manage: build a system","",
"The **Place** step is over, so the **Manage** step begins. In this single turn you **build** systems, **train or promote** workers, and **cash in Milestones**.\n\nYou have **{bank} skills** banked. Press **Open Systems to Build**. Each card shows its cost in skills and Gold, and which workers it needs. You can start **{buildsPerRound}** per round.\n\nA **system** is a permanent engine that scores its printed VP at the end of the game. Building one **commits one worker for each role it needs**, and those workers cannot be placed until it is finished (1 to 3 rounds).{freeBuild}\n\nBuild one now, then continue.");
r("rest1","Step 21 · manage: rest","Manage: milestones and finishing","",
"Your **Milestones** are bonus goals, such as \"have 3 Seniors\". When you meet one, it shows **MET**: press **Cash in** to take the Gold.\n\nPress **Done** to end your Manage turn.");
r("r2recruit","Step 23 · round 2","Round 2: recruit and place","Let's play round 2",
"From here you choose for yourself. This round you will **recruit** a worker, **place** your team (leaving someone out to rest), and **crunch** a build.\n\nThe **Recruitment** panel is a shared pool of **{recruitN}** workers. **Recruit** one for **{recruitCost}G**, plus {recruitLadder}G for each worker another studio has already taken this round. You get a Junior immediately. Press **Recruit** under a worker you like.");
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
