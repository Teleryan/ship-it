/* ============================================================
   SHIP IT!: DATA STUDIO
   Edit every rule value, spot, system, milestone, objective and crisis card.
   Changes persist in localStorage (this browser) and apply to NEW games.
   Includes a bot-driven balance simulator.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const E = root.ShipItEngine, B = root.ShipItBot, D = root.SHIPIT_DATA;
const esc = SI.esc;

const CFG_GROUPS = [
  ["Economy", ["startGold","income","jrCost","srCost","srCostPolish","hireDiscard","discardGold","promoCost0","promoCost1","promoCost2","promoCost3","promotionsPerRest","headhuntMult","headhuntComp","headhuntsPerRest"]],
  ["Draft (removed)", ["draftPre2","draftPre","draftProd2","draftProd","draftPol2","draftPol","draftLaunch"]],
  ["Workers & fatigue", ["resJr","resSr","resOver","resCap","crewPartnerCap","sysCostMult","objVPMult","resSubGold","resSubMax","srBonus","srAllowedPreProd","qaAllowedPreProd","lossThreshBase"]],
  ["Systems & cards", ["buildsPerRound","rdDiscount","gatesRandom","slotsPerCategory","handSize","objDraw","objKeep","teamEventCulture","launchMult","crisisEnabled"]],
  ["Tracks", ["culMin","culMax","cultureDecay","hypeDecay","hypeCap","prodCap","debtMode"]],
  ["Recruiting, workers and workstations", ["varC","noSwaps","spotResOr","srSystems","srPromoteOnly","promoFree","promoNeedsRest","overworkCulture","recruitCost","recruitPerRound","recruitMinRound","wsMax","wsKeep","wsFree","wsCost","wsStep","wsLadderFrom","recruitSize2","recruitSize34","recruitSize56","recruitDelta","flowV2","recruitInLaunch","bidEveryRound","bidWinnerOnly","bidWinnerOnly","buildDelay","crunchDelay","crunchGold","rdCrunch","convertRate","gateProgMult","gateHypeMult","sysGoldMult"]],
  ["Burnout and Training", ["train","hypeBank","hypeLeadVP","hypeLeadMin","hypeIncStep","hypeIncMax","smallDrop","smallMax","trainCost","trainCulture","trainNeeded","trainDuration","promoByRest","trainsPerRest","draftMiniDelta","burnout","burnMax","burnOverStep","burnOverMax","burnUnpaidMin","burnUnpaidPer","burnUnpaidMax","burnRelief","burnTeamRelief","burnStrainAt","burnStrainHype","burnBenchAt","burnQuitAt","burnQuitReset","energizedBurnMax","energizedCulture","energizedGold"]],
  ["Lean loop and tuning", ["v2","catchUpOrder","launchCap","raceLinDiv","trainEarly","overCrew","buyoutVP","awardMinN","goldPerVP","recruitOnly","startWorkers","recruitCost","recruitLadder","leanRound","cultureFold","cultureFoldBase"]],
  ["Systems, deck and bots", ["deckBase","deckExtra","sysGoldAdd"]],
  ["Pool scoring (B)", ["poolScoring","poolPot","poolSysMult","poolObjMult","poolDebtMult"]],
  ["Race scoring", ["raceNum","raceDen","baseVP","gatePerReq","gateWin","endBurn","objGraded","objBonus","raceScoring","mktgToHype","raceCurve","racePot","debtLossMax","cultLossMax","trackScoring"]],
  ["Market, scale and gates", ["gateLevelDefs","salaryJr","salarySr","reachFade","maxSystems","marketSize","marketRefreshGold","marketRefreshesPerRound","headhuntCatchUp","gatesEnabled","gateBestVP","gateLossCap","gateContract","objPartial","reachMajorVP","srBuildDiscount","sysVPMult","synergyMult","draftPool","deliveredBonus"]],
  ["Race targets and pool extras", ["mergeMktg","raceEnd","progTarget","hypeTarget","raceTriggerVP","trackLeaderVP","poolGateCap","poolGateMult","poolPassPts","poolFavPts","envLabel"]],
  ["Scoring (older)", ["scoreShareScale","scoreShareNormalize","debtPenaltyMult","debtPenaltyCap","cleanThresh","stdThresh","roughThresh","cleanBonus","blockedPenalty","roughHypeMult","goldPerVP","synergyOn"]]
];
// Only show knobs that still exist in the config (the old variant keys were removed)
for (let i = CFG_GROUPS.length - 1; i >= 0; i--) { CFG_GROUPS[i][1] = CFG_GROUPS[i][1].filter(k => k in D.config && k !== "_meta"); if (!CFG_GROUPS[i][1].length) CFG_GROUPS.splice(i, 1); }
const TUT_TOKENS = "{phaseOrder} {roundOrder} {incomeNote} {restMiles} {upkeepV2} {trainCost} {trainCulture} {trainNeeded} {trainAway} {promoLesson} {promoRest} {restTeam} {burnMax} {burnOverStep} {burnOverMax} {burnUnpaidMin} {burnRelief} {burnTeamRelief} {energizedCulture} {energizedGold} {burnStrainAt} {burnStrainHype} {burnBenchAt} {burnQuitAt} {burnQuitReset} {burnStats} {burnRest} {burnUpkeep} {income} {salaryJr} {salarySr} {jrCost} {resJr} {resSr} {hypeDecay} {draftPool} {picks} {recruitCost} {recruitN} {buildDelay} {crunchGold} {buildsPerRound} {bank} {convertRate} {refreshGold} {gateName} {gate2Name} {gateReqs} {gateEnd} {gateFund} {gatePenalty} {gateResult} {crisisLine} {freeBuild} {hint} {n} {total}";
const COLS = {
  spots: [["id","ID","ro"],["row","Row","sel:rows"],["discs","Disciplines","multi:discs"],["fx","Effect","str"],["r","Skills ×","num"],["debt","Debt","num"],["mode","Mode","sel:modes"],["phases","Phases","multi:phases"],["note","Note","str"]],
  systems: [["name","Name","str"],["cat","Category","sel:cats"],["build","Build","str"],["trig","Trigger","str"],["fx","Effect","str"],["once","Once (on build)","str"],["each","Each","str"],["debt","Debt","num"],["vp","VP","num"],["syn","Syn","num"],["bt","Build rounds (team committed)","num"],["res","Skill","sel:res"],["sym","Symbols (legacy)","multi:syms"]],
  milestones: [["name","Name","ro"],["cat","Category","ro"],["gold","Gold","num"],["phases","Can be cashed in during","multi:phases"],["text","Requirement (rule is coded)","str"]],
  objectives: [["name","Name","str"],["type","Type","ro"],["vp","VP","num"],["reqs","Requirements (; separated)","semi"],["res","Skill","sel:res"],["sym","Symbols (legacy)","multi:syms"]],
  publisherGates: [["name","Name","str"],["phase","Phase (0 to 3)","ro"],["pts","Points scale","num"],["reqs","Requirements (; separated)","semi"],["fund","Funding (Gold)","num"],["vp","VP if passed","num"],["penalty","Penalty","num"],["flavor","Flavor","str"]],
  gatePool: [["name","Name","str"],["phase","Phase (0 to 3)","ro"],["pts","Points scale","num"],["reqs","Requirements (; separated)","semi"],["fund","Funding (Gold)","num"],["vp","VP if passed","num"],["penalty","Penalty","num"],["flavor","Flavor","str"]],
  roles: [["id","Code","ro"],["name","Name","str"],["cat","Team","sel:teams"],["short","Tag","str"],["alt","Tag when swaps are off","str"],["util","Ability (popup text)","str"],["altUtil","Ability when swaps are off","str"],["wild","Can act as (codes, comma separated)","csv"]],
  phases: [["id","Phase","ro"],["name","Name","str"],["color","Colour","str"]],
  teams: [["id","Team","ro"],["color","Colour","str"]],
  symbols: [["id","Symbol","ro"],["glyph","Glyph","str"],["color","Colour","str"],["meaning","Meaning","str"]],
  text: [["id","ID","ro"],["group","Group","ro"],["label","Item","ro"],["text","Wording","str"]],
  crisis: [["name","Name","str"],["deck","Deck","ro"],["kind","Kind","ro"],["text","Rules text","str"],["flavor","Flavor","str"]]
};

const DEFCFG = () => E.defaultConfig();
function dirtyCfg(st, k) { return JSON.stringify(st.config[k]) !== JSON.stringify(DEFCFG()[k]); }
function cellVal(v, kind) { return kind === "csv" || kind === "csvn" || /^multi:/.test(kind) ? (v || []).join(",") : kind === "semi" ? (v || []).join("; ") : (v == null ? "" : v); }


/* ---------- field widgets: drop-downs, check boxes and radios instead of free text ---------- */
const BOOLS = new Set(["train","burnout","reachFade","gateContract","objPartial","mergeMktg","raceEnd","headhuntCatchUp","varC","noSwaps","spotResOr","srSystems","srPromoteOnly","promoFree","promoNeedsRest","recruitInLaunch","rdCrunch","bidEveryRound","bidWinnerOnly","poolScoring","raceScoring","gatesRandom","gatesEnabled","crisisEnabled","synergyOn","headhuntCatchUp","srAllowedPreProd","qaAllowedPreProd","trackScoring","scoreShareNormalize"]);
const CFG_SELECTS = { debtMode: [[1, "Debt as a percent of Progress"], [0, "Raw Debt points"]] };
function optsFor(list, st) {
  const lab = x => ({ ideas: "Ideas", code: "Code", process: "Process", buzz: "Buzz" }[x] || x);
  if (list === "rows") { const r = []; (E.defaultData(E.defaultConfig()).spots.concat(st.data.spots)).forEach(s => { if (!r.includes(s.row)) r.push(s.row); }); return r.map(x => [x, x]); }
  if (list === "modes") return [["", "Default (one per player)"], ["single", "Single worker"], ["shared", "Shared (one each)"], ["multi", "Many workers"], ["open", "Open"]];
  if (list === "cats") return Object.keys(D.categoriesSys || { Innovation: 1, Stability: 1, Reach: 1, Revenue: 1 }).map(x => [x, x]);
  if (list === "res") return [["", "None"]].concat(["ideas", "code", "process", "buzz"].map(x => [x, lab(x)]));
  if (list === "discs") return [["ANY", "Any"]].concat(Object.keys(D.disciplines).map(k => [k, k]));
  if (list === "teams") return Object.keys(D.categories).map(k => [k, k]);
  if (list === "syms") return Object.keys(D.symbols).map(k => [k, k]);
  if (list === "phases") return D.phases.map((p, i) => [i, p.name.replace("Concept", "Con").replace("Production", "Prod")]);
  return [];
}
/* ============================================================
   STUDIO UI LAYER (layout, navigation, labels). Data model, config keys and what is saved are unchanged:
   everything below only decides how the existing keys are grouped, named and laid out.
   The raw key is always shown as a small hint next to the plain-language label.
   ============================================================ */
