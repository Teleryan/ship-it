// Authoring source for D.tutorial (guided-game strings). Output is spliced into data.js by `node tools/mkrows.js`.
// Markup: **bold**, blank line = paragraph break, {token} = live value.
const R = [];
const r = (id, when, title, btn, text) => R.push({ id, when, title, btn, text });
r("welcome","Step 1 · opening card","Welcome to Ship It!","Let's go",
"You run a game studio racing a Rival to ship the best game. Over **12 rounds** you build a team, send workers to the board, and build systems. **The studio with the most Victory Points (VP) wins.**\n\nThe game has four phases: **Concept** (rounds 1 to 3), **Production** (4 to 8), **Polish** (9 to 11) and **Launch** (12).\n\nEach idea is taught the first time it matters. Use **Stop coaching** to turn the tips off, or **×** to leave.");
r("win_vp","Step 2 · how you win","How you win","Next",
"**Finish round 12 with the most VP.** VP come from:\n**Progress and Hype**: every {raceDen} points is 1 VP\n**Systems** you build: the VP printed on each card\n**Objectives**: your secret goals\n**Publisher gates**: pass for funding, miss and lose VP\n**Leftover Gold**: every {goldPerVP} Gold is 1 VP\n\nYou lose VP for **Tech Debt** and high **Burnout**. Each idea is explained when it first comes up.");
r("races","Production start · the races","The Progress and Hype races","Next",
"Progress and Hype are races. At the end of the game, every **{raceDen} points** of Progress is **1 VP**, and so is every {raceDen} points of Hype. Every point you earn counts.\n\n**Progress** comes from Prototype tiles. **Hype** comes from Pitch Deck tiles. The Race tracks panel shows where every studio stands.");
r("hype_bank","Production start · banking Hype","Banking Hype","Got it",
"From now on Hype fades by {hypeDecay} every round. To keep some, each studio **banks up to {hypeBank} Hype as Wishlists** at the end of every phase (this just happened for the first time).\n\nWishlists never fade and are added to your Hype at the end of the game. Publisher Gates count Hype only, not Wishlists.");
r("objectives","Step 7 · pick objectives","Secret objectives","",
"**Objectives** are secret goals that pay VP at the end of the game. Each requirement you meet scores {objPer} VP, and meeting all of them scores {objBonus} more.\n\nEach row offers 2 cards. Read them, choose **one card per row**, then press **Confirm objectives**. The skill icon on a card gives bonus VP to a finished system with the same main skill.");
r("boardintro","Step 9 · the board","The Board","Next",
"The **main board** is where you send workers. Tiles in the same row do the same kind of job. We will look at each row.");
r("board_backlog","Step 9 · the board · Backlog","Backlog","Next",
"**Backlog** tiles earn **skills**. Each skill has an icon and belongs to one discipline:\n\n**Light bulb** = Ideas (Creative)\n**Brackets** = Code (Development)\n**Gear** = Process (Operations)\n**Megaphone** = Buzz (Marketing)\n\nA worker earns the skill of their own role: **+1** for a Junior, **+2** for a Senior. You spend skills later to build systems.");
r("board_prototype","Step 9 · the board · Prototype, Quality and Pitch Deck","Prototype, Pitch Deck and Quality","Next",
"**Prototype** tiles add **Progress**: how finished your game is. **Pitch Deck** tiles add **Hype**: how much the world wants it. Every {raceDen} points of either is 1 VP.\n\n**Quality** tiles remove **Tech Debt**, the mess left by risky tiles and systems (they carry a red Debt mark). The studio with the most Debt loses the most VP.");
r("board_jam","Step 9 · the board · Game Jam","Game Jam","Next",
"**Game Jam** is a **Strike Team** tile: place 2 or 3 workers from different disciplines together. The whole team uses just one workstation. It earns skills or Progress.");
r("board_perks","Step 21 · studio perks","Studio Perks","Next",
"**Studio Perks** are special actions. **Each perk takes only one worker per round**, so whoever places first gets it.\n\n**Talent**: recruit one extra worker from the pool, for 1G less.\n**Outsource**: a worker earns Gold.\n**R&D**: two workers from different disciplines make a system you build that round **1 round shorter**, with no crunch fee.\n**Team Event**: send 2 workers with different roles and pay {teamCost}G {teamEventEffect}.");
r("income","Step 14 · income and salaries","Gold, income and salaries","Next",
"**Gold** pays for workstations, recruits, training and builds. Every round each studio gets **{income}G** of Income, then pays **salaries**: {salaryJr}G per Junior, or {salarySr}G per Senior (a promoted worker you will meet later). Your payroll right now is {payroll}G.");
r("place1","Step 10 · first worker (nothing selected)","Place your first worker","",
"**Click one of your workers** in the Studio Workers panel to select it.");
r("place1b","Step 11 · first worker (worker selected)","Place your first worker","",
"Now **click a green tile**: green means this worker can use it. Greyed tiles cannot be used (hover over one to see why). Then confirm.");
r("place1c","Step 12 · first worker (spot popup open)","Place your first worker","",
"Read the tile's description, then press **Place worker here** to confirm. The default choices are fine.");
r("place1d","Step 13 · first worker (worker popup open)","Place your first worker","",
"Press **Select this worker**. The tiles this worker can use will turn green.");
r("place1w","Step 14 · first worker (Rival's turn)","Place your first worker","",
"The Rival is placing a worker. You are next, so use the time to look over the board.");
r("stats","Step 16 · numbers","Your skills","Next",
"The tile paid out right away. Your four **skills** are Ideas, Code, Process and Buzz: you earn them on Backlog tiles, spend them on systems, and keep them between rounds.\n\nYour Gold, Wishlists, Tech Debt and Burnout sit above them; each is explained later.");
r("place2","Step 15 · keep placing","Buy a workstation, or pass","",
"You are out of workstations. To place a second worker, press **Buy workstation** in your studio panel ({wsCost}G for the next one), then place. Extra ones cost: {wsPrices} (up to {wsMax} in all). They stay for the rest of the phase, and a new phase resets you to {wsFree}.\n\nWorkers you do not place **rest** and recover from tiredness. When you are finished, press **Pass**.");
r("tired","Step 21 · tired workers","Tired workers","Next",
"Every worker who worked this round is now **Tired**. A Tired worker can work again, but then becomes **Exhausted**, and an Exhausted worker you place earns no skill and adds Burnout. A worker who sits out a round **rests** and recovers one step.");
r("burnout","Step 21 · burnout","Burnout and Culture","Next",
"**Burnout** (0 to {burnMax}) shows how worn out your team is. At Upkeep it rises +1 for each Exhausted worker you placed, and +1 if salaries were short by {burnUnpaidMin}G or more. It falls {burnRelief} after a calm round and {teamRelief} after a Team Event.\n\nBurnout 0 is **Energized** (+{energizedGold}G a round). At {burnStrainAt}+ you lose extra Hype, at {burnBenchAt}+ a worker is benched, at {burnQuitAt} one quits, and at the end of the game high Burnout costs VP.\n\n**Culture** is {cultureBase} minus Burnout, so Culture gains lower Burnout.");
r("upkeep","Step 21 · upkeep","Upkeep","Next",
"**Upkeep** ran automatically at the start of this round: resting workers recovered and Burnout was updated. It happens at the start of every round after round 1. From round 4, Hype also fades by {hypeDecay} each Upkeep.");
r("gates","Step 22 · publisher gates","Publisher Gates","Next",
"The **Publisher Gates** panel lists your deadlines. At the end of each phase the publisher checks every studio: **pass** and you get funding, **miss** and you lose VP.\n\n**{gateName}** is due at the end of round {gateEnd}: {gateReqs}. Pass it for +{gateFund}G. Each requirement you miss costs 1 VP, so a near miss hurts less. Only the final gate also pays VP for passing.");
r("r2place","Step 25 · place (round 2)","Place your team","",
"Place your workers (buy another workstation if you need one), and leave at least one unplaced so they can rest. Press **Pass** when you are finished.");
r("r2crunch","Step 26 · crunch (round 2)","Crunch: finish a build sooner","",
"A system keeps its team busy for 1 to 3 rounds. **Crunch** takes one round off. It costs **{crunchGold}G**, or it makes one worker more tired.\n\nPress **Open Systems to Build**, set **Build speed** to Crunch, and build.{freeBuild}\n\nThen press **Done**.");
r("r3","Step 27 · rounds 2 and 3","Round 3: keep building","",
"Concept ends after round 3. **Production** opens more Progress and Hype tiles, so spend your skill bank on systems now.\n\n{hint}");
r("gateresult","Step 28 · gate result","Concept gate result","Next",
"The first gate, **{gateName}**, was checked when Concept ended. {gateResult}");
r("gate_pass","Step 17 · gate result (passed)","","",
"You **passed** and received **{gateFund}G**.");
r("gate_miss","Step 18 · gate result (missed)","","",
"You **missed** it and lost **1 VP** for each requirement you did not meet.");
r("crisis","Step 29 · crisis (round 4)","Production begins: a Crisis","Got it",
"Round 4 starts **Production**. Every phase after the first opens with a **Crisis card**, an event that hits every studio. This one is {crisisName}.\n\nRead the card in the pop-up and make your choice. If it asks for a bid, a bid of **0** is safe.");
r("promote","Step 31 · promote","Promote a Junior to Senior","",
"A Junior who has **worked** and is now **resting** can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr} and is the only worker who can **trigger your systems**.\n\nClick one of your workers in the Manage panel and press **Promote**. Choose one whose role matches a system you built, so it can trigger that system next round.");
r("promote_train","Step 31 · train and promote","Train a Junior, then promote","",
"A Junior who has **trained** {trainTimes} can be **promoted to Senior for free**. A Senior earns **{resSr} skills** instead of {resJr} and is the only worker who can **trigger your systems**.\n\nClick a Junior in the Manage panel, press **Train** ({trainCost}G, {trainEffect}; they {trainAway}), then press **Promote**. Pick one whose role matches a system you built.{promoLesson}");
r("trigger","Step 32 · trigger a system","A Senior triggers a system","",
"Your system should be finished and your Senior ready. On your turn to place, select your Senior, click your **system tile** below the board, and confirm. The system pays its bonus instead of the Senior using a board tile. Each system can be triggered once per round.");
r("prod","Step 33 · production","Production: balance your studio","",
"Play freely through Production (rounds 4 to 8): spend skills on systems, take scoring tiles for Progress and Hype, and keep Debt and Burnout under control.\n\n{hint}");
r("polish","Step 34 · polish","Polish begins","Got it",
"**Polish** covers rounds 9 to 11. **{gate3Name}** is due at the end of round 11, so check the Publisher Gates panel. A build that could not finish before the game ends is greyed out in the Build window.");
r("polishfree","Step 19 · polish, free play","Polish","",
"{hint}");
r("convert","Step 36 · launch and convert","Launch: convert your leftovers","",
"**Round 12 is Launch.** Unspent skills score nothing, so turn them into points: place a worker on the **Convert** tile to turn **{convertRate} skills of that worker's role** into **1 Progress or 1 Hype**. Leftover Gold is worth 1 VP per {goldPerVP}.\n\nSelect a worker, click Convert, choose Progress or Hype, and confirm. An Exhausted worker you place now still adds Burnout before the final score.");
r("handover","Step 37 · hand-over","That is every lesson","Finish the game",
"That covers the lessons, and the tips stop here.\n\nFinish round 12 on your own. The results screen shows where every VP came from.");
r("hint_place","Hint · place step","","",
"**Place.** Select a worker, then a green tile. Leave Tired workers unplaced to rest. You can Recruit from the shared pool if you like. Press **Pass** when you are finished.");
r("hint_build","Hint · build step","","",
"**Build.** Spend your skills on a system, then press **Done**. The **Systems to Build** panel under the board shows 2 cards per type; greyed cards cannot be built yet. Replacing the cards costs {refreshGold}G.");
r("hint_wait","Hint · other steps","","",
"Resolve any pop-up (a Crisis card or a choice), then play your round.");
r("msg_next","Blocked-action message","","",
"Press Next first");
r("msg_start","Blocked-action message","","",
"Press “Let's go” to begin");
r("msg_obj","Blocked-action message","","",
"Choose your objectives first");
r("msg_place","Blocked-action message","","",
"Place a worker on a green tile");
r("msg_place_first","Blocked-action message","","",
"Place at least one worker first");
r("msg_place_pass","Blocked-action message","","",
"Buy a workstation, keep placing, or press Pass");
r("msg_build_first","Blocked-action message","","",
"Try building one system first");
r("msg_build","Blocked-action message","","",
"Build a system, then press Done");
r("msg_rest","Blocked-action message","","",
"Press Done to continue");
r("msg_recruit","Blocked-action message","","",
"Recruit one worker from the shared pool first");
r("msg_crunch","Blocked-action message","","",
"Set Build speed to Crunch, then build");
r("msg_promote","Blocked-action message","","",
"Promote a Junior who has worked and rested");
r("msg_promote_train","Blocked-action message","","",
"Train a Junior, then promote them");
r("msg_train_later","Blocked-action message","","",
"Training comes later: you will train and promote a Junior in Production");
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
r("phasestart","Step 8 · reveal and order","Phase start: Crisis and Reveal","Next",
"Every phase opens with a **Phase start**: a **Crisis** card (an event that hits every studio; the first one comes when Production begins) and the **Reveal** of that phase's board.");
r("order","Step 8 · order","Order: who goes first","Next",
"At the start of each round, **Order** decides who acts first: **the studio with the fewest VP goes first**, so a studio that is behind gets first pick. In round 1 you go first.");
r("team","Step 8 · your team","Your starting team","Next",
"These are your workers. You start with **{startWorkers} Juniors**, each with a role such as Designer or Advertising. You can add more with **Recruit**, which opens in round 2.");
r("placeintro","Step 14 · income and place","Place: taking turns","Next",
"Now you use the board. Players take turns placing **one worker at a time** on a tile that accepts them, until everyone has passed.\n\nMost tiles hold **only one worker**, so going early matters. Hover over a greyed tile to see why you cannot use it.");
r("ws1","Step 17 · workstations","Workstations: your desks","Next",
"Every placement needs a **workstation** (a desk). You start with just **{wsFree}**, so you can place **one worker per round** until you buy more. The counter is in your studio panel.\n\nTaking **any board spot**, including Studio Perks, uses one. Triggering one of your own systems does not.");
r("build","Step 20 · manage: build","Manage: build a system","",
"The **Manage** step begins. Here you build systems, train or promote workers, and cash in Milestones.\n\nA **system** is a permanent engine that scores VP at the end of the game. Press **Open Systems to Build**, pick one, and build it. Building commits one worker for each role it needs, and they sit out until it is finished (1 to 3 rounds).{freeBuild}");
r("rest1","Step 21 · manage: rest","Manage: milestones and finishing","",
"Your **Milestones** are bonus goals, such as \"have 3 Seniors\". When one shows **MET**, press **Cash in** to take the Gold.\n\nThen press **Done** to end your Manage turn.");
r("r2recruit","Step 23 · round 2","Round 2: recruit a worker","Let's play round 2",
"From here you choose for yourself. First **recruit**: the **Recruitment** panel is a shared pool of **{recruitN}** workers. A Junior costs **{recruitCost}G**, plus {recruitLadder}G for each worker another studio has already taken this round, and you can place them right away.\n\nPress **Recruit** under a worker you like.");
r("r4play","Step 30 · place and manage (round 4)","Round 4: play your round","",
"Recruit if the pool has someone you need, place your workers, and leave a Junior who has worked out to rest: you will promote one next.\n\n{hint}");
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
