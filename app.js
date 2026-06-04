// ============================================================
// DGMC FIFA 2026 Sweepstakes — Frontend
// ============================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz19-L4XRtXoTyF6SbvSG0iRxzD28it3kNmBkCZlDCZjzx_jZhhywihaHvhQxVuOuBg/exec";
const REMOVE_CLAIMED_NAMES = true;
const SPIN_DURATION_MS = 10000;

// ============================================================
// PARTICIPANTS
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
// FLAG EMOJIS
// ============================================================

const TEAM_FLAGS = {
  "Argentina":              "🇦🇷",
  "Brazil":                 "🇧🇷",
  "France":                 "🇫🇷",
  "Spain":                  "🇪🇸",
  "England":                "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Germany":                "🇩🇪",
  "Portugal":               "🇵🇹",
  "Netherlands":            "🇳🇱",
  "Belgium":                "🇧🇪",
  "Croatia":                "🇭🇷",
  "Uruguay":                "🇺🇾",
  "Morocco":                "🇲🇦",
  "Colombia":               "🇨🇴",
  "Switzerland":            "🇨🇭",
  "Mexico":                 "🇲🇽",
  "United States":          "🇺🇸",
  "Japan":                  "🇯🇵",
  "South Korea":            "🇰🇷",
  "Senegal":                "🇸🇳",
  "Norway":                 "🇳🇴",
  "Sweden":                 "🇸🇪",
  "Austria":                "🇦🇹",
  "Türkiye":                "🇹🇷",
  "Côte d'Ivoire":          "🇨🇮",
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

var selectedName = null;

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  // Session recovery — show result again if already spun this session
  if (sessionStorage.getItem("hasSpun")) {
    var stored = sessionStorage.getItem("spinResult");
    if (stored) {
      var result = JSON.parse(stored);
      showResult(result.name, result.team1, result.team2, true);
    } else {
      document.getElementById("result-greeting").textContent = "You've already spun your teams!";
      document.getElementById("result-good-luck").textContent = "Your teams have been recorded. Contact the organiser if you need a reminder.";
      showScreen("screen-result");
    }
    bindBackButton();
    return;
  }

  loadState();
  bindEvents();
});

// ============================================================
// LOAD STATE
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
      populateLeaderboard(data.participants);
      updateLeaderboardToggle(data.participants);
    })
    .catch(function () {
      showLoading(false);
      showError("Network error. Please check your connection and refresh.");
    });
}

// ============================================================
// DROPDOWN
// ============================================================

function populateDropdown(participants) {
  var select = document.getElementById("name-select");
  var claimed = {};
  participants.forEach(function (p) {
    if (p.claimed) claimed[p.name] = true;
  });

  PARTICIPANTS.forEach(function (name) {
    var isClaimed = !!claimed[name];
    if (REMOVE_CLAIMED_NAMES && isClaimed) return;
    var opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name + (isClaimed ? " (taken)" : "");
    if (isClaimed) opt.disabled = true;
    select.appendChild(opt);
  });
}

// ============================================================
// LEADERBOARD
// ============================================================

function populateLeaderboard(participants) {
  var body = document.getElementById("leaderboard-body");
  var claimed = participants.filter(function (p) { return p.claimed && p.team1; });

  if (claimed.length === 0) {
    body.innerHTML = '<p class="lb-empty">No picks yet — be the first!</p>';
    return;
  }

  var html = "";
  claimed.forEach(function (p) {
    var f1 = TEAM_FLAGS[p.team1] || "🏳";
    var f2 = TEAM_FLAGS[p.team2] || "🏳";
    html += '<div class="lb-row">'
      + '<span class="lb-team-cell">' + f1 + ' ' + p.team1 + '</span>'
      + '<span class="lb-name-col">' + p.name + '</span>'
      + '<span class="lb-team-cell right">' + p.team2 + ' ' + f2 + '</span>'
      + '</div>';
  });

  body.innerHTML = html;
  applyTwemoji(body);
}

function updateLeaderboardToggle(participants) {
  var count = participants.filter(function (p) { return p.claimed; }).length;
  var btn = document.getElementById("leaderboard-toggle");
  var label = count === 0
    ? "🏆 View Leaderboard (no picks yet)"
    : "🏆 View Leaderboard (" + count + " of 60 picked)";
  btn.textContent = label;
}

// ============================================================
// EVENTS
// ============================================================

function bindEvents() {
  document.getElementById("name-select").addEventListener("change", function () {
    selectedName = this.value || null;
    document.getElementById("spin-btn").disabled = !selectedName;
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
    buildReels();
    document.getElementById("do-spin-btn").disabled = false;
    showScreen("screen-spin");
  });

  document.getElementById("do-spin-btn").addEventListener("click", function () {
    this.disabled = true;
    runSpinAnimation();
  });

  document.getElementById("leaderboard-toggle").addEventListener("click", function () {
    var panel = document.getElementById("leaderboard-panel");
    var isHidden = panel.classList.contains("hidden");
    panel.classList.toggle("hidden");
    // Keep count text, just update the toggle label direction
    var currentText = this.textContent;
    if (isHidden) {
      this.textContent = currentText.replace("View", "Hide");
    } else {
      this.textContent = currentText.replace("Hide", "View");
    }
  });

  bindBackButton();
}

