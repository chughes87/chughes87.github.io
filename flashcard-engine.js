/**
 * Shared flashcard engine.
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
 */
(function () {
  const CFG = window.FLASHCARD_CONFIG;
  if (!CFG) return;

  // ── Inject CSS ──
  const catEntries = Object.entries(CFG.categories);

  function catColorVars(isDark) {
    return catEntries.map(([, v], i) => {
      const c = isDark && v.darkColor ? v.darkColor : v.color;
      return `--cat${i + 1}: ${c}; --cat${i + 1}-bg: ${hexBg(c, isDark ? 0.12 : 0.1)};`;
    }).join('\n    ');
  }

  function hexBg(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const accent = CFG.accentColor || catEntries[0]?.[1]?.color || '#336791';
  const darkAccent = CFG.darkAccentColor || catEntries[0]?.[1]?.darkColor || '#5b9bd5';

  // Build tab and badge CSS for each category
  function catKey(c) { return c.replace(/\s+/g, '-'); }

  const tabStyles = catEntries.map(([name], i) =>
    `.tab.active-${catKey(name)} { background: var(--cat${i + 1}-bg); color: var(--cat${i + 1}); border-color: var(--cat${i + 1}); }`
  ).join('\n  ');

  const badgeStyles = catEntries.map(([name], i) =>
    `.badge-${catKey(name)} { color: var(--cat${i + 1}); background: var(--cat${i + 1}-bg); border-color: var(--cat${i + 1}); }`
  ).join('\n  ');

  const goodColor = CFG.categories[catEntries[1]?.[0]]?.color || '#3a8a5a';
  const darkGoodColor = CFG.categories[catEntries[1]?.[0]]?.darkColor || '#4aae6e';
  const againColor = CFG.categories[catEntries[catEntries.length - 1]?.[0]]?.color || '#cc342d';
  const darkAgainColor = CFG.categories[catEntries[catEntries.length - 1]?.[0]]?.darkColor || '#e85d4a';

  const style = document.createElement('style');
  style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f5f5f0;
    --surface: #fff;
    --surface2: #eeeee8;
    --border: rgba(0,0,0,0.1);
    --border-hover: rgba(0,0,0,0.2);
    --text: #1a1a1a;
    --text-muted: #666;
    --text-dim: #999;
    --code-text: #4a4640;
    --accent: ${accent};
    --accent-bg: ${hexBg(accent, 0.1)};
    --good: ${goodColor};
    --good-bg: ${hexBg(goodColor, 0.1)};
    --again: ${againColor};
    --again-bg: ${hexBg(againColor, 0.1)};
    ${catColorVars(false)}
    --radius: 12px;
    --mono: 'DM Mono', monospace;
    --sans: 'DM Sans', sans-serif;
  }

  [data-theme="dark"] {
    --bg: #0e0e10;
    --surface: #18181c;
    --surface2: #22222a;
    --border: rgba(255,255,255,0.08);
    --border-hover: rgba(255,255,255,0.16);
    --text: #f0eee8;
    --text-muted: #888;
    --text-dim: #555;
    --code-text: #c9c5b8;
    --accent: ${darkAccent};
    --accent-bg: ${hexBg(darkAccent, 0.12)};
    --good: ${darkGoodColor};
    --good-bg: ${hexBg(darkGoodColor, 0.12)};
    --again: ${darkAgainColor};
    --again-bg: ${hexBg(darkAgainColor, 0.12)};
    ${catColorVars(true)}
  }

  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem 4rem;
  }

  header { text-align: center; margin-bottom: 2.5rem; }
  header h1 {
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 600;
    letter-spacing: -0.03em;
    color: var(--text);
  }
  header h1 span { color: var(--accent); }
  header p { margin-top: 0.4rem; font-size: 0.9rem; color: var(--text-muted); }

  .wrapper { width: 100%; max-width: 640px; }

  .progress-row { display: flex; align-items: center; gap: 12px; margin-bottom: 1.25rem; }
  .progress-track { flex: 1; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.4s ease; width: 0%; }
  .progress-label { font-size: 12px; color: var(--text-dim); font-family: var(--mono); white-space: nowrap; }

  .tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .tab {
    padding: 5px 13px; border-radius: 20px; font-size: 12px; font-family: var(--mono);
    border: 1px solid var(--border); background: transparent; color: var(--text-muted);
    cursor: pointer; transition: all 0.15s;
  }
  .tab:hover { border-color: var(--border-hover); color: var(--text); }
  ${tabStyles}
  .tab.active-All { background: rgba(240,238,232,0.08); color: var(--text); border-color: rgba(240,238,232,0.3); }

  .card-scene { perspective: 1000px; height: 280px; margin-bottom: 1.25rem; cursor: pointer; }
  .card-inner {
    width: 100%; height: 100%; position: relative;
    transform-style: preserve-3d; transition: transform 0.45s cubic-bezier(0.4,0,0.2,1);
  }
  .card-inner.flipped { transform: rotateY(180deg); }

  .card-face {
    position: absolute; inset: 0; backface-visibility: hidden; border-radius: var(--radius);
    border: 1px solid var(--border); background: var(--surface);
    display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem;
  }
  .card-back {
    transform: rotateY(180deg); justify-content: flex-start; align-items: flex-start;
    overflow-y: auto; padding: 1.5rem; gap: 0;
  }

  .card-hint {
    font-size: 11px; font-family: var(--mono); color: var(--text-dim);
    letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1rem;
  }
  .card-term {
    font-size: clamp(1.1rem, 3vw, 1.5rem); font-weight: 600; letter-spacing: -0.02em;
    text-align: center; line-height: 1.3; color: var(--text);
  }
  .badge {
    margin-top: 1rem; font-size: 11px; font-family: var(--mono);
    padding: 3px 10px; border-radius: 20px; border: 1px solid;
  }
  ${badgeStyles}

  .back-label {
    font-size: 11px; font-family: var(--mono); color: var(--text-dim);
    letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.75rem;
  }
  .back-desc { font-size: 14px; line-height: 1.65; color: var(--text); margin-bottom: 1rem; }
  .back-code {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    padding: 0.85rem 1rem; font-family: var(--mono); font-size: 12.5px; line-height: 1.6;
    color: var(--code-text); white-space: pre; overflow-x: auto;
  }

  .tap-hint {
    text-align: center; font-size: 12px; color: var(--text-dim);
    font-family: var(--mono); margin-bottom: 1rem; height: 18px;
  }
  .btn-row { display: flex; gap: 10px; justify-content: center; margin-bottom: 1rem; }
  .btn {
    padding: 9px 22px; border-radius: 8px; font-family: var(--sans); font-size: 14px;
    font-weight: 500; cursor: pointer; transition: all 0.15s;
    border: 1px solid var(--border); background: transparent; color: var(--text-muted);
  }
  .btn:hover { background: var(--surface2); color: var(--text); }
  .btn-again { border-color: rgba(204,52,45,0.4); color: var(--again); }
  .btn-again:hover { background: var(--again-bg); }
  .btn-gotit { border-color: rgba(58,138,90,0.4); color: var(--good); }
  .btn-gotit:hover { background: var(--good-bg); }
  .btn-reset { font-size: 13px; }

  .stats {
    display: flex; justify-content: center; gap: 2rem; font-size: 12px;
    color: var(--text-dim); font-family: var(--mono);
  }
  .stats span b { color: var(--text-muted); font-weight: 500; }

  .theme-toggle {
    position: fixed; top: 16px; right: 16px; width: 36px; height: 36px;
    border-radius: 50%; border: 1px solid var(--border); background: var(--surface);
    color: var(--text-muted); cursor: pointer; display: flex; align-items: center;
    justify-content: center; font-size: 18px; transition: all 0.2s; z-index: 10;
  }
  .theme-toggle:hover { border-color: var(--border-hover); color: var(--text); }
  `;
  document.head.appendChild(style);

  // ── Inject HTML ──
  const catNames = Object.keys(CFG.categories);
  const subtitle = CFG.cards.length + ' cards \u00B7 ' + catNames.join(' \u00B7 ');

  document.body.innerHTML = `
    <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme"></button>
    <header>
      <h1>${CFG.title}</h1>
      <p>${subtitle}</p>
    </header>
    <div class="wrapper">
      <div class="progress-row">
        <div class="progress-track"><div class="progress-fill" id="prog"></div></div>
        <div class="progress-label" id="prog-label">0 / 0</div>
      </div>
      <div class="tabs" id="tabs"></div>
      <div class="card-scene" id="cardScene">
        <div class="card-inner" id="cardInner">
          <div class="card-face" id="cardFront">
            <div class="card-hint">tap to reveal</div>
            <div class="card-term" id="frontTerm"></div>
            <div class="badge" id="frontBadge"></div>
          </div>
          <div class="card-face card-back" id="cardBack">
            <div class="back-label">answer</div>
            <div class="back-desc" id="backDesc"></div>
            <div class="back-code" id="backCode"></div>
          </div>
        </div>
      </div>
      <div class="tap-hint" id="tapHint">tap the card to flip</div>
      <div class="btn-row" id="btnRow" style="display:none"></div>
      <div class="stats">
        <span><b id="sDone">0</b> done</span>
        <span><b id="sGot">0</b> got it</span>
        <span><b id="sLeft">0</b> left</span>
      </div>
    </div>
  `;

  // ── Theme toggle ──
  const themeKey = CFG.storagePrefix + '-theme';
  const saved = localStorage.getItem(themeKey);
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  const themeBtn = document.getElementById('themeToggle');
  function updateIcon() {
    themeBtn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }
  updateIcon();
  themeBtn.addEventListener('click', function () {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(themeKey, 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(themeKey, 'dark');
    }
    updateIcon();
  });

  // ── Flashcard logic ──
  const ALL = CFG.cards;
  const STORAGE_KEY = CFG.storagePrefix + '-gotit';

  function loadGotIt() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return new Set(Array.isArray(s) ? s : []);
    } catch { return new Set(); }
  }
  function saveGotIt() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...gotIt]));
  }

  let category = 'All';
  let deck = [];
  let gotIt = loadGotIt();
  let current = 0;
  let flipped = false;

  function categories() {
    return ['All', ...new Set(ALL.map(c => c.cat))];
  }

  function buildDeck() {
    deck = (category === 'All' ? ALL : ALL.filter(c => c.cat === category))
      .filter(c => !gotIt.has(c.term))
      .sort(() => Math.random() - 0.5);
    current = 0;
  }

  function renderTabs() {
    document.getElementById('tabs').innerHTML = categories().map(c => {
      const active = c === category ? ` active-${catKey(c)}` : '';
      const label = CFG.categoryLabels?.[c] || c;
      return `<button class="tab${active}" onclick="window._fc_setCategory('${c.replace(/'/g, "\\'")}')">${label}</button>`;
    }).join('');
  }

  window._fc_setCategory = function (c) {
    category = c; buildDeck(); renderTabs(); showCard();
  };

  function updateStats() {
    const pool = category === 'All' ? ALL : ALL.filter(c => c.cat === category);
    const relevant = [...gotIt].filter(t => pool.some(c => c.term === t)).length;
    const pct = pool.length ? (relevant / pool.length) * 100 : 0;
    document.getElementById('prog').style.width = pct + '%';
    document.getElementById('prog-label').textContent = relevant + ' / ' + pool.length;
    document.getElementById('sDone').textContent = relevant;
    document.getElementById('sGot').textContent = relevant;
    document.getElementById('sLeft').textContent = deck.length;
  }

  function showCard() {
    flipped = false;
    document.getElementById('cardInner').classList.remove('flipped');
    document.getElementById('tapHint').textContent = 'tap the card to flip';
    document.getElementById('btnRow').style.display = 'none';
    document.getElementById('cardScene').onclick = flipCard;
    updateStats();

    if (deck.length === 0) {
      document.getElementById('frontTerm').innerHTML = '<span style="color:var(--good)">all done!</span>';
      document.getElementById('frontBadge').style.display = 'none';
      document.getElementById('tapHint').textContent = '';
      document.getElementById('cardScene').onclick = null;
      document.getElementById('btnRow').innerHTML = '<button class="btn btn-reset" onclick="window._fc_reset()">\u21BA study again</button>';
      document.getElementById('btnRow').style.display = 'flex';
      return;
    }

    const card = deck[current % deck.length];
    document.getElementById('frontTerm').textContent = card.term;
    const badge = document.getElementById('frontBadge');
    badge.textContent = card.cat;
    badge.className = 'badge badge-' + catKey(card.cat);
    badge.style.display = '';
    document.getElementById('backDesc').textContent = card.desc;
    const codeEl = document.getElementById('backCode');
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
    document.getElementById('btnRow').innerHTML =
      '<button class="btn btn-again" onclick="window._fc_mark(false)">study again</button>' +
      ' <button class="btn btn-gotit" onclick="window._fc_mark(true)">got it</button>';
    document.getElementById('btnRow').style.display = 'flex';
  }

  window._fc_mark = function (known) {
    const card = deck[current % deck.length];
    if (known) {
      gotIt.add(card.term);
      saveGotIt();
      deck.splice(current % deck.length, 1);
    } else {
      deck.splice(current % deck.length, 1);
      deck.push(card);
      current = current % Math.max(deck.length, 1);
    }
    showCard();
  };

  window._fc_reset = function () {
    gotIt.clear(); saveGotIt(); buildDeck(); showCard();
  };

  renderTabs(); buildDeck(); showCard();
})();
