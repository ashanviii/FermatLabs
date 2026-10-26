# Pushing this code to GitHub from another machine

This folder is the full Fermat MVP: group-trip planner, redesigned UI, global support (any home country and currency, passport-based visas, worldwide cities), vote breakdown, plugin features, free city-pack pipeline and legal pages. For where things stand and the known gaps, read **[HANDOVER.md](HANDOVER.md)**.

The folder has **no git history** (it came from a zip). The steps below move it to another machine and push it, without losing your existing repo history.

## 0. Get the folder out of this machine as a zip

**Option A: use the ready-made zip.** `FermatLabs-mvp.zip` sits next to this project folder in the dev container. In VS Code's Explorer, right-click it and choose **Download…**. It already leaves out everything that must not be committed.

**Option B: make the zip yourself** (for example after more changes). Don't zip the folder by hand: you'd drag along `node_modules` (1.2 GB) and build output. From this folder (`FermatLabs-master`):

```bash
python3 -I tools/make_release_zip.py . ../FermatLabs-mvp.zip
```

The script skips `node_modules`, `.next`, `.next-dev`, caches, `.git`, logs, `.env` files and any service-account key. If you use another zip tool, exclude exactly those.

### What's in the zip, and what isn't

Included: all source code, docs, `tools/`, `HANDOVER.md` and this file.

Left out on purpose (and kept out by `.gitignore`):

| Not included | Why |
|---|---|
| `node_modules/` | 1.2 GB. Recreate it with `npm install` |
| `.next/`, `.next-dev/` | Build output |
| `tools/places/cache/` | ~20 MB of downloaded API responses. The city-pack script recreates it |
| `.env*`, `*service-account*.json`, `fermat-sa.json` | Secrets. **Never commit the Firebase service-account key** |
| `*-debug.log` | Firebase emulator logs |

## 1. Before you start (on the other machine)

- Git and Node.js 20 or newer installed (`git --version`, `node --version`).
- Signed in to GitHub on that machine (GitHub Desktop, `gh auth login`, or an SSH key).
- The repo URL. Your existing repo is probably `https://github.com/ashanviii/FermatLabs`; use whichever repo has the original code.
- Unzip `FermatLabs-mvp.zip` somewhere, e.g. `~/Downloads/FermatLabs-master`.

## 2. Push into your existing repo (recommended)

This keeps your old commits and puts the new work on its own branch, so you can review it as a pull request before merging.

```bash
# 1. Fresh copy of the repo
git clone https://github.com/ashanviii/FermatLabs.git
cd FermatLabs

# 2. A branch for this work
git checkout -b mvp-revamp

# 3. Make the repo match the unzipped folder exactly (keeps .git; deletes files the new version removed, like the old chatbot pages)
#    macOS / Linux:
rsync -av --delete --exclude .git ~/Downloads/FermatLabs-master/ ./
#    Windows (PowerShell):
#    robocopy C:\Users\<you>\Downloads\FermatLabs-master . /MIR /XD .git

# 4. Check nothing secret or huge is about to be committed
git status --short | head -50
git status --porcelain | grep -Ei "node_modules|\.next|\.env$|\.env\.|service-account|fermat-sa|places/cache" && echo "STOP: remove these first" || echo "OK: nothing sensitive"

# 5. Commit and push
git add -A
git commit -m "Fermat MVP: redesigned UI, global trips (home country, currency, passports, scope), vote breakdown, multi-city routes, 33 destinations, pledges, settle-up, share cards, private preferences, tasks, legal pages"
git push -u origin mvp-revamp
```

Then open the pull request on GitHub (it offers a **Compare & pull request** button), look through the changes, and merge into `master`.

> Run `--delete` / `/MIR` only from a **fresh clone**, as above. They make the repo match the zip, so anything only in the repo is removed. That's what you want here, because the old template files (chatbot, sidebar, GitHub Pages workflow) were deliberately deleted. `.git` is excluded, so your history is safe.

