/* ============================================================
   SHIP IT!: GUIDED TUTORIAL
   A scripted first game (You vs. a Rival bot). Pure add-on: the engine is
   untouched. The script is state-driven: each step finishes when the game
   state says so: and a gate blocks off-script actions with a short reason.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {}, E = root.ShipItEngine, D = root.SHIPIT_DATA;
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const U = () => SI.U;
const me = S => S.players[0];
const actorIsMe = S => E.currentActor(S) === 0;
const b = t => "<b>" + t + "</b>";

SI.TUT_SEED = 20261031;
SI.TUT_CONFIG_C = { gatesRandom: 0, qaAllowedPreProd: 1, bidEveryRound: 0 };
SI.TUT_CONFIG = { varC: 0, headhuntsPerRest: 0, qaAllowedPreProd: 1, gatesRandom: 0 };   // headhunting is left for later; QA is hireable so any card can be recruited

function canBuildAny(S, free) { return S.data.systems.some(d => E.canBuild(S, 0, d.name, free).ok); }
const RANK = { setup: 0, crisis: 0, bid: 1, draft: 2, hire: 3, place: 4, build: 5, rest: 6, milestones: 7 };
// true once the game has moved past `stage` of `round` (monotonic, so early/late states can't skip steps)
const after = (S, stage, round) => S.round > round || (S.round === round && RANK[S.step] > RANK[stage]);
const hireable = S => me(S).hand.filter(c => !(S.phase === 0 && c.disc === "QA" && !S.cfg.qaAllowedPreProd)).length;

/* step: kind  info = wait for the button · do = wait for game state · free = light hint, no restrictions
         done(S,T)  true when the step is finished
         allow(a,S) returns a message to BLOCK the action, or null to allow                              */
const blk = () => "Press Next first";
const FREE_HINT = S => ({
      hire: `${b("Hire.")} Recruit from your hand (Junior ${S.cfg.jrCost}G, Seniors unlock in Production). Cards you skip stay in your hand. The Talent spots on the board make hiring cheaper. Press ${b("Done")} when finished.`,
      place: `${b("Place.")} Select a worker, then a green spot. Leave a Tired worker unplaced so they rest and recover. Tip: Progress and Marketing both score, so keep them balanced. ${b("Pass")} when finished.`,
      build: `${b("Build.")} Spend your skills on a system, then press ${b("Done")}. The market shows 2 systems per type; Replace costs ${S.cfg.marketRefreshGold}G.`,
      rest: `${b("Rest.")} Promote or release if you like. Press ${b("Done")}.`,
      milestones: `${b("Milestones.")} Cash in anything that is met, then press ${b("Done")}.`
    }[S.step] || "Resolving…");
