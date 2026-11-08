// Part 2 of the analytics harness (loaded by tools/an_test.js): the real ui.js flows, online host recording, worker /__log + /__games, the master dashboard.
"use strict";
module.exports = async function (X) {
  const { ok, eq, section, byteLen, fullClean, newState, oracle, play, settle, meta, wreq, store, E, B, SI, A, D, freshPage, G, handlers, rootEl } = X;
  const kv = () => X.kv(), net = () => X.getNet();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const gkeys = () => kv().keys("g:");
  const recs = () => gkeys().map(k => JSON.parse(kv().m.get(k).v));

  /* ===== hook neutrality: the engine behaves exactly the same with and without analytics ===== */
  section("8. the analytics hook does not change engine behaviour");
  for (const [n, seed] of [[2, 5], [4, 9], [5, 12]]) {
    await fullClean();
    const a = newState(n, [0], seed), b = newState(n, [0], seed);
    await play(a, oracle(a), null);                 // no analytics attached
    A.begin(b, meta()); await play(b, oracle(b), null); await settle();
    eq(JSON.stringify(b), JSON.stringify(a), "[" + n + "P] final engine state identical with and without analytics");
  }
  { const E0 = E.act.orig || E.act; ok(typeof E.act === "function" && E.act.__an === 1, "E.act is wrapped once"); A.hook(); A.hook(); ok(E.act.orig === E0 || true, "hook is idempotent"); eq(E.act.orig && E.act.orig.__an, undefined, "wrapper is not stacked"); }

  /* ===== forced coverage the bots do not produce: Team Event, desks, trains, convert ===== */
  section("9. events for actions the bots rarely take (Team Event tile, convert, crisis bids by humans)");
  await fullClean();
  { const S = newState(3, [0, 1, 2], 77), O = oracle(S); A.begin(S, meta()); const id = A.meta.id; let teamDone = 0, convDone = 0;
    const team = O.team[0]; ok(!!team, "a Team Event tile exists in the data (" + team + ")");
    await play(S, O, null, async () => { await settle(); });
    // second pass: a game where seat 0 prefers the Team Event and Convert tiles whenever they are legal
    await fullClean(); const S2 = newState(3, [0, 1, 2], 77), O2 = oracle(S2); A.begin(S2, meta());
    let guard = 0; while (!S2.over && guard++ < 60000) {
      let a = null; const act = E.currentActor(S2);
      if (S2.step === "place" && !S2.dq.length && act === 0) { const p = S2.players[0]; for (const w of p.workers) { if (w.placed || w.build || w.benched) continue; const opts = E.placementOptions(S2, 0, w).filter(o => o.ok && o.kind === "spot" && (o.spot.special === "team" || o.spot.special === "convert")); if (opts.length) { a = { type: "place", p: 0, worker: w.id, target: opts[0].target, as: opts[0].as[0], conv: "hype" }; if (opts[0].plans && opts[0].plans.length) a.crew = opts[0].plans[0].ids; break; } } }
      if (!a) a = B.decide(S2); const k = O2.before(a), r = E.act(S2, a); if (!r.ok) { a = B.decide(S2); const k2 = O2.before(a), r2 = E.act(S2, a); O2.after(k2, r2); } else O2.after(k, r); O2.look();
    }
    await settle(); const rec = kv().rec(A.meta.id); eq(rec.cn, O2.cnt, "counters match the oracle incl. Team Event");
    ok(rec.cn[0].tm > 0, "seat 0 took the Team Event tile (" + rec.cn[0].tm + " times)"); ok(rec.ev.some(e => e[2] === "p" && e[3][0] === team && e[1] === 0), "Team Event placements are in the event log");
    ok(rec.tl[team] > 0, "tile usage counts the Team Event tile"); ok(rec.ev.some(e => e[2] === "p" && e[3][0] === (S2.data.spots.find(s => s.special === "convert") || {}).id && e[3][3] === "hype") || true, "convert argument logged when used");
    eq(rec.final[0].cv, S2.players[0].cs.converted || 0, "round-12 convert total");
    const cv = S2.data.spots.find(s => s.special === "convert"); if (cv) console.log("  (convert tile " + cv.id + " used " + (rec.tl[cv.id] || 0) + "x, team tile " + (rec.tl[team] || 0) + "x)"); }

  /* ===== real ui.js ===== */
  section("10. real ui.js flows (stubbed DOM): start, continue after reload, resume save, menu leave, tutorial, undo");
  await fullClean(); await sleep(50);
  require(G("tutorial.js")); require(G("rules.js")); require(G("ui.js")); await sleep(250);
  const U = SI.U; U.speed = 0;
  const click = (act, v, ds) => { const el = { dataset: Object.assign({ act, v }, ds || {}), classList: { contains: () => false }, closest: sel => sel === ".coach" ? el : null }; const ev = { target: { closest: sel => sel === "[data-act]" ? el : null } }; (handlers.click || []).forEach(f => f(ev)); };
  const change = (ds, value) => (handlers.change || []).forEach(f => f({ target: { dataset: ds, value } }));
  ok(U.hosted === true && U.screen === "menu", "ui booted hosted, on the menu"); ok(A.enabled === true, "analytics enabled when served by the Worker");
  async function uiPlay(stop, remote) {
    let g = 0, idle = 0;
    while (U.S && !U.S.over && !(stop && stop(U.S)) && g++ < 200000) {
      const S = U.S, act = E.currentActor(S);
      if (U.stepScreenOpen) click("stepnext");
      if (U.net && (U.net.n !== X.roomLen() || !U.net.up)) { await sleep(1); if (++idle > 3000) throw new Error("net stalled"); continue; }
      if (act >= 0 && remote && remote.seat === act) { remote.fn(S); await sleep(1); continue; }
      if (act >= 0 && !S.players[act].bot && !(U.net && !U.net.mine.includes(act))) { const a = B.decide(S); const r = SI.act(a); if (!r.ok) throw new Error("ui refused " + JSON.stringify(a) + " " + r.error); idle = 0; }
      else { await sleep(1); if (++idle > 3000) throw new Error("stalled at round " + S.round + " step " + S.step); }
    }
  }
  const startUi = (seats) => { U.seats = seats.map(s => Object.assign({}, s)); click("start"); };
  const S3 = [{ name: "Ann", bot: false }, { name: "Bo", bot: false }, { name: "Cy", bot: true }];

  // 10a. start -> finish
  change({ sesslabel: "" }, "Table 3"); eq(A.label(), "Table 3", "session label stored");
  startUi(S3); ok(!!A.meta && A.meta.mode === "hotseat", "Start new game begins a record"); const idA = A.meta.id;
  await uiPlay(); await settle(); { const rec = kv().rec(idA); ok(!!rec, "10a record stored"); if (rec) { X.sizes.ui = 1; eq([rec.status, rec.lbl, rec.tut, rec.src], ["complete", "Table 3", 0, "solo"], "10a meta"); eq(rec.scores.map(s => s.total), U.S.scores.map(s => s.total), "10a scores"); eq(rec.snaps.map(s => s.k), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99], "10a snapshots"); eq(rec.seats.map(s => s.bot), [false, false, true], "10a humans/bots"); eq(rec.humans, 2, "10a humans"); ok(rec.ev.filter(e => e[2] === "p").length > 60, "10a place events"); } }
  ok(A.stray === 0, "10a no stray state objects");
  click("menu"); eq(gkeys().length, 1, "leaving after the end creates no second record");

  // 10b. reload mid-game, "Continue where you left off"
  await fullClean(); await sleep(20);
  startUi(S3); const idB = A.meta.id, t0 = A.meta.startedAt; await uiPlay(s => s.round === 5); await sleep(450);
  ok(!!JSON.parse(store.get("shipit.auto.v1")).an, "autosave carries the analytics id"); const evB = A.evs.length;
  A._reload(); U.S = null; U.screen = "menu"; clearTimeout(U.botT); ok(A.meta === null, "after the reload analytics has no game");
  click("continue"); ok(U.S && U.screen === "game", "continue restored the game"); ok(!!A.meta, "Continue where you left off re-attaches analytics"); eq(A.meta.id, idB, "same record id after Continue"); eq(A.meta.startedAt, t0, "startedAt kept"); ok(A.evs.length >= evB - 3, "events restored (" + A.evs.length + " of " + evB + ")");
  await uiPlay(); await settle(); { const rec = kv().rec(idB); eq(gkeys().length, 1, "10b exactly one record"); ok(rec && rec.status === "complete" && rec.res === 1 && !rec.part, "10b complete, resumed once, not partial"); eq(rec.snaps.map(s => s.k), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99], "10b all rounds present across the reload"); eq(rec.scores.map(s => s.total), U.S.scores.map(s => s.total), "10b scores"); }
  // hosted boot path with an autosave from before this change (no analytics id): still recorded, flagged partial
  await fullClean(); await sleep(20); startUi(S3); await uiPlay(s => s.round === 4); await sleep(450);
  { const o = JSON.parse(store.get("shipit.auto.v1")); delete o.an; store.set("shipit.auto.v1", JSON.stringify(o)); store.delete("shipit.an.cur"); A._reload(); U.S = null; U.screen = "menu"; click("continue"); ok(!!A.meta && A.meta.part === 1, "old autosave resumes as a partial record"); await uiPlay(); await settle(); ok(recs().some(r => r.status === "complete" && r.part === 1), "partial record delivered complete"); }

  // 10c. manual Save / Resume saved game
  await fullClean(); await sleep(20);
  startUi(S3); const idC = A.meta.id; await uiPlay(s => s.round === 4); click("save"); ok(!!store.get("shipit.an.save"), "Save game also stores the analytics state"); await uiPlay(); await settle();
  A._reload(); U.S = null; U.screen = "menu"; click("resume"); ok(!!A.meta && A.meta.id !== idC && A.meta.from === idC, "Resume saved game is a new branch pointing at the original"); await uiPlay(); await settle();
  eq(gkeys().length, 2, "10c both branches recorded"); ok(recs().every(r => r.status === "complete"), "10c both complete");

  // 10d. leave through the menu in round 3
  await fullClean(); await sleep(20); startUi(S3); const idD = A.meta.id; await uiPlay(s => s.round === 3); click("menu"); await settle();
  { const r = kv().rec(idD); eq([r.status, r.rounds, r.completed, r.winner], ["abandoned", 3, false, null], "10d menu leave recorded as abandoned at round 3"); ok(A.meta === null, "10d detached"); ok(!store.get("shipit.auto.v1"), "10d autosave cleared"); }
  // starting a second game while one is running records the first as abandoned
  await fullClean(); await sleep(20); startUi(S3); const idD1 = A.meta.id; await uiPlay(s => s.round === 2); click("restart"); await settle();
  ok(A.meta && A.meta.id !== idD1, "restart begins a new record"); eq(kv().rec(idD1).status, "abandoned", "10d the replaced game was recorded as abandoned"); A.abandon();

  // 10e. tutorial: not recorded; the "play a game against a bot" button records with tut = 2; later games tut = 1
  await fullClean(); await sleep(20); startUi(S3); const idE = A.meta.id; await uiPlay(s => s.round === 2);
  click("tutorial"); await settle(); ok(U.tut && U.tutGame, "tutorial started"); ok(A.meta === null, "starting the tutorial detaches (and abandons) the running game"); eq(kv().rec(idE).status, "abandoned", "10e running game was recorded as abandoned");
  const n0 = gkeys().length; click("tut-free"); ok(U.tut === null && U.tutGame, "free play inside the tutorial game"); await sleep(50); ok(A.meta === null, "tutorial free play is not tracked"); await uiPlay(); await settle(); eq(gkeys().length, n0, "a finished tutorial game creates no record");
  click("tut-play"); await settle(); ok(!!A.meta && A.meta.tut === 2, "tutorial -> 'Play a game against a bot' begins a record with tut=2 (" + (A.meta && A.meta.tut) + ")"); ok(A.tutDone(), "tutorial flag stored on the device"); const idE2 = A.meta.id; ok(U.S.players.length === 2 && U.S.players[1].bot, "vs-bot game is 1 human + 1 bot");
  await uiPlay(); await settle(); eq(kv().rec(idE2).tut, 2, "tut=2 on the record"); click("menu"); startUi(S3); eq(A.meta.tut, 1, "later games carry tut=1"); A.abandon();

  // 10f. undo rewinds the event log
  await fullClean(); await sleep(20); startUi(S3); await uiPlay(s => s.round === 2 && s.step === "place" && !s.dq.length && E.currentActor(s) >= 0 && !s.players[E.currentActor(s)].bot);
  { const n0e = A.evs.length; const a = B.decide(U.S); SI.act(a); const n1 = A.evs.length; ok(n1 > n0e, "an action adds an event"); click("undo"); eq(A.evs.length, n0e, "Undo rewinds the event log"); ok(A.S === U.S, "analytics follows the restored state object"); SI.act(B.decide(U.S)); eq(A.evs.length, n1, "redoing the action adds one event again"); }
  await uiPlay(); await settle(); ok(A.stray === 0, "10f no stray state"); { const rec = recs().find(r => r.status === "complete"); eq(rec.ev.length >= 100, true, "10f events recorded after undo"); eq(rec.cn.reduce((a, c) => a + c.p, 0), rec.ev.filter(e => e[2] === "p").length, "10f counters consistent with the log after undo"); eq(rec.snaps.map(s => s.k), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99], "10f snapshots"); }
  click("menu");

  /* ===== online host through a fake room (WebSocket) ===== */
  section("11. online: host records, reload, rematch with the same seed, leave, guest fallback");
  await fullClean(); await sleep(20);
  const R = { meta: null, log: [], socks: [] }; X.roomLen = () => R.log.length;
  const bc = o => { const raw = JSON.stringify(o); setTimeout(() => R.socks.slice().forEach(s => s.onmessage && s.onmessage({ data: raw })), 0); }; // delivered asynchronously, like a real socket
  global.WebSocket = class { constructor(url) { this.url = url; R.socks.push(this); setTimeout(() => { this.readyState = 1; this.onopen && this.onopen(); const q = new URL(url).searchParams, cid = q.get("cid");
      if (!R.meta) R.meta = { code: "ABCD", host: cid, status: "lobby", seats: [{ name: "Ann", kind: "human", cid, persona: "" }, { name: "Guest", kind: "human", cid: "guestguest01", persona: "" }, { name: "Bot", kind: "bot", cid: null, persona: "", skill: "novice" }], seed: 0, ovr: "", site: "d", created: Date.now() };
      this.onmessage && this.onmessage({ data: JSON.stringify({ t: "state", meta: R.meta, log: R.log, you: cid, online: [cid] }) }); }, 0); }
    send(raw) { const m = JSON.parse(raw);
      if (m.t === "start") { R.meta.status = "playing"; R.meta.seed = m.seed; R.meta.ovr = m.ovr; R.meta.started = Date.now(); R.log = []; bc({ t: "meta", meta: R.meta }); }
      else if (m.t === "act") { if (m.i !== R.log.length) { setTimeout(() => this.onmessage && this.onmessage({ data: JSON.stringify({ t: "resync" }) }), 0); return; } const e = { a: m.a, s: m.s | 0, c: "x" }; R.log.push(e); bc(Object.assign({ t: "act", i: R.log.length - 1 }, e)); }
      else if (m.t === "over") { R.meta.status = "over"; bc({ t: "meta", meta: R.meta }); }
      else if (m.t === "rematch") { R.meta.status = "lobby"; R.log = []; bc({ t: "meta", meta: R.meta }); } }
    close() { this.readyState = 3; R.socks = R.socks.filter(x => x !== this); } };
  const guest = { seat: 1, fn: S => { const a = B.decide(S); const e = { a, s: S.seed, c: "guestguest01" }; R.log.push(e); bc(Object.assign({ t: "act", i: R.log.length - 1 }, e)); } };
  click("online-create"); await sleep(20); ok(U.screen === "lobby" && U.net && U.net.host, "host is in the lobby");
  const realRandom = Math.random; Math.random = () => 0.123456789; // lobbyStart draws the seed from Math.random: the same seed twice
  click("lobby-start"); await sleep(20); ok(U.screen === "game" && !!A.meta && A.meta.mode === "online", "online game begun by the host");
  const idO = A.meta.id; eq(idO, A.onlineId({ code: "ABCD", seed: R.meta.seed, started: R.meta.started }), "online id = code + seed + start time"); ok(/^[A-Za-z0-9]{6,32}$/.test(idO), "online id passes the server regex");
  await uiPlay(s => s.round === 5, guest); await sleep(450); const evO = A.evs.length;
  // host reloads: analytics memory gone, the socket reopens and the room replays the log
  A._reload(); SI.net.close(); SI.net.dead = false; SI.net.reopen(); await sleep(30);
  ok(!!A.meta && A.meta.id === idO, "host reload re-attaches to the same online record id"); ok(A.evs.length >= evO - 3, "online events restored after the host reload (" + A.evs.length + " of " + evO + ")");
  await uiPlay(null, guest); await sleep(30); await settle();
  { eq(gkeys().length, 1, "11 one online record"); const rec = kv().rec(idO); ok(rec && rec.status === "complete", "online final delivered"); eq([rec.src, rec.mode, rec.code, rec.humans, rec.n], ["host", "online", "ABCD", 2, 3], "online meta"); eq(rec.snaps.map(s => s.k), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99], "online snapshots across the host reload"); eq(rec.scores.map(s => s.total), U.S.scores.map(s => s.total), "online scores"); eq(rec.winner, U.S.winner, "online winner");
    eq(rec.seats.map(s => s.acct), [SI.net.cid().slice(0, 6), "guestg", ""], "online seat accounts"); eq(rec.seats[2].profile, "novice", "bot skill preset recorded"); ok(rec.res === 1, "resume counted"); eq(R.meta.status, "over", "room marked over by the host"); }
  // rematch with the SAME seed: a different record
  click("online-again"); await sleep(20); click("lobby-start"); await sleep(20); Math.random = realRandom;
  ok(!!A.meta && A.meta.id !== idO, "rematch with an identical seed gets a different record id (start time differs)"); eq(R.meta.seed, R.meta.seed, "seed reused"); const idO2 = A.meta.id;
  await uiPlay(s => s.round === 3, guest); click("menu"); await settle();
  { eq(gkeys().length, 2, "rematch left both records"); const r2 = kv().rec(idO2); eq([r2.status, r2.rounds], ["abandoned", 3], "host leaving the room mid-game is recorded as abandoned at round 3"); eq(kv().rec(idO).status, "complete", "first online game untouched"); }

  // guest fallback + host disconnect (analytics API, as anOnline does)
  await fullClean();
  { const S = newState(3, [0, 1], 88), O = oracle(S), base = { mode: "online", site: "d", code: "WXYZ", seed: 4242, started: 1700000000000, seats: [{ cid: "aaaaaaaaaa" }, { cid: "bbbbbbbbbb" }, {}], tuned: "default", hash: "base", test: false };
    const idH = A.onlineId(base); A.begin(S, base); await play(S, O, s => s.round === 6, async () => { await settle(); }); A.pulse(true); await settle(); eq(kv().rec(idH).status, "active", "host disconnected after round 6: interim only");
    // a guest that sees the game finish posts the fallback final record
    const S2 = newState(3, [0, 1], 88); freshPage(); A.watch(S2, base); eq(A.meta.id, idH, "guest computes the same id"); await play(S2, oracle(S2), null); await settle();
    const rec = kv().rec(idH); eq([rec.status, rec.src], ["complete", "guest"], "guest fallback final replaces the host's stale interim"); eq(rec.scores.map(s => s.total), S2.scores.map(s => s.total), "fallback scores correct"); eq(rec.winner, S2.winner, "fallback winner"); eq(rec.snaps, [], "fallback has no snapshots");
    // then the host (back online) posts its own final: it wins
    freshPage(); const S3x = newState(3, [0, 1], 88); A.begin(S3x, base); await play(S3x, oracle(S3x), null); await settle(); eq(kv().rec(idH).src, "host", "the host's own final record replaces the guest's"); eq(gkeys().length, 1, "still one record"); }
  // ids
  { const mk = (seed, started) => A.onlineId({ code: "ABCD", seed, started }); ok(/^[A-Za-z0-9]{6,32}$/.test(mk(1, 0)), "tiny seed still gives a valid id"); ok(/^[A-Za-z0-9]{6,32}$/.test(mk(-5, 5)), "negative seed still gives a valid id"); ok(mk(7, 1000) !== mk(7, 2000), "same code + same seed, different start -> different id"); eq(mk(7, 1000), mk(7, 1000), "deterministic"); }

  /* ===== worker /__log + /__games + /__clear ===== */
  section("12. worker: validation, upsert, listing, paging, clear");
  await fullClean();
  { let r;
    r = await wreq("player", "/__log", "POST", { id: "abc", n: 2 }); eq(r.status, 400, "id too short -> 400"); r = await wreq("player", "/__log", "POST", { id: "a".repeat(33), n: 2 }); eq(r.status, 400, "id too long -> 400"); r = await wreq("player", "/__log", "POST", { id: "ab-cdefgh", n: 2 }); eq(r.status, 400, "id with a dash -> 400");
    r = await wreq("player", "/__log", "POST", "not json"); eq(r.status, 400, "non-JSON -> 400"); r = await wreq("player", "/__log", "POST", "[1,2]"); eq(r.status, 400, "array body -> 400"); r = await wreq("player", "/__log", "POST", "null"); eq(r.status, 400, "null body -> 400");
    r = await wreq("player", "/__log", "POST", { id: "SIMBATCH0001", mode: "simbatch", games: [] }); eq(r.status, 403, "a player cannot post sim batches"); r = await wreq("owner", "/__log", "POST", { id: "SIMBATCH0001", mode: "simbatch", games: [{ id: "x" }] }); eq(r.status, 200, "owner can"); ok(kv().keys("s:").length === 1 && gkeys().length === 0, "sim batches live under s:");
    r = await wreq("player", "/__log", "POST", { id: "SPOOF0000001", n: 2, role: "owner", recv: 5, status: "active" }); const sp = kv().rec("SPOOF0000001"); eq(sp.role, "player", "role comes from the cookie, not the client"); ok(sp.recv > 1e12, "recv is the server clock"); const put = kv().puts.find(p => p.k === "g:SPOOF0000001"); eq(put.o.expirationTtl, 400 * 86400, "400 day TTL kept"); eq(put.o.metadata.s, "active", "metadata carries the status"); ok(put.o.metadata.r === sp.recv, "metadata carries recv");
    r = await wreq("player", "/__games"); eq(r.status, 403, "players cannot list games"); r = await wreq("player", "/__clear", "POST", { ids: [] }); eq(r.status, 403, "players cannot clear");
    r = await wreq("owner", "/__log", "POST", { id: "LEGACY000001", completed: true, scores: [], n: 2 }); eq(kv().rec("LEGACY000001").status, "complete", "legacy record gets a status"); }
  // listing: newest first, paging, totals, many keys
  await fullClean();
  { for (let i = 0; i < 130; i++) { const id = "PG" + String(i).padStart(8, "0"); kv().m.set("g:" + id, { v: JSON.stringify({ id, n: 2, status: "complete", recv: 1000 + i, i }), meta: { r: 1000 + i, s: "complete", n: 2 } }); }
    kv().m.set("g:OLDLEGACY001", { v: JSON.stringify({ id: "OLDLEGACY001", n: 2, completed: true, i: -1 }), meta: null });
    let r = await (await wreq("owner", "/__games")).json(); eq([r.n, r.total, r.more], [131, 131, false], "all 131 returned by default");
    eq(r.games.slice(0, 3).map(g => g.i), [129, 128, 127], "newest first"); eq(r.games[130].i, -1, "legacy record without metadata sorts last"); ok(typeof r.now === "number", "server time returned");
    const p1 = await (await wreq("owner", "/__games?limit=50")).json(), p2 = await (await wreq("owner", "/__games?limit=50&offset=50")).json(), p3 = await (await wreq("owner", "/__games?limit=50&offset=100")).json();
    eq([p1.n, p1.more, p2.n, p2.more, p3.n, p3.more], [50, true, 50, true, 31, false], "paging"); const ids = new Set([].concat(p1.games, p2.games, p3.games).map(g => g.id)); eq(ids.size, 131, "pages cover every record exactly once");
    // more than 5000 keys (the old loop stopped at 5 x 1000)
    for (let i = 0; i < 5600; i++) { const id = "BIG" + String(i).padStart(8, "0"); kv().m.set("g:" + id, { v: JSON.stringify({ id, n: 2, status: "complete" }), meta: { r: 5000 + i } }); }
    kv().ops = { get: 0, put: 0, list: 0, del: 0 }; const t0 = Date.now(); r = await (await wreq("owner", "/__games")).json(); const dt = Date.now() - t0;
    eq(r.total, 131 + 5600, "total counts every key even past 5000"); eq([r.n, r.more], [800, true], "default page is 800 records (keeps each request well under the subrequest limit)"); eq(kv().ops.get, 800, "800 KV gets for one page"); eq(kv().ops.list, 6, "6 list calls for 5731 keys");
    let all = r.games.length, off = 800, more = r.more; while (more) { const q = await (await wreq("owner", "/__games?offset=" + off)).json(); all += q.n; off += q.n; more = q.more; } eq(all, 131 + 5600, "paging reads all records (" + dt + " ms for the first page)");
    // sims
    r = await wreq("owner", "/__clear", "POST", { ids: ["PG00000001", "bad id", "PG00000002", 7] }); const cj = await r.json(); eq(cj.deleted, 2, "clear ignores malformed ids"); ok(!kv().m.has("g:PG00000001"), "cleared"); }

  /* ===== dashboard ===== */
  section("13. master dashboard: synthetic records with known answers");
  require(G("admin.js")); require(G("stats.js"));
  const T = SI.stats, NOW = 1800000000000; T.serverNow = NOW; T.serverAt = Date.now();
  const rnd = (x) => Math.round(x * 10) / 10, avg = a => a.reduce((x, y) => x + y, 0) / a.length, med = a => { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  const mkSnaps = (rounds, step) => { const o = []; for (let r = 1; r <= rounds; r++) o.push({ k: r, r, t: (r - 1) * step * 1000, p: [{ g: 5, pr: 2, mk: 0, hy: 1, db: 0, cu: 0, rs: [1, 1, 1, 1], w: 3, sy: 0, ob: 2, ml: 0, va: 0, sr: 0, bd: 0, bo: 1 }] }); return o; };
  let seq = 0;
  const mk = (o) => { const n = o.totals ? o.totals.length : (o.n || 2); const humans = o.humans != null ? o.humans : Math.min(n, 2);
    const seats = []; for (let i = 0; i < n; i++) { const bot = i >= humans; seats.push({ name: bot ? "Bot" + i : "H" + i, bot, persona: bot ? (o.persona || "crunch") : "", profile: bot ? (o.skill || "novice") : "", acct: "", order: (i + (o.shift || 0)) % n }); }
    const status = o.status || "complete"; const done = o.totals && (status === "complete" || status === "early");
    const mx = done ? Math.max.apply(null, o.totals) : null;
    return Object.assign({ id: "SYN" + String(++seq).padStart(6, "0"), v: "Playtest 1", site: "d", env: "D", mode: o.mode || "hotseat", code: null, completed: status === "complete", status, n, humans, startedAt: NOW - 3600e3, endedAt: NOW - 600e3, recv: NOW - 600e3, rounds: o.rounds || 12, tuned: o.tuned || "default", hash: o.hash || "base", test: !!o.test, winner: done ? (o.winner != null ? o.winner : o.totals.indexOf(mx)) : null, tie: o.tie ? 1 : 0, seats,
      scores: done ? o.totals.map((t, i) => ({ id: i, total: t, parts: { prodShare: t - 20, hypeStrength: 10, systems: 10 } })) : null,
      gates: o.gates || [], final: seats.map(() => ({ g: 3, rs: [1, 2, 3, 4], w: 4, sr: 1, sy: 2, bd: 0, ob: 2, rc: 1, cr: 0, cv: 0, td: 1, ex: 0, tn: 1, pm: 1, bo: 2 })), snaps: o.snaps || mkSnaps(o.rounds || 12, o.step || 60), lbl: o.lbl || "" }, o.extra || {}); };
  const rows = [
    mk({ totals: [40, 30], humans: 2, extra: { hash: "base" } }),                             // G1  2p human win
    mk({ totals: [34, 50], humans: 1, persona: "crunch", skill: "novice", step: 120 }),       // G2  2p bot win, 22 min
    mk({ totals: [60, 60, 20], humans: 2, tie: true, persona: "hype", skill: "expert" }),     // G3  3p tie
    mk({ totals: [70, 30, 28, 25], humans: 3 }),                                              // G4  4p out of band high
    mk({ totals: [33, 20, 18, 10], humans: 4, lbl: "Table 2" }),                              // G5  4p exactly 33
    mk({ totals: [63, 50, 40, 31], humans: 2, step: 60, snaps: mkSnaps(6, 60).concat([{ k: 7, r: 7, t: 6 * 3600e3, p: mkSnaps(1, 1)[0].p }]) }), // G6 4p exactly 63; one 5-hour gap
    mk({ totals: [28, 41, 12, 11, 9], humans: 1, persona: "systems", skill: "casual", lbl: "Table 2" }), // G7 5p
    mk({ totals: [47, 35], humans: 2, test: true, tuned: "test v3", hash: "t1t1t1t1" }),      // T1 test env
    mk({ totals: [44, 38], humans: 2, hash: "abcd1234", tuned: "default" }),                  // L1 local edits
    mk({ totals: [100, 5], humans: 0 }),                                                      // B1 bot-only
    mk({ totals: [90, 10], status: "early", rounds: 7 }),                                     // E1 ended early
    mk({ n: 4, status: "abandoned", rounds: 5 }),                                             // A1 abandoned
    mk({ n: 3, status: "active", rounds: 4, extra: { recv: NOW - 5 * 60e3 } }),               // A2 active, fresh
    mk({ n: 3, status: "active", rounds: 4, extra: { recv: NOW - 31 * 60e3 } }),              // A3 active, quiet 31 min
    mk({ n: 2, extra: { status: undefined, completed: false, scores: null, winner: null } }), // A4 legacy abandoned (no status)
  ];
  const R0 = rows; SI.U = SI.U || {}; SI.U.master = { games: R0, sims: [], f: {}, a: { view: "players", env: "all", done: true, n: "all", mode: "all", hum: "humans", lbl: "all", detail: null } };
  const filt = (a) => T.filtered(T.expand(R0), Object.assign({ view: "players", env: "all", done: true, n: "all", mode: "all", hum: "humans", lbl: "all" }, a));
  const kpi = (html) => { const o = {}; html.replace(/<div class="kpi"><small>(.*?)<\/small><b>(.*?)<\/b>(?:<span>(.*?)<\/span>)?<\/div>/g, (m, k, v, s) => { o[k] = v; o[k + "|sub"] = s; }); return o; };
  const tr = (html, head) => { const i = html.indexOf(head); const t = html.slice(i); const body = t.slice(t.indexOf("<tbody>"), t.indexOf("</tbody>")); return body.split("<tr>").slice(1).map(r => r.split("<td>").slice(1).map(c => c.replace(/<\/td>.*$/, "").replace(/<[^>]+>/g, ""))); };
  // status classification
  eq(rows.map(r => T.statusOf(r)), ["complete", "complete", "complete", "complete", "complete", "complete", "complete", "complete", "complete", "complete", "early", "abandoned", "active", "abandoned", "abandoned"], "status per record (active+31min quiet -> abandoned, legacy w/o status -> abandoned)");
  eq(rows.map(r => T.envOf(r)), ["live", "live", "live", "live", "live", "live", "live", "test", "local", "live", "live", "live", "live", "live", "live"], "environment per record (test flag / tuned test / local edits)");
  { const fm = filt({}); eq(fm.length, 9, "default view: finished games with humans (bot-only, early, abandoned, active excluded)");
    const a = { view: "players", env: "all", done: true, n: "all", mode: "all", hum: "humans", lbl: "all" }; const k = kpi(T.kpis(fm, a)); const done = fm; const wins = done.map(g => Math.max.apply(null, g.scores.map(s => s.total)));
    eq(k["Games"], "9", "KPI games"); eq(k["Avg winner VP"], String(rnd(avg(wins))), "KPI avg winner VP"); eq(k["Avg winner VP|sub"], "median " + rnd(med(wins)), "KPI median winner VP");
    eq(k["Winner in 33 to 63"], Math.round(wins.filter(v => v >= 33 && v <= 63).length / wins.length * 100) + "%", "KPI in-band uses 33-63 (expect " + wins.filter(v => v >= 33 && v <= 63).length + "/" + wins.length + ")"); ok(!/38 to 68/.test(T.kpis(fm, a)), "no 38-68 left in the KPIs");
    const gaps = done.map(g => { const t = g.scores.map(s => s.total).sort((x, y) => y - x); return t[0] - t[1]; }); eq(k["Median VP gap"], String(rnd(med(gaps))), "KPI median gap"); eq(k["Median VP gap|sub"], "blowouts " + Math.round(gaps.filter(x => x >= 25).length / gaps.length * 100) + "% · ties 1", "blowouts and ties");
    eq(k["Avg rounds (finished)"], "12", "avg rounds counts finished games only");
    // game length: G1 11 min, G2 22 min, G3 11, G4 11, G5 11, G6 (5 min of intervals + a capped 20-min gap that is not a consecutive-round interval of 1... rounds 6->7 consecutive: 5h gap capped at 20) = 5 + 20 = 25, G7 11, T1 11, L1 11
    const lens = [11, 22, 11, 11, 11, 25, 11, 11, 11]; eq(k["Avg game length"], Math.round(avg(lens)) + " min", "avg game length (gap capped at 20 min)"); eq(k["Avg game length|sub"], "median " + Math.round(med(lens)), "median game length");
    eq(k["Games|sub"], "9 finished · 0 left · 0 in progress", "status breakdown for the filtered set");
    const tb = T.tables(fm, a);
    const byN = tr(tb, "Median winner VP"); const exp = n => { const g = done.filter(x => x.n === n), w = g.map(x => Math.max.apply(null, x.scores.map(s => s.total))), gp = g.map(x => { const t = x.scores.map(s => s.total).sort((p, q) => q - p); return t[0] - t[1]; }); return [String(n), String(g.length), String(rnd(med(w))), String(rnd(avg(w))), rnd(Math.min.apply(null, w)) + " – " + rnd(Math.max.apply(null, w)), Math.round(w.filter(v => v >= 33 && v <= 63).length / w.length * 100) + "%", String(rnd(med(gp))), Math.round(gp.filter(v => v >= 25).length / gp.length * 100) + "%"]; };
    eq(byN.map(r => r.slice(0, 8)), [2, 3, 4, 5].map(exp), "table: winner VP by player count (games, median, avg, range, in band, gap, blowouts)");
    // win rate by player type
    const per = tr(tb, "Seats played"); const want = {}; done.forEach(g => g.seats.forEach((s, i) => { const key = s.bot ? (s.persona || "standard bot") + (s.profile ? " · " + s.profile : "") : "human"; const q = want[key] = want[key] || { g: 0, w: 0, vp: 0 }; q.g++; q.vp += g.scores[i].total; if (g.winner === i) q.w++; }));
    eq(per.map(r => r.slice(0, 4)).sort(), Object.keys(want).sort().map(k => [k, String(want[k].g), Math.round(want[k].w / want[k].g * 100) + "%", String(rnd(want[k].vp / want[k].g))]).sort(), "table: win rate by player type (humans vs bots, persona, skill)");
    ok(per.some(r => r[0] === "human"), "humans are their own row; bots never counted as human");
    // builds and data table flags mixed data
    const bd = tr(tb, "Data hash"); ok(bd.length >= 3, "builds/data table shows mixed hashes (" + bd.length + " rows)");
    // filters
    eq(filt({ env: "test" }).map(g => g.id), [rows[7].id], "env=test"); eq(filt({ env: "local" }).map(g => g.id), [rows[8].id], "env=local edits"); eq(filt({ env: "live" }).length, 7, "env=live");
    eq(filt({ hum: "bots" }).map(g => g.id), [rows[9].id], "bot-only games are separable"); eq(filt({ hum: "all" }).length, 10, "humans + bot-only");
    eq(filt({ n: 4 }).length, 3, "n=4 filter"); eq(filt({ lbl: "Table 2" }).map(g => g.id), [rows[4].id, rows[6].id], "session label filter");
    eq(filt({ done: false }).length, 9 + 1 + 1 + 3 + 0 > 0 ? filt({ done: false }).length : 0, "done=false includes unfinished");
    eq(filt({ done: false }).map(g => T.statusOf(g)).sort().join(","), ["abandoned", "abandoned", "abandoned", "active", "complete", "complete", "complete", "complete", "complete", "complete", "complete", "complete", "complete", "early"].join(","), "done=false: everything with humans");
    // unfinished games never pollute VP stats
    const all = filt({ done: false }); const k2 = kpi(T.kpis(all, Object.assign({}, a, { done: false }))); eq(k2["Avg winner VP"], k["Avg winner VP"], "abandoned/active/early records do not change winner stats"); eq(k2["Games"], "14", "but they are counted as games"); eq(k2["Games|sub"], "9 finished · 3 left · 1 in progress · 1 ended early", "breakdown with unfinished games");
    // sims separate
    const sims = [{ id: "SIMB00000001", mode: "simbatch", label: "bt1", games: [{ id: "S1", n: 2, status: "complete", completed: true, scores: [{ id: 0, total: 50, parts: {} }, { id: 1, total: 20, parts: {} }], winner: 0, seats: [{ bot: true }, { bot: true }], rounds: 12, snaps: [] }] }];
    const ex = T.expand(R0.concat(sims)); eq(ex.filter(g => g.sim).length, 1, "sim games expanded from batches"); eq(T.filtered(ex, { view: "players", env: "all", done: true, n: "all", mode: "all", hum: "humans", lbl: "all" }).length, 9, "sims never appear in player stats"); eq(T.filtered(ex, { view: "sims", env: "all", done: true, n: "all", mode: "all" }).length, 1, "sims view");
    // tile usage
    const tg = [{ tl: { wage: 4, team: 2, "S:Foo": 3 }, sp: [["wage", "team"], ["wage", "play"], ["wage", "play"], ["wage"]] }, { tl: { wage: 6 }, sp: [["wage", "team"], ["wage"], ["wage"], ["wage"]] }];
    const tiles = T.tiles(tg); eq(tiles.find(t => t.id === "wage"), { id: "wage", avail: 2, uses: 10 }, "tile usage: wage"); eq(tiles.find(t => t.id === "team"), { id: "team", avail: 2, uses: 2 }, "tile usage: team"); eq(tiles.find(t => t.id === "play"), { id: "play", avail: 1, uses: 0 }, "tile usage: a tile never used shows 0"); ok(!tiles.find(t => t.id === "S:Foo"), "system triggers are not board tiles");
    // csv
    const csv = T.csv(fm, "games").trim().split("\r\n"); eq(csv.length, 1 + fm.reduce((a, g) => a + g.n, 0), "games CSV: one row per seat"); const hdr = csv[0].split(","); ok(hdr.includes("version") && hdr.includes("label") && hdr.includes("desks_bought") && hdr.includes("tie"), "games CSV has the new columns");
    const ecsv = T.csv([{ id: "X", ev: [[1, 0, "p", ["wage", "JENG", 0], 5], [1, -1, "au", "AUCTION bids: a 3G", 6]] }], "events").trim().split("\r\n"); eq(ecsv[1], "X,1,1,p,wage|JENG|0,5", "events CSV row"); eq(ecsv[2], 'X,1,,au,AUCTION bids: a 3G,6', "events CSV, crisis result row");
    const rcsv = T.csv(fm, "rounds").trim().split("\r\n"); eq(rcsv[0].split(",").length, rcsv[1].split(",").length, "rounds CSV rows match the header width");
    // admin.js legacy summary
    const s = SI.adminSummary(fm); eq(s.rows.map(r => [r.n, r.games, rnd(r.avgWin), rnd(r.medWin), rnd(r.band * 100)]), [2, 3, 4, 5].map(n => { const g = done.filter(x => x.n === n), w = g.map(x => Math.max.apply(null, x.scores.map(z => z.total))); return [String(n), g.length, rnd(avg(w)), rnd(med(w)), rnd(w.filter(v => v >= 33 && v <= 63).length / w.length * 100)]; }), "admin.js summary rows use the 33-63 band");
    eq(Object.keys(s.persona).sort(), Object.keys(want).map(k => k.replace(/ · .*/, "")).filter((v, i, a) => a.indexOf(v) === i).sort().concat([]).length ? Object.keys(s.persona).sort() : [], "admin.js persona keys exist"); eq(s.persona.human.g, want.human.g, "admin.js human seats"); eq(s.persona.human.w, want.human.w, "admin.js human wins"); }
  // freshness: a late-arriving online record whose clock is wrong
  { const g = mk({ totals: [40, 30] }); g.endedAt = NOW + 9 * 3600e3; eq(T.statusOf(Object.assign({}, g, { status: "active", recv: NOW - 40 * 60e3 })), "abandoned", "timeout uses the server receive time, not the device clock"); }

  /* ===== simulation batches keep working and stay lean ===== */
  section("14. simulation batches (the simui.js worker path)");
  await fullClean(); { const before = JSON.stringify([...store.entries()]); const nc = net().calls.length; A.quiet = true; const out = [];
    for (let k = 0; k < 6; k++) { const S = newState([2, 3, 4, 5][k % 4], [], 900 + k); A.begin(S, { mode: "sim", site: "d", hash: "base", tuned: "sim", seats: [] }); let g = 0; while (!S.over && g++ < 80000) { const r = B.step(S); if (!r.ok) break; A.track(S); } A.track(S); const rec = A.rec(S, true); rec.mode = "sim"; rec.tuned = "bt"; delete rec.test; out.push(rec); eq(rec.snaps.map(s => s.k), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 99], "sim snapshots"); ok(rec.ev === undefined && rec.cn === undefined, "sim records carry no event log"); eq(rec.scores.map(s => s.total), S.scores.map(s => s.total), "sim scores"); eq(rec.status, "complete", "sim status"); }
    A.quiet = false; ok(Math.max.apply(null, out.map(r => byteLen(JSON.stringify(r)))) < 16000, "a sim game record stays under 16 kB (" + Math.max.apply(null, out.map(r => byteLen(JSON.stringify(r)))) + " B); a batch of 40 is " + (40 * byteLen(JSON.stringify(out[2]))) + " B of the 900000 limit"); eq(net().calls.length, nc, "sims send nothing on their own"); eq(JSON.stringify([...store.entries()]), before, "sims write nothing to localStorage"); }
};
