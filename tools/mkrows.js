// Authoring source for D.tutorial (guided-game strings). Output is spliced into data.js by `node tools/mkrows.js`.
// Markup: **bold**, blank line = paragraph break, {token} = live value.
const R = [];
const r = (id, when, title, btn, text) => R.push({ id, when, title, btn, text });
r("win_vp","Step 2 · how you win","How you win","Next",
"**Finish round 12 with the most VP.** VP come from:\n**Progress and Hype**: every {raceDen} points is 1 VP\n**Systems** you build: the VP printed on each card\n**Objectives**: your secret goals\n**Publisher gates**: pass for funding, miss and lose VP\n**Leftover Gold**: every {goldPerVP} Gold is 1 VP\n\nYou lose VP for **Tech Debt** and high **Burnout**. Each idea is explained when it first comes up.");
r("gateresult","Step 28 · gate result","Concept gate result","Next",
"The first gate, **{gateName}**, was checked when Concept ended. {gateResult}");
r("gate_pass","Step 17 · gate result (passed)","","",
"You **passed** and received **{gateFund}G**.");
r("gate_miss","Step 18 · gate result (missed)","","",
"You **missed** it and lost **1 VP** for each requirement you did not meet.");
r("prod","Step 33 · production","Production: balance your studio","",
"Play freely through Production (rounds 4 to 8): spend skills on systems, take scoring tiles for Progress and Hype, and keep Debt and Burnout under control.\n\n{hint}");
r("polish","Step 34 · polish","Polish begins","Got it",
"**Polish** covers rounds 9 to 11. **{gate3Name}** is due at the end of round 11, so check the Publisher Gates panel. A build that could not finish before the game ends is greyed out in the Build window.");
r("polishfree","Step 19 · polish, free play","Polish","",
"{hint}");
r("hint_place","Hint · place step","","",
"**Place.** Select a worker, then a highlighted tile (orange border). Leave Tired workers unplaced to rest. You can Recruit from the shared pool if you like. Press **Pass** when you are finished.");
r("hint_build","Hint · build step","","",
"**Build.** Spend your skills on a system, then press **Done**. The **Systems to Build** panel under the board shows 2 cards per type; greyed cards cannot be built yet.");
r("hint_wait","Hint · other steps","","",
"Resolve any pop-up (a Crisis card or a choice), then play your round.");
r("msg_next","Blocked-action message","","",
"Press Next first");
r("msg_start","Blocked-action message","","",
"Press “Let's go” to begin");
r("msg_obj","Blocked-action message","","",
"Choose your objectives first");
r("msg_place","Blocked-action message","","",
"Place a worker on a highlighted tile");
r("msg_place_first","Blocked-action message","","",
"Place at least one worker first");
r("msg_place_pass","Blocked-action message","","",
"Buy a workstation, keep placing, or press Pass");
r("msg_ws_free","Blocked-action message","","",
"You already have a free workstation. Select a worker, then a highlighted tile.");
r("msg_build_first","Blocked-action message","","",
"Try building one system first");
r("msg_build","Blocked-action message","","",
"Build a system, then press Done");
r("msg_rest","Blocked-action message","","",
"Press Done to continue");
r("msg_recruit","Blocked-action message","","",
"Recruit one worker from the shared pool first");
r("msg_promote","Blocked-action message","","",
"Place a Junior on the Training tile");
r("msg_promote_train","Blocked-action message","","",
"Place a Junior on the Training tile");
r("msg_train_later","Blocked-action message","","",
"Training comes later: you will train a Junior on the Training tile in Production");
r("msg_promote_fit","Blocked-action message","","",
"Promote a worker whose role matches one of your systems");
r("msg_trigger","Blocked-action message","","",
"Select your Senior, then click your system tile");
r("msg_convert","Blocked-action message","","",
"Place a worker on the Convert tile");
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
"Skip guide");
r("ui_wait","Coach label","","",
"Rival is taking their turn…");
r("ui_review","Coach label","","",
"review");
r("explain_note","Results explainer · closing note","","",
"This is how your score was made, row by row. Start a real game to play for a higher one.");
r("explain_prodShare","Results explainer · row","Progress race","",
"1 VP for every {raceDen} points of Progress.");
r("explain_hypeStrength","Results explainer · row","Hype race","",
"1 VP for every {raceDen} points of Hype. Your Wishlists are added to your Hype at the end of the game: Wishlists are permanent, while Hype fades.");
r("explain_debtPenalty","Results explainer · row","Tech Debt","",
"The studio with the most Debt loses the most VP, and the studio with the least loses none. Debt comes from tiles and systems with a red Debt mark. Quality workers, Engineers and Stability systems clear it.");
r("explain_objectives","Results explainer · row","Objectives","",
"Your secret goals: {objPer} VP for each requirement you met, plus {objBonus} if you met them all.");
r("explain_systems","Results explainer · row","Systems","",
"The VP printed on each system card you built.");
r("explain_burnout","Results explainer · row","Burnout","",
"High Burnout at the end of the game costs VP: {burnVP}.");
r("explain_gold","Results explainer · row","Gold","",
"Every {goldPerVP} leftover Gold is 1 VP.");
r("explain_crisis","Results explainer · row","Crisis & Gates","",
"VP gained or lost from Crisis cards and Publisher Gates (passed gates can pay VP, missed ones cost VP).");
r("hint_manage","Hint · manage step","","",
"**Manage.** Build a system and cash in any Milestone you have met. Then press **Done**.");

