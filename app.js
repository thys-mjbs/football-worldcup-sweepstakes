// ============================================================
// FIFA 2026 Sweepstakes — Frontend
// ============================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz19-L4XRtXoTyF6SbvSG0iRxzD28it3kNmBkCZlDCZjzx_jZhhywihaHvhQxVuOuBg/exec";
const REMOVE_CLAIMED_NAMES = true;
const SPIN_DURATION_MS = 4000;
const APP_TITLE = "DGMC FIFA 2026 Sweepstakes";

// ============================================================
// PARTICIPANT NAMES — edit this list if needed
// ============================================================

const PARTICIPANTS = [
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

// ============================================================
// FLAG EMOJIS — maps every team name to its flag emoji
// ============================================================

const TEAM_FLAGS = {
  // Strong teams
  "Argentina":      "🇦🇷",
  "Brazil":         "🇧🇷",
  "France":         "🇫🇷",
  "Spain":          "🇪🇸",
  "England":        "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Germany":        "🇩🇪",
  "Portugal":       "🇵🇹",
  "Netherlands":    "🇳🇱",
  "Belgium":        "🇧🇪",
  "Croatia":        "🇭🇷",
  "Uruguay":        "🇺🇾",
  "Morocco":        "🇲🇦",
  "Colombia":       "🇨🇴",
  "Switzerland":    "🇨🇭",
  "Mexico":         "🇲🇽",
  "United States":  "🇺🇸",
  "Japan":          "🇯🇵",
  "South Korea":    "🇰🇷",
  "Senegal":        "🇸🇳",
  "Norway":         "🇳🇴",
  "Sweden":         "🇸🇪",
  "Austria":        "🇦🇹",
  "Türkiye":        "🇹🇷",
  "Côte d'Ivoire":  "🇨🇮",
  // Weak / underdog teams
  "Jordan":                 "🇯🇴",
  "Uzbekistan":             "🇺🇿",
  "Curaçao":                "🇨🇼",
  "Haiti":                  "🇭🇹",
  "New Zealand":            "🇳🇿",
  "Cabo Verde":             "🇨🇻",
  "Panama":                 "🇵🇦",
  "Qatar":                  "🇶🇦",
  "Saudi Arabia":           "🇸🇦",
  "South Africa":           "🇿🇦",
  "Ghana":                  "🇬🇭",
  "Tunisia":                "🇹🇳",
  "Algeria":                "🇩🇿",
  "Egypt":                  "🇪🇬",
  "Congo DR":               "🇨🇩",
  "Bosnia and Herzegovina": "🇧🇦",
  "Australia":              "🇦🇺",
  "Paraguay":               "🇵🇾",
  "Ecuador":                "🇪🇨",
  "Canada":                 "🇨🇦",
  "Iran":                   "🇮🇷",
  "Scotland":               "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Czechia":                "🇨🇿",
  "Cameroon":               "🇨🇲"
};

// ============================================================
// STATE
// ============================================================

let selectedName = null;
let pendingPair = null; // { pairId, strongTeam, weakTeam }

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  if (sessionStorage.getItem("hasSpun")) {
    showScreen("screen-done");
    return;
  }
  loadState();
  bindEvents();
});

// ============================================================
// LOAD STATE — fetch claimed names from Apps Script
// ============================================================

function loadState() {
  showLoading(true);

  fetch(SCRIPT_URL + "?action=getState")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      showLoading(false);
      if (!data.success) {
        showError("Could not load participant list: " + data.error);
        return;
      }
      populateDropdown(data.participants);
    })
    .catch(function () {
      showLoading(false);
      showError("Network error. Please check your connection and refresh the page.");
    });
}

// ============================================================
// POPULATE DROPDOWN
// ============================================================

function populateDropdown(participants) {
  var select = document.getElementById("name-select");

  // Build a lookup of claimed names
  var claimed = {};
  participants.forEach(function (p) {
    if (p.claimed) claimed[p.name] = true;
  });

  // Use the local PARTICIPANTS array for ordering, then apply claimed status
  PARTICIPANTS.forEach(function (name) {
    var isClaimed = !!claimed[name];

    if (REMOVE_CLAIMED_NAMES && isClaimed) return; // skip claimed names

    var opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name + (isClaimed ? " (taken)" : "");
    if (isClaimed) opt.disabled = true;
    select.appendChild(opt);
  });
}

// ============================================================
// EVENTS
// ============================================================

function bindEvents() {
  document.getElementById("name-select").addEventListener("change", function () {
    var val = this.value;
    document.getElementById("spin-btn").disabled = !val;
    selectedName = val || null;
    hideError();
  });

  document.getElementById("spin-btn").addEventListener("click", function () {
    if (!selectedName) return;
    document.getElementById("confirm-name").textContent = selectedName;
    showScreen("screen-confirm");
  });

  document.getElementById("goback-btn").addEventListener("click", function () {
    showScreen("screen-landing");
  });

  document.getElementById("confirm-btn").addEventListener("click", function () {
    fetchNextPair();
  });

  document.getElementById("do-spin-btn").addEventListener("click", function () {
    this.disabled = true;
    runSpinAnimation();
  });
}

// ============================================================
// FETCH NEXT PAIR — called on confirm, before spin screen
// ============================================================

function fetchNextPair() {
  showLoading(true);

  fetch(SCRIPT_URL + "?action=getNextPair")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      showLoading(false);
      if (!data.success) {
        showScreen("screen-landing");
        showError("No pairs remaining — the sweepstakes is full!");
        return;
      }
      pendingPair = { pairId: data.pairId, strongTeam: data.strongTeam, weakTeam: data.weakTeam };
      buildReels();
      showScreen("screen-spin");
    })
    .catch(function () {
      showLoading(false);
      showScreen("screen-landing");
      showError("Network error. Please try again.");
    });
}

