'use strict';

// ── Difficulty presets (square grids) ─────────────────────────────────────────
const DIFF = {
  easy:    { rows: 8,  cols: 8,  mines: 10 },
  medium:  { rows: 12, cols: 12, mines: 40 },
  hard:    { rows: 16, cols: 16, mines: 99 },
  extreme: { rows: 20, cols: 20, mines: 93 },
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const I = {
  mine: (s=20) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="12.5" r="6.5"/><rect x="9" y="3" width="2" height="5" rx="1"/><path d="M13.5 2L16.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="7.5" cy="10" r="1.8" fill="rgba(255,255,255,0.28)"/></svg>`,
  flag: (s=17) => `<svg width="${s}" height="${s}" viewBox="0 0 17 17" fill="currentColor"><line x1="3.5" y1="16" x2="3.5" y2="2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M3.5 2.5L14 6.5L3.5 10.5Z"/></svg>`,
  cursor:(s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3l6.5 16 2.5-5.5L17.5 11 3 3z"/></svg>`,
  gear: (s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/></svg>`,
  sun:  (s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>`,
  moon: (s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`,
  download: (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>`,
  upload:   (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>`,
};

// ── State ─────────────────────────────────────────────────────────────────────
const S = {
  board: [], rows: 8, cols: 8, mines: 10,
  diff: 'easy', status: 'idle',
  flagMode: false, minesLeft: 10,
  time: 0, timerId: null, startTs: null, firstMove: true,
};

// ── View transform (pinch-zoom + pan via CSS transform) ───────────────────────
let vZoom = 1, vPanX = 0, vPanY = 0;

function applyViewTransform() {
  document.getElementById('board-wrap').style.transform =
    `translate(${vPanX}px, ${vPanY}px) scale(${vZoom})`;
}

function clampPan() {
  const main = document.getElementById('main');
  const wrap = document.getElementById('board-wrap');
  const maxX = Math.max(0, (wrap.offsetWidth  * vZoom - main.clientWidth)  / 2);
  const maxY = Math.max(0, (wrap.offsetHeight * vZoom - main.clientHeight) / 2);
  vPanX = Math.max(-maxX, Math.min(maxX, vPanX));
  vPanY = Math.max(-maxY, Math.min(maxY, vPanY));
}

function resetView() {
  vZoom = 1; vPanX = 0; vPanY = 0;
  applyViewTransform();
}

// ── Board generation ──────────────────────────────────────────────────────────

function createBoard(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false, revealed: false, flagged: false, adjacent: 0, isHit: false,
    }))
  );
}

function placeMines(board, rows, cols, count, safeR, safeC) {
  const forbidden = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const r = safeR + dr, c = safeC + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) forbidden.add(r * cols + c);
    }
  const pool = [];
  for (let i = 0; i < rows * cols; i++) if (!forbidden.has(i)) pool.push(i);
  const take = Math.min(count, pool.length);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (let i = 0; i < take; i++)
    board[Math.floor(pool[i] / cols)][pool[i] % cols].isMine = true;
}

function calcAdjacent(board, rows, cols) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) n++;
        }
      board[r][c].adjacent = n;
    }
}

// Reveals cells via flood-fill AND returns them in BFS order (for animation).
// Each entry: { r, c, dist } where dist = BFS distance from origin.
function floodReveal(board, startR, startC, rows, cols) {
  const result = [];
  const q = [[startR, startC, 0]];
  while (q.length) {
    const [r, c, dist] = q.shift();
    const cell = board[r][c];
    if (cell.revealed || cell.flagged || cell.isMine) continue;
    cell.revealed = true;
    result.push({ r, c, dist });
    if (cell.adjacent > 0) continue;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !board[nr][nc].revealed)
          q.push([nr, nc, dist + 1]);
      }
  }
  return result;
}

function isWon(board, rows, cols, mines) {
  let rev = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (board[r][c].revealed) rev++;
  return rev === rows * cols - mines;
}

// ── Cascade animation ─────────────────────────────────────────────────────────
// Applies staggered CSS pop animation to a list of {r,c,dist} cells.
// Returns the total ms until all animations finish.
function animateCascade(cells) {
  if (!cells.length) return 0;
  const STEP = 20, CAP = 260; // 20ms per BFS level, max 260ms spread
  const boardEl = document.getElementById('board');
  // Build r,c → element map once (much faster than repeated querySelector)
  const elMap = new Map();
  boardEl.querySelectorAll('.cell').forEach(el =>
    elMap.set(`${el.dataset.r},${el.dataset.c}`, el)
  );
  let maxDelay = 0;
  cells.forEach(({ r, c, dist }) => {
    const el = elMap.get(`${r},${c}`);
    if (!el) return;
    const delay = Math.min(dist * STEP, CAP);
    maxDelay = Math.max(maxDelay, delay);
    el.style.animationDelay = `${delay}ms`;
    el.classList.add('pop');
  });
  return maxDelay + 240; // +240 = animation duration itself
}

// ── Game actions ──────────────────────────────────────────────────────────────

function newGame(diff) {
  stopTimer();
  const { rows, cols, mines } = DIFF[diff];
  Object.assign(S, {
    board: createBoard(rows, cols), rows, cols, mines, diff,
    status: 'idle', minesLeft: mines,
    time: 0, timerId: null, startTs: null,
    firstMove: true, flagMode: false,
  });
  resetView();
  document.getElementById('flag-fab').classList.remove('flag-on');
  updateFab();
  syncDiffButtons(diff);
  hideOverlay();
  render();
}

function reveal(r, c) {
  if (S.status === 'won' || S.status === 'lost') return;
  const cell = S.board[r][c];
  if (cell.revealed || cell.flagged) return;

  if (S.firstMove) {
    S.firstMove = false;
    placeMines(S.board, S.rows, S.cols, S.mines, r, c);
    calcAdjacent(S.board, S.rows, S.cols);
    S.status = 'playing';
    startTimer();
  }

  if (cell.isMine) {
    cell.revealed = true; cell.isHit = true;
    S.status = 'lost';
    stopTimer();
    recordGame(S.diff, false);
    for (let i = 0; i < S.rows; i++)
      for (let j = 0; j < S.cols; j++)
        if (S.board[i][j].isMine) S.board[i][j].revealed = true;
    render();
    setTimeout(() => showOverlay(false), 650);
    return;
  }

  const cascaded = floodReveal(S.board, r, c, S.rows, S.cols);

  if (isWon(S.board, S.rows, S.cols, S.mines)) {
    S.status = 'won';
    stopTimer();
    saveScore(S.diff, S.time);
    recordGame(S.diff, true);
    renderBoard();
    const animMs = animateCascade(cascaded);
    setTimeout(() => showOverlay(true), animMs + 80);
    return;
  }

  renderBoard();
  animateCascade(cascaded);
  updateStats();
}

function toggleFlag(r, c) {
  if (S.status === 'won' || S.status === 'lost') return;
  if (S.firstMove) return;
  const cell = S.board[r][c];
  if (cell.revealed) return;
  cell.flagged  = !cell.flagged;
  S.minesLeft  += cell.flagged ? -1 : 1;
  renderBoard(); updateStats();
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer() {
  S.startTs = performance.now();
  S.timerId = setInterval(() => {
    S.time = (performance.now() - S.startTs) / 1000;
    document.getElementById('timer-val').textContent = S.time.toFixed(2);
  }, 47);
}

function stopTimer() {
  if (S.timerId) { clearInterval(S.timerId); S.timerId = null; }
  if (S.startTs) {
    S.time = (performance.now() - S.startTs) / 1000;
    document.getElementById('timer-val').textContent = S.time.toFixed(2);
  }
}

// ── Scoreboard ────────────────────────────────────────────────────────────────

function loadScores() {
  try { return JSON.parse(localStorage.getItem('mines-scores') ?? '{}'); }
  catch { return {}; }
}

function saveScore(diff, time) {
  const sc = loadScores();
  if (!sc[diff]) sc[diff] = [];
  sc[diff].push({ time, date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' }) });
  sc[diff].sort((a, b) => a.time - b.time);
  sc[diff] = sc[diff].slice(0, 5);
  localStorage.setItem('mines-scores', JSON.stringify(sc));
}

function renderScoreboard() {
  const sc = loadScores();
  document.getElementById('scoreboard').innerHTML =
    Object.keys(DIFF).map(diff => {
      const list = sc[diff] ?? [];
      const rows = list.length
        ? list.map((e, i) =>
            `<div class="score-row">
              <span class="score-rank">${i + 1}</span>
              <span class="score-time">${e.time.toFixed(2)}s</span>
              <span class="score-date">${e.date}</span>
            </div>`).join('')
        : '<div class="score-empty">No records yet</div>';
      return `<div class="score-section"><div class="score-diff-label">${diff}</div>${rows}</div>`;
    }).join('');
}

// ── Game stats (win rate) ─────────────────────────────────────────────────────

function loadGameStats() {
  try { return JSON.parse(localStorage.getItem('mines-gamestats') ?? '{}'); }
  catch { return {}; }
}

function recordGame(diff, won) {
  const gs = loadGameStats();
  if (!gs[diff]) gs[diff] = { played: 0, won: 0 };
  gs[diff].played++;
  if (won) gs[diff].won++;
  localStorage.setItem('mines-gamestats', JSON.stringify(gs));
}

function renderStats() {
  const gs = loadGameStats();
  document.getElementById('game-stats').innerHTML =
    Object.keys(DIFF).map(diff => {
      const s = gs[diff] ?? { played: 0, won: 0 };
      const pct = s.played > 0 ? Math.round(s.won / s.played * 100) : 0;
      return `<div class="stat-row">
        <span class="stat-diff">${diff}</span>
        <span class="stat-nums">${s.won} / ${s.played}</span>
        <span class="stat-rate">${pct}%</span>
      </div>`;
    }).join('');
}

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES = {
  void:  { label: 'Void',  bg: '#0e0e0e', accent: '#ff453a' },
  chalk: { label: 'Chalk', bg: '#f2f2f7', accent: '#ff3b30' },
  ocean: { label: 'Ocean', bg: '#050d1a', accent: '#00b4d8' },
  dusk:  { label: 'Dusk',  bg: '#100820', accent: '#c084fc' },
  neon:  { label: 'Neon',  bg: '#040404', accent: '#00ff88' },
};
const THEME_ORDER = Object.keys(THEMES);

function applyTheme(id) {
  if (!THEMES[id]) id = 'void';
  document.documentElement.dataset.theme = id;
  document.getElementById('meta-theme').content = THEMES[id].bg;
  document.getElementById('theme-btn').innerHTML = id === 'chalk' ? I.moon() : I.sun();
  localStorage.setItem('mines-theme', id);
  document.querySelectorAll('.theme-swatch').forEach(b =>
    b.classList.toggle('active', b.dataset.themeId === id)
  );
}

function renderThemePicker() {
  const cur = document.documentElement.dataset.theme;
  const picker = document.getElementById('theme-picker');
  picker.innerHTML = THEME_ORDER.map(id => {
    const t = THEMES[id];
    return `<button class="theme-swatch${id === cur ? ' active' : ''}" data-theme-id="${id}">
      <span class="sw-dot" style="background:linear-gradient(135deg,${t.bg} 50%,${t.accent} 50%)"></span>
      <span class="sw-name">${t.label}</span>
    </button>`;
  }).join('');
  picker.querySelectorAll('.theme-swatch').forEach(btn =>
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeId))
  );
}

function exportScores() {
  const blob = new Blob([JSON.stringify(loadScores(), null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'mines-records.json' });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importScores(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (typeof data === 'object' && data !== null) {
        localStorage.setItem('mines-scores', JSON.stringify(data));
        renderScoreboard();
      }
    } catch { /* invalid JSON — silently ignore */ }
  };
  reader.readAsText(file);
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function render() { renderBoard(); updateStats(); }

function updateStats() {
  document.getElementById('mines-left').textContent = S.minesLeft;
  document.getElementById('timer-val').textContent  = S.time.toFixed(2);
}

// Updates only CSS layout — zero DOM changes. Safe to call every animation frame.
function sizeBoard(cs) {
  const boardEl = document.getElementById('board');
  const gap     = S.cols <= 8 ? 4 : S.cols <= 12 ? 3 : S.cols <= 16 ? 2 : 1;
  boardEl.style.setProperty('--cs',        `${cs}px`);
  boardEl.style.setProperty('--gap',       `${gap}px`);
  boardEl.style.setProperty('--cell-font', `${Math.floor(cs * 0.46)}px`);
  boardEl.style.gridTemplateColumns = `repeat(${S.cols}, ${cs}px)`;
  boardEl.style.gridTemplateRows    = `repeat(${S.rows}, ${cs}px)`;
}

function renderBoard() {
  const mainEl = document.getElementById('main');
  const gap    = S.cols <= 8 ? 4 : S.cols <= 12 ? 3 : S.cols <= 16 ? 2 : 1;
  const avW    = mainEl.clientWidth  - 28;
  const avH    = mainEl.clientHeight - 28;
  const csW    = (avW - (S.cols - 1) * gap) / S.cols;
  const csH    = (avH - (S.rows - 1) * gap) / S.rows;
  const cs     = Math.max(14, Math.floor(Math.min(csW, csH)));
  sizeBoard(cs);

  const boardEl = document.getElementById('board');
  const frag    = document.createDocumentFragment();
  for (let r = 0; r < S.rows; r++)
    for (let c = 0; c < S.cols; c++)
      frag.appendChild(buildCell(S.board[r][c], r, c));
  boardEl.innerHTML = '';
  boardEl.appendChild(frag);
}

function buildCell(cell, r, c) {
  const el = document.createElement('button');
  el.className = 'cell';
  el.dataset.r = r; el.dataset.c = c;

  if (cell.revealed) {
    el.classList.add('revealed');
    if (cell.isMine) {
      el.classList.add(cell.isHit ? 'mine-hit' : 'mine-show');
      el.innerHTML = I.mine(20); // sized by CSS via --cs
    } else if (cell.adjacent > 0) {
      el.classList.add(`n${cell.adjacent}`);
      el.textContent = cell.adjacent;
    }
  } else if (cell.flagged) {
    el.classList.add('flagged');
    el.innerHTML = I.flag(17); // sized by CSS via --cs
  }
  return el;
}

function showOverlay(won) {
  document.getElementById('ov-emoji').textContent = won ? '🏆' : '💀';
  document.getElementById('ov-title').textContent = won ? 'You won' : 'Game over';
  document.getElementById('ov-sub').textContent   = won
    ? `${S.diff} · ${S.time.toFixed(2)}s`
    : 'Better luck next time';
  document.getElementById('overlay').classList.remove('hidden');
}
function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}

// ── Settings sheet ────────────────────────────────────────────────────────────

function openSheet() {
  syncDiffButtons(S.diff);
  renderScoreboard();
  renderStats();
  renderThemePicker();
  document.getElementById('settings-sheet').classList.add('open');
  document.getElementById('sheet-backdrop').classList.add('open');
}
function closeSheet() {
  document.getElementById('settings-sheet').classList.remove('open');
  document.getElementById('sheet-backdrop').classList.remove('open');
}
function syncDiffButtons(diff) {
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.diff === diff)
  );
}

// ── Draggable flag FAB ────────────────────────────────────────────────────────

const FAB_POS = { left: 20, bottom: 90 }; // default: bottom-left, above safe area
let fabDragging = false, fabMoved = false;
let fabSX = 0, fabSY = 0, fabSL = 0, fabSB = 0;

function clampFab() {
  const app   = document.getElementById('app');
  const fab   = document.getElementById('flag-fab');
  const maxL  = app.offsetWidth  - fab.offsetWidth  - 8;
  const maxB  = app.offsetHeight - fab.offsetHeight - 8;
  FAB_POS.left   = Math.max(8, Math.min(maxL, FAB_POS.left));
  FAB_POS.bottom = Math.max(8, Math.min(maxB, FAB_POS.bottom));
  fab.style.left   = `${FAB_POS.left}px`;
  fab.style.bottom = `${FAB_POS.bottom}px`;
}

function updateFab() {
  const fab = document.getElementById('flag-fab');
  fab.classList.toggle('flag-on', S.flagMode);
  document.getElementById('fab-icon').innerHTML = S.flagMode ? I.flag(24) : I.cursor(24);
}

function setupFab() {
  const fab = document.getElementById('flag-fab');
  clampFab();

  fab.addEventListener('pointerdown', e => {
    fabDragging = true; fabMoved = false;
    fabSX = e.clientX; fabSY = e.clientY;
    fabSL = FAB_POS.left; fabSB = FAB_POS.bottom;
    fab.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  fab.addEventListener('pointermove', e => {
    if (!fabDragging) return;
    const dx = e.clientX - fabSX;
    const dy = e.clientY - fabSY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) fabMoved = true;
    FAB_POS.left   = fabSL + dx;
    FAB_POS.bottom = fabSB - dy;  // inverted: drag down → bottom decreases
    clampFab();
  });

  fab.addEventListener('pointerup', () => {
    fabDragging = false;
    if (!fabMoved) {
      S.flagMode = !S.flagMode;
      updateFab();
    }
  });

  fab.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      S.flagMode = !S.flagMode; updateFab();
    }
  });
}

// ── Pinch-to-zoom + pan (CSS transform) ──────────────────────────────────────

function setupPinch() {
  const main = document.getElementById('main');

  let pinching = false, panning = false, wasPinch = false;
  let dist0 = 0, zoom0 = 1, panX0 = 0, panY0 = 0;
  let mainCX = 0, mainCY = 0, mid0X = 0, mid0Y = 0;
  let panTX = 0, panTY = 0, panVX0 = 0, panVY0 = 0;
  let lastTap = 0;

  main.addEventListener('touchstart', e => {
    const t = e.touches;
    if (t.length >= 2) {
      cancelLP();
      pinching = true; panning = false; wasPinch = true;
      lastTap = 0; // prevent false double-tap when fingers lift off
      dist0 = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      zoom0 = vZoom; panX0 = vPanX; panY0 = vPanY;
      const r = main.getBoundingClientRect();
      mainCX = r.left + r.width  / 2;
      mainCY = r.top  + r.height / 2;
      mid0X = (t[0].clientX + t[1].clientX) / 2;
      mid0Y = (t[0].clientY + t[1].clientY) / 2;
    } else if (t.length === 1) {
      if (!pinching) wasPinch = false; // fresh single-touch gesture
      if (vZoom > 1.05) {
        panning = true;
        panTX = t[0].clientX; panTY = t[0].clientY;
        panVX0 = vPanX; panVY0 = vPanY;
      }
    }
  }, { passive: true });

  main.addEventListener('touchmove', e => {
    const t = e.touches;
    if (pinching && t.length >= 2) {
      e.preventDefault();
      const d = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      const newZoom = Math.max(1, Math.min(6, zoom0 * d / dist0));
      const midX = (t[0].clientX + t[1].clientX) / 2;
      const midY = (t[0].clientY + t[1].clientY) / 2;
      // Adjust pan so the point under the pinch centre stays fixed on screen
      const ratio = newZoom / zoom0;
      vZoom = newZoom;
      vPanX = midX - mainCX - (mid0X - mainCX - panX0) * ratio;
      vPanY = midY - mainCY - (mid0Y - mainCY - panY0) * ratio;
      clampPan();
      applyViewTransform();
    } else if (panning && !pinching && t.length === 1) {
      e.preventDefault();
      vPanX = panVX0 + (t[0].clientX - panTX);
      vPanY = panVY0 + (t[0].clientY - panTY);
      clampPan();
      applyViewTransform();
    }
  }, { passive: false });

  main.addEventListener('touchend', e => {
    const t = e.touches;
    if (t.length < 2) pinching = false;
    if (t.length === 0) {
      panning = false;
      if (vZoom < 1.08) resetView();
      // double-tap to reset zoom — only for single-touch taps, not pinch lift-off
      if (!wasPinch && !e.target.closest('.cell')) {
        const now = Date.now();
        if (now - lastTap < 300) resetView();
        lastTap = now;
      }
      wasPinch = false;
    }
  }, { passive: true });
}

// ── Input wiring ──────────────────────────────────────────────────────────────

let _lpTimer = null;
function cancelLP() { clearTimeout(_lpTimer); _lpTimer = null; }

function setupEvents() {
  const boardEl = document.getElementById('board');

  // Board tap + long-press to flag
  let lpFired = false, lpX = 0, lpY = 0;

  boardEl.addEventListener('pointerdown', e => {
    const el = e.target.closest('.cell');
    if (!el) return;
    lpFired = false; lpX = e.clientX; lpY = e.clientY;
    _lpTimer = setTimeout(() => {
      lpFired = true;
      navigator.vibrate?.(28);
      toggleFlag(+el.dataset.r, +el.dataset.c);
    }, 380);
  });

  boardEl.addEventListener('pointerup',     cancelLP);
  boardEl.addEventListener('pointercancel', cancelLP);
  boardEl.addEventListener('pointermove', e => {
    if (Math.abs(e.clientX - lpX) > 8 || Math.abs(e.clientY - lpY) > 8) cancelLP();
  });
  boardEl.addEventListener('click', e => {
    if (lpFired) { lpFired = false; return; }
    const el = e.target.closest('.cell');
    if (!el) return;
    S.flagMode
      ? toggleFlag(+el.dataset.r, +el.dataset.c)
      : reveal(+el.dataset.r, +el.dataset.c);
  });
  boardEl.addEventListener('contextmenu', e => e.preventDefault());

  // Gear
  document.getElementById('gear-btn').addEventListener('click', openSheet);
  document.getElementById('sheet-backdrop').addEventListener('click', closeSheet);

  // Difficulty
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // New game
  document.getElementById('new-game-btn').addEventListener('click', () => {
    const active = document.querySelector('.diff-btn.active');
    closeSheet();
    newGame(active?.dataset.diff ?? S.diff);
  });

  // Play again
  document.getElementById('ov-btn').addEventListener('click', () => {
    hideOverlay(); newGame(S.diff);
  });

  // Export / Import
  document.getElementById('export-btn').addEventListener('click', exportScores);
  document.getElementById('import-input').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) { importScores(file); e.target.value = ''; }
  });

  // Theme (header button — cycles through themes)
  document.getElementById('theme-btn').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme;
    applyTheme(THEME_ORDER[(THEME_ORDER.indexOf(cur) + 1) % THEME_ORDER.length]);
  });

  // Resize
  window.addEventListener('resize', () => { if (S.board.length) renderBoard(); });
}

// ── Static icon injection ─────────────────────────────────────────────────────

function injectIcons() {
  document.getElementById('stat-mines').insertAdjacentHTML('afterbegin', I.mine(18));
  document.getElementById('gear-btn').innerHTML    = I.gear();
  document.getElementById('theme-btn').innerHTML   = I.sun();
  document.getElementById('export-btn').innerHTML  = I.download();
  document.getElementById('import-label').insertAdjacentHTML('afterbegin', I.upload());
}

// ── Draggable settings sheet handle ──────────────────────────────────────────

function setupSheetDrag() {
  const sheet    = document.getElementById('settings-sheet');
  const handle   = document.getElementById('sheet-handle');
  const backdrop = document.getElementById('sheet-backdrop');
  const EASE = 'transform .28s cubic-bezier(.32,0,.15,1)';
  const THRESHOLD = 80;

  let dragging = false, startY = 0, dragY = 0;

  handle.addEventListener('pointerdown', e => {
    if (!sheet.classList.contains('open')) return;
    dragging = true; dragY = 0;
    startY = e.clientY;
    sheet.style.transition = 'none';
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    dragY = Math.max(0, e.clientY - startY);
    sheet.style.transform = `translateX(-50%) translateY(${dragY}px)`;
  });

  handle.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    if (dragY > THRESHOLD) {
      // animate out from current drag position, then clean up
      sheet.style.transition = EASE;
      sheet.style.transform = 'translateX(-50%) translateY(102%)';
      setTimeout(() => {
        sheet.style.transition = 'none';
        sheet.style.transform = '';
        sheet.classList.remove('open');
        backdrop.classList.remove('open');
        requestAnimationFrame(() => { sheet.style.transition = ''; });
      }, 290);
    } else {
      // snap back open
      sheet.style.transition = EASE;
      sheet.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => { sheet.style.transition = ''; sheet.style.transform = ''; }, 290);
    }
  });

  handle.addEventListener('pointercancel', () => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = EASE;
    sheet.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => { sheet.style.transition = ''; sheet.style.transform = ''; }, 290);
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injectIcons();
  applyTheme(localStorage.getItem('mines-theme') ?? 'void');
  setupEvents();
  setupFab();
  setupPinch();
  setupSheetDrag();

  requestAnimationFrame(() => {
    newGame('easy');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  });
});
