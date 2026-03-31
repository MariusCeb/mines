'use strict';

// ── Accent colour palette ─────────────────────────────────────────────────────
const COLORS = [
  { name: 'blue',   dark: '#0a84ff', light: '#007aff' },
  { name: 'green',  dark: '#30d158', light: '#34c759' },
  { name: 'orange', dark: '#ff9f0a', light: '#ff9500' },
  { name: 'purple', dark: '#bf5af2', light: '#af52de' },
  { name: 'pink',   dark: '#ff375f', light: '#ff2d55' },
  { name: 'teal',   dark: '#40c8e0', light: '#32ade6' },
];

// ── Difficulty presets (square grids) ─────────────────────────────────────────
const DIFF = {
  easy:    { rows: 8,  cols: 8,  mines: 10  },
  medium:  { rows: 12, cols: 12, mines: 22  },
  hard:    { rows: 16, cols: 16, mines: 40  },
  extreme: { rows: 20, cols: 20, mines: 90  },  // tiny cells — use pinch to zoom
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
  zoomCs: null,   // null = auto-compute, number = user pinch override
  _lastCs: 20,    // last computed cell size (for pinch reference)
};

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
    firstMove: true, flagMode: false, zoomCs: null,
  });
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

// ── Accent colour ─────────────────────────────────────────────────────────────

function applyAccent(idx) {
  const isDark = document.documentElement.dataset.theme !== 'light';
  const c = COLORS[idx];
  document.documentElement.style.setProperty('--accent', isDark ? c.dark : c.light);
  localStorage.setItem('mines-accent', String(idx));
  document.querySelectorAll('.swatch').forEach((s, i) =>
    s.classList.toggle('active', i === idx)
  );
}

function initSwatches() {
  const saved = parseInt(localStorage.getItem('mines-accent') ?? '0');
  const wrap  = document.getElementById('color-swatches');
  const isDark = document.documentElement.dataset.theme !== 'light';
  wrap.innerHTML = COLORS.map((c, i) =>
    `<button class="swatch${i === saved ? ' active' : ''}"
      data-idx="${i}"
      style="background:${c.dark}"
      aria-label="${c.name}"></button>`
  ).join('');
  wrap.addEventListener('click', e => {
    const btn = e.target.closest('.swatch');
    if (btn) applyAccent(parseInt(btn.dataset.idx));
  });
  // Apply saved accent now
  const c = COLORS[saved];
  document.documentElement.style.setProperty('--accent', isDark ? c.dark : c.light);
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

function renderBoard() {
  const boardEl = document.getElementById('board');
  const mainEl  = document.getElementById('main');
  const gap     = S.cols <= 8 ? 4 : S.cols <= 12 ? 3 : S.cols <= 16 ? 2 : 1;

  // Compute base cell size from available screen space
  const avW = mainEl.clientWidth  - 28;
  const avH = mainEl.clientHeight - 28;
  const csW = (avW - (S.cols - 1) * gap) / S.cols;
  const csH = (avH - (S.rows - 1) * gap) / S.rows;
  const autoCs = Math.max(10, Math.floor(Math.min(csW, csH)));

  // User pinch zoom can override auto size
  const cs = S.zoomCs !== null ? S.zoomCs : autoCs;
  S._lastCs = autoCs; // remember auto size for pinch reference

  // Board pixel dimensions
  const boardW = S.cols * cs + (S.cols - 1) * gap;
  const boardH = S.rows * cs + (S.rows - 1) * gap;

  // If board overflows, make main scrollable and align to top-left
  const overflows = boardW > mainEl.clientWidth || boardH > mainEl.clientHeight;
  mainEl.style.overflow      = overflows ? 'auto'       : 'hidden';
  mainEl.style.alignItems    = overflows ? 'flex-start' : 'center';
  mainEl.style.justifyContent = overflows ? 'flex-start' : 'center';

  boardEl.style.setProperty('--cs',        `${cs}px`);
  boardEl.style.setProperty('--gap',       `${gap}px`);
  boardEl.style.setProperty('--cell-font', `${Math.max(8, Math.floor(cs * 0.46))}px`);
  boardEl.style.gridTemplateColumns = `repeat(${S.cols}, ${cs}px)`;
  boardEl.style.gridTemplateRows    = `repeat(${S.rows}, ${cs}px)`;

  const iconSz = Math.max(9, Math.floor(cs * 0.56));
  const frag   = document.createDocumentFragment();
  for (let r = 0; r < S.rows; r++)
    for (let c = 0; c < S.cols; c++)
      frag.appendChild(buildCell(S.board[r][c], r, c, iconSz));

  boardEl.innerHTML = '';
  boardEl.appendChild(frag);
}

function buildCell(cell, r, c, iconSz) {
  const el = document.createElement('button');
  el.className = 'cell';
  el.dataset.r = r; el.dataset.c = c;

  if (cell.revealed) {
    el.classList.add('revealed');
    if (cell.isMine) {
      el.classList.add(cell.isHit ? 'mine-hit' : 'mine-show');
      el.innerHTML = I.mine(iconSz);
    } else if (cell.adjacent > 0) {
      el.classList.add(`n${cell.adjacent}`);
      el.textContent = cell.adjacent;
    }
  } else if (cell.flagged) {
    el.classList.add('flagged');
    el.innerHTML = I.flag(iconSz * 0.88);
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
  document.getElementById('fab-icon').innerHTML  = S.flagMode ? I.flag(20) : I.cursor(20);
  document.getElementById('fab-label').textContent = S.flagMode ? 'Flag' : 'Reveal';
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

// ── Pinch-to-zoom (board) ─────────────────────────────────────────────────────

function setupPinch() {
  const wrap = document.getElementById('board-wrap');
  let pinching = false, pinchDist0 = 0, pinchCs0 = 0;

  wrap.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      pinching  = true;
      pinchDist0 = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      pinchCs0 = S.zoomCs ?? S._lastCs;
    }
  }, { passive: true });

  wrap.addEventListener('touchmove', e => {
    if (!pinching || e.touches.length < 2) return;
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    const newCs = Math.max(8, Math.min(80, Math.round(pinchCs0 * dist / pinchDist0)));
    if (newCs !== S.zoomCs) {
      S.zoomCs = newCs;
      renderBoard();
    }
  }, { passive: true });

  wrap.addEventListener('touchend', e => {
    if (e.touches.length < 2) pinching = false;
  }, { passive: true });

  // Double-tap on board background resets zoom
  let lastTap = 0;
  wrap.addEventListener('click', e => {
    if (e.target !== wrap && e.target !== document.getElementById('board')) return;
    const now = Date.now();
    if (now - lastTap < 280) { S.zoomCs = null; renderBoard(); }
    lastTap = now;
  });
}

