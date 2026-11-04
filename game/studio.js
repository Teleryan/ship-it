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
  ["Draft (cards dealt per player)", ["draftPre2","draftPre","draftProd2","draftProd","draftPol2","draftPol","draftLaunch"]],
  ["Workers & fatigue", ["resJr","resSr","resOver","resCap","crewPartnerCap","sysCostMult","objVPMult","resSubGold","resSubMax","srBonus","srAllowedPreProd","qaAllowedPreProd","lossThreshBase"]],
  ["Systems & cards", ["buildsPerRound","rdDiscount","gatesRandom","slotsPerCategory","handSize","objDraw","objKeep","teamEventCulture","launchMult","crisisEnabled"]],
  ["Tracks", ["culMin","culMax","cultureDecay","hypeDecay","hypeCap","prodCap","debtMode"]],
  ["Variant C: phase-shaped economy", ["varC","noSwaps","spotResOr","srSystems","srPromoteOnly","promoFree","promoNeedsRest","overworkCulture","recruitCost","recruitPerRound","recruitSize2","recruitSize34","recruitSize56","recruitScale","recruitDelta","flowV2","recruitInLaunch","bidEveryRound","bidWinnerOnly","bidWinnerOnly","buildDelay","crunchDelay","crunchGold","rdCrunch","convertRate","gateProgMult","gateHypeMult","sysGoldMult"]],
  ["Variant D: Burnout and Training", ["train","hypeBank","hypeLeadVP","hypeLeadMin","hypeIncStep","hypeIncMax","smallDrop","smallMax","trainCost","trainCulture","trainNeeded","trainsPerRest","burnout","burnMax","burnOverStep","burnOverMax","burnUnpaidMin","burnUnpaidPer","burnUnpaidMax","burnRelief","burnTeamRelief","burnStrainAt","burnStrainHype","burnBenchAt","burnQuitAt","burnQuitReset","energizedBurnMax","energizedCulture","energizedGold"]],
  ["Systems, deck and bots", ["deckBase","deckExtra","sysGoldAdd"]],
  ["Pool scoring (B)", ["poolScoring","poolPot","poolSysMult","poolObjMult","poolDebtMult"]],
  ["Race scoring", ["raceScoring","mktgToHype","raceCurve","racePot","debtLossMax","cultLossMax","trackScoring"]],
  ["Market, scale and gates", ["gateLevelDefs","salaryJr","salarySr","reachFade","maxSystems","marketSize","marketRefreshGold","marketRefreshesPerRound","headhuntCatchUp","gatesEnabled","gateBestVP","gateLossCap","gateContract","objPartial","reachMajorVP","srBuildDiscount","sysVPMult","synergyMult","draftPool","deliveredBonus"]],
  ["Race targets and pool extras", ["mergeMktg","raceEnd","progTarget","hypeTarget","raceTriggerVP","trackLeaderVP","poolGateCap","poolGateMult","poolPassPts","poolFavPts","envLabel"]],
  ["Scoring (older)", ["scoreShareScale","scoreShareNormalize","debtPenaltyMult","debtPenaltyCap","cleanThresh","stdThresh","roughThresh","cleanBonus","blockedPenalty","roughHypeMult","goldPerVP","synergyOn"]]
];
const TUT_TOKENS = "{phaseOrder} {roundOrder} {incomeNote} {restMiles} {upkeepV2} {trainCost} {trainCulture} {trainNeeded} {restTeam} {burnMax} {burnOverStep} {burnOverMax} {burnUnpaidMin} {burnRelief} {burnTeamRelief} {energizedCulture} {energizedGold} {burnStrainAt} {burnStrainHype} {burnBenchAt} {burnQuitAt} {burnQuitReset} {burnStats} {burnRest} {burnUpkeep} {income} {salaryJr} {salarySr} {jrCost} {resJr} {resSr} {hypeDecay} {draftPool} {picks} {recruitCost} {recruitN} {buildDelay} {crunchGold} {buildsPerRound} {bank} {convertRate} {refreshGold} {gateName} {gate2Name} {gateReqs} {gateEnd} {gateFund} {gatePenalty} {gateResult} {crisisLine} {freeBuild} {hint} {n} {total}";
const COLS = {
  spots: [["id","ID","ro"],["row","Row","sel:rows"],["discs","Disciplines","multi:discs"],["fx","Effect","str"],["r","Skills ×","num"],["debt","Debt","num"],["mode","Mode","sel:modes"],["phases","Phases","multi:phases"],["note","Note","str"]],
  systems: [["name","Name","str"],["cat","Category","sel:cats"],["build","Build","str"],["trig","Trigger","str"],["fx","Effect","str"],["once","Once (on build)","str"],["each","Each","str"],["debt","Debt","num"],["vp","VP","num"],["syn","Syn","num"],["bt","Build rounds (crew committed)","num"],["res","Skill","sel:res"],["sym","Symbols (Environments A and B)","multi:syms"]],
  milestones: [["name","Name","ro"],["cat","Category","ro"],["gold","Gold","num"],["phases","Can be cashed in during","multi:phases"],["text","Requirement (rule is coded)","str"]],
  objectives: [["name","Name","str"],["type","Type","ro"],["vp","VP","num"],["reqs","Requirements (; separated)","semi"],["res","Skill","sel:res"],["sym","Symbols (Environments A and B)","multi:syms"]],
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
function widget(kind, tab, i, f, v, dirty, st) {
  const k = kind.split(":"), path = `${tab}.${i}.${f}`;
  if (k[0] === "sel") { const o = optsFor(k[1], st); if (v != null && v !== "" && !o.some(x => String(x[0]) === String(v))) o.push([v, v]); return `<select class="${dirty ? "dirty" : ""}" data-path="${path}" data-kind="str">${o.map(x => `<option value="${esc(x[0])}" ${String(x[0]) === String(v == null ? "" : v) ? "selected" : ""}>${esc(x[1])}</option>`).join("")}</select>`; }
  if (k[0] === "multi") { const o = optsFor(k[1], st), cur = (v || []).map(String), num = k[1] === "phases" ? 'data-mnum="1"' : ""; return `<div class="mchk ${dirty ? "dirty" : ""}">${o.map(x => `<label><input type="checkbox" data-mpath="${path}" data-mval="${esc(x[0])}" ${num} ${cur.includes(String(x[0])) ? "checked" : ""}> ${esc(x[1])}</label>`).join("")}</div>`; }
  return null;
}
SI.renderStudio = function (st, tab, sim) {
  const tabs = [["rules","Rules"],["spots","Board spots"],["systems","Systems"],["milestones","Milestones"],["objectives","Objectives"],["crisis","Crisis cards"],["publisherGates","Publisher gates"],["gatePool","Gate pool"],["roles","Roles"],["phases","Phases"],["teams","Teams"],["symbols","Symbols"],["tutorial","Text"],["sim","Simulator"]];
  const X = SI.stu2 || {}, V = X.state ? X.state() : { q: "", ed: false, view: "table", sel: {} };
  let h = X.frame ? X.frame(st, tab, tabs) : "";
  if (V.view === "changes" && tab !== "sim" && X.changes) return h + X.changes(st);
  if (tab === "rules") {
    h += '<p class="mute" style="margin:0 0 8px">Every value below is a live knob. Yellow = changed from the v47 default. Changes apply to the <b>next new game</b>.</p><div class="scroll-y">';
    CFG_GROUPS.forEach(g => {
      h += `<h4 style="margin:12px 0 6px">${g[0]}</h4><div class="cfg-grid">`;
      g[1].forEach(k => { const m = D.config._meta[k] || [k, ""]; const ed = dirtyCfg(st, k); if (V.ed && !ed) return; h += `<div class="cfg" data-hay="${esc((m[0] + " " + m[1] + " " + k).toLowerCase())}" data-ed="${ed ? 1 : 0}" ${V.q && !(m[0] + " " + m[1] + " " + k).toLowerCase().includes(V.q) ? "hidden" : ""}><label>${esc(m[0])} <i class="chip live" title="The engine reads this value when a new game starts.">live</i></label><small>${esc(m[1])}</small>${BOOLS.has(k) ? `<label class="chk ${ed ? "dirty" : ""}"><input type="checkbox" data-cfg="${k}" ${st.config[k] ? "checked" : ""}> ${st.config[k] ? "On" : "Off"}</label>` : CFG_SELECTS[k] ? `<select data-cfg="${k}" class="${ed ? "dirty" : ""}">${CFG_SELECTS[k].map(o => `<option value="${o[0]}" ${+st.config[k] === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>` : k === "envLabel" ? `<input type="text" data-cfg="${k}" value="${esc(st.config[k])}" class="${ed ? "dirty" : ""}">` : `<input type="number" step="any" data-cfg="${k}" value="${esc(st.config[k])}" class="${ed ? "dirty" : ""}">`}</div>`; });
      h += "</div>";
    });
    h += `<h4 style="margin:14px 0 6px">Table values (JSON)</h4><div class="cfg-grid">`;
    ["hypeBands","deliveryBands","cultureVP","phaseEnds","rowNames","raceCurveByN","racePotByN","debtLossByN","cultLossByN","poolPotN","progTrack","mktTrack","burnVP","smallDrop","gateLevelDefs","botW","botPersonas","botProfiles"].forEach(k => { h += `<div class="cfg" data-hay="${k.toLowerCase()}" data-ed="${dirtyCfg(st, k) ? 1 : 0}" ${V.q && !k.toLowerCase().includes(V.q) ? "hidden" : ""}><label>${(D.config._meta[k] || [k])[0]} <i class="chip live">live</i></label><small>${(D.config._meta[k] || ["", ""])[1] && !["hypeBands","cultureVP","phaseEnds"].includes(k) ? esc(D.config._meta[k][1]) : k === "hypeBands" ? "[[min Hype %, VP], ...]" : k === "cultureVP" ? "Culture value -> VP" : k === "phaseEnds" ? "Variant C: last round of Concept, Production, Polish, Launch, e.g. [3,8,11,12]" : "Delivery bonus bands"}</small><textarea rows="4" style="width:100%" data-cfgjson="${k}" class="${dirtyCfg(st, k) ? "dirty" : ""}">${esc(JSON.stringify(st.config[k]))}</textarea></div>`; });
    h += "</div></div>";
  } else if (["spots","systems","milestones","objectives","crisis","publisherGates","gatePool","roles","phases","teams","symbols"].includes(tab)) {
    const cols = COLS[tab]; const list = st.data[tab], def = E.defaultData(E.defaultConfig())[tab];
    const sel = (V.sel && V.sel[tab]) || 0;
    h += `<p class="mute" style="margin:0 0 6px">${list.length} rows. Effect strings use: <span class="mono">+2 Progress, -1 Debt, +3G, +1 Hype, +1 Marketing, +1 Culture, Draw 1 Milestone, +1G per Reach, +1 Prod OR +1 Mktg</span></p><div class="stu-split"><div class="scroll-y stu-tbl"><table class="dt"><thead><tr><th></th>` + cols.map(c => `<th>${c[1]} ${X.chip ? X.chip(tab, c[0]) : ""}</th>`).join("") + "</tr></thead><tbody>";
    list.forEach((row, i) => {
      const rowEd = JSON.stringify(row) !== JSON.stringify(def[i]); if (V.ed && !rowEd) return;
      const hay = cols.map(c => cellVal(row[c[0]], c[2])).join(" ").toLowerCase();
      h += `<tr data-hay="${esc(hay)}" data-ed="${rowEd ? 1 : 0}" class="${i === sel ? "sel" : ""}" ${V.q && !hay.includes(V.q) ? "hidden" : ""}><td><button class="btn sm" data-act="st-sel" data-v="${i}" title="Show this row as a card on the right">View</button></td>` + cols.map(c => {
        const v = row[c[0]], dv = def[i] ? def[i][c[0]] : undefined; const dirty = JSON.stringify(v) !== JSON.stringify(dv);
        if (c[2] === "ro") return `<td class="mute" style="padding:4px 6px">${esc(c[0] === "deck" ? ["Blue","Orange","Pink"][v] : v)}</td>`;
        const wd = widget(c[2], tab, i, c[0], v, dirty, st); if (wd) return `<td>${wd}</td>`;
        return `<td><input ${c[2] === "num" ? 'type="number" class="n' + (dirty ? " dirty" : "") + '"' : 'class="' + (dirty ? "dirty" : "") + '"'} data-path="${tab}.${i}.${c[0]}" data-kind="${c[2]}" value="${esc(cellVal(v, c[2]))}"></td>`;
      }).join("") + "</tr>";
    });
    h += "</tbody></table></div>" + (X.preview ? X.preview(tab, st, def, sel) : "") + "</div>";
  } else if (tab === "tutorial" && V.tg && V.tg !== "Tutorial steps") {
    const list = st.data.text || [], def = E.defaultData(E.defaultConfig()).text || [];
    h += `<p class="mute" style="margin:0 0 6px">Wording shown around the game. <i class="chip display">display</i> Changes show after <b>Apply to game</b> and a reload.</p><div class="scroll-y">`;
    list.forEach((row, i) => {
      if (row.group !== V.tg) return; const d = def.find(x => x.id === row.id) || {}, ed = (row.text || "") !== (d.text || ""), hay = (row.label + " " + row.text).toLowerCase(); if (V.ed && !ed) return;
      h += `<div class="panel" data-hay="${esc(hay)}" data-ed="${ed ? 1 : 0}" ${V.q && !hay.includes(V.q) ? "hidden" : ""} style="margin:6px 0;padding:8px"><div class="mute" style="margin-bottom:3px">${esc(row.label)}</div><textarea class="grow${ed ? " dirty" : ""}" rows="2" style="width:100%" data-path="text.${i}.text" data-kind="str">${esc(row.text)}</textarea></div>`;
    });
    h += "</div>";
  } else if (tab === "tutorial") {
    const list = st.data.tutorial || [], def = E.defaultData(E.defaultConfig()).tutorial;
    h += `<p class="mute" style="margin:0 0 6px">${list.length} tutorial strings for the guided game (Variant C). Edits apply to the <b>next tutorial</b> you start. Markup: <span class="mono">**bold**</span>, a blank line starts a new paragraph, and <span class="mono">{token}</span> is replaced by a live value: <span class="mono">${esc(TUT_TOKENS)}</span>. Leave a token in place if the sentence needs the number. Step order follows the Step numbers.</p><div class="scroll-y">`;
    list.forEach((row, i) => {
      const d = def[i] && def[i].id === row.id ? def[i] : (def.find(x => x.id === row.id) || {});
      const dirty = f => (row[f] || "") !== (d[f] || "") ? " dirty" : "";
      const tEd = ["title", "btn", "text"].some(f => (row[f] || "") !== (d[f] || "")), tHay = [row.id, row.when, row.title, row.btn, row.text].join(" ").toLowerCase(); if (V.ed && !tEd) return;
      h += `<div class="panel" data-hay="${esc(tHay)}" data-ed="${tEd ? 1 : 0}" ${V.q && !tHay.includes(V.q) ? "hidden" : ""} style="margin:6px 0;padding:8px"><div class="row" style="gap:10px;margin-bottom:4px"><b class="mono">${esc(row.id)}</b><span class="mute">${esc(row.when)}</span></div>`;
      if (row.title || d.title) h += `<div class="row" style="gap:8px;margin:3px 0"><label class="mute" style="width:60px">Title</label><input class="grow${dirty("title")}" data-path="tutorial.${i}.title" data-kind="str" value="${esc(row.title)}"></div>`;
      if (row.btn || d.btn) h += `<div class="row" style="gap:8px;margin:3px 0"><label class="mute" style="width:60px">Button</label><input class="grow${dirty("btn")}" data-path="tutorial.${i}.btn" data-kind="str" value="${esc(row.btn)}"></div>`;
      h += `<div class="row" style="gap:8px;margin:3px 0;align-items:flex-start"><label class="mute" style="width:60px">Text</label><textarea class="grow${dirty("text")}" rows="${Math.min(10, Math.max(2, Math.ceil((row.text || "").length / 90) + (row.text || "").split("\n").length - 1))}" data-path="tutorial.${i}.text" data-kind="str" style="width:100%">${esc(row.text)}</textarea></div></div>`;
    });
    h += "</div>";
  } else if (tab === "sim") {
    h += `<p class="mute" style="margin:0 0 8px">Runs bot-only games with the values currently in the Studio and reports where the VP comes from. Use it to tune the economy before human playtests.</p>
    <div class="row wrap" style="margin-bottom:10px"><label>Players <select id="sim-n">${[2,3,4,5,6].map(n => `<option ${((sim && sim.n) || 4) === n ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <label>Games <input id="sim-g" type="number" value="${(sim && sim.games) || 100}" style="width:80px"></label>
    <button class="btn primary" data-act="sim-run">Run simulation</button>${sim && sim.running ? `<span class="mute">running… ${sim.done}/${sim.games}</span>` : ""}</div>`;
    if (sim && sim.res) h += renderSim(sim.res);
  } else if (tab === "io") {
    h += `<p class="mute">Export your tuned values as JSON (copy it into a file to lock them in or hand to the web build), or paste a JSON blob to import.</p>
    <textarea id="io-box" rows="14" style="width:100%" class="mono">${esc(JSON.stringify({ config: st.config, data: st.data }))}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn" data-act="io-copy">Copy</button><button class="btn primary" data-act="io-import">Import from box</button><button class="btn danger" data-act="studio-reset">Reset everything to v47 defaults</button></div>`;
  }
  return h;
};

function renderSim(r) {
  const parts = [["prodShare","Progress share"],["mktShare","Marketing share"],["hypeStrength","Hype (race)"],["delivery","Delivery"],["debtPenalty","Debt pen."],["culture","Culture"],["objectives","Objectives"],["synergy","Synergy"],["systems","Systems"],["launch","Launch"],["reach","Reach spotlight"],["gold","Gold→VP"],["crisis","Crisis VP"]];
  let h = `<div class="panel"><h3>Results: ${r.players}P × ${r.games} games</h3><div class="row wrap" style="gap:24px"><div class="st"><small>Avg winner VP</small><b class="mono" style="font-size:22px">${r.winAvg.toFixed(1)}</b></div><div class="st"><small>Avg gap winner−last</small><b class="mono" style="font-size:22px">${r.gap.toFixed(1)}</b></div><div class="st"><small>Avg gap winner−2nd</small><b class="mono" style="font-size:22px">${r.gap2.toFixed(1)}</b></div><div class="st"><small>Avg player VP</small><b class="mono" style="font-size:22px">${r.avg.toFixed(1)}</b></div><div class="st"><small>Winners in 100-140 VP</small><b class="mono" style="font-size:22px">${(r.inr / r.games * 100).toFixed(0)}%</b></div><div class="st"><small>Blowouts (25+ VP over 2nd)</small><b class="mono" style="font-size:22px">${(r.blow / r.games * 100).toFixed(0)}%</b></div></div></div>`;
  h += '<div class="panel" style="margin-top:8px"><h3>Where the average player’s VP comes from</h3>';
  const mx = Math.max.apply(null, parts.map(p => Math.abs(r.parts[p[0]]))) || 1;
  parts.forEach(p => { const v = r.parts[p[0]]; h += `<div class="row" style="margin:3px 0"><div style="width:110px" class="mute">${p[1]}</div><div class="bar grow"><i style="width:${Math.abs(v) / mx * 100}%;background:${v < 0 ? "var(--bad)" : "var(--prod)"}"></i></div><div class="mono" style="width:60px;text-align:right">${v.toFixed(1)}</div></div>`; });
  h += "</div>";
  h += `<div class="panel" style="margin-top:8px"><h3>Average end state per player</h3><div class="row wrap" style="gap:18px">` + [["Gold","gold"],["Progress","prod"],["Marketing","mktg"],["Hype","hype"],["Debt","debt"],["Culture","culture"],["Systems","systems"],["Workers","workers"],["Milestones cashed","miles"]].map(x => `<div class="st"><small>${x[0]}</small><b>${r.stats[x[1]].toFixed(1)}</b></div>`).join("") + `</div>
  <p class="mute" style="margin:8px 0 0">Launch outcomes: ` + Object.keys(r.thr).map(k => `${k} ${(r.thr[k] / (r.games * r.players) * 100).toFixed(0)}%`).join(" · ") + ` · Win rate by seat: ` + r.seatWin.map((w, i) => `P${i + 1} ${(w / r.games * 100).toFixed(0)}%`).join(", ") + "</p></div>";
  if (r.c && (r.c.rc || r.c.bd || r.c.cr || r.c.cv)) h += `<div class="panel" style="margin-top:8px"><h3>Variant C economy (average per player)</h3><div class="row wrap" style="gap:18px">` + [["Seniors", r.c.sr], ["Recruited", r.c.rc], ["Finished systems", r.c.fin], ["Unfinished systems", r.c.bd], ["Rushed builds", r.c.cr], ["Worker-rounds on build crews", r.c.cw], ["Skills converted", r.c.cv]].map(x => `<div class="st"><small>${x[0]}</small><b class="mono">${x[1].toFixed(1)}</b></div>`).join("") + "</div></div>";
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
      res.winAvg += t[0]; if (t[0] >= 100 && t[0] <= 140) res.inr++; if (t[0] - t[1] >= 25) res.blow++; res.gap += t[0] - t[t.length - 1]; res.gap2 += t[0] - t[1]; res.avg += t.reduce((a, b) => a + b, 0) / n; res.seatWin[S.winner]++;
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
