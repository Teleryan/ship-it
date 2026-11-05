/* ============================================================
   SHIP IT!: MASTER PANEL (master account only; the server refuses to send this file to anyone else)
   Analytics across every game and account, tuning publish (test / live), reset of all online games.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const esc = SI.esc;
const M = () => SI.U.master;
const med = a => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const f1 = x => (Math.round(x * 10) / 10).toString();
const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "–";

async function jget(url) { const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw new Error(r.status); return r.json(); }
async function jsend(url, method, body) { const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); const o = await r.json().catch(() => ({})); if (!r.ok) throw new Error(o.error || r.status); return o; }
async function loadAll(ctx) {
  const m = M(); m.loading = true; ctx.render();
  try { const g = await jget("/__games"); m.games = g.games || []; try { m.sims = (await jget("/__games?kind=sims")).games || []; } catch (e2) { m.sims = []; } } catch (e) { m.games = m.games || []; m.msg = "Could not load games: " + e.message; }
  const site = SI.net.site();
  try { m.cfg = { live: await jget("/__config?env=live&site=" + site), test: await jget("/__config?env=test&site=" + site) }; } catch (e) {}
  try { m.rooms = (await jget("/__rooms")).rooms; } catch (e) {}
  m.loading = false; ctx.render();
}
SI.adminOpen = function (ctx) { ctx.U.master = ctx.U.master || { tab: "analytics", f: { env: "all", mode: "all", tuned: "all" } }; if (ctx.U.hosted) loadAll(ctx); else { M().games = []; M().msg = "Not connected to the server: analytics and publishing are available on the hosted game only."; } };

/* ---------- aggregation ---------- */
function filtered() {
  const m = M(), f = m.f; return (m.games || []).filter(g => (f.env === "all" || g.env === f.env) && (f.mode === "all" || g.mode === f.mode) && (f.tuned === "all" || g.tuned === f.tuned));
}
function gap(g) { const t = (g.scores || []).map(s => s.total).sort((a, b) => b - a); return t.length > 1 ? t[0] - t[1] : null; }
function summary(gs) {
  const done = gs.filter(g => g.completed && g.scores);
  const byN = {}; done.forEach(g => { (byN[g.n] = byN[g.n] || []).push(g); });
  const rows = Object.keys(byN).sort().map(n => {
    const a = byN[n], win = a.map(g => Math.max.apply(null, g.scores.map(s => s.total))), gp = a.map(gap).filter(x => x != null);
    return { n, games: a.length, avgWin: avg(win), medWin: med(win), band: win.filter(v => v >= 100 && v <= 140).length / a.length, gap: med(gp), minWin: Math.min.apply(null, win), maxWin: Math.max.apply(null, win), rounds: avg(a.map(g => g.rounds)), mins: avg(a.map(g => (g.endedAt - g.startedAt) / 60000)) };
  });
  // win rate by persona (bots), by seat position, by turn order slot
  const persona = {}, order = {};
  done.forEach(g => g.seats.forEach((s, i) => {
    const key = s.bot ? (s.persona || "standard bot") : "human"; const p = persona[key] = persona[key] || { g: 0, w: 0, vp: 0 }; p.g++; p.vp += g.scores[i].total; if (g.winner === i) p.w++;
    const o = order[s.order + 1 + "/" + g.n] = order[s.order + 1 + "/" + g.n] || { g: 0, w: 0 }; o.g++; if (g.winner === i) o.w++;
  }));
  // points by source: average per player, and for winners
  const src = {}, srcW = {}; let np = 0, nw = 0;
  done.forEach(g => g.scores.forEach(s => { np++; const isW = g.winner === s.id; if (isW) nw++; Object.keys(s.parts || {}).forEach(k => { if (typeof s.parts[k] === "number" && !/Pct$|^threshold$|^total$/.test(k)) { src[k] = (src[k] || 0) + s.parts[k]; if (isW) srcW[k] = (srcW[k] || 0) + s.parts[k]; } }); }));
  // gates
  const gates = {}; gs.forEach(g => (g.gates || []).forEach(x => { const q = gates[x.name] = gates[x.name] || { pass: 0, fail: 0 }; q.pass += x.passed.length; q.fail += x.failed.length; }));
  // per round averages (all players)
  const rounds = {}; gs.forEach(g => (g.snaps || []).forEach(s => { if (s.k === 99) return; const r = rounds[s.r] = rounds[s.r] || { n: 0, g: 0, pr: 0, hy: 0, db: 0, cu: 0, w: 0, sy: 0, sr: 0, bd: 0 }; s.p.forEach(p => { r.n++; r.sr += p.sr || 0; r.bd += p.bd || 0; r.g += p.g; r.pr += p.pr; r.hy += p.hy + p.mk; r.db += p.db; r.cu += p.cu; r.w += p.w; r.sy += p.sy; }); }));
  const accts = new Set(); gs.forEach(g => g.seats.forEach(s => { if (s.acct) accts.add(s.acct); }));
  return { done, rows, persona, order, src, srcW, np, nw, gates, rounds, accts: accts.size };
}
const opts = (vals, cur) => vals.map(v => `<option ${v === cur ? "selected" : ""}>${esc(v)}</option>`).join("");
function table(head, rows) { return `<table class="scoretbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`; }

