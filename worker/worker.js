// SHIP IT! on Cloudflare: password gate with roles (owner = master, player), online rooms (Durable Object per room),
// analytics (KV, owner-readable), owner-only tuning publish (live/test), owner reset of all online games.
// The game files live in KV (key site:a / site:b), uploaded by the master account at /__upload. This keeps the worker small and lets the owner update the game without redeploying.
const MEM = { a: null, b: null, t: { a: 0, b: 0 } };
async function siteFiles(env, site) {
  const now = Date.now();
  if (!MEM[site] || now - MEM.t[site] > 20000) { try { MEM[site] = JSON.parse((await env.UPD.get("site:" + site)) || "null") || {}; } catch { MEM[site] = {}; } MEM.t[site] = now; }
  return MEM[site];
}
const UPLOAD_PAGE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SHIP IT! upload</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#10131c;color:#e8ecf5;font:16px system-ui,sans-serif}.b{background:#171c2a;border:1px solid #2b3350;border-radius:12px;padding:28px;width:min(460px,90vw)}button{padding:10px 16px;border-radius:8px;border:0;background:#f5c542;color:#2a2100;font-weight:700;cursor:pointer;margin-top:12px}p{color:#98a3bf;font-size:14px}</style>
<div class="b"><h2>Upload game files</h2><p>Master account only. Choose the <b>shipit-site.json</b> bundle you were sent. It replaces the game files for all environments (A, B, C and D).</p>
<input type="file" id="f" accept=".json"><br><button id="go">Upload</button><p id="m"></p></div>
<script>document.getElementById("go").onclick=async()=>{const m=document.getElementById("m"),f=document.getElementById("f").files[0];if(!f){m.textContent="Choose the file first.";return}
try{const o=JSON.parse(await f.text());let out=[];for(const s of ["a","b","c","d"]){if(!o[s])continue;const r=await fetch("/__site?site="+s,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(o[s])});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||r.status);out.push("Environment "+s.toUpperCase()+": "+j.files+" files");}
m.textContent="Done. "+out.join(" · ")+". Open the game: /";}catch(e){m.textContent="Failed: "+e.message}}</script>`;
const COOKIE = "shipit_auth", MAX_AGE = 60 * 60 * 24 * 7, enc = new TextEncoder();
const OWNER_FILES = new Set(["studio.js", "studio2.js", "admin.js", "stats.js", "simui.js"]); // the master account only: Data Studio, analytics dashboard, tuning
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' wss:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
const SEC = { "content-security-policy": CSP, "strict-transport-security": "max-age=31536000; includeSubDomains", "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "no-referrer", "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()", "cross-origin-opener-policy": "same-origin", "x-robots-tag": "noindex, nofollow", "cache-control": "private, no-store" };
const secure = (res) => { if (res.status === 101) return res; const o = new Response(res.body, res); for (const k in SEC) o.headers.set(k, SEC[k]); return o; };
const json = (o, status) => secure(Response.json(o, { status: status || 200 }));
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value)))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const safeEq = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
function page(msg, status) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SHIP IT!</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#10131c;color:#e8ecf5;font:16px system-ui,sans-serif}
form{background:#171c2a;border:1px solid #2b3350;border-radius:12px;padding:28px;width:min(340px,86vw)}
h1{font-size:22px;letter-spacing:.06em;margin:0 0 6px}h1 b{color:#f5c542}p{color:#98a3bf;margin:0 0 16px;font-size:14px}
input,button{width:100%;box-sizing:border-box;padding:11px;border-radius:8px;font:inherit;border:1px solid #2b3350}
input{background:#10131c;color:#e8ecf5;margin-bottom:12px}button{background:#f5c542;color:#2a2100;font-weight:700;cursor:pointer}
.e{color:#f07a74;font-size:14px;margin-bottom:10px}</style>
<form method="post" action="/__login"><h1>SHIP <b>IT!</b></h1><p>Playtest access. Enter the password you were given.</p>${msg ? `<div class="e">${msg}</div>` : ""}
<input type="password" name="pw" autocomplete="current-password" autofocus required><button>Enter</button></form>`, { status: status || (msg ? 401 : 200), headers: { "content-type": "text/html; charset=utf-8" } });
}
const cookieOf = (req) => { const m = (req.headers.get("cookie") || "").match(new RegExp(COOKIE + "=([a-z]+)\\.(\\d+)\\.([a-f0-9]+)")); return m ? { role: m[1], exp: +m[2], sig: m[3] } : null; };
const MAX_FAILS = 5, LOCK_S = 900;
async function lockState(env, ip) { try { return JSON.parse((await env.UPD.get("rl:" + ip)) || '{"n":0}'); } catch { return { n: 0 }; } }
const TYPES = { html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", css: "text/css; charset=utf-8", json: "application/json" };
const CODE_CH = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const newCode = () => { let s = ""; const b = crypto.getRandomValues(new Uint8Array(4)); for (const x of b) s += CODE_CH[x % CODE_CH.length]; return s; };
const SITE = (x) => (x === "b" || x === "c" || x === "d") ? x : "a";
// Variant D (Burnout) is the default at "/", C (phases) is at /c/, the classic scoring version at /a/, pool scoring at /b/ (KV keys site:a to site:d)
const siteOf = (p) => (p === "/b" || p.startsWith("/b/")) ? "b" : (p === "/a" || p.startsWith("/a/")) ? "a" : (p === "/c" || p.startsWith("/c/")) ? "c" : "d";

export default {
  async fetch(request, env) {
    if (!env.PASSWORD || !env.OWNER_PASSWORD) return new Response("Set the PASSWORD and OWNER_PASSWORD secrets first.", { status: 500 });
    const secret = env.COOKIE_SECRET || env.OWNER_PASSWORD, url = new URL(request.url), ip = request.headers.get("cf-connecting-ip") || "x";

    if (url.pathname === "/__login" && request.method === "POST") {
      const st = await lockState(env, ip);
      if (st.n >= MAX_FAILS) return secure(page("Too many attempts. Try again in 15 minutes.", 429));
      const pw = String((await request.formData()).get("pw") || "").slice(0, 200), h = (x) => sign("pw:" + x, secret);
      let role = null;
      if (safeEq(await h(pw), await h(env.OWNER_PASSWORD))) role = "owner";
      else if (safeEq(await h(pw), await h(env.PASSWORD))) role = "player";
      if (!role) { await env.UPD.put("rl:" + ip, JSON.stringify({ n: st.n + 1 }), { expirationTtl: LOCK_S }); return secure(page("That password is not right.")); }
      if (st.n) await env.UPD.delete("rl:" + ip);
      const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
      const back = (url.searchParams.get("to") || "/").startsWith("/") ? "/" : "/";
      return new Response(null, { status: 302, headers: { location: back, "set-cookie": `${COOKIE}=${role}.${exp}.${await sign(`role:${role}:${exp}`, secret)}; Max-Age=${MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax` } });
    }
    if (url.pathname === "/__logout") return new Response(null, { status: 302, headers: { location: "/", "set-cookie": `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure` } });

    let role = null, exp = 0; const c = cookieOf(request);
    if (c && ["owner", "player"].includes(c.role) && c.exp > Date.now() / 1000 && safeEq(c.sig, await sign(`role:${c.role}:${c.exp}`, secret))) { role = c.role; exp = c.exp; }
    if (!role) return secure(url.pathname.startsWith("/__") ? new Response("Unauthorized", { status: 401 }) : page(""));
    const owner = role === "owner", P = url.pathname;

    if (P === "/__whoami") return json({ owner, role, exp, now: Math.floor(Date.now() / 1000) });

    // ---- tuning: the owner publishes a Data Studio edit set to "test" or "live". Everyone loads live; ?env=test loads test. ----
    if (P === "/__config" && request.method === "GET") {
      const e = url.searchParams.get("env") === "test" ? "test" : "live", s = SITE(url.searchParams.get("site"));
      return secure(new Response((await env.UPD.get(`cfg:${e}:${s}`)) || "{}", { headers: { "content-type": "application/json", "cache-control": "no-store" } }));
    }
    if (P === "/__config" && request.method === "PUT") {
      if (!owner) return json({ error: "Only the master account can publish tuning." }, 403);
      let b; try { b = await request.json(); } catch { return json({ error: "Bad request." }, 400); }
      const e = b.env === "live" ? "live" : "test", s = SITE(b.site);
      if (!b || typeof b.ovr !== "string" || b.ovr.length > 2000000) return json({ error: "Missing or too large." }, 400);
      try { JSON.parse(b.ovr); } catch { return json({ error: "Edits are not valid JSON." }, 400); }
      let prev = {}; try { prev = JSON.parse((await env.UPD.get(`cfg:${e}:${s}`)) || "{}"); } catch {}
      const rec = { version: (prev.version || 0) + 1, ovr: b.ovr, note: String(b.note || "").slice(0, 200), at: Date.now() };
      await env.UPD.put(`cfg:${e}:${s}:v${rec.version}`, JSON.stringify(rec));
      await env.UPD.put(`cfg:${e}:${s}`, JSON.stringify(rec));
      return json({ ok: true, version: rec.version });
    }
    if (P === "/__config" && request.method === "DELETE") { // revert live or test to shipped defaults
      if (!owner) return json({ error: "Owner only." }, 403);
      const e = url.searchParams.get("env") === "live" ? "live" : "test", s = SITE(url.searchParams.get("site"));
      await env.UPD.delete(`cfg:${e}:${s}`); return json({ ok: true });
    }
    // ---- analytics: any signed-in browser posts a record per game; only the owner reads them ----
    if (P === "/__log" && request.method === "POST") {
      const raw = await request.text(); if (raw.length > (owner ? 900000 : 120000)) return json({ error: "Too large." }, 413);
      let g; try { g = JSON.parse(raw); } catch { return json({ error: "Bad request." }, 400); }
      if (g && g.mode === "simbatch" && !owner) return json({ error: "Owner only." }, 403);
      if (g && g.mode !== "simbatch" && raw.length > 120000) return json({ error: "Too large." }, 413);
      if (!g || typeof g.id !== "string" || !/^[A-Za-z0-9]{6,32}$/.test(g.id)) return json({ error: "Bad id." }, 400);
      g.role = role; g.recv = Date.now();
      await env.UPD.put((g.mode === "simbatch" ? "s:" : "g:") + g.id, JSON.stringify(g), { expirationTtl: 60 * 60 * 24 * 400 });
      return json({ ok: true });
    }
    if (P === "/__games" && request.method === "GET") {
      if (!owner) return json({ error: "Owner only." }, 403);
      const keys = []; let cursor; const pre = url.searchParams.get("kind") === "sims" ? "s:" : "g:";
      for (let i = 0; i < 5; i++) { const l = await env.UPD.list({ prefix: pre, cursor, limit: 1000 }); keys.push(...l.keys.map((k) => k.name)); if (l.list_complete) break; cursor = l.cursor; }
      const games = [];
      for (let i = 0; i < keys.length && i < (pre === "s:" ? 400 : 1500); i += 50) (await Promise.all(keys.slice(i, i + 50).map((k) => env.UPD.get(k)))).forEach((v) => { try { if (v) games.push(JSON.parse(v)); } catch {} });
      return secure(new Response(JSON.stringify({ games, n: games.length }), { headers: { "content-type": "application/json", "cache-control": "no-store" } }));
    }
    if (P === "/__clear" && request.method === "POST") {
      if (!owner) return json({ error: "Owner only." }, 403);
      let b; try { b = await request.json(); } catch { return json({ error: "Bad request." }, 400); }
      const ids = Array.isArray(b && b.ids) ? b.ids.filter((x) => typeof x === "string" && /^[A-Za-z0-9]{6,32}$/.test(x)).slice(0, 500) : [];
      await Promise.all(ids.flatMap((id) => [env.UPD.delete("g:" + id), env.UPD.delete("s:" + id)]));
      return json({ ok: true, deleted: ids.length });
    }
    // ---- online rooms ----
    if (P === "/__room") {
      if (request.headers.get("upgrade") !== "websocket") return new Response("Expected websocket", { status: 426 });
      const origin = request.headers.get("origin"); if (origin && new URL(origin).host !== url.host) return secure(new Response("Forbidden", { status: 403 }));
      let code = (url.searchParams.get("code") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
      if (url.searchParams.get("create") === "1") {
        for (let i = 0; i < 8; i++) { const k = newCode(); if (!(await env.UPD.get("room:" + k))) { code = k; break; } }
        await env.UPD.put("room:" + code, String(Date.now()), { expirationTtl: 60 * 60 * 24 * 3 });
      } else if (code.length !== 4 || !(await env.UPD.get("room:" + code))) return secure(new Response("No such game", { status: 404 }));
      const req = new Request(request); req.headers.set("x-role", role); req.headers.set("x-code", code);
      return env.ROOM.get(env.ROOM.idFromName(code)).fetch(req);
    }
    if (P === "/__resetgames" && request.method === "POST") { // owner switch: wipe every online game
      if (!owner) return json({ error: "Owner only." }, 403);
      let n = 0, cursor;
      for (let i = 0; i < 5; i++) {
        const l = await env.UPD.list({ prefix: "room:", cursor, limit: 1000 });
        for (const k of l.keys) { try { await env.ROOM.get(env.ROOM.idFromName(k.name.slice(5))).fetch("https://room/wipe", { method: "POST" }); } catch {} await env.UPD.delete(k.name); n++; }
        if (l.list_complete) break; cursor = l.cursor;
      }
      return json({ ok: true, wiped: n });
    }
    if (P === "/__rooms" && request.method === "GET") {
      if (!owner) return json({ error: "Owner only." }, 403);
      const l = await env.UPD.list({ prefix: "room:", limit: 200 }); return json({ rooms: l.keys.map((k) => k.name.slice(5)) });
    }
    if (P === "/__upload" && request.method === "GET") { if (!owner) return json({ error: "Owner only." }, 403); return secure(new Response(UPLOAD_PAGE, { headers: { "content-type": "text/html; charset=utf-8" } })); }
    if (P === "/__site" && request.method === "POST") {
      if (!owner) return json({ error: "Owner only." }, 403);
      const site = SITE(url.searchParams.get("site")); const raw = await request.text(); if (raw.length > 5000000) return json({ error: "Too large." }, 413);
      let f; try { f = JSON.parse(raw); } catch { return json({ error: "Not valid JSON." }, 400); }
      const names = Object.keys(f || {}); if (!names.length || !f["index.html"] || names.some((k) => !/^[a-z0-9._-]+\.(html|js|css|json)$/i.test(k) || typeof f[k] !== "string")) return json({ error: "That is not a game bundle." }, 400);
      await env.UPD.put("site:" + site, raw); MEM[site] = null; return json({ ok: true, files: names.length });
    }
    if (P.startsWith("/__")) return json({ error: "Not found" }, 404);

    // ---- the game itself: D at /, C at /c/, A at /a/, B at /b/ ----
    if (request.method !== "GET" && request.method !== "HEAD") return secure(new Response("Method not allowed", { status: 405 }));
    const site = siteOf(P); if (P === "/a" || P === "/b" || P === "/c") return new Response(null, { status: 302, headers: { location: P + "/" } });
    if (P === "/d" || P.startsWith("/d/")) return new Response(null, { status: 302, headers: { location: "/" + P.slice(3) } });
    let rel = site !== "d" ? P.slice(3) : P.slice(1); if (!rel) rel = "index.html";
    if (OWNER_FILES.has(rel) && !owner) return secure(new Response("Master account only.", { status: 403 }));
    const body = (await siteFiles(env, site))[rel]; if (body == null) return secure(new Response("Not found", { status: 404 }));
    return secure(new Response(body, { headers: { "content-type": TYPES[rel.split(".").pop()] || "text/plain", "cache-control": "no-cache" } }));
  },
};

// ---- Durable Object: one per game room. Holds seats and the ordered action log; everyone replays the same log. ----
const MAX_LOG = 6000;
export class Room {
  constructor(ctx) {
    this.ctx = ctx; this.meta = null; this.log = [];
    ctx.blockConcurrencyWhile(async () => {
      this.meta = (await ctx.storage.get("meta")) || null;
      const n = (await ctx.storage.get("n")) || 0;
      this.log = [];
      const chunks = Math.ceil(n / 50); const keys = []; for (let i = 0; i < chunks; i++) keys.push("c" + i);
      for (let i = 0; i < keys.length; i += 120) { const m = await ctx.storage.get(keys.slice(i, i + 120)); for (const k of keys.slice(i, i + 120)) this.log.push(...(m.get(k) || [])); }
    });
  }
  async fetch(request) {
    const u = new URL(request.url);
    if (u.pathname === "/wipe") { for (const ws of this.ctx.getWebSockets()) { try { ws.send(JSON.stringify({ t: "wiped" })); ws.close(1000, "reset"); } catch {} } await this.ctx.storage.deleteAll(); this.meta = null; this.log = []; return new Response("ok"); }
    const cid = (u.searchParams.get("cid") || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 24); if (cid.length < 8) return new Response("bad id", { status: 400 });
    const code = request.headers.get("x-code"), role = request.headers.get("x-role");
    const create = u.searchParams.get("create") === "1";
    if (!this.meta) {
      if (!create) return new Response("No such game", { status: 404 });
      this.meta = { code, host: cid, status: "lobby", seats: [0, 1, 2, 3].map((i) => ({ name: "", kind: i === 0 ? "human" : "open", cid: i === 0 ? cid : null, persona: "" })), seed: 0, ovr: "", site: SITE(u.searchParams.get("site")), created: Date.now() };
      this.meta.seats[0].name = String(u.searchParams.get("name") || "Host").slice(0, 20);
      await this.ctx.storage.put("meta", this.meta);
    }
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ cid, role });
    pair[1].send(JSON.stringify({ t: "state", meta: this.meta, log: this.log, you: cid, online: this.online() }));
    this.cast({ t: "presence", online: this.online(cid) }, pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  online(extra) { const s = new Set(extra ? [extra] : []); for (const ws of this.ctx.getWebSockets()) { const a = ws.deserializeAttachment(); if (a) s.add(a.cid); } return [...s]; }
  cast(o, except) { const raw = JSON.stringify(o); for (const ws of this.ctx.getWebSockets()) if (ws !== except) { try { ws.send(raw); } catch {} } }
  async saveMeta() { await this.ctx.storage.put("meta", this.meta); this.cast({ t: "meta", meta: this.meta }); }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 120000) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    const att = ws.deserializeAttachment() || {}, cid = att.cid, M = this.meta; if (!M || !m) return;
    const err = (message) => ws.send(JSON.stringify({ t: "err", message, i: m.i }));
    const host = cid === M.host;
    if (m.t === "ping") return ws.send('{"t":"pong"}');
    if (m.t === "cfg") { // host edits the seat layout in the lobby
      if (!host || M.status !== "lobby" || !Array.isArray(m.seats) || m.seats.length < 2 || m.seats.length > 6) return err("Not allowed");
      M.seats = m.seats.map((s, i) => { const old = M.seats[i] || {}; const kind = ["human", "bot", "open"].includes(s.kind) ? s.kind : "open";
        return { name: String(s.name || "").slice(0, 20), kind, cid: kind === "human" ? (old.cid || null) : null, persona: String(s.persona || "").slice(0, 12) }; });
      if (!M.seats.some((s) => s.cid === cid)) { const f = M.seats.find((s) => s.kind === "human" && !s.cid) ; if (f) f.cid = cid; }
      return this.saveMeta();
    }
    if (m.t === "claim") {
      const s = M.seats[m.seat]; if (!s || s.kind === "bot") return err("That seat is not open");
      if (M.status !== "lobby" && s.cid && s.cid !== cid) return err("That seat is taken");
      if (s.cid && s.cid !== cid) return err("That seat is taken");
      if (s.kind === "open") s.kind = "human";
      M.seats.forEach((q) => { if (q.cid === cid && q !== s && M.status === "lobby" && !m.extra) { q.cid = null; if (q.kind === "human") q.kind = "open"; } });
      s.cid = cid; s.name = String(m.name || s.name || "Player").slice(0, 20); return this.saveMeta();
    }
    if (m.t === "leave") { const s = M.seats[m.seat]; if (s && s.cid === cid && M.status === "lobby") { s.cid = null; s.kind = "open"; s.name = ""; return this.saveMeta(); } return; }
    if (m.t === "start") {
      if (!host || M.status !== "lobby") return err("Only the host can start");
      if (M.seats.some((s) => s.kind === "open" || (s.kind === "human" && !s.cid))) return err("Every seat needs a player or a bot");
      M.status = "playing"; M.seed = (+m.seed | 0) || 1; M.ovr = String(m.ovr || "").slice(0, 90000); M.started = Date.now(); this.log = []; await this.ctx.storage.put("n", 0);
      return this.saveMeta();
    }
    if (m.t === "act") {
      if (M.status !== "playing") return err("Game is not running");
      if (m.i !== this.log.length) return ws.send(JSON.stringify({ t: "resync", log: this.log.slice(m.i < this.log.length ? m.i : 0), from: m.i < this.log.length ? m.i : 0 }));
      const seat = M.seats[m.a && m.a.p]; if (!seat) return err("Bad seat");
      if (!(seat.kind === "bot" ? host : seat.cid === cid)) return err("That is not your seat");
      if (this.log.length >= MAX_LOG || JSON.stringify(m.a).length > 3000) return err("Too large");
      const e = { a: m.a, s: m.s | 0, c: seat.kind === "bot" ? "bot" : cid }; this.log.push(e);
      const ci = Math.floor((this.log.length - 1) / 50);
      await this.ctx.storage.put({ ["c" + ci]: this.log.slice(ci * 50), n: this.log.length });
      return this.cast({ t: "act", i: this.log.length - 1, ...e });
    }
    if (m.t === "over") { if (!host || M.status !== "playing") return; M.status = "over"; return this.saveMeta(); }
    if (m.t === "rematch") { if (!host || M.status !== "over") return; M.status = "lobby"; this.log = []; await this.ctx.storage.put("n", 0); return this.saveMeta(); }
  }
  async webSocketClose(ws) { try { ws.close(); } catch {} this.cast({ t: "presence", online: this.online() }); }
  async webSocketError(ws) { this.cast({ t: "presence", online: this.online() }); }
}
