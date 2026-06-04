// ============================================================
// FIFA 2026 Sweepstakes — Google Apps Script Backend
// Project: FIFA2026SweepstakesBackend
// ============================================================

// --- CONFIGURATION — update SHEET_URL before first deploy ---
var SHEET_URL = "https://docs.google.com/spreadsheets/d/14GDJ_PExypWCbei0xAsmiIGNTVw1MdrzM-bdYlpi1mA/";
var ADMIN_KEY = "sweepstakes-admin-2026"; // change this to something only you know

// --- TEAM DATA ---
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
    } else if (action === "getNextPair") {
      result = getNextPair();
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
// Returns all participant names with claimed status + remaining pair count
// ============================================================

function getState() {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var partSheet = ss.getSheetByName("Participants");
  var poolSheet = ss.getSheetByName("TeamPool");

  var partData = partSheet.getDataRange().getValues();
  var participants = [];

  // Row 0 is header — skip it
  for (var i = 1; i < partData.length; i++) {
    var row = partData[i];
    if (row[0]) {
      participants.push({
        name: row[0],
        claimed: row[1] === true || row[1] === "TRUE" || row[1] === true
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
// GET: getNextPair
// Returns the next unassigned pair without marking it assigned
// ============================================================

function getNextPair() {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var poolSheet = ss.getSheetByName("TeamPool");
  var poolData = poolSheet.getDataRange().getValues();

  for (var i = 1; i < poolData.length; i++) {
    var row = poolData[i];
    if (!row[3]) {
      return {
        success: true,
        pairId: row[0],
        strongTeam: row[1],
        weakTeam: row[2]
      };
    }
  }

  return { success: false, error: "No pairs remaining." };
}

// ============================================================
// POST: claim
// Validates and records a participant's team assignment
// ============================================================

function claim(data) {
  var name = data.name;
  var team1 = data.team1;
  var team2 = data.team2;
  var pairId = data.pairId;

  if (!name || !team1 || !team2 || !pairId) {
    return { success: false, error: "Missing required fields." };
  }

  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var partSheet = ss.getSheetByName("Participants");
  var poolSheet = ss.getSheetByName("TeamPool");
  var logSheet = ss.getSheetByName("AdminLog");

  var partData = partSheet.getDataRange().getValues();
  var participantRow = -1;

  for (var i = 1; i < partData.length; i++) {
    if (partData[i][0] === name) {
      if (partData[i][1] === true || partData[i][1] === "TRUE") {
        return { success: false, error: name + " has already claimed their teams." };
      }
      participantRow = i + 1; // 1-indexed sheet row
      break;
    }
  }

  if (participantRow === -1) {
    return { success: false, error: "Participant '" + name + "' not found." };
  }

  // Verify pair is still unassigned
  var poolData = poolSheet.getDataRange().getValues();
  var poolRow = -1;
  for (var j = 1; j < poolData.length; j++) {
    if (String(poolData[j][0]) === String(pairId)) {
      if (poolData[j][3]) {
        return { success: false, error: "This pair was just taken by someone else. Please refresh and try again." };
      }
      poolRow = j + 1;
      break;
    }
  }

  if (poolRow === -1) {
    return { success: false, error: "Pair ID not found." };
  }

  var timestamp = new Date().toISOString();

  // Mark participant as claimed
  partSheet.getRange(participantRow, 2).setValue(true);
  partSheet.getRange(participantRow, 3).setValue(timestamp);
  partSheet.getRange(participantRow, 4).setValue(team1);
  partSheet.getRange(participantRow, 5).setValue(team2);

  // Mark pair as assigned
  poolSheet.getRange(poolRow, 4).setValue(true);
  poolSheet.getRange(poolRow, 5).setValue(name);
  poolSheet.getRange(poolRow, 6).setValue(timestamp);

  // Log it
  logSheet.appendRow([timestamp, name, team1, team2, "claimed"]);

  // Send email
  try {
    sendEmail(name, team1, team2, timestamp);
  } catch (emailErr) {
    // Don't fail the claim if email fails — log it and continue
    logSheet.appendRow([timestamp, name, team1, team2, "email_failed: " + emailErr.message]);
  }

  return { success: true, name: name, team1: team1, team2: team2 };
}

// ============================================================
// POST: adminReset
// Resets one participant or all (requires adminKey)
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
    // Clear all claimed flags and team assignments in Participants (keep names)
    var partData = partSheet.getDataRange().getValues();
    for (var i = 1; i < partData.length; i++) {
      if (partData[i][0]) {
        partSheet.getRange(i + 1, 2, 1, 4).clearContent();
      }
    }

    // Clear all assigned flags in TeamPool (keep pairs)
    var poolData = poolSheet.getDataRange().getValues();
    for (var j = 1; j < poolData.length; j++) {
      if (poolData[j][0]) {
        poolSheet.getRange(j + 1, 4, 1, 3).clearContent();
      }
    }

    // Clear AdminLog (keep header)
    var lastRow = logSheet.getLastRow();
    if (lastRow > 1) {
      logSheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    }

    logSheet.appendRow([new Date().toISOString(), "SYSTEM", "", "", "full_reset"]);
    return { success: true, message: "Full reset complete." };
  }

  // Reset a single participant
  var partData = partSheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < partData.length; i++) {
    if (partData[i][0] === targetName) {
      var team1 = partData[i][3];
      var team2 = partData[i][4];
      partSheet.getRange(i + 1, 2, 1, 4).clearContent();

      // Find and unassign their pool pair
      var poolData = poolSheet.getDataRange().getValues();
      for (var j = 1; j < poolData.length; j++) {
        if (poolData[j][4] === targetName) {
          poolSheet.getRange(j + 1, 4, 1, 3).clearContent();
          break;
        }
      }

      logSheet.appendRow([new Date().toISOString(), targetName, team1, team2, "reset_by_admin"]);
      found = true;
      break;
    }
  }

  if (!found) {
    return { success: false, error: "Participant '" + targetName + "' not found." };
  }

  return { success: true, message: targetName + " has been reset." };
}

// ============================================================
// EMAIL HELPER
// ============================================================

function sendEmail(name, team1, team2, timestamp) {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var configSheet = ss.getSheetByName("Config");
  var targetEmail = configSheet.getRange(2, 2).getValue();

  var subject = "FIFA Sweepstakes — " + name + " has spun their teams";

  var body = "Hi,\n\n"
    + name + " has completed their draw in the FIFA 2026 Sweepstakes.\n\n"
    + "Their teams are:\n"
    + "  - " + team1 + " (Strong Pick)\n"
    + "  - " + team2 + " (Wild Card)\n\n"
    + "Recorded at: " + timestamp + "\n\n"
    + "Review all selections in the admin sheet:\n"
    + SHEET_URL + "\n\n"
    + "Good luck to everyone!";

  MailApp.sendEmail(targetEmail, subject, body);
}

// ============================================================
// SEED FUNCTION — run once manually before go-live, never again
// ============================================================

function seedTeamPool() {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var poolSheet = ss.getSheetByName("TeamPool");

  // Safety check — don't re-seed if data already exists
  if (poolSheet.getLastRow() > 1) {
    throw new Error("TeamPool already has data. Clear rows 2 onwards manually before re-seeding.");
  }

  // Build 2 full sets of 24 pairs = 48 pairs
  var pairs = [];
  for (var set = 0; set < 2; set++) {
    for (var i = 0; i < STRONG_TEAMS.length; i++) {
      pairs.push([STRONG_TEAMS[i], WEAK_TEAMS[i]]);
    }
  }

  // Add 12 random extra pairs (sample with replacement from each array)
  for (var k = 0; k < 12; k++) {
    var si = Math.floor(Math.random() * STRONG_TEAMS.length);
    var wi = Math.floor(Math.random() * WEAK_TEAMS.length);
    pairs.push([STRONG_TEAMS[si], WEAK_TEAMS[wi]]);
  }

  // Shuffle all 60 pairs (Fisher-Yates)
  for (var n = pairs.length - 1; n > 0; n--) {
    var r = Math.floor(Math.random() * (n + 1));
    var temp = pairs[n];
    pairs[n] = pairs[r];
    pairs[r] = temp;
  }

  // Write to sheet — PairID, StrongTeam, WeakTeam, Assigned, AssignedTo, AssignedAt
  var rows = [];
  for (var p = 0; p < pairs.length; p++) {
    rows.push([p + 1, pairs[p][0], pairs[p][1], "", "", ""]);
  }

  poolSheet.getRange(2, 1, rows.length, 6).setValues(rows);

  Logger.log("Seeded " + rows.length + " pairs into TeamPool.");
}

// ============================================================
// PARTICIPANT SEED — run once to populate Participants sheet
// ============================================================

function seedParticipants() {
  var ss = SpreadsheetApp.openByUrl(SHEET_URL);
  var partSheet = ss.getSheetByName("Participants");

  if (partSheet.getLastRow() > 1) {
    throw new Error("Participants sheet already has data. Clear rows 2 onwards before re-seeding.");
  }

  var names = [
    "Danae", "Liza", "Mandy", "Cherne", "Elrentia",
    "Thobeka", "Nhlanhla", "Thandekile", "Martene", "Claire",
    "Sithembile", "Yasmeen", "Carina", "Macdonald", "Monare",
    "Akleema", "Samantha", "Mamasita", "Yogita", "Miyelani",
    "Constance", "Mpho", "Mpumzi", "Gugu", "Gail",
    "Itumeleng", "Thomas", "Blandina", "Refilwe", "Robert",
    "Shadrack", "Nadia", "Tamzin", "Prescious", "Kenneth",
    "Landiwe", "Veli", "Ntombizodwa", "Victor", "Michael",
    "Tshilisanani", "Yerisha", "Hajra", "Lusanda", "Dedre",
    "Ellenor", "Humayra", "Zanele", "Marcelle", "Prof Sanyika",
    "Dr Cantrell", "Dr Omar", "Dr Singh", "Dr Brachmayer", "Dr Daya",
    "Dr Poyiadji", "Dr Oren", "Dr Terreblanche", "Dane", "Marizanne"
  ];

  var rows = names.map(function(n) { return [n, "", "", "", ""]; });
  partSheet.getRange(2, 1, rows.length, 5).setValues(rows);

  Logger.log("Seeded " + rows.length + " participants.");
}
