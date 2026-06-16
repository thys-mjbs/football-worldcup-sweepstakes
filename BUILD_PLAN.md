# FIFA 2026 Sweepstakes — Build Plan

**Repo:** `football-worldcup-sweepstakes` (already created, public)
**GitHub Pages URL:** `https://thys-mjbs.github.io/football-worldcup-sweepstakes`
**Stack:** Vanilla HTML / CSS / JS (static) + Google Apps Script (backend) + Google Sheets (state/admin)
**Rule:** Only mark `[x]` when the user has confirmed that step is tested and working. Never mark done based on code being written alone.

---

## Phase 0 — Manual Setup (no code yet)

- [x] **0.1** In browser: go to your repo on GitHub → Settings → Pages → Source: Deploy from branch → Branch: `main`, Folder: `/ (root)` → Save. GitHub Pages will go live at `https://thys-mjbs.github.io/football-worldcup-sweepstakes`.
- [x] **0.2** In browser: create a new Google Sheet. Name it exactly: `FIFA 2026 Sweepstakes Admin`. (Use your MJB Strategic Google account.)
- [x] **0.3** In the sheet: rename the default tab from `Sheet1` to `Config`. Add three more tabs named exactly: `Participants`, `TeamPool`, `AdminLog`. Tab order must be: Config | Participants | TeamPool | AdminLog.
- [x] **0.4** In the Config tab: add exactly these two columns in row 1 — cell A1: `key`, cell B1: `value`. Then add these rows:
  - A2: `target_email` | B2: `thysja@gmail.com` *(test address — change before going live)*
  - A3: `app_title` | B3: `MJB FIFA 2026 Sweepstakes`
  - A4: `welcome_message` | B4: `Select your name from the dropdown below, then spin to reveal your two teams.`
- [x] **0.5** In the Participants tab: add these column headers in row 1 — `Name | Claimed | ClaimedAt | Team1 | Team2`
- [x] **0.6** In the TeamPool tab: add these column headers in row 1 — `PairID | StrongTeam | WeakTeam | Assigned | AssignedTo | AssignedAt`
- [x] **0.7** In the AdminLog tab: add these column headers in row 1 — `Timestamp | Name | Team1 | Team2 | Action`
- [x] **0.8** In the sheet: Extensions → Apps Script. This opens the Apps Script editor. Name the project exactly: `FIFA2026SweepstakesBackend`. Delete any default code in the editor.

---

## Phase 1 — Apps Script: `Code.gs`

All of this is done in the Apps Script editor (browser).

- [x] **1.1** Constants block: `ADMIN_KEY` (hardcoded secret string for adminReset), `SHEET_URL` (placeholder — you paste the real sheet URL here after the sheet is created), `STRONG_TEAMS` array (24 teams), `WEAK_TEAMS` array (24 teams).
- [x] **1.2** `doGet(e)` router — reads `e.parameter.action` and dispatches to the correct handler.
- [x] **1.3** `getState()` handler — reads Participants sheet (all names + claimed status) and TeamPool sheet (count of unassigned pairs). Returns JSON with participant list and remaining pair count.
- [x] **1.4** `getNextPair()` handler — finds the first row in TeamPool where Assigned is blank, returns `{pairId, strongTeam, weakTeam}` as JSON. Does NOT mark it assigned yet — that happens on claim.
- [x] **1.5** `doPost(e)` router — reads `action` from POST body, dispatches to correct handler.
- [x] **1.6** `claim(data)` handler — receives `{name, team1, team2, pairId}`. Validates name is unclaimed and pairId is unassigned. On success: writes to Participants, marks TeamPool row as assigned, appends to AdminLog, calls `sendEmail()`. Returns `{success: true}` or `{success: false, error: "..."}`.
- [x] **1.7** `adminReset(data)` handler — receives `{adminKey, targetName}`. Validates adminKey. If `targetName === "ALL"` clears all Participants and TeamPool assigned fields and wipes AdminLog. If a specific name, resets that row only and unassigns their TeamPool pair. Returns status JSON.
- [x] **1.8** `sendEmail(name, team1, team2, timestamp)` helper — reads `target_email` from Config sheet row 2 column B. Sends via `MailApp.sendEmail()` with subject `FIFA Sweepstakes — [Name] has spun their teams` and the agreed body format (name, teams, timestamp, sheet URL).
- [x] **1.9** `seedTeamPool()` function — builds 60 pairs: two full shuffled copies of all 24 strong/weak pairs (48 pairs total) plus one random draw of 12 strong and 12 weak teams (12 more pairs). Shuffles all 60 pairs. Writes them to TeamPool sheet starting at row 2 with sequential PairIDs. **This function runs ONCE manually from the editor before go-live. Never again.**

---

## Phase 2 — Apps Script: Deploy

- [x] **2.1** In Apps Script editor: click Deploy → New deployment → Type: Web app → Description: `v1` → Execute as: `Me` → Who has access: `Anyone` → Deploy. Copy the web app URL. You will paste this into `app.js` in step 4.3.
- [x] **2.2** Copy the Google Sheet URL from the browser address bar. Paste it into the `SHEET_URL` constant in `Code.gs` and save (Ctrl+S). Re-deploy as a new version (Deploy → Manage deployments → Edit → create new version → Deploy).

