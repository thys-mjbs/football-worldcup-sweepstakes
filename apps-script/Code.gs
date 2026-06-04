// ============================================================
// FIFA 2026 Sweepstakes — Google Apps Script Backend
// Project: FIFA2026SweepstakesBackend
// ============================================================

var SHEET_URL = "https://docs.google.com/spreadsheets/d/14GDJ_PExypWCbei0xAsmiIGNTVw1MdrzM-bdYlpi1mA/";
var ADMIN_KEY = "sweepstakes-admin-2026";

var STRONG_TEAMS = [
  "Argentina", "Brazil", "France", "Spain", "England",
  "Germany", "Portugal", "Netherlands", "Belgium", "Croatia",
  "Uruguay", "Morocco", "Colombia", "Switzerland", "Mexico",
  "United States", "Japan", "South Korea", "Senegal", "Norway",
  "Sweden", "Austria", "Türkiye", "Côte d'Ivoire"
];

var WEAK_TEAMS = [
  "Jordan", "Uzbekistan", "Curaçao", "Haiti", "New Zealand",
  "Cabo Verde", "Panama", "Qatar", "Saudi Arabia", "South Africa",
  "Ghana", "Tunisia", "Algeria", "Egypt", "Congo DR",
  "Bosnia and Herzegovina", "Australia", "Paraguay", "Ecuador", "Canada",
  "Iran", "Scotland", "Czechia", "Cameroon"
];

// ============================================================
// ROUTING
// ============================================================

