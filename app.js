// ============================================================
// DGMC FIFA 2026 Sweepstakes — Frontend
// ============================================================

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz19-L4XRtXoTyF6SbvSG0iRxzD28it3kNmBkCZlDCZjzx_jZhhywihaHvhQxVuOuBg/exec";
const REMOVE_CLAIMED_NAMES = true;
const SPIN_DURATION_MS = 16000;

// ============================================================
// PARTICIPANTS
// ============================================================

const PARTICIPANTS = [
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

// ============================================================
// TEAM LISTS — used to restrict each reel to the correct pool
// ============================================================

const STRONG_TEAMS = [
  "Argentina", "Brazil", "France", "Spain", "England",
  "Germany", "Portugal", "Netherlands", "Belgium", "Croatia",
  "Uruguay", "Morocco", "Colombia", "Switzerland", "Mexico",
  "United States", "Japan", "South Korea", "Senegal", "Norway",
  "Sweden", "Austria", "Türkiye", "Côte d'Ivoire"
];

const WEAK_TEAMS = [
  "Jordan", "Uzbekistan", "Curaçao", "Haiti", "New Zealand",
  "Cabo Verde", "Panama", "Qatar", "Saudi Arabia", "South Africa",
  "Ghana", "Tunisia", "Algeria", "Egypt", "Congo DR",
  "Bosnia and Herzegovina", "Australia", "Paraguay", "Ecuador",
  "Canada", "Iran", "Scotland", "Czechia", "Cameroon"
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

// UPDATE this if the kick-off time changes — this is 21:00 SAST (UTC+2) on June 11 2026
const KICKOFF = new Date('2026-06-11T19:00:00Z');

function startCountdown() {
  function tick() {
    var now = new Date();
    var diff = KICKOFF - now;
    var el = document.getElementById("countdown-timer");
    if (!el) return;
    if (diff <= 0) {
      el.innerHTML = '<p style="color:var(--success);font-weight:700;font-size:1rem;">The tournament has kicked off! ⚽</p>';
      return;
    }
    var days  = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins  = Math.floor((diff % 3600000) / 60000);
    var secs  = Math.floor((diff % 60000) / 1000);
    document.getElementById("cd-days").textContent  = String(days).padStart(2, "0");
    document.getElementById("cd-hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("cd-mins").textContent  = String(mins).padStart(2, "0");
    document.getElementById("cd-secs").textContent  = String(secs).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

document.addEventListener("DOMContentLoaded", function () {
  // Session recovery — show result again if already spun this session
  startCountdown();

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

  startCountdown();
  loadState();
  bindEvents();
});

// ============================================================
// LOAD STATE
// ============================================================

function loadState() {
  showLoading(true);
  document.getElementById("retry-btn").classList.add("hidden");

  var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timeoutId = controller
    ? setTimeout(function () { controller.abort(); }, 12000)
    : null;

  var opts = controller ? { signal: controller.signal } : {};

  fetch(SCRIPT_URL + "?action=getState", opts)
    .then(function (res) {
      if (timeoutId) clearTimeout(timeoutId);
      return res.json();
    })
    .then(function (data) {
      showLoading(false);
      if (!data.success) {
        showError("Could not load. Tap Retry to try again.");
        document.getElementById("retry-btn").classList.remove("hidden");
        return;
      }
      populateDropdown(data.participants);
      populateLeaderboard(data.participants);
      updateLeaderboardToggle(data.participants);
    })
    .catch(function () {
      if (timeoutId) clearTimeout(timeoutId);
      showLoading(false);
      showError("Could not connect. Check your signal and tap Retry.");
      document.getElementById("retry-btn").classList.remove("hidden");
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
  var claimed = participants
    .filter(function (p) { return p.claimed && p.team1; })
    .sort(function (a, b) {
      return PARTICIPANTS.indexOf(a.name) - PARTICIPANTS.indexOf(b.name);
    });

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
    ? "🏆 View Team Draw Results (no picks yet)"
    : "🏆 View Team Draw Results (" + count + " of " + PARTICIPANTS.length + " picked)";
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
    document.getElementById("do-spin-btn").disabled = false;
    buildReels(); // pre-fill reels with random static teams while waiting
    showScreen("screen-spin");
  });

  document.getElementById("do-spin-btn").addEventListener("click", function () {
    this.disabled = true;
    claimThenSpin();
  });

  document.getElementById("retry-btn").addEventListener("click", function () {
    hideError();
    loadState();
  });

  document.getElementById("try-again-btn").addEventListener("click", function () {
    window.location.reload();
  });

  document.getElementById("leaderboard-toggle").addEventListener("click", function () {
    var panel = document.getElementById("leaderboard-panel");
    var isHidden = panel.classList.contains("hidden");
    panel.classList.toggle("hidden");
    // Keep count text, just update the toggle label direction
    var currentText = this.textContent;
    if (isHidden) {
      this.textContent = currentText.replace("View Team Draw Results", "Hide Team Draw Results");
    } else {
      this.textContent = currentText.replace("Hide Team Draw Results", "View Team Draw Results");
    }
  });

  bindBackButton();
}

function bindBackButton() {
  var btn = document.getElementById("back-home-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      sessionStorage.clear();
      window.location.reload();
    });
  }
}

// ============================================================
// BUILD REELS — static preview before spin
// ============================================================

var ITEM_H = 40;
var WIN_H = 120;
var REEL_PAD = 2; // items visible above/below the selected team when stopped

function buildReels() {
  fillReel("reel-strong", null, false, STRONG_TEAMS);
  fillReel("reel-weak",   null, true,  WEAK_TEAMS);
}

function fillReel(reelId, finalTeam, reverse, teamPool) {
  var reel = document.getElementById(reelId);
  reel.innerHTML = "";

  var pool = teamPool || Object.keys(TEAM_FLAGS);
  var others = finalTeam
    ? pool.filter(function (t) { return t !== finalTeam; })
    : pool.slice();

  // 54 random scroll items
  var randoms = [];
  while (randoms.length < 54) {
    randoms = randoms.concat(shuffle(others.slice()));
  }
  randoms = randoms.slice(0, 54);

  // Padding items that appear above/below the final team
  var pad = [];
  while (pad.length < REEL_PAD) {
    pad = pad.concat(shuffle(others.slice()));
  }
  pad = pad.slice(0, REEL_PAD);

  var items;
  var finalIndex;

  if (finalTeam) {
    if (reverse) {
      // [pad | FINAL | randoms] — reel scrolls DOWN, lands with FINAL centred,
      // pad items visible above it, randoms below
      items = pad.concat([finalTeam]).concat(randoms);
      finalIndex = REEL_PAD;
    } else {
      // [randoms | FINAL | pad] — reel scrolls UP, lands with FINAL centred,
      // randoms visible above it, pad items below
      items = randoms.concat([finalTeam]).concat(pad);
      finalIndex = 54;
    }
  } else {
    items = randoms.concat(pad);
    finalIndex = Math.floor(items.length / 2);
  }

  items.forEach(function (team, idx) {
    var div = document.createElement("div");
    div.className = "reel-item" + (finalTeam && idx === finalIndex ? " reel-landing" : "");
    div.textContent = team;
    reel.appendChild(div);
  });

  // Store finalIndex so runSpinAnimation knows the exact target
  reel.dataset.finalIndex = String(finalIndex);

  var centre = (WIN_H / 2) - (ITEM_H / 2); // 40px
  reel.style.transition = "none";

  if (reverse) {
    // Start near the bottom so it scrolls visibly downward toward FINAL
    var startIdx = items.length - 2;
    reel.style.transform = "translateY(" + (-(startIdx * ITEM_H) + centre) + "px)";
  } else {
    reel.style.transform = "translateY(0)";
  }
}

// ============================================================
// CLAIM THEN SPIN — API first, animate with real teams
// ============================================================

function claimThenSpin() {
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
        document.getElementById("do-spin-btn").disabled = false;
        showSpinError("Could not record your teams: " + data.error);
        return;
      }
      sessionStorage.setItem("spinResult", JSON.stringify({
        name: data.name,
        team1: data.team1,
        team2: data.team2
      }));
      // Rebuild reels so they land on the actual assigned teams
      fillReel("reel-strong", data.team1, false, STRONG_TEAMS);
      fillReel("reel-weak",   data.team2, true,  WEAK_TEAMS);
      runSpinAnimation(function () {
        showResult(data.name, data.team1, data.team2, false);
      });
    })
    .catch(function () {
      showLoading(false);
      sessionStorage.removeItem("hasSpun");
      document.getElementById("do-spin-btn").disabled = false;
      showSpinError("Network error. Please try again.");
    });
}

