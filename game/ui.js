/* ============================================================
   SHIP IT!: HOT-SEAT UI
   Renders from engine state only. Contains no rules logic.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI, E = root.ShipItEngine, B = root.ShipItBot, D = root.SHIPIT_DATA;
// player-facing wording: internal effect strings keep short forms (Prod, Mktg, Mom...), the UI spells them out
SI.L = s => String(s == null ? "" : s).replace(/Draw 2 Keep 1/g, "Draw 2 Milestones, keep 1").replace(/\b(Prod|Mktg|Cult|Mom|Jr|Sr|Mile|Miles)\b/g, m => (D.labels || {})[m] || m);
const esc = s => SI.L(SI.esc(s));
const $root = document.getElementById("root");
const U = SI.U = {
  screen: "gate", tut: null, S: null, studio: SI.defaults(), role: null, owner: false, hosted: false, net: null, name: "", modal: null, sel: null, pop: null, undo: [], toast: null, cover: null,
  tab: "rules", sim: null, view: null, logOpen: false, speed: 260, seenCrisis: null, dirtyNote: false, hidePrivate: false,
  seats: [{ name: "Player 1", bot: false }, { name: "Player 2", bot: false }, { name: "Player 3", bot: true }, { name: "Player 4", bot: true }]
};
const PH = D.phases;
const catOf = d => (D.disciplines[d] && D.categories[D.disciplines[d].cat]) || { color: "#667" };
const dcol = d => catOf(d).color;
// text colour for a category-coloured fill: white fails AA on the orange and teal categories, so pick whichever of white / near-black contrasts more
const onCol = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return "#fff"; const c = [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); const L = .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; return 1.05 / (L + .05) >= (L + .05) / .0553 ? "#fff" : "#06121c"; };
const fill = hex => `background:${hex};color:${onCol(hex)}`;
const dcat = d => D.disciplines[d] ? D.disciplines[d].cat : "";
const FAT = ["Fresh", "Tired", "Exhausted"];
const FAT_TIP = ["Fresh: ready to work with no penalty.", "Tired: worked recently. Can work again, but then becomes Exhausted.", "Exhausted: placing this worker earns no skill and adds Burnout. Let them rest."];
const nameOf = t => { const k = String(t).toUpperCase(); return D.disciplines[k] ? D.disciplines[k].name : t; };
const fmtTrig = t => String(t).replace(/^(\d+)\s+(\S+)$/, (m, n, k) => n + " " + nameOf(k));
const RC = { ideas: "var(--ideas)", code: "var(--code)", process: "var(--process)", buzz: "var(--buzz)" };
// ---- icons (inline, drawn with currentColor) ----
const IC = {
  ideas: '<path d="M8 1.8a4.2 4.2 0 0 0-2.4 7.6c.5.4.8.9.8 1.5v.3h3.2v-.3c0-.6.3-1.1.8-1.5A4.2 4.2 0 0 0 8 1.8z"/><path d="M6.4 13.2h3.2M7 14.8h2"/>',
  code: '<path d="M5.2 4.4 1.8 8l3.4 3.6M10.8 4.4 14.2 8l-3.4 3.6M9.2 3 6.8 13"/>',
  process: '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M12.5 3.5l-1.4 1.4M4.9 11.1l-1.4 1.4"/>',
  buzz: '<path d="M2 6.2v3.6h2.4l5 3V3.2l-5 3z"/><path d="M11.6 5.6a3.4 3.4 0 0 1 0 4.8M13.2 3.8a6 6 0 0 1 0 8.4"/>',
  progress: '<path d="M2.5 13.5V9M6.8 13.5V6M11.1 13.5V3.4M2 13.5h12"/>',
  hype: '<path d="M8 1.6c.4 2.2 3.8 3.6 3.8 7.2A3.8 3.8 0 0 1 4.2 9c0-1.4.7-2.2 1.4-3 .1 1 .6 1.6 1.2 1.8C6.4 5.6 7 3.6 8 1.6z"/>',
  marketing: '<circle cx="8" cy="8" r="5.6"/><circle cx="8" cy="8" r="2.6"/><path d="M8 8l4.2-4.2"/>',
  burnout: '<rect x="1.8" y="4.8" width="10.4" height="6.4" rx="1.4"/><path d="M14.2 7v2M4 8h2.4"/>',
  culture: '<path d="M8 13.6S2.2 10 2.2 6.1A3 3 0 0 1 8 5a3 3 0 0 1 5.8 1.1C13.8 10 8 13.6 8 13.6z"/>',
  debt: '<ellipse cx="8" cy="9.2" rx="3.2" ry="3.9"/><path d="M8 5.3V3.2M5.4 7 2.8 5.6M10.6 7l2.6-1.4M4.8 10H2.2M11.2 10h2.6M5.6 12.4l-2 1.6M10.4 12.4l2 1.6"/>',
  gold: '<circle cx="8" cy="8" r="5.8"/><path d="M8 4.6v6.8M6.2 6.4c0-.8.8-1.2 1.8-1.2s1.8.4 1.8 1.2c0 1.6-3.6.8-3.6 2.4 0 .8.8 1.2 1.8 1.2s1.8-.4 1.8-1.2"/>'
};
const ICN = { ideas: "Ideas", code: "Code", process: "Process", buzz: "Buzz", progress: "Progress", hype: "Hype", marketing: "Wishlists", culture: "Culture", burnout: "Burnout", debt: "Tech Debt", gold: "Gold" };
const ICC = { burnout: "var(--bad)", ideas: "var(--ideas)", code: "var(--code)", process: "var(--process)", buzz: "var(--buzz)", progress: "var(--pr)", hype: "var(--hype)", marketing: "var(--mk)", culture: "#7bd88f", debt: "#ff7b72", gold: "var(--gold)" };
const ic = k => `<span class="ico" data-tip="${ICN[k]}" tabindex="0" role="img" aria-label="${ICN[k]}"><svg class="ic" viewBox="0 0 16 16" fill="none" stroke="${ICC[k]}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg></span>`;
const KEY_ORDER = ["ideas", "code", "process", "buzz", "progress", "hype", "marketing", "culture", "burnout", "debt", "gold"];
const iconKey = () => KEY_ORDER.map(k => `<span class="kk">${ic(k)}${ICN[k]}</span>`).join("");
const rowTitle = (S, key) => { const n = S.cfg.rowNames && S.cfg.rowNames[key]; return (n && n[S.phase]) || key; };
const RES_ICONS = E.RES.map(ic).join("");
const resNow = p => E.RES.map(k => `<span class="rchip" style="--c:${RC[k]}">${ic(k)}<b class="mono">${p[k]}</b></span>`).join(" ");
const fxTxt = s => fxHtml(s);
// words in requirement text become icons
const wordIcons = s => esc(s).replace(/\b(Progress|Hype|Wishlists|Debt|Culture)\b/g, w => ic(FXK[w.toLowerCase()]));
// effect text ("+3 Progress, -1 Debt, +2G") as icon chips; anything unrecognised stays as plain text
const FXK = { progress: "progress", prod: "progress", hype: "hype", marketing: "marketing", wishlists: "marketing", mktg: "marketing", culture: "culture", debt: "debt" };
function fxHtml(str) {
  return String(str || "").split(/,\s*/).filter(Boolean).map(part => {
    let m = part.match(/^([+-])(\d+)\s+(Progress|Hype|Wishlists|Culture|Debt)$/i), k;
    if (m) { k = FXK[m[3].toLowerCase()]; const good = k === "debt" ? m[1] === "-" : m[1] === "+"; return `<span class="fx1 ${good ? "g" : "b"}">${m[1] === "-" ? "−" : "+"}${m[2]}${ic(k)}</span>`; }
    m = part.match(/^([+-])(\d+)G$/); if (m) return `<span class="fx1 ${m[1] === "+" ? "g" : "b"}">${m[1] === "-" ? "−" : "+"}${m[2]}${ic("gold")}</span>`;
    return `<span class="fx1 t">${esc(part)}</span>`;
  }).join("");
}
const crewChips = spot => (spot.crew || []).map(alt => alt.map(c => `<span class="chip" style="${fill((D.categories[c] || {}).color || "#666677")}">${c}</span>`).join("+")).join(' <span class="mute">or</span> ');
const fmtBuild = s => { const p = String(s).split("+"); const m = p[0].match(/^(\d+)([MG])$/); if (!m) return s; let head; if (m[2] === "M") { const need = E.buildNeed(E.parseBuild(s)), tot = E.RES.reduce((t, k) => t + need[k], 0), gp = U.S && U.S.cfg.sysGoldMult ? Math.round(tot * U.S.cfg.sysGoldMult) : 0; head = E.resText(need) + (gp ? " + " + gp + " Gold" : ""); } else head = m[1] + "G"; return head + (p.length > 1 ? " · needs " + p.slice(1).map(nameOf).join(" and ") + " workers" : ""); };
const chip = (d, extra) => `<span class="chip" style="${fill(dcol(d))}" title="${esc(D.disciplines[d] ? D.disciplines[d].name : d)}">${esc(D.disciplines[d] ? D.disciplines[d].name : d)}${extra || ""}</span>`;
const symTag = x => { const k = x.res || (x.build ? E.sysMainRes(x) : null); return k ? ic(k) : ""; };
// player / phase / category colours are used as text on dark panels: lighten them so the text passes 4.5:1 (the swatches and fills keep the pure colour)
const lite = c => `color-mix(in srgb, ${c} 58%, #fff)`;
const catColor = { Innovation: "#e67e22", Stability: "#c0392b", Reach: "#e91e63", Revenue: "#f5c542" };
const P = i => U.S.players[i];

/* ---------- plumbing ---------- */
// kind: "" = a refusal or error (red), "info" = a notice (blue), "undo" = a notice with an Undo button (a costly action was just taken)
function toast(m, ms, kind) { U.toast = m; U.toastKind = kind || ""; render(); clearTimeout(U.toastT); U.toastT = setTimeout(() => { U.toast = null; render(); }, ms || 2600); }
// Tell every player when someone else takes a worker from the shared Recruitment pool (a bot, or another seat online)
let noticeSeen = 0;
function noteNotices() { // a player was turned into "done placing" because no tile fits their remaining workers
  const S = U.S; if (!S || U.screen !== "game") return;
  const ns = S.notices || []; if (noticeSeen > ns.length) noticeSeen = 0;
  const fresh = ns.slice(noticeSeen); noticeSeen = ns.length;
  const mine = fresh.filter(n => U.net ? U.net.mine.includes(n.p) : !S.players[n.p].bot);
  if (mine.length) setTimeout(() => toast(mine[mine.length - 1].t + ".", 7000, "info"), 0);
}
function noteRecruits() {
  const S = U.S; if (!S || !S.recruit || U.tut || U.screen !== "game") return;
  if (!U.recSeen || U.recSeen.r !== S.round) { U.recSeen = { r: S.round, ids: {} }; S.recruit.forEach((o, i) => { if (o.by != null) U.recSeen.ids[i] = 1; }); return; }
  const msgs = [];
  S.recruit.forEach((o, i) => {
    if (o.by == null || U.recSeen.ids[i]) return; U.recSeen.ids[i] = 1;
    const q = S.players[o.by]; if (!q || (U.net ? U.net.mine.includes(o.by) : !q.bot)) return; // you already know about your own recruit
    msgs.push(q.name + " recruited a " + nameOf(o.disc) + " from the pool (" + S.recruit.filter(x => x.by == null).length + " left)");
  });
  if (msgs.length) setTimeout(() => toast(msgs.join(" · "), 5000, "info"), 0);
}
function snapshot() { try { return SI.an.mark() + "|" + JSON.stringify(U.S, (k, v) => k === "data" ? undefined : v); } catch (e) { return null; } } // the number before | is the analytics event count, so Undo also rewinds the event log
function restore(js) { const data = U.S.data; const bar = js.indexOf("|"), mk = +js.slice(0, bar); const S = JSON.parse(js.slice(bar + 1)); S.data = data; U.S = S; SI.an.rebind(S, mk); }
function save() { try { root.localStorage.setItem("shipit.save.v1", JSON.stringify(U.S)); try { root.localStorage.setItem("shipit.save.tg", U.tutGame ? "1" : "0"); } catch (e2) {} if (!U.tutGame) SI.an.saveFor(); toast("Game saved in this browser", 2600, "info"); U.toast = null; } catch (e) { toast("Could not save"); } }
function loadSave() { try { const j = root.localStorage.getItem("shipit.save.v1"); if (!j) return false; U.S = JSON.parse(j); U.tut = null; U.tutGame = root.localStorage.getItem("shipit.save.tg") === "1"; U.screen = "game"; U.undo = []; U.sel = null; return true; } catch (e) { return false; } }
/* autosave: reloading or tabbing away must never drop you out of a game in progress */
const AUTO_KEY = "shipit.auto.v1";
function autosave() {
  if (U.net) return;
  clearTimeout(U.autoT);
  U.autoT = setTimeout(() => { try { if (U.screen === "game" && U.S) root.localStorage.setItem(AUTO_KEY, JSON.stringify({ S: U.S, tut: U.tut, tg: U.tutGame ? 1 : 0, an: U.tut || U.tutGame ? null : SI.an.curId() })); } catch (e) {} }, 250);
}
function clearAuto() { clearTimeout(U.autoT); try { root.localStorage.removeItem(AUTO_KEY); } catch (e) {} }
function loadAuto() { try { const j = root.localStorage.getItem(AUTO_KEY); if (!j) return false; const o = JSON.parse(j); if (!o || !o.S || (o.tut && o.tut.ver !== SI.TUT_VER)) return false; U.anId = o.an || null; U.tutGame = !!o.tg; U.S = o.S; U.tut = o.tut || null; U.screen = "game"; U.undo = []; U.sel = null; U.detail = null; return true; } catch (e) { return false; } }
function hasAuto() { try { const o = JSON.parse(root.localStorage.getItem(AUTO_KEY) || "null"); return !!(o && o.S && !o.S.over && (!o.tut || o.tut.ver === SI.TUT_VER)); } catch (e) { return false; } }
function hasSave() { try { return !!root.localStorage.getItem("shipit.save.v1"); } catch (e) { return false; } }

function act(a) {
  const S = U.S; const actor = E.currentActor(S);
  if (U.tut && !U.tut.auto) { const m = SI.tutGate(a); if (m) { toast(m); return { ok: false, error: m }; } }
  if (U.net && !U.net.mine.includes(actor)) { const w = actor >= 0 ? S.players[actor].name : "another player"; toast("Waiting for " + w); return { ok: false, error: "Not your seat" }; }
  const snap = (!U.net && actor >= 0 && !S.players[actor].bot) ? snapshot() : null;
  const s0 = S.seed;
  // costly, easy-to-misclick actions get an Undo toast (not in the guided tutorial, which scripts them)
  let undoMsg = "";
  if (snap && !U.tut) {
    if (a.type === "buyws") undoMsg = "Workstation bought for " + E.wsCost(S, actor) + "G";
    else if (a.type === "recruit" && S.recruit && S.recruit[a.idx]) undoMsg = "Recruited a " + nameOf(S.recruit[a.idx].disc) + " for " + E.recruitCost(S, actor) + "G";
    else if (a.type === "train") undoMsg = "Training started (" + S.cfg.trainCost + "G)";
  }
  const r = E.act(S, a);
  if (!r.ok) { toast(r.error || "Not allowed"); return r; }
  if (U.net) { netSend(a, s0); if (S.over && U.net.host) N2().send({ t: "over" }); }
  if (snap) { U.undo.push(snap); if (U.undo.length > 25) U.undo.shift(); }
  U.sel = null; U.pop = null; U.detail = null;
  if (U.cover != null && !(S.dq[0] && S.dq[0].p === U.cover)) U.cover = null;
  render(); scheduleBots();
  if (undoMsg) toast(undoMsg + ".", 6500, "undo");
  return r;
}
SI.act = act;
function scheduleBots() {
  clearTimeout(U.botT);
  const S = U.S; if (!S || S.over || !B.isBotTurn(S)) return;
  if (U.stepScreenOpen && !U.tut) return; // wait while a step screen is open
  if (U.net && (!U.net.host || !U.net.up)) return; // online: only the host's device runs the bots
  const allBots = S.players.every(p => p.bot);
  U.botT = setTimeout(() => {
    if (!U.S || U.S !== S) return;
    const n = allBots ? 25 : 1;
    for (let i = 0; i < n && !S.over && B.isBotTurn(S); i++) { const r = botStep(S); if (!r.ok) { toast("Bot stuck: " + r.error); return; } }
    render(); scheduleBots();
  }, allBots ? 30 : U.speed);
}
function anMeta(st, tut) { return { mode: "hotseat", site: SI.net.site(), hash: SI.hashOf(st), tuned: U.tuned, test: U.testEnv, seats: [], tut }; }
function anResume(kind) { // a game came back from the autosave or the manual save: re-attach it to its analytics record
  if (U.tut || U.tutGame || !U.S) { SI.an.abandon(); return; }
  SI.an.resume(U.S, { kind, id: U.anId, meta: anMeta(U.active || U.studio, SI.an.tutDone() ? 1 : 0) });
}
function newGame() {
  const seats = U.seats.map((s, i) => ({ name: s.name || ("Player " + (i + 1)), bot: s.bot }));
  const st = U.active || U.studio; U.tutDone = false;
  const cfgG = E.clone(st.config), gl = resolveGateLevels(); if (gl) cfgG.gateLevels = gl;
  U.S = E.newGame(seats, { config: cfgG, data: E.clone(st.data) }); U.tutGame = false;
  if (U.botSkill) U.S.players.forEach(p => { if (p.bot) p.profile = U.botSkill; });
  SI.an.abandon();
  SI.an.begin(U.S, anMeta(st, U.tutFlow ? 2 : (SI.an.tutDone() ? 1 : 0))); U.tutFlow = false;
  U.tut = null; U.detail = null; U.screen = "game"; U.undo = []; U.sel = null; U.pop = null; U.cover = null; U.modal = null; U.view = null; U.seenCrisis = null; U.seenRound = null;
  render(); scheduleBots();
}
function startTutorial() {
  clearTimeout(U.botT); SI.an.abandon(); U.S = SI.tutNew(); U.tut = SI.tutInit(); U.tutDone = false; U.tutGame = true;
  U.detail = null; U.screen = "game"; U.undo = []; U.sel = null; U.pop = null; U.cover = null; U.modal = null; U.view = null; U.seenCrisis = null; U.seenRound = null; U.keep = null; U.marketCat = null;
  render(); scheduleBots();
}

/* ---------- gate ---------- */
async function sha(s) {
  try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join(""); } catch (e) { return null; }
}
async function tryGate() {
  const v = document.getElementById("pw").value; let h = await sha(v);
  if (h == null) { let x = 0x811c9dc5; for (const c of new TextEncoder().encode(v)) { x ^= c; x = Math.imul(x, 0x01000193) >>> 0; } h = D.gate.passphraseHash; if (x.toString(16).padStart(8, "0") !== D.gate.fnv) h = ""; }
  if (h && h === D.gate.passphraseHash) { try { sessionStorage.setItem("shipit.ok", "1"); } catch (e) {} U.screen = "menu"; U.gateErr = false; } else U.gateErr = true;
  render();
}
function gateView() {
  return `<div class="center-screen"><div class="card-box"><div class="logo">SHIP <b>IT!</b></div><p class="mute" style="margin:8px 0 18px">Studio-development worker-placement game · hot-seat prototype</p>
  <label class="mute">Passphrase</label><div class="row" style="margin-top:6px"><input id="pw" type="password" class="grow" autofocus placeholder="Enter passphrase" style="padding:10px"><button class="btn primary" data-act="gate">Enter</button></div>
  ${U.gateErr ? '<p style="color:var(--bad);margin:10px 0 0">Wrong passphrase.</p>' : ""}
  <p class="dim" style="margin:16px 0 0;font-size:12px">${esc(D.gate.note)}</p></div></div>`;
}