function renderAnalytics() {
  const m = M(), all = m.games || [], gs = filtered(), S = summary(gs);
  const envs = ["all"].concat(Array.from(new Set(all.map(g => g.env)))), tunes = ["all"].concat(Array.from(new Set(all.map(g => g.tuned)))), modes = ["all", "hotseat", "online"];
  let h = `<div class="row wrap" style="gap:8px;margin-bottom:10px"><label class="mute">Environment</label><select data-mf="env">${opts(envs, m.f.env)}</select><label class="mute">Mode</label><select data-mf="mode">${opts(modes, m.f.mode)}</select><label class="mute">Tuning</label><select data-mf="tuned">${opts(tunes, m.f.tuned)}</select><button class="btn sm" data-act="m-refresh">Refresh</button><span class="mute">${gs.length} of ${all.length} games · ${S.done.length} finished · ${S.accts} online accounts</span></div>`;
  if (!gs.length) return h + `<p class="mute">No games recorded yet. Every game played on the hosted site sends a record when it ends (or when someone leaves after round 2).</p>`;
  h += `<h3>Winning score by player count <span class="mute" style="text-transform:none;letter-spacing:0">(goal: 100–140)</span></h3>` + table(["Players", "Games", "Median winner VP", "Average", "Low – high", "In 100–140", "Median 1st–2nd gap", "Avg minutes"],
    S.rows.map(r => [r.n, r.games, f1(r.medWin), f1(r.avgWin), `${f1(r.minWin)} – ${f1(r.maxWin)}`, Math.round(r.band * 100) + "%", f1(r.gap), f1(r.mins)]));
  h += `<h3>Who wins</h3>` + table(["Player type", "Seats played", "Win rate", "Average VP"], Object.keys(S.persona).sort().map(k => { const p = S.persona[k]; return [esc(k), p.g, pct(p.w, p.g), f1(p.vp / p.g)]; }));
  h += `<div class="mute" style="margin:6px 0">Turn order slot (slot/players): ` + Object.keys(S.order).sort().map(k => `<b>${k}</b> ${pct(S.order[k].w, S.order[k].g)} (${S.order[k].g})`).join(" · ") + `</div>`;
  const keys = Object.keys(S.src).sort((a, b) => S.src[b] - S.src[a]);
  h += `<h3>Where points come from <span class="mute" style="text-transform:none;letter-spacing:0">(average per player; winners)</span></h3>` + table(["Source", "All players", "Winners"], keys.map(k => [esc(k), f1(S.src[k] / S.np), S.nw ? f1((S.srcW[k] || 0) / S.nw) : "–"]));
  h += `<h3>Publisher gates</h3>` + table(["Gate", "Passed", "Missed", "Pass rate"], Object.keys(S.gates).map(k => [esc(k), S.gates[k].pass, S.gates[k].fail, pct(S.gates[k].pass, S.gates[k].pass + S.gates[k].fail)]));
  h += `<h3>Average studio by round</h3>` + table(["Round", "Gold", "Progress", "Hype + Marketing", "Debt", "Culture", "Workers", "Systems"], Object.keys(S.rounds).sort((a, b) => a - b).map(r => { const x = S.rounds[r], n = x.n || 1; return [r, f1(x.g / n), f1(x.pr / n), f1(x.hy / n), f1(x.db / n), f1(x.cu / n), f1(x.w / n), f1(x.sy / n)]; }));
  const resN = {}; S.done.forEach(g => (g.final || []).forEach(f => { if (!f.rs) return; const r = resN[g.n] = resN[g.n] || { n: 0, t: [0, 0, 0, 0] }; r.n++; f.rs.forEach((v, i) => { r.t[i] += v; }); }));
  if (Object.keys(resN).length) h += `<h3>Resources left at game end <span class="mute" style="text-transform:none;letter-spacing:0">(average per player; high numbers mean unspent resources)</span></h3>` + table(["Players", "Ideas", "Code", "Process", "Buzz", "Total"], Object.keys(resN).sort().map(n => { const r = resN[n], v = r.t.map(x => x / r.n); return [n, f1(v[0]), f1(v[1]), f1(v[2]), f1(v[3]), f1(v[0] + v[1] + v[2] + v[3])]; }));
  const cN = {}; S.done.forEach(g => (g.final || []).forEach(f => { if (f.rc == null) return; const r = cN[g.n] = cN[g.n] || { n: 0, sr: 0, rc: 0, cr: 0, cv: 0, bd: 0, sy: 0, w: 0 }; r.n++; r.sr += f.sr || 0; r.rc += f.rc || 0; r.cr += f.cr || 0; r.cv += f.cv || 0; r.bd += f.bd || 0; r.sy += f.sy || 0; r.w += f.w || 0; }));
  if (Object.keys(cN).length) {
    h += `<h3>Variant C economy <span class="mute" style="text-transform:none;letter-spacing:0">(average per player, games from the phase-shaped environment)</span></h3>` + table(["Players", "Workers", "Seniors", "Recruited", "Systems finished", "Unfinished at end", "Rushed builds", "Resources converted"], Object.keys(cN).sort().map(n => { const r = cN[n]; return [n, f1(r.w / r.n), f1(r.sr / r.n), f1(r.rc / r.n), f1(r.sy / r.n), f1(r.bd / r.n), f1(r.cr / r.n), f1(r.cv / r.n)]; }));
    h += `<div class="mute" style="margin:4px 0">Per round (all players): ` + Object.keys(S.rounds).sort((a, b) => a - b).map(r => { const x = S.rounds[r], n = x.n || 1; return `R${r}: ${f1(x.sr / n)} Sr, ${f1(x.bd / n)} building`; }).join(" · ") + `</div>`;
  }
  const recent = gs.slice().sort((a, b) => b.endedAt - a.endedAt).slice(0, 15);
  h += `<h3>Latest games</h3>` + table(["When", "Mode", "Env", "Players", "Winner", "VP", "Gap", "Finished"], recent.map(g => [new Date(g.endedAt).toLocaleString(), g.mode + (g.code ? " " + g.code : ""), esc(g.env), g.n + (g.humans ? " (" + g.humans + " human)" : " (bots)"), g.winner != null ? esc(g.seats[g.winner].name + (g.seats[g.winner].persona ? " · " + g.seats[g.winner].persona : "")) : "–", g.scores ? f1(Math.max.apply(null, g.scores.map(s => s.total))) : "–", gap(g) != null ? f1(gap(g)) : "–", g.completed ? "yes" : "left at round " + g.rounds]));
  h += `<div class="row wrap" style="margin-top:12px"><button class="btn sm" data-act="m-export">Download all records (JSON)</button><button class="btn sm" data-act="m-clearlog">${m.confirm === "clearlog" ? "Click again to delete ALL " + all.length + " records" : "Delete all analytics records"}</button></div>`;
  return h;
}
function renderTuning(ctx) {
  const m = M(), c = m.cfg || {}, st = ctx.U.studio, d = SI.diffOf(st), nCfg = Object.keys(d.config).length, nData = Object.keys(d.data).length;
  const line = (e) => { const r = c[e]; return r && r.version ? `v${r.version} · ${new Date(r.at).toLocaleString()}${r.note ? " · " + esc(r.note) : ""}` : "shipped defaults"; };
  const site = SI.net.site();
  return `<p class="mute">Edit values in the <b>Data Studio</b>, then publish the edits here. <b>Live</b> is what every player gets for new games. <b>Test</b> is only loaded by pages opened with <code>?env=test</code>, so you can try changes before they reach anyone. Games already running keep the values they started with.</p>
  <table class="scoretbl"><thead><tr><th>Where</th><th>Currently published</th><th></th></tr></thead><tbody>
  <tr><td><b>Live</b> (everyone)</td><td>${line("live")}</td><td><button class="btn sm" data-act="m-revert" data-v="live">Back to defaults</button></td></tr>
  <tr><td><b>Test</b> (<a href="/?env=test" target="_blank" style="color:var(--gold)">open test page</a>)</td><td>${line("test")}</td><td><button class="btn sm" data-act="m-revert" data-v="test">Back to defaults</button></td></tr></tbody></table>
  <div style="margin:14px 0;padding:12px;border:1px solid var(--line,#2b3350);border-radius:10px"><div class="mute">Your current Data Studio edits: <b>${nCfg}</b> rule values and <b>${nData}</b> card/data tables changed from the shipped defaults.</div>
  <div class="row wrap" style="margin-top:8px"><input id="m-note" placeholder="Note (what changed)" maxlength="200" style="min-width:260px" class="grow"><button class="btn" data-act="m-publish" data-v="test">Publish to test</button><button class="btn primary" data-act="m-publish" data-v="live">Publish to live</button></div></div>
  <p class="dim" style="font-size:12px">Environments A, B, C and D keep separate published tuning (this is Environment ${site === "b" ? "B" : site === "c" ? "C" : site === "d" ? "D" : "A"}). Each published version is also kept on the server.</p>`;
}
function renderGames() {
  const m = M(), n = (m.rooms || []).length;
  return `<p class="mute">Online games currently stored: <b>${n}</b>${n ? " (" + (m.rooms || []).join(", ") + ")" : ""}. Rooms disappear on their own after 3 days.</p>
  <p class="mute">Reset closes every online game, removes seats and action logs and sends everyone back to the menu. Analytics records are kept.</p>
  <button class="btn" data-act="m-reset" style="border-color:var(--bad,#c0392b)">${m.confirm === "reset" ? "Click again to reset ALL online games" : "Reset all online games"}</button>`;
}
SI.adminRender = function (ctx) {
  const m = ctx.U.master || (ctx.U.master = { tab: "analytics", f: { env: "all", mode: "all", tuned: "all" } });
  const tabs = [["analytics", "Analytics"], ["tuning", "Tuning"], ["games", "Online games"]];
  return `<h2>Master <span class="mute" style="font-size:13px;font-weight:400">· ${m.loading ? "loading…" : "signed in as the master account"}</span></h2>
  <div class="row wrap" style="margin-bottom:10px">${tabs.map(t => `<button class="btn sm ${m.tab === t[0] ? "primary" : ""}" data-act="m-tab" data-v="${t[0]}">${t[1]}</button>`).join("")}</div>
  ${m.msg ? `<p style="color:var(--gold)">${esc(m.msg)}</p>` : ""}
  <div class="scroll-y">${m.tab === "analytics" ? (SI.statsRender ? SI.statsRender(ctx) : renderAnalytics()) : m.tab === "tuning" ? renderTuning(ctx) : renderGames()}</div>`;
};
SI.adminAct = async function (act, t, ctx) {
  const m = M(), v = t.dataset.v;
  if (String(act).indexOf("m-an-") === 0 && SI.statsAct) { SI.statsAct(act, t, ctx); return; }
  if (String(act).indexOf("m-sim-") === 0 && SI.simAct) { SI.simAct(act, t, ctx); return; }
  try {
    if (act === "m-tab") { m.tab = v; m.msg = ""; m.confirm = null; ctx.render(); return; }
    if (act === "m-refresh") { m.msg = ""; loadAll(ctx); return; }
    if (act === "m-export") { const b = new Blob([JSON.stringify(m.games || [], null, 1)], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "shipit-games.json"; a.click(); return; }
    if (act === "m-clearlog") { if (m.confirm !== "clearlog") { m.confirm = "clearlog"; ctx.render(); return; } const ids = (m.games || []).concat(m.sims || []).map(g => g.id); for (let i = 0; i < ids.length; i += 400) await jsend("/__clear", "POST", { ids: ids.slice(i, i + 400) }); m.confirm = null; m.msg = "Deleted " + ids.length + " records"; loadAll(ctx); return; }
    if (act === "m-publish") {
      const d = SI.diffOf(ctx.U.studio), note = (document.getElementById("m-note") || {}).value || "";
      const r = await jsend("/__config", "PUT", { env: v, site: SI.net.site(), ovr: JSON.stringify(d), note }); m.msg = "Published to " + v + " as version " + r.version; loadAll(ctx); return;
    }
    if (act === "m-revert") { await jsend("/__config?env=" + v + "&site=" + SI.net.site(), "DELETE"); m.msg = v + " is back to the shipped defaults"; loadAll(ctx); return; }
    if (act === "m-reset") { if (m.confirm !== "reset") { m.confirm = "reset"; ctx.render(); return; } const r = await jsend("/__resetgames", "POST"); m.confirm = null; m.msg = "Reset " + r.wiped + " online games"; loadAll(ctx); return; }
  } catch (e) { m.msg = "Failed: " + e.message; ctx.render(); }
};
// analytics filter dropdowns
document.addEventListener("change", e => { const t = e.target; if (t.dataset && t.dataset.mf && SI.U && SI.U.master) { SI.U.master.f[t.dataset.mf] = t.value; SI.render(); } });
})(typeof window !== "undefined" ? window : globalThis);
