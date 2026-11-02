/* ============================================================
   SHIP IT!: ONLINE PLAY CLIENT (public)
   One Durable Object per game room keeps the seats and an ordered action log.
   Every device replays the same log through the same rules engine, so all screens agree.
   Bots run only on the host's device. Hot-seat and online seats can share a device.
   ============================================================ */
(function (root) {
"use strict";
const SI = root.SI = root.SI || {};
const N = SI.net = { ws: null, st: null, handlers: {}, base: "" };
function cid() { try { let c = root.localStorage.getItem("shipit.cid"); if (!c) { c = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => b.toString(16).padStart(2, "0")).join(""); root.localStorage.setItem("shipit.cid", c); } return c; } catch (e) { return "tmp" + Math.random().toString(16).slice(2, 14).padEnd(12, "0"); } }
N.cid = cid;
// who am I? (the server decides the role from the signed cookie; this is only used to show or hide owner tools)
N.whoami = async function () {
  try { const r = await fetch("/__whoami", { cache: "no-store" }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; }
};
N.site = () => (location.pathname === "/b" || location.pathname.indexOf("/b/") === 0) ? "b" : (location.pathname === "/a" || location.pathname.indexOf("/a/") === 0) ? "a" : "c";
N.open = function (opts, on) { // opts: {code, create, name}
  N.close(); N.on = on; N.opts = opts; N.dead = false;
  const q = new URLSearchParams({ cid: cid(), name: opts.name || "", site: N.site() }); if (opts.create) q.set("create", "1"); else q.set("code", opts.code);
  const ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/__room?" + q.toString());
  N.ws = ws; N.code = opts.code || null;
  ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } on(m); };
  ws.onopen = () => { N.up = true; on({ t: "open" }); clearInterval(N.pt); N.pt = setInterval(() => N.send({ t: "ping" }), 25000); };
  ws.onclose = () => { N.up = false; clearInterval(N.pt); if (N.ws === ws && !N.dead) { on({ t: "closed" }); } };
  ws.onerror = () => {};
};
N.send = function (o) { if (N.ws && N.ws.readyState === 1) { N.ws.send(JSON.stringify(o)); return true; } return false; };
N.close = function () { N.dead = true; clearInterval(N.pt); try { if (N.ws) N.ws.close(); } catch (e) {} N.ws = null; N.up = false; };
// reconnect with the same room (same device id keeps the same seats)
N.reopen = function () { if (N.opts && N.code) N.open({ code: N.code, name: N.opts.name }, N.on); };
SI.randCode = () => "";
})(typeof window !== "undefined" ? window : globalThis);