/* ---------- gate difficulty (set before the game starts; same gates for every studio) ---------- */
const GS_LV = [["E", "Easy"], ["M", "Medium"], ["H", "Hard"]];
function gsState() { return U.gs || (U.gs = { mode: "std", E: 0, H: 0, order: "random", ph: ["M", "M", "M", "M"] }); }
function resolveGateLevels() { // an array of four codes (one per phase), or null for the standard all-Medium gates
  const g = gsState(); if (g.mode === "std") return null;
  if (g.mode === "easy") return ["E", "E", "M", "M"]; if (g.mode === "hard") return ["M", "H", "H", "H"];
  if (g.mode === "phase") return g.ph.slice();
  const a = [].concat(Array(g.E).fill("E"), Array(Math.max(0, 4 - g.E - g.H)).fill("M"), Array(g.H).fill("H"));
  if (g.order === "fall") a.reverse(); else if (g.order === "random") for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function gatePanel() {
  const g = gsState(), PN = ["Concept", "Production", "Polish", "Launch"], sel = (attr, opts, cur) => `<select ${attr}>${opts.map(o => `<option value="${o[0]}" ${String(o[0]) === String(cur) ? "selected" : ""}>${o[1]}</option>`).join("")}</select>`;
  let body = "";
  if (g.mode === "mix") body = `<div class="row wrap" style="margin-top:6px;gap:8px"><label class="mute">Easy ${sel('data-gs="E"', [0, 1, 2, 3, 4].filter(k => k + g.H <= 4).map(k => [k, k]), g.E)}</label><label class="mute">Hard ${sel('data-gs="H"', [0, 1, 2, 3, 4].filter(k => k + g.E <= 4).map(k => [k, k]), g.H)}</label><span class="mute">Medium ${4 - g.E - g.H}</span><label class="mute">Order ${sel('data-gs="order"', [["random", "Random"], ["rise", "Easy to hard"], ["fall", "Hard to easy"]], g.order)}</label></div>`;
  else if (g.mode === "phase") body = `<div class="row wrap" style="margin-top:6px;gap:8px">${PN.map((n, i) => `<label class="mute">${n} ${sel('data-gs="ph' + i + '"', GS_LV, g.ph[i])}</label>`).join("")}</div>`;
  return `<div style="margin:10px 0;padding:10px;border:1px solid var(--line,#2b3350);border-radius:10px"><div class="row wrap" style="gap:8px"><b>Publisher gates</b>${sel('data-gs="mode"', [["easy", "Easy (Easy, Easy, Medium, Medium)"], ["std", "Standard (Easy, Medium, Medium, Hard)"], ["hard", "Hard (Medium, Hard, Hard, Hard)"], ["mix", "Choose how many of each"], ["phase", "Choose phase by phase"]], g.mode)}</div>${body}<div class="dim" style="font-size:12px;margin-top:6px">Every studio faces the same gates, drawn when the game starts. Easy: lower targets and less funding. Hard: higher targets, more funding and a bigger miss penalty.</div></div>`;
}
function gsChange(t) { // returns true when handled
  if (t.dataset.gs == null) return false;
  const g = gsState(), k = t.dataset.gs, v = t.value;
  if (k === "mode" || k === "order") g[k] = v; else if (k === "E" || k === "H") g[k] = +v; else if (/^ph\d$/.test(k)) g.ph[+k[2]] = v;
  render(); return true;
}
/* ---------- menu ---------- */
const skillNames = () => root.ShipItBot ? root.ShipItBot.profileNames : [["", "Standard"]];
const skillInfo = id => (root.ShipItBot && root.ShipItBot.profileInfo && root.ShipItBot.profileInfo[id || ""]) || "";
const skillSelect = (attr, cur, title) => `<select ${attr} ${title ? `title="${title}" aria-label="${title}"` : ""}>${skillNames().map(o => `<option value="${o[0]}" ${(cur || "") === o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select>`;
function menuView() {
  const n = U.seats.length;
  if (!U.seatInit) { U.seatInit = 1; const sv = myName(); if (sv !== "Player") { const f = U.seats.find(s => !s.bot); if (f && /^Player \d$/.test(f.name)) f.name = sv; } }
  return `<div class="center-screen"><div class="card-box">
  <div class="logo">SHIP <b>IT!</b></div><p class="mute" style="margin:6px 0 16px">12 rounds · 4 phases · ${D.version}</p>
  <div class="row wrap menurow"><label class="mute" for="botskill">Bot skill <span class="dim">(all bots)</span></label>${skillSelect('id="botskill" data-botskill', U.botSkill || "")} <label class="mute" for="seatn" style="margin-left:10px">Players</label><select id="seatn" data-seatn>${[2,3,4,5].map(k => `<option ${k === n ? "selected" : ""}>${k}</option>`).join("")}</select></div>
  <div class="skilldesc" id="skilldesc">${esc(skillInfo(U.botSkill || ""))}</div>
  ${gatePanel()}
  <div class="mute" style="margin-top:10px;font-size:12px">Who is playing? Type your name, and set each seat to Human or Bot.</div>
  <div style="margin:10px 0">${U.seats.map((s, i) => `<div class="seat"><span class="dot" style="background:${["#e74c3c","#3498db","#27ae60","#f39c12","#9b59b6","#16a085"][i]}"></span><input data-seatname="${i}" value="${esc(s.name)}" placeholder="${s.bot ? "Bot name" : "Your name"}" maxlength="20"><select data-seatbot="${i}"><option value="0" ${!s.bot ? "selected" : ""}>Human</option><option value="1" ${s.bot ? "selected" : ""}>Bot</option></select></div>`).join("")}</div>
  <div class="row wrap" style="margin:0 0 10px"><label class="mute" for="sesslabel">Session label <span class="dim">(optional, saved with your games)</span></label><input id="sesslabel" data-sesslabel value="${esc(SI.an.label())}" placeholder="e.g. Table 2" maxlength="24" style="width:150px"></div>
  <div class="row wrap menubtns"><button class="btn primary" data-act="tutorial">Learn to play <span class="rsub">guided game, about 15 min</span></button><button class="btn" data-act="start">Start new game</button>${hasAuto() ? '<button class="btn" data-act="continue">Continue where you left off</button>' : ""}${hasSave() ? '<button class="btn" data-act="resume">Resume saved game</button>' : ""}${U.owner ? '<button class="btn" data-act="studio">Data Studio</button><button class="btn" data-act="master">Master</button>' : ""}</div>
  ${U.hosted ? `<div style="margin:16px 0 0;padding:12px;border:1px solid var(--line,#2b3350);border-radius:10px"><div class="mute" style="margin-bottom:8px">Play online with friends on their own devices</div>
  <div class="row wrap"><input data-pname value="${esc(myName() === "Player" ? "" : myName())}" placeholder="Your name" maxlength="20" style="width:140px"><button class="btn primary" data-act="online-create">Create online game</button><input data-jcode placeholder="CODE" maxlength="4" style="width:80px;text-transform:uppercase;letter-spacing:.2em"><button class="btn" data-act="online-join">Join</button></div>
  ${U.joinErr ? `<p style="color:var(--bad);margin:8px 0 0">${esc(U.joinErr)}</p>` : ""}</div>` : ""}
  <div class="row wrap" style="margin:14px 0 0"><button class="btn sm" data-act="cleardata">Clear saved data</button>${U.hosted ? '<button class="btn sm" data-act="logout">Log out</button>' : ""}</div>
  <p class="dim" style="margin:14px 0 0;font-size:12px">Hot-seat: pass the device between humans. Bots play the rest. Online: each player uses their own device, and hot-seat seats can share one device.${U.tuned && U.tuned !== "default" ? ` Tuning in use: ${esc(U.tuned)}.` : ""}${SI.an.pending() ? ` <span style="color:var(--gold)" title="Game records are kept on this device and sent again automatically">${SI.an.pending()} game record${SI.an.pending() > 1 ? "s" : ""} waiting to upload.</span>` : ""}</p>
  </div></div>`;
}

/* ---------- game view pieces ---------- */
const canBuildNow = S => S.step === "rest";
function actorName(S) { const a = E.currentActor(S); return a >= 0 ? S.players[a] : null; }
function stepTracker(S) { // Phase start: Crisis, Reveal. Each round: Upkeep (not round 1), Income, Order, Place, Manage
  const pg = ["Crisis", "Reveal"], rg = ["Upkeep", "Income", "Order", "Place", "Manage"];
  const inP = ["setup", "crisis"].includes(S.step), idxR = { place: 3, rest: 4 }[S.step];
  return `<div class="stepgroup sg-phase" data-tut="steps"><span class="lab">Phase start</span>${pg.map((s, i) => `<span data-step="${s}" class="step ${inP ? (i === 0 ? "on" : "") : "done"}">${s}</span>`).join("")}</div>
  <div class="stepgroup sg-round" data-tut="steps"><span class="lab">Round</span>${rg.map((s, i) => `<span data-step="${s}" class="step ${i === 0 && S.round === 1 ? "" : !inP ? (i === idxR ? "on" : i < idxR ? "done" : "") : ""}" ${i === 0 && S.round === 1 ? 'title="No Upkeep in round 1" style="opacity:.35;text-decoration:line-through"' : ""}>${s}</span>`).join("")}</div>`;
}
// a 12-segment rail: which round it is and where the phases change
function railHtml(S) {
  const pe = S.cfg.phaseEnds || [3, 8, 11, 12], phOf = r => { const k = pe.findIndex(e => r <= e); return PH[k < 0 ? PH.length - 1 : k]; };
  return `<span class="rail" role="img" aria-label="Round ${S.round} of 12, ${esc(PH[S.phase].name)}">${Array.from({ length: 12 }, (_, i) => { const r = i + 1, ph = phOf(r); return `<i class="${r < S.round ? "d" : r === S.round ? "n" : ""}" style="--c:${ph.color}" title="Round ${r} · ${esc(ph.name)}"></i>`; }).join("")}</span>`;
}
const STEP_NAME = { setup: "Phase start", crisis: "Crisis", place: "Place", rest: "Manage" };
function topbar(S) {
  const ph = PH[S.phase];
  return `<div class="top"><div class="logo" style="font-size:22px">SHIP <b>IT!</b></div>
  <span class="phasepill" style="background:${ph.color}">${ph.name.toUpperCase()}</span><b class="rn">Round ${S.round}/12</b>${railHtml(S)}${stepTracker(S)}
  <div class="grow"></div>
  ${U.net ? `<span class="mute" title="Game code">${U.net.up ? "●" : "○ reconnecting"} Game ${esc(U.net.code)}</span>` : U.tut ? "" : `<button class="btn sm" data-act="undo" ${U.undo.length ? "" : "disabled"} title="${U.undo.length ? "Take back your last action" : "Nothing to undo yet"}">↶ Undo</button>`}
  <button class="btn sm" data-act="rules">Rules</button><button class="btn sm sec" data-act="milesref">Milestones</button><button class="btn sm" data-act="scoreref">Score</button><button class="btn sm sec" data-act="log">Log</button>${U.net ? "" : '<button class="btn sm sec" data-act="save">Save</button>'}
  ${U.owner ? '<button class="btn sm sec" data-act="studio">Data Studio</button><button class="btn sm sec" data-act="master">Master</button>' : ""}${U.tut || (S && S.over) || (U.net && !U.net.host) ? "" : '<button class="btn sm danger sec" data-act="endgame">End game</button>'}<button class="btn sm" data-act="${U.net ? "menu" : "gamemenu"}">${U.net ? "Leave" : "Menu"}</button></div>`;
}
function prompt(S) {
  const d = S.dq[0]; const a = actorName(S);
  if (S.over) return "Game over";
  if (d) return { keepObj: "choose your objectives", bid: "secret auction bid", choose: "make a crisis choice", pickWorker: "choose a worker to lose", raidHire: "Studio Raid: hire at half cost?", pivot: "pivot your Platform", dropObj: "remove an objective", keepMile: "choose milestone(s) to keep", swapObjPick: "choose objective", patch: "Day-One Patch: spend Momentum" }[d.t] || "decide";
  return { place: "select a worker, then a highlighted tile (or Pass)", rest: "manage: build systems, cash in milestones, train or promote, then Done" }[S.step] || "";
}
// what the person whose turn it is should do right now, in one sentence
function hintFor(S, a) {
  if (S.dq.length) return prompt(S);
  if (S.step === "rest") return "Manage: build systems, cash in Milestones, train or promote, then press Done.";
  if (S.step !== "place") return prompt(S);
  const free = a.workers.filter(w => !w.placed && !w.build && !w.benched), tot = a.ws == null ? Math.min(S.cfg.wsMax, S.cfg.wsFree) : a.ws, left = Math.max(0, tot - (a.wsUsed || 0));
  const sw = U.sel != null ? a.workers.find(w => w.id === U.sel) : null;
  if (sw) return "Now tap a highlighted tile (orange border) for your " + dname(sw.disc) + ". Tap the worker again to cancel.";
  if (!free.length) return "All your workers are placed. Press Pass to finish.";
  if (left <= 0) { const bw = S.cfg.wsMax ? E.canBuyWs(S, a.id) : { ok: false }; return "No free workstation. " + (bw.ok ? "Buy one for " + E.wsCost(S, a.id) + "G, or press Pass." : (bw.reason ? bw.reason + ". " : "") + "Press Pass to finish."); }
  return "Pick a worker, then a highlighted tile (orange border). " + free.length + " worker" + (free.length === 1 ? "" : "s") + " left · " + left + " workstation" + (left === 1 ? "" : "s") + " free.";
}
function banner(S) {
  const a = actorName(S), ai = E.currentActor(S);
  if (S.over) return `<div class="turnbanner"><div class="who">Game over</div><button class="btn primary" data-act="results">View results</button></div>`;
  const col = a ? a.color : "#556", mineTurn = !!a && !a.bot && (!U.net || U.net.mine.includes(ai));
  const where = `${esc(PH[S.phase].name)} · Round ${S.round}/12 · ${esc(STEP_NAME[S.step] || "")}`;
  // the last few things that happened this round (a short event feed, so a bot's move is never invisible)
  const evs = (S.log || []).filter(l => l.r === S.round && !/^(---|TURN ORDER|INCOME|RECRUITMENT|UPKEEP|MANAGE|PLACE|===)/.test(l.m)).slice(-3);
  const evHtml = evs.length ? `<div class="ev">${evs.map(l => `<div>${esc(l.m)}</div>`).join("")}</div>` : "";
  const humans = S.players.filter(p => !p.bot).length;
  let kick, prm, cls;
  if (mineTurn) { kick = humans > 1 ? "Your turn" : "Your turn"; prm = hintFor(S, a); cls = "mine"; }
  else if (a && a.bot) { kick = "Waiting for"; prm = S.step === "place" || S.step === "rest" ? "A bot is choosing. You play when it finishes." : "A bot is deciding."; cls = "wait"; }
  else { kick = "Waiting for"; prm = U.net ? "It will be your turn after theirs." : "Waiting."; cls = "wait"; }
  return `<div class="turnbanner ${cls}" style="border-left:6px solid ${col}" role="status" aria-live="polite"><div><div class="kick">${kick}</div><div class="who"><span class="dot" style="background:${col};display:inline-block;margin-right:6px;vertical-align:-1px"></span>${a ? esc(a.name) : "…"}${cls === "wait" ? '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>' : ""}</div></div><div class="grow prompt">${esc(prm)}<div class="where">${where}</div>${evHtml}</div>
  ${S.step === "place" && mineTurn && !S.dq.length ? '<button class="btn" data-tut="pass" data-act="pass" title="End your placing for this round. Workers you did not place rest and recover.">Pass: done placing</button>' : ""}
  ${S.step === "rest" && mineTurn && !S.dq.length ? `<button class="btn primary" data-tut="done" data-act="done" title="End your Manage step">Done</button>` : ""}</div>`;
}
// which skill an earn spot pays: the worker's own role decides, so a spot whose roles share one category pays that skill; mixed spots show each possible icon
function earnHtml(spot) {
  const ks = []; (spot.discs || []).forEach(d => { if (d === "ANY") return; const c = E.CAT_OF(d), k = c && E.RES_OF[c]; if (k && !ks.includes(k)) ks.push(k); });
  const x = spot.r > 1 ? "×" + spot.r : "×1";
  const any = (spot.discs || []).includes("ANY") || !ks.length;
  const icons = any ? '<span class="ic4">' + RES_ICONS + "</span>" : ks.map(ic).join('<span class="slash">/</span>');
  const tip = any ? "Earn the skill of each worker's own role" : ks.length > 1 ? "Earns " + ks.map(k => ICN[k]).join(" or ") + " depending on the worker's role" : "Earn " + ICN[ks[0]];
  return `<span class="fx1 earn">${icons}<b>${x}</b></span>`;
}
function spotTile(S, spot, view) {
  const occ = (S.occ[spot.id] || []);
  let cls = "spot", reason = "";
  const a = E.currentActor(S); const w = (U.sel != null && a >= 0 && S.step === "place") ? P(a).workers.find(x => x.id === U.sel) : null;
  if (w) { const o = E.placementOptions(S, a, w).find(x => x.target === "spot:" + spot.id); if (o && o.ok) cls += " ok"; else { cls += " no"; reason = o ? o.reason : ""; } }
  if (((spot.mode || "single") === "single" && occ.length) || (S.closed && S.closed[spot.id])) cls += " taken";
  if (spot.debt) cls += " hasdebt";
  if (spot.mode === "shared" || ["team", "outsource", "workshop", "mentor", "crunch", "fundraise"].includes(spot.id)) cls += " shared-s";
  const mode = spot.mode === "shared" ? "SHARED" : spot.mode === "multi" ? "MULTI" : spot.excl ? "EXCL" : "";
  const fxh = (spot.fx ? fxHtml(spot.fx) : "") + (spot.r ? earnHtml(spot) : "") + (!spot.fx && !spot.r ? `<span class="fx1 t">${esc(spot.tile || spot.note || "")}</span>` : "");
    return `<button class="${cls}" data-act="detail" data-k="spot" data-id="${spot.id}" data-spot="${spot.id}" title="${esc(reason || spot.note || "")}" ${cls.includes("ok") ? "" : 'aria-disabled="true"'}>
    ${spot.debt ? `<span class="corner" title="Adds ${spot.debt} Tech Debt">+${spot.debt}${ic("debt")}</span>` : ""}
    ${S.phase !== 3 && ["EARN", "PROGRESS", "HYPE", "CREW"].includes(spot.row) ? (mode ? `<div class="kind">${mode}</div>` : "") : `<div class="kind">${esc(spot.row)} ${mode ? "· " + mode : ""}</div>`}
    <div class="dc">${spot.crew ? crewChips(spot) : spot.discs.map(d => d === "ANY" ? '<span class="chip" style="background:#667">ANY</span>' : chip(d)).join("")}${spot.srOnly ? '<span class="chip" style="background:#a33">Sr</span>' : ""}</div>
    <div class="fx">${fxh}</div>${spot.cost ? `<div class="note">${(spot.cost.res ? "Pay " + spot.cost.res + " skills" : "Pay " + spot.cost.gold + "G") + (JSON.stringify(spot.crew || []).includes("Any") ? " · 2 workers, different roles" : "")}</div>` : ""}
    ${cls.includes(" no") && reason ? `<div class="why">${esc(reason)}</div>` : cls.includes(" taken") && !S.closed[spot.id] && occ.length ? `<div class="why taken">Taken by ${occ.map(i => esc(P(i).name)).join(", ")}</div>` : ""}<div class="occ">${occ.map(i => `<i style="${fill(P(i).color)}" title="${esc(P(i).name)}">${i + 1}</i>`).join("")}</div>${S.closed && S.closed[spot.id] ? `<div class="why" style="display:block">Closed this round (Industry News)</div>` : ""}</button>`;
}
function recruitPanel(S) {
  if (!S.recruit || S.step !== "place" || S.phase === 3) return "";
  const minR = S.cfg.recruitMinRound || 2;
  if (S.round < minR) return `<div class="panel compact" data-tut="recruit"><h3>Recruitment</h3><p class="hint">Opens in round ${minR}: a shared pool of new Juniors you can pay to join your studio.</p></div>`;
  const a = E.currentActor(S), me = a >= 0 && !S.players[a].bot && S.step === "place" && !S.dq.length;
  const tiles = S.recruit.map((o, i) => {
    const ck = me ? E.canRecruit(S, a, i) : { ok: false, reason: "" };
    const taken = o.by != null;
    return `<div class="sys" style="width:190px;${taken ? "opacity:.55" : ""}"><div class="t" style="color:${dcol(o.disc)}">${esc(nameOf(o.disc))}</div><div class="meta">${esc(o.cat)} · Junior</div>
    <div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap">${taken ? `<span class="mute"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${P(o.by).color}"></i> ${esc(P(o.by).name)}</span>` : `<button class="btn sm primary" data-act="recruit" data-i="${i}" ${ck.ok ? "" : "disabled"} title="${esc(ck.ok ? "" : ck.reason || "")}">Recruit · ${me ? E.recruitCost(S, a) : S.cfg.recruitCost}G</button>`}</div>${!taken && !ck.ok && ck.reason ? `<div class="why">${esc(ck.reason)}</div>` : ""}</div>`;
  }).join("");
  return `<div class="panel" data-tut="recruit"><h3>Recruitment</h3><p class="hint">Pay ${S.cfg.recruitCost}G, no worker needed. A new Junior can be placed this round. One per player per round; the pool is shared and refreshes every round.</p><div class="row wrap">${tiles}</div></div>`;
}
function buildingsList(S, p) {
  const b = p.building || []; if (!b.length) return "";
  return b.map(x => { const def = E.sysDef(S, x.name); return `<div class="sys" style="border-style:dashed;border-color:${catColor[x.cat]};opacity:.85"><div class="t">${esc(x.name)} ${symTag(def)}</div><div class="meta">${x.cat} · <b>Building</b>, ready in round ${x.rdy}${x.rush ? " (crunched)" : ""}</div>${(x.crew || []).length ? `<div class="meta">Team busy: ${esc((x.crew || []).map(id => { const q = p.workers.find(z => z.id === id); return q ? nameOf(q.disc) : ""; }).filter(Boolean).join(" + "))}</div>` : ""}</div>`; }).join("");
}
function boardView(S) {
  const ph = PH[S.phase]; const spots = E.activeSpots(S);
  const SIDE = ["team", "insight", "outsource", "workshop", "mentor", "crunch", "fundraise"]; const isSide = s => s.mode === "shared" || SIDE.includes(s.id) || (s.id === "talent1" || s.id === "rd"); const main = spots.filter(s => !isSide(s)); const shared = spots.filter(isSide);
  const rows = []; main.forEach(s => { let r = rows.find(x => x.name === s.row && !(S.phase === 3)); if (!r) { r = { name: s.row, items: [] }; rows.push(r); } r.items.push(s); }); { const ORD = ["EARN", "PROGRESS", "HYPE", "CREW"]; rows.sort((a, b) => (ORD.indexOf(a.name) < 0 ? 9 : ORD.indexOf(a.name)) - (ORD.indexOf(b.name) < 0 ? 9 : ORD.indexOf(b.name))); }
  const launch = S.phase === 3;
  return `<div class="panel"><h3><span style="color:${lite(ph.color)}">Main board: ${ph.name}</span><span class="mute" style="text-transform:none;letter-spacing:0"></span></h3>
  <div class="board" data-tut="board"><div class="rows">${launch ? `<div class="spots">${main.map(s => spotTile(S, s)).join("")}</div>` : rows.map(r => `<div class="brow" data-row="${esc(r.name)}"><div class="lab" style="color:${lite(ph.color)}">${esc(rowTitle(S, r.name))}</div><div class="spots">${r.items.map(s => spotTile(S, s)).join("")}</div></div>`).join("")}
  ${launch ? launchThresholds(S) : ""}</div>
  <div class="shared col"><div class="mute" style="font-size:11px;letter-spacing:.1em;text-transform:uppercase">${esc(rowTitle(S, "UTILITY"))}</div>${shared.map(s => spotTile(S, s)).join("")}</div></div><div class="boardrefs"><div class="boardref wcost"><div class="wt">Worker cost</div><div><b>Junior</b> recruited for ${ic("gold")}<b>${S.cfg.recruitCost}+</b> · salary ${ic("gold")}<b>${S.cfg.salaryJr}</b> per round · earns <b>+${S.cfg.resJr}</b> of the tile’s skill</div><div><b>Senior</b> promoted free · salary ${ic("gold")}<b>${S.cfg.salarySr}</b> per round · earns <b>+${S.cfg.resSr}</b> of the tile’s skill</div></div><div class="boardref r"><div class="key">${iconKey()}</div></div></div></div>`;
}
function raceRules(S) {
  const c = S.cfg, N = S.players.length, tab = E.rankTable(c, N), ord = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  const lossT = mx => { const t = []; for (let k = 0; k < N; k++) t.push(N > 1 ? Math.round(mx * (N - 1 - k) / (N - 1)) : 0); return t; };
  const box = (title, body, col) => `<div class="pt" style="border-color:${col};flex:1;min-width:150px"><b style="color:${lite(col)}">${title}</b><div class="mute">${body}</div></div>`;
  return `<div class="row wrap" style="margin-top:8px;gap:6px">${box("PROGRESS RACE", "1 VP for every " + c.raceDen + " Progress", "#3498db")}${box("HYPE RACE (Hype + Wishlists)", "1 VP for every " + c.raceDen + " Hype", "#e67e22")}${box("DEBT (most loses most)", lossT(c.debtLossByN && c.debtLossByN[N] != null ? c.debtLossByN[N] : c.debtLossMax).map((v, i) => (i === N - 1 ? "least" : ord[i] + " most") + " −" + v).join(" · ").replace(/−0/g, "0"), "#c0392b")}${box("BURNOUT (high costs VP)", Object.keys(c.burnVP || {}).filter(k => (c.burnVP[k] || 0) < 0).map(k => k + ": −" + Math.abs(c.burnVP[k])).join(" · ") || "no cost", "#27ae60")}</div><div class="mute" style="font-size:12px;margin-top:4px">At the end of the game, ${c.mktgToHype === 1 ? "your Wishlists are added to your Hype" : "Wishlists add to Hype"} for the Hype race.</div>`;
}
const launchThresholds = S => raceRules(S);
function viewIndex(S) {
  const a = E.currentActor(S);
  if (U.net) { if (U.net.mine.includes(a)) return a; if (U.view != null && S.players[U.view]) return U.view; return U.net.mine.length ? U.net.mine[0] : 0; }
  if (a >= 0 && !S.players[a].bot) return a;
  if (U.view != null) return U.view;
  const human = S.players.find(p => !p.bot); return human ? human.id : 0;
}
function priv(S, vi) { if (U.net) return S.over || U.net.mine.includes(vi); const a = E.currentActor(S); return S.over || (a === vi && !S.players[vi].bot) || S.players.every(p => p.bot); }
function workerCard(S, w, vi, selectable) {
  const sel = U.sel === w.id; const lvl = w.lvl === "Sr" ? "Senior" : "Junior";
  const pick = !!selectable && S.step === "place" && !S.dq.length && !w.placed && !w.build && !w.benched;
  return `<div class="wk ${sel ? "sel" : ""} ${w.placed || w.build ? "placed" : ""} ${pick ? "pick" : ""}" ${pick ? `data-act="sel-worker" data-id="${w.id}" title="Click to ${sel ? "deselect" : "select"} for placing"` : `data-act="detail" data-k="worker" data-id="${w.id}" data-p="${vi}"`}>
   <div class="whd" style="${fill(dcol(w.disc))}">${esc(dcat(w.disc))}</div>
   <div class="wbd"><div class="d">${esc(D.disciplines[w.disc].name)}</div>${w.as ? `<div class="as">acts as ${nameOf(w.as)}</div>` : ""}<div class="l ${w.lvl === "Sr" ? "sr" : ""}">${lvl}</div><div class="fat f${w.fat}" title="${FAT_TIP[w.fat]}"><i></i></div><div class="fl" title="${esc(w.benched ? "Away this round: " + w.benched : FAT_TIP[w.fat])}">${w.build ? "Building" : w.benched ? "Away: " + w.benched : w.training ? "Training next round" : w.placed ? "Placed" : FAT[w.fat]}</div></div>${pick ? `<button class="wi" data-act="detail" data-k="worker" data-id="${w.id}" data-p="${vi}" aria-label="Worker details">Details</button>` : ""}${(() => { if (!selectable || w.lvl !== "Jr" || S.dq.length || (S.step !== "place" && S.step !== "rest") || (U.tut && SI.tutHideTrain && SI.tutHideTrain())) return ""; const t = E.canTrain(S, vi, w); return t.ok ? `<button class="wi" data-act="train" data-w="${w.id}" style="right:auto;left:4px" title="Pay ${S.cfg.trainCost}G: this Junior sits out and moves toward promotion">Train \u00b7 ${S.cfg.trainCost}G</button>` : ""; })()}</div>`;
}
// the studio's workers sit above the main board so the worker you place is next to the tile you place it on
function fatigueLine(S, p) {
  const c = S.cfg;
  const avail = p.workers.filter(w => !w.placed && !w.build && !w.benched), exh = avail.filter(w => w.fat >= 2);
  const sw = U.sel != null ? p.workers.find(w => w.id === U.sel) : null;
  const oN = p.rs && p.rs.overN || 0, burnAdd = Math.min(c.burnOverMax || 2, Math.floor(oN / (c.burnOverStep || 1)));
  const risky = p.workers.filter(w => w.placed && w.overWhenPlaced).length;
  const bits = [];
  if (sw && sw.fat >= 2) bits.push(`<b>${esc(dname(sw.disc))} is Exhausted.</b> Placing them is overwork: no skill, +1 Burnout${S.round === 12 ? " (round 12 counts too)" : ""}.`);
  else if (avail.length && exh.length * 2 >= avail.length) bits.push(`${exh.length} of your ${avail.length} available workers are Exhausted. Resting some now keeps them working later.`);
  if (oN) bits.push(`If you stop now: Burnout +${burnAdd}.`);
  return bits.length ? `<div class="mute" style="font-size:12px;margin-top:8px;line-height:1.5">${bits.join(" ")}</div>` : "";
}
function workersPanel(S) {
  const vi = viewIndex(S); const p = P(vi); const a = E.currentActor(S); const mine = a === vi && !p.bot;
  const sel = mine && S.step === "place" && !S.dq.length;
  return `<div class="panel"><h3><span style="color:${lite(p.color)}">${esc(p.name)}'s studio workers</span><span class="mute" style="text-transform:none;letter-spacing:0">${p.workers.length} workers</span></h3><div class="workers" data-tut="workers">${p.workers.length ? p.workers.map(w => workerCard(S, w, vi, sel && !w.placed)).join("") : '<span class="mute">No workers yet. Recruit from the shared pool.</span>'}</div>${sel || (S.step === "place" && mine) ? fatigueLine(S, p) : ""}${fatLegend(p)}</div>`;
}
// what the Tired / Exhausted badges mean, shown only while a worker actually has one
function fatLegend(p) {
  const tir = p.workers.some(w => w.fat === 1), exh = p.workers.some(w => w.fat >= 2); if (!tir && !exh) return "";
  return `<div class="fatlegend">${tir ? '<span><b class="fatchip f1">Tired</b> worked recently: can work again, but then becomes Exhausted.</span>' : ""}${exh ? '<span><b class="fatchip f2">Exhausted</b> placing earns no skill and adds Burnout. Skip placing them to rest.</span>' : ""}</div>`;
}
// Workstations: each board tile (perks included) needs one; triggering your own systems does not
function wsLine(S, p) {
  const a = E.currentActor(S), mine = a === p.id && !p.bot && S.step === "place" && !S.dq.length;
  const bw = mine ? E.canBuyWs(S, p.id) : { ok: false };
  const tot = p.ws == null ? Math.min(S.cfg.wsMax, S.cfg.wsFree) : p.ws, left = Math.max(0, tot - (p.wsUsed || 0));
  const btn = mine && tot < S.cfg.wsMax ? ` <button class="btn sm" data-act="buyws" ${bw.ok ? "" : "disabled"} title="${esc(bw.ok ? "" : bw.reason || "")}">Buy workstation · ${E.wsCost(S, p.id)}G</button>${bw.ok ? "" : `<span class="why">${esc(bw.reason || "")}</span>`}` : mine && tot >= S.cfg.wsMax ? ' <span class="mute">(the maximum)</span>' : "";
  return `<div class="row" data-tut="ws" style="font-size:12px;margin-top:6px;gap:6px;align-items:center" title="A worker needs a free workstation to take any board tile or Studio Perk. Triggering your own systems does not need one. You start with ${S.cfg.wsFree}; buy more (max ${S.cfg.wsMax}). Bought workstations come back every round of the phase; a new phase resets you to ${S.cfg.wsFree}."><b>Workstations</b> <span>${left} free of ${tot}</span>${btn}</div>`;
}
function playerPanel(S) {
  const vi = viewIndex(S); const p = P(vi); const a = E.currentActor(S); const mine = a === vi && !p.bot;
  const sel = mine && S.step === "place" && !S.dq.length;
  let h = `<div class="panel" data-tut="mine"><h3><span style="color:${lite(p.color)}">${esc(p.name)}'s systems and goals</span><span class="mute" style="text-transform:none;letter-spacing:0">${p.systems.length} systems</span></h3>`;
  // systems
  h += `<div class="sub">Systems <span class="dim">(slots ${S.cfg.slotsPerCategory}/category)</span></div><div class="row wrap">`;
  if (!p.systems.length) h += '<span class="mute">None built.</span>';
  p.systems.forEach((sy, i) => {
    const def = E.sysDef(S, sy.name); let cls = "sys";
    const w = sel && U.sel != null ? p.workers.find(x => x.id === U.sel) : null; let reason = "";
    if (w) { const o = E.placementOptions(S, vi, w).find(x => x.target === "sys:" + i); if (o && o.ok) cls += " ok"; else reason = o ? o.reason : ""; }
    h += `<button class="${cls}" style="border-color:${catColor[def.cat]}" data-act="detail" data-k="sys" data-id="${i}" data-p="${vi}" title="${esc(reason)}"><div class="t">${esc(def.name)} ${symTag(def)}</div><div class="meta">${def.cat} · trigger ${esc(fmtTrig(def.trig))}${sy.t ? " · <b>used</b>" : ""}</div><div class="e">${fxTxt(def.fx || def.each || "")}</div>${def.pas ? `<div class="e" style="color:var(--gold)">Passive: ${esc(def.pas)}</div>` : ""}<div class="vp">${def.vp} VP</div></button>`;
  });
  h += "</div>";
  if ((p.building || []).length) h += `<div class="sub">Building (finishes later; no trigger, passive or score until ready)</div><div class="row wrap">${buildingsList(S, p)}</div>`;
  if (priv(S, vi)) {
    h += `<div class="sub">Milestones (${p.miles.length}) · cash in when met</div><div class="row wrap" data-tut="miles">${p.miles.map(id => mileCard(S, id, vi, mine)).join("") || '<span class="mute">None</span>'}</div>`;
    h += `<div class="sub">Objectives: scored at end</div><div class="row wrap">${p.objectives.map(id => objCard(S, id, vi, mine)).join("") || '<span class="mute">None</span>'}</div>`;
  } else h += `<p class="mute" style="margin-top:12px">Milestones and objectives are hidden until it is ${esc(p.name)}'s turn.</p>`;
  return h + "</div>";
}
function mileWhen(m, win) {
  const ph = (m.phases || []).slice().sort((a, b) => a - b); if (!ph.length) return "Any phase";
  const nm = i => esc((D.phases[i] || {}).name || "");
  const span = ph.length === 1 ? nm(ph[0]) : nm(ph[0]) + " to " + nm(ph[ph.length - 1]);
  return (win === "open" ? "Open now: " : win === "later" ? "Opens in " : "Expired: ") + span;
}
function mileCard(S, id, vi, mine) {
  const m = S.data.milestones[id]; const met = E.milestoneMet(S, vi, id), win = E.mileWindow(S, m);
  return `<div class="sys" data-act="detail" data-k="mile" data-id="${id}" data-p="${vi}" style="width:170px;cursor:pointer;border-color:${met ? "var(--good)" : "var(--line)"};${win === "later" ? "opacity:.7" : ""}"><div class="t">${esc(m.name)}</div><div class="e" style="color:var(--gold)">+${m.gold}G ${met ? '<span style="color:var(--good)">MET</span>' : ""}</div><div class="mute" style="font-size:11px">${mileWhen(m, win)}</div></div>`;
}
function objCard(S, id, vi, mine) {
  const o = S.data.objectives[id]; const st = E.objectiveStatus(S, vi, id); const n = st.reqs.filter(r => r.ok).length;
  return `<div class="sys" data-act="detail" data-k="obj" data-id="${id}" data-p="${vi}" style="width:170px;cursor:pointer;border-color:${st.met ? "var(--good)" : "var(--line)"}"><div class="t">${esc(o.name)} ${symTag(o)}</div><div class="meta">${o.type} · up to ${o.vp} VP · ${n}/${st.reqs.length} met</div></div>`;
}
function actionArea(S) {
  const a = actorName(S); if (!a || a.bot || S.dq.length) return "";
  let h = "";
  if (canBuildNow(S)) {
    const free = a.freeBuilds > 0;
    h += `<div class="panel"><h3>Build systems</h3><div class="row wrap"><button class="btn primary" data-tut="market" data-act="market">Open Systems to Build</button><span class="mute">${resNow(a)} · ${ic("gold")} <b class="mono" style="color:var(--gold)">${a.gold}</b> · builds ${a.builds}/${E.maxBuilds(S, a)}${free ? ` · <b style="color:var(--good)">${a.freeBuilds} FREE build</b>` : ""}</span></div></div>`;
  }
  if (S.step === "rest") h += cleanMiles(S, a) + restView(S, a);
  return h;
}
// Manage step: milestones sit at the top with a Cash in button once met
function cleanMiles(S, a) {
  if (!a || a.bot) return "";
  const cards = a.miles.map(id => { const met = E.milestoneMet(S, a.id, id), m = S.data.milestones[id], open = E.mileWindow(S, m) !== "later";
    return `<div class="col" style="gap:4px">${mileCard(S, id, a.id, true)}${actBtn("Cash in +" + m.gold + "G", `data-act="claim" data-mile="${id}"`, !met, met ? "" : "Requirement not met yet", false)}</div>`; }).join("");
  return `<div class="panel" data-tut="miles"><h3>Your milestones (${a.miles.length}): cash in when met</h3><div class="row wrap" style="align-items:flex-start">${cards || '<span class="mute">No milestones in hand.</span>'}</div></div>`;
}
function restView(S, a) {
  return `<div class="panel" data-tut="rest"><h3>Manage: build, train, promote, cash in</h3><div class="mute" style="margin:2px 0 6px">Cash in any met Milestone above, click a worker to train or promote them, then press Done.</div><div class="workers">${a.workers.map(w => workerCard(S, w, a.id, false)).join("") || '<span class="mute">No workers.</span>'}</div></div>`;
}
function gatesPanel(S) {
  if (!S.cfg.gatesEnabled || !(S.data.publisherGates || []).length || S.step === "setup") return "";
  const list = E.gateList(S);
  if (!list) return `<div class="panel" data-tut="gates"><h3>Publisher gates</h3><div class="mute">Four reviews are drawn at random from the gate pool at the end of round 1, one per phase. Every game has a different set.</div></div>`;
  const vi = viewIndex(S); const p = P(vi);
  const rows = list.map(g => {
    const done = (S.gates || []).find(x => x.phase === g.phase); const now = g.phase === S.phase && !S.over; const last = D.phases[g.phase].rounds[1];
    let state = "", cls = "";
    if (done) { const ok = done.passed.includes(vi); state = ok ? `<b style="color:var(--good)">Passed</b>${done.best === vi ? " ★ favorite" : ""}` : `<b style="color:var(--bad)">Missed</b>`; }
    else if (now) state = `<span class="mute">due end of round ${last}</span>`; else state = `<span class="mute">round ${last}</span>`;
    const reqs = done || !now ? g.reqs.map(r => wordIcons(r)).join(", ") : g.reqs.map(r => { const ok = E.reqOk(S, vi, r); return `<span style="color:${ok ? "var(--good)" : "var(--bad)"}">${ok ? "✓" : "✗"} ${wordIcons(r)}</span>`; }).join(" · ");
    return `<div style="padding:6px 8px;margin-bottom:4px;border-radius:8px;border:1px solid ${now ? "var(--gold)" : "var(--line)"};${now ? "background:rgba(245,197,66,.07)" : ""}"><div class="row" style="justify-content:space-between"><b>${esc(g.name)}${g.lvl && g.lvl !== "M" ? ` <span style="font-size:11px;font-weight:700;color:${g.lvl === "H" ? "var(--bad)" : "var(--good)"}">${g.lvlName}</span>` : ""}</b>${state}</div><div style="font-size:12px;margin-top:2px">${reqs}</div><div class="mute" style="font-size:11px;margin-top:2px">${g.fund ? "Pass: +" + g.fund + ic("gold") : ""}${E.gateEff(S, g).vp ? (g.fund ? ", " : "Pass: ") + "+" + E.gateEff(S, g).vp + " VP" : ""} · Miss: ${E.gateEff(S, g).miss.replace("-", "−")}</div></div>`;
  }).join("");
  let hor = "";
  if (S.cfg.crisisEnabled && S.phase < 3 && S.decks.crisis[S.phase] && S.decks.crisis[S.phase].length) { const id = S.decks.crisis[S.phase][S.decks.crisis[S.phase].length - 1]; const c = S.data.crisis.find(x => x.id === id); if (c) hor = `<div class="mute" style="margin-top:6px;font-size:12px"><b>On the horizon</b> (next phase): ${esc(c.name)}</div>`; }
  return `<div class="panel" data-tut="gates"><h3>Publisher gates</h3>${rows}${hor}</div>`;
}
// Progress and Hype race tracks: one lane per player, the publisher gate target marked on each
function racePanel(S) {
  const c = S.cfg, gs = S.gateSet && S.gateSet.length ? S.gateSet : S.data.publisherGates, g = (gs || []).find(x => x.phase === S.phase);
  const tgt = k => { const m = g && (g.reqs || []).map(r => r.match(new RegExp("^(\\d+)\\+ " + k))).find(Boolean); return m ? +m[1] : 0; };
  const lane = (key, title, val, extra) => {
    const rows = S.players.map(p => ({ p, v: val(p), x: extra ? extra(p) : 0 })).sort((a, b) => (b.v + b.x) - (a.v + a.x));
    const gate = tgt(title), mx = Math.max(20, gate + 4, ...rows.map(r => r.v + r.x)) * 1.08;
    let rank = 0, prev = null; const mx0 = rows.some(r => r.v + r.x > 0);
    const body = rows.map((r, i) => { if (r.v + r.x !== prev) rank = i + 1; prev = r.v + r.x; const pc = n => (n / mx * 100).toFixed(1) + "%";
      return `<div class="lane" title="${esc(r.p.name)}: ${r.v}${r.x ? " + " + r.x + " Wishlists" : ""}"><span class="rk">${mx0 ? rank : "–"}</span><span class="dot" style="background:${r.p.color}"></span><span class="ln">${esc(r.p.name)}</span><div class="bar"><i style="width:${pc(r.v)};background:${r.p.color}"></i>${r.x ? `<i class="x" style="left:${pc(r.v)};width:${pc(r.x)};background:${r.p.color}"></i>` : ""}${gate ? `<u style="left:${pc(gate)}"></u>` : ""}</div><b class="mono">${r.v + r.x}</b></div>`; }).join("");
    return `<div class="trk"><div class="th">${ic(key)}<b>${title}</b>${gate ? `<span class="mute">gate ${gate}+</span>` : ""}</div>${body}</div>`;
  };
  return `<div class="panel" data-tut="tracks"><h3>Race tracks <span class="mute" style="text-transform:none;letter-spacing:0">1 VP per ${c.raceDen} points</span></h3>${lane("progress", "Progress", p => p.prod)}${lane("hype", "Hype", p => p.hype, p => Math.floor(p.mktg * (c.mergeMktg ? 0 : c.mktgToHype)))}</div>`;
}
function playersPanel(S) {
  const stand = (S.round >= 4 && !["setup", "end"].includes(S.step)) ? E.score(S) : null;
  const standRank = {}; if (stand) stand.slice().sort((x, y) => y.total - x.total).forEach((x, i) => { standRank[x.id] = i + 1; });
  const ordered = !["setup", "crisis"].includes(S.step) && S.order.length === S.players.length;
  const list = ordered ? S.order.map(i => S.players[i]) : S.players;
  return list.map(p => {
    const pos = S.order.indexOf(p.id); const cur = E.currentActor(S) === p.id; const vi = viewIndex(S) === p.id;
    return `<div class="pt ${cur ? "cur" : ""}" data-pid="${p.id}" data-act="view" data-v="${p.id}" style="cursor:pointer;${vi ? "background:var(--panel2)" : ""}"><div class="nm"><span class="dot" style="background:${p.color}"></span>${esc(p.name)}${p.bot ? ' <span class="tag">bot</span>' : ""}<span class="grow"></span>${ordered && pos >= 0 ? `<span class="ordbadge" title="Turn order this round: the studio with the fewest VP goes first (catch-up)">Turn order: ${pos + 1}</span>` : ""}</div>
    <div class="stats big">${[["g", "gold", p.gold], ["k", "marketing", p.mktg]].map(x => `<div class="st rs ${x[0]}" title="${ICN[x[1]]}">${ic(x[1])}<span class="sv"><small>${ICN[x[1]]}</small><b>${x[2]}</b></span></div>`).join("")}
    <div class="st rs d" title="Tech Debt (share of the Debt limit)">${ic("debt")}<span class="sv"><small>Tech Debt</small><b>${p.debt} <span class="dim">${Math.round(E.debtPct(S, p))}%</span></b></span></div><div class="st rs bo ${E.burnBand(S, p) === "Steady" ? "" : "hot"}" title="Burnout ${p.burnout} of ${S.cfg.burnMax}. ${E.burnBand(S, p)}. Culture is ${E.cultureOf(S, p)} (${S.cfg.cultureFoldBase} minus Burnout): Culture gains lower Burnout, Culture losses raise it">${ic("burnout")}<span class="sv"><small>Burnout · Culture ${E.cultureOf(S, p)}</small><b>${p.burnout} <span class="dim">${E.burnBand(S, p)}</span></b></span></div></div>
    <div class="stats res">${E.RES.map(k => `<div class="st rs" title="${E.RES_NAME[k]}: earned by placing a ${({ ideas: "Creative", code: "Development", process: "Operations", buzz: "Marketing" })[k]} role">${ic(k)}<span class="sv"><small>${ICN[k]}</small><b style="color:${RC[k]}">${p[k]}</b></span></div>`).join("")}</div>
    ${S.cfg.wsMax ? wsLine(S, p) : ""}<div class="mute" style="font-size:11px;margin-top:4px">${p.workers.length} workers · ${p.systems.length} systems${(p.building || []).length ? " (+" + p.building.length + " building)" : ""}${p.vpAdj ? " · crisis VP " + (p.vpAdj > 0 ? "+" : "") + p.vpAdj : ""}</div><div class="mute" style="font-size:11px;margin-top:2px" title="Income each round minus the salaries of your workers">Per round: +${S.cfg.income} income, -${p.workers.reduce((a, w) => a + (w.lvl === "Sr" ? S.cfg.salarySr : S.cfg.salaryJr), 0)} payroll</div>${stand ? `<div class="mute" style="font-size:11px;margin-top:2px" title="Live estimate of your final score if the game ended now. The studio with the fewest VP acts first each round.">Standing #${standRank[p.id]} · est. ${stand[p.id].total} VP</div>` : ""}</div>`;
  }).join("");
}
/* Player-picked build crew: one free worker per role the system needs (no auto-picking) */
function crewModal(S) {
  const c = U.crew; if (!c) return "";
  const pi = viewIndex(S), p = P(pi), def = E.sysDef(S, c.name), cands = E.crewCandidates(S, pi, c.name);
  const wl = id => { const w = p.workers.find(x => x.id === id); return `${w.lvl === "Sr" ? "Senior" : "Junior"} ${esc(dname(w.disc))} · ${FAT[w.fat]}`; };
  const used = Object.values(c.sel);
  const rows = cands.map((r, i) => `<div class="dsec"><h4>${esc(dname(r.role))} needed</h4><div class="row wrap" style="gap:6px">${r.ids.length ? r.ids.map(id => { const on = c.sel[i] === id, taken = !on && used.includes(id); return `<button class="btn sm ${on ? "primary" : ""}" ${taken ? "disabled" : ""} data-act="crew-pick" data-i="${i}" data-w="${id}">${wl(id)}</button>`; }).join("") : `<span class="mute">Nobody free can fill this role</span>`}</div></div>`).join("");
  let crunchRow = "";
  if (c.crunch === "fat") { const tw = p.workers.filter(w => w.fat < 2); crunchRow = `<div class="dsec"><h4>Crunch: who works late?</h4><div class="row wrap" style="gap:6px">${tw.map(w => `<button class="btn sm ${c.cw === w.id ? "primary" : ""}" data-act="crew-cw" data-w="${w.id}">${wl(w.id)}</button>`).join("")}</div><div class="mute" style="font-size:12px;margin-top:4px">That worker becomes one step more tired.</div></div>`; }
  const ready = cands.length === Object.keys(c.sel).length && cands.every((r, i) => c.sel[i] != null) && (c.crunch !== "fat" || c.cw != null);
  return modalShell(`<h2>Pick the build crew</h2><p class="mute">${esc(def.name)} needs ${cands.length} worker${cands.length === 1 ? "" : "s"}. They sit out until it is finished. You choose who.</p>${rows}${crunchRow}
  <div class="row" style="margin-top:12px;gap:8px"><button class="btn" data-act="crew-cancel">Back</button>${actBtn("Start build", 'data-act="crew-ok"', !ready, "Pick a worker for every role", true)}</div>`);
}
function liveVpPanel(S) {
  if (["setup"].includes(S.step) || !S.players.length) return "";
  const me = viewIndex(S), sc = E.score(S), f = v => { const n = Math.round(+v * 10) / 10; return Number.isInteger(n) ? String(n) : n.toFixed(1); };
  const rows = sc.map(r => { const own = r.id === me, secret = (r.parts.objectives || 0) + (r.parts.synergy || 0), shown = r.total - secret; const pr = r.parts; return { r, own, shown, pr, sys: (pr.systems || 0), races: (pr.prodShare || 0) + (pr.hypeStrength || 0), neg: (pr.debtPenalty || 0) + (pr.burnout || 0), other: (pr.gold || 0) + (pr.crisis || 0) + (pr.reach || 0) }; }).sort((a, b) => b.shown - a.shown);
  const top = rows[0] ? rows[0].shown : 0;
  const G = "display:grid;grid-template-columns:minmax(0,1fr) repeat(5,42px);gap:4px;align-items:center;font-size:12px;padding:3px 0";
  const head = `<div style="${G};opacity:.7;font-size:11px"><span></span><span title="Progress and Hype race">Races</span><span>Sys</span><span title="Debt and Burnout VP">Costs</span><span title="Gold, gates and crisis cards">Other</span><span>VP</span></div>`;
  return `<div class="panel pnl-vp" data-tut="livevp"><h3>Live VP <span class="mute" style="font-size:11px;font-weight:400">if the game ended now</span></h3>${head}${rows.map(x => `<div style="${G};${x.own ? "background:var(--panel2);border-radius:6px;" : ""}"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span class="dot" style="background:${P(x.r.id).color};display:inline-block;margin-right:4px"></span>${esc(x.r.name)}</span><span>${f(x.races)}</span><span>${f(x.sys)}</span><span>${f(x.neg)}</span><span>${f(x.other)}</span><b>${f(x.shown)}${x.shown === top ? " \u2605" : ""}</b></div>`).join("")}<div class="mute" style="font-size:11px;margin-top:4px">Objectives are secret and only score at the end of the game, so they are not counted here.${(() => { const m = rows.find(x => x.own); return m ? " Yours so far: " + f((m.r.parts.objectives || 0) + (m.r.parts.synergy || 0)) + " VP." : ""; })()}</div></div>`;
}

