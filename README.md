# SHIP IT!
Board game prototype (vanilla JS) plus its Cloudflare Worker host.
- `game/` source for all environments (A at `/`, B at `/b/`, C at `/c/`; B and C are flag variants built by `scripts/build.js`)
- `worker/` Cloudflare Worker (routing, auth, rooms, analytics log)
- Push to `main` runs tests, builds, writes KV bundles and deploys the Worker.
- Secrets in GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Game passwords stay as Worker secrets only.