const STEPS_A = [
  { id: "welcome", kind: "info", center: true, hold: true, title: "Welcome to Ship It!", btn: "Let's go",
    text: () => `You run a game studio racing a Rival to ship the best game. Over 12 rounds you hire a team, put it to work on the board, and build systems that score ${b("Victory Points (VP)")}. Most VP wins.<br><br>This guided game plays the first two rounds slowly, shows what changes later, then fast-forwards and explains the score. There is no rush: every step waits for you.`,
    allow: () => "Press “Let's go” to begin" },

  { id: "loop", kind: "info", title: "How the game is structured", btn: "Next", hl: () => "[data-tut=steps]",
    text: () => `The bar at the top shows where you are.<br><br>${b("Phase start")} happens 4 times in the game: Crisis, Reveal, Bid, Draft. It sets up the Crisis and the draft.<br><br>${b("Round")} happens 12 times: a blind Bid for turn order, then Income, Hire, Place, Build, Rest, Milestones, Upkeep. This is where your studio grows.<br><br>We will walk through each one the first time it comes up.`,
    allow: blk },

  { id: "objectives", kind: "do", title: "Secret objectives", hl: () => ".modal",
    text: () => `First, choose your goals. Objectives are secret cards that pay VP at the end of the game, but only if you completed them.<br><br>Each row offers 2 cards. Read what each one needs, pick one per row, then press ${b("Confirm objectives")}. The symbols (▲ ● ■) match the systems you will build later, which gives bonus VP.`,
    done: S => !S.dq.some(d => d.t === "keepObj" && d.p === 0),
    allow: a => a.type === "keepObj" ? null : "Choose your objectives first" },

  { id: "phasestart", kind: "info", title: "Phase start: Reveal and Bid", btn: "Next", hl: () => "[data-tut=steps]",
    text: S => `Phase 1 (Concept) has no Crisis card, so we start at ${b("Reveal")}: ${b(S.cfg.draftPool || 8)} discipline cards are dealt face up. They are the people you can hire, and you see them before you bid so you know what you are bidding for. The pool is refilled after every pick, so there are always ${S.cfg.draftPool || 8} to choose from.<br><br>Next is ${b("Bid")}. Before anyone picks a card, everyone secretly bids gold. The highest bid picks first in the draft and goes first in that round. Every round starts with a bid.`,
    allow: blk },

  { id: "boardintro", kind: "info", title: "The board: who works where", btn: "Next", hl: () => "[data-tut=board]",
    text: () => `Before you bid, look at the ${b("main board")}. It is where your workers will earn skills, so it tells you ${b("who to recruit")}.<br><br>Each tile shows ${b("which roles can use it")} as colored chips. A worker with ANY of the listed roles fits. A red ${b("+1")} corner means the spot adds ${b("Tech Debt")}, a cost you want to keep low.<br><br>Let's go through the rows.`,
    allow: blk },

  { id: "rows1", kind: "info", title: "Concept and Prototype: build the game", btn: "Next", hl: () => "[data-row=CONCEPT],[data-row=PROTOTYPE]",
    text: () => `${b("Concept")} is the design work. It takes a ${b("Designer")} or an ${b("Analytics")} worker, and gives Progress, sometimes Marketing too.<br><br>${b("Prototype")} is the making of the game. It takes an ${b("Engineer")} or an ${b("Artist")}, and gives Progress.<br><br>${b("Progress")} is how finished and polished your game is, and it scores VP at the end. These two rows are your main Progress engine, and every tile adds some Tech Debt.`,
    allow: blk },

  { id: "rows2", kind: "info", title: "Pitch and Talent: buzz and people", btn: "Next", hl: () => "[data-row=PITCH],[data-row=TALENT]",
    text: () => `${b("Pitch")} is about selling the game. It takes a ${b("Community")} or an ${b("Advertising")} worker, and gives Hype, Marketing and gold.<br><br>${b("Talent")} takes ${b("any")} worker, and makes your next hire ${b("1G cheaper")}. It is a good spot for a worker with nothing better to do.<br><br>Rows change in later phases (Production adds Build, Create, Test and Market), but the idea stays the same: each row wants certain roles.`,
    allow: blk },

  { id: "boardshared", kind: "info", title: "Utility spots", btn: "Next", hl: () => ".shared",
    text: () => `The dashed tiles on the right are ${b("utility spots")}. Any worker can use most of them, but ${b("only one worker")} can take each spot per round${(E.defaultConfig().smallDrop || []).includes("insight") ? "" : " (except Insight, which every player can use once)"}.<br><br>${b("Team Event")}: any worker, +2 Culture.<br>${b("Insight")}: a Community or Analytics worker draws a milestone.<br>${b("Outsource")}: any worker earns gold (Junior +3G, Senior +5G).<br><br>The ${b("Crew")} row and ${b("R&D")} (in the Concept row) are different: they need ${b("2 or 3 workers")} of different roles placed together, for example Creative + Operations. Every crew worker is used up for the round and earns their skill, and the spot pays a bigger reward. R&D makes your next system cost 3 fewer skills.`,
    allow: blk },

  { id: "recruit", kind: "info", title: "So who should you recruit?", btn: "Next", hl: () => "[data-tut=draft]",
    text: () => `Now look at the revealed cards again with the board in mind:<br><br>${b("Progress")} comes from Designers, Analytics, Engineers and Artists.<br>${b("Hype and Marketing")} come from Community and Advertising.<br>${b("Culture and gold")} can come from any worker.<br><br>A balanced team of 3 or 4 different roles can use the most tiles. If you want a particular card, that is what the bid is for.`,
    allow: blk },

  { id: "bid", kind: "do", title: "Blind bid for turn order", hl: () => ".modal",
    text: () => `Type an amount and press ${b("Lock in bid")}. ${b("Every player pays their bid, win or lose")}, so going first costs real gold. Look at the face-up cards in this window first: if the best ones are worth fighting for, bid higher. Gold also pays to hire the workers you draft, so do not overspend. Drafting itself is free.<br><br>Try ${b("1")}.`,
    done: S => after(S, "bid", 1),
    allow: a => a.type !== "bid" ? "Place your bid first" : (a.amount > 3 ? "Keep it small for now: bid 0 to 3G" : null) },

  { id: "draft", kind: "do", title: "Draft: take a card", hl: () => "[data-tut=draftpanel]",
    text: S => `Now the ${b("Draft")}. Players take turns picking one face-up card: press ${b("Shortlist")} on a card to pick that candidate, or tap the card first to read more about it. Each time a card is taken, a new one is revealed, so the pool stays full (${b(S.cfg.draftPool || S.draft.cards.length)} cards). You get ${b(S.draft.per)} picks.<br><br>Each card is a discipline (Engineer, Artist, Designer and so on) and says what that worker is good at. Cards you pick go to your hand. ${b("Drafting costs no gold")}: you pay only later, when you hire a card in the Hire step. Pick a mix: different disciplines unlock more systems later.`,
    done: S => after(S, "draft", 1),
    allow: a => a.type === "pick" ? null : "Pick a card from the draft" },

  { id: "hireintro", kind: "info", title: "Round 1 starts: Income", btn: "Next", hl: () => ".pt[data-pid='0'] .stats",
    text: S => `Round 1 begins with ${b("Income")}: every studio just received ${b(S.cfg.income + "G")}. That is the Gold number in your studio card on the right.<br><br>Right after Income, every worker you have hired is paid a ${b("salary")}: ${b(S.cfg.salaryJr + "G")} per Junior and ${b(S.cfg.salarySr + "G")} per Senior. You have no workers yet, so you pay nothing this round.<br><br>Next is ${b("Hire")}. This happens in ${b("every round")}, not just the first one.`,
    allow: blk },

  { id: "hire", kind: "do", title: "Hire: cards become workers", hl: () => "[data-tut=hand]",
    text: S => `Your hand shows the cards you drafted. Drafting was free, but a card is not a worker until you hire it, and ${b("hiring is where gold is spent")}.<br><br>${b("Hire Junior")} costs ${b(S.cfg.jrCost + "G")}. ${b("Hire Senior")} is greyed out because Seniors unlock in Production. ${b("Discard")} gives ${S.cfg.discardGold}G instead.<br><br>Click a card, then press ${b("Hire Junior")}. Hire at least 2, then press ${b("Done")}. A card you do not hire stays in your hand, so you can recruit it in any later round.`,
    done: S => after(S, "hire", 1),
    allow: (a, S) => a.type === "hire" ? (a.lvl === "Jr" ? null : "Seniors unlock in Production") : a.type === "discard" ? null :
      a.type === "done" ? (me(S).workers.length < Math.min(2, hireable(S) + me(S).workers.length) ? "Hire at least 2 workers so you have something to place" : null) : "Hire from your hand, then press Done" },

  { id: "placeintro", kind: "info", title: "Place: put workers to work", btn: "Next", hl: () => "[data-tut=board]",
    text: () => `Now you use the board. Players take turns placing ${b("one worker at a time")} on a tile that accepts them, going around the table until everyone passes.<br><br>Most tiles hold ${b("one worker")}, so going early matters: the tile you want can be gone by your turn. That is what turn order is worth.<br><br>Hover over a greyed tile to see why it cannot be used.`,
    allow: blk },

  { id: "place1", kind: "do", title: "Place your first worker", hl: S => (U().sel == null ? "[data-tut=workers] .wk:not(.placed)" : ".spot.ok"),
    text: S => !actorIsMe(S) ? `The Rival is placing. You are next. Read the board while you wait.`
      : U().detail && U().detail.k === "spot" ? `Read the spot, then press ${b("Place worker here")} to confirm. The default choices are fine.`
      : U().detail && U().detail.k === "worker" ? `Press ${b("Select this worker")}. The spots they can use will turn green.`
      : U().sel == null ? `Step 1: ${b("click one of your workers")} in the Studio Workers panel above the board.`
      : `Step 2: green spots accept this worker. Greyed spots cannot be used (hover to see why). ${b("Click a green spot")}, then confirm.`,
    done: S => after(S, "place", 1) || (S.round === 1 && S.step === "place" && me(S).rs.placed >= 1),
    allow: a => a.type === "place" ? null : a.type === "pass" ? "Place at least one worker first" : "Place a worker on a green spot" },

  { id: "stats", kind: "info", title: "What your numbers mean", btn: "Next", hl: () => ".pt[data-pid='0'] .stats",
    text: S => `The spot paid out instantly. Here is what each number in your studio card on the right is for:<br><br>${b("Gold")} hires workers and pays for some systems.<br>${b("Ideas, Code, Process and Buzz")} are earned by placing. Each worker earns the skill of their role (Creative = Ideas, Development = Code, Operations = Process, Marketing = Buzz): +${S.cfg.resJr} per Junior, +${S.cfg.resSr} per Senior. They are saved between rounds and spent in the Build step.<br>${b("Progress")} and ${b("Marketing")} are your game's quality and its reach. Both score VP at the end.<br>${b("Hype")} builds buzz but fades by ${S.cfg.hypeDecay} every round.<br>${b("Debt")} is Tech Debt. High Debt hurts your launch.<br>${b("Culture")} is team morale.`,
    allow: blk },

  { id: "place2", kind: "do", title: "Keep placing, or pass", hl: () => "[data-tut=workers]",
    text: S => `Each worker can work ${b("once per round")}. Place more workers if you want more skills.<br><br>You do not have to place everyone. ${b("A worker you leave unplaced will rest")} and recover from tiredness. When you are finished, press ${b("Pass")} at the top. Passing ends your placing for this round.`,
    done: S => after(S, "place", 1),
    allow: a => (a.type === "place" || a.type === "pass") ? null : "Keep placing, or press Pass" },

  { id: "buildintro", kind: "info", title: "Build: systems", btn: "Next", hl: () => "[data-tut=steps]",
    text: S => `Placing earned you ${b("skills (" + (me(S).ideas + me(S).code + me(S).process + me(S).buzz) + " in your bank)")}. The ${b("Build")} step is where you spend it.<br><br>A ${b("System")} is a permanent engine. Whenever you place a worker of the matching discipline later, the system triggers and gives you a bonus. Systems also score VP at the end. You can build ${b(S.cfg.buildsPerRound + " system per round")}.`,
    allow: blk },

  { id: "build", kind: "do", title: "Build a system", hl: () => (U().modal === "market" ? ".modal [data-act=build]:not([disabled])" : "[data-tut=market]"),
    text: S => `Press ${b("Open Systems to Build")}. Each card shows its cost in skills (the same roles as the workers it needs), plus Gold. If you are one or two skills short you can pay Gold for them. Each card also shows which workers you need, and what it does. Only systems you can afford and have the right workers for are enabled. The rest explain why they are locked.${me(S).freeBuilds ? `<br><br>${b("A free build is on the house this round.")}` : ""}<br><br>Build one, close the market with ${b("×")}, then press ${b("Done")}.`,
    done: S => after(S, "build", 1),
    allow: (a, S) => a.type === "build" ? null : a.type === "done" ? ((me(S).builds >= 1 || !(canBuildAny(S, false) || (me(S).freeBuilds && canBuildAny(S, true)))) ? null : "Try building one system first") : "Build a system, then press Done" },

  { id: "restintro", kind: "info", title: "Rest: tired workers", btn: "Next", hl: () => "[data-tut=workers]",
    text: () => `Every worker who worked this round is now ${b("Tired")}. Look at the fatigue bar on each worker.<br><br>If a Tired worker works again next round they become ${b("Over-Tired")}: no skill, and a chance they quit at the end of the round.<br><br>A worker who sits out a round ${b("rests and recovers")}. So spreading the work across your team, or leaving someone unplaced, keeps everyone healthy.`,
    allow: blk },

  { id: "rest", kind: "do", title: "Rest step", hl: () => "[data-tut=rest]",
    text: () => `This step is for team management: ${b("Promote")} a Junior to Senior (greyed out until Production), or ${b("Release")} a worker you no longer want. Click a worker to see their options. You can do either in any round.<br><br>Nothing is needed right now. Press ${b("Done")}.`,
    done: S => after(S, "rest", 1),
    allow: a => (a.type === "done" || a.type === "promote" || a.type === "fire" || a.type === "swapObj" || a.type === "swapMile") ? null : "Press Done to continue" },

  { id: "miles", kind: "do", title: "Milestones", hl: () => "[data-tut=miles]",
    text: () => `Milestones are bonus goals in your hand, such as "have 3 Seniors". When one is met it shows ${b("MET")} and its ${b("Cash in")} button turns on. Cash in to take the gold. A greyed button means it is not met yet.<br><br>Click a milestone to read it and cash it in. Press ${b("Done")} when finished.`,
    done: S => after(S, "milestones", 1),
    allow: a => (a.type === "claim" || a.type === "done") ? null : "Cash in a met milestone, or press Done" },

  { id: "upkeep", kind: "info", title: "Upkeep", btn: "Next", hl: () => "[data-tut=steps]",
    text: S => `${b("Upkeep")} ran automatically: Hype faded by ${S.cfg.hypeDecay}, Culture moved toward 0, workers who did not work recovered, and Over-Tired workers risked quitting.<br><br>Then Round 2 started with a new ${b("Income of " + S.cfg.income + "G")}, and your workers were paid their ${b("salaries")} (Junior ${S.cfg.salaryJr}G, Senior ${S.cfg.salarySr}G each). Check the Game Log to see what you paid.`,
    allow: blk },

  { id: "gates", kind: "info", title: "Publisher Gates", btn: "Next", hl: () => "[data-tut=gates]",
    text: S => { const g = S.data.publisherGates[0], g2 = S.data.publisherGates[1]; return `The ${b("Publisher Gates")} panel is your deadline list. At the end of each phase the publisher reviews every studio. ${b("Pass")} the requirements and you get funding (or VP at Gold Master). ${b("Miss")} and you lose VP.<br><br>${b(esc(g.name))} is due end of round ${D.phases[g.phase].rounds[1]}: ${esc(g.reqs.join(", "))}. Pass for +${g.fund}G, miss for −${g.penalty} VP. The next one, ${b(esc(g2.name))}, is stricter. The panel also previews the next Crisis, so you can plan for it. Requirements turn green as you meet them.`; },
    allow: blk },

  { id: "r2intro", kind: "info", title: "Round 2: you drive", btn: "On my own", hl: () => "[data-tut=steps]",
    text: S => `Every round runs the same 7 steps. This time you choose freely:<br><br>${b("Recruit")} more workers from your hand in the Hire step. You can do this every round.<br>${b("Rest")} workers by leaving them unplaced. You can do this every round.<br>Build a second system if you have the skills.<br><br>The coach will give a short hint at each step.`,
    allow: blk },

  { id: "r2free", kind: "free", title: "Round 2", hl: () => null,
    text: S => FREE_HINT(S),
    done: S => S.round >= 3, allow: () => null },

  { id: "crisis", kind: "info", title: "Production begins: a Crisis", btn: "Got it", hl: () => "[data-tut=crisis]",
    text: S => { const c = S.crisisCard && S.data.crisis.find(x => x.id === S.crisisCard); return `Round 3 starts a new phase, and every phase after the first opens with a ${b("Crisis card")}. It is an event that hits every studio${c ? `: ${b(esc(c.name))}. ${esc(c.text)}` : ""}.<br><br>Phase start always runs ${b("Crisis, Reveal, Bid, Draft")}. Seniors unlock now, and the draft is bigger.`; },
    allow: () => null },

  { id: "r3free", kind: "free", title: "Phase start", hl: () => null,
    text: S => S.step === "bid" ? "Same blind bid as before. Remember that every bid is paid." : S.step === "draft" ? "Draft again. Pick the disciplines your studio needs." : "Resolving…",
    done: S => S.round > 3 || (S.round === 3 && RANK[S.step] >= 3), allow: () => null },

  { id: "wrap", kind: "info", center: true, title: "That is the whole loop", wrap: true,
    text: S => `Every round: ${b("Bid, Income, Hire, Place, Build, Rest, Milestones, Upkeep")}. Every phase starts with ${b("Crisis, Reveal, Bid, Draft")}.<br><br>Still ahead: Production runs to round 8, Polish to round 11, and ${b("Launch in round 12")}. ${S.cfg.poolScoring ? "Scoring is two zero-sum pools: " + b("Progress") + " and " + b("Hype") + ". Your systems, objectives and gate results all feed one of them, " + b("Debt") + " subtracts from Progress, and your VP is your share of each pool." : "The game is scored as four races: " + b("Progress") + " and " + b("Hype") + " (your Marketing is added to Hype at the end) earn VP by rank, while " + b("Debt") + " (most loses most) and " + b("Culture") + " (lowest loses most) cost VP."}<br><br>How do you want to continue?`,
    allow: () => null },
  { id: "full1", kind: "free", title: "Production", hl: () => null, text: S => FREE_HINT(S), done: S => S.round >= 9, allow: () => null },
  { id: "polish", kind: "info", soft: true, title: "Polish begins", btn: "Got it", hl: () => "[data-tut=gates]",
    text: S => `${b("Polish")} runs rounds 9 to 11. Check the ${b("Publisher Gates")}: Alpha Review was due at the end of round 8, and ${b("Beta Review")} (Progress and Hype) is due at the end of round 11. Hype fades every round, so build it late. Keep Tech Debt in check: Gold Master needs it low.`,
    allow: () => null },
  { id: "full2", kind: "free", title: "Polish", hl: () => null, text: S => FREE_HINT(S), done: S => S.round >= 12, allow: () => null },
  { id: "launch", kind: "info", soft: true, title: "Launch", btn: "Got it", hl: () => "[data-tut=gates]",
    text: S => `${b("Round 12 is Launch.")} The last gate, ${b("Gold Master")}, pays 5 VP for ${(S.data.publisherGates[3].reqs[0] || "").replace(" Progress", "")} Progress and Debt under 15%. Spend your skills and gold now: nothing carries over. When the round ends, ${S.cfg.poolScoring ? "final scoring converts everything into your Progress and Hype pools." : "final scoring includes the four race tracks, systems, objectives, milestones and gate results."}`,
    allow: () => null },
  { id: "full3", kind: "free", title: "Launch", hl: () => null, text: S => FREE_HINT(S), done: () => false, allow: () => null }
];