function showSpinError(msg) {
  var el = document.getElementById("spin-error");
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
  var btn = document.getElementById("try-again-btn");
  if (btn) btn.classList.remove("hidden");
}

// ============================================================
// SPIN ANIMATION
// ============================================================

function runSpinAnimation(onComplete) {
  var reelStrong = document.getElementById("reel-strong");
  var reelWeak   = document.getElementById("reel-weak");
  var centre = (WIN_H / 2) - (ITEM_H / 2);

  function animateReel(reel, reverse) {
    var finalIndex = parseInt(reel.dataset.finalIndex, 10);
    var targetY = -(finalIndex * ITEM_H) + centre;
    var duration = reverse ? (SPIN_DURATION_MS * 0.85) / 1000 : SPIN_DURATION_MS / 1000;
    var easing   = reverse
      ? "cubic-bezier(0.08, 0.92, 0.32, 1.0)"
      : "cubic-bezier(0.12, 0.88, 0.4, 1.0)";
    reel.getBoundingClientRect();
    reel.style.transition = "transform " + duration + "s " + easing;
    reel.style.transform = "translateY(" + targetY + "px)";
  }

  animateReel(reelStrong, false);
  setTimeout(function () { animateReel(reelWeak, true); }, 120);
  setTimeout(onComplete, SPIN_DURATION_MS + 400);
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
