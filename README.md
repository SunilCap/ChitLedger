# 🪙 Chit Ledger

A configurable bidding simulator for rotating chit funds, with a live bid preview and a loan-vs-chit cost comparison. Installable as a Progressive Web App (PWA) and works offline.

**Version:** v1.2

## Features

- Multiple chit funds, each with its own members, config, and month-by-month ledger
- Cascading multi-winner months, deferred balances, or top-up collection for shortfalls
- Live bid preview with +/− stepper: entitlement, paid now, deferred, implied annualized rate, comparison with a bank rate
- Loan comparison tab: practically vs. technically pending months (minimum-bid simulation)
- Adjustable text size, light/dark mode, color-coded members
- Installable, offline-capable (service worker)

## Project structure

```
├── index.html            # the entire app (HTML + CSS + JS in one file)
├── manifest.json         # PWA manifest
├── service-worker.js     # offline caching
├── icons/                # app icons (PNG + SVG) and make_icons.py to regenerate them
├── .nojekyll             # tells GitHub Pages not to run Jekyll
└── .github/workflows/pages.yml   # auto-deploy to GitHub Pages
```

## Deploy on GitHub Pages

1. Create a new GitHub repository and push these files to the `main` branch.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push (or run the workflow manually from the **Actions** tab). Your app will be live at
   `https://<your-username>.github.io/<repo-name>/`.

Any other static host works too (Netlify, Vercel, Cloudflare Pages) — just serve the folder as-is. It must be served over **HTTPS** for the service worker and install prompt to work.

## Run locally

Service workers don't run from `file://`, so use a local server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Installing on a phone

- **Android (Chrome):** open the site → menu → **Install app** (or accept the install banner).
- **iPhone (Safari):** Share → **Add to Home Screen**.

## Showing ads (Google AdSense)

`ads.js` is already wired into `index.html` and does nothing until you fill in
two values from your AdSense account:

1. Open `ads.js`, find `initWebAdSense()`.
2. Set `ADSENSE_CLIENT_ID` to your publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`).
3. Create a **responsive Display ad unit** in your AdSense dashboard (Ads → By
   ad unit → Display ads → New ad unit) and set `ADSENSE_SLOT_ID` to the slot
   ID it gives you.
4. Commit, push, and give GitHub Pages a minute to redeploy.

This renders a **fixed bar pinned to the bottom of the screen** (not Google's
automatic "Anchor ads" placement) — you control exactly where it sits. The
page's bottom padding grows to match the bar's real rendered height
automatically, so it won't cover the footer or any buttons.

Notes:
- Ads only actually render once Google has **approved your site** in AdSense
  review — this can take anywhere from a day to a few weeks, and single-page
  tool/utility sites sometimes get flagged for "low value content" on first
  review. If that happens, adding more substantive content (an About page,
  a usage guide) and reapplying usually resolves it.
- An ad blocker, or testing with `file://` instead of a real `https://` URL,
  will silently show nothing — check the browser console for warnings from
  `ads.js` if an ad isn't appearing.
- This same `ads.js` also powers the AdMob banner in the separate
  `chit-ledger-android` native app project — it auto-detects which context
  it's running in, so you only maintain one file for both.

## Shipping updates

The service worker caches the app so it opens offline. When you change any file, **bump `CACHE_VERSION` in `service-worker.js`** (and `APP_VERSION` in `index.html`) before deploying — otherwise returning users may keep seeing the old cached version. Users get the new version the next time they open the app after it's deployed.

## Data storage

Everything is saved in the browser's `localStorage` on each device (chit funds under `chitLedgerFunds_v1`, text size under `chitLedgerFontScale_v1`). That means:

- Data persists across sessions and works offline.
- Data is **per device and per browser** — it doesn't sync between phones, and clearing browser data erases it.

The version of this app hosted on claude.ai had live multi-user sync via a platform-specific database. That isn't available on GitHub Pages; the code detects this automatically and falls back to local-only storage. To add real multi-device sync here, you'd connect a backend such as Firebase Firestore or Supabase (replace the `saveState` / `subscribeSharedFunds` functions in `index.html`).

## Regenerating icons

```bash
cd icons
python3 make_icons.py   # requires Pillow
```

## Disclaimer

All figures are illustrative — a working model of the bidding rules, not financial advice.