let STEPS;
/* ---------- Variant C tutorial: a full play-through. Every string lives in D.tutorial (Data Studio > Tutorial) ---------- */
let ROWS = null;
function loadRows() {
  ROWS = {}; (D.tutorial || []).forEach(r => { ROWS[r.id] = r; });
  const u = U(), over = u && u.studio && u.studio.data && u.studio.data.tutorial;
  (over || []).forEach(r => { if (r && r.id && ROWS[r.id]) ROWS[r.id] = Object.assign({}, ROWS[r.id], { title: r.title, btn: r.btn, text: r.text }); });
}
const rw = id => { if (!ROWS) loadRows(); return ROWS[id] || { title: "", btn: "", text: "" }; };
const MSG = id => rw(id).text;
// text markup: **bold**, blank line = paragraph, single newline = line break, {token} = live value
function fmt(s, tok) {
  const h = esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
  return h.replace(/\{(\w+)\}/g, (m, k) => tok && tok[k] != null ? tok[k] : m);
}
const hintId = S => ({ hire: "hint_hire", place: "hint_place", build: "hint_build", rest: "hint_rest", milestones: "hint_miles", bid: "free_bid", draft: "free_draft" }[S.step] || "hint_wait");
function tokens(S) {
  const c = S.cfg, p = me(S), gs = S.gateSet && S.gateSet.length ? S.gateSet : S.data.publisherGates;
  const g = gs.find(x => x.phase === 0) || gs[0] || {}, g2 = gs.find(x => x.phase === 1) || gs[1] || {};
  const done = (S.gates || []).find(x => x.phase === 0);
  const crisis = S.crisisCard && S.data.crisis.find(x => x.id === S.crisisCard);
  const t = {
    income: c.income, salaryJr: c.salaryJr, salarySr: c.salarySr, jrCost: c.jrCost, resJr: c.resJr, resSr: c.resSr, hypeDecay: c.hypeDecay,
    draftPool: c.draftPool || 8, picks: S.draft ? S.draft.per : "", recruitCost: c.recruitCost, recruitN: S.recruit ? S.recruit.length : E.recruitSize(S),
    buildDelay: c.buildDelay, crunchGold: c.crunchGold, buildsPerRound: c.buildsPerRound, bank: p.ideas + p.code + p.process + p.buzz,
    convertRate: c.convertRate || 3, refreshGold: c.marketRefreshGold, gateName: esc(g.name || ""), gate2Name: esc(g2.name || ""), gateReqs: esc((g.reqs || []).join(", ")),
    gateEnd: (c.phaseEnds || [])[g.phase || 0] || "", gateFund: g.fund || 0, gatePenalty: g.penalty || 0,
    crisisLine: crisis ? ": <b>" + esc(crisis.name) + "</b>. " + esc(crisis.text) : "",
    nPlayers: S.players.length, goldPerVP: c.goldPerVP || 3, raceFirst: (E.rankTable(c, S.players.length) || [])[0], raceLast: (E.rankTable(c, S.players.length) || []).slice(-1)[0],
    burnLine: c.burnout ? "<br><b>Burnout</b>: an exhausted studio loses VP at the end (" + [3, 4, 5, 6].map(k => k + ": " + (((c.burnVP || {})[k]) || 0)).join(", ") + ")." : "",
    hypeBank: c.hypeBank || 0, trainCost: c.trainCost, trainCulture: c.trainCulture, trainNeeded: c.trainNeeded,
    freeBuild: p.freeBuilds ? "<br><br><b>A free build is on the house this round.</b>" : "",
    burnMax: c.burnMax, burnOverStep: c.burnOverStep, burnOverMax: c.burnOverMax, burnUnpaidMin: c.burnUnpaidMin, burnRelief: c.burnRelief, burnTeamRelief: c.burnTeamRelief,
    energizedCulture: c.energizedCulture, energizedGold: c.energizedGold, burnStrainAt: c.burnStrainAt, burnStrainHype: c.burnStrainHype, burnBenchAt: c.burnBenchAt, burnQuitAt: c.burnQuitAt, burnQuitReset: c.burnQuitReset
  };
  const v2 = !!c.flowV2;
  t.phaseOrder = v2 ? "Crisis, Reveal" : "Crisis, Reveal, Bid, Draft";
  t.roundOrder = v2 ? "<b>Upkeep</b> (not in round 1), <b>Income</b>, a blind <b>Bid</b> for turn order, <b>Draft</b>, <b>Hire</b>, <b>Place</b>, <b>Build</b>, then one <b>Clean up</b> step (Rest and Milestones together)" : "a blind <b>Bid</b> for turn order, then <b>Income</b>, <b>Hire</b>, <b>Place</b>, <b>Build</b>, <b>Rest</b>, <b>Milestones</b>, <b>Upkeep</b>";
  t.incomeNote = v2 ? "Next comes <b>Income</b>: every studio gets " + c.income + "G, so you have gold to bid with, and the hire pool is shown as you bid.\n\n" : "";
  t.restMiles = v2 ? "\n\n<b>This is the Clean up step: Rest and Milestones together.</b> Your Milestones sit at the top, like your hand did in Hire. They are bonus goals, such as \"have 3 Seniors\". When one is met it shows <b>MET</b>: press <b>Cash in</b> to take the gold. A milestone can only be completed during its phase window." : "";
  t.upkeepV2 = v2 ? "\n\nFrom now on every round <b>opens with Upkeep</b>, before Income. There is no Upkeep in round 1." : "";
  t.restTeam = fmt(rw(c.train ? "rest_train" : "rest_nontrain").text, t);
  ["burnStats", "burnRest", "burnUpkeep"].forEach(k => { t[k] = c.burnout ? fmt(rw("burn_" + k.slice(4).toLowerCase()).text, t) : ""; });
  t.gateResult = done ? fmt(rw(done.passed.includes(0) ? "gate_pass" : "gate_miss").text, t) : "";
  t.hint = fmt(rw(hintId(S)).text, t);
  return t;
}
const sysOpt = S => me(S).workers.some(w => w.lvl === "Sr" && !w.placed && E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok));
const srIds = S => me(S).workers.filter(w => w.lvl === "Sr" && !w.placed && E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok)).map(w => w.id);
const convOpt = S => me(S).workers.some(w => !w.placed && E.placementOptions(S, 0, w).some(o => o.ok && o.spot && o.spot.special === "convert"));
const trigOk = (S, w) => { const lv = w.lvl, pl = w.placed; w.lvl = "Sr"; w.placed = false; let ok = false; try { ok = E.placementOptions(S, 0, w).some(o => o.kind === "sys" && o.ok); } finally { w.lvl = lv; w.placed = pl; } return ok; };
const eligibleJr = S => me(S).workers.filter(w => w.lvl === "Jr" && !w.placed && (S.cfg.train ? !w.build && !w.training : w.worked));
// make a step whose title, button and text come from the editable rows
function mk(id, o) {
  const st = Object.assign({ id, rid: id }, o);
  const rowId = () => st.rv ? st.rv() : st.rid;
  Object.defineProperty(st, "title", { get: () => rw(rowId()).title, enumerable: true });
  Object.defineProperty(st, "btn", { get: () => rw(rowId()).btn || "Next", enumerable: true });
  st.text = (S, T) => fmt(rw(st.vid ? st.vid(S) : rowId()).text, tokens(S));
  return st;
}
const info = (id, o) => mk(id, Object.assign({ kind: "info", allow: () => MSG("msg_next") }, o));
const softInfo = (id, o) => info(id, Object.assign({ soft: true, allow: () => null }, o));
const doing = (id, o) => mk(id, Object.assign({ kind: "do" }, o));
const play = (id, o) => mk(id, Object.assign({ kind: "free", allow: () => null }, o));
const reachedRound = (S, r, stage) => S.round > r || (S.round === r && RANK[S.step] >= RANK[stage]);

