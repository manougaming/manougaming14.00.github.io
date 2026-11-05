
/* Landing page: choose a payload, then start the run. */

var TARGET = {
  hen: "log=1&afterglow=run&payload=hen.bin",
  goldhen: "log=1&afterglow=run&mode=goldhen",
};

var AUTOSTART_SECONDS = 5;
var STORE_KEY = "afterglow.choice";

var form = document.getElementById("pick");
var autoBox = document.getElementById("auto");
var countEl = document.getElementById("count");
var cacheEl = document.getElementById("cache");
var ticker = null;
var waitingForCache = false;

/* Application Cache */

var appCache = (function () {
  try { return window.applicationCache || null; }
  catch (e) { return null; }
})();

function cacheBusy() {
  if (!appCache) return false;

  try {
    return appCache.status === appCache.CHECKING
        || appCache.status === appCache.DOWNLOADING;
  } catch (e) {
    return false;
  }
}

function cacheNote() {
  if (!cacheEl) return;

  if (!appCache) {
    cacheEl.textContent = "";
    return;
  }

  var text = "";

  try {
    if (appCache.status === appCache.CHECKING)
      text = "جارٍ التحقق من التحديثات";

    else if (appCache.status === appCache.DOWNLOADING)
      text = "جارٍ تحميل الملفات، يرجى الانتظار";

    else if (appCache.status === appCache.UPDATEREADY)
      text = "توجد نسخة أحدث، أعد فتح الصفحة لاستخدامها";

    else if (appCache.status === appCache.OBSOLETE)
      text = "تم إيقاف التخزين المؤقت، سيتم الاتصال بالخادم مباشرة";
  } catch (e) {}

  cacheEl.textContent = text;
}

function cacheChanged() {
  cacheNote();

  if (waitingForCache && !cacheBusy()) {
    waitingForCache = false;
    start();
  }
}

if (appCache) {
  var events = [
    "checking",
    "downloading",
    "progress",
    "cached",
    "noupdate",
    "updateready",
    "error",
    "obsolete"
  ];

  for (var e = 0; e < events.length; e++) {
    try {
      appCache.addEventListener(events[e], cacheChanged, false);
    } catch (err) {}
  }
}

/* Save and restore choices */

function remember() {
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        payload: picked(),
        autostart: autoBox.checked
      })
    );
  } catch (e) {}
}

function restore() {
  var saved = null;

  try {
    saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
  } catch (e) {}

  if (!saved) return;

  if (saved.payload && TARGET[saved.payload]) {
    var radio = form.querySelector(
      'input[name="payload"][value="' + saved.payload + '"]'
    );

    if (radio) radio.checked = true;
  }

  if (typeof saved.autostart === "boolean") {
    autoBox.checked = saved.autostart;
  }
}

function picked() {
  var radio = form.querySelector('input[name="payload"]:checked');
  return radio ? radio.value : "goldhen";
}

/* Start */

function start() {
  stopClock();

  if (cacheBusy()) {
    waitingForCache = true;
    countEl.textContent = "بانتظار اكتمال التخزين المؤقت";
    cacheNote();
    return;
  }

  location.href = "jb.html?" + TARGET[picked()];
}

function stopClock() {
  if (ticker !== null) {
    clearInterval(ticker);
    ticker = null;
  }

  countEl.textContent = "";
}

/* Arabic countdown */

function countdownText(n) {
  if (n === 2) return "يبدأ خلال ثانيتين";
  if (n === 1) return "يبدأ خلال ثانية واحدة";
  return "يبدأ خلال " + n + " ثوانٍ";
}

function startClock() {
  var left = AUTOSTART_SECONDS;

  countEl.textContent = countdownText(left);

  ticker = setInterval(function () {
    left -= 1;

    if (left <= 0) {
      start();
      return;
    }

    countEl.textContent = countdownText(left);
  }, 1000);
}

/* Form events */

form.addEventListener("submit", function (ev) {
  ev.preventDefault();
  start();
});

form.addEventListener("change", function (ev) {
  remember();

  if (ev.target === autoBox) {
    if (autoBox.checked) startClock();
    else stopClock();

    return;
  }

  if (ev.target.name === "payload" && autoBox.checked) {
    stopClock();
    startClock();
  }
});

/* Initialize */

restore();
cacheNote();

if (autoBox.checked) {
  startClock();
}
