/**
 * Shared flashcard engine with SM-2 spaced repetition.
 *
 * Usage: define window.FLASHCARD_CONFIG before loading this script:
 *
 *   window.FLASHCARD_CONFIG = {
 *     title: "PostgreSQL Flashcards",    // h1 text (supports <span> for accent)
 *     storagePrefix: "pg-flashcards",    // localStorage key prefix
 *     categories: {
 *       "Indexes":    { color: "#336791", darkColor: "#5b9bd5" },
 *       "Queries":    { color: "#2a8a5a", darkColor: "#4aae6e" },
 *       ...
 *     },
 *     accentColor: "#336791",            // progress bar, header accent
 *     darkAccentColor: "#5b9bd5",        // accent in dark mode
 *     cards: [
 *       { term: "B-tree index", cat: "Indexes", desc: "...", code: "..." },
 *       ...
 *     ]
 *   };
 *
 * Requires srs.js to be loaded first.
 */
(function () {
  var CFG = window.FLASHCARD_CONFIG;
  if (!CFG) return;

  // ── Inject CSS ──
  var catEntries = Object.entries(CFG.categories);

  function catColorVars(isDark) {
    return catEntries.map(function (entry, i) {
      var v = entry[1];
      var c = isDark && v.darkColor ? v.darkColor : v.color;
      return '--cat' + (i + 1) + ': ' + c + '; --cat' + (i + 1) + '-bg: ' + hexBg(c, isDark ? 0.12 : 0.1) + ';';
    }).join('\n    ');
  }

  function hexBg(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  var accent = CFG.accentColor || catEntries[0]?.[1]?.color || '#336791';
  var darkAccent = CFG.darkAccentColor || catEntries[0]?.[1]?.darkColor || '#5b9bd5';

  // Build tab and badge CSS for each category
  function catKey(c) { return c.replace(/\s+/g, '-'); }

  var tabStyles = catEntries.map(function (entry) {
    var name = entry[0];
    var i = catEntries.indexOf(entry);
    return '.tab.active-' + catKey(name) + ' { background: var(--cat' + (i + 1) + '-bg); color: var(--cat' + (i + 1) + '); border-color: var(--cat' + (i + 1) + '); }';
  }).join('\n  ');

  var badgeStyles = catEntries.map(function (entry) {
    var name = entry[0];
    var i = catEntries.indexOf(entry);
    return '.badge-' + catKey(name) + ' { color: var(--cat' + (i + 1) + '); background: var(--cat' + (i + 1) + '-bg); border-color: var(--cat' + (i + 1) + '); }';
  }).join('\n  ');

  var goodColor = CFG.categories[catEntries[1]?.[0]]?.color || '#3a8a5a';
  var darkGoodColor = CFG.categories[catEntries[1]?.[0]]?.darkColor || '#4aae6e';
  var againColor = CFG.categories[catEntries[catEntries.length - 1]?.[0]]?.color || '#cc342d';
  var darkAgainColor = CFG.categories[catEntries[catEntries.length - 1]?.[0]]?.darkColor || '#e85d4a';

  var style = document.createElement('style');
  style.textContent = '\
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\
\
  :root {\
    --bg: #f5f5f0;\
    --surface: #fff;\
    --surface2: #eeeee8;\
    --border: rgba(0,0,0,0.1);\
    --border-hover: rgba(0,0,0,0.2);\
    --text: #1a1a1a;\
    --text-muted: #666;\
    --text-dim: #999;\
    --code-text: #4a4640;\
    --accent: ' + accent + ';\
    --accent-bg: ' + hexBg(accent, 0.1) + ';\
    --good: ' + goodColor + ';\
    --good-bg: ' + hexBg(goodColor, 0.1) + ';\
    --again: ' + againColor + ';\
    --again-bg: ' + hexBg(againColor, 0.1) + ';\
    ' + catColorVars(false) + '\
    --radius: 12px;\
    --mono: "DM Mono", monospace;\
    --sans: "DM Sans", sans-serif;\
  }\
\
  [data-theme="dark"] {\
    --bg: #0e0e10;\
    --surface: #18181c;\
    --surface2: #22222a;\
    --border: rgba(255,255,255,0.08);\
    --border-hover: rgba(255,255,255,0.16);\
    --text: #f0eee8;\
    --text-muted: #888;\
    --text-dim: #555;\
    --code-text: #c9c5b8;\
    --accent: ' + darkAccent + ';\
    --accent-bg: ' + hexBg(darkAccent, 0.12) + ';\
    --good: ' + darkGoodColor + ';\
    --good-bg: ' + hexBg(darkGoodColor, 0.12) + ';\
    --again: ' + darkAgainColor + ';\
    --again-bg: ' + hexBg(darkAgainColor, 0.12) + ';\
    ' + catColorVars(true) + '\
  }\
\
  body {\
    font-family: var(--sans);\
    background: var(--bg);\
    color: var(--text);\
    min-height: 100vh;\
    display: flex;\
    flex-direction: column;\
    align-items: center;\
    padding: 2rem 1rem 4rem;\
  }\
\
  header { text-align: center; margin-bottom: 2.5rem; }\
  header h1 {\
    font-size: clamp(1.6rem, 4vw, 2.2rem);\
    font-weight: 600;\
    letter-spacing: -0.03em;\
    color: var(--text);\
  }\
  header h1 span { color: var(--accent); }\
  header p { margin-top: 0.4rem; font-size: 0.9rem; color: var(--text-muted); }\
\
  .wrapper { width: 100%; max-width: 640px; }\
\
  .progress-row { display: flex; align-items: center; gap: 12px; margin-bottom: 1.25rem; }\
  .progress-track { flex: 1; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; }\
  .progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.4s ease; width: 0%; }\
  .progress-label { font-size: 12px; color: var(--text-dim); font-family: var(--mono); white-space: nowrap; }\
\
  .tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1.5rem; }\
  .tab {\
    padding: 5px 13px; border-radius: 20px; font-size: 12px; font-family: var(--mono);\
    border: 1px solid var(--border); background: transparent; color: var(--text-muted);\
    cursor: pointer; transition: all 0.15s;\
  }\
  .tab:hover { border-color: var(--border-hover); color: var(--text); }\
  ' + tabStyles + '\
  .tab.active-All { background: rgba(240,238,232,0.08); color: var(--text); border-color: rgba(240,238,232,0.3); }\
\
  .card-scene { perspective: 1000px; height: 280px; margin-bottom: 1.25rem; cursor: pointer; }\
  .card-inner {\
    width: 100%; height: 100%; position: relative;\
    transform-style: preserve-3d; transition: transform 0.45s cubic-bezier(0.4,0,0.2,1);\
  }\
  .card-inner.flipped { transform: rotateY(180deg); }\
\
  .card-face {\
    position: absolute; inset: 0; backface-visibility: hidden; border-radius: var(--radius);\
    border: 1px solid var(--border); background: var(--surface);\
    display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem;\
  }\
  .card-back {\
    transform: rotateY(180deg); justify-content: flex-start; align-items: flex-start;\
    overflow-y: auto; padding: 1.5rem; gap: 0;\
  }\
\
  .card-hint {\
    font-size: 11px; font-family: var(--mono); color: var(--text-dim);\
    letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1rem;\
  }\
  .card-term {\
    font-size: clamp(1.1rem, 3vw, 1.5rem); font-weight: 600; letter-spacing: -0.02em;\
    text-align: center; line-height: 1.3; color: var(--text);\
  }\
  .badge {\
    margin-top: 1rem; font-size: 11px; font-family: var(--mono);\
    padding: 3px 10px; border-radius: 20px; border: 1px solid;\
  }\
  ' + badgeStyles + '\
\
  .back-label {\
    font-size: 11px; font-family: var(--mono); color: var(--text-dim);\
    letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.75rem;\
  }\
  .back-desc { font-size: 14px; line-height: 1.65; color: var(--text); margin-bottom: 1rem; }\
  .back-code {\
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;\
    padding: 0.85rem 1rem; font-family: var(--mono); font-size: 12.5px; line-height: 1.6;\
    color: var(--code-text); white-space: pre; overflow-x: auto;\
  }\
\
  .tap-hint {\
    text-align: center; font-size: 12px; color: var(--text-dim);\
    font-family: var(--mono); margin-bottom: 1rem; height: 18px;\
  }\
  .btn-row { display: flex; gap: 6px; justify-content: center; margin-bottom: 1rem; flex-wrap: wrap; }\
  .btn {\
    padding: 7px 12px; border-radius: 8px; font-family: var(--sans); font-size: 13px;\
    font-weight: 500; cursor: pointer; transition: all 0.15s;\
    border: 1px solid var(--border); background: transparent; color: var(--text-muted);\
    display: flex; flex-direction: column; align-items: center; min-width: 56px;\
  }\
  .btn:hover { background: var(--surface2); color: var(--text); }\
  .btn .btn-label { font-size: 11px; font-family: var(--mono); opacity: 0.7; }\
  .btn .btn-interval { font-size: 10px; font-family: var(--mono); opacity: 0.5; margin-top: 2px; }\
  .btn-q0, .btn-q1 { border-color: rgba(204,52,45,0.4); color: var(--again); }\
  .btn-q0:hover, .btn-q1:hover { background: var(--again-bg); }\
  .btn-q2 { border-color: rgba(200,140,40,0.4); color: #c88c28; }\
  [data-theme="dark"] .btn-q2 { color: #e0a830; }\
  .btn-q2:hover { background: rgba(200,140,40,0.08); }\
  .btn-q3 { border-color: rgba(140,170,50,0.4); color: #7a9a30; }\
  [data-theme="dark"] .btn-q3 { color: #a0c040; }\
  .btn-q3:hover { background: rgba(140,170,50,0.08); }\
  .btn-q4 { border-color: rgba(58,138,90,0.4); color: var(--good); }\
  .btn-q4:hover { background: var(--good-bg); }\
  .btn-q5 { border-color: rgba(50,100,180,0.4); color: #3264b4; }\
  [data-theme="dark"] .btn-q5 { color: #5b9bd5; }\
  .btn-q5:hover { background: rgba(50,100,180,0.08); }\
  .btn-reset { font-size: 13px; min-width: auto; flex-direction: row; }\
\
  .toast {\
    text-align: center; font-size: 12px; color: var(--text-dim);\
    font-family: var(--mono); margin-bottom: 0.75rem; height: 18px;\
    transition: opacity 0.3s;\
  }\
\
  .stats {\
    display: flex; justify-content: center; gap: 2rem; font-size: 12px;\
    color: var(--text-dim); font-family: var(--mono);\
  }\
  .stats span b { color: var(--text-muted); font-weight: 500; }\
\
  .theme-toggle {\
    position: fixed; top: 16px; right: 16px; width: 36px; height: 36px;\
    border-radius: 50%; border: 1px solid var(--border); background: var(--surface);\
    color: var(--text-muted); cursor: pointer; display: flex; align-items: center;\
    justify-content: center; font-size: 18px; transition: all 0.2s; z-index: 10;\
  }\
  .theme-toggle:hover { border-color: var(--border-hover); color: var(--text); }\
  ';
  document.head.appendChild(style);

  // ── Inject HTML ──
  var catNames = Object.keys(CFG.categories);
  var subtitle = CFG.cards.length + ' cards \u00B7 ' + catNames.join(' \u00B7 ');

  document.body.innerHTML = '\
    <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme"></button>\
    <header>\
      <h1>' + CFG.title + '</h1>\
      <p>' + subtitle + '</p>\
    </header>\
    <div class="wrapper">\
      <div class="progress-row">\
        <div class="progress-track"><div class="progress-fill" id="prog"></div></div>\
        <div class="progress-label" id="prog-label">0 / 0</div>\
      </div>\
      <div class="tabs" id="tabs"></div>\
      <div class="card-scene" id="cardScene">\
        <div class="card-inner" id="cardInner">\
          <div class="card-face" id="cardFront">\
            <div class="card-hint">tap to reveal</div>\
            <div class="card-term" id="frontTerm"></div>\
            <div class="badge" id="frontBadge"></div>\
          </div>\
          <div class="card-face card-back" id="cardBack">\
            <div class="back-label">answer</div>\
            <div class="back-desc" id="backDesc"></div>\
            <div class="back-code" id="backCode"></div>\
          </div>\
        </div>\
      </div>\
      <div class="tap-hint" id="tapHint">tap the card to flip</div>\
      <div class="btn-row" id="btnRow" style="display:none"></div>\
      <div class="toast" id="toast"></div>\
      <div class="stats">\
        <span><b id="sDue">0</b> due</span>\
        <span><b id="sNew">0</b> new</span>\
        <span><b id="sLearned">0</b> learned</span>\
      </div>\
    </div>\
  ';

  // ── Theme toggle ──
  var themeKey = CFG.storagePrefix + '-theme';
  var saved = localStorage.getItem(themeKey);
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  var themeBtn = document.getElementById('themeToggle');
  function updateIcon() {
    themeBtn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }
  updateIcon();
  themeBtn.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(themeKey, 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(themeKey, 'dark');
    }
    updateIcon();
  });

  // ── SRS storage ──
  var ALL = CFG.cards;
  var SRS_KEY = CFG.storagePrefix + '-srs';
  var OLD_KEY = CFG.storagePrefix + '-gotit';

  function loadSRS() {
    // Migrate old gotit data if present
    try {
      var oldData = JSON.parse(localStorage.getItem(OLD_KEY));
      if (Array.isArray(oldData) && oldData.length > 0) {
        var migrated = SRS.migrateFromGotIt(oldData, Date.now());
        // Merge with any existing SRS data
        var existing = {};
        try {
          var e = JSON.parse(localStorage.getItem(SRS_KEY));
          if (e && typeof e === 'object') existing = e;
        } catch (_) {}
        for (var term in migrated) {
          if (!existing[term]) existing[term] = migrated[term];
        }
        localStorage.setItem(SRS_KEY, JSON.stringify(existing));
        localStorage.removeItem(OLD_KEY);
        return existing;
      }
    } catch (_) {}

    try {
      var s = JSON.parse(localStorage.getItem(SRS_KEY));
      return (s && typeof s === 'object') ? s : {};
    } catch (_) { return {}; }
  }

  function saveSRS() {
    localStorage.setItem(SRS_KEY, JSON.stringify(srsData));
  }

  var srsData = loadSRS();
  var category = 'All';
  var deck = [];
  var flipped = false;

  function categories() {
    return ['All'].concat(catNames);
  }

  function pool() {
    return category === 'All' ? ALL : ALL.filter(function (c) { return c.cat === category; });
  }

  function buildDeck() {
    var now = Date.now();
    var cards = pool();
    var due = [];
    var newCards = [];

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var data = srsData[card.term];
      if (!data) {
        newCards.push(card);
      } else if (SRS.isDue(data, now)) {
        due.push(card);
      }
    }

    // Sort due cards: most overdue first
    due.sort(function (a, b) {
      return SRS.dueOrder(srsData[a.term], srsData[b.term]);
    });

    // Shuffle new cards
    for (var j = newCards.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = newCards[j];
      newCards[j] = newCards[k];
      newCards[k] = tmp;
    }

    deck = due.concat(newCards);
  }

  function renderTabs() {
    document.getElementById('tabs').innerHTML = categories().map(function (c) {
      var active = c === category ? ' active-' + catKey(c) : '';
      var label = CFG.categoryLabels?.[c] || c;
      return '<button class="tab' + active + '" onclick="window._fc_setCategory(\'' + c.replace(/'/g, "\\'") + '\')">' + label + '</button>';
    }).join('');
  }

  window._fc_setCategory = function (c) {
    category = c; buildDeck(); renderTabs(); showCard();
  };

  function updateStats() {
    var now = Date.now();
    var cards = pool();
    var dueCount = 0;
    var newCount = 0;
    var learnedCount = 0;

    for (var i = 0; i < cards.length; i++) {
      var data = srsData[cards[i].term];
      if (!data) {
        newCount++;
      } else if (SRS.isDue(data, now)) {
        dueCount++;
      } else {
        learnedCount++;
      }
    }

    var total = cards.length;
    var pct = total ? (learnedCount / total) * 100 : 0;
    document.getElementById('prog').style.width = pct + '%';
    document.getElementById('prog-label').textContent = learnedCount + ' / ' + total;
    document.getElementById('sDue').textContent = dueCount;
    document.getElementById('sNew').textContent = newCount;
    document.getElementById('sLearned').textContent = learnedCount;
  }

  var QUALITY_BUTTONS = [
    { q: 0, label: 'Blank', cls: 'btn-q0' },
    { q: 1, label: 'Wrong', cls: 'btn-q1' },
    { q: 2, label: 'Hard',  cls: 'btn-q2' },
    { q: 3, label: 'Okay',  cls: 'btn-q3' },
    { q: 4, label: 'Good',  cls: 'btn-q4' },
    { q: 5, label: 'Easy',  cls: 'btn-q5' }
  ];

  function showCard() {
    flipped = false;
    document.getElementById('cardInner').classList.remove('flipped');
    document.getElementById('tapHint').textContent = 'tap the card to flip';
    document.getElementById('btnRow').style.display = 'none';
    document.getElementById('toast').textContent = '';
    document.getElementById('cardScene').onclick = flipCard;
    updateStats();

    if (deck.length === 0) {
      document.getElementById('frontTerm').innerHTML = '<span style="color:var(--good)">all done for today!</span>';
      document.getElementById('frontBadge').style.display = 'none';

      // Find next review date
      var now = Date.now();
      var cards = pool();
      var nextDue = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var data = srsData[cards[i].term];
        if (data && data.nextReview > now && data.nextReview < nextDue) {
          nextDue = data.nextReview;
        }
      }
      if (nextDue < Infinity) {
        var d = new Date(nextDue);
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        document.getElementById('tapHint').textContent = 'next card due: ' + months[d.getMonth()] + ' ' + d.getDate();
      } else {
        document.getElementById('tapHint').textContent = '';
      }

      document.getElementById('cardScene').onclick = null;
      document.getElementById('btnRow').innerHTML =
        '<button class="btn btn-reset" onclick="window._fc_studyAhead()">\u25B6 study ahead</button>' +
        ' <button class="btn btn-reset" onclick="window._fc_reset()">\u21BA reset all</button>';
      document.getElementById('btnRow').style.display = 'flex';
      return;
    }

    var card = deck[0];
    document.getElementById('frontTerm').textContent = card.term;
    var badge = document.getElementById('frontBadge');
    badge.textContent = card.cat;
    badge.className = 'badge badge-' + catKey(card.cat);
    badge.style.display = '';
    document.getElementById('backDesc').textContent = card.desc;
    var codeEl = document.getElementById('backCode');
    if (card.code) {
      codeEl.textContent = card.code;
      codeEl.style.display = '';
    } else {
      codeEl.style.display = 'none';
    }
  }

  function flipCard() {
    if (flipped) return;
    flipped = true;
    document.getElementById('cardInner').classList.add('flipped');
    document.getElementById('tapHint').textContent = '';

    var card = deck[0];
    var cardData = srsData[card.term] || SRS.newCard();
    var now = Date.now();
    var intervals = SRS.previewIntervals(cardData, now);

    var html = '';
    for (var i = 0; i < QUALITY_BUTTONS.length; i++) {
      var b = QUALITY_BUTTONS[i];
      var intv = SRS.formatInterval(intervals[b.q]);
      html += '<button class="btn ' + b.cls + '" onclick="window._fc_rate(' + b.q + ')">' +
        '<span class="btn-label">' + b.label + '</span>' +
        '<span class="btn-interval">' + intv + '</span>' +
        '</button>';
    }
    document.getElementById('btnRow').innerHTML = html;
    document.getElementById('btnRow').style.display = 'flex';
  }

  window._fc_rate = function (quality) {
    var card = deck[0];
    var cardData = srsData[card.term] || SRS.newCard();
    var now = Date.now();
    var updated = SRS.review(cardData, quality, now);
    srsData[card.term] = updated;
    saveSRS();

    // Show toast
    var intervalText = SRS.formatInterval(updated.interval);
    document.getElementById('toast').textContent = quality >= 3
      ? 'see again in ' + intervalText
      : 'see again in ' + intervalText;

    // Remove from deck (it's either not due anymore, or will re-appear if still due)
    deck.shift();

    // If failed (q < 3), add back to end of deck for re-review this session
    if (quality < 3) {
      deck.push(card);
    }

    showCard();
  };

  window._fc_studyAhead = function () {
    var now = Date.now();
    var cards = pool();
    var future = [];
    for (var i = 0; i < cards.length; i++) {
      var data = srsData[cards[i].term];
      if (data && !SRS.isDue(data, now)) {
        future.push(cards[i]);
      }
    }
    // Sort by soonest due
    future.sort(function (a, b) {
      return SRS.dueOrder(srsData[a.term], srsData[b.term]);
    });
    deck = future;
    showCard();
  };

  window._fc_reset = function () {
    srsData = {};
    saveSRS();
    buildDeck();
    showCard();
  };

  renderTabs(); buildDeck(); showCard();
})();