const STEPS_C = [
  info("welcome", { center: true, hold: true, hl: () => null, allow: () => MSG("msg_start") }),
  /* ---- how you win, before phases and rounds ---- */
  info("win_vp", { center: true, hl: () => null }),
  info("win_races", { hl: () => "[data-tut=tracks]" }),
  info("win_build", { hl: () => "[data-tut=market]" }),
  info("win_lose", { hl: () => ".pt[data-pid='0'] .stats" }),
  info("loop", { hl: () => "[data-tut=steps]" }),
  doing("objectives", { hl: () => ".modal", done: S => !S.dq.some(d => d.t === "keepObj" && d.p === 0), allow: a => a.type === "keepObj" ? null : MSG("msg_obj") }),
  info("phasestart", { hl: () => "[data-tut=steps]" }),
  info("boardintro", { hl: () => "[data-tut=board]" }),
  info("board_backlog", { hl: () => "[data-row=EARN]" }),
  info("board_prototype", { hl: () => "[data-row=PROGRESS]" }),
  info("board_pitch", { hl: () => "[data-row=HYPE]" }),
  info("board_jam", { hl: () => "[data-row=CREW]" }),
  info("board_perks", { hl: () => ".shared" }),
  doing("bid", { hl: () => ".modal", done: S => after(S, "bid", 1), allow: a => a.type !== "bid" ? MSG("msg_bid") : (a.amount > 3 ? MSG("msg_bid_small") : null) }),
  doing("draft", { hl: () => "[data-tut=draftpanel]", done: S => after(S, "draft", 1), allow: a => a.type === "pick" ? null : MSG("msg_draft") }),
  doing("hire", { hl: () => "[data-tut=hand]", done: S => after(S, "hire", 1),
    allow: (a, S) => a.type === "hire" ? (a.lvl === "Jr" ? null : MSG("msg_hire_sr")) : a.type === "discard" ? null :
      a.type === "done" ? (me(S).workers.length < Math.min(2, hireable(S) + me(S).workers.length) ? MSG("msg_hire_min") : null) : MSG("msg_hire_do") }),
  info("placeintro", { hl: () => "[data-tut=board]" }),
  doing("place1", { hl: () => (U().sel == null ? "[data-tut=workers] .wk:not(.placed)" : ".spot.ok"),
    vid: S => !actorIsMe(S) ? "place1w" : U().detail && U().detail.k === "spot" ? "place1c" : U().detail && U().detail.k === "worker" ? "place1d" : U().sel == null ? "place1" : "place1b",
    done: S => after(S, "place", 1) || (S.round === 1 && S.step === "place" && me(S).rs.placed >= 1),
    allow: a => a.type === "place" ? null : a.type === "pass" ? MSG("msg_place_first") : MSG("msg_place") }),
  info("stats", { hl: () => ".pt[data-pid='0'] .stats" }),
  doing("place2", { hl: () => "[data-tut=workers]", done: S => after(S, "place", 1), allow: a => (a.type === "place" || a.type === "pass" || a.type === "recruit") ? null : MSG("msg_place_pass") }),
  doing("build", { hl: () => (U().modal === "market" ? ".modal [data-act=build]:not([disabled])" : "[data-tut=market]"), done: S => after(S, "build", 1),
    allow: (a, S) => a.type === "build" ? null : a.type === "done" ? ((me(S).builds >= 1 || !(canBuildAny(S, false) || (me(S).freeBuilds && canBuildAny(S, true)))) ? null : MSG("msg_build_first")) : MSG("msg_build") }),
  info("build_rd", { hl: () => "[data-spot=rd]" }),
  doing("rest1", { hl: () => "[data-tut=workers]", done: S => after(S, "rest", 1), allow: a => a.type === "train" ? MSG("msg_train_later") : (a.type === "done" || a.type === "fire" || a.type === "swapObj" || a.type === "swapMile" || a.type === "claim") ? null : MSG("msg_rest") }),
  doing("miles", { only: () => !E.rawConfig().flowV2, hl: () => "[data-tut=miles]", done: S => after(S, "milestones", 1), allow: a => (a.type === "claim" || a.type === "done") ? null : MSG("msg_miles") }),
  info("upkeep", { hl: () => "[data-tut=steps]" }),
  info("gates", { hl: () => "[data-tut=gates]" }),
  /* ---- round 2: recruit, rest, crunch ---- */
  play("r2hire", { hl: () => "[data-tut=hand]", done: S => reachedRound(S, 2, "place") }),
  doing("r2recruit", { hl: () => "[data-tut=recruit]", done: S => me(S).recruited >= 1 || S.round > 2,
    allow: (a, S) => (a.type === "place" || a.type === "recruit") ? null : a.type === "pass" ? MSG("msg_recruit") : MSG("msg_recruit") }),
  doing("r2place", { hl: () => "[data-tut=workers]", done: S => reachedRound(S, 2, "build"), allow: a => (a.type === "place" || a.type === "pass" || a.type === "recruit") ? null : MSG("msg_place_pass") }),
  doing("r2crunch", { hl: () => (U().modal === "market" ? ".modal [data-act=build]:not([disabled])" : "[data-tut=market]"), done: S => reachedRound(S, 2, "rest"),
    allow: (a, S) => a.type === "build" ? (a.crunch || (S.cfg.rdCrunch && me(S).rd) ? null : MSG("msg_crunch")) : a.type === "done" ? ((me(S).cs.crunched >= 1 || !(canBuildAny(S, false) || (me(S).freeBuilds && canBuildAny(S, true)))) ? null : MSG("msg_crunch")) : null }),
  play("r3", { hl: () => null, done: S => S.round >= 4 }),
  /* ---- production ---- */
  softInfo("gateresult", { hl: () => "[data-tut=gates]" }),
  softInfo("hype_bank", { hl: () => "[data-tut=tracks]", only: () => !!E.rawConfig().hypeBank }),
  softInfo("crisis", { hl: () => "[data-tut=crisis]" }),
  play("r4play", { hl: () => null, done: S => reachedRound(S, 4, "rest") }),
  doing("promote", { rv: () => (U().S && U().S.cfg.train) ? "promote_train" : "promote", hl: () => "[data-tut=rest]", done: S => me(S).workers.some(w => w.lvl === "Sr") || (S.cfg.flowV2 ? S.round > 4 : reachedRound(S, 4, "milestones")),
    allow: (a, S) => a.type === "claim" ? null : a.type === "train" ? (S.cfg.train && !trigOk(S, me(S).workers.find(w => w.id === a.worker) || {}) && eligibleJr(S).some(w => trigOk(S, w)) ? MSG("msg_promote_fit") : null) : a.type === "promote" ? (eligibleJr(S).some(w => trigOk(S, w)) && !trigOk(S, me(S).workers.find(w => w.id === a.worker) || {}) ? MSG("msg_promote_fit") : null) : a.type === "done" ? (eligibleJr(S).length ? MSG(S.cfg.train ? "msg_promote_train" : "msg_promote") : null) : MSG(S.cfg.train ? "msg_promote_train" : "msg_promote") }),
  doing("trigger", { hl: () => "[data-tut=workers]", done: S => me(S).rs.triggers >= 1 || reachedRound(S, 5, "build") || (S.round >= 5 && !sysOpt(S)),
    allow: (a, S) => a.type === "place" ? (srIds(S).includes(a.worker) && !String(a.target).startsWith("sys:") ? MSG("msg_trigger") : null) : a.type === "pass" ? MSG("msg_trigger") : null }),
  play("prod", { hl: () => null, done: S => S.round >= 9 }),
  softInfo("polish", { hl: () => "[data-tut=gates]" }),
  play("polishfree", { hl: () => null, done: S => S.round >= 12 }),
  /* ---- launch and hand-over ---- */
  doing("convert", { hl: () => ".spot[data-id=convert]", done: S => me(S).cs.converted > 0 || reachedRound(S, 12, "build") || (S.round === 12 && S.step === "place" && !convOpt(S)),
    allow: a => a.type === "pass" ? MSG("msg_convert") : null }),
  info("handover", { final: true, soft: true, hl: () => null, allow: () => null })
];
STEPS = (E.rawConfig().varC ? STEPS_C : STEPS_A).filter(s => !s.only || s.only());

