// FTUE alignment audit: renders every tutorial step with the live tutorial state (a scripted playthrough), then checks the text
// against engine behaviour / D.config and against the rulebook (game/rules.js). Run: node tools/ftue_audit.js   (exit 1 on findings)
global.window = { addEventListener() {}, document: {} };
globalThis.document = { getElementById() { return null }, querySelector() { return null }, querySelectorAll() { return [] }, addEventListener() {} };
const fs = require("fs"), path = require("path"), G = path.join(__dirname, "..", "game") + path.sep;
const D = require(G + "data.js"); globalThis.SHIPIT_DATA = D;
const E = require(G + "engine.js"); globalThis.ShipItEngine = E;
const B = require(G + "bot.js"), SI = require(G + "tutorial.js");
SI.U = { studio: null, sel: null, modal: null, detail: null };
const plain = h => String(h).replace(/<br>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
const words = t => (t.match(/\S+/g) || []).length;
// ---- 1. scripted playthrough: capture each step's rendered text the moment it is shown ----
const S = SI.tutNew(); SI.U.S = S; SI.U.tut = SI.tutInit();
const steps = []; let last = -1, guard = 0;
while (guard++ < 30000 && !S.over) {
  SI.tutTick(); const T = SI.U.tut, st = SI.tutSteps[Math.min(T.idx, SI.tutSteps.length - 1)];
  if (T.idx !== last) { last = T.idx; steps.push({ id: st.id, kind: st.kind, round: S.round, stage: S.step, title: st.title, text: plain(st.text(S, T)), btn: st.btn }); }
  if (st.kind === "info") { if (st.final) break; SI.tutAck(); continue; }
  const cur = E.currentActor(S);
  if (cur === 1 || (cur === 0 && S.dq.length && S.dq[0].p === 1)) { if (!B.step(S).ok) break; continue; }
  let a = B.decide(S); if (!a) break; let g = SI.tutGate(a);
  if (g) { const alts = []; const me = S.players[0];
    if (S.step === "place") { me.workers.filter(w => !w.placed).forEach(w => E.placementOptions(S, 0, w).filter(o => o.ok).slice(0, 6).forEach(o => alts.push({ type: "place", p: 0, worker: w.id, target: o.target }))); S.recruit.forEach((o, i) => alts.push({ type: "recruit", p: 0, idx: i })); alts.push({ type: "pass", p: 0 }); }
    if (S.step === "rest") alts.push({ type: "done", p: 0 });
    a = alts.find(x => !SI.tutGate(x)) || { type: S.step === "rest" ? "done" : "pass", p: 0 }; }
  E.act(S, a);
}
// steps the scripted walk skipped (its bot had already done the thing): render them from the end state so their text is still audited
SI.tutSteps.forEach(st => { if (!steps.some(x => x.id === st.id)) { try { steps.push({ id: st.id, kind: st.kind, round: S.round, stage: S.step, title: st.title, text: plain(st.text(S, SI.U.tut)), btn: st.btn, skipped: true }); } catch (e) {} } });
const F = []; const find = (sev, where, what) => F.push({ sev, where, what });
// ---- 2. generic text hygiene ----
steps.forEach(s => {
  const t = s.title + "\n" + s.text, w = words(s.text);
  if (/\{\w+\}/.test(t)) find("ERR", s.id, "unrendered placeholder: " + t.match(/\{\w+\}/)[0]);
  if (/\*\*/.test(t)) find("ERR", s.id, "literal ** left in rendered text");
  if (/undefined|NaN|\[object|null/.test(t)) find("ERR", s.id, "bad value in text");
  if (/\.\.(?!\.)|[:;],|\.\s*\./.test(s.text.replace(/…/g, ""))) find("WARN", s.id, "double punctuation: " + (s.text.match(/.{15}(\.\.|[:;],).{5}/) || [""])[0]);
  if (w > 85) find("WARN", s.id, "long step (" + w + " words, target <= 85)");
  const verbs = (s.text.match(/\b(Press|Click|Select|Choose|Recruit|Buy|Place|Open|Set)\b/g) || []).length;
  s.words = w; s.verbs = verbs;
});
// ---- 3. stale vocabulary, across the tutorial, rulebook, card/spot/milestone text ----
const rules = JSON.parse(fs.readFileSync(G + "rules.js", "utf8").match(/SHIPIT_RULES = (\[.*?\]); root\.SHIPIT_RULES_CSS/s)[1]);
const rulesTxt = rules.map(r => ({ id: "rules:" + r.id, text: plain(r.html.replace(/<\/(p|div|h\d|li|tr|td|th)>/g, " ")) }));
const corpus = [].concat(steps.map(s => ({ id: s.id, text: s.title + " " + s.text })), rulesTxt,
  D.tutorial.map(r => ({ id: "row:" + r.id, text: r.text })),
  D.spots.map(x => ({ id: "spot:" + x.id, text: [x.tile, x.note, x.fx].join(" ") })),
  D.crisis.map(x => ({ id: "crisis:" + x.id, text: x.text })),
  D.milestones.map(x => ({ id: "mile:" + x.name, text: x.text })));
const STALE = [
  [/\bhire[sd]?\b|\bhiring\b/i, "old 'hire' wording (use Recruit)"], [/\bdraft(ed|ing)?\b/i, "old draft", t => !/\bno (draft|bidding or drafting)/i.test(t)], [/Momentum/, "Momentum no longer exists"],
  [/released (pile|worker)/i, "release mechanic removed"], [/rank prize|1st place pays|ties split the points/i, "old rank-prize scoring"], [/starting VP|base VP/i, "starting VP"],
  [/quit roll|1-in-6|1 in 6/i, "quit roll (lossThreshBase is 0)"], [/Culture (VP|race|track)\b|lowest Culture loses/i, "Culture VP (Culture is 5 minus Burnout)"], [/Clean ?up|Shortlist/i, "old step names"],
  [/\bbid(s|ding)?\b/i, "bidding (only the Crisis cards still bid; turn order has no bid)", t => !/crisis|auction|secretly bid|bid knowing|not bids or salaries|no bidding or drafting/i.test(t)],
  [/3 (free )?(desks|workstations)\b|three (desks|workstations)/i, "old 3-desk wording"], [/\bdesk\s+\d+ costs/i, "desk N costs (use workstation)"],
  [/\bRush takes|rush fee|\brushed\b/, "Rush (the game says Crunch)"], [/\b3th\b/, "typo 3th"], [/Burnt|Burn-out|Burn out\b/, "Burnout spelling"], [/Wish list|wishlist\b/, "Wishlists spelling"], [/strike team/, "lowercase 'strike team' (game term is Strike Team)"],
  [/printed VP at the end/i, "systems score printed VP x sysVPMult, not printed VP"]];
STALE.forEach(([re, why, only]) => corpus.forEach(c => { if (re.test(c.text) && (!only || only(c.text))) find("STALE", c.id, why + ": ..." + (c.text.match(new RegExp(".{0,30}" + re.source + ".{0,30}", re.flags.replace("g", ""))) || [""])[0].replace(/\s+/g, " ") + "..."); }));
// ---- 4. numeric claims checked against D.config / engine behaviour ----
const c = S.cfg, txt = id => (steps.find(s => s.id === id) || { text: "" }).text, rt = id => (rulesTxt.find(r => r.id === "rules:" + id) || { text: "" }).text;
const T = (id, re, exp, label, src) => { const t = src || txt(id), m = t.match(re); if (!m) return find("WARN", id, "claim not found: " + label); const got = m.slice(1).find(x => x !== undefined); if (+got !== exp) find("MISMATCH", id, label + ": text says " + got + ", engine/config says " + exp); };
// engine truths measured, not just read from config
const sim = E.newGame([{ name: "a" }, { name: "b" }], { seed: 5, config: Object.assign(E.defaultConfig(), SI.TUT_CONFIG), data: E.clone(E.defaultData(E.defaultConfig())) });
const wsPrices = []; for (let n = c.wsFree; n < c.wsMax; n++) { sim.players[0].ws = n; wsPrices.push(E.wsCost(sim, 0)); }
const teamRelief = (() => { const p = sim.players[0]; p.burnout = 4; const b0 = p.burnout; E.statChange(sim, 0, "culture", c.teamEventCulture); E.statChange(sim, 0, "burnout", -(c.burnTeamRelief || 1)); return b0 - p.burnout; })();
const teamCost = (D.spots.find(x => x.id === "team").cost || {}).gold;
T("win_vp", /every (\d+) Gold is 1 VP/, c.goldPerVP, "Gold per VP"); T("win_vp", /every (\d+) points is 1 VP/, c.raceDen, "race divisor"); 
T("income", /gets (\d+)G of Income/, c.income, "income"); T("income", /(\d+)G per Junior/, c.salaryJr, "Junior salary"); T("income", /(\d+)G per Senior/, c.salarySr, "Senior salary");
T("team", /(\d+) Juniors/, c.startWorkers, "starting Juniors"); T("team", /opens in round (\d+)/, c.recruitMinRound, "recruit opens");
T("ws1", /just (\d+)/, c.wsFree, "free workstations"); T("place2", /\((\d+)G for the next one\)/, wsPrices[0], "next workstation price"); T("place2", /up to (\d+) in all/, c.wsMax, "max workstations");
{ const t = txt("place2"); const got = (t.match(/Extra ones cost: ([^(]*)\(/) || [, ""])[1]; const nums = (got.match(/\d+(?=G)/g) || []).map(Number); const exp = []; wsPrices.forEach(p => { if (exp[exp.length - 1] !== p) exp.push(p) }); if (nums.join() !== exp.join()) find("MISMATCH", "place2", "workstation ladder text " + nums + " vs engine " + exp + " (per desk " + wsPrices + ")"); }
T("burnout", /\(0 to (\d+)\)|from 0 to (\d+)/, c.burnMax, "burnout max"); T("burnout", /short by (\d+)G/, c.burnUnpaidMin, "unpaid threshold");
T("burnout", /falls (\d+) after a calm round/, c.burnRelief, "calm relief"); T("burnout", /(\d+) after a Team Event|a Team Event lowers it by (\d+)/, teamRelief, "Team Event Burnout relief (engine measured)"); T("burnout", /\+(\d+)G a round/, c.energizedGold, "Energized gold");
T("burnout", /At (\d+)\+ you lose extra Hype/, c.burnStrainAt, "Strained at"); T("burnout", /at (\d+)\+ a worker is benched/, c.burnBenchAt, "benched at"); T("burnout", /at (\d+) one quits/, c.burnQuitAt, "meltdown at"); T("burnout", /Culture is (\d+) minus/, c.cultureFoldBase, "culture base");
T("board_perks", /pay (\d+)G/, teamCost, "Team Event cost"); T("board_perks", /lower Burnout by (\d+)/, teamRelief, "Team Event relief (perks step)");
T("r2recruit", /costs (\d+)G, plus/, c.recruitCost, "recruit cost"); T("r2recruit", /plus (\d+)G for each/, c.recruitLadder, "recruit ladder"); T("r2crunch", /costs (\d+)G/, c.crunchGold, "crunch gold");
T("races", /every (\d+) points of Progress/, c.raceDen, "race divisor"); T("hype_bank", /fades by (\d+)/, c.hypeDecay, "hype decay"); T("hype_bank", /banks up to (\d+)/, c.hypeBank, "hype bank"); T("hype_bank", /From round (\d+)/, c.decayFromRound, "decay starts");
T("convert", /turn (\d+) skills/, c.convertRate, "convert rate"); T("convert", /1 VP per (\d+)\./, c.goldPerVP, "gold per VP"); T("promote", /earns (\d+) skills/, c.resSr, "Senior skills") ;
// rulebook vs the same truths
T("setup", /Team Event|X/, 0, "", "") ; F.pop();
const rb = rulesTxt.map(r => r.text).join("\n");
const RB = (re, exp, label) => { const m = rb.match(re); if (!m) return find("WARN", "rules", "claim not found: " + label); if (+m[1] !== exp) find("MISMATCH", "rules", label + ": rulebook says " + m[1] + ", engine says " + exp); };
RB(/Team Event \(2 workers with different roles \+ 3G: -(\d+) Burnout/, teamRelief, "Team Event relief"); RB(/-\d+ on a calm round, -(\d+) on a Team Event/, teamRelief, "Team Event relief (key rules)"); RB(/Every (\d+) leftover Gold is 1 VP/, c.goldPerVP, "gold per VP");
RB(/Every studio gains (\d+)/, (D.config || {}).income != null ? D.config.income : c.income, "income"); RB(/Hype fades 2|Hype fades by (\d+)/, c.hypeDecay, "hype decay");
RB(/Recruit a Junior from the pool: (\d+)/, c.recruitCost, "recruit cost"); RB(/up to (\d+): workstations?/, c.wsMax, "max workstations");
{ const m = rb.match(/workstations 2 to 4 cost (\d+)G each, workstation 5 costs (\d+)G, workstation 6 costs (\d+)G/); if (!m || [+m[1], +m[2], +m[3]].join() !== [wsPrices[0], wsPrices[3], wsPrices[4]].join()) find("MISMATCH", "rules", "workstation ladder text vs engine " + wsPrices); }
// board UI numbers (launch scoring chips) must come from the same table the engine scores with
{ const ui = fs.readFileSync(G + "ui.js", "utf8"); if (/CULTURE \(least loses most\)/.test(ui)) find("STALE", "ui.js raceRules", "Culture VP box still shown on the Launch board"); if (!/debtLossByN\[N\]/.test(ui.slice(ui.indexOf("function raceRules"), ui.indexOf("function raceRules") + 900))) find("MISMATCH", "ui.js raceRules", "Debt chip ignores debtLossByN (shows debtLossMax " + c.debtLossMax + " but the engine uses " + (c.debtLossByN || {})[2] + " at 2 players)"); }
// ---- 5. report ----
console.log("steps rendered:", steps.length, "| words per step: avg " + Math.round(steps.reduce((a, s) => a + s.words, 0) / steps.length) + ", max " + Math.max.apply(null, steps.map(s => s.words)));
steps.forEach(s => { if (process.env.V) console.log(String(s.words).padStart(4), s.verbs, s.id); });
F.forEach(f => console.log(f.sev.padEnd(8), String(f.where).padEnd(16), f.what));
console.log(F.length ? F.length + " finding(s)" : "audit clean");
fs.writeFileSync(process.env.OUT || "/dev/null", JSON.stringify(steps, null, 1));
process.exit(F.some(f => f.sev !== "WARN") ? 1 : 0);