// ============================================================
// BUILD REELS — fill slot machine with shuffled team names
// ============================================================

function buildReels() {
  var allTeams = Object.keys(TEAM_FLAGS);

  buildReel("reel-strong", allTeams, pendingPair.strongTeam);
  buildReel("reel-weak", allTeams, pendingPair.weakTeam);
}

function buildReel(reelId, allTeams, finalTeam) {
  var reel = document.getElementById(reelId);
  reel.innerHTML = "";

  // Build a long list of shuffled teams ending on the target
  var shuffled = shuffle(allTeams.slice());
  // Remove the final team from shuffle so we can append it at the end
  shuffled = shuffled.filter(function (t) { return t !== finalTeam; });

  // Repeat enough items to fill the animation scroll (about 60 items)
  var items = [];
  while (items.length < 56) {
    items = items.concat(shuffle(shuffled.slice()));
  }
  items = items.slice(0, 56);
  items.push(finalTeam); // final item — where the reel lands

  items.forEach(function (team, idx) {
    var div = document.createElement("div");
    div.className = "reel-item" + (idx === items.length - 1 ? " highlight" : "");
    div.textContent = team;
    reel.appendChild(div);
  });

  // Reset position to top
  reel.style.transition = "none";
  reel.style.transform = "translateY(0)";
}

// ============================================================
// SPIN ANIMATION
// ============================================================

function runSpinAnimation() {
  var reelStrong = document.getElementById("reel-strong");
  var reelWeak = document.getElementById("reel-weak");

  var itemHeight = 40; // matches .reel-item height in CSS
  var windowHeight = 120; // matches .spinner-window height in CSS
  var centreOffset = (windowHeight / 2) - (itemHeight / 2); // 40px

  function animateReel(reel) {
    var totalItems = reel.children.length;
    // Land the last item (index totalItems-1) centred in the window
    var targetY = -((totalItems - 1) * itemHeight) + centreOffset;

    // Force reflow to ensure transition: none has taken effect
    reel.getBoundingClientRect();

    reel.style.transition = "transform " + (SPIN_DURATION_MS / 1000) + "s cubic-bezier(0.15, 0.85, 0.45, 1.0)";
    reel.style.transform = "translateY(" + targetY + "px)";
  }

  animateReel(reelStrong);
  animateReel(reelWeak);

  setTimeout(function () {
    submitClaim();
  }, SPIN_DURATION_MS + 200);
}

// ============================================================
// SUBMIT CLAIM
// ============================================================

function submitClaim() {
  showLoading(true);

  // Set session flag immediately so a crash/reload doesn't allow a re-spin
  sessionStorage.setItem("hasSpun", "1");

  var payload = {
    action: "claim",
    name: selectedName,
    team1: pendingPair.strongTeam,
    team2: pendingPair.weakTeam,
    pairId: pendingPair.pairId
  };

  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      showLoading(false);
      if (!data.success) {
        showScreen("screen-landing");
        showError("Error recording your teams: " + data.error + " Please contact the organiser.");
        return;
      }
      showResult(data.team1, data.team2);
    })
    .catch(function () {
      showLoading(false);
      // Even on network error, show the result — the sessionStorage flag is set
      // so the pair is effectively used on this device
      showResult(pendingPair.strongTeam, pendingPair.weakTeam);
    });
}

// ============================================================
// SHOW RESULT
// ============================================================

function showResult(team1, team2) {
  document.getElementById("result-flag-strong").textContent = TEAM_FLAGS[team1] || "🏳";
  document.getElementById("result-name-strong").textContent = team1;
  document.getElementById("result-flag-weak").textContent = TEAM_FLAGS[team2] || "🏳";
  document.getElementById("result-name-weak").textContent = team2;
  showScreen("screen-result");
  bindShareButtons(team1, team2);
}

// ============================================================
// SHARE BUTTONS
// ============================================================

function bindShareButtons(team1, team2) {
  var flag1 = TEAM_FLAGS[team1] || "🏳";
  var flag2 = TEAM_FLAGS[team2] || "🏳";

  var message = "🏆 DGMC FIFA 2026 Sweepstakes\n\n"
    + selectedName + " got:\n"
    + flag1 + " " + team1 + " (Strong Pick)\n"
    + flag2 + " " + team2 + " (Wild Card)\n\n"
    + "Good luck to everyone! ⚽";

  document.getElementById("whatsapp-btn").addEventListener("click", function () {
    var url = "https://wa.me/?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  });

  document.getElementById("copy-btn").addEventListener("click", function () {
    var confirm = document.getElementById("copy-confirm");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).then(function () {
        confirm.textContent = "✓ Copied to clipboard!";
        setTimeout(function () { confirm.textContent = ""; }, 3000);
      });
    } else {
      // Fallback for older browsers
      var ta = document.createElement("textarea");
      ta.value = message;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      confirm.textContent = "✓ Copied to clipboard!";
      setTimeout(function () { confirm.textContent = ""; }, 3000);
    }
  });
}

// ============================================================
// UI HELPERS
// ============================================================

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function (s) {
    s.classList.remove("active");
    s.classList.add("hidden");
  });
  var target = document.getElementById(id);
  target.classList.remove("hidden");
  target.classList.add("active");
}

function showLoading(visible) {
  var el = document.getElementById("loading");
  if (visible) {
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function showError(msg) {
  var el = document.getElementById("error-msg");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError() {
  document.getElementById("error-msg").classList.add("hidden");
}

// ============================================================
// UTILITIES
// ============================================================

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}