/* ---------- lifecycle ---------- */
SI.tutNew = function () {
  const isC = !!E.rawConfig().varC;
  STEPS = isC ? STEPS_C : STEPS_A; SI.tutSteps = STEPS; loadRows();
  const cfg = isC ? Object.assign(E.defaultConfig(), SI.TUT_CONFIG_C) : Object.assign(E.rawConfig(), SI.TUT_CONFIG);
  const S = E.newGame([{ name: "You", bot: false }, { name: "Rival", bot: true }], { seed: SI.TUT_SEED, config: cfg, data: E.clone(E.defaultData(cfg)) });
  // rig: the first face-up pool shows a mix of all four categories (cards are drawn from the end of the deck)
  ["ADV", "DATA", "PX", "QA", "DES", "ART", "ENG"].forEach(disc => { const i = S.decks.disc.findIndex(c => c.disc === disc); if (i >= 0) S.decks.disc.push(S.decks.disc.splice(i, 1)[0]); });
  return S;
};
SI.tutInit = () => ({ idx: 0, ack: {}, auto: false, gaveFree: false, rev: null });
const cur = () => { const u = U(); return u.tut ? STEPS[Math.min(u.tut.idx, STEPS.length - 1)] : null; };

SI.tutTick = function () {
  const u = U(), T = u.tut; if (!T || !u.S) return;
  const S = u.S; let guard = 0;
  while (T.idx < STEPS.length - 1 && guard++ < 30) {
    const st = STEPS[T.idx];
    const done = st.kind === "info" ? !!T.ack[st.id] : st.done(S, T);
    if (!done) break;
    T.idx++; u.sel = null;
  }
  // rigs: make sure the player can do what the current step teaches
  const st = STEPS[T.idx]; T.gave = T.gave || {};
  const key = st.id + ":" + S.round;
  if (st.id === "build" || st.id === "r2crunch") {
    if (!T.gaveFree && st.id === "build" || (st.id === "r2crunch" && !T.gave[key])) {
      if (actorIsMe(S) && !S.dq.length && S.step === "build") {
        T.gaveFree = true; T.gave[key] = true;
        if (!canBuildAny(S, false) && me(S).freeBuilds < 1) me(S).freeBuilds = 1;
        if (st.id === "r2crunch") me(S).gold += (S.cfg.crunchGold || 2) + 2;   // so a gold crunch is affordable
      }
    }
  }
  if (st.id === "r2recruit" && !T.gave[key] && S.step === "place" && actorIsMe(S)) { T.gave[key] = true; const cost = E.recruitCost(S, 0); if (me(S).gold < cost) me(S).gold = cost; }
  if (st.id === "promote" && !T.gave[key] && S.step === "rest" && actorIsMe(S) && !S.dq.length) {
    T.gave[key] = true;
    // make sure a Junior who fits one of the player's systems can be promoted, so the next lesson (a Senior triggers a system) can be played
    if (S.cfg.train) { const w = me(S).workers.find(x => x.lvl === "Jr" && !x.placed && !x.build && trigOk(S, x)) || me(S).workers.find(x => x.lvl === "Jr" && !x.placed && !x.build); if (w) { w.trained = Math.max(w.trained || 0, S.cfg.trainNeeded - 1); } if (me(S).gold < S.cfg.trainCost) me(S).gold = S.cfg.trainCost; }
    else if (!eligibleJr(S).some(w => trigOk(S, w))) { const w = me(S).workers.find(x => x.lvl === "Jr" && trigOk(S, x)) || (eligibleJr(S).length ? null : me(S).workers.find(x => x.lvl === "Jr")); if (w) { w.worked = true; w.placed = false; } }
  }
};
SI.tutHold = () => SI.tutLockMode() === "hard";
SI.tutGate = function (a) {
  const u = U(), T = u.tut; if (!T || T.auto) return null;
  const st = cur(); if (!st || !st.allow) return null;
  if (a.type === "headhunt") return "Headhunting is an advanced rule for later";
  return st.allow(a, u.S);
};
// hard = nothing but the coach is clickable; soft = the board is locked but popups still work (Crisis decisions)
SI.tutLockMode = function () {
  const u = U(), T = u.tut; if (!T || T.auto || !u.S) return "";
  if (T.rev != null) return "hard";
  const st = cur(); if (!st || st.kind !== "info" || st.wrap) return "";
  return (st.id === "crisis" || st.soft) ? "soft" : "hard";
};
/* Detail popups stay locked until the lesson that teaches them (the draft step: "tap a card to read more"). */
SI.tutAllowsDetail = function () {
  const u = U(), T = u.tut; if (!T || T.auto || !u.S) return true;
  if (T.rev != null) return false;
  const i = SI.tutSteps.findIndex(s => s.id === "draft"); return i < 0 || T.idx >= i;
};
SI.tutBack = function () { const T = U().tut; if (!T) return; if (T.rev == null) T.rev = Math.max(0, T.idx - 1); else T.rev = Math.max(0, T.rev - 1); };
SI.tutFwd = function () { const T = U().tut; if (!T || T.rev == null) return; T.rev++; if (T.rev >= T.idx) T.rev = null; };
SI.tutAck = function () { const T = U().tut, st = cur(); if (T && st) T.ack[st.id] = true; };
SI.tutFinished = function () { const T = U().tut, st = cur(); return !!(T && st && st.final && T.ack[st.id]); };

