# Site is OFFLINE

The public site was taken offline on 2026-09-21. Nothing was deleted.

## How it is offline

| Layer | State |
|---|---|
| GitHub Pages | Publishes only `index.html` (offline notice, HTTP 200) and `404.html` (same notice, HTTP 404 for every other URL). |
| Source | Moved (with `git mv`, history intact) to `_archive/`. Also listed in `_config.yml` `exclude`, so Pages never serves it. |
| Search engines | Both pages carry `noindex, nofollow, noarchive`. No sitemap/robots.txt/canonical/OG/structured data ever existed. |
| Apps Script backend | `SITE_OFFLINE = true` in `_archive/apps-script/Code.gs` (only effective once redeployed) and/or the web-app deployment archived in the Apps Script UI. |
| Google Sheet | Untouched. |

The last online commit is tagged `last-online-2026-09-21`.

## Bring it back online

1. **Restore the files** (from the repo root):
   ```
   git rm index.html 404.html _config.yml
   git mv _archive/index.html _archive/app.js _archive/style.css _archive/DGMC_Logo.png _archive/favicon.svg _archive/BUILD_PLAN.md .
   git mv _archive/apps-script apps-script
   ```
   (Equivalent: `git checkout last-online-2026-09-21 -- index.html app.js style.css DGMC_Logo.png favicon.svg BUILD_PLAN.md apps-script`, then `git rm -r _archive 404.html _config.yml`.)
2. **Backend:** in `apps-script/Code.gs` set `SITE_OFFLINE = false`, paste it into the Apps Script editor, then *Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy*. If the deployment was archived instead, create a new deployment (Web app, Execute as: Me, Access: Anyone) and put the new `/exec` URL in `SCRIPT_URL` at the top of `app.js`.
3. **Commit and push to `main`.** Pages rebuilds in about a minute (Settings > Pages: source `main` `/`, unchanged).
4. **Search engines:** if you filed removal requests in Google Search Console, cancel them or wait for them to expire (about 6 months), then request indexing of the homepage.
5. **Security first:** change `ADMIN_KEY` in `Code.gs` before going live; the current value has been public.