/* ---------- step and phase transition screens ---------- */
const PHASE_GOAL = ["Earn skills, recruit your first workers and start your first system.", "The race begins: take Progress and Hype tiles, build systems, keep Debt and Burnout in check.", "Finish systems (check build time), push Hype late because it fades, fix Debt.", "Spend everything. There is no Upkeep after this round, so Burnout and quitting no longer apply."];
/* One layout for every between-step screen (round start, phase start, round 12): a header with the round rail, what just happened (signed deltas),
   what changed for you, what is next, and ONE primary button in the same place. Only the sections differ. */
function stepShell(S, step, title, body, btn) {
  return modalShell(`<div class="rs"><div class="rs-top"><span class="rs-kick">Round ${S.round} of ${S.cfg.rounds || 12}</span>${railHtml(S)}<span class="phasepill" style="background:${PH[S.phase].color}">${esc(PH[S.phase].name.toUpperCase())}</span></div><h2>${title}</h2>${body}<div class="rs-foot"><button class="btn primary big" data-act="stepnext" data-tut="stepnext">${btn || "Continue"}</button></div></div>`, { noClose: true, cls: "rsm" });
}
const sgn = n => n > 0 ? "+" + n : n < 0 ? "−" + Math.abs(n) : "0";
// a signed change: the sign carries the meaning, colour only reinforces it (good = green, bad = red)
const dl = (n, risingIsGood, unit) => `<b class="dl ${n === 0 ? "z" : (n > 0) === (risingIsGood !== false) ? "g" : "b"}">${sgn(n)}${unit || ""}</b>`;
const rsSec = (title, html, cls) => `<section class="rs-sec ${cls || ""}"><h4>${title}</h4>${html}</section>`;
function gatePass(S, g) { const e = E.gateEff(S, g); return [g.fund ? "+" + g.fund + " Gold" : "", e.vp ? "+" + e.vp + " VP" : ""].filter(Boolean).join(", ") || "no reward"; }
const humanIds = S => S.players.filter(p => !p.bot).map(p => p.id);
const youTag = (S, p) => humanIds(S).length === 1 && !p.bot ? ' <span class="tag you">you</span>' : p.bot ? ' <span class="tag">bot</span>' : "";
// who goes first, in turn order, with each studio's Gold and (from round 2) what the new round did to it
function rsTable(S) {
  const rn = S.rnote && S.rnote.r === S.round ? S.rnote : null, hs = humanIds(S), ord = S.order.length === S.players.length ? S.order : S.players.map(p => p.id);
  const rows = ord.map((i, k) => {
    const p = S.players[i], n = rn && rn.p[i] || null;
    const goldCell = n ? `<b class="mono">${n.goldNow != null ? n.goldNow : p.gold}G</b><div class="rsub">${[`${sgn(n.income || 0)} income`, n.salary ? `${sgn(-n.salary)} salaries` : "", n.bonus ? `${sgn(n.bonus)} bonus` : ""].filter(Boolean).join(" · ")}</div>${n.short ? `<div class="rsub bad">short by ${n.short}G: Burnout rises</div>` : ""}` : `<b class="mono">${p.gold}G</b>`;
    return `<tr class="${hs.length === 1 && i === hs[0] ? "me" : ""}"><td><span class="ordn">${k + 1}</span></td><td><b style="color:${lite(p.color)}">${esc(p.name)}</b>${youTag(S, p)}</td><td>${goldCell}</td>${rn ? `<td>${n && n.hype ? dl(n.hype, true) : '<span class="mute">–</span>'}</td><td>${n ? (n.burn ? dl(n.burn, false) : '<span class="mute">–</span>') + `<div class="rsub">${esc(n.band || "")}</div>` : ""}</td>` : `<td class="mute">${p.workers.length} workers</td>`}</tr>`;
  }).join("");
  const first = S.players[ord[0]];
  const cue = hs.length === 1 ? (ord[0] === hs[0] ? `<b>You go first.</b>` : `<b>${esc(first.name)} goes first</b>, then you.`) : `<b>${esc(first.name)} goes first.</b>`;
  return `<table class="tbl rs-tbl"><thead><tr><th>Turn</th><th>Studio</th><th>Gold</th>${rn ? "<th>Hype</th><th>Burnout</th>" : "<th></th>"}</tr></thead><tbody>${rows}</tbody></table><div class="rs-first">${cue} <span class="mute">${S.round === 1 ? "Round 1 follows seat order." : "Fewest VP goes first, so a studio that is behind gets first pick."}</span></div>`;
}
// the few things that changed for the human player(s) and could change a decision
function rsNotes(S) {
  const hs = humanIds(S); if (hs.length !== 1) return "";
  const p = S.players[hs[0]], out = [], rn = S.rnote && S.rnote.r === S.round ? S.rnote.p[p.id] : null;
  const fin = (S.log || []).filter(l => l.r === S.round && l.m.indexOf(p.name + "'s ") === 0 && / is finished \(/.test(l.m)).map(l => l.m.replace(p.name + "'s ", "").replace(/ is finished.*/, ""));
  if (fin.length) out.push(`<b>${fin.map(esc).join(", ")}</b> ${fin.length === 1 ? "is" : "are"} finished: ${fin.length === 1 ? "its" : "their"} workers are free again and a Senior can trigger ${fin.length === 1 ? "it" : "them"}.`);
  const exh = p.workers.filter(w => w.fat >= 2 && !w.build && !w.benched).length, tir = p.workers.filter(w => w.fat === 1 && !w.build && !w.benched).length;
  if (exh) out.push(`<b>${exh} Exhausted worker${exh > 1 ? "s" : ""}.</b> Placing ${exh > 1 ? "them" : "one"} earns no skill and adds Burnout, so let ${exh > 1 ? "them" : "it"} rest.`);
  else if (tir) out.push(`${tir} Tired worker${tir > 1 ? "s" : ""}: they can work, but placing them again makes them Exhausted.`);
  if (rn && rn.band && rn.band !== "Steady" && rn.band !== "Energized") out.push(`Burnout is <b>${esc(rn.band)}</b> (${p.burnout}).`);
  if (rn && rn.lost) out.push(`<b>${rn.lost} worker${rn.lost > 1 ? "s" : ""} quit</b> from Burnout.`);
  return out.length ? rsSec("What changed for you", `<ul class="rs-ul">${out.slice(0, 4).map(x => `<li>${x}</li>`).join("")}</ul>`) : "";
}
function startScreen(S) {
  const ph = S.data.phases[S.phase], g = (E.gateList(S) || []).find(x => x.phase === S.phase), hs = humanIds(S);
  const rows = S.players.map(p => `<tr><td><b style="color:${lite(p.color)}">${esc(p.name)}</b>${youTag(S, p)}</td><td><b class="mono">${p.gold}G</b></td><td>${p.workers.length} Juniors: ${p.workers.map(w => esc(dname(w.disc))).join(", ")}</td></tr>`).join("");
  return [{ key: "start", step: null, title: `${esc(ph.name)} begins`, body: rsSec("Where you start", `<table class="tbl rs-tbl"><thead><tr><th>Studio</th><th>Gold</th><th>Team</th></tr></thead><tbody>${rows}</tbody></table>`) + rsSec("What is next", `<div class="rs-first">${hs.length === 1 && S.order[0] === hs[0] ? "<b>You go first.</b>" : `<b>${esc(S.players[S.order[0]].name)} goes first.</b>`} <span class="mute">Select a worker, then a highlighted tile (orange border). You start with ${S.cfg.wsFree} workstation, so you place one worker a round until you buy more.</span></div>${g ? `<div class="rs-gate"><b>${esc(g.name)}</b> <span class="tag">${esc(g.lvlName || "Medium")}</span> is due at the end of ${esc(ph.name)}: needs ${wordIcons((g.reqs || []).join(", "))}. Pass <b>${gatePass(S, g)}</b> · miss <b>${esc(E.gateEff(S, g).miss.replace("-", "−"))}</b></div>` : ""}`) }];
}
function stepScreens(S) {
  if (S.round === 1) return startScreen(S);
  const r = S.round, ph = S.data.phases[S.phase], pe = S.cfg.phaseEnds || [2, 8, 11, 12], starts = [1].concat(pe.slice(0, 3).map(x => x + 1));
  const f1 = v => { const n = Math.round(+v * 10) / 10; return Number.isInteger(n) ? String(n) : n.toFixed(1); };
  const sc = E.score(S), vp = {}; sc.forEach(x => { vp[x.id] = x.total - (x.parts.objectives || 0) - (x.parts.synergy || 0); });
  const closed = Object.keys(S.closed || {}).map(id => { const sp = S.data.spots.find(x => x.id === id); return sp ? sp.row : id; });
  const closedHtml = closed.length ? rsSec("Industry News", `<div>Closed this round: <b>${closed.map(esc).join(" · ")}</b></div>`) : "";
  // Ordinary round: what the new round did, then turn order
  if (!starts.includes(r)) return [{ key: "round", step: null, title: `Round ${r} begins`, body: rsSec("What just happened", rsTable(S)) + rsNotes(S) + closedHtml + rsSec("Your first move", `<div>Select a worker, then a highlighted tile (orange border)${S.recruit && S.phase !== 3 ? ". The Recruitment pool has refreshed" : ""}.</div>`) }];
  // First round of a phase: gate result, standings, what is new, next gate
  const prev = S.data.phases[S.phase - 1], g = (S.gates || []).slice(-1)[0], gl = E.gateList(S) || [], ng = gl.find(x => x.phase === S.phase), pg = g ? gl.find(x => x.phase === g.phase) : null;
  const nm = i => esc(S.players[i].name);
  let gateHtml = "";
  if (g) {
    const eff = pg ? E.gateEff(S, pg) : { miss: "", vp: 0 };
    gateHtml = rsSec(`Publisher Gate: ${esc(g.name)}`, `<ul class="rs-ul gate">${S.players.map(p => { const ok = g.passed.includes(p.id); return `<li class="${ok ? "ok" : "no"}"><b style="color:${lite(p.color)}">${esc(p.name)}</b>${youTag(S, p)}: <b>${ok ? "✓ Passed" : "✗ Missed"}</b> ${ok ? `<span class="dl g">${esc(pg ? gatePass(S, pg) : "")}</span>` : `<span class="dl b">${esc((eff.miss || "").replace("-", "−"))}</span>`}</li>`; }).join("")}</ul>`, "gate");
  }
  const snap = S.order.map(i => { const p = S.players[i]; return `<tr class="${humanIds(S).length === 1 && i === humanIds(S)[0] ? "me" : ""}"><td><b style="color:${lite(p.color)}">${esc(p.name)}</b></td><td><b>${f1(vp[i])}</b></td><td class="mono">${p.gold}G</td><td class="mono">${p.systems.length}</td><td class="mono">${p.prod}</td><td class="mono">${p.hype}${p.mktg ? " +" + p.mktg : ""}</td></tr>`; }).join("");
  const newSp = E.activeSpots(S).filter(sp => !(sp.phases || []).includes(S.phase - 1) && (sp.phases || []).includes(S.phase)).map(sp => (sp.row === "CREW" ? (sp.note || sp.id).replace(/^Strike Team( of \d)?: /, "Strike Team: ") : sp.row.charAt(0) + sp.row.slice(1).toLowerCase()) + (sp.fx ? " (" + sp.fx + ")" : "")).slice(0, 10);
  const nextGate = ng ? rsSec(`Next gate: ${esc(ng.name)}`, `<div><span class="tag">${esc(ng.lvlName || "Medium")}</span> due at the end of ${esc(ph.name)}: needs ${wordIcons((ng.reqs || []).join(", "))}<br>Pass <b>${gatePass(S, ng)}</b> · miss <b>${esc(E.gateEff(S, ng).miss.replace("-", "−"))}</b></div>`, "gate") : "";
  const launch = S.phase === 3 ? rsSec("Final round checklist", `<ul class="rs-ul"><li><b>Convert</b> unspent skills into Progress or Hype: skills score nothing on their own.</li><li>Leftover Gold is worth <b>1 VP per ${S.cfg.goldPerVP || 3}</b>, so spend only what earns more.</li><li>There is no Upkeep after this round, but an Exhausted worker you place still adds Burnout.</li></ul>`, "gate") : "";
  return [{ key: "phase", step: null, title: `${esc(prev.name)} complete: ${esc(ph.name)} begins`, body: gateHtml + rsSec("What just happened", rsTable(S)) + rsNotes(S) + launch + nextGate + rsSec("Standings", `<details class="rs-det"><summary>Show public VP, Gold, systems, Progress and Hype</summary><table class="tbl rs-tbl"><thead><tr><th>Studio</th><th>VP</th><th>Gold</th><th>Systems</th><th>Progress</th><th>Hype</th></tr></thead><tbody>${snap}</tbody></table><div class="rsub">Objectives stay secret. Hype shows banked Wishlists as +N.</div></details>`) + `<p class="rs-goal">${esc(PHASE_GOAL[S.phase] || "")}</p>` + (newSp.length ? `<details class="rs-det"><summary>New on the board this phase (${newSp.length})</summary><div class="mute">${newSp.map(esc).join(" · ")}</div></details>` : "") + closedHtml }];
}
function rsFirst(S) { const hs = humanIds(S), ord = S.order; return hs.length === 1 ? (ord[0] === hs[0] ? "<b>You go first.</b>" : `<b>${esc(S.players[ord[0]].name)} goes first</b>, then you.`) : `<b>${esc(S.players[ord[0]].name)} goes first.</b>`; }
function manageScreen(S) {
  const p = S.players[viewIndex(S)], names = [].concat.apply([], Object.values(S.market || {})), can = names.filter(n => E.canBuild(S, p.id, n, false, null).ok).length;
  return { key: "manage", step: "Manage", title: "Manage", body: `<p>Placement is over. Now build systems, cash in milestones, and train or promote workers. Then press Done.</p><div class="dsec"><h4>You have</h4><div>${p.gold} Gold · ${can} system${can === 1 ? "" : "s"} you can build now · ${p.miles.length} milestone${p.miles.length === 1 ? "" : "s"} in hand</div><div class="mute" style="font-size:12px">Promotion is free for a Junior who trained once, or who worked earlier and sat out this round.</div></div>` };
}
function nextStepScreen(S) {
  if (!S._ssid) S._ssid = String(Math.random()).slice(2, 8);
  const seen = U.seenStep = U.seenStep || {}, id = S._ssid + ":" + S.round + ":";
  const list = S.step === "place" ? stepScreens(S) : [];
  const sc = list.find(x => !seen[id + x.key]);
  U.stepScreenOpen = !!sc;
  if (!sc) return "";
  U.stepKey = id + sc.key;
  return stepShell(S, sc.step, sc.title, sc.body, "Start placing");
}

function crisisCardHtml(c) {
  if (!c) return "";
  return `<div class="crisis d${c.deck}"><div class="k">${["Concept → Production","Production → Polish","Polish → Launch"][c.deck]} · Crisis · ${c.kind}</div><div class="n">${esc(c.name)}</div><div class="fl">${esc(c.flavor)}</div><div>${esc(c.text)}</div></div>`;
}
function gameView() {
  const S = U.S;
  const crisis = S.crisisCard ? S.data.crisis.find(c => c.id === S.crisisCard) : null;
  return `<div class="app ${U.tut ? "tutmode" : ""}">${topbar(S)}<div class="main"><div class="left">${banner(S)}${actionArea(S)}${recruitPanel(S)}${canBuildNow(S) ? marketStrip(S) : ""}${workersPanel(S)}${boardView(S)}${canBuildNow(S) ? "" : marketStrip(S)}${playerPanel(S)}</div>
  <div class="right">${liveVpPanel(S)}<div class="panel pnl-studios"><h3>Studios</h3><div class="col studios">${playersPanel(S)}</div></div>${racePanel(S)}${gatesPanel(S)}${crisis ? `<div class="panel" data-tut="crisis" data-act="detail" data-k="crisis" style="cursor:pointer"><h3>Active crisis</h3>${crisisCardHtml(crisis)}</div>` : ""}
  <div class="panel pnl-log"><h3>Game log <button class="btn sm" data-act="log">${U.logOpen ? "Hide" : "Show all"}</button></h3><div class="log" style="${U.logOpen ? "max-height:60vh" : ""}">${S.log.slice(U.logOpen ? -300 : -14).reverse().map(l => `<div><span class="r">R${l.r}</span> ${esc(l.m)}</div>`).join("")}</div></div></div></div></div>`;
}

/* ---------- modals ---------- */
function modalShell(inner, opts) {
  opts = opts || {};
  return `<div class="overlay" ${opts.noClose ? "" : 'data-act="overlay"'}><div class="modal ${opts.cls || ""}" ${opts.wide ? 'style="width:min(1100px,100%)"' : ""}>${opts.noClose ? "" : '<button class="x" data-act="close" aria-label="Close">×</button>'}${inner}</div></div>`;
}
function roundIntroModal(S) {
  const rn = S.rnote; if (!rn) return "";
  const sg = n => (n > 0 ? "+" : n < 0 ? "\u2212" : "") + Math.abs(n);
  const cols = S.players.map(p => ({ p, n: rn.p[p.id] || {} }));
  const row = (label, hint, f) => `<tr><td><b>${label}</b><div class="mute" style="font-size:11px">${hint}</div></td>${cols.map(c => `<td style="text-align:right">${f(c.n, c.p)}</td>`).join("")}</tr>`;
  const ph = S.data.phases[S.phase];
  return modalShell(`<h2>Round ${S.round} begins <span class="mute" style="font-size:14px;font-weight:400">\u00b7 ${esc(ph.name)}</span></h2>
  <p class="mute">Here is what happened between rounds.</p>
  <table class="tbl" style="width:100%"><thead><tr><th></th>${cols.map(c => `<th style="text-align:right;color:${c.p.color}">${esc(c.p.name)}</th>`).join("")}</tr></thead><tbody>
  ${row("Income", "paid at the start of the round", n => `<span style="color:var(--good,#6c6)">${sg(n.income || 0)}G</span>`)}
  ${row("Salaries", "paid for every worker", n => (n.salary ? `<span style="color:var(--bad,#e66)">${sg(-n.salary)}G</span>` : "0G") + (n.short ? `<div class="mute" style="font-size:11px">short by ${n.short}G</div>` : ""))}
  ${cols.some(c => c.n.bonus) ? row("Bonuses", "from your Burnout band and systems", n => n.bonus ? sg(n.bonus) + "G" : "-") : ""}
  ${row("Hype", "fades each round", n => n.hype ? sg(n.hype) : "-")}
  ${row("Burnout", "from last round's work", n => (n.burn ? sg(n.burn) : "-") + `<div class="mute" style="font-size:11px">${esc(n.band || "")}</div>`)}
  ${cols.some(c => c.n.lost) ? row("Workers lost", "Exhausted workers who quit", n => n.lost ? sg(-n.lost) : "-") : ""}
  <tr><td><b>Gold now</b></td>${cols.map(c => `<td style="text-align:right"><b>${c.n.goldNow != null ? c.n.goldNow : c.p.gold}G</b></td>`).join("")}</tr>
  </tbody></table>
  <div style="margin-top:14px;text-align:right"><button class="btn primary" data-act="close">Start placing</button></div>`);
}
function milesModal(S) {
  const done = {}; S.players.forEach(p => p.claimed.forEach(id => { done[id] = p; }));
  const cats = []; S.data.milestones.forEach((m, id) => { let c = cats.find(x => x.name === m.cat); if (!c) { c = { name: m.cat, items: [] }; cats.push(c); } c.items.push({ m, id }); });
  const left = S.data.milestones.length - Object.keys(done).length;
  return modalShell(`<h2>Milestones</h2><p class="mute">Every milestone is public. Players hold them in secret, but anyone can see what exists and what has already been cashed in. ${left} of ${S.data.milestones.length} still available.</p>
  ${cats.map(c => `<div class="dtitle" style="margin-top:12px">${esc(c.name)} <span class="mute" style="font-size:12px;font-weight:400">${c.items.filter(x => !done[x.id]).length}/${c.items.length} available</span></div><div class="col" style="gap:4px">${c.items.map(({ m, id }) => { const p = done[id]; return `<div class="row" style="gap:8px;align-items:baseline;${p ? "opacity:.5" : ""}"><b style="min-width:150px">${esc(m.name)}</b><span style="color:var(--gold);min-width:34px">+${m.gold}G</span><span class="mute grow">${esc(m.text)}</span>${p ? `<span title="Cashed in by ${esc(p.name)}"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></i> ${esc(p.name)}</span>` : ""}</div>`; }).join("")}</div>`).join("")}`, { wide: true });
}
function endGameModal() {
  return modalShell(`<h2>End the game now?</h2><p class="mute">The game stops where it is and scores are counted as things stand. Use this to finish a test early or after a mistake.</p><div class="row" style="margin-top:14px"><button class="btn primary" data-act="endgame-yes">End game and show scores</button><button class="btn" data-act="close">Keep playing</button></div>`);
}
function clearDataModal() {
  return modalShell(`<h2>Clear saved data on this device</h2><p class="mute">Nothing here touches other players or the shared game records.</p><div class="col" style="gap:8px;margin-top:10px">
    <button class="btn" data-act="cleardata-do" data-v="save" ${hasSave() ? "" : "disabled"}>Clear saved game and recent game</button>
    <button class="btn" data-act="cleardata-do" data-v="room">Forget my last online game</button>
    ${U.owner ? '<button class="btn" data-act="cleardata-do" data-v="studio">Reset my local Data Studio edits</button>' : ""}
    <button class="btn" data-act="cleardata-do" data-v="all">Clear everything above and my saved name</button></div>`);
}
function decisionModal(S) {
  const d = S.dq[0]; const p = P(d.p); const crisis = d.card ? S.data.crisis.find(c => c.id === d.card) : (S.crisisCard && ["choose","pickWorker","raidHire","pivot","dropObj","patch"].includes(d.t) ? S.data.crisis.find(c => c.id === S.crisisCard) : null);
  let h = `<h2 style="color:${lite(p.color)}">${esc(p.name)}</h2>`;
  if (crisis) h += crisisCardHtml(crisis) + '<div style="height:10px"></div>';
  switch (d.t) {
    case "keepObj":
      h += `<h3 style="margin-bottom:8px">Choose your objectives (keep ${S.cfg.objKeep} of ${S.cfg.objDraw} per type)</h3>`;
      Object.keys(d.opts).forEach(t => { h += `<div class="mute" style="margin:8px 0 4px">${t}</div><div class="row wrap">${d.opts[t].map((id, i) => { const o = S.data.objectives[id]; const sel = (U.keep && U.keep[t] === id) || (!U.keep || U.keep[t] == null) && i === 0; return `<div class="sys ${sel ? "ok" : ""}" style="width:220px;border-color:${sel ? "var(--gold)" : "var(--line)"}" data-act="keep" data-t="${t}" data-id="${id}"><div class="t">${esc(o.name)} ${symTag(o)}</div><div class="meta">up to ${o.vp} VP (1 per requirement met, +${S.cfg.objBonus} if all)</div>${o.reqs.map(r => `<div class="meta">• ${esc(r)}</div>`).join("")}</div>`; }).join("")}</div>`; });
      h += `<div style="margin-top:12px"><button class="btn primary" data-act="keep-ok">Confirm objectives</button></div>`; break;
    case "bid": {
      h += `<h3>Secret auction bid</h3><p class="mute">Winner pays their bid. Others keep their gold. You have <b style="color:var(--gold)">${p.gold}G</b>.</p>
      <label class="bidlab" for="bid">Your bid in Gold (0 to ${p.gold})</label><div class="row"><input id="bid" type="number" inputmode="numeric" min="0" max="${p.gold}" value="0" style="width:110px;font-size:22px;min-height:48px"><button class="btn primary" style="min-height:48px;padding:0 22px" data-tut="act" data-act="bid">Lock in bid</button></div>`; break; }
    case "choose": h += `<h3>Your choice</h3>` + d.options.map(o => `<button class="btn optbtn" data-act="choose" data-k="${o.k}" ${o.disabled ? "disabled" : ""} title="${esc(o.reason || "")}"><b>${o.k.length === 1 ? o.k + ")" : ""}</b> ${esc(o.label)}${o.disabled ? ' <span class="mute">(' + esc(o.reason || "") + ")</span>" : ""}</button>`).join(""); break;
    case "pickWorker": h += `<h3>Choose a worker to lose${d.srOnly ? " (Sr only)" : ""}</h3><div class="workers">${p.workers.map(w => `<div class="wk" data-act="pickw" data-w="${w.id}" style="${d.srOnly && w.lvl !== "Sr" ? "opacity:.3;pointer-events:none" : ""}"><div class="d" style="color:${dcol(w.disc)}">${w.disc}</div><div class="l">${w.lvl} · ${["Active","Tired","Exhausted"][w.fat]}</div></div>`).join("")}</div>`; break;
    case "raidHire": {
      const half = l => Math.floor((l === "Jr" ? S.cfg.jrCost : S.cfg.srCost) / 2);
      h += `<h3>Recruit a Junior at half cost</h3><p class="mute">Jr ${half("Jr")}G · you have ${p.gold}G. Any discipline is available.</p>`;
      const opts = S.pool.length ? S.pool : E.DISCS.map(x => ({ disc: x, lvl: "Jr" })); // Seniors are never for sale, so only Juniors are offered
      h += `<div class="row wrap">${opts.map(o => `<button class="btn sm" data-act="raid" data-disc="${o.disc}" data-lvl="${o.lvl}" ${p.gold < half(o.lvl) || (o.lvl === "Sr" && !E.srAllowed(S)) ? "disabled" : ""}>${o.lvl} ${o.disc} · ${half(o.lvl)}G</button>`).join("")}</div><div style="margin-top:10px"><button class="btn" data-act="raid-skip">Pass</button></div>`; break; }
    case "pivot": { const o = S.data.objectives[d.fresh], old = S.data.objectives[d.old];
      h += `<h3>New Platform: ${esc(o.name)}</h3><div class="sys" style="width:240px"><div class="t">${esc(o.name)} ${symTag(o)}</div><div class="meta">up to ${o.vp} VP (1 per requirement met, +${S.cfg.objBonus} if all)</div>${o.reqs.map(r => `<div class="meta">• ${esc(r)}</div>`).join("")}</div><p class="mute">Current Platform: ${esc(old.name)} (up to ${old.vp} VP)</p><div class="row"><button class="btn primary" data-act="pivot" data-r="1">Replace current</button><button class="btn" data-act="pivot" data-r="0">Keep both</button></div>`; break; }
    case "dropObj": h += `<h3>Remove ${d.left} objective(s) from scoring</h3><div class="row wrap">${p.objectives.map(id => { const o = S.data.objectives[id]; return `<div class="sys" data-act="drop" data-id="${id}" style="cursor:pointer"><div class="t">${esc(o.name)}</div><div class="meta">up to ${o.vp} VP (1 per requirement met, +${S.cfg.objBonus} if all)</div></div>`; }).join("")}</div>`; break;
    case "keepMile": h += `<h3>Keep ${d.keep} milestone(s)</h3><div class="row wrap">${d.opts.map(id => { const m = S.data.milestones[id]; return `<div class="sys" style="width:200px;cursor:pointer" data-act="keepm" data-id="${id}"><div class="t">${esc(m.name)}</div><div class="meta">${esc(m.text)}</div><div class="e" style="color:var(--gold)">+${m.gold}G</div></div>`; }).join("")}</div>`; break;
    case "patch": { const fx = S.data.crisis.find(c => c.id === "patch").params.fixes; h += `<h3>Emergency fixes</h3><p class="mute">${resNow(p)} · Tech Debt ${p.debt}</p><div class="row wrap">${fx.map((f, i) => `<button class="btn" data-act="patchfix" data-i="${i}" ${E.resTotal(p) < f[0] ? "disabled" : ""}>Spend ${f[0]} skills → −${f[1]} Debt</button>`).join("")}<button class="btn primary" data-act="patchdone">Done</button></div>`; break; }
  }
  return modalShell(h, { noClose: true });
}
function coverView(S) {
  const d = S.dq[0]; const p = P(d.p);
  return `<div class="cover"><div><div class="dot" style="background:${p.color};width:34px;height:34px;margin:0 auto 14px"></div><h1>Pass to ${esc(p.name)}</h1><p class="mute">${d.t === "keepObj" ? "Choose your secret objectives" : "Secret bid"}. Other players look away.</p><button class="btn primary" style="font-size:18px;padding:12px 28px" data-act="uncover">I'm ready</button></div></div>`;
}
/* ---------- detail popup (click any card, tile or object) ---------- */
function actBtn(label, attrs, disabled, reason, primary) {
  return `<button class="btn ${primary === false ? "" : "primary"}" data-tut="act" ${attrs} ${disabled ? "disabled" : ""} title="${esc(reason || "")}">${esc(label)}</button>${disabled && reason ? `<span class="mute" style="font-size:12px;margin-left:6px">${esc(reason)}</span>` : ""}`;
}
function discHead(disc) { const d = D.disciplines[disc]; return `<div class="dhead" style="${fill(dcol(disc))}"><span>${esc(d.cat)}</span></div>`; }
const dname = d => (D.disciplines[d] || {}).name || d;
function lines(items) { return `<ul class="dl">${items.filter(Boolean).map(s => `<li>${s}</li>`).join("")}</ul>`; }
function sec(title, items) { return `<div class="dsec"><h4>${esc(title)}</h4>${lines(items)}</div>`; }
function utilLines(disc) {
  const dd = D.disciplines[disc];
  return dd.util.split(/\.\s+/).map(s => s.replace(/\.$/, "")).filter(Boolean).map(s => { const m = s.match(/^([^:]{2,20}):\s*(.+)$/); return m ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(s); });
}
function discInfo(disc) {
  const d = D.disciplines[disc];
  return `<div class="dtitle">${esc(d.name)}</div>${sec("What they do", utilLines(disc))}${sec("Good to know", ["Board tiles list this role as <b>" + d.name + "</b>", "Placing them earns the skill of their role (" + ({ Creative: "Ideas", Development: "Code", Operations: "Process", Marketing: "Buzz" })[d.cat] + "). Junior: +" + U.S.cfg.resJr + ". Senior: +" + U.S.cfg.resSr + " and +" + U.S.cfg.srBonus + " Progress or Marketing"])}`;
}
function placeForm(S, pi, w, target) {
  const o = E.placementOptions(S, pi, w).find(x => x.target === target);
  if (!o) return `<p class="mute">Not available.</p>`;
  if (!o.ok) return `<div class="row">${actBtn("Place " + (w.lvl === "Sr" ? "Senior " : "Junior ") + dname(w.disc) + " here", "", true, o.reason)}</div>`;
  const fx = o.spot ? E.parseEffect(o.spot.fx) : null; let h = "";
  if (o.as && o.as.length > 1) h += `<div><div class="mute">Declare as</div>${o.as.map((x, i) => `<label style="margin-right:10px"><input type="radio" name="as" value="${x}" ${i === 0 ? "checked" : ""}> ${esc(nameOf(x))}</label>`).join("")}</div>`;
  if (w.lvl === "Sr" && o.kind === "spot" && !o.spot.special) h += `<div><div class="mute">Senior bonus</div><label style="margin-right:10px"><input type="radio" name="bonus" value="prod" checked> +${S.cfg.srBonus} Progress</label><label><input type="radio" name="bonus" value="mktg"> +${S.cfg.srBonus} Marketing</label></div>`;
  if (o.plans && o.plans.length) { const pw = P(pi).workers; h += `<div><div class="mute">Strike Team: placed together, each earns the skill of the role they fill. Pick the partner for ${esc(dname(w.disc))} (you must choose)</div>${o.plans.map((pl, i) => `<label style="display:block;margin:3px 0"><input type="radio" name="crew" value="${pl.ids.join(",")}"> <b>${(w.lvl === "Sr" ? "Senior " : "Junior ") + esc(dname(w.disc))} as ${pl.wcat}</b> + ${pl.ids.map(id => { const x = pw.find(y => y.id === id); return (x.lvl === "Sr" ? "Senior " : "Junior ") + esc(nameOf(x.disc)) + " as " + pl.cats[id]; }).join(" + ")}</label>`).join("")}</div>`; }
  if (fx && fx.choice) h += `<div><div class="mute">Effect</div>${(() => { const parts = String(o.spot.fx || "").split(/\s+OR\s+/); return ["0", "1"].map(i => `<label style="margin-right:10px"><input type="radio" name="choice" value="${i}" ${i === "0" ? "checked" : ""}> ${parts[+i] ? fxTxt(parts[+i].trim()) : "option " + (+i + 1)}</label>`).join(""); })()}</div>`;
  if (fx && (fx.stats.prod || 0) > 0 && o.kind === "spot" && (o.as || []).some(x => x === "ENG" || x === "ART")) h += `${(() => { const eff = o.as && o.as.length === 1 ? o.as[0] : w.disc, noDebt = (P(pi).debt || 0) <= 0, noEng = eff === "ART" || noDebt, noArt = eff === "ENG", opt = (v, txt, off, why) => `<label style="margin-right:10px;${off ? "opacity:.4" : ""}" ${off ? `title="${why}"` : ""}><input type="radio" name="alt" value="${v}" ${off ? "disabled" : ""}> ${txt}</label>`; return `<div><div class="mute">Alternate action (Engineer / Artist)</div><label style="margin-right:10px"><input type="radio" name="alt" value="" checked> Normal</label>${opt("fixdebt", "Engineer: fix Tech Debt instead", noEng, eff === "ART" ? "Only an Engineer can do this" : "You have no Tech Debt to fix")}${opt("hype", "Artist: Hype instead", noArt, "Only an Artist can do this")}</div>`; })()}`;
  if (o.spot && o.spot.special === "convert") { const rk = E.RES_OF[E.CAT_OF(o.as[0])], n = Math.floor((P(pi)[rk] || 0) / (S.cfg.convertRate || 3)); h += `<div><div class="mute">Convert ${n * (S.cfg.convertRate || 3)} ${E.RES_NAME[rk]} into ${n}:</div><label style="margin-right:10px"><input type="radio" name="conv" value="prod" checked> Progress</label><label><input type="radio" name="conv" value="hype"> Hype</label></div>`; }
  if (o.spot && o.spot.special === "rd" && S.cfg.instantBuild) { const ks = [["ideas", "Ideas"], ["code", "Code"], ["process", "Process"], ["buzz", "Buzz"]], n = S.cfg.rdSkills == null ? 2 : S.cfg.rdSkills; for (let i = 1; i <= n; i++) h += `<div><div class="mute">Skill ${i} of ${n}</div>${ks.map((k, j) => `<label style="margin-right:10px"><input type="radio" name="rd${i}" value="${k[0]}" ${j === i - 1 ? "checked" : ""}> ${k[1]}</label>`).join("")}</div>`; }
  if (o.spot && o.spot.special === "mentor") h += `<div><div class="mute">Promote which Junior?</div>${P(pi).workers.filter(x => x.lvl === "Jr" && x.disc === w.disc).map((x, i) => `<label style="margin-right:10px"><input type="radio" name="jr" value="${x.id}" ${i === 0 ? "checked" : ""}> Junior ${esc(nameOf(x.disc))} #${x.id}</label>`).join("")}</div>`;
  return `<div class="col" style="margin:8px 0">${h}</div><div class="row">${actBtn("Place " + (w.lvl === "Sr" ? "Senior " : "Junior ") + dname(w.disc) + " here", 'data-act="confirm-place"')}</div>`;
}
function placeSection(S, target) {
  const a = E.currentActor(S);
  if (S.step !== "place" || S.dq.length || a < 0 || S.players[a].bot) return "";
  const w = U.sel != null ? P(a).workers.find(x => x.id === U.sel) : null;
  if (!w) return `<p class="mute" style="margin-top:10px">To place a worker here, close this and click one of your workers first.</p>`;
  return `<div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">${placeForm(S, a, w, target)}</div>`;
}
function detailModal() {
  const S = U.S, d = U.detail; const a = E.currentActor(S); const mineTurn = a >= 0 && !S.players[a].bot; let h = "";
  const closeOnly = x => { U.detail = null; return ""; };
  switch (d.k) {
    case "worker": {
      const pi = +d.p; const w = P(pi).workers.find(x => x.id === +d.id); if (!w) return closeOnly();
      const fatTxt = ["<b>Fresh:</b> ready to work", "<b>Tired:</b> worked last round. Works normally", "<b>Exhausted:</b> worked two rounds in a row"][w.fat];
      const fatNext = ["Placing them makes them Tired", "Placing them is fine, but then they are Exhausted. Resting recovers one step", "Placing them again is <b>overwork</b>: no skill earned and +1 Burnout. Resting recovers one step"][w.fat];
      const abil = (w.disc === "PX" || w.disc === "DATA") ? ((w.lvl === "Sr" && w.placed) || (w.lvl === "Jr" && !w.placed) ? "<b>Ability ready:</b> triggers at Rest" : "<b>Ability not active:</b> " + (w.lvl === "Jr" ? "a Junior must rest (stay unplaced)" : "a Senior must be placed")) : "";
      h += discHead(w.disc) + `<div class="dtitle">${w.lvl === "Sr" ? "Senior" : "Junior"} ${esc(dname(w.disc))}</div>`
        + sec("What they do", utilLines(w.disc))
        + sec(w.lvl === "Sr" ? "As a Senior" : "As a Junior", w.lvl === "Sr" ? [`+${S.cfg.resSr} skills of their role when placed`, "Can trigger system tiles (Juniors cannot)", "Promoted from a Junior who trained " + S.cfg.trainNeeded + " times"] : [`+${S.cfg.resJr} skill of their role when placed`, "Can be promoted to Senior during Rest", abil ? "" : ""])
        + sec("Condition", [fatTxt, fatNext])
        + sec("This round", [w.lvl === "Jr" ? "Training: " + (w.trained || 0) + " of " + S.cfg.trainNeeded + (w.trainNow ? " (in training this round)" : w.training ? " (away next round)" : "") : "", w.placed ? "Placed on the board" : "Not placed yet (resting if you leave them)", w.as ? "Declared as " + nameOf(w.as) : "", abil]);
      if (a === pi && mineTurn && !S.dq.length) {
        if (S.step === "place") { const tk = E.canTrain(S, pi, w); h += `<div class="row" style="margin-top:12px">${actBtn(U.sel === w.id ? "Deselect worker" : "Select this worker", 'data-act="sel-worker" data-id="' + w.id + '"', w.placed, w.placed ? "Already placed this round" : "")}${w.lvl === "Jr" ? actBtn("Train \u00b7 " + S.cfg.trainCost + "G, " + (S.cfg.trainCulture ? "-1 Burnout" : "") , `data-act="train" data-w="${w.id}"`, !tk.ok, tk.reason || "") : ""}</div>`; }
        if (S.step === "rest") {
          const cost = E.promoGold(S), needRest = !!E.trainPromoWhy(S, w);
          const pp = P(a), tr = pp.rs.trains || 0, why = w.lvl !== "Jr" ? "Only Juniors train" : S.round >= 12 ? "The game ends this round" : w.placed || w.build ? "Worked or building this round" : w.training ? "Already training" : tr >= S.cfg.trainsPerRest ? "Training limit reached" : pp.gold < S.cfg.trainCost ? "Not enough gold" : "";
          h += `<div class="row" style="margin-top:12px">${w.lvl === "Jr" ? actBtn("Train · " + S.cfg.trainCost + "G, +" + S.cfg.trainCulture + " Culture", `data-act="train" data-w="${w.id}"`, !!why, why) : ""}${w.lvl === "Jr" ? actBtn("Promote · " + (cost ? cost + "G" : "free"), `data-act="promote" data-w="${w.id}"`, pp.gold < cost || pp.promos >= S.cfg.promotionsPerRest || !E.srAllowed(S) || needRest, !E.srAllowed(S) ? "Seniors unlock in Production" : needRest ? E.trainPromoWhy(S, w) : "") : ""}</div>`;
        }
      }
      break; }
    case "spot": {
      const spot = S.data.spots.find(x => x.id === d.id); if (!spot) return closeOnly();
      const occ = S.occ[spot.id] || []; const mode = spot.crew ? "Strike Team tile: one strike team of " + spot.crew[0].length + " workers per round" : spot.mode === "shared" ? "Shared: several workers can use it" : spot.mode === "multi" ? "Multi: several workers can use it" : spot.excl ? "Exclusive" : "One worker only";
      h += `<div class="dtitle">${esc(spot.row)}</div><div style="margin:6px 0">${spot.crew ? "Strike Team of " + spot.crew[0].length + ": " + crewChips(spot) : spot.discs.map(x => x === "ANY" ? '<span class="chip" style="background:#667">ANY</span>' : chip(x)).join(" ")}${spot.srOnly ? ' <span class="chip" style="background:#a33">Senior only</span>' : ""}</div>
      <p><b>${esc(spot.fx || spot.note || "")}</b></p>${spot.fx && spot.note ? `<p class="mute">${esc(spot.note)}</p>` : ""}<p class="mute">${mode}.${spot.debt ? ` Adds ${spot.debt} Tech Debt.` : ""}${spot.cost ? (spot.cost.res ? ` Costs ${spot.cost.res} skills (any mix).` : ` Costs ${spot.cost.gold}G.`) : ""}</p>
      ${occ.length ? `<p>Occupied by: ${occ.map(i => `<b style="color:${P(i).color}">${esc(P(i).name)}</b>`).join(", ")}</p>` : ""}` + placeSection(S, "spot:" + spot.id);
      break; }
    case "sys": case "market": {
      let def, idx = null;
      if (d.k === "sys") { idx = +d.id; const sy = P(+d.p).systems[idx]; if (!sy) return closeOnly(); def = E.sysDef(S, sy.name); } else { def = S.data.systems.find(x => x.name === d.id); if (!def) return closeOnly(); }
      const busyD = E.buildRounds(S, P(viewIndex(S)), U.crunch, def), dl = (k, v) => `<div class="drow"><span class="dk">${k}</span><span>${v}</span></div>`;
      h += `<div class="dhead" style="${fill(catColor[def.cat])}"><span>${def.cat}</span></div><div class="dtitle">${esc(def.name)} ${symTag(def)} <span class="dvp">${def.vp} VP</span></div>
      <div class="dsec"><h4>Cost to build</h4><div class="c" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:15px">${buildChips(def.build)}</div>${busyD ? dl("Team busy", busyD + " round" + (busyD === 1 ? "" : "s") + " while it is built") : ""}${def.debt ? dl("Tech Debt", `<b class="bad">+${def.debt}</b> when built`) : ""}</div>
      <div class="dsec"><h4>Reward when triggered</h4>${dl("Trigger", "place " + esc(fmtTrig(def.trig)) + " worker here")}${def.fx ? dl("Gives", "<b>" + fxTxt(def.fx) + "</b>") : ""}${def.once ? dl("On build", esc(def.once)) : ""}${def.each ? dl("Each time", esc(def.each)) : ""}</div>
      <div class="dsec"><h4>Benefit</h4>${def.pas ? dl("Passive", `<span style="color:var(--gold)">${esc(def.pas)}</span> (always on)`) : ""}${dl("End of game", def.vp + " VP at the end of the game")}</div>`;
      if (d.k === "sys") h += placeSection(S, "sys:" + idx);
      else if (U.modal === "market" && canBuildNow(S) && mineTurn) {
        const p = P(a), free = p.freeBuilds > 0; const crd = U.crunch || undefined; const ck = E.canBuild(S, a, def.name, free, crd), ckp = free ? E.canBuild(S, a, def.name, false, crd) : ck;
        h += `<div class="row" style="margin-top:12px">${actBtn("Build", `data-act="build" data-name="${esc(def.name)}" data-free="0"`, !ckp.ok, ckp.reason)}${free ? actBtn("Build free", `data-act="build" data-name="${esc(def.name)}" data-free="1"`, !ck.ok, ck.reason, false) : ""}</div>`;
      }
      break; }
    case "mile": {
      const id = +d.id, m = S.data.milestones[id]; if (!m) return closeOnly(); const met = E.milestoneMet(S, +d.p, id);
      h += `<div class="dtitle">${esc(m.name)}</div><p>${esc(m.text)}</p><p class="mute">Phase window: ${mileWhen(m, E.mileWindow(S, m))}. A milestone can only be completed inside its window; a card whose window has passed is swapped for a new one at the next phase start.</p><p style="color:var(--gold)"><b>Reward: +${m.gold}G</b> ${met ? '<span style="color:var(--good)">MET</span>' : '<span class="mute">not met yet</span>'}</p>`;
      if (S.step === "rest" && mineTurn && a === +d.p && !S.dq.length) h += `<div class="row" style="margin-top:12px">${actBtn("Cash in", `data-act="claim" data-mile="${id}"`, !met, "Requirement not met yet")}</div>`;
      break; }
    case "obj": {
      const id = +d.id, o = S.data.objectives[id]; if (!o) return closeOnly(); const st = E.objectiveStatus(S, +d.p, id);
      h += `<div class="dtitle">${esc(o.name)} ${symTag(o)}</div><p class="mute">${o.type} objective · ${S.cfg.objGraded} VP per requirement met, +${S.cfg.objBonus} if all</p>${st.reqs.map(r => `<p style="color:${r.ok ? "var(--good)" : "var(--ink)"}">${r.ok ? "✓" : "○"} ${esc(r.r)}</p>`).join("")}${o.res ? `<p class="mute">Skill: ${ICN[o.res]}. Built systems whose main skill is ${ICN[o.res]} earn synergy VP once this is completed.</p>` : ""}`;
      break; }
    case "crisis": { const c = S.crisisCard && S.data.crisis.find(x => x.id === S.crisisCard); if (!c) return closeOnly(); h += crisisCardHtml(c); break; }
    default: return closeOnly();
  }
  return modalShell(h, { cls: "detail" + (h.indexOf('class="dhead"') >= 0 ? " hashead" : "") });
}
const buildChips = str => {
  const p = String(str).split("+"), m = p[0].match(/^(\d+)([MG])$/); if (!m) return esc(str);
  let h = "";
  if (m[2] === "M") { const need = E.buildNeed(E.parseBuild(str)), tot = E.RES.reduce((t, k) => t + need[k], 0), gp = U.S && U.S.cfg.sysGoldMult ? Math.round(tot * U.S.cfg.sysGoldMult) : 0; E.RES.forEach(k => { if (need[k] > 0) h += `<span class="bc">${need[k]}${ic(k)}</span>`; }); if (gp) h += `<span class="bc">${gp}${ic("gold")}</span>`; }
  else h = `<span class="bc">${m[1]}${ic("gold")}</span>`;
  const roles = p.slice(1).map(nameOf); return h + (roles.length ? `<span class="roles">${esc(roles.join(" + "))}</span>` : "");
};
/* Compact system tile: name, main skill, VP, cost icons, one effect line. Detail lives in the popup. */
const bR = d => { const S = U.S; if (!S) return 0; const p = S.players[viewIndex(S)]; return E.buildRounds(S, p, U.crunch, d); };
function sysTile(d, ok, extra) {
  const hint = U.S && viewHasSyn(d), busy = bR(d);
  const row = (k, html, cls) => `<div class="sr"><span class="k">${k}</span><div class="${cls || ""}">${html}</div></div>`;
  return `<div class="sys2 ${ok ? "" : "off"}" data-act="detail" data-k="market" data-id="${esc(d.name)}" style="border-color:${catColor[d.cat]}"><div class="h"><span class="n">${esc(d.name)}</span>${symTag(d)}${hint ? '<span class="star" title="Matches the skill of one of your objectives">★</span>' : ""}<span class="vp">${d.vp} VP</span></div>`
    + row("Cost", `<div class="c">${buildChips(d.build)}</div>`)
    + (d.fx ? row("Gives", fxTxt(d.fx), "e") : "")
    + (d.pas ? row("Passive", esc(d.pas), "pas") : "")
    + row("Trigger", `${esc(fmtTrig(d.trig))}${busy ? ` · team busy ${busy} round${busy === 1 ? "" : "s"}` : ""}${d.debt ? ` · <b class="bad">+${d.debt} Debt</b>` : ""}`, "trg")
    + (extra || "") + `</div>`;
}
const viewHasSyn = d => { const S = U.S, p = S.players[viewIndex(S)]; return !!p && p.objectives.some(id => S.data.objectives[id].res && S.data.objectives[id].res === E.sysMainRes(d)); };
function marketStrip(S) {
  if (!S.cfg.marketSize) return "";
  const vi = viewIndex(S), p = S.players[vi]; const cr = U.crunch;
  const rows = E.CATS.map(cat => {
    const tiles = (S.market[cat] || []).map(n => { const d = E.sysDef(S, n); const ck = E.canBuild(S, vi, n, false, cr); return sysTile(d, ck.ok); }).join("") || '<span class="mute">Sold out</span>';
    return `<div class="mcol"><div class="lab" style="color:${lite(catColor[cat])}">${cat}</div><div class="spots">${tiles}</div></div>`;
  }).join("");
  return `<div class="panel" data-tut="mstrip"><h3>Systems to Build <span class="mute" style="font-weight:400;font-size:12px">${p ? esc(p.name) + " · " : ""}greyed = cannot build yet · tap a card for details</span></h3><div class="mgrid">${rows}</div></div>`;
}
function gameMenuModal() {
  return modalShell(`<h2>Menu</h2><div class="col" style="gap:8px;min-width:260px"><button class="btn primary" data-act="close">Resume game</button><button class="btn" data-act="rules">Rules and guides</button><button class="btn" data-act="milesref">Milestones</button><button class="btn" data-act="log">${U.logOpen ? "Hide full log" : "Show full log"}</button>${U.net ? "" : '<button class="btn" data-act="save">Save game</button>'}${U.tut || (U.S && U.S.over) || (U.net && !U.net.host) ? "" : '<button class="btn danger" data-act="endgame">End game now</button>'}${U.owner ? '<button class="btn" data-act="studio">Data Studio</button><button class="btn" data-act="master">Master and analytics</button>' : ""}<button class="btn" data-act="menu">Quit to main menu</button></div><p class="dim" style="margin:12px 0 0;font-size:12px">Quitting leaves this game. Save first if you want to continue later.${U.owner ? "" : " Data Studio and analytics need the owner login."}</p>`).replace('<div class="overlay"', '<div class="overlay rulesov" style="z-index:300"');
}
function rulesModal() {
  const R = root.SHIPIT_RULES || []; const id = U.rulesTab || "start"; const cur = R.find(r => r.id === id) || R[0];
  if (!cur) return modalShell("<h2>Rules</h2><p class=\"mute\">Rules are not loaded.</p>");
  return modalShell(`<h2>Rules <span class="mute" style="font-size:13px;font-weight:400">· guides, icons and card lists</span></h2><style>${root.SHIPIT_RULES_CSS || ""}.paper{background:#fff;color:#1b2430;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.4}.paper .rh{font-size:20px;margin:0 0 8px;border-bottom:3px solid #1b2430;padding-bottom:4px}.paper .rh small{font-size:12px;color:#5b6775;font-weight:400;margin-left:10px}.paper hr{border:0;border-top:2px dashed #c9d1da;margin:16px 0}.paper .cards{margin-top:10px}.paper .card{min-height:0}.rtabs{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 10px}</style><div class="rtabs">${R.map(r => `<button class="tab ${r.id === cur.id ? "on" : ""}" data-act="rtab" data-v="${r.id}">${r.title}</button>`).join("")}</div><div class="row wrap" style="gap:8px;margin:0 0 8px"><button class="btn sm" data-act="rprint" data-v="one">Print or save this page as PDF</button><button class="btn sm" data-act="rprint" data-v="all">Print or save all pages as PDF</button><span class="mute" style="font-size:12px">In the print window choose Save as PDF.</span></div><div class="scroll-y" style="max-height:68vh"><div class="paper">${cur.html}</div></div>`, { wide: true }).replace('<div class="overlay"', '<div class="overlay rulesov" style="z-index:300"');
}
function marketModal() {
  const S = U.S; const a = P(E.currentActor(S)); const cat = U.marketCat || "All"; const free = a.freeBuilds > 0;
  const list = S.data.systems.filter(d => E.inMarket(S, d) && (cat === "All" || d.cat === cat)); const canRefresh = !!S.cfg.marketSize && (a.refreshed || 0) < (S.cfg.marketRefreshesPerRound || 1) && a.gold >= S.cfg.marketRefreshGold;
  const cr = U.crunch || undefined; const rdFree = E.rdFree(S, a), inst = !!S.cfg.instantBuild;
  let h = `<h2>Systems to Build</h2>` + (inst ? "" : (`<div class="row wrap" style="margin-bottom:8px;gap:8px;align-items:center"><b>Build speed:</b>${rdFree ? `<span class="mute">R&amp;D: system development reduced by 1 round, with no crunch fee</span>` : ([["none", "Normal"], ["gold", "Crunch with Gold (+" + S.cfg.crunchGold + "G): finishes one round sooner"], ["fat", "Crunch by tiring a worker: finishes one round sooner"]]).map(o => `<button class="tab ${(cr || "none") === o[0] ? "on" : ""}" data-act="crunch" data-v="${o[0]}">${o[1]}</button>`).join("")}</div>`)) + `<div class="row wrap" style="margin-bottom:10px">${["All"].concat(E.CATS).map(c => `<button class="tab ${cat === c ? "on" : ""}" data-act="mcat" data-v="${c}">${c}</button>`).join("")}<span class="grow"></span><span class="mono">${resNow(a)} · Gold <b style="color:var(--gold)">${a.gold}</b> · builds ${a.builds}/${E.maxBuilds(S, a)}${free ? " · FREE build ready" : ""}</span></div>` + (cat !== "All" && D.typeRules && D.typeRules[cat] ? `<div class="mute" style="margin:0 0 8px"><b>${cat}:</b> ${esc(D.typeRules[cat])}</div>` : "");
  const cards = list.map(d => {
    const ck = E.canBuild(S, a.id, d.name, free, cr); const ckPaid = free ? E.canBuild(S, a.id, d.name, false, cr) : ck;
    const hint = a.objectives.some(id => S.data.objectives[id].res === E.sysMainRes(d));
    return { ok: ck.ok || ckPaid.ok, html: sysTile(d, ck.ok || ckPaid.ok, `<div class="row" style="margin-top:6px;gap:4px"><button class="btn sm primary" data-act="build" data-name="${esc(d.name)}" data-free="0" ${ckPaid.ok ? "" : "disabled"} title="${esc(ckPaid.ok ? "" : ckPaid.reason)}">Build</button>${free ? `<button class="btn sm good" data-act="build" data-name="${esc(d.name)}" data-free="1" ${ck.ok ? "" : "disabled"} title="${esc(ck.ok ? "" : ck.reason)}">Free</button>` : ""}</div>${!ckPaid.ok && !(U.tut && free) ? `<div class="why" style="margin-top:4px">${esc(ckPaid.reason)}</div>` : ""}`) }; // the tutorial's free build makes the "You have 1 of 3 Ideas" note confusing, so it is hidden there
  });
  const can = cards.filter(c => c.ok), cant = cards.filter(c => !c.ok);
  h += `<div class="scroll-y"><div class="mute" style="margin:0 0 6px;font-weight:700">You can build now (${can.length})</div>${can.length ? `<div class="row wrap" style="align-items:stretch">${can.map(c => c.html).join("")}</div>` : '<p class="mute">Nothing available right now. See below for what each system needs.</p>'}
  <div class="mkt-divider"><span>Not available yet (${cant.length})</span></div><div class="row wrap" style="align-items:stretch">${cant.map(c => c.html).join("")}</div></div>`;
  return modalShell(h, { wide: true });
}
function scoreModal(S) {
  const c = S.cfg, sc = E.score(S), rows = sc.slice().sort((a, b) => b.total - a.total);
  const cols = [["prodShare", "Progress race"], ["hypeStrength", "Hype race"], ["debtPenalty", "Debt"], ["burnout", "Burnout"], ["objectives", "Objectives"], ["systems", "Systems"], ["gold", "Gold"], ["crisis", "Gates & crisis"]];
  const f = v => { const n = Math.round(+v * 10) / 10; return Number.isInteger(n) ? String(n) : n.toFixed(1); };
  const body = rows.map(r => `<tr><td><span class="dot" style="background:${P(r.id).color};display:inline-block;margin-right:6px"></span>${esc(r.name)}</td>${cols.map(k => `<td>${f(r.parts[k[0]])}</td>`).join("")}<td><b>${f(r.total)}</b></td></tr>`).join("");
  const awards = S.players.length >= (c.awardMinN || 0);
  return modalShell(`<h2>Score if the game ended now</h2><p class="mute">Races are ranked against the other studios, so these numbers move every round.</p>
  <div class="scroll-y"><table class="scoretbl"><thead><tr><th>Studio</th>${cols.map(k => `<th>${k[1]}</th>`).join("")}<th>TOTAL</th></tr></thead><tbody>${body}</tbody></table></div>
  <div class="mute" style="font-size:12px;margin-top:10px;line-height:1.5">
  <b>Progress and Hype:</b> 1 VP for every ${c.raceDen} points you have. Your Wishlists count as Hype.<br>
  <b>Debt:</b> the most Debt loses the most VP; the least loses none.<br>
  <b>Burnout:</b> costs VP from 2 upward (2: ${c.burnVP[2]}, 3: ${c.burnVP[3]}, 4: ${c.burnVP[4]}, 5: ${c.burnVP[5]}, 6: ${c.burnVP[6]}).<br>
  <b>Objectives:</b> ${c.objGraded} VP for each requirement you meet, plus ${c.objBonus} more if you meet them all.<br>
  <b>Systems:</b> the VP printed on each system you built. <b>Gold:</b> 1 VP per ${c.goldPerVP} Gold left.<br>
  <b>Gates and crisis:</b> each requirement you miss at a gate costs ${c.gatePerReq} VP, passing the last gate pays +${(c.gateWin || [0,0,0,0])[3]} VP, plus Crisis card results.</div>
  <div style="margin-top:12px;text-align:right"><button class="btn" data-act="close">Close</button></div>`, { wide: true });
}
function resultsModal() {
  const S = U.S; const rows = S.scores.slice().sort((a, b) => b.total - a.total);
  const cols = [["prodShare", "Progress race"], ["hypeStrength", "Hype race"], ["debtPenalty", "Debt"], ["burnout", "Burnout"], ["objectives", "Obj."], ["systems", "Sys"], ["gold", "Gold"], ["crisis", "Crisis/Gates"]];
  const wr = S.scores.find(x => x.id === S.winner), top = wr ? cols.map(c => [c[1], +wr.parts[c[0]]]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 2) : [], runner = rows[1];
  const why = wr ? `<p class="mute" style="margin:4px 0 10px">${esc(wr.name)} won with <b>${wr.total.toFixed(0)} VP</b>${runner ? ", " + (wr.total - runner.total).toFixed(0) + " ahead of " + esc(runner.name) : ""}. Biggest sources: ${top.map(x => esc(x[0]) + " (+" + x[1].toFixed(0) + ")").join(" and ") || "none"}.</p>` : "";
  let h = `<h2>${esc(P(S.winner).name)} ships the best game!</h2>${why}<div class="swipehint">Swipe the table sideways to see where each VP came from.</div><div class="scroll-y"><table class="scoretbl"><thead><tr><th>Studio</th>${cols.map(c => `<th>${c[1]}</th>`).join("")}<th>TOTAL</th></tr></thead><tbody>`;
  rows.forEach(r => { h += `<tr class="${r.id === S.winner ? "win" : ""}"><td><span class="dot" style="background:${P(r.id).color};display:inline-block;margin-right:6px"></span>${esc(r.name)}${r.id === S.winner ? ' <span class="wintag">Winner</span>' : ""} <span class="dim">Debt ${P(r.id).debt} · Wishlists ${P(r.id).mktg}</span></td>${cols.map(c => `<td>${(+r.parts[c[0]]).toFixed(0)}</td>`).join("")}<td><b>${r.total.toFixed(0)}</b></td></tr>`; });
  h += `</tbody></table>${U.tut || U.tutDone ? SI.tutScoreExplainer(S) : ""}</div>${U.tutDone && !U.net ? `<div class="whatnext"><b>What next?</b><span class="mute">You have seen every rule once. Pick one:</span></div><div class="row wrap" style="margin-top:8px"><button class="btn primary" data-act="tut-play">Play a game against a bot</button><button class="btn" data-act="rules">Read the rules</button><button class="btn" data-act="tutorial">Replay the guide</button><button class="btn" data-act="menu">Menu</button><button class="btn" data-act="close">Close</button></div>` : `<div class="row" style="margin-top:14px"><button class="btn primary" data-act="${U.net ? "online-again" : "start"}">Play again</button><button class="btn" data-act="menu">Menu</button><button class="btn" data-act="close">Close</button></div>`}`;
  return modalShell(h, { wide: true });
}
function masterCtx() { return { U, render, toast, SI, E, D, closeModal: () => { U.modal = null; render(); } }; }
function masterModal() { return modalShell(SI.adminRender ? SI.adminRender(masterCtx()) : '<h2>Master</h2><p class="mute">Loading…</p>', { wide: true }); }
function studioModal() {
  const h = `<h2>Data Studio <span class="mute" style="font-size:13px;font-weight:400">· ${D.version} · edits apply to new games</span></h2>` + SI.renderStudio(U.studio, U.tab, U.sim) + (U.S && U.screen === "game" ? `<div class="row" style="margin-top:12px"><button class="btn primary" data-act="restart">Restart game with these values</button></div>` : "");
  return modalShell(h, { wide: true });
}
function crisisIntroModal(c) { return modalShell(`<div class="rs-kick" style="text-align:center;margin-bottom:8px">Phase start · a Crisis hits every studio</div><div style="display:flex;justify-content:center">${crisisCardHtml(c)}</div><div class="rs-foot"><button class="btn primary big" data-act="close">Continue</button></div>`, { cls: "crisisov" }); }

/* ---------- copy overrides (Data Studio > Text): swap edited default wording in rendered HTML ---------- */
SI.copyFix = function (html) {
  const m = D.copyMap || {}, keys = Object.keys(m);
  if (!keys.length && html.indexOf("\u0001") < 0) return html;
  keys.sort((a, b) => b.length - a.length);
  return html.split("\u0001").map((seg, i) => {
    if (i === 0) return fixSeg(seg, keys, m);
    const j = seg.indexOf("\u0002"); if (j < 0) return seg;
    return seg.slice(0, j) + fixSeg(seg.slice(j + 1), keys, m);
  }).join("");
};
function fixSeg(s, keys, m) {
  keys.forEach(k => { const v = SI.esc(m[k]), e = SI.esc(k); if (s.indexOf(k) >= 0) s = s.split(k).join(v); if (e !== k && s.indexOf(e) >= 0) s = s.split(e).join(v); });
  return s;
}
/* ---------- main render ---------- */
function render() {
  U.stepScreenOpen = false;
  if (U.S && U.S.data && E.applyLook) E.applyLook(U.S.data);
  noteRecruits(); noteNotices();
  const keepFocus = document.activeElement && document.activeElement.id; const val = keepFocus ? document.activeElement.value : null;
  if (U.screen === "gate") $root.innerHTML = SI.copyFix(gateView());
  else if (U.screen === "menu") $root.innerHTML = SI.copyFix(menuView() + (U.modal === "studio" && U.owner ? "\u0001" + studioModal() + "\u0002" : U.modal === "master" && U.owner ? "\u0001" + masterModal() + "\u0002" : U.modal === "cleardata" ? clearDataModal() : ""));
  else if (U.screen === "lobby") $root.innerHTML = SI.copyFix(lobbyView() + (U.modal === "studio" && U.owner ? "\u0001" + studioModal() + "\u0002" : ""));
  else {
    if (U.tut) SI.tutTick();
    const S = U.S; let h = gameView();
    const a = E.currentActor(S);
    const humanDecision = S.dq.length && a >= 0 && !S.players[a].bot && (!U.net || U.net.mine.includes(a));
    const hasHuman = S.players.some(p => !p.bot);
    if (humanDecision && U.cover !== a && ["bid","keepObj"].includes(S.dq[0].t) && (U.net ? U.net.mine.length : S.players.filter(p => !p.bot).length) > 1) h += coverView(S);
    else if (humanDecision && !(U.tut && SI.tutHold())) { if (S.crisisCard) U.seenCrisis = S.phase + S.crisisCard; h += decisionModal(S); }
    if (U.modal === "studio" && U.owner) h += "\u0001" + studioModal() + "\u0002";
    else if (U.modal === "master" && U.owner) h += "\u0001" + masterModal() + "\u0002";
    else if (U.modal === "endgame") h += endGameModal();
    else if (U.modal === "milesref") h += milesModal(S);
    else if (U.modal === "scoreref") h += scoreModal(S);
    else if (U.modal === "rules") h += rulesModal();
    else if (U.modal === "gamemenu") h += gameMenuModal();
    else if (U.modal === "crew") h += crewModal(S);
    else if (U.modal === "market" && canBuildNow(S)) h += marketModal();
    else if (S.over && U.modal !== "noresults") h += resultsModal();
    else if (hasHuman && !U.tut && S.crisisCard && U.seenCrisis !== (S.phase + S.crisisCard) && !S.over && !humanDecision) h += crisisIntroModal(S.data.crisis.find(c => c.id === S.crisisCard));
    else if (hasHuman && !U.tut && !S.over && !humanDecision && (S.step === "place" || S.step === "rest") && !U.hideSteps && (S.step === "place" || (E.currentActor(S) >= 0 && !S.players[E.currentActor(S)].bot))) h += nextStepScreen(S);
    if (U.detail) h += detailModal() || (U.detail = null, "");
    if (U.tut) h += SI.tutCoach();
    $root.innerHTML = SI.copyFix(h);
    $root.className = U.tut ? ("tut-" + (SI.tutLockMode() || "free")) : "";
    if (U.tut) SI.tutHighlight($root); else if (SI.tutSpotClear) SI.tutSpotClear();
  }
  if (U.S && U.screen === "game" && !U.tut) SI.an.track(U.S);
  autosave();
  if (U.toast) $root.insertAdjacentHTML("beforeend", `<div class="toast ${U.toastKind || ""}" role="status" aria-live="polite">${SI.copyFix(esc(U.toast))}${U.toastKind === "undo" && U.undo.length && !(U.S && U.S.over) ? ' <button class="btn sm" data-act="undo">Undo</button>' : ""}</div>`);
  if (keepFocus) { const el = document.getElementById(keepFocus); if (el && val != null) { try { el.value = val; el.focus(); } catch (e) {} } }
}
SI.render = render; SI.stepScreens = stepScreens;
SI.crisisPreview = crisisCardHtml; SI.symTag = symTag;
SI.sysPreview = d => sysTile(d, true).replace('data-act="detail"', "");

/* ---------- online play (rooms, lobby, synced actions) ---------- */
const N = SI.net, PERSONAS = [["", "Standard"], ["crunch", "Crunch Studio"], ["hype", "Hype Machine"], ["systems", "Systems Builder"], ["clean", "Clean Code"]];
const COLORS = ["#e74c3c", "#3498db", "#27ae60", "#f39c12", "#9b59b6", "#16a085"];
function myName() { if (!U.name) { try { U.name = root.localStorage.getItem("shipit.name") || ""; } catch (e) {} } return U.name || "Player"; }
function setName(v) { U.name = v.slice(0, 20); try { root.localStorage.setItem("shipit.name", U.name); } catch (e) {} }
const N2 = () => SI.net;
function netSend(a, s0) { if (!U.net) return; if (!N.send({ t: "act", i: U.net.n, a, s: s0 })) U.net.lost = true; U.net.n++; }
function botStep(S) {
  if (!U.net) return B.step(S);
  const a = B.decide(S); if (!a) return { ok: false, error: "no action" };
  const s0 = S.seed, r = E.act(S, a);
  if (r.ok) { netSend(a, s0); if (S.over && U.net.host) N.send({ t: "over" }); } else r.action = a;
  return r;
}
function netMine(meta) { const o = []; meta.seats.forEach((s, i) => { if (s.kind !== "bot" && s.cid === N.cid()) o.push(i); }); return o; }
function openRoom(opts) {
  U.screen = "lobby"; U.joinErr = null; U.net = { code: opts.code || "", meta: null, mine: [], host: false, n: 0, up: false, online: [], opened: false };
  N.open(opts, onNet); render();
}
function leaveRoom() {
  if (U.net) { SI.an.abandon(); N.close(); }
  U.net = null; U.S = null; clearTimeout(U.botT); clearTimeout(U.rcT);
  try { root.localStorage.removeItem("shipit.room"); } catch (e) {}
  U.screen = "menu"; U.modal = null; render();
}
function buildOnline(meta, log) {
  const st = SI.applyDiff(meta.ovr ? JSON.parse(meta.ovr) : null);
  const seats = meta.seats.map((s, i) => ({ name: s.name || ("Player " + (i + 1)), bot: s.kind === "bot" }));
  const S = E.newGame(seats, { seed: meta.seed, config: E.clone(st.config), data: E.clone(st.data) });
  S.players.forEach((p, i) => { if (meta.seats[i].persona) p.persona = meta.seats[i].persona; if (meta.seats[i].skill && p.bot) p.profile = meta.seats[i].skill; });
  for (let k = 0; k < log.length; k++) { S.seed = log[k].s; const r = E.act(S, log[k].a); if (!r.ok) return { S, bad: k }; }
  return { S, n: log.length };
}
function anOnline(meta, nlog) { // online: the host records the game; a guest only keeps a fallback final record
  const S = U.S, host = U.net.host;
  const base = { mode: "online", site: N.site(), code: meta.code, seed: meta.seed, started: meta.started, tuned: host && U.tuned && U.tuned !== "default" ? U.tuned : (meta.ovr ? "custom" : "default"), hash: meta.ovr ? SI.hash(meta.ovr) : "base", test: !!U.testEnv, seats: meta.seats, tut: SI.an.tutDone() ? 1 : 0 };
  const id = SI.an.onlineId(base), cur = SI.an.meta;
  if (cur && cur.id === id && !!cur.guest === !host) { SI.an.rebind(S); return; } // reconnected inside the same game: keep what was collected
  if (!host) { SI.an.watch(S, base); return; }
  if (nlog === 0) SI.an.begin(S, base); else SI.an.resume(S, { kind: "net", meta: base, fresh: false });
}
function enterGame(meta, log) {
  const b = buildOnline(meta, log); if (b.bad != null) { toast("Could not replay the game (action " + b.bad + ")"); return; }
  U.S = b.S; U.net.n = log.length; U.net.log = log.length; U.screen = "game"; U.tut = null; U.undo = []; U.sel = null; U.pop = null; U.detail = null; U.modal = null; U.cover = null; U.view = null; U.seenCrisis = null; U.seenRound = null;
  U.tutGame = false; anOnline(meta, log.length);
  render(); scheduleBots();
}
function onNet(m) {
  const n = U.net; if (!n) return;
  if (m.t === "open") { n.up = true; n.opened = true; clearTimeout(U.rcT); render(); return; }
  if (m.t === "closed") {
    n.up = false;
    if (!n.opened) { leaveRoom(); toast("That game was not found"); return; }
    render(); clearTimeout(U.rcT); U.rcT = setTimeout(() => { if (U.net) N.reopen(); }, 2000); return;
  }
  if (m.t === "state") {
    n.meta = m.meta; n.you = m.you; n.code = m.meta.code; N.code = m.meta.code; n.host = m.meta.host === N.cid(); n.mine = netMine(m.meta); n.online = m.online || [];
    try { root.localStorage.setItem("shipit.room", JSON.stringify({ code: n.code })); } catch (e) {}
    if (m.meta.status === "lobby") { U.S = null; U.screen = "lobby"; render(); return; }
    enterGame(m.meta, m.log || []); return;
  }
  if (m.t === "meta") {
    const was = n.meta; n.meta = m.meta; n.host = m.meta.host === N.cid(); n.mine = netMine(m.meta);
    if (m.meta.status === "playing" && (!was || was.status !== "playing" || was.seed !== m.meta.seed)) { SI.an.stop(); enterGame(m.meta, []); return; }
    if (m.meta.status === "lobby" && U.screen !== "lobby") { SI.an.stop(); U.S = null; U.screen = "lobby"; U.modal = null; }
    render(); return;
  }
  if (m.t === "presence") { n.online = m.online || []; if (U.screen === "lobby") render(); return; }
  if (m.t === "act") {
    if (!U.S || m.i < n.n) return;
    if (m.i > n.n) { N.send({ t: "act", i: -1 }); return; } // missed one: ask for the log again
    U.S.seed = m.s; const r = E.act(U.S, m.a);
    if (!r.ok) { toast("Out of sync: reloading"); N.reopen(); return; }
    n.n++; U.sel = null; U.pop = null; U.detail = null;
    if (U.S.over && n.host) N.send({ t: "over" }); // the last action came from another seat: the room still has to be told the game is over (rematch needs it)
    if (U.cover != null && !(U.S.dq[0] && U.S.dq[0].p === U.cover)) U.cover = null;
    render(); scheduleBots(); return;
  }
  if (m.t === "resync") { N.reopen(); return; }
  if (m.t === "err") { toast(m.message || "Not allowed"); if (U.S && m.i != null) N.reopen(); return; }
  if (m.t === "wiped") { leaveRoom(); toast("The master account reset all online games"); }
}
function lobbyView() {
  const n = U.net, M = n && n.meta; const me = N.cid();
  if (!M) return `<div class="center-screen"><div class="card-box"><div class="logo">SHIP <b>IT!</b></div><p class="mute">${n && n.up ? "Joining…" : "Connecting…"}</p><button class="btn" data-act="lobby-exit">Cancel</button></div></div>`;
  const host = n.host, seats = M.seats;
  const rows = seats.map((s, i) => {
    const mine = s.cid === me, free = s.kind !== "bot" && !s.cid, here = s.cid && n.online.includes(s.cid);
    let who;
    if (s.kind === "bot") who = `<span class="mute">Bot</span>`;
    else if (mine) who = `<b style="color:var(--good,#6fdc8c)">You${seats.filter(q => q.cid === me).length > 1 ? " (this device)" : ""}</b>`;
    else if (s.cid) who = `<span class="mute">${here ? "● " : "○ "}Another device</span>`;
    else who = `<span class="mute">Waiting for a player</span>`;
    const nameEdit = (host && (s.kind === "bot" || !s.cid)) || mine ? `<input data-lname="${i}" value="${esc(s.name)}" placeholder="Name" maxlength="20" style="width:130px">` : `<b>${esc(s.name || "Player " + (i + 1))}</b>`;
    const kind = host ? `<select data-lkind="${i}" ${mine && i === 0 ? "disabled" : ""}><option value="human" ${s.kind !== "bot" ? "selected" : ""}>Human</option><option value="bot" ${s.kind === "bot" ? "selected" : ""}>Bot</option></select>` : "";
    const skill = host && s.kind === "bot" ? `<label class="lbl"><span class="mute">Skill</span>${skillSelect(`data-lskill="${i}"`, s.skill, "Bot skill: " + skillInfo(s.skill))}</label>` : "";
    const pers = host && s.kind === "bot" ? `<label class="lbl"><span class="mute">Style</span><select data-lpers="${i}" title="Play style of this bot">${PERSONAS.map(p => `<option value="${p[0]}" ${s.persona === p[0] ? "selected" : ""}>${p[1]}</option>`).join("")}</select></label>` : "";
    const btn = free ? `<button class="btn sm primary" data-act="lobby-claim" data-v="${i}">Take this seat</button>${n.mine.length ? `<button class="btn sm" data-act="lobby-claim" data-v="${i}" data-x="1" title="Play this seat on this device too (pass-and-play)">Also on this device</button>` : ""}` : mine ? `<button class="btn sm" data-act="lobby-free" data-v="${i}">Give up seat</button>` : "";
    return `<div class="seat lseat"><span class="dot" style="background:${COLORS[i]}"></span>${nameEdit}${kind}${skill}${pers}<span class="grow"></span>${who}${btn}</div>`;
  }).join("");
  const ready = !seats.some(s => s.kind !== "bot" && !s.cid);
  return `<div class="center-screen"><div class="card-box" style="max-width:640px">
  <div class="logo">SHIP <b>IT!</b></div>
  <p class="mute" style="margin:6px 0 4px">Game code${n.up ? "" : " · reconnecting…"}</p>
  <div style="font-size:44px;font-weight:900;letter-spacing:.2em;margin:0 0 4px">${esc(M.code)}</div>
  <p class="dim" style="margin:0 0 14px;font-size:13px">Friends open this same page, choose <b>Play online</b> and enter the code. ${host ? "You are the host." : "Waiting for the host to start."}</p>
  ${host ? `<div class="row"><label class="mute">Players</label><select data-lcount>${[2, 3, 4, 5].map(k => `<option ${k === seats.length ? "selected" : ""}>${k}</option>`).join("")}</select></div>` : ""}
  ${host ? gatePanel() : ""}
  <div style="margin:10px 0">${rows}</div>
  ${U.lobbyErr ? `<p style="color:var(--bad)">${esc(U.lobbyErr)}</p>` : ""}
  <div class="row wrap">${host ? `<button class="btn primary" data-act="lobby-start" ${ready ? "" : "disabled"} title="${ready ? "" : "Every human seat must be taken first"}">Start game</button>` : ""}<button class="btn" data-act="lobby-exit">Leave</button>${U.owner ? '<button class="btn" data-act="studio">Data Studio</button>' : ""}</div>${host && !ready ? `<p class="why" style="margin-top:6px">Start unlocks when every human seat is taken (${seats.filter(s => s.kind !== "bot" && !s.cid).length} still open). Set a seat to Bot to fill it.</p>` : ""}
  <p class="dim" style="margin:12px 0 0;font-size:12px">Bots run on the host's device. If you lose connection, reopen the page and join the same code: your seat is kept.${host && U.tuned && U.tuned !== "default" ? ` Using tuning: ${esc(U.tuned)}.` : ""}</p></div></div>`;
}
function lobbySend() { // host pushes the seat layout
  const M = U.net.meta; N.send({ t: "cfg", seats: M.seats.map(s => ({ name: s.name, kind: s.kind, persona: s.persona, skill: s.skill })) });
}
function lobbyStart() {
  const df = SI.diffOf(U.active || U.studio), gl = resolveGateLevels(); if (gl) { df.config = Object.assign({}, df.config, { gateLevels: gl }); }
  const ovr = JSON.stringify(df);
  if (ovr.length > 85000) { U.lobbyErr = "Your tuning changes are too large to share with the room"; render(); return; }
  U.lobbyErr = null; N.send({ t: "start", seed: (Math.random() * 2 ** 31) | 0, ovr: ovr === '{"config":{},"data":{}}' ? "" : ovr });
}
function resumeRoom() { // rejoin after a page refresh
  try { const r = JSON.parse(root.localStorage.getItem("shipit.room") || "null"); if (r && r.code) { openRoom({ code: r.code, name: myName() }); return true; } } catch (e) {}
  return false;
}

/* ---------- events ---------- */
$root.addEventListener("click", e => {
  const t = e.target.closest("[data-act]"); if (!t) return;
  if (t.classList.contains("overlay") && e.target !== t) return;
  if (U.tut && (t.dataset.act === "detail") && !t.closest(".coach") && !SI.tutAllowsDetail()) { toast("We will cover that in a moment"); return; }
  const rulesAct = ["rules", "rtab", "rprint", "gamemenu", "menu", "log", "save"].includes(t.dataset.act) || (U.modal === "gamemenu" && ["studio", "master"].includes(t.dataset.act)) || ((U.modal === "rules" || U.modal === "gamemenu") && (t.dataset.act === "close" || t.dataset.act === "overlay"));
  if (U.tut && !rulesAct) { const lm = SI.tutLockMode(); if (lm && !t.closest(".coach") && !(lm === "soft" && t.closest(".overlay"))) return; }
  const v = t.dataset.v; const S = U.S; const a = S ? E.currentActor(S) : -1;
  switch (t.dataset.act) {
    case "gate": tryGate(); return;
    case "start": U.modal = null; newGame(); return;
    case "online-create": if (!U.hosted) return; U.lobbyErr = null; openRoom({ create: true, name: myName() }); return;
    case "online-join": { const c = (document.querySelector("[data-jcode]") || {}).value; const code = String(c || "").toUpperCase().replace(/[^A-Z]/g, ""); if (code.length !== 4) { U.joinErr = "Enter the 4-letter game code"; render(); return; } openRoom({ code, name: myName() }); return; }
    case "online-again": if (U.net && U.net.host) N.send({ t: "rematch" }); else toast("Waiting for the host to start another game"); return;
    case "lobby-claim": N.send({ t: "claim", seat: +v, name: myName(), extra: !!t.dataset.x }); return;
    case "lobby-free": N.send({ t: "leave", seat: +v }); return;
    case "lobby-start": lobbyStart(); return;
    case "lobby-exit": leaveRoom(); return;
    case "master": U.modal = "master"; if (SI.adminOpen) SI.adminOpen(masterCtx()); render(); return;
    case "tutorial": U.modal = null; startTutorial(); return;
    case "tut-play": { U.tutFlow = true; SI.an.markTut(); const nm = myName(); U.seats = [{ name: nm && nm !== "Player" ? nm : "You", bot: false }, { name: "Bot", bot: true }]; U.modal = null; newGame(); return; }
    case "tut-next": SI.tutAck(); if (SI.tutFinished()) { U.tut = null; U.tutDone = true; SI.an.markTut(); render(); scheduleBots(); return; } render(); return;
    case "tut-back": SI.tutBack(); render(); return;
    case "tut-fwd": SI.tutFwd(); render(); return;
    case "tut-auto": SI.tutAuto(); U.pop = null; U.detail = null; U.sel = null; U.modal = null; render(); scheduleBots(); return;
    case "tut-free": U.tut = null; U.tutDone = true; render(); scheduleBots(); return;
    case "tut-exit": clearAuto(); if (U.S && !U.S.over) { U.tut = null; U.tutDone = true; U.modal = null; render(); scheduleBots(); return; } U.tut = null; U.screen = "menu"; U.modal = null; clearTimeout(U.botT); render(); return;
    case "resume": if (loadSave()) { anResume("save"); render(); scheduleBots(); } return;
    case "continue": if (loadAuto()) { anResume("auto"); render(); scheduleBots(); } return;
    case "studio": U.modal = "studio"; render(); if (SI.stu2) SI.stu2.loadPub(); return;
    case "endgame": U.modal = "endgame"; render(); return;
    case "endgame-yes": {
      U.modal = null;
      if (!S || S.over) { render(); return; }
      if (U.net && !U.net.host) { toast("Only the host can end an online game"); return; }
      const s0 = S.seed, p0 = U.net ? U.net.mine[0] : 0, a = { type: "endgame", p: p0 };
      if (E.act(S, a).ok) { if (U.net) { netSend(a, s0); N.send({ t: "over" }); } clearTimeout(U.botT); U.detail = null; U.sel = null; render(); }
      return; }
    case "cleardata": U.modal = "cleardata"; render(); return;
    case "cleardata-do": {
      const w = v, rm = k => { try { root.localStorage.removeItem(k); } catch (e) {} };
      if (w === "save" || w === "all") { rm("shipit.save.v1"); SI.an.clearSave(); clearAuto(); }
      if (w === "room" || w === "all") rm("shipit.room");
      if ((w === "studio" || w === "all") && U.owner) { U.studio = SI.resetStudio(); SI.clearDraft(); U.active = SI.defaults(); }
      if (w === "all") { rm("shipit.name"); U.name = ""; }
      U.modal = null; toast("Cleared"); return; }
    case "logout": {
      ["shipit.room", "shipit.save.v1", "shipit.auto.v1", "shipit.name"].forEach(k => { try { root.localStorage.removeItem(k); } catch (e) {} });
      try { root.sessionStorage.removeItem("shipit.ok"); } catch (e) {}
      if (U.net) { try { N.close(); } catch (e) {} }
      root.location.href = "/__logout"; return; }
    case "close": case "overlay": {
      if (U.detail) { U.detail = null; render(); return; }
      if (U.modal === "studio") { SI.saveDraft(U.studio); }
      if (S && S.crisisCard && U.seenCrisis !== (S.phase + S.crisisCard)) U.seenCrisis = S.phase + S.crisisCard;
      if (S && S.rnote) U.seenRound = S.rnote.r;
      if (S && S.over && !U.modal && !U.pop) U.modal = "noresults"; else U.modal = null;
      U.pop = null; render(); return; }
    case "stepnext": { if (U.stepKey) { U.seenStep = U.seenStep || {}; U.seenStep[U.stepKey] = true; } U.stepScreenOpen = false; render(); scheduleBots(); return; }
    case "menu": if (U.net) { leaveRoom(); return; } SI.an.abandon(); U.screen = "menu"; U.modal = null; clearTimeout(U.botT); clearAuto(); render(); return;
    case "milesref": U.modal = "milesref"; render(); return;
    case "scoreref": U.modal = "scoreref"; render(); return;
    case "log": U.logOpen = !U.logOpen; render(); return;
    case "rules": U.modal = "rules"; render(); return;
    case "gamemenu": U.modal = "gamemenu"; render(); return;
    case "rtab": U.rulesTab = v; render(); return;
    case "rprint": {
      const R = root.SHIPIT_RULES || [], pages = v === "all" ? R : R.filter(r => r.id === (U.rulesTab || "start")); const old = document.getElementById("printarea"); if (old) old.remove();
      const pa = document.createElement("div"); pa.id = "printarea"; pa.innerHTML = `<style>${root.SHIPIT_RULES_CSS || ""}</style>` + pages.map(r => `<div class="paper pp">${r.html}</div>`).join("");
      document.body.appendChild(pa); document.body.classList.add("printing");
      const done = () => { document.body.classList.remove("printing"); pa.remove(); root.removeEventListener("afterprint", done); }; root.addEventListener("afterprint", done);
      setTimeout(() => { try { root.print(); } catch (e) { done(); } }, 60); return; }
    case "save": save(); return;
    case "undo": if (U.undo.length) { restore(U.undo.pop()); U.sel = null; render(); scheduleBots(); } return;
    case "view": U.view = +v; render(); return;
    case "results": U.modal = null; render(); return;
    case "restart": if (SI.stu2) SI.stu2.apply(U); else SI.saveStudio(U.studio); U.modal = null; newGame(); return;
    case "uncover": U.cover = S.dq[0].p; render(); return;
    /* studio */
    case "studio-tab": U.tab = v; render(); return;
    case "sim-run": {
      const n = +document.getElementById("sim-n").value, g = Math.max(1, Math.min(500, +document.getElementById("sim-g").value || 50));
      U.sim = { n, games: g, done: 0, running: true, res: null }; render();
      SI.simRun(U.studio, n, g, d => { U.sim.done = d; if (d % 12 === 0) render(); }, res => { U.sim = { n, games: g, done: g, running: false, res }; render(); }); return; }
    case "io-copy": { const b = document.getElementById("io-box"); b.select(); try { navigator.clipboard.writeText(b.value); toast("Copied"); } catch (er) { toast("Press Ctrl/Cmd+C to copy"); } return; }
    case "io-import": { try { const o = JSON.parse(document.getElementById("io-box").value); const d = SI.defaults(); Object.assign(d.config, o.config || {}); Object.keys(o.data || {}).forEach(k => { d.data[k] = o.data[k]; }); U.studio = d; SI.saveStudio(d); toast("Imported"); } catch (er) { toast("Invalid JSON"); } return; }
    case "studio-reset": U.studio = SI.resetStudio(); toast("Reset to defaults"); return;
  }
  if (!S || S.over && t.dataset.act !== "x") { /* nothing */ }
  const pi = a;
  switch (t.dataset.act) {
    case "done": act({ type: "done", p: pi }); return;
    case "pass": act({ type: "pass", p: pi }); return;
    case "detail": U.detail = { k: t.dataset.k, id: t.dataset.id, p: t.dataset.p }; render(); return;
    case "sel-worker": { const id = +t.dataset.id; U.sel = U.sel === id ? null : id; U.detail = null; render(); return; }
    case "confirm-place": {
      const g = n => { const el = document.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : undefined; };
      const d = U.detail; const target = d.k === "sys" ? "sys:" + d.id : "spot:" + d.id; const as = g("as"); const alt = g("alt");
      const o = E.placementOptions(S, pi, P(pi).workers.find(x => x.id === U.sel)).find(x => x.target === target);
      act({ type: "place", p: pi, worker: U.sel, target, as: as || (o && o.as ? o.as[0] : undefined), bonus: g("bonus"), choice: +(g("choice") || 0), alt: alt || undefined, jr: g("jr") ? +g("jr") : undefined, conv: g("conv") || undefined, rd: [g("rd1"), g("rd2")].filter(Boolean), crew: g("crew") ? g("crew").split(",").map(Number) : undefined }); return; }
    case "buyws": act({ type: "buyws", p: pi }); return;
    case "recruit": act({ type: "recruit", p: pi, idx: +t.dataset.i }); return;
    case "crunch": U.crunch = t.dataset.v === "none" ? null : t.dataset.v; render(); return;
    case "market": U.modal = "market"; render(); return;
    case "refresh-sys": act({ type: "refresh", p: E.currentActor(U.S), name: t.dataset.name }); return;
    case "mcat": U.marketCat = v; render(); return;
    case "crew-pick": { U.crew.sel[+t.dataset.i] = +t.dataset.w; render(); return; }
    case "crew-cw": { U.crew.cw = +t.dataset.w; render(); return; }
    case "crew-cancel": { U.crew = null; U.modal = "market"; render(); return; }
    case "crew-ok": { const c = U.crew; if (!c) return; const crew = Object.keys(c.sel).sort((a, b) => a - b).map(k => c.sel[k]); const r = act({ type: "build", p: pi, name: c.name, free: c.free, crunch: c.crunch, crew, crunchWorker: c.cw }); if (r.ok) { U.crew = null; U.modal = U.tut ? null : "market"; render(); } return; }
    case "build": { const fr = t.dataset.free === "1", bdef = E.sysDef(S, t.dataset.name), np = P(pi);
      if (!U.tut && bdef && E.buildRounds(S, np, U.crunch || undefined, bdef) > 0 && E.parseBuild(bdef.build).reqs.length) { U.crew = { name: t.dataset.name, free: fr, crunch: U.crunch || undefined, sel: {}, cw: null }; U.modal = "crew"; render(); return; }
    }
    case "build-direct": { const r = act({ type: "build", p: pi, name: t.dataset.name, free: t.dataset.free === "1", crunch: U.crunch || undefined }); if (r.ok) { U.modal = U.tut ? null : "market"; render(); } return; }
    case "promote": act({ type: "promote", p: pi, worker: +t.dataset.w }); return;
    case "train": act({ type: "train", p: pi, worker: +t.dataset.w }); return;
    case "fire": act({ type: "fire", p: pi, worker: +t.dataset.w }); return;
    case "claim": act({ type: "claim", p: pi, mile: +t.dataset.mile }); return;
    /* decisions */
    case "keep": U.keep = Object.assign(U.keep || {}, { [t.dataset.t]: +t.dataset.id }); render(); return;
    case "keep-ok": { const d = S.dq[0]; const picks = {}; Object.keys(d.opts).forEach(k => { picks[k] = (U.keep && U.keep[k] != null && d.opts[k].includes(U.keep[k])) ? U.keep[k] : d.opts[k][0]; }); U.keep = null; act({ type: "keepObj", p: pi, picks }); return; }
    case "bid": act({ type: "bid", p: pi, amount: +document.getElementById("bid").value }); return;
    case "choose": act({ type: "choose", p: pi, k: t.dataset.k }); return;
    case "pickw": act({ type: "pickWorker", p: pi, worker: +t.dataset.w }); return;
    case "raid": act({ type: "raid", p: pi, disc: t.dataset.disc, lvl: t.dataset.lvl }); return;
    case "raid-skip": act({ type: "skip", p: pi }); return;
    case "pivot": act({ type: "pivot", p: pi, replace: t.dataset.r === "1" }); return;
    case "drop": act({ type: "dropObj", p: pi, obj: +t.dataset.id }); return;
    case "keepm": act({ type: "keepMile", p: pi, keep: [+t.dataset.id] }); return;
    case "patchfix": act({ type: "patchFix", p: pi, idx: +t.dataset.i }); return;
    case "patchdone": act({ type: "patchDone", p: pi }); return;
    default: if (String(t.dataset.act).indexOf("st-") === 0 && U.owner && SI.studioAct) { SI.studioAct(t.dataset.act, t, masterCtx()); return; } if (String(t.dataset.act).indexOf("m-") === 0 && U.owner && SI.adminAct) SI.adminAct(t.dataset.act, t, masterCtx()); return;
  }
});
$root.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset.seatn != null) { const n = +t.value; while (U.seats.length < n) U.seats.push({ name: "Player " + (U.seats.length + 1), bot: true }); U.seats.length = n; render(); return; }
  if (t.dataset.lcount != null && U.net && U.net.host) { const k = +t.value, M = U.net.meta; const seats = M.seats.map(x => Object.assign({}, x)); while (seats.length < k) seats.push({ name: "Bot " + (seats.length + 1), kind: "bot", persona: "", skill: "", cid: null }); seats.length = k; M.seats = seats; lobbySend(); return; }
  if (t.dataset.lkind != null && U.net && U.net.host) { const M = U.net.meta, s = M.seats[+t.dataset.lkind]; s.kind = t.value; if (s.kind === "bot") { s.cid = null; if (!s.name) s.name = "Bot " + (+t.dataset.lkind + 1); } lobbySend(); return; }
  if (t.dataset.lskill != null && U.net && U.net.host) { U.net.meta.seats[+t.dataset.lskill].skill = t.value; lobbySend(); return; }
  if (t.dataset.lpers != null && U.net && U.net.host) { U.net.meta.seats[+t.dataset.lpers].persona = t.value; lobbySend(); return; }
  if (t.dataset.lname != null && U.net) { const i = +t.dataset.lname, M = U.net.meta, s = M.seats[i]; s.name = t.value.slice(0, 20); if (s.cid === N.cid()) { setName(s.name); N.send({ t: "claim", seat: i, name: s.name, extra: true }); } else if (U.net.host) lobbySend(); return; }
  if (t.dataset.pname != null) { setName(t.value); return; }
  if (t.dataset.sesslabel != null) { SI.an.setLabel(t.value); return; }
  if (t.dataset.seatname != null) { const si = +t.dataset.seatname; U.seats[si].name = t.value; if (!U.seats[si].bot && U.seats.findIndex(s => !s.bot) === si && t.value.trim()) setName(t.value.trim()); return; }
  if (t.dataset.botskill != null) { U.botSkill = t.value; render(); return; }
  if (gsChange(t)) return;
  if (t.dataset.seatbot != null) { U.seats[+t.dataset.seatbot].bot = t.value === "1"; return; }
  if (t.dataset.cfg || t.dataset.cfgjson || t.dataset.path || t.dataset.mpath) { if (SI.stu2) SI.stu2.snap(U.studio); const r = SI.studioChange(U.studio, t); if (r !== true) { toast(r || "Invalid value"); } SI.saveDraft(U.studio); (t.dataset.mpath ? t.closest(".mchk") || t : t.type === "checkbox" ? t.closest("label") || t : t).classList.add("dirty"); if (t.type === "checkbox" && t.dataset.cfg) { const lb = t.closest("label"); if (lb) lb.lastChild.textContent = t.checked ? " On" : " Off"; } if (SI.stu2) SI.stu2.refresh(); return; }
});
$root.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "pw") tryGate(); if (e.key === "Enter" && e.target.dataset && e.target.dataset.jcode != null) { const b = $root.querySelector('[data-act="online-join"]'); if (b) b.click(); } if (e.key === "Escape" && (U.modal || U.pop || U.detail)) { const xs = $root.querySelectorAll(".modal .x"); if (xs.length) xs[xs.length - 1].click(); } });