/* ---------- coach card ---------- */
SI.tutCoach = function () {
  const u = U(), T = u.tut; if (!T) return "";
  const S = u.S; const rv = T.rev != null; const st = rv ? STEPS[T.rev] : cur(); const n = STEPS.length; const at = rv ? T.rev : T.idx;
  const isC = STEPS === STEPS_C, L = (id, fb) => isC ? esc(rw(id).text) : fb;
  if (T.auto) {
    if (S.over) return "";
    return `<div class="coach"><button class="x" data-act="tut-exit" aria-label="Exit tutorial">×</button><div class="cp">Fast-forward</div><div class="ct">Round ${S.round} of 12 · ${esc(D.phases[S.phase].name)}…</div></div>`;
  }
  let body = SI.L(typeof st.text === "function" ? st.text(S, T) : st.text);
  const waiting = !rv && st.kind === "do" && S.dq.length === 0 && E.currentActor(S) > 0;
  const back = at > 0 ? `<button class="btn" data-act="tut-back">${L("ui_back", "← Back")}</button>` : "";
  const stop = isC && !rv && !st.final && !st.center ? `<button class="btn" data-act="tut-free">${L("ui_stop")}</button>` : "";
  let btns = "";
  if (rv) btns = back + `<button class="btn primary" data-act="tut-fwd">${T.rev + 1 >= T.idx ? L("ui_fwd_end", "Back to the game") : L("ui_fwd", "Next")}</button>`;
  else if (st.wrap) btns = `<button class="btn primary" data-act="tut-next">Play the full game with the coach</button><button class="btn" data-act="tut-auto">Fast-forward &amp; explain the score</button><button class="btn" data-act="tut-free">Keep playing without the coach</button>${back}<button class="btn" data-act="tut-exit">Back to menu</button>`;
  else if (st.kind === "info") btns = back + `<button class="btn primary" data-act="tut-next">${esc(st.btn || "Next")}</button>` + stop;
  else btns = back + stop;
  const stepTxt = isC ? fmt(rw("ui_step").text, { n: Math.min(at + 1, n), total: n }) : `Step ${Math.min(at + 1, n)} of ${n}`;
  return `<div class="coach ${st.center ? "center" : ""}">${st.center ? "" : '<button class="x" data-act="tut-exit" aria-label="Exit tutorial">×</button>'}
    <div class="cp">${stepTxt}${rv ? " · " + L("ui_review", "review") : ""}</div><div class="ctt">${esc(st.title)}</div><div class="ct">${body}</div>
    ${waiting ? `<div class="cw">${L("ui_wait", "Rival is taking their turn…")}</div>` : ""}${btns ? `<div class="cb">${btns}</div>` : ""}
    <div class="prog"><i style="width:${Math.round((at + 1) / n * 100)}%"></i></div></div>${st.center ? '<div class="coach-dim"></div>' : ""}`;
};
/* ---------- spotlight: dim everything except the highlighted area (the coach box sits above it) ---------- */
let spotEl = null, spotSel = null;
function spotDraw() {
  const els = spotSel && !document.querySelector('.overlay') ? Array.from(document.querySelectorAll(spotSel)).filter(e => e.getClientRects().length) : [];
  if (!els.length) { if (spotEl) { spotEl.remove(); spotEl = null; } return; }
  const W = window.innerWidth, H = window.innerHeight;
  const holes = els.map(e => { const r = e.getBoundingClientRect(); return `<rect x="${r.left - 6}" y="${r.top - 6}" width="${r.width + 12}" height="${r.height + 12}" rx="10" fill="black"/>`; }).join("");
  if (!spotEl) { spotEl = document.createElement("div"); spotEl.id = "tutspot"; document.body.appendChild(spotEl); }
  spotEl.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><mask id="tsm"><rect width="${W}" height="${H}" fill="white"/>${holes}</mask></defs><rect width="${W}" height="${H}" fill="rgba(0,0,0,.7)" mask="url(#tsm)"/></svg>`;
}
window.addEventListener("scroll", () => { if (spotSel) spotDraw(); }, true);
window.addEventListener("resize", () => { if (spotSel) spotDraw(); });
SI.tutSpotClear = function () { spotSel = null; spotDraw(); };
SI.tutHighlight = function (rootEl) { spotSel = null; try { tutHighlight0(rootEl); } finally { spotDraw(); } };
function tutHighlight0(rootEl) {
  const u = U(), T = u.tut; if (!T || T.auto) return;
  const st = T.rev != null ? STEPS[T.rev] : cur(); if (!st || !st.hl) return;
  if (u.detail) { const acts = rootEl.querySelectorAll('.modal [data-tut=act]:not([disabled])'); if (acts.length) { acts.forEach(el => el.classList.add('tut-hl')); return; } }
  const sel = st.hl(u.S); if (!sel) return;
  try {
    const els = rootEl.querySelectorAll(sel); els.forEach(el => el.classList.add("tut-hl")); if (els.length && !u.detail) spotSel = sel;
    // bring the highlighted area into view (above the coach box), so the player never has to hunt for it
    const el = els[0]; if (el && el.getBoundingClientRect && !u.detail) {
      const r = el.getBoundingClientRect(), coach = rootEl.querySelector(".coach"), cr = coach ? coach.getBoundingClientRect() : null;
      const bottom = cr && cr.top > window.innerHeight * 0.4 ? cr.top - 8 : window.innerHeight;
      if (r.top < 70 || r.bottom > bottom) { const dy = r.height > bottom - 70 ? r.top - 80 : r.top - (70 + Math.max(0, (bottom - 70 - r.height) / 2)); window.scrollBy({ top: dy, behavior: "smooth" }); }
    }
  } catch (e) {}
};

/* ---------- autoplay + score explainer ---------- */
SI.tutAuto = function () { const u = U(), T = u.tut; T.auto = true; u.S.players[0].bot = true; };
const PARTS = [
  ["prodShare", "Progress race", "VP for where your Progress ranks against the other studios: 1st place pays most, ties split the points."],
  ["hypeStrength", "Hype race", "Where your Hype ranks. At the end of the game your Marketing is added to your Hype, so Marketing is permanent buzz while Hype itself fades every round."],
  ["debtPenalty", "Tech Debt", "The studio with the most Debt loses the most VP; the studio with the least loses none. Debt comes from crunched spots and some systems; Quality workers, Engineers and Stability systems clear it."],
  ["culture", "Culture", "The studio with the lowest Culture loses the most VP; the best loses none. Good culture also helps workers stay."],
  ["objectives", "Objectives", "Your secret goals. VP only for the ones you completed."],
  ["synergy", "Synergy", "Bonus when a built system shares a symbol with a completed objective."],
  ["systems", "Systems", "The printed VP on each system you built."],
    ["gold", "Gold", "Leftover gold converts to VP at a fixed rate."],
  ["crisis", "Crisis & Gates", "VP gained or lost from Crisis cards and Publisher Gates (passed gates can pay VP, missed ones cost VP)."]
];
SI.tutScoreExplainer = function (S) {
  const r = S.scores.find(x => x.id === 0); if (!r) return "";
  const isC = !!S.cfg.varC, note = isC ? esc(rw("explain_note").text) : "The bot played your studio after the tutorial, so this score shows the rules rather than your skill. Start a real game to play for it.";
  const PT = PARTS.map(p => isC ? [p[0], rw("explain_" + p[0]).title || p[1], rw("explain_" + p[0]).text || p[2]] : p);
  const q = r.parts;
  if (S.cfg.poolScoring) { const pl = q.pool, row = (n, x, vp, why) => `<tr><td style="white-space:nowrap">${n}</td><td class="mono" style="text-align:right;padding:0 10px">${x.total} pts</td><td class="mono" style="text-align:right;padding:0 10px">${vp.toFixed(1)} VP</td><td class="mute" style="font-size:12px;text-align:left">${why}</td></tr>`;
    return `<div class="explain"><h3>How your ${b(Math.round(r.total) + " VP")} was made</h3><p class="mute" style="margin:2px 0 8px">Everything you do feeds one of two pools. Your VP is your share of each pool.</p><table class="scoretbl"><tbody>${row("Progress pool", pl.P, q.prodShare, "Progress " + Math.round(pl.P.base) + " + systems " + Math.round(pl.P.sys) + " + objectives " + Math.round(pl.P.obj + pl.P.syn) + (pl.P.adj ? " + gates/events " + Math.round(pl.P.adj) : "") + " − Debt " + Math.round(-pl.P.debt))}${row("Hype pool", pl.H, q.hypeStrength, "Hype + Marketing " + Math.round(pl.H.base) + " + systems " + Math.round(pl.H.sys) + " + objectives " + Math.round(pl.H.obj + pl.H.syn) + (pl.H.adj ? " + spotlight " + Math.round(pl.H.adj) : ""))}</tbody></table><p class="mute" style="margin-top:8px">${note}</p></div>`; }
  return `<div class="explain"><h3>How your ${b(Math.round(r.total) + " VP")} was made</h3>
  <p class="mute" style="margin:2px 0 8px">Your row, in plain language. You finished with ${b(S.players[0].debt + " Debt")} and ${b(S.players[0].mktg + " Marketing")}.</p>
  <table class="scoretbl"><tbody>${PT.map(p => `<tr><td style="white-space:nowrap">${esc(p[1])}</td><td class="mono" style="text-align:right;padding:0 10px">${(+q[p[0]]).toFixed(p[0].includes("Share") && !S.cfg.raceScoring ? 1 : 0)}</td><td class="mute" style="font-size:12px;text-align:left">${esc(p[2])}</td></tr>`).join("")}</tbody></table>
  <p class="mute" style="margin-top:8px">${note}</p></div>`;
};

SI.tutSteps = STEPS || STEPS_A;
if (typeof module !== "undefined") module.exports = SI;
})(typeof window !== "undefined" ? window : globalThis);