// load the studio stylesheet (owner-only file, so players never download it)
(function () { if (typeof document === "undefined" || document.getElementById("studio-css")) return; const l = document.createElement("link"); l.id = "studio-css"; l.rel = "stylesheet"; l.href = "studio.css"; document.head.appendChild(l); })();

const EFFECT_HELP = "Comma-separated effects, for example +2 Progress, -1 Debt, +3G, +1 Hype, +1 Wishlists, +1 Culture.";
const ROLE_NAME = c => { const d = D.disciplines && D.disciplines[String(c).toUpperCase()]; return d ? d.name : c; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const SPOT_NAMES = { protosprint: "Proto Sprint", labcrew: "Lab Crew", buildsprint: "Build Sprint", artpush: "Art Push", playsession: "Play Session", artpass: "Art Pass", launchprep: "Launch Prep", pmarket1: "Polish Marketing 1", vslice: "Vertical Slice", crunchbonus: "Crunch Bonus", rd: "R&D", launchcrew: "Launch Crew", warroom: "War Room", opt3: "Optimize 3", test2: "Testing 2", talent1: "Talent", build2: "Build 2", create2: "Create 2", concept2: "Concept 2", proto1: "Prototype 1", market3: "Marketing 3", pitch1: "Pitch 1", pitch2: "Pitch 2", playtest1: "Playtest 1", idea1: "Earn Ideas", code1: "Earn Code", code2: "Earn Code x2", plan1: "Earn Process", plan2: "Earn Process x2", buzz1: "Earn Buzz", buzz2: "Earn Buzz x2" };
const spotName = r => { const id = String(r.id || ""), copy = /_b$/.test(id), base = id.replace(/_b$/, ""); const n = SPOT_NAMES[base] || base.replace(/([a-z])(\d)/g, "$1 $2").replace(/^./, c => c.toUpperCase()); return n + (copy ? " (copy)" : ""); };
const titleCase = s => String(s).toLowerCase().replace(/(^|[\s&])([a-z])/g, (m, a, b) => a + b.toUpperCase());
const DECKS = ["Blue deck (Concept)", "Orange deck (Production)", "Pink deck (Polish)"];
const phaseName = i => (D.phases[i] && D.phases[i].name) || "Phase " + (i + 1);

/* ---------- per-section layout: groups of fields, plain labels, help and units (keyed by the existing column keys) ---------- */
const UI = {
  spots: {
    noun: "board spot", nouns: "Board spots",
    lead: "Every tile workers can be placed on. Pick a tile on the left; the card on the right shows how it reads on the board.",
    title: spotName, sub: r => r.id + " · " + titleCase(r.row), group: r => titleCase(r.row),
    badge: r => (r.phases || []).map(p => `<i class="ph p${p}" title="${esc(phaseName(p))}">${p + 1}</i>`).join(""),
    groups: [
      ["Identity", "Which tile this is.", ["id", "row", "note"]],
      ["Availability", "When the tile is on the board and how many workers it takes.", ["phases", "mode"]],
      ["Who can work here", "Roles that may be placed on the tile.", ["discs"]],
      ["Cost", "What it costs to use the tile.", ["debt"]],
      ["Rewards", "What the placed worker earns.", ["fx", "r"]]
    ],
    f: {
      id: { label: "Tile ID", help: "Fixed. The engine and saved games find the tile by this ID." },
      row: { label: "Board row", help: "Which group of tiles on the board this belongs to." },
      note: { label: "Tooltip text", help: "Rules text shown in the tile's tooltip and detail view.", long: 1 },
      phases: { label: "Open in phases", help: "The tile is only on the board in the ticked phases." },
      mode: { label: "Worker limit", help: "How many workers can use the tile in one round." },
      discs: { label: "Roles allowed", help: "Any = every role. Otherwise only the ticked roles may be placed here." },
      debt: { label: "Tech Debt added", unit: "Debt", help: "Tech Debt the studio takes each time a worker is placed here." },
      fx: { label: "Effect", help: EFFECT_HELP, ph: "+2 Progress, -1 Debt" },
      r: { label: "Skills earned", unit: "× skills", help: "Earn tiles only: how many skills the worker earns." }
    }
  },
  systems: {
    noun: "system", nouns: "Systems",
    lead: "Buildable systems. The card on the right is the same tile players see in the market, plus a plain-language read-out.",
    title: r => r.name, sub: r => r.cat + " · " + r.build, group: r => r.cat,
    badge: r => `<i class="vpb">${r.vp} VP</i>`,
    groups: [
      ["Identity", "Name and type.", ["name", "cat", "sym"]],
      ["Cost to build", "What a studio pays and how long the team is busy.", ["build", "bt", "debt"]],
      ["Trigger", "What a worker must do to activate the system.", ["trig", "res"]],
      ["Rewards", "What the system is worth and gives.", ["vp", "fx", "syn"]],
      ["Special rules", "One-time and alternative effects.", ["once", "each"]]
    ],
    f: {
      name: { label: "Name", help: "Shown on the card and in the market." },
      cat: { label: "Category", help: "Decides which market row the system sits in and which type rule applies." },
      sym: { label: "Symbols (legacy)", help: "Old synergy symbols. Kept for older rules; the main skill below drives synergy." },
      build: { label: "Build cost", help: "Format: a number plus M (skills) or G (Gold), then +Role for each required worker. Example: 4M+Eng+QA or 5G+Adv.", ph: "4M+Eng+QA" },
      bt: { label: "Build time", unit: "rounds", help: "Rounds the building team stays committed." },
      debt: { label: "Tech Debt added", unit: "Debt", help: "Tech Debt the studio takes when the system is built." },
      trig: { label: "Trigger", help: "Who activates it: a count and a role. Example: 1 QA.", ph: "1 QA" },
      res: { label: "Main skill", help: "The skill this system belongs to. Objectives with the same skill score synergy VP." },
      vp: { label: "Victory points", unit: "VP", help: "Printed VP of the built system (multiplied by the System VP multiplier rule)." },
      fx: { label: "Effect when triggered", help: EFFECT_HELP },
      syn: { label: "Synergy value", unit: "points", help: "Synergy points per matching met objective (scaled by the Synergy multiplier rule)." },
      once: { label: "One-time effect on build", help: "Applied once, the moment the system is built. " + EFFECT_HELP },
      each: { label: "Repeating effect", help: "Used instead of Effect when that is empty. " + EFFECT_HELP }
    }
  },
  milestones: {
    noun: "milestone", nouns: "Milestones",
    lead: "Milestone cards. Name, category and the requirement logic are fixed in the engine; Gold reward and phases are tunable.",
    title: r => r.name, sub: r => r.cat + " · " + r.gold + " Gold", group: r => r.cat,
    badge: r => `<i class="vpb">${r.gold}G</i>`,
    groups: [["Identity", "Fixed.", ["name", "cat"]], ["Availability", "", ["phases"]], ["Rewards", "", ["gold"]], ["Special rules", "", ["text"]]],
    f: { name: { label: "Name" }, cat: { label: "Category" }, phases: { label: "Can be cashed in during", help: "Phases in which a studio may claim it." }, gold: { label: "Gold reward", unit: "Gold" }, text: { label: "Requirement wording", help: "Text only. The rule itself is coded in the engine.", long: 1 } }
  },
  objectives: {
    noun: "objective", nouns: "Objectives",
    lead: "Secret objectives. Requirements are matched by text, so keep the wording consistent with the existing cards.",
    title: r => r.name, sub: r => r.type + " · " + r.vp + " VP", group: r => r.type,
    badge: r => `<i class="vpb">${r.vp} VP</i>`,
    groups: [["Identity", "", ["name", "type", "sym"]], ["Requirements", "", ["reqs", "res"]], ["Rewards", "", ["vp"]]],
    f: { name: { label: "Name" }, type: { label: "Type" }, sym: { label: "Symbols (legacy)" }, reqs: { label: "Requirements", help: "Separate requirements with a semicolon, for example 12+ Progress; 2+ Engineer workers.", long: 1 }, res: { label: "Main skill", help: "Systems with the same skill earn synergy VP." }, vp: { label: "Victory points", unit: "VP" } }
  },
  crisis: {
    noun: "crisis card", nouns: "Crisis cards",
    lead: "Crisis cards drawn at the start of each phase. Wording is editable; the card's mechanics are coded.",
    title: r => r.name, sub: r => (DECKS[r.deck] || "Deck " + r.deck) + " · " + r.kind, group: r => DECKS[r.deck] || "Deck " + r.deck,
    badge: r => `<i class="ph p${r.deck}">${r.deck + 1}</i>`,
    groups: [["Identity", "Fixed.", ["name", "deck", "kind"]], ["Rules text", "", ["text"]], ["Flavor", "", ["flavor"]]],
    f: { name: { label: "Name" }, deck: { label: "Deck" }, kind: { label: "Kind", help: "How the card resolves: effect, choice or auction." }, text: { label: "Rules text", long: 1 }, flavor: { label: "Flavor text", long: 1 } }
  },
  publisherGates: {
    noun: "publisher gate", nouns: "Publisher gates",
    lead: "The four review gates, one per phase (used when gates are not drawn at random).",
    title: r => r.name, sub: r => phaseName(r.phase | 0) + " gate", group: r => phaseName(r.phase | 0),
    badge: r => `<i class="vpb">${r.fund}G</i>`
  },
  gatePool: {
    noun: "gate", nouns: "Gate pool",
    lead: "Pool the random gates are drawn from, one per phase.",
    title: r => r.name, sub: r => phaseName(r.phase | 0) + " gate", group: r => phaseName(r.phase | 0),
    badge: r => `<i class="vpb">${r.fund}G</i>`
  },
  roles: {
    noun: "role", nouns: "Roles",
    lead: "Worker roles and their special abilities.",
    title: r => r.name, sub: r => r.id + " · " + r.cat, group: r => r.cat,
    groups: [["Identity", "", ["id", "name", "cat"]], ["Tags", "", ["short", "alt"]], ["Abilities", "", ["util", "altUtil", "wild"]]],
    f: { id: { label: "Code" }, name: { label: "Name" }, cat: { label: "Team" }, short: { label: "Tag" }, alt: { label: "Tag when swaps are off" }, util: { label: "Ability text", help: "Shown in the worker popup.", long: 1 }, altUtil: { label: "Ability text when swaps are off", long: 1 }, wild: { label: "Can act as", help: "Role codes, comma separated, for example DES, DATA." } }
  },
  phases: { noun: "phase", nouns: "Phases", lead: "Names and colours of the four game phases.", title: r => r.name, sub: r => "Phase " + (r.id + 1), f: { id: { label: "Phase" }, name: { label: "Name" }, color: { label: "Colour", help: "A hex colour such as #3498db." } } },
  teams: { noun: "team", nouns: "Teams", lead: "The four worker categories and their colours.", title: r => r.id, sub: r => ((D.categories[r.id] || {}).discs || []).join(", "), f: { id: { label: "Team" }, color: { label: "Colour", help: "A hex colour such as #16a085." } } },
  symbols: { noun: "symbol", nouns: "Symbols", lead: "Legacy synergy symbols.", title: r => r.glyph + " " + r.id, sub: r => r.meaning, f: { id: { label: "Symbol" }, glyph: { label: "Glyph" }, color: { label: "Colour", help: "A hex colour such as #3498db." }, meaning: { label: "Meaning" } } }
};
const GATE_UI = { groups: [["Identity", "", ["name", "phase", "flavor"]], ["Requirements", "What a studio must show to pass.", ["reqs", "pts"]], ["Rewards", "What passing earns.", ["fund", "vp"]], ["Penalty", "What missing costs.", ["penalty"]]], f: { name: { label: "Name" }, phase: { label: "Phase" }, flavor: { label: "Flavor text", long: 1 }, reqs: { label: "Requirements", help: "Separate requirements with a semicolon, for example 3+ Progress; 1+ systems.", long: 1 }, pts: { label: "Points scale", help: "Scales the pool-scoring target for this gate." }, fund: { label: "Funding", unit: "Gold", help: "Gold paid to a studio that passes." }, vp: { label: "VP if passed", unit: "VP" }, penalty: { label: "Penalty", help: "Lost when the gate is missed (VP, or per unmet requirement depending on the rules)." } } };
UI.publisherGates = Object.assign(UI.publisherGates, GATE_UI); UI.gatePool = Object.assign(UI.gatePool, GATE_UI);

const NAV = [
  ["Rules", [["rules", "Rules and numbers"]]],
  ["Board", [["spots", "Board spots"], ["phases", "Phases"], ["roles", "Roles"], ["teams", "Teams"], ["symbols", "Symbols"]]],
  ["Cards", [["systems", "Systems"], ["milestones", "Milestones"], ["objectives", "Objectives"], ["crisis", "Crisis cards"], ["publisherGates", "Publisher gates"], ["gatePool", "Gate pool"]]],
  ["Words", [["tutorial", "Tutorial and text"]]],
  ["Tools", [["sim", "Simulator"], ["@changes", "All changes"], ["@files", "Import / export"], ["@publish", "Publish", "host"]]]
];
const LIST_TABS = ["spots", "systems", "milestones", "objectives", "crisis", "publisherGates", "gatePool", "roles", "phases", "teams", "symbols"];

/* ---------- units and wording for the rule numbers ---------- */
const UNITS = { startGold: "Gold", income: "Gold / round", jrCost: "Gold", srCost: "Gold", srCostPolish: "Gold", discardGold: "Gold", promoCost0: "Gold", promoCost1: "Gold", promoCost2: "Gold", promoCost3: "Gold", recruitCost: "Gold", wsCost: "Gold", wsStep: "Gold", crunchGold: "Gold", resSubGold: "Gold", marketRefreshGold: "Gold", sysGoldAdd: "Gold", salaryJr: "Gold / round", salarySr: "Gold / round", trainCost: "Gold", hypeIncMax: "Gold", energizedGold: "Gold / round", goldPerVP: "Gold per VP", buildDelay: "rounds", crunchDelay: "rounds", trainDuration: "rounds", hypeDecay: "Hype / round", teamEventCulture: "Culture", trainCulture: "Culture", burnMax: "Burnout", burnQuitAt: "Burnout", burnBenchAt: "Burnout", burnStrainAt: "Burnout", burnQuitReset: "Burnout", cleanThresh: "% Debt", stdThresh: "% Debt", roughThresh: "% Debt", gateLossCap: "VP", reachMajorVP: "VP", gateBestVP: "VP", hypeLeadVP: "VP", baseVP: "VP", buyoutVP: "VP", maxSystems: "systems", resCap: "per skill", recruitMinRound: "round", closeFromRound: "round", decayFromRound: "round" };
const GROUP_DESC = {
  "Economy": "Starting Gold, income, and what hiring, promoting and discarding cost.",
  "Draft (removed)": "Left over from the removed draft step. Kept so old tuning still loads.",
  "Workers & fatigue": "Skills earned per placement, exhaustion and system cost scaling.",
  "Systems & cards": "Build limits, card hands, objectives and crisis cards.",
  "Tracks": "Culture, Hype and Progress limits and how they fade.",
  "Recruiting, workers and workstations": "Recruiting pool, workstations, crunch and conversion rules.",
  "Burnout and Training": "The Burnout track and how Juniors train and get promoted.",
  "Lean loop and tuning": "The lean game loop: starting team, recruit prices and Culture folding.",
  "Systems, deck and bots": "Extra system cost and deck size.",
  "Pool scoring (B)": "Older pool-scoring environment (B). Mostly off.",
  "Race scoring": "How Progress, Hype and the other tracks turn into VP.",
  "Market, scale and gates": "The systems market, salaries, Reach, synergy and publisher gates.",
  "Race targets and pool extras": "Targets, triggers and extras for race and pool scoring.",
  "Scoring (older)": "Older scoring thresholds. Kept for comparison."
};
const LEGACY = new Set(["Draft (removed)", "Pool scoring (B)", "Scoring (older)"]);
const TABLE_KEYS = ["gateWin", "hypeBands", "deliveryBands", "cultureVP", "phaseEnds", "rowNames", "raceCurveByN", "racePotByN", "debtLossByN", "cultLossByN", "poolPotN", "progTrack", "mktTrack", "burnVP", "smallDrop", "gateLevelDefs", "botW", "botPersonas", "botProfiles", "closeByN", "dropByN", "bigAdd", "handSizeByN", "mileGoldAdj", "cultAbsVP", "gateHypeMultByN", "gateReqSub", "outsourceJrByN", "outsourceSrByN", "promoGoldByN", "spotFxAdj"];
const TABLE_HELP = { hypeBands: "[[min Hype %, VP], ...]", cultureVP: "Culture value -> VP", phaseEnds: "Last round of Concept, Production, Polish, Launch, e.g. [3,8,11,12]. Must increase.", deliveryBands: "Delivery bonus bands" };

let DEFS = null;
function defs() { if (!DEFS) { const cfg = E.defaultConfig(); DEFS = { cfg, data: E.defaultData(cfg) }; } return DEFS; }
const defRow = (tab, i, row) => tab === "tutorial" ? (defs().data.tutorial.find(x => x.id === (row || {}).id) || {}) : ((defs().data[tab] || [])[i]);

SI.studioRuleGroups = function (st) {
  const seen = new Set(), meta = D.config._meta || {}, out = [];
  const take = keys => keys.filter(k => k in st.config && k !== "_meta" && !seen.has(k) && (seen.add(k), true));
  CFG_GROUPS.forEach(g => { const keys = take(g[1]); if (keys.length) out.push({ title: g[0], desc: GROUP_DESC[g[0]] || "", keys, legacy: LEGACY.has(g[0]) }); });
  const metaKeys = Object.keys(meta);
  const other = take(metaKeys.filter(k => typeof st.config[k] !== "object")), tables = take(TABLE_KEYS.concat(metaKeys.filter(k => typeof st.config[k] === "object")));
  const res = out.filter(g => !g.legacy);
  if (other.length) res.push({ title: "Other settings", desc: "Rule values that are not in one of the groups above.", keys: other });
  if (tables.length) res.push({ title: "Table values (JSON)", desc: "Lists and tables. Edit as JSON; invalid JSON is rejected.", keys: tables, json: true });
  return res.concat(out.filter(g => g.legacy));
};
function cleanLabel(l, k) {
  l = String(l || k).replace(/^(V2|[A-Z]): /, "").replace(/\s*\([A-Z]\)$/, ""); let unit = UNITS[k] || "";
  const m = l.match(/^(.*?)\s*\((Gold|rounds?)\)\s*$/i); if (m) { l = m[1]; if (!unit) unit = m[2]; }
  return { label: l.charAt(0).toUpperCase() + l.slice(1), unit };
}
const isBoolKey = (k, v, help) => BOOLS.has(k) || ((v === 0 || v === 1) && /^1 = /.test(help || "") && typeof DEFCFG()[k] === "number");

/* ---------- small building blocks ---------- */
const attr = (n, v) => ` ${n}="${esc(v)}"`;
function field(o) {
  // o: id, fk, label, key, help, unit, ctl, mod, display, defTxt, wide, hay
  const hay = (o.hay || (o.label + " " + (o.help || "") + " " + o.key)).toLowerCase();
  return `<div class="f${o.mod ? " is-mod" : ""}${o.wide ? " f-wide" : ""}" data-fk="${esc(o.fk)}" data-hay="${esc(hay)}" data-ed="${o.mod ? 1 : 0}">
    <div class="f-lab"><label${o.id ? ` for="${o.id}"` : ""}>${esc(o.label)}</label><code class="f-key" title="Raw key used in the data and in CSV files">${esc(o.key)}</code>${o.display ? '<span class="f-disp" title="Shown on cards and in text only. Gameplay does not change.">Display only</span>' : ""}<span class="f-mod"><span class="f-badge">Modified</span><button type="button" class="f-reset" data-act="st-revert" data-v="${esc(o.fk)}" title="Reset to the shipped default${o.defTxt ? ": " + esc(o.defTxt) : ""}">Reset</button></span></div>
    <div class="f-ctl">${o.ctl}${o.unit ? `<span class="f-unit">${esc(o.unit)}</span>` : ""}</div>
    <div class="f-note"><span class="f-def">Shipped default: <b>${esc(o.defTxt || "(empty)")}</b></span>${o.help ? `<p class="f-help">${esc(o.help)}</p>` : ""}</div></div>`;
}
const fmtV = v => SI.stu2 && SI.stu2.fmt ? SI.stu2.fmt(v) : String(v);
const numCtl = (id, attrs, val, stepSz) => `<div class="num"><button type="button" class="num-b" data-step="-1" aria-label="Decrease" tabindex="-1">−</button><input type="number" step="any" id="${id}" ${attrs} data-sz="${stepSz}" value="${esc(val)}"><button type="button" class="num-b" data-step="1" aria-label="Increase" tabindex="-1">+</button></div>`;
const toggleCtl = (id, attrs, on) => `<label class="tg"><input type="checkbox" role="switch" id="${id}" ${attrs} ${on ? "checked" : ""}><span class="tg-track" aria-hidden="true"></span><span class="tg-txt"> ${on ? "On" : "Off"}</span></label>`;
const stepFor = (cur, def) => (Number.isInteger(+cur) && Number.isInteger(+def)) ? 1 : 0.05;

function cfgField(st, k) {
  const m = (D.config._meta && D.config._meta[k]) || [k, ""], d = defs().cfg, v = st.config[k], mod = !same(v, d[k]), id = "f-cfg-" + k;
  const cl = cleanLabel(m[0], k); let help = m[1] || (TABLE_HELP[k] || ""); if (TABLE_HELP[k]) help = (help && !["hypeBands", "cultureVP", "phaseEnds"].includes(k) ? help : TABLE_HELP[k]);
  let ctl, wide = false;
  if (typeof d[k] === "object" && d[k] !== null) { ctl = `<textarea id="${id}" rows="${Math.min(10, Math.max(3, JSON.stringify(v).length > 160 ? 6 : 3))}" spellcheck="false" data-cfgjson="${k}" class="mono">${esc(JSON.stringify(v))}</textarea>`; wide = true; }
  else if (CFG_SELECTS[k]) ctl = `<select id="${id}" data-cfg="${k}">${CFG_SELECTS[k].map(o => `<option value="${o[0]}" ${+v === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`;
  else if (k === "envLabel") ctl = `<input type="text" id="${id}" data-cfg="${k}" value="${esc(v)}">`;
  else if (isBoolKey(k, v, m[1])) ctl = toggleCtl(id, `data-cfg="${k}"`, !!v);
  else ctl = numCtl(id, `data-cfg="${k}"`, v, stepFor(v, d[k]));
  return field({ id, fk: "cfg:" + k, label: cl.label, key: k, help, unit: cl.unit, ctl, mod, defTxt: typeof d[k] === "boolean" || isBoolKey(k, d[k], m[1]) ? (d[k] ? "On" : "Off") : (CFG_SELECTS[k] ? (CFG_SELECTS[k].find(o => o[0] === +d[k]) || [0, fmtV(d[k])])[1] : fmtV(d[k])), wide });
}

/* ---------- row (tile / system / card) fields ---------- */
const PHASE_OPTS = st => { const pe = st.config.phaseEnds; return D.phases.map((p, i) => { let rng = ""; if (Array.isArray(pe) && pe.length === 4) { const a = i ? pe[i - 1] + 1 : 1, b = pe[i]; rng = a === b ? "R" + a : "R" + a + "–" + b; } return [i, p.name, rng]; }); };
const MODE_OPTS = [["", "Default (single worker)"], ["single", "Single worker"], ["shared", "Shared (one per studio)"], ["multi", "Many workers"], ["open", "Open to all"]];
function roOptions(list, st) { if (list === "modes") return MODE_OPTS; return optsFor(list, st); }
function chipCtl(kind, path, v, st) {
  const k = kind.split(":")[1], cur = (v || []).map(String); let opts;
  if (k === "phases") opts = PHASE_OPTS(st).map(o => ({ v: o[0], t: o[1], s: o[2], c: (D.phases[o[0]] || {}).color }));
  else if (k === "discs") opts = [{ v: "ANY", t: "Any", s: "all roles", c: "#667" }].concat(Object.keys(D.disciplines).map(c => { const d = D.disciplines[c], cat = D.categories[d.cat]; return { v: c, t: c, s: d.name, c: cat && cat.color }; }));
  else if (k === "syms") opts = Object.keys(D.symbols).map(c => ({ v: c, t: D.symbols[c].glyph + " " + c, s: "", c: D.symbols[c].color }));
  else opts = optsFor(kind.split(":")[1], st).map(o => ({ v: o[0], t: String(o[1]), s: "" }));
  return `<div class="mchk chips" role="group">` + opts.map(o => `<label class="chip-t" style="--c:${esc(o.c || "var(--mute)")}"><input type="checkbox" data-mpath="${path}" data-mval="${esc(o.v)}" ${k === "phases" ? 'data-mnum="1"' : ""} ${cur.includes(String(o.v)) ? "checked" : ""}><span><b>${esc(o.t)}</b>${o.s ? `<small>${esc(o.s)}</small>` : ""}</span></label>`).join("") + "</div>";
}
function rowField(tab, i, c, row, st, ui) {
  const key = c[0], kind = c[2], v = row[key], dr = defRow(tab, i, row) || {}, dv = dr[key], fk = tab + "." + i + "." + key, id = "f-" + tab + "-" + i + "-" + key;
  const meta = (ui.f && ui.f[key]) || {}, mod = !same(v, dv), label = meta.label || c[1].replace(/ \(.*$/, ""), path = fk;
  let ctl, wide = false, defTxt = kind.indexOf("multi:") === 0 ? (kind === "multi:phases" ? (dv || []).map(p => phaseName(p)).join(", ") : (dv || []).join(", ")) : fmtV(dv);
  if (kind === "multi:phases" && !(dv || []).length) defTxt = "(none)";
  if (kind === "ro") { let t = v; if (key === "deck") t = DECKS[v] || v; else if (key === "phase" && D.phases[v]) t = phaseName(v) + " (phase " + (v + 1) + ")"; ctl = `<div class="f-ro mono" id="${id}">${esc(t)}</div>`; }
  else if (kind.indexOf("sel:") === 0) { const o = roOptions(kind.split(":")[1], st).slice(); if (v != null && v !== "" && !o.some(x => String(x[0]) === String(v))) o.push([v, v]); ctl = `<select id="${id}" data-path="${path}" data-kind="str">${o.map(x => `<option value="${esc(x[0])}" ${String(x[0]) === String(v == null ? "" : v) ? "selected" : ""}>${esc(x[1])}</option>`).join("")}</select>`; if (kind === "sel:modes") defTxt = (MODE_OPTS.find(x => x[0] === (dv || "")) || [0, fmtV(dv)])[1]; }
  else if (kind.indexOf("multi:") === 0) ctl = chipCtl(kind, path, v, st);
  else if (kind === "num") ctl = numCtl(id, `data-path="${path}" data-kind="num"`, v == null ? 0 : v, stepFor(v, dv));
  else if (kind === "semi" || meta.long || (kind === "str" && String(v || "").length > 70)) { const txt = cellVal(v, kind); ctl = `<textarea id="${id}" rows="${Math.min(8, Math.max(2, Math.ceil(txt.length / 70)))}" data-path="${path}" data-kind="${kind}">${esc(txt)}</textarea>`; wide = true; }
  else ctl = `<input type="text" id="${id}" data-path="${path}" data-kind="${kind}" value="${esc(cellVal(v, kind))}"${meta.ph ? attr("placeholder", meta.ph) : ""}>`;
  const stt = SI.stu2 && SI.stu2.stat ? SI.stu2.stat(tab, key) : "live";
  return field({ id: kind === "ro" || kind.indexOf("multi:") === 0 ? "" : id, fk, label, key, help: meta.help || "", unit: meta.unit || "", ctl, mod: kind === "ro" ? false : mod, display: stt === "display", defTxt: kind === "ro" ? "" : defTxt, wide, hay: label + " " + key + " " + cellVal(v, kind) });
}
function formGroups(tab, i, st) {
  const ui = UI[tab] || {}, cols = COLS[tab], row = st.data[tab][i], by = {}; cols.forEach(c => { by[c[0]] = c; });
  const used = new Set(), groups = (ui.groups || []).map(g => [g[0], g[1], g[2].filter(k => by[k])]).filter(g => g[2].length);
  groups.forEach(g => g[2].forEach(k => used.add(k)));
  const rest = cols.filter(c => !used.has(c[0])).map(c => c[0]); if (rest.length) groups.push([groups.length ? "Other fields" : "Fields", "", rest]);
  return groups.map(g => `<section class="fg"><header><h3>${esc(g[0])}</h3>${g[1] ? `<p>${esc(g[1])}</p>` : ""}</header><div class="fg-body">${g[2].map(k => rowField(tab, i, by[k], row, st, ui)).join("")}</div></section>`).join("");
}
SI.studioLabel = function (k, st) { // friendly "item . field" label for the Changes list
  if (k.indexOf("cfg:") === 0) { const key = k.slice(4), m = (D.config._meta && D.config._meta[key]) || [key]; return cleanLabel(m[0], key).label; }
  const p = k.split("."), row = (st.data[p[0]] || [])[+p[1]], ui = UI[p[0]]; if (!row || !ui || !ui.title) return null;
  const c = (COLS[p[0]] || []).find(x => x[0] === p[2]); return ui.title(row) + " \u00b7 " + (((ui.f || {})[p[2]] || {}).label || (c ? c[1].replace(/ \(.*$/, "") : p[2]));
};
const rowModCount = (tab, i, st) => { const row = st.data[tab][i], dr = defRow(tab, i, row) || {}; return COLS[tab].filter(c => c[2] !== "ro" && !same(row[c[0]], dr[c[0]])).length; };

/* ---------- card previews ---------- */
const fxPills = s => { s = String(s || "").trim(); if (!s) return '<span class="mute">nothing</span>'; return s.split(",").map(p => { p = p.trim(); const neg = /^-/.test(p), bad = /Debt|Burnout/i.test(p) ? !neg : neg; return `<span class="fxp ${/^[+-]/.test(p) ? (bad ? "bad" : "good") : ""}">${esc(p)}</span>`; }).join(""); };
const roleChip = c => { const d = D.disciplines[String(c).toUpperCase()], cat = d && D.categories[d.cat]; return `<span class="rchip" style="--c:${esc(cat ? cat.color : "#667")}" title="${esc(d ? d.name : c)}">${esc(c)}</span>`; };
const phasePills = (arr, st) => PHASE_OPTS(st).map(o => `<span class="pp ${(arr || []).includes(o[0]) ? "on" : ""}" style="--c:${esc((D.phases[o[0]] || {}).color || "#667")}">${esc(o[1])}${o[2] ? `<small>${esc(o[2])}</small>` : ""}</span>`).join("");
const prow = (k, v) => `<div class="pc-r"><span class="pc-k">${esc(k)}</span><div class="pc-v">${v}</div></div>`;
function buildText(b) {
  const m = String(b || "").match(/^(\d+)([MG])((?:\+\w+)*)$/); if (!m) return esc(b || "(none)");
  const roles = m[3] ? m[3].slice(1).split("+").map(ROLE_NAME) : []; let head = m[2] === "G" ? m[1] + " Gold" : m[1] + " skill points";
  try { if (m[2] === "M") { const need = E.buildNeed(E.parseBuild(b)); head = E.resText(need) || head; } } catch (e) {}
  return esc(head) + (roles.length ? ` <span class="mute">+ workers: ${esc(roles.join(" + "))}</span>` : "");
}
function cardOf(tab, r, st) {
  const ui = UI[tab] || {};
  if (tab === "spots") {
    const modeT = (MODE_OPTS.find(x => x[0] === (r.mode || "")) || [0, ""])[1];
    return `<div class="pc pc-spot"><div class="pc-kind">${esc(titleCase(r.row))} · ${esc(modeT)}</div><div class="pc-title">${esc(spotName(r))}</div><div class="pc-chips">${(r.discs || []).map(roleChip).join("") || '<span class="mute">no roles</span>'}</div>`
      + prow("Gives", (r.fx ? fxPills(r.fx) : "") + (r.r ? `<span class="fxp good">Earn ×${esc(r.r)} skills</span>` : "") + (!r.fx && !r.r ? '<span class="mute">nothing</span>' : "")) + prow("Costs", r.debt ? `<span class="fxp bad">+${esc(r.debt)} Tech Debt</span>` : '<span class="mute">nothing</span>') + prow("Open in", `<div class="pps">${phasePills(r.phases, st)}</div>`)
      + (r.note ? `<p class="pc-note">${esc(r.note)}</p>` : "") + `<div class="pc-id mono">${esc(r.id)}</div></div>`;
  }
  if (tab === "systems") {
    let tile = ""; if (SI.sysPreview) { try { tile = `<div class="pc-tile"><div class="mgrid" style="display:block">${SI.sysPreview(r)}</div></div>`; } catch (e) {} }
    const trig = String(r.trig || "").replace(/^(\d+)\s+(\S+)$/, (m, n, k) => n + " × " + ROLE_NAME(k) + " placed");
    return `<div class="pc pc-sys">${tile}<div class="pc-sheet"><div class="pc-sh">In plain words</div>` + prow("Category", esc(r.cat) + (D.typeRules && D.typeRules[r.cat] ? `<div class="pc-sm">${esc(D.typeRules[r.cat])}</div>` : "")) + prow("Cost", buildText(r.build)) + prow("Build time", esc(r.bt) + " round" + (r.bt === 1 ? "" : "s")) + prow("Trigger", esc(trig || "(none)"))
      + prow("Gives", fxPills(r.fx || r.each)) + (r.once ? prow("On build", fxPills(r.once)) : "") + prow("Worth", `<b>${esc(r.vp)} VP</b>${r.debt ? ` <span class="fxp bad">+${esc(r.debt)} Tech Debt</span>` : ""}`) + prow("Synergy", esc(r.syn) + " · skill " + esc(r.res || "none")) + (r.pas ? prow("Passive", esc(r.pas)) : "") + `</div></div>`;
  }
  if (tab === "milestones") return `<div class="pc"><div class="pc-kind">${esc(r.cat)} milestone</div><div class="pc-title">${esc(r.name)}</div>` + prow("Reward", `<span class="fxp good">+${esc(r.gold)} Gold</span>`) + prow("Cash in during", `<div class="pps">${phasePills(r.phases, st)}</div>`) + `<p class="pc-note">${esc(r.text)}</p></div>`;
  if (tab === "objectives") { let sym = ""; try { sym = SI.symTag ? SI.symTag(r) : ""; } catch (e) {} return `<div class="pc"><div class="pc-kind">${esc(r.type)} objective</div><div class="pc-title">${esc(r.name)} ${sym}</div>` + prow("Worth", `<b>${esc(r.vp)} VP</b>`) + prow("Main skill", esc(r.res || "none")) + prow("Needs", (r.reqs || []).map(q => `<div class="pc-req">${esc(q)}</div>`).join("") || '<span class="mute">none</span>') + "</div>"; }
  if (tab === "crisis") { let c = ""; try { c = SI.crisisPreview ? SI.crisisPreview(r) : ""; } catch (e) {} return `<div class="pc pc-crisis">${c}<div class="pc-sheet">` + prow("Deck", esc(DECKS[r.deck] || r.deck)) + prow("Kind", esc(r.kind)) + "</div></div>"; }
  if (tab === "publisherGates" || tab === "gatePool") return `<div class="pc"><div class="pc-kind">${esc(phaseName(r.phase | 0))} gate</div><div class="pc-title">${esc(r.name)}</div>` + prow("Needs", (r.reqs || []).map(q => `<div class="pc-req">${esc(q)}</div>`).join("") || '<span class="mute">none</span>') + prow("Pass", `<span class="fxp good">+${esc(r.fund)} Gold</span>${r.vp ? `<span class="fxp good">+${esc(r.vp)} VP</span>` : ""}`) + prow("Miss", `<span class="fxp bad">${esc(r.penalty)} penalty</span>`) + `<p class="pc-note">${esc(r.flavor)}</p></div>`;
  if (tab === "roles") { const cat = D.categories[r.cat]; return `<div class="pc" style="border-top:4px solid ${esc(cat ? cat.color : "#667")}"><div class="pc-kind">${esc(r.cat)}</div><div class="pc-title">${esc(r.name)} ${roleChip(r.id)}</div>` + prow("Tag", esc(r.short) + (r.alt ? ` <span class="mute">(${esc(r.alt)} when swaps are off)</span>` : "")) + prow("Ability", esc(r.util)) + (r.altUtil ? prow("When swaps are off", esc(r.altUtil)) : "") + ((r.wild || []).length ? prow("Can act as", r.wild.map(roleChip).join("")) : "") + "</div>"; }
  if (tab === "phases") return `<div class="pc" style="border-top:4px solid ${esc(r.color)}"><div class="pc-kind">Phase ${r.id + 1}</div><div class="pc-title">${esc(r.name)}</div>` + prow("Colour", `<span class="sw" style="background:${esc(r.color)}"></span> <span class="mono">${esc(r.color)}</span>`) + "</div>";
  if (tab === "teams") return `<div class="pc" style="border-top:4px solid ${esc(r.color)}"><div class="pc-kind">Team</div><div class="pc-title">${esc(r.id)}</div>` + prow("Colour", `<span class="sw" style="background:${esc(r.color)}"></span> <span class="mono">${esc(r.color)}</span>`) + prow("Roles", ((D.categories[r.id] || {}).discs || []).map(roleChip).join("")) + "</div>";
  if (tab === "symbols") return `<div class="pc"><div class="pc-kind">Symbol</div><div class="pc-title"><span class="glyph" style="color:${esc(r.color)}">${esc(r.glyph)}</span> ${esc(r.id)}</div>` + prow("Meaning", esc(r.meaning)) + "</div>";
  return "";
}
function previewHtml(tab, st, i) {
  const row = st.data[tab][i]; if (!row) return "";
  const base = (defs().data[tab] || [])[i], diff = base && !same(row, base);
  return cardOf(tab, row, st) + (diff ? `<details class="cmp"><summary>Compare with the shipped default</summary>${cardOf(tab, base, st)}</details>` : "");
}

/* ---------- master list ---------- */
function liHtml(tab, i, row, st, sel) {
  const ui = UI[tab] || {}, mod = rowModCount(tab, i, st) > 0;
  return `<span class="li-main"><span class="li-t">${esc(ui.title ? ui.title(row) : row.name || row.id)}</span><span class="li-s">${esc(ui.sub ? ui.sub(row) : "")}</span></span><span class="li-r">${ui.badge ? ui.badge(row) : ""}</span><span class="li-dot" title="Edited from the shipped default"${mod ? "" : " hidden"}></span>`;
}
function listBlock(tab, st, sel, v) {
  const ui = UI[tab] || {}, list = st.data[tab]; let h = "", last = null;
  const groups = []; list.forEach((r, i) => { const g = ui.group ? ui.group(r) : ""; let G = groups.find(x => x.g === g); if (!G) groups.push(G = { g, items: [] }); G.items.push(i); });
  groups.forEach(G => {
    if (ui.group) h += `<div class="li-grp" role="presentation">${esc(G.g)}<span>${G.items.length}</span></div>`;
    G.items.forEach(i => { const r = list[i], mod = rowModCount(tab, i, st) > 0, hay = ((ui.title ? ui.title(r) : "") + " " + (ui.sub ? ui.sub(r) : "") + " " + cols(tab).map(c => cellVal(r[c[0]], c[2])).join(" ")).toLowerCase(); h += `<button type="button" class="li${i === sel ? " on" : ""}" data-act="st-sel" data-v="${i}" data-i="${i}" data-hay="${esc(hay)}" data-ed="${mod ? 1 : 0}" ${i === sel ? 'aria-current="true"' : ""}>${liHtml(tab, i, r, st, sel)}</button>`; });
  });
  return h;
}
const cols = tab => COLS[tab] || [];
function searchBar(v, label, n, noEd) {
  return `<div class="lp-head"><div class="srch"><input id="stq" type="search" placeholder="Search ${esc(label)}" aria-label="Search ${esc(label)}" value="${esc(v.q)}" autocomplete="off"><button type="button" class="srch-x" data-act="st-clearq" aria-label="Clear search" ${v.q ? "" : "hidden"}>×</button></div><div class="lp-row">${noEd ? "" : `<label class="tg sm"><input type="checkbox" data-stf="ed" ${v.ed ? "checked" : ""}><span class="tg-track" aria-hidden="true"></span><span class="tg-txt"> Edited only</span></label>`}<span class="sf-count" aria-live="polite"></span></div></div>`;
}

/* ---------- detail panes ---------- */
function detailHead(tab, i, st) {
  const ui = UI[tab] || {}, row = st.data[tab][i], n = rowModCount(tab, i, st);
  return `<div class="dt-t"><h2>${esc(ui.title ? ui.title(row) : row.name || row.id)}</h2><div class="dt-s">${esc(ui.noun || "")} · <span class="mono">${esc(ui.sub ? ui.sub(row) : "")}</span></div></div><div class="dt-a">${n ? `<span class="pill mod">${n} field${n === 1 ? "" : "s"} edited</span><button type="button" class="btn sm" data-act="st-revertrow" data-v="${tab}.${i}" title="Put every field of this ${esc(ui.noun || "item")} back to the shipped default">Reset this ${esc(ui.noun || "item")}</button>` : '<span class="pill">Matches the shipped default</span>'}</div>`;
}
function listDetail(tab, st, v) {
  const ui = UI[tab] || {}, list = st.data[tab]; if (!list.length) return `<main class="sf-main"><div class="sf-empty"><h3>Nothing here</h3></div></main>`;
  const sel = Math.min(Math.max(0, (v.sel && v.sel[tab]) || 0), list.length - 1);
  return `<main class="sf-main sf-md"><section class="sf-list" aria-label="${esc(ui.nouns)}"><div class="lp-title"><h2>${esc(ui.nouns)}</h2><span>${list.length}</span></div>${searchBar(v, (ui.nouns || tab).toLowerCase(), list.length)}<div class="lp-body" data-scroll="list:${tab}" role="list">${listBlock(tab, st, sel, v)}<div class="lp-none" hidden>No ${esc((ui.nouns || "").toLowerCase())} match.</div></div></section>
  <section class="sf-detail" data-scroll="detail:${tab}:${sel}" aria-label="Edit ${esc(ui.noun || "item")}"><div class="dt-head">${detailHead(tab, sel, st)}</div><p class="dt-lead">${esc(ui.lead || "")} <span class="mute">Fields tagged <span class="f-disp">Display only</span> change wording, not gameplay.</span></p>
  <div class="dt-grid"><div class="dt-form" data-sel="${sel}">${formGroups(tab, sel, st)}</div><aside class="dt-prev" aria-label="Card preview"><details class="prev" open><summary>Card preview</summary><div class="dt-prev-body">${previewHtml(tab, st, sel)}</div></details></aside></div></section></main>`;
}
function rulesDetail(st, v) {
  const groups = SI.studioRuleGroups(st), n = groups.length, sel = Math.min(Math.max(0, v.rg | 0), n - 1), dc = defs().cfg;
  const gMod = g => g.keys.filter(k => !same(st.config[k], dc[k])).length;
  let li = "", legacyHdr = false;
  groups.forEach((g, i) => { if (g.legacy && !legacyHdr) { legacyHdr = true; li += '<div class="li-grp" role="presentation">Older variants</div>'; } li += `<button type="button" class="li${i === sel ? " on" : ""}" data-act="st-rg" data-v="${i}" data-i="${i}" data-rgi="${i}" ${i === sel ? 'aria-current="true"' : ""}><span class="li-main"><span class="li-t">${esc(g.title)}</span><span class="li-s">${g.keys.length} setting${g.keys.length === 1 ? "" : "s"}</span></span><span class="li-r"><i class="vpb rg-n"${gMod(g) ? "" : " hidden"}>${gMod(g)} edited</i></span></button>`; });
  const sections = groups.map((g, i) => { const m = gMod(g); return `<section class="rg" data-rsec="${i}" ${i === sel ? "" : "hidden"}><div class="rg-head"><div class="dt-t"><h2>${esc(g.title)}</h2><div class="dt-s">${esc(g.desc)}${g.legacy ? " <b>Older variant.</b>" : ""}</div></div><div class="dt-a">${m ? `<span class="pill mod">${m} edited</span><button type="button" class="btn sm" data-act="st-revertgrp" data-v="${i}">Reset this group</button>` : '<span class="pill">All at shipped defaults</span>'}</div></div><div class="fg"><div class="fg-body fg-rules">${g.keys.map(k => cfgField(st, k)).join("")}</div></div></section>`; }).join("");
  return `<main class="sf-main sf-md"><section class="sf-list" aria-label="Rule groups"><div class="lp-title"><h2>Rule groups</h2><span>${n}</span></div>${searchBar(v, "all rules", 0)}<div class="lp-body" data-scroll="list:rules" role="list">${li}</div></section>
  <section class="sf-detail" data-scroll="detail:rules:${sel}" aria-label="Rule values"><p class="dt-lead">Every value here is read when a <b>new game starts</b>; changing it changes gameplay. A search looks through <b>all</b> groups at once. <span class="mute">The small code under each name is the raw key used in CSV and JSON files.</span></p><div class="rg-wrap">${sections}<div class="sf-empty rg-none" hidden><h3>No rule matches</h3><p>Try a shorter word, or clear the search.</p></div></div></section></main>`;
}
function textDetail(st, v) {
  const rows = st.data.text || [], tut = st.data.tutorial || [], dd = defs().data, dt = {}; (dd.text || []).forEach(r => { dt[r.id] = r.text; });
  const names = ["Tutorial steps"].concat(Array.from(new Set(rows.map(r => r.group)))), cur = names.includes(v.tg) ? v.tg : names[0];
  const edCount = g => g === "Tutorial steps" ? tut.filter(r => { const d = dd.tutorial.find(x => x.id === r.id) || {}; return ["title", "btn", "text"].some(f => (r[f] || "") !== (d[f] || "")); }).length : rows.filter(r => r.group === g && (r.text || "") !== (dt[r.id] || "")).length;
  const cnt = g => g === "Tutorial steps" ? tut.length : rows.filter(r => r.group === g).length;
  const li = names.map((g, i) => { const e = edCount(g); return `<button type="button" class="li${g === cur ? " on" : ""}" data-act="st-tg" data-v="${esc(g)}" data-i="${i}" ${g === cur ? 'aria-current="true"' : ""}><span class="li-main"><span class="li-t">${esc(g)}</span><span class="li-s">${cnt(g)} entries</span></span><span class="li-r"><i class="vpb"${e ? "" : " hidden"}>${e} edited</i></span></button>`; }).join("");
  let body = "";
  if (cur === "Tutorial steps") {
    body = `<p class="dt-lead">${tut.length} tutorial strings. Edits apply to the <b>next tutorial</b> you start. Markup: <span class="mono">**bold**</span>; a blank line starts a new paragraph; <span class="mono">{token}</span> is replaced by a live value, so keep a token if the sentence needs the number.</p><details class="tok"><summary>Show available {tokens}</summary><div class="mono">${esc(TUT_TOKENS)}</div></details>`;
    body += tut.map((row, i) => { const d = dd.tutorial.find(x => x.id === row.id) || {}, fm = f => !same(row[f] || "", d[f] || ""), ed = ["title", "btn", "text"].some(fm), hay = [row.id, row.when, row.title, row.btn, row.text].join(" ").toLowerCase();
      const fl = (f, label, long) => { if (!(row[f] || d[f]) && f !== "text") return ""; const id = `f-tutorial-${i}-${f}`, ctl = long ? `<textarea id="${id}" rows="${Math.min(12, Math.max(3, Math.ceil((row.text || "").length / 90) + (row.text || "").split("\n").length - 1))}" data-path="tutorial.${i}.${f}" data-kind="str">${esc(row[f])}</textarea>` : `<input type="text" id="${id}" data-path="tutorial.${i}.${f}" data-kind="str" value="${esc(row[f])}">`; return field({ id, fk: `tutorial.${i}.${f}`, label, key: f, ctl, mod: fm(f), defTxt: fmtV(d[f] || ""), wide: long, hay: "" }); };
      return `<section class="fg ent" data-hay="${esc(hay)}" data-ed="${ed ? 1 : 0}"><header><h3><span class="mono">${esc(row.id)}</span></h3><p>${esc(row.when)}</p></header><div class="fg-body">${fl("title", "Title")}${fl("btn", "Button label")}${fl("text", "Text", true)}</div></section>`; }).join("");
  } else {
    body = `<p class="dt-lead">Wording shown around the game. <span class="f-disp">Display only</span> Changes show after <b>Apply to game</b> and a reload.</p>`;
    body += rows.map((row, i) => { if (row.group !== cur) return ""; const d = dt[row.id] || "", ed = (row.text || "") !== d, id = `f-text-${i}-text`; return `<section class="fg ent" data-hay="${esc((row.label + " " + row.text).toLowerCase())}" data-ed="${ed ? 1 : 0}"><div class="fg-body">${field({ id, fk: `text.${i}.text`, label: row.label, key: row.id, ctl: `<textarea id="${id}" rows="${Math.min(8, Math.max(2, Math.ceil((row.text || "").length / 80)))}" data-path="text.${i}.text" data-kind="str">${esc(row.text)}</textarea>`, mod: ed, defTxt: fmtV(d), wide: true, display: true, hay: "" })}</div></section>`; }).join("");
  }
  return `<main class="sf-main sf-md"><section class="sf-list" aria-label="Wording groups"><div class="lp-title"><h2>Wording</h2><span>${names.length}</span></div>${searchBar(v, esc(cur), 0)}<div class="lp-body" data-scroll="list:tutorial" role="list">${li}</div></section><section class="sf-detail" data-scroll="detail:tutorial:${esc(cur)}" aria-label="Wording">${body}<div class="sf-empty ent-none" hidden><h3>No entries match</h3><p>The search covers the selected group only.</p></div></section></main>`;
}
function simPane(sim) {
  return `<main class="sf-main"><div class="sf-single" data-scroll="single:sim"><div class="pg-head"><h2>Simulator</h2><p>Runs bot-only games with the values currently in the Studio and reports where the VP comes from. Use it to tune the economy before human playtests.</p></div>
  <section class="fg"><div class="fg-body sim-form"><div class="f"><div class="f-lab"><label for="sim-n">Players</label></div><div class="f-ctl"><select id="sim-n">${[2, 3, 4, 5, 6].map(n => `<option ${((sim && sim.n) || 4) === n ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
  <div class="f"><div class="f-lab"><label for="sim-g">Games</label></div><div class="f-ctl"><input id="sim-g" type="number" min="1" max="500" value="${(sim && sim.games) || 100}"><span class="f-unit">1 to 500</span></div></div>
  <div class="sim-go"><button type="button" class="btn primary" data-act="sim-run">Run simulation</button>${sim && sim.running ? `<span class="mute">Running ${sim.done}/${sim.games}</span><span class="prog"><i style="width:${Math.round(sim.done / sim.games * 100)}%"></i></span>` : ""}</div></div></section>${sim && sim.res ? `<div class="sim-res">${renderSim(sim.res)}</div>` : ""}</div></main>`;
}
function singlePane(title, lead, inner, searchable, v) {
  return `<main class="sf-main"><div class="sf-single" data-scroll="single:${esc(title)}"><div class="pg-head"><h2>${esc(title)}</h2><p>${esc(lead)}</p>${searchable ? searchBar(v, "changes", 0, true).replace('class="lp-head"', 'class="lp-head inline"') : ""}</div>${inner}</div></main>`;
}

/* ---------- left rail ---------- */
function railInner(st, tab, view, X, v) {
  const counts = X.counts(st), total = Object.keys(counts).reduce((a, k) => a + counts[k], 0), host = SI.U.hosted;
  const active = id => id.charAt(0) === "@" ? view === id.slice(1) : (view === "table" && tab === id);
  let h = NAV.map(g => { const items = g[1].filter(it => it[2] !== "host" || host); if (!items.length) return ""; return `<div class="nv-grp"><div class="nv-h">${esc(g[0])}</div>` + items.map(it => { const n = it[0] === "@changes" ? total : (counts[it[0]] || 0); return `<button type="button" class="nv${active(it[0]) ? " on" : ""}" data-act="st-nav" data-v="${it[0]}" ${active(it[0]) ? 'aria-current="page"' : ""}><span class="nv-t">${esc(it[1])}</span><span class="nv-b"${n ? "" : " hidden"}>${n}</span></button>`; }).join("") + "</div>"; }).join("");
  return h;
}
function railSum(st, X) {
  const counts = X.counts(st), total = Object.keys(counts).reduce((a, k) => a + counts[k], 0), secs = Object.keys(counts).length;
  return `<div class="rail-sum"><b>${total} edited value${total === 1 ? "" : "s"}</b><span>${total ? `in ${secs} section${secs === 1 ? "" : "s"}. The gold numbers above show which.` : "Nothing differs from the shipped defaults."}</span>${total ? '<button type="button" class="btn sm" data-act="st-nav" data-v="@changes">Review all changes</button>' : ""}</div>`;
}

SI.renderStudio = function (st, tab, sim, extra) {
  DEFS = null; const X = SI.stu2, v = X.state(), view = v.view === "table" || !v.view ? "table" : v.view;
  if (view === "publish" && !SI.U.hosted) v.view = "table";
  let main;
  if (view === "changes") main = singlePane("All changes", "Every value that differs from the shipped defaults, across all sections. Reset puts a single value back.", X.changes(st), true, v);
  else if (view === "files") main = singlePane("Import and export", "Round-trip the data through spreadsheets or JSON files.", X.filesPanel(), false, v);
  else if (view === "publish") main = singlePane("Publish", "Send the draft to the test or live site.", X.publishPanel(), false, v);
  else if (tab === "rules") main = rulesDetail(st, v);
  else if (tab === "tutorial") main = textDetail(st, v);
  else if (tab === "sim") main = simPane(sim);
  else if (LIST_TABS.includes(tab)) main = listDetail(tab, st, v);
  else main = singlePane("Studio", "Choose a section on the left.", "", false, v);
  return X.head(st, extra) + `<div class="sf-body"><nav class="sf-rail" aria-label="Studio sections"><div class="sf-rail-in" data-scroll="rail">${railInner(st, tab, view, X, v)}</div><div class="sf-rail-sum">${railSum(st, X)}</div></nav>${main}</div>`;
};

/* ---------- live updates while editing (no full re-render, so focus and typing are never lost) ---------- */
function isMod(st, fk) {
  const d = defs(); if (fk.indexOf("cfg:") === 0) { const k = fk.slice(4); return !same(st.config[k], d.cfg[k]); }
  const p = fk.split("."), row = (st.data[p[0]] || [])[+p[1]]; return !same(row && row[p[2]], (defRow(p[0], +p[1], row) || {})[p[2]]);
}
SI.studioChrome = function () {
  const U = SI.U, st = U.studio, X = SI.stu2, v = X && X.state(); const rail = document.querySelector(".sf-rail-in"); if (!rail || !st) return;
  rail.innerHTML = railInner(st, U.tab, v.view === "table" || !v.view ? "table" : v.view, X, v); const rs = document.querySelector(".sf-rail-sum"); if (rs) rs.innerHTML = railSum(st, X);
  const tab = U.tab; if (v.view && v.view !== "table") return;
  if (tab === "rules") { const groups = SI.studioRuleGroups(st), dc = defs().cfg; groups.forEach((g, i) => { const m = g.keys.filter(k => !same(st.config[k], dc[k])).length; const b = document.querySelector(`.li[data-rgi="${i}"] .rg-n`); if (b) { b.hidden = !m; b.textContent = m + " edited"; } const sec = document.querySelector(`[data-rsec="${i}"] .dt-a`); if (sec) sec.innerHTML = m ? `<span class="pill mod">${m} edited</span><button type="button" class="btn sm" data-act="st-revertgrp" data-v="${i}">Reset this group</button>` : '<span class="pill">All at shipped defaults</span>'; }); }
};
SI.studioSync = function (t) {
  const U = SI.U, st = U.studio, tab = U.tab, v = SI.stu2.state(); defs();
  const wrap = t.closest(".f"); if (wrap) { const m = isMod(st, wrap.dataset.fk); wrap.classList.toggle("is-mod", m); wrap.dataset.ed = m ? 1 : 0; const ent = wrap.closest(".ent"); if (ent) { ent.dataset.ed = ent.querySelector(".f.is-mod") ? 1 : 0; } }
  if (LIST_TABS.includes(tab) && (!v.view || v.view === "table")) {
    const sel = +(document.querySelector(".dt-form") || {}).dataset.sel, row = st.data[tab][sel];
    if (row) { const li = document.querySelector(`.li[data-i="${sel}"]`); if (li) { li.innerHTML = liHtml(tab, sel, row, st, sel); li.dataset.ed = rowModCount(tab, sel, st) > 0 ? 1 : 0; } const hd = document.querySelector(".dt-head"); if (hd) hd.innerHTML = detailHead(tab, sel, st); const pv = document.querySelector(".dt-prev-body"); if (pv) pv.innerHTML = previewHtml(tab, st, sel); }
  }
  if (tab === "tutorial" && v.view !== "changes") { const dd = defs().data; const li = document.querySelector(".li.on .vpb"); if (li) { const cur = v.tg || "Tutorial steps", tut = st.data.tutorial || [], rows = st.data.text || [], dt = {}; (dd.text || []).forEach(r => { dt[r.id] = r.text; }); const e = cur === "Tutorial steps" ? tut.filter(r => { const d = dd.tutorial.find(x => x.id === r.id) || {}; return ["title", "btn", "text"].some(f => (r[f] || "") !== (d[f] || "")); }).length : rows.filter(r => r.group === cur && (r.text || "") !== (dt[r.id] || "")).length; li.hidden = !e; li.textContent = e + " edited"; } }
  SI.studioFilter();
};
/* search + "edited only": show or hide list items, fields, groups and entries */
SI.studioFilter = function () {
  const root = document.querySelector(".sf"), v = SI.stu2 && SI.stu2.state(); if (!root || !v) return;
  const q = (v.q || "").toLowerCase(), ed = v.ed, U = SI.U;
  const ok = el => (!q || el.dataset.hay.includes(q)) && (!ed || el.dataset.ed === "1");
  let shown = 0, total = 0;
  if (U.tab === "rules" && (!v.view || v.view === "table")) {
    const filtering = !!(q || ed); let anySec = false;
    document.querySelectorAll("[data-rsec]").forEach(sec => { const idx = +sec.dataset.rsec, cur = idx === Math.min(v.rg | 0, document.querySelectorAll("[data-rsec]").length - 1); let n = 0, tot = 0; sec.querySelectorAll(".f").forEach(f => { tot++; const k = ok(f); f.hidden = !k; if (k) n++; }); total += tot; shown += n; const vis = filtering ? n > 0 : cur; sec.hidden = !vis; if (vis) anySec = true; const hd = sec.querySelector(".rg-head"); if (hd) hd.hidden = false; });
    const none = document.querySelector(".rg-none"); if (none) none.hidden = anySec;
    document.querySelectorAll(".sf-list .li").forEach(li => { li.classList.toggle("dim", filtering && !!document.querySelector(`[data-rsec="${li.dataset.rgi}"]`) && document.querySelector(`[data-rsec="${li.dataset.rgi}"]`).hidden); });
  } else {
    document.querySelectorAll(".lp-body .li[data-hay]").forEach(el => { total++; const k = ok(el); el.hidden = !k; if (k) shown++; });
    document.querySelectorAll(".lp-body .li-grp").forEach(g => { let n = g.nextElementSibling, any = false; while (n && !n.classList.contains("li-grp") && !n.classList.contains("lp-none")) { if (!n.hidden) any = true; n = n.nextElementSibling; } g.hidden = !any; });
    const ln = document.querySelector(".lp-none"); if (ln) ln.hidden = !(total && !shown);
    const ents = document.querySelectorAll(".sf-detail .ent, .sf-chg .chg-r"); if (ents.length) { let es = 0; ents.forEach(e => { total = ents.length; const k = ok(e); e.hidden = !k; if (k) es++; }); shown = es; document.querySelectorAll(".sf-chg [data-hay-sec]").forEach(s => { s.hidden = !s.querySelector(".chg-r:not([hidden])"); }); const en = document.querySelector(".ent-none"); if (en) en.hidden = !(ents.length && !es); }
  }
  const cnt = document.querySelector(".sf-count"); if (cnt) cnt.textContent = (q || ed) ? (U.tab === "rules" && (!v.view || v.view === "table") ? shown + " of " + total + " settings" : shown + " of " + total) : "";
  const x = document.querySelector(".srch-x"); if (x) x.hidden = !v.q;
};
/* scroll positions survive the full re-render; focus returns to what the user just chose */
const SCR = {};
document.addEventListener("scroll", e => { const t = e.target; if (t && t.dataset && t.dataset.scroll) SCR[t.dataset.scroll] = t.scrollTop; }, true);
SI.studioAfter = function () {
  const root = document.querySelector(".sf"); if (!root) return;
  const v = SI.stu2 && SI.stu2.state();
  document.querySelectorAll("[data-scroll]").forEach(el => { const s = SCR[el.dataset.scroll]; if (s) el.scrollTop = s; });
  SI.studioFilter();
  if (!root.contains(document.activeElement) && !(v && v.refocus)) { const f = root.querySelector(".nv.on") || root.querySelector("button"); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
  if (v && v.refocus) { const el = document.querySelector(v.refocus); v.refocus = null; if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } const pane = el.closest("[data-scroll]"); if (pane && el.classList.contains("li")) { const a = el.getBoundingClientRect(), b = pane.getBoundingClientRect(); if (a.top < b.top || a.bottom > b.bottom) el.scrollIntoView({ block: "nearest" }); } } }
};
/* number steppers, JSON validity, keyboard */
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest(".num-b"); if (!b) return; const inp = b.parentNode.querySelector("input"); if (!inp) return;
  const sz = parseFloat(inp.dataset.sz) || 1, cur = parseFloat(inp.value) || 0, nv = Math.round((cur + sz * (+b.dataset.step)) * 1e6) / 1e6; inp.value = nv; inp.focus(); inp.dispatchEvent(new Event("change", { bubbles: true }));
});
document.addEventListener("input", e => {
  const t = e.target; if (t && t.dataset && t.dataset.cfgjson) { let okj = true; try { JSON.parse(t.value); } catch (er) { okj = false; } t.classList.toggle("bad", !okj); }
});
document.addEventListener("focusin", e => { const r = document.querySelector(".sf"); if (r && e.target && e.target.nodeType === 1 && !r.contains(e.target)) { const f = r.querySelector(".nv.on") || r.querySelector("button"); if (f) f.focus({ preventScroll: true }); } });
document.addEventListener("keydown", e => {
  if (!document.querySelector(".sf")) return; const t = e.target, tag = t && t.tagName;
  if (e.key === "Escape" && !(document.getElementById("root") || document.body).contains(t)) { const x = document.querySelector(".sf .x"); if (x) x.click(); return; } // focus was lost to <body>: the game's own handler never sees the key
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag)) { const q = document.getElementById("stq"); if (q) { e.preventDefault(); q.focus(); q.select(); } return; }
  if (t && t.classList && t.classList.contains("li") && ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
    const items = Array.from(t.closest(".lp-body").querySelectorAll(".li")).filter(x => !x.hidden), i = items.indexOf(t); let n = e.key === "ArrowDown" ? items[i + 1] : e.key === "ArrowUp" ? items[i - 1] : e.key === "Home" ? items[0] : items[items.length - 1];
    if (n) { e.preventDefault(); n.click(); }
  }
});

function renderSim(r) {
  const parts = [["prodShare","Progress share"],["mktShare","Wishlists share"],["hypeStrength","Hype (race)"],["delivery","Delivery"],["debtPenalty","Debt pen."],["culture","Culture"],["objectives","Objectives"],["synergy","Synergy"],["systems","Systems"],["launch","Launch"],["reach","Reach spotlight"],["gold","Gold→VP"],["crisis","Crisis VP"]];
  let h = `<div class="panel"><h3>Results: ${r.players}P × ${r.games} games</h3><div class="row wrap" style="gap:24px"><div class="st"><small>Avg winner VP</small><b class="mono" style="font-size:22px">${r.winAvg.toFixed(1)}</b></div><div class="st"><small>Avg gap winner−last</small><b class="mono" style="font-size:22px">${r.gap.toFixed(1)}</b></div><div class="st"><small>Avg gap winner−2nd</small><b class="mono" style="font-size:22px">${r.gap2.toFixed(1)}</b></div><div class="st"><small>Avg player VP</small><b class="mono" style="font-size:22px">${r.avg.toFixed(1)}</b></div><div class="st"><small>Winners in 38-68 VP</small><b class="mono" style="font-size:22px">${(r.inr / r.games * 100).toFixed(0)}%</b></div><div class="st"><small>Blowouts (25+ VP over 2nd)</small><b class="mono" style="font-size:22px">${(r.blow / r.games * 100).toFixed(0)}%</b></div></div></div>`;
  h += '<div class="panel" style="margin-top:8px"><h3>Where the average player’s VP comes from</h3>';
  const mx = Math.max.apply(null, parts.map(p => Math.abs(r.parts[p[0]]))) || 1;
  parts.forEach(p => { const v = r.parts[p[0]]; h += `<div class="row" style="margin:3px 0"><div style="width:110px" class="mute">${p[1]}</div><div class="bar grow"><i style="width:${Math.abs(v) / mx * 100}%;background:${v < 0 ? "var(--bad)" : "var(--prod)"}"></i></div><div class="mono" style="width:60px;text-align:right">${v.toFixed(1)}</div></div>`; });
  h += "</div>";
  h += `<div class="panel" style="margin-top:8px"><h3>Average end state per player</h3><div class="row wrap" style="gap:18px">` + [["Gold","gold"],["Progress","prod"],["Wishlists","mktg"],["Hype","hype"],["Debt","debt"],["Culture","culture"],["Systems","systems"],["Workers","workers"],["Milestones cashed","miles"]].map(x => `<div class="st"><small>${x[0]}</small><b>${r.stats[x[1]].toFixed(1)}</b></div>`).join("") + `</div>
  <p class="mute" style="margin:8px 0 0">Launch outcomes: ` + Object.keys(r.thr).map(k => `${k} ${(r.thr[k] / (r.games * r.players) * 100).toFixed(0)}%`).join(" · ") + ` · Win rate by seat: ` + r.seatWin.map((w, i) => `P${i + 1} ${(w / r.games * 100).toFixed(0)}%`).join(", ") + "</p></div>";
  if (r.c && (r.c.rc || r.c.bd || r.c.cr || r.c.cv)) h += `<div class="panel" style="margin-top:8px"><h3>Team and economy (average per player)</h3><div class="row wrap" style="gap:18px">` + [["Seniors", r.c.sr], ["Recruited", r.c.rc], ["Finished systems", r.c.fin], ["Unfinished systems", r.c.bd], ["Rushed builds", r.c.cr], ["Worker-rounds on build teams", r.c.cw], ["Skills converted", r.c.cv]].map(x => `<div class="st"><small>${x[0]}</small><b class="mono">${x[1].toFixed(1)}</b></div>`).join("") + "</div></div>";
  return h;
}

SI.simRun = function (st, n, games, onProgress, onDone) {
  const res = { inr: 0, blow: 0, c: { sr: 0, rc: 0, bd: 0, cr: 0, cv: 0, sy: 0, cw: 0, fin: 0 }, players: n, games, winAvg: 0, gap: 0, gap2: 0, avg: 0, parts: {}, stats: { gold: 0, prod: 0, mktg: 0, hype: 0, debt: 0, culture: 0, systems: 0, workers: 0, miles: 0 }, thr: { CLEAN: 0, STANDARD: 0, ROUGH: 0, BLOCKED: 0 }, seatWin: new Array(n).fill(0) };
  let done = 0, errors = 0;
  function chunk() {
    const stop = Math.min(games, done + 4);
    for (; done < stop; done++) {
      const seats = []; for (let i = 0; i < n; i++) seats.push({ name: "P" + (i + 1), bot: true });
      let S; try { S = E.newGame(seats, { seed: 1000 + done, config: E.clone(st.config), data: E.clone(st.data) }); B.run(S, 30000); } catch (e) { errors++; continue; }
      if (!S.over) { errors++; continue; }
      const t = S.scores.map(s => s.total).sort((a, b) => b - a);
      res.winAvg += t[0]; if (t[0] >= 38 && t[0] <= 68) res.inr++; if (t[0] - t[1] >= 25) res.blow++; res.gap += t[0] - t[t.length - 1]; res.gap2 += t[0] - t[1]; res.avg += t.reduce((a, b) => a + b, 0) / n; res.seatWin[S.winner]++;
      S.scores.forEach(sc => { Object.keys(sc.parts).forEach(k => { if (typeof sc.parts[k] === "number" && !["total","debtPct","hypePct","prodPct"].includes(k)) res.parts[k] = (res.parts[k] || 0) + sc.parts[k] / (games * n); }); res.thr[sc.parts.threshold]++; });
      S.players.forEach(p => { const kc = 1 / (games * n); res.c.sr += p.workers.filter(w => w.lvl === "Sr").length * kc; res.c.rc += ((p.cs && p.cs.recruits) || 0) * kc; res.c.bd += (p.building || []).length * kc; res.c.cr += ((p.cs && p.cs.crunched) || 0) * kc; res.c.cv += ((p.cs && p.cs.converted) || 0) * kc; res.c.cw += ((p.cs && p.cs.crewRounds) || 0) * kc; res.c.fin += p.systems.length * kc; });
      S.players.forEach(p => { const k = 1 / (games * n); res.stats.gold += p.gold * k; res.stats.prod += p.prod * k; res.stats.mktg += p.mktg * k; res.stats.hype += p.hype * k; res.stats.debt += p.debt * k; res.stats.culture += p.culture * k; res.stats.systems += p.systems.length * k; res.stats.workers += p.workers.length * k; res.stats.miles += p.claimed.length * k; });
    }
    onProgress(done);
    if (done < games) setTimeout(chunk, 0); else { const ok = Math.max(1, games - errors); ["winAvg","gap","gap2","avg"].forEach(k => res[k] /= ok); res.errors = errors; onDone(res); }
  }
  setTimeout(chunk, 0);
};

// apply an input change to the studio state; returns true if handled
SI.studioChange = function (st, el) {
  if (el.dataset.mpath) { const [list, i, f] = el.dataset.mpath.split("."); const boxes = Array.from(document.querySelectorAll('input[data-mpath="' + el.dataset.mpath + '"]')); st.data[list][+i][f] = boxes.filter(b => b.checked).map(b => b.dataset.mnum ? +b.dataset.mval : b.dataset.mval); return true; }
  if (el.dataset.cfg) { if (el.dataset.cfg === "envLabel") { st.config.envLabel = el.value; return true; } const v = el.type === "checkbox" ? (el.checked ? 1 : 0) : parseFloat(el.value); if (!Number.isNaN(v)) st.config[el.dataset.cfg] = v; return true; }
  if (el.dataset.cfgjson) { try { st.config[el.dataset.cfgjson] = JSON.parse(el.value); } catch (e) { return "Invalid JSON"; } return true; }
  if (el.dataset.path) {
    const [list, i, f] = el.dataset.path.split("."); const row = st.data[list][+i]; const kind = el.dataset.kind; let v = el.value;
    if (kind === "num") v = parseFloat(v) || 0; else if (kind === "csv") v = v.split(",").map(s => s.trim()).filter(Boolean); else if (kind === "csvn") v = v.split(",").map(s => parseInt(s.trim(), 10)).filter(x => !Number.isNaN(x)); else if (kind === "semi") v = v.split(";").map(s => s.trim()).filter(Boolean);
    if (list === "systems" && f === "build" && !/^\d+[MG](\+\w+)*$/.test(v)) return "Build format: 4M+Eng+Des or 5G+Adv";
    row[f] = v; return true;
  }
  return false;
};
SI.studioCols = COLS; SI.studioGroups = CFG_GROUPS; SI.cellVal = cellVal; SI.renderSim = renderSim;
})(typeof window !== "undefined" ? window : globalThis);