// ── Input wiring ──────────────────────────────────────────────────────────────

function setupEvents() {
  const boardEl = document.getElementById('board');

  // Board tap + long-press to flag
  let lpTimer = null, lpFired = false, lpX = 0, lpY = 0;

  boardEl.addEventListener('pointerdown', e => {
    const el = e.target.closest('.cell');
    if (!el) return;
    lpFired = false; lpX = e.clientX; lpY = e.clientY;
    lpTimer = setTimeout(() => {
      lpFired = true;
      navigator.vibrate?.(28);
      toggleFlag(+el.dataset.r, +el.dataset.c);
    }, 380);
  });

  const cancelLP = () => clearTimeout(lpTimer);
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

  // Theme (header button)
  const themeBtnH = document.getElementById('theme-btn');
  const metaTheme = document.getElementById('meta-theme');
  const themeToggle = document.getElementById('theme-toggle');

  function applyTheme(light) {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    themeBtnH.innerHTML = light ? I.moon() : I.sun();
    metaTheme.content   = light ? '#f2f2f7' : '#0e0e0e';
    themeToggle.checked = light;
    // Re-apply accent with correct light/dark variant
    const idx = parseInt(localStorage.getItem('mines-accent') ?? '0');
    const c   = COLORS[idx];
    document.documentElement.style.setProperty('--accent', light ? c.light : c.dark);
  }
  themeBtnH.addEventListener('click', () =>
    applyTheme(document.documentElement.dataset.theme !== 'light')
  );
  themeToggle.addEventListener('change', e => applyTheme(e.target.checked));

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

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injectIcons();
  initSwatches();
  setupEvents();
  setupFab();
  setupPinch();

  requestAnimationFrame(() => {
    newGame('easy');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  });
});
