# The Last 6 Hours 2: The House

Free-roam survival horror. Survive 12 AM → 6 AM, then reach the front door.
Hide in closets, outrun the thing in the dark, stay away from every sink, toilet and tub.

```
game/     the game (Three.js, no build step) — this is what players run
server/   update server (zero dependencies, Node 18+)
app/      Android shell (Capacitor) that loads the game from your server
test/     headless logic test:  npm test
```

## Controls
Desktop: WASD, mouse, Shift run, F flashlight, E hide/leave, hold Space = hold breath.
Mobile: left thumb moves, right thumb looks, buttons for LIGHT / RUN / ACT / HOLD BREATH.

## Run locally
```
node server/server.js          # http://localhost:8080
```

## How automatic updates work
1. The APK is a thin shell. On launch it asks your server for `/version.json` and `/app.json`.
2. Server reachable → it opens the game **from the server**. Edit anything in `game/` on the server and every
   player gets it on next launch (the version hash changes automatically; the title screen also reloads itself
   if it sees a new build). A service worker caches the latest copy for offline play.
3. Server unreachable → it starts the copy bundled inside the APK.
4. Native changes (new plugins, permissions) need a new APK: raise the number, upload it (below) and players see a
   "download update" screen (`required:true` makes it mandatory). Android always asks the user to confirm an APK install.

## Deploy the server
Any Node host works (VPS, Render, Fly, Railway...). **Use HTTPS in production.**
```
ADMIN_TOKEN=pick-a-secret PORT=8080 node server/server.js
# or: docker build -t l6h2 . && docker run -p 8080:8080 -e ADMIN_TOKEN=secret -v l6h2data:/data l6h2
```
To ship a game update: copy/`git pull` the `game/` folder onto the server. That's it.

## Build the APK
**GitHub Actions (easiest, nothing to install):**
1. Push this repo to GitHub.
2. Settings → Secrets and variables → Actions → *Variables*: `SERVER_URL` = `https://your.server` (no trailing slash).
3. *Secrets* (recommended): `DEBUG_KEYSTORE_B64` (so every build is signed by the same key and installs over the old one):
   `base64 -w0 ~/.android/debug.keystore` (create one once with Android Studio or `keytool`), and
   `SERVER_ADMIN_TOKEN` = your server's `ADMIN_TOKEN` (the workflow then uploads each APK to the server automatically).
4. Run the *Build APK* workflow. Download `last6hours2-apk` from the run (or let the server host it at `/apk/last6hours2.apk`).

**Locally** (needs Node 18+, JDK 17, Android SDK):
```
cd app && npm install
SERVER_URL=https://your.server APK_VERSION=1 npm run build:apk
# -> app/android/app/build/outputs/apk/debug/app-debug.apk
```
`APK_VERSION` must increase with each APK you want players to be prompted for.
For a plain-HTTP LAN test server use `SERVER_URL=http://192.168.x.x:8080` (cleartext is enabled automatically).

## Notes
- Brightness button (bottom-right of the title screen) cycles DARK / NORMAL / BRIGHT.
- Tuning knobs are all in `game/game.js`: creature speeds in `creatureTick`, fish timing in `fishTick`, flashlight drain in `playerTick`.
- Not verified on a device from here: the headless test covers map connectivity, AI, hiding, fish and win/lose logic;
  rendering, touch feel and the APK build itself need a first run on your side.