function doGet(e) {
  var action = e.parameter.action;
  var result;
  try {
    if (action === "getState") {
      result = getState();
    } else {
      result = { success: false, error: "Unknown action: " + action };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data;
  var result;
  try {
    data = JSON.parse(e.postData.contents);
    var action = data.action;
    if (action === "claim") {
      result = claim(data);
    } else if (action === "adminReset") {
      result = adminReset(data);
    } else {
      result = { success: false, error: "Unknown action: " + action };
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// GET: getState
// Returns all participants with claimed status, teams, and remaining pair count
// ============================================================

function getState() {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var partSheet = ss.getSheetByName("Participants");
  var poolSheet = ss.getSheetByName("TeamPool");

  var partData = partSheet.getDataRange().getValues();
  var participants = [];
  for (var i = 1; i < partData.length; i++) {
    var row = partData[i];
    if (row[0]) {
      var isClaimed = row[1] === true || row[1] === "TRUE";
      participants.push({
        name: row[0],
        claimed: isClaimed,
        team1: isClaimed ? (row[3] || "") : "",
        team2: isClaimed ? (row[4] || "") : ""
      });
    }
  }

  var poolData = poolSheet.getDataRange().getValues();
  var remaining = 0;
  for (var j = 1; j < poolData.length; j++) {
    if (!poolData[j][3]) remaining++;
  }

  return { success: true, participants: participants, remainingPairs: remaining };
}

// ============================================================
// POST: claim
// Finds next unassigned pair and records it
// ============================================================

function claim(data) {
  var name = data.name;
  if (!name) return { success: false, error: "Missing name." };

  try {
    var ss = SpreadsheetApp.openByUrl(SHEET_URL);
    var partSheet = ss.getSheetByName("Participants");
    var poolSheet = ss.getSheetByName("TeamPool");
    var logSheet = ss.getSheetByName("AdminLog");

    // Find participant row
    var partData = partSheet.getDataRange().getValues();
    var participantRow = -1;
    for (var i = 1; i < partData.length; i++) {
      if (partData[i][0] === name) {
        if (partData[i][1] === true || partData[i][1] === "TRUE") {
          return { success: false, error: name + " has already claimed their teams." };
        }
        participantRow = i + 1;
        break;
      }
    }
    if (participantRow === -1) {
      return { success: false, error: "Participant '" + name + "' not found." };
    }

    // Find next unassigned pair
    var poolData = poolSheet.getDataRange().getValues();
    var poolRow = -1;
    var pairId, team1, team2;
    for (var j = 1; j < poolData.length; j++) {
      if (!poolData[j][3]) {
        poolRow = j + 1;
        pairId = poolData[j][0];
        team1 = poolData[j][1];
        team2 = poolData[j][2];
        break;
      }
    }
    if (poolRow === -1) {
      return { success: false, error: "No pairs remaining — the sweepstakes is full!" };
    }

    var timestamp = new Date().toISOString();

    // Mark participant claimed
    partSheet.getRange(participantRow, 2).setValue(true);
    partSheet.getRange(participantRow, 3).setValue(timestamp);
    partSheet.getRange(participantRow, 4).setValue(team1);
    partSheet.getRange(participantRow, 5).setValue(team2);

    // Mark pair assigned
    poolSheet.getRange(poolRow, 4).setValue(true);
    poolSheet.getRange(poolRow, 5).setValue(name);
    poolSheet.getRange(poolRow, 6).setValue(timestamp);

    // Log
    logSheet.appendRow([timestamp, name, team1, team2, "claimed"]);

    // Email (non-fatal if it fails)
    try {
      sendEmail(name, team1, team2, timestamp);
    } catch (emailErr) {
      logSheet.appendRow([timestamp, name, team1, team2, "email_failed: " + emailErr.message]);
    }

    return { success: true, name: name, team1: team1, team2: team2 };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================================
// POST: adminReset
// ============================================================

function adminReset(data) {
  if (data.adminKey !== ADMIN_KEY) {
    return { success: false, error: "Invalid admin key." };
  }

  var targetName = data.targetName;
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var partSheet = ss.getSheetByName("Participants");
  var poolSheet = ss.getSheetByName("TeamPool");
  var logSheet = ss.getSheetByName("AdminLog");

  if (targetName === "ALL") {
    var partData = partSheet.getDataRange().getValues();
    for (var i = 1; i < partData.length; i++) {
      if (partData[i][0]) partSheet.getRange(i + 1, 2, 1, 4).clearContent();
    }
    var poolData = poolSheet.getDataRange().getValues();
    for (var j = 1; j < poolData.length; j++) {
      if (poolData[j][0]) poolSheet.getRange(j + 1, 4, 1, 3).clearContent();
    }
    var lastRow = logSheet.getLastRow();
    if (lastRow > 1) logSheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    logSheet.appendRow([new Date().toISOString(), "SYSTEM", "", "", "full_reset"]);
    return { success: true, message: "Full reset complete." };
  }

  var partData = partSheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < partData.length; i++) {
    if (partData[i][0] === targetName) {
      var t1 = partData[i][3];
      var t2 = partData[i][4];
      partSheet.getRange(i + 1, 2, 1, 4).clearContent();
      var poolData = poolSheet.getDataRange().getValues();
      for (var j = 1; j < poolData.length; j++) {
        if (poolData[j][4] === targetName) {
          poolSheet.getRange(j + 1, 4, 1, 3).clearContent();
          break;
        }
      }
      logSheet.appendRow([new Date().toISOString(), targetName, t1, t2, "reset_by_admin"]);
      found = true;
      break;
    }
  }

  if (!found) return { success: false, error: "Participant '" + targetName + "' not found." };
  return { success: true, message: targetName + " has been reset." };
}

// ============================================================
// EMAIL HELPER
// ============================================================

function sendEmail(name, team1, team2, timestamp) {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var configSheet = ss.getSheetByName("Config");
  var targetEmail = configSheet.getRange(2, 2).getValue();

  if (!targetEmail || targetEmail.toString().trim().toUpperCase() === "N/A") return;

  var subject = "DGMC World Cup Team Draw — " + name + " has drawn their teams";
  var body = "Hi,\n\n"
    + name + " has completed their draw in the DGMC Radiology World Cup Team Draw.\n\n"
    + "Their teams are:\n"
    + "  - " + team1 + " (Main Team)\n"
    + "  - " + team2 + " (Wild Card)\n\n"
    + "Recorded at: " + timestamp + "\n\n"
    + "Review all selections in the admin sheet:\n"
    + SHEET_URL + "\n\n"
    + "Good luck to everyone!";

  MailApp.sendEmail(targetEmail, subject, body);
}

// ============================================================
// SEED — run once manually, never again
// ============================================================

function seedTeamPool() {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var poolSheet = ss.getSheetByName("TeamPool");
  if (poolSheet.getLastRow() > 1) {
    throw new Error("TeamPool already has data. Clear rows 2 onwards before re-seeding.");
  }

  // Fixed pairs — exactly 60, shuffled at seed time
  var pairs = [
    ["England",       "Algeria"],
    ["Morocco",       "Algeria"],
    ["Portugal",      "Australia"],
    ["Senegal",       "Australia"],
    ["Spain",         "Australia"],
    ["England",       "Bosnia and Herzegovina"],
    ["Senegal",       "Bosnia and Herzegovina"],
    ["Brazil",        "Cabo Verde"],
    ["Côte d'Ivoire", "Cabo Verde"],
    ["Croatia",       "Cameroon"],
    ["Morocco",       "Cameroon"],
    ["Spain",         "Cameroon"],
    ["Austria",       "Canada"],
    ["Norway",        "Canada"],
    ["South Korea",   "Congo DR"],
    ["Switzerland",   "Congo DR"],
    ["Argentina",     "Curaçao"],
    ["Japan",         "Curaçao"],
    ["France",        "Czechia"],
    ["Netherlands",   "Czechia"],
    ["France",        "Ecuador"],
    ["South Korea",   "Ecuador"],
    ["Belgium",       "Egypt"],
    ["Côte d'Ivoire", "Egypt"],
    ["Norway",        "Ghana"],
    ["Senegal",       "Ghana"],
    ["Argentina",     "Haiti"],
    ["Sweden",        "Haiti"],
    ["Brazil",        "Iran"],
    ["France",        "Iran"],
    ["Portugal",      "Iran"],
    ["Austria",       "Jordan"],
    ["Germany",       "Jordan"],
    ["Brazil",        "New Zealand"],
    ["Mexico",        "New Zealand"],
    ["United States", "New Zealand"],
    ["Colombia",      "Panama"],
    ["Japan",         "Panama"],
    ["Colombia",      "Paraguay"],
    ["Croatia",       "Paraguay"],
    ["Germany",       "Qatar"],
    ["Germany",       "Qatar"],
    ["Türkiye",       "Qatar"],
    ["Netherlands",   "Saudi Arabia"],
    ["Sweden",        "Saudi Arabia"],
    ["Uruguay",       "Saudi Arabia"],
    ["Argentina",     "Scotland"],
    ["Türkiye",       "Scotland"],
    ["England",       "Scotland"],
    ["Belgium",       "South Africa"],
    ["Morocco",       "South Africa"],
    ["Uruguay",       "South Africa"],
    ["Spain",         "Tunisia"],
    ["Switzerland",   "Tunisia"],
    ["United States", "Tunisia"],
    ["Belgium",       "Uzbekistan"],
    ["Mexico",        "Uzbekistan"],
    ["Portugal",      "Uzbekistan"],
    ["Uruguay",       "Algeria"],
    ["Türkiye",       "Paraguay"],
    ["Côte d'Ivoire", "Bosnia and Herzegovina"],
    ["Mexico",        "Congo DR"]
  ];

  pairs = shuffleArray(pairs);

  var rows = [];
  for (var p = 0; p < pairs.length; p++) {
    rows.push([p + 1, pairs[p][0], pairs[p][1], "", "", ""]);
  }
  poolSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  Logger.log("Seeded " + rows.length + " pairs.");
}

function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function seedParticipants() {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var partSheet = ss.getSheetByName("Participants");
  if (partSheet.getLastRow() > 1) {
    throw new Error("Participants sheet already has data. Clear rows 2 onwards before re-seeding.");
  }

  var names = [
    "Akleema", "Blandina", "Dr. Brachmayer", "Dr. Cantrell",
    "Carina", "Cherne", "Claire", "Constance", "Danae", "Dr. Daya",
    "Dedre", "Ellenor", "Elrentia", "Dr. Gabuza", "Gail", "Gugu",
    "Dr. Haagensen", "Hajra", "Humayra", "Itumeleng", "Kenneth",
    "Landiwe", "Liza", "Lusanda", "Macdonald", "Mamasita", "Mandy",
    "Marcelle", "Marizanne", "Martene", "Michael", "Miyelani",
    "Monare", "Mpho", "Mpumzi", "Nadia", "Nhlanhla", "Ntombizodwa",
    "Dr. Omar", "Dr. Oren", "Dr. Poyiadji", "Prescious", "Prof Sanyika",
    "Dr. Rampini", "Refilwe", "Robert", "Samantha", "Shadrack",
    "Dr. Singh", "Sithembile", "Tamzin", "Dr. Terreblanche",
    "Thandekile", "Thobeka", "Thomas", "Tshilisanani", "Veli",
    "Victor", "Yasmeen", "Yerisha", "Yogita", "Zanele"
  ];

  var rows = names.map(function (n) { return [n, "", "", "", ""]; });
  partSheet.getRange(2, 1, rows.length, 5).setValues(rows);
  Logger.log("Seeded " + rows.length + " participants.");
}