// boot: ask the server who this is (cookie role). Without a server (local file / preview) fall back to the older passphrase gate and local Data Studio.
function loadScript(src) { return new Promise(res => { const el = document.createElement("script"); el.src = src; el.onload = () => res(true); el.onerror = () => res(false); document.head.appendChild(el); }); }
async function liveConfig() {
  const q = new URLSearchParams(location.search); const test = q.get("env") === "test"; U.testEnv = test;
  try { const r = await fetch("/__config?env=" + (test ? "test" : "live") + "&site=" + N.site(), { cache: "no-store" }); if (r.ok) { const o = await r.json(); if (o && o.ovr) { U.live = { env: test ? "test" : "live", version: o.version, note: o.note }; U.tuned = (test ? "test v" : "live v") + o.version; return SI.applyDiff(JSON.parse(o.ovr)); } } } catch (e) {}
  U.tuned = "default"; return null;
}
(async function boot() {
  const w = await N.whoami();
  SI.an.enabled = !!w; // records are only sent when the game is served by the Worker
  if (w) {
    U.hosted = true; U.role = w.role; U.owner = !!w.owner;
    const base = await liveConfig();
    if (U.owner) { await loadScript("studio.js"); await loadScript("studio2.js"); await loadScript("admin.js"); await loadScript("stats.js"); await loadScript("simui.js"); }
    U.active = U.owner && root.localStorage.getItem("shipit.studio.v2") ? SI.loadStudio() : (base || SI.defaults()); U.studio = (U.owner && SI.loadDraft()) || SI.applyDiff(SI.diffOf(U.active)); if (D.applyText) D.applyText(U.active.data.text);
    U.screen = "menu"; U.baseCfg = base;
    if (resumeRoom()) return;
  } else { // standalone: local passphrase gate, local Data Studio
    await loadScript("studio.js"); await loadScript("studio2.js"); U.owner = !!SI.renderStudio; U.active = SI.loadStudio(); U.studio = SI.loadDraft() || SI.applyDiff(SI.diffOf(U.active)); if (D.applyText) D.applyText(U.active.data.text); U.tuned = "default";
    let ok = false; try { ok = sessionStorage.getItem("shipit.ok") === "1"; } catch (e) {} U.screen = ok ? "menu" : "gate";
    if (ok && loadAuto()) { anResume("auto"); render(); scheduleBots(); return; }
  }
  render();
})();