---

## Phase 3 — Frontend: `apps-script/Code.gs` file in repo

- [x] **3.1** Create folder `apps-script/` in the repo root. Add the final `Code.gs` content there as a reference copy. (This is not deployed from here — it's just version-controlled. The live version lives in the Apps Script editor.)

---

## Phase 4 — Frontend: `index.html`

- [x] **4.1** HTML boilerplate: `<!DOCTYPE html>`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, charset UTF-8, link to `style.css`, script tag for `app.js`.
- [x] **4.2** Screen 1 — Landing: app title (`<h1>`), welcome message (`<p>`), `<select>` dropdown for participant names (populated by JS), `<button id="spin-btn">` — initially disabled until name is selected.
- [x] **4.3** Screen 2 — Confirmation modal: overlay div, card with `<p>You selected <strong id="selected-name"></strong>. Are you sure this is you? This cannot be undone.</p>`, two buttons: `<button id="confirm-btn">Yes, that's me</button>` and `<button id="goback-btn">Go Back</button>`.
- [x] **4.4** Screen 3 — Spin screen: two spinner columns side by side (div.spinner-col each containing div.reel), single `<button id="do-spin-btn">Spin!</button>`. Each reel shows a scrolling list of team names as animation.
- [x] **4.5** Screen 4 — Result screen: two team-card divs each showing the flag emoji large, team name, label ("Your Strong Pick" / "Your Wild Card"). Below: `<p>Good luck with the sweepstakes! Your teams have been recorded.</p>`. No further controls.
- [x] **4.6** Loading state: a simple `<div id="loading">` overlay shown during API calls.
- [x] **4.7** Error state: a `<div id="error-msg">` for inline error messages (name already claimed, network failure, etc.).

---

## Phase 5 — Frontend: `style.css`

- [x] **5.1** CSS reset (`* { box-sizing: border-box; margin: 0; padding: 0; }`), base font, body background.
- [x] **5.2** Mobile-first layout: single column, max-width 480px centred, padding 16px. Min tap target size 48px on all interactive elements.
- [x] **5.3** Screen 1 styles: dropdown full-width, styled `<select>`, primary button style.
- [x] **5.4** Confirmation modal: fixed full-screen overlay (semi-transparent dark), centred white card, two buttons side by side.
- [x] **5.5** Spin screen: two spinner columns equal width, side by side (`display: flex`), each with a fixed-height viewport window and overflow hidden. Reel element inside animates vertically with CSS `@keyframes`.
- [x] **5.6** Result screen: two team cards side by side, large flag emoji (`font-size: 4rem`), team name below, label below that. 
- [x] **5.7** Disabled / grayed-out state for already-claimed names in the dropdown (if `REMOVE_CLAIMED_NAMES = false`).
- [x] **5.8** Responsive breakpoint at `min-width: 600px` to scale up layout slightly for tablets/desktop without breaking anything.

---

## Phase 6 — Frontend: `app.js`

- [x] **6.1** Constants block at top of file:
  ```js
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz19-L4XRtXoTyF6SbvSG0iRxzD28it3kNmBkCZlDCZjzx_jZhhywihaHvhQxVuOuBg/exec"; // live
  const REMOVE_CLAIMED_NAMES = true;
  const SPIN_DURATION_MS = 4000;
  ```
- [x] **6.2** `PARTICIPANTS` array — all 60 names from `names.txt` hardcoded exactly as provided.
- [x] **6.3** `TEAM_FLAGS` object — maps every team name (string) to its Unicode flag emoji. All 48 teams covered.
- [x] **6.4** `fetchState()` — calls `SCRIPT_URL + "?action=getState"`, populates the `<select>` dropdown. Removes claimed names if `REMOVE_CLAIMED_NAMES = true`, otherwise marks them `disabled`. Handles loading state and errors.
- [x] **6.5** Name selection handler — listens for `<select>` change, enables the spin button, stores selected name.
- [x] **6.6** Spin button click handler — shows confirmation modal with selected name.
- [x] **6.7** Confirmation modal logic — "Go Back" hides modal and re-enables dropdown. "Yes, that's me" calls `fetchNextPair()` then transitions to spin screen.
- [x] **6.8** `fetchNextPair()` — calls `SCRIPT_URL + "?action=getNextPair"`, stores `{pairId, team1, team2}` in memory (not shown to user yet).
- [x] **6.9** Spin animation — builds a reel list of shuffled team names for both spinners, triggers 4000ms CSS animation on both simultaneously. After 4000ms, stops both reels on the actual assigned team.
- [x] **6.10** `submitClaim()` — called after animation ends. POSTs `{name, team1, team2, pairId}` to Apps Script. On success: transitions to result screen. On failure: shows error message and allows user to retry.
- [x] **6.11** Result screen display — shows `TEAM_FLAGS[team1]` + team1 name and `TEAM_FLAGS[team2]` + team2 name.
- [x] **6.12** `sessionStorage` guard — on page load, if `sessionStorage.getItem('hasSpun')` is set, skip straight to a "You have already spun" message screen. Set this flag immediately on successful claim submit, before waiting for API response.
- [x] **6.13** Error handling — network errors, "name already claimed" response, "no pairs remaining" response all show user-friendly messages.

---

## Phase 7 — Integration & Testing

- [ ] **7.1** Push all files (`index.html`, `style.css`, `app.js`, `apps-script/Code.gs`) to `main` branch. Verify GitHub Pages serves the site.
- [ ] **7.2** Replace `YOUR_APPS_SCRIPT_URL_HERE` in `app.js` with the real deployed Apps Script URL. Push.
- [x] **7.3** From Apps Script editor: run `seedTeamPool()` manually. Confirm 60 rows appear in the TeamPool sheet.
- [ ] **7.4** Test `getState` — open `[SCRIPT_URL]?action=getState` in browser. Confirm valid JSON with 60 names and 60 remaining pairs.
- [ ] **7.5** Test `getNextPair` — open `[SCRIPT_URL]?action=getNextPair` in browser. Confirm valid JSON with a pair.
- [ ] **7.6** Full end-to-end test (desktop): select a name → confirm → spin → reveal → check that `thysja@gmail.com` received the email → check that Participants and AdminLog sheets updated correctly.
- [ ] **7.7** Full end-to-end test (mobile): repeat 7.6 on a phone or at 390px browser width. Check layout, tap targets, spinner animation.
- [ ] **7.8** Test `adminReset` for a single name: verify the participant is unclaimed in the sheet and the pair is unassigned.
- [ ] **7.9** Test `sessionStorage` guard: after spinning, reload the page — confirm "already spun" message appears.
- [ ] **7.10** Test name-already-claimed error: attempt to claim a name that was just used — confirm error message shows.

---

## Phase 8 — Go-Live

- [ ] **8.0** Share the Google Sheet with the administrator: open the sheet → click **Share** (top right) → enter their Google account email → set permission to **Editor** → Send.
- [ ] **8.1** In Config sheet: change `target_email` value from `thysja@gmail.com` to the production email address. No code change needed.
- [ ] **8.2** Do one final test spin (use an unclaimed name) to confirm email arrives at the production address.
- [ ] **8.3** Confirm all 60 names appear correctly in the dropdown on the live URL.
- [ ] **8.4** Share link with participants: `https://thys-mjbs.github.io/football-worldcup-sweepstakes`

---

## Reference Data

### Strong Teams (24)
Argentina, Brazil, France, Spain, England, Germany, Portugal, Netherlands, Belgium, Croatia, Uruguay, Morocco, Colombia, Switzerland, Mexico, United States, Japan, South Korea, Senegal, Norway, Sweden, Austria, Türkiye, Côte d'Ivoire

### Weak / Underdog Teams (24)
Jordan, Uzbekistan, Curaçao, Haiti, New Zealand, Cabo Verde, Panama, Qatar, Saudi Arabia, South Africa, Ghana, Tunisia, Algeria, Egypt, Congo DR, Bosnia and Herzegovina, Australia, Paraguay, Ecuador, Canada, Iran, Scotland, Czechia, Iraq

### Participants (60)
Danae, Liza, Mandy, Cherne, Elrentia, Thobeka, Nhlanhla, Thandekile, Martene, Claire, Sithembile, Yasmeen, Carina, Macdonald, Monare, Akleema, Samantha, Mamasita, Yogita, Miyelani, Constance, Mpho, Mpumzi, Gugu, Gail, Itumeleng, Thomas, Blandina, Refilwe, Robert, Shadrack, Nadia, Tamzin, Prescious, Kenneth, Landiwe, Veli, Ntombizodwa, Victor, Michael, Tshilisanani, Yerisha, Hajra, Lusanda, Dedre, Ellenor, Humayra, Zanele, Marcelle, Prof Sanyika, Dr Cantrell, Dr Omar, Dr Singh, Dr Brachmayer, Dr Daya, Dr Poyiadji, Dr Oren, Dr Terreblanche, Dane, Marizanne

### Team Pool Math
- 24 pairs × 2 full sets = 48 pairs
- 12 random extra pairs (12 strong + 12 weak, sampled from the 24 each with replacement) = 12 pairs
- **Total: 60 pairs → exactly 1 pair per participant**

### Naming Conventions
| Thing | Exact name |
|---|---|
| GitHub repo | `football-worldcup-sweepstakes` |
| GitHub Pages URL | `https://thys-mjbs.github.io/football-worldcup-sweepstakes` |
| Google Sheet | `FIFA 2026 Sweepstakes Admin` |
| Sheet tabs | `Config`, `Participants`, `TeamPool`, `AdminLog` |
| Apps Script project | `FIFA2026SweepstakesBackend` |
| Apps Script file | `Code.gs` |
| HTML file | `index.html` |
| CSS file | `style.css` |
| JS file | `app.js` |
| Repo subfolder for script | `apps-script/` |
