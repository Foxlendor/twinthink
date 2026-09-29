# Running the Drop prototype

A separate, local prototype. It has no dependencies, no build step, no server
state and no network calls. It is not the production app in `apps/web` and is
not deployed anywhere.

## Requirements

- Node.js 20 or newer (verified with v22.22.2 on Linux).
- For the browser checks only: Playwright with Chromium.

## Run it

```bash
cd prototype
npm start
```

Open http://127.0.0.1:4173/ in a browser. (`PORT=5000 npm start` picks another port.)
Opening `index.html` directly from disk does not work: ES modules and the page's
security policy need it served over http.

**On a phone (unverified):** `HOST=0.0.0.0 npm start` listens on your network
(verified to start and serve); then open `http://<your computer's LAN address>:4173/`
on a phone on the same Wi-Fi. This has not yet been tried on a real phone. Your
firewall may need to allow the port. On Windows PowerShell set variables with
`$env:HOST="0.0.0.0"; npm start`.

## Test it

```bash
cd prototype
npm test        # 18 unit tests: motion model, relationships -> paths, local storage
npm run e2e     # 14 browser checks in Chromium; writes screenshots to evidence/
```

`npm run e2e` looks for Playwright in this order: `$PLAYWRIGHT_MODULE`, a local
`playwright` package, then the global install used in the cloud sandbox
(`/opt/node22/lib/node_modules/playwright`). On another machine:

```bash
cd prototype
npm install --no-save playwright
npx playwright install chromium
npm run e2e
```

(`CHROMIUM_PATH=/path/to/chromium` uses a specific browser.) The last two lines
are standard Playwright setup but were not run here: the sandbox already had them.

Touch in `npm run e2e` is Chromium's emulated touch (real touch events sent through
the DevTools protocol at phone size), not a physical phone.

## Reset

The prototype stores everything in the browser's localStorage under
`twinthink.prototype.v1`. Clear it from the `?` sheet ("Clear everything this
prototype stored") or with your browser's site-data controls.