function bindBackButton() {
  var btn = document.getElementById("back-home-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      // Clear session so they land on the home screen (not the already-spun screen)
      sessionStorage.removeItem("hasSpun");
      sessionStorage.removeItem("spinResult");
      window.location.reload();
    });
  }
}

// ============================================================
// BUILD REELS — pure theater, actual teams assigned server-side
// ============================================================

function buildReels() {
  buildReel("reel-strong", false);
  buildReel("reel-weak", true);
}

function buildReel(reelId, reverse) {
  var reel = document.getElementById(reelId);
  reel.innerHTML = "";

  var allTeams = Object.keys(TEAM_FLAGS);
  var items = [];
  while (items.length < 60) {
    items = items.concat(shuffle(allTeams.slice()));
  }
  items = items.slice(0, 60);

  items.forEach(function (team) {
    var div = document.createElement("div");
    div.className = "reel-item";
    div.textContent = team;
    reel.appendChild(div);
  });

  var ITEM_H = 40;
  var WIN_H = 120;
  var centre = (WIN_H / 2) - (ITEM_H / 2);

  reel.style.transition = "none";
  if (reverse) {
    var startY = -((items.length - 1) * ITEM_H) + centre;
    reel.style.transform = "translateY(" + startY + "px)";
  } else {
    reel.style.transform = "translateY(0)";
  }
}

// ============================================================
// SPIN ANIMATION
// ============================================================

function runSpinAnimation() {
  var reelStrong = document.getElementById("reel-strong");
  var reelWeak = document.getElementById("reel-weak");

  var ITEM_H = 40;
  var WIN_H = 120;
  var centre = (WIN_H / 2) - (ITEM_H / 2);

  // Normal: scrolls upward, snappy deceleration
  function animateNormal(reel) {
    var n = reel.children.length;
    var stopAt = Math.floor(n * 0.55) + Math.floor(Math.random() * 8);
    var targetY = -(stopAt * ITEM_H) + centre;
    reel.getBoundingClientRect();
    reel.style.transition = "transform " + (SPIN_DURATION_MS / 1000) + "s cubic-bezier(0.12, 0.88, 0.4, 1.0)";
    reel.style.transform = "translateY(" + targetY + "px)";
  }

  // Reverse: scrolls downward, slightly faster, different easing
  function animateReverse(reel) {
    var n = reel.children.length;
    var stopAt = Math.floor(n * 0.38) - Math.floor(Math.random() * 8);
    if (stopAt < 5) stopAt = 5;
    var targetY = -(stopAt * ITEM_H) + centre;
    var duration = (SPIN_DURATION_MS * 0.85) / 1000;
    reel.getBoundingClientRect();
    reel.style.transition = "transform " + duration + "s cubic-bezier(0.08, 0.92, 0.32, 1.0)";
    reel.style.transform = "translateY(" + targetY + "px)";
  }

  animateNormal(reelStrong);
  setTimeout(function () { animateReverse(reelWeak); }, 120);

  setTimeout(function () { submitClaim(); }, SPIN_DURATION_MS + 300);
}

// ============================================================
// SUBMIT CLAIM
// ============================================================

function submitClaim() {
  showLoading(true);
  sessionStorage.setItem("hasSpun", "1");

  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action: "claim", name: selectedName })
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      showLoading(false);
      if (!data.success) {
        sessionStorage.removeItem("hasSpun");
        showScreen("screen-landing");
        showError("Could not record your teams: " + data.error);
        return;
      }
      sessionStorage.setItem("spinResult", JSON.stringify({
        name: data.name,
        team1: data.team1,
        team2: data.team2
      }));
      showResult(data.name, data.team1, data.team2, false);
    })
    .catch(function () {
      showLoading(false);
      sessionStorage.removeItem("hasSpun");
      showScreen("screen-landing");
      showError("Network error. Please try again or contact the organiser.");
    });
}

// ============================================================
// SHOW RESULT
// ============================================================

function showResult(name, team1, team2, isRecovery) {
  var greeting = isRecovery
    ? "Welcome back, " + name + "! Here are your teams again."
    : "Well done, " + name + "! Here are your teams! 🎉";

  document.getElementById("result-greeting").textContent = greeting;
  document.getElementById("result-flag-strong").textContent = TEAM_FLAGS[team1] || "🏳";
  document.getElementById("result-name-strong").textContent = team1;
  document.getElementById("result-flag-weak").textContent = TEAM_FLAGS[team2] || "🏳";
  document.getElementById("result-name-weak").textContent = team2;

  if (isRecovery) {
    document.getElementById("result-good-luck").textContent = "Your teams are locked in — good luck! 🏆";
  }

  showScreen("screen-result");
  applyTwemoji(document.getElementById("screen-result"));
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
  window.scrollTo(0, 0);
}

function showLoading(visible) {
  var el = document.getElementById("loading");
  visible ? el.classList.remove("hidden") : el.classList.add("hidden");
}

function showError(msg) {
  var el = document.getElementById("error-msg");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError() {
  document.getElementById("error-msg").classList.add("hidden");
}

function applyTwemoji(el) {
  if (typeof twemoji !== "undefined") {
    twemoji.parse(el, { folder: "svg", ext: ".svg" });
  }
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}
