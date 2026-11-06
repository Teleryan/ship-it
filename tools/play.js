#!/usr/bin/env node
// Text-play harness so a human or an AI agent can play SHIP IT from the terminal.
//   node tools/play.js new <file> <players 2-6> <gate E|M|H (Easy, Standard, Hard preset)> <botSkill novice|casual|expert> [seed]
//   node tools/play.js view <file>          what you can see and every legal action
//   node tools/play.js do <file> '<json>'   take one action (see view for the formats); bots then play until it is your turn
//   node tools/play.js hint <file>          the action the built-in bot would take for you (use sparingly)
//   node tools/play.js log <file> [n]       last n log lines (default 30)
//   node tools/play.js rules                print the rulebook text shipped with the game
// You are always seat 0 ("YOU"). All other seats are bots.
global.window = undefined;
const fs = require("fs"), path = require("path"), G = path.join(__dirname, "..", "game");
const D = require(path.join(G, "data.js")), E = require(path.join(G, "engine.js")), B = require(path.join(G, "bot.js"));
const [cmd, file, a1, a2, a3, a4] = process.argv.slice(2);
const save = S => fs.writeFileSync(file, JSON.stringify(S));
const load = () => { const S = JSON.parse(fs.readFileSync(file, "utf8")); E.useCfg(S.cfg); return S; };
const ME = 0;
function botsUntilMe(S) {
  let g = 0;
  while (!S.over && g++ < 20000) {
    const who = E.currentActor(S);
    if (who === ME) return;
    if (who < 0) { E.advance(S); if (E.currentActor(S) < 0) return; continue; }
    const r = B.step(S); if (!r.ok) { console.log("BOT ERROR", JSON.stringify(r)); return; }
  }
}
function res(p, S) { return `Gold ${p.gold} | Ideas ${p.ideas} Code ${p.code} Process ${p.process} Buzz ${p.buzz} | Progress ${p.prod} Marketing ${p.mktg} Hype ${p.hype} | Debt ${p.debt} | Culture ${E.cultureOf(S, p)} Burnout ${p.burnout}`; }
function W(w) { return `#${w.id} ${w.lvl} ${w.disc}${w.as ? "(as " + w.as + ")" : ""} fat${w.fat}${w.placed ? " PLACED" : ""}${w.training ? " TRAINING" : ""}${w.build ? " BUILDING" : ""}`; }
const OB = i => { const ob = D.objectives[i]; return `[${i}] ${ob.name} ${ob.vp}VP needs ${ob.reqs.join(" + ")}`; };
const MS = i => { const m = (CUR && CUR.data ? CUR.data : D).milestones[i]; return `[${i}] ${m.name}: ${m.text} (+${m.gold}G, phases ${m.phases})`; };
let CUR = null;
function view(S) {
  CUR = S;
  const o = [];
  const p = S.players[ME];
  o.push(`ROUND ${S.round}/12  phase ${S.phase}  step ${S.step}  ${S.over ? "GAME OVER" : "actor: " + (E.currentActor(S) < 0 ? "-" : S.players[E.currentActor(S)].name)}`);
  if (S.over) { S.scores.forEach(s => o.push("FINAL " + S.players[s.id].name + ": " + s.total + "  parts " + JSON.stringify(s.parts))); }
  o.push("Turn order: " + S.order.map(i => S.players[i].name).join(" > "));
  const gl = E.gateList(S); if (!gl) o.push("Gates: not drawn yet (drawn at the end of round 1)"); if (gl) o.push("Gates: " + gl.map(g => `P${g.phase} ${g.name} [${g.lvlName || "Medium"}] needs ${g.reqs.join(", ")}; fund ${g.fund} VP ${g.vp} penalty ${g.penalty}`).join(" || "));
  o.push("");
  S.players.forEach(q => o.push(`${q.id === ME ? "YOU" : q.name}: ${res(q, S)} | workers ${q.workers.length} (Sr ${q.workers.filter(w => w.lvl === "Sr").length}) | systems ${q.systems.map(s => s.name + (s.t ? "*" : "")).join(", ") || "-"} | building ${(q.building || []).map(b => b.name || JSON.stringify(b)).join(", ") || "-"} | VPadj ${q.vpAdj}` + (q.id === ME ? "" : "")));
  o.push("");
  o.push("YOUR WORKERS: " + p.workers.map(W).join(" ; "));
  o.push(`YOUR workstations: ${p.ws == null ? "set at round start" : p.ws}/${S.cfg.wsMax} powered, ${p.wsUsed || 0} used`);
  o.push("YOUR objectives: " + p.objectives.map(OB).join(" ; "));
  o.push("YOUR milestone hand: " + p.miles.map(MS).join(" ; "));
  o.push("");
  const d = S.dq[0];
  if (E.currentActor(S) === ME && d) {
    o.push("PENDING DECISION: " + JSON.stringify(d));
    if (d.t === "keepObj") Object.keys(d.opts).forEach(k => o.push("  " + k + " options: " + d.opts[k].map(i => OB(i)).join("  |  ") + "  (keep one per type)"));
    if (d.t === "keepMile") o.push("  milestone options: " + d.opts.map(i => MS(i)).join(" | ") + " (keep " + d.keep + ")");
    o.push("Reply with an action JSON of the matching type, e.g. keepObj {type,p:0,picks:{Platform:id,...}}, bid {type:'bid',p:0,amount}, choose {type:'choose',p:0,k}, pickWorker {worker}, skip, pivot {replace:false}, dropObj {obj}, keepMile {keep:[ids]}, patchFix {idx}/patchDone. Use `hint` to see the bot's exact format.");
  } else if (E.currentActor(S) === ME && S.step === "place") {
    o.push("PLACE PHASE. Occupied: " + JSON.stringify(S.occ) + " | CLOSED by Industry News this round: " + (Object.keys(S.closed || {}).join(", ") || "none"));
    o.push("Recruit offers: " + (S.recruit || []).map((r, i) => `[${i}] ${r.disc} ${r.by != null ? "(taken by " + S.players[r.by].name + ")" : E.canRecruit(S, ME, i).ok ? "cost " + E.canRecruit(S, ME, i).cost + "G OK" : "no: " + E.canRecruit(S, ME, i).reason}`).join(" ; "));
    const bw = E.canBuyWs(S, ME); o.push("Buy workstation: " + (bw.ok ? "OK cost " + bw.cost + "G" : "no: " + bw.reason));
    o.push("Board (id: row, who can work it, effect, mode, cost): " + E.activeSpots(S).filter(s => !(S.closed && S.closed[s.id])).map(s => `${s.id}: ${s.row} ${(s.discs || []).join("/")} ${s.fx || ""} ${s.note || ""}${s.mode ? " [" + s.mode + "]" : ""}${s.cost ? " cost " + JSON.stringify(s.cost) : ""}${s.srOnly ? " SrOnly" : ""}`).join(" ;; "));
    o.push("Disciplines: " + Object.keys(D.disciplines).map(k => k + "=" + D.disciplines[k].name + "/" + D.disciplines[k].cat).join(", "));
    o.push("Legal placements (worker -> target):");
    p.workers.filter(w => !w.placed && !w.training && !w.build).forEach(w => {
      const ok = E.placementOptions(S, ME, w).filter(x => x.ok || x.wsNeed);
      o.push(`  ${W(w)}: ` + (ok.map(x => x.target + (x.wsNeed ? "(needs workstation: buyws first)" : "") + (x.as && x.as.length > 1 ? "{as:" + x.as.join("/") + "}" : "")).join(", ") || "none"));
    });
    o.push('Targets are written exactly as listed (spot:ID or sys:N). crew = the PARTNER worker ids only (not the placing worker); an invalid list is rejected. Actions: {"type":"place","p":0,"worker":ID,"target":"TARGET"[,"as":"DISC"][,"crew":[ids]]} | {"type":"recruit","p":0,"idx":N} | {"type":"buyws","p":0} | {"type":"pass","p":0}');
  } else if (E.currentActor(S) === ME && S.step === "rest") {
    o.push("MANAGE PHASE. Market: " + JSON.stringify(S.market));
    const names = [].concat.apply([], Object.values(S.market));
    o.push("Tile details: " + names.map(n => { const s = S.data.systems.find(x => x.name === n); return n + " [" + s.cat + "] build " + s.build + ", trigger " + s.trig + " -> " + (s.fx || s.each || "") + " (VP " + s.vp + ", Debt on finish " + s.debt + ")"; }).join(" ; "));
    o.push("Buildable now: " + (names.map(n => { const c = E.canBuild(S, ME, n, false, null); return n + (c.ok ? " OK" : " (no: " + c.reason + ")"); }).join(" ; ")));
    o.push('Actions: {"type":"build","p":0,"name":"TILE","free":false,"crunch":null|"gold"|"fat"} | {"type":"claim","p":0,"mile":ID} | {"type":"promote","p":0,"worker":ID} | {"type":"train","p":0,"worker":ID} | {"type":"refresh","p":0,"name":"TILE"} | {"type":"done","p":0}');
  }
  const nn = (S.notices || []).filter(n => n.r == null || n.r === S.round); if (nn.length) o.push("NOTICES this round: " + JSON.stringify(nn));
  o.push(""); o.push("Recent log:"); S.log.slice(-12).forEach(l => o.push("  " + (typeof l === "string" ? l : l.m || JSON.stringify(l))));
  return o.join("\n");
}
if (cmd === "new") {
  const n = +a1, seats = []; for (let i = 0; i < n; i++) seats.push({ name: i === ME ? "YOU" : "Bot " + i, bot: i !== ME });
  const g = (a2 || "M").toUpperCase(), lv = g === "E" ? ["E", "E", "M", "M"] : g === "H" ? ["M", "H", "H", "H"] : ["E", "M", "M", "H"];
  const PERS = ["", "crunch", "hype", "systems", "clean"];
  const S = E.newGame(seats, { seed: a4 ? +a4 : (Math.random() * 1e6) | 0, config: Object.assign({}, D.config, { gateLevels: lv }) });
  S.players.forEach((p, i) => { if (i !== ME) { const q = PERS[i % PERS.length]; if (q) p.persona = q; p.profile = a3 || "casual"; } });
  botsUntilMe(S); save(S); console.log(view(S));
} else if (cmd === "view") { const S = load(); console.log(view(S)); }
else if (cmd === "do") {
  const S = load(); let a; try { a = JSON.parse(a1); } catch (e) { console.log("Bad JSON"); process.exit(1); }
  if (a.p == null) a.p = ME;
  if (a.type === "place" && Array.isArray(a.crew)) { const w = S.players[ME].workers.find(x => x.id === a.worker), o = w && E.placementOptions(S, ME, w).find(x => x.target === a.target); if (o && o.plans) { const want = a.crew.map(Number).sort((x, y) => x - y).join(","); if (!o.plans.some(pl => pl.ids.join(",") === want)) { console.log("REJECTED: that crew is not allowed. Allowed partner sets: " + o.plans.map(pl => "[" + pl.ids.join(",") + "]").join(" ")); process.exit(0); } } }
  if (a.type === "place" && a.as) { const w = S.players[ME].workers.find(x => x.id === a.worker), o = w && E.placementOptions(S, ME, w).find(x => x.target === a.target); if (o && o.as && !o.as.includes(a.as)) { console.log("REJECTED: as must be one of " + o.as.join("/")); process.exit(0); } }
  const r = E.act(S, a);
  if (!r.ok) { console.log("REJECTED: " + (r.error || r.reason || JSON.stringify(r))); process.exit(0); }
  botsUntilMe(S); save(S); console.log(view(S));
} else if (cmd === "hint") { const S = load(); console.log(JSON.stringify(B.decide(S))); }
else if (cmd === "log") { const S = load(); S.log.slice(-(+a1 || 30)).forEach(l => console.log(typeof l === "string" ? l : l.m || JSON.stringify(l))); }
else if (cmd === "rules") { try { console.log(fs.readFileSync(path.join(G, "rules.js"), "utf8")); } catch (e) { console.log("no rules file"); } }
else console.log("usage: see header of tools/play.js");