/* ===== UX pass: restructured guided tutorial (lines starting with ">> " are the "do this now" call to action shown in the coach card's gold box) ===== */
r("welcome","Card 1 · opening","Welcome to Ship It!","Let's go",
"You run a game studio racing a Rival to ship the better game. Over **12 rounds** (four phases: Concept, Production, Polish, Launch) you build a team, send workers to the board, and build systems. **The studio with the most Victory Points (VP) wins.**\n\nThis guide teaches each idea the moment you need it. It saves as you go, so you can leave with **×** and continue later.");
r("objectives","Card 3 · pick objectives","Pick your secret objectives","",
">> Choose **one card per row**, then press **Confirm objectives**.\n\n**Objectives** are secret goals that pay VP at the end. Each requirement you meet scores {objPer} VP, and meeting all of them scores {objBonus} more.");
r("team","Card 4 · your team","Your starting team","Next",
"These are your workers. You start with **{startWorkers} Juniors**, each with a **role** such as Designer or Advertising (the colour is the discipline). More workers come from **Recruit**, which opens in round {recruitMinRound}.");
r("board_backlog","Card 5 · the board","The board: Backlog","Next",
"The **main board** is where your workers act. **Backlog** tiles earn **skills**, which you spend later to build systems:\n**Light bulb** Ideas\n**Brackets** Code\n**Gear** Process\n**Megaphone** Buzz\n\nA worker earns the skill of their own role: **+{resJr}** for a Junior, **+{resSr}** for a Senior. The other rows score Progress and Hype; we meet them in Production.");
r("place1","Round 1 · first worker (nothing selected)","Place your first worker","",
">> Click one of your workers in the **Studio Workers** panel to select it.\n\nYou and the Rival take turns, one worker at a time. Most tiles hold only one worker, so going early matters.");
r("place1b","Round 1 · first worker (worker selected)","Place your first worker","",
">> Now click a **highlighted tile** (orange border) to send this worker there.\n\nAn orange border means this worker can use it. A greyed tile cannot be used: click it to see why.");
r("place1c","Round 1 · first worker (tile popup open)","Place your first worker","",
">> Press **Place worker here** to confirm.\n\nRead the tile first. The default choices are fine.");
r("place1d","Round 1 · first worker (worker popup open)","Place your first worker","",
">> Press **Select this worker**.\n\nThe tiles this worker can use get an orange border.");
r("place1w","Round 1 · first worker (Rival's turn)","Place your first worker","",
"The Rival is placing a worker. You are next, so look over the board while you wait.");
r("stats","Round 1 · skills","Your skills","Next",
"The tile paid out at once. Your four **skills** (Ideas, Code, Process, Buzz) are in your studio panel. You keep them between rounds and spend them on systems.");
r("ws1","Round 1 · workstations","Workstations: your desks","Next",
"Every placement needs a **workstation** (a desk). You start with just **{wsFree}**, so you can place **one worker per round** until you buy more. The counter is in your studio panel.\n\nTaking **any board tile**, including Studio Perks, uses one. Triggering one of your own systems does not.");
r("place2","Round 1 · buy a workstation","Buy a workstation, then place","",
">> Press **Buy workstation** and place a second worker, or press **Pass**.\n\nYou are out of workstations. Buy one in your studio panel ({wsCost}G for the next one), then place. Extra desks cost: {wsPrices} (up to {wsMax} in all). They stay for the rest of the phase; a new phase resets you to {wsFree}.");
r("place2b","Round 1 · desk bought","Desk ready: place a worker","",
">> **Select a worker**, then click a **highlighted tile** (orange border) and press **Place**.\n\nYou bought a workstation, so you can place another worker. Or press **Pass** to keep your Gold.");
r("place2c","Round 1 · second worker placed","Nice: finish placing","",
">> Press **Pass: done placing** when you have placed the workers you want.\n\nEach worker needs its own workstation, so a third worker would need another desk ({wsCost}G or more). You do not have to place everyone.");
r("build","Round 1 · manage: build","Manage: build a system","",
">> Press **Open Systems to Build**, pick a system, and build it.{freeBuild}\n\nThe **Manage** step has begun. A **system** is a permanent engine that scores VP at the end. It costs skills{sysWait}. Greyed cards need skills you do not have yet.");
r("tired","Round 1 · tired workers","Tired workers","Next",
"Every worker who worked this round is now **Tired**. A Tired worker can work again, but then becomes **Exhausted**, and an Exhausted worker you place earns no skill and adds Burnout. A worker who sits out a round **rests** and recovers one step.");
r("rest1","Round 1 · manage: finish","Manage: milestones and Done","",
">> Press **Done** to end your Manage turn.\n\nFirst, if a **Milestone** (a bonus goal such as \"have 3 Seniors\") shows **MET**, press **Cash in** to take the Gold.");
r("income","Round 2 · income and salaries","Round 2: Gold changed","Next",
"A new round began, and your Gold changed. Every round each studio gets **{income}G** of Income, then pays **salaries**: {salaryJr}G per Junior, or {salarySr}G per Senior (a promoted worker you will meet later).\n\nThis round: **+{incomeNow}G** income, **−{salaryNow}G** salaries. You now hold **{goldNow}G**.");
r("upkeep","Round 2 · upkeep and order","Between rounds: Upkeep and order","Next",
"Two things happen by themselves at the start of every round after round 1.\n**Upkeep**: workers who rested recover, and Burnout is updated.\n**Order**: the studio with the **fewest VP goes first**, so a studio that is behind gets first pick.");
r("r2recruit","Round 2 · recruit","Recruit a worker","Let's play round 2",
">> Press **Recruit** under a worker you like.\n\nThe **Recruitment** panel is a shared pool of **{recruitN}** workers. A Junior costs **{recruitCost}G**, plus {recruitLadder}G for each worker another studio has already taken this round. You can place them right away.");
r("board_perks","Round 2 · studio perks","Studio Perks","Next",
"**Studio Perks** are special tiles. **Each perk takes only one worker per round**, so whoever places first gets it.\n**Talent**: recruit one extra worker, for 1G less.\n**Outsource**: a worker earns Gold.\n**R&D**: {rdWhat}\n**Team Event**: send 2 workers with different roles and pay {teamCost}G {teamEventEffect}.");
r("r2place","Round 2 · place","Place your team","",
">> Place your workers, leave at least one unplaced to rest, then press **Pass**.\n\nBuy another workstation if you need one.");
r("burnout","Round 2 · burnout","Burnout","Next",
"**Burnout** (0 to {burnMax}) shows how worn out your team is. It rises +1 for each Exhausted worker you placed, and +1 if salaries were short by {burnUnpaidMin}G or more. It falls {burnRelief} after a calm round and {teamRelief} after a Team Event.\n\nBurnout 0 is **Energized** (+{energizedGold}G a round). At {burnStrainAt}+ you lose extra Hype, at {burnBenchAt}+ a worker is benched, at {burnQuitAt} one quits, and at the end high Burnout costs VP. **Culture** is {cultureBase} minus Burnout.");
r("gates","Round 3 · publisher gates","Publisher Gates","Next",
"The **Publisher Gates** panel lists your deadlines. At the end of each phase the publisher checks every studio: **pass** and you get funding, **miss** and you lose VP.\n\n**{gateName}** is due at the end of round {gateEnd}: {gateReqs}. Pass it for +{gateFund}G. Each requirement you miss costs 1 VP, so a near miss hurts less.");
r("r3","Round 3 · play","Round 3: your turn","",
">> Play round 3: place your workers, build if you can, then press **Done**.\n\nConcept ends after this round. **Production** opens more Progress and Hype tiles, so spend your skill bank on systems.\n\nTip: the **Game Jam** tile is a **Strike Team**: place 2 or 3 workers from different disciplines together for one workstation.\n\n{hint}");
r("races","Round 4 · the races","Progress and Hype","Next",
"**Progress** comes from **Prototype** tiles and **Hype** from **Pitch Deck** tiles. At the end of the game every **{raceDen} points** of Progress is **1 VP**, and so is every {raceDen} points of Hype. The Race tracks panel shows where every studio stands.\n\nRed-marked tiles add **Tech Debt**, which costs VP. **Quality** tiles remove it.");
r("hype_bank","Round 4 · banking Hype","Banking Hype","Got it",
"From round {decayFromRound}, Hype fades by {hypeDecay} every round. To keep some, each studio **banks up to {hypeBank} Hype as Wishlists** at the end of every phase (this just happened for the first time).\n\nWishlists never fade and are added to your Hype at the end. Publisher Gates count Hype only, not Wishlists.");
r("crisis","Round 4 · crisis","Production begins: a Crisis","Got it",
"Every phase opens with a **Phase start**: a **Crisis card** (an event that hits every studio) and the **Reveal** of the new board. This one is {crisisName}.\n\nRead the card in the pop-up and make your choice. If it asks for a bid, a bid of **0** is safe.");
r("promote_train","Round 4 · train a Senior","Train a Junior into a Senior","",
">> Select a Junior, then click the **Training** tile (orange border) and confirm.\n\nTraining **promotes a Junior to Senior**. A Senior earns **{resSr} skills** instead of {resJr} and is the only worker who can **trigger your systems**. It uses a workstation and costs **{trainCost}G** (or 1 skill of their role). The Junior earns no skill, and training {trainEffect}. Pick one whose role matches a system you built.");
r("r4play","Round 4 · finish placing","Round 4: finish your round","",
">> Place your other workers, then press **Pass: done placing**. Your new Senior is ready: next round you will use it to trigger a system.\n\n{hint}");
r("trigger","Round 5 · trigger a system","A Senior triggers a system","",
">> Select your Senior, click your **system tile** below the board, and confirm.\n\nA finished system pays its bonus when a Senior triggers it, instead of the Senior using a board tile. Each system can be triggered once per round.");
r("convert","Round 12 · convert","Launch: convert your leftovers","",
">> Select a worker, click the **Convert** tile, choose Progress or Hype, and confirm.\n\n**Round 12 is Launch.** Unspent skills score nothing, so turn them into points: place a worker on **Convert** to turn **{convertRate} skills of that worker's role** into **1 Progress or 1 Hype**. Leftover Gold is worth 1 VP per {goldPerVP}. An Exhausted worker you place now still adds Burnout before the final score.");
r("handover","Round 12 · hand-over","That is every lesson","Finish the game",
"Finish round 12 on your own. When the game ends, the results screen shows where every VP came from, and you can start a game against bots, read the rules, or replay this guide.");
r("ui_step","Coach label","","",
"Lesson {n} of {total} · {left} to go");

module.exports = R;
if (require.main === module) {
  const fs = require("fs"); let t = fs.readFileSync(require("path").join(__dirname, "..", "game", "data.js"), "utf8");
  const body = "D.tutorial = [\n" + R.map(x => "  " + JSON.stringify(x)).join(",\n") + "\n];\n\n";
  t = t.replace(/D\.tutorial = \[\n[\s\S]*?\n\];\n\n/, "");
  t = t.replace("D.gate = {", body + "D.gate = {");
  fs.writeFileSync(require("path").join(__dirname, "..", "game", "data.js"), t); console.log("rows", R.length);
}