## 3. Or push to a brand-new repo

Create an empty repo on GitHub (no README, no .gitignore), then:

```bash
cd ~/Downloads/FermatLabs-master
git init -b main
git add -A
git status --porcelain | grep -Ei "node_modules|\.next|\.env$|\.env\.|service-account|fermat-sa|places/cache" && echo "STOP" || echo "OK"
git commit -m "Fermat MVP"
git remote add origin https://github.com/<your-username>/<new-repo>.git
git push -u origin main
```

## 4. Check it runs (optional, before or after pushing)

```bash
cd chatgpt-ai-template-main
npm install                # .npmrc already sets legacy-peer-deps
npm run test:group-trip    # expect 117 passing
npm run build
npm run dev                # http://localhost:3000
```

With no secrets set, `/`, `/design` and the preview states (`/plan?preview=locked`, `/plan?preview=usLocked`, …) still work, because they use sample data. To make real trips locally, create `chatgpt-ai-template-main/.env.local` (git-ignored):

```bash
FIREBASE_PROJECT_ID=fermat-9e38d
# The whole service-account JSON on one line, or GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json instead
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

The Firebase web config (`NEXT_PUBLIC_FIREBASE_*`) already defaults to the `fermat-9e38d` project. You won't need the `NODE_USE_ENV_PROXY=1` flag outside the corporate container.

## 5. Deploy to Vercel (free) after pushing

1. Go to https://vercel.com/new, import the GitHub repo, and set **Root Directory** to `chatgpt-ai-template-main`.
2. Under **Environment Variables**, add `FIREBASE_PROJECT_ID` = `fermat-9e38d` and `FIREBASE_SERVICE_ACCOUNT_JSON` = the full contents of the key file.
3. Deploy, then add the Vercel domain (e.g. `fermat-xyz.vercel.app`) at https://console.firebase.google.com/project/fermat-9e38d/authentication/settings under **Authorized domains**. Without it, Google sign-in fails.
4. Before sharing widely, see HANDOVER.md §6 "Must fix before real users": polling cost and the demo-travellers button.

## Handy map of the code

| Where | What |
|---|---|
| `HANDOVER.md` | Status, how it works, known gaps, next steps |
| `chatgpt-ai-template-main/src/lib/collaborativeTrip.js` | Trip engine: voting, lock and vote breakdown, budgets, plans, per-viewer privacy projections |
| `chatgpt-ai-template-main/src/lib/features/` | Plugin features: pledges, settle-up, share cards, private preferences, tasks |
| `chatgpt-ai-template-main/src/lib/groupTripSeeds.v1.json` | 33 destinations and routes, activities, Indian fare table (illustrative estimates) |
| `chatgpt-ai-template-main/src/lib/geo/` | Dated free-data snapshots (fx, countries, departure cities, visa rules, holidays) and helpers; each file records source and license |
| `chatgpt-ai-template-main/src/components/ui/` + `DESIGN.md` | Design system; live showcase at `/design` |
| `chatgpt-ai-template-main/src/components/group-trip/` | Planner screens; `/plan?preview=signin\|create\|collecting\|ready\|voting\|voted\|locked\|lockedMember\|usReady\|usVoting\|usLocked\|usLockedMember` |
| `chatgpt-ai-template-main/src/lib/legal.ts` | Contact email and governing law used by `/privacy` and `/terms` |
| `tools/` | Seed-data and preview-fixture scripts, screenshot helper, live smoke tests (`feature_smoke.mjs`, `us_smoke.mjs`), `make_release_zip.py` |
| `tools/geo_*.mjs` | Regenerate the `src/lib/geo/` snapshots (add `NODE_USE_ENV_PROXY=1` behind a proxy) |
| `tools/places/` + `docs/places-pipeline.md` | Free city-pack generator (Wikivoyage, Wikidata, pageviews, World Bank); `tools/import_city_packs.py` adds packs to the seeds |