/* ---------- stale-tab guard: tell the player when a newer build is live ---------- */
(function () {
  if (!root.fetch || !root.document) return; let base = null, shown = false;
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; };
  const probe = () => fetch("ui.js", { cache: "no-store" }).then(r => r.ok ? r.text() : null).then(t => { if (t == null) return; const h = hash(t); if (base == null) { base = h; return; } if (h !== base && !shown) { shown = true; const d = document.createElement("div"); d.style.cssText = "position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:400;background:#1f2d3d;border:2px solid #f5c542;color:#e8eef5;padding:8px 14px;border-radius:10px;font:600 13px system-ui;display:flex;gap:10px;align-items:center"; d.innerHTML = 'A new version is available. <button style="background:#3498db;border:0;color:#fff;border-radius:6px;padding:4px 10px;font-weight:700">Reload</button><button aria-label="Dismiss" style="background:none;border:0;color:#9fb0c3;font-size:18px">\u00d7</button>'; d.children[0].onclick = () => root.location.reload(); d.children[1].onclick = () => d.remove(); document.body.appendChild(d); } }).catch(() => {});
  probe(); document.addEventListener("visibilitychange", () => { if (!document.hidden) probe(); }); setInterval(probe, 300000);
})();
})(typeof window !== "undefined" ? window : globalThis);
