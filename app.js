'use strict';

// ── Difficulty config ─────────────────────────────────────────────────────────
const DIFF = {
  easy:   { rows: 8,  cols: 8,  mines: 10 },
  medium: { rows: 12, cols: 12, mines: 22 },
  hard:   { rows: 16, cols: 16, mines: 40 },
};

// ── Inline SVG icons (no CDN — works offline, consistent everywhere) ──────────
// Minimal geometric style, inherits color via currentColor
const I = {
  mine: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="12.5" r="6.5"/>
    <rect x="9" y="3" width="2" height="5" rx="1"/>
    <path d="M13.5 2L16.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="7.5" cy="10" r="1.8" fill="rgba(255,255,255,0.28)"/>
  </svg>`,

  flag: (s = 17) => `<svg width="${s}" height="${s}" viewBox="0 0 17 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <line x1="3.5" y1="16" x2="3.5" y2="2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M3.5 2.5L14 6.5L3.5 10.5Z"/>
  </svg>`,

  gear: (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/>
  </svg>`,

  sun: (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
  </svg>`,

  moon: (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
  </svg>`,
};

// ── State ─────────────────────────────────────────────────────────────────────
const S = {
  board:     [],
  rows: 8, cols: 8, mines: 10,
  diff:      'easy',
  status:    'idle',     // idle | playing | won | lost
  flagMode:  false,
  minesLeft: 10,
  time:      0,          // seconds (float)
  timerId:   null,
  startTs:   null,       // performance.now() when first tap
  firstMove: true,
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
  // Exclude first-clicked cell + its 8 neighbours from mine placement
  const forbidden = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const r = safeR + dr, c = safeC + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) forbidden.add(r * cols + c);
    }

  const pool = [];
  for (let i = 0; i < rows * cols; i++) if (!forbidden.has(i)) pool.push(i);

  // Partial Fisher-Yates
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

// Iterative BFS flood-fill reveal
function floodReveal(board, startR, startC, rows, cols) {
  const q = [[startR, startC]];
  while (q.length) {
    const [r, c] = q.shift();
    const cell = board[r][c];
    if (cell.revealed || cell.flagged || cell.isMine) continue;
    cell.revealed = true;
    if (cell.adjacent > 0) continue;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !board[nr][nc].revealed)
          q.push([nr, nc]);
      }
  }
}

function isWon(board, rows, cols, mines) {
  let rev = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (board[r][c].revealed) rev++;
  return rev === rows * cols - mines;
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
  document.getElementById('flag-toggle').checked = false;
  hideOverlay();
  // Sync diff buttons
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.diff === diff)
  );
  render();
}

function reveal(r, c) {
  if (S.status === 'won' || S.status === 'lost') return;
  const cell = S.board[r][c];
  if (cell.revealed || cell.flagged) return;

  // First tap: place mines now (safe zone guaranteed)
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
    for (let i = 0; i < S.rows; i++)
      for (let j = 0; j < S.cols; j++)
        if (S.board[i][j].isMine) S.board[i][j].revealed = true;
    render();
    setTimeout(() => showOverlay(false), 650);
    return;
  }

  floodReveal(S.board, r, c, S.rows, S.cols);

  if (isWon(S.board, S.rows, S.cols, S.mines)) {
    S.status = 'won';
    stopTimer();
    saveScore(S.diff, S.time);
    render();
    setTimeout(() => showOverlay(true), 350);
    return;
  }

  renderBoard(); updateStats();
}

function toggleFlag(r, c) {
  if (S.status === 'won' || S.status === 'lost') return;
  if (S.firstMove) return; // can't flag before game begins
  const cell = S.board[r][c];
  if (cell.revealed) return;
  cell.flagged  = !cell.flagged;
  S.minesLeft  += cell.flagged ? -1 : 1;
  renderBoard(); updateStats();
}

// ── Timer (millisecond precision) ─────────────────────────────────────────────

function startTimer() {
  S.startTs = performance.now();
  S.timerId = setInterval(tickTimer, 47); // ~21fps — smooth but not excessive
}

function tickTimer() {
  S.time = (performance.now() - S.startTs) / 1000;
  document.getElementById('timer-val').textContent = S.time.toFixed(2);
}

function stopTimer() {
  if (S.timerId) {
    clearInterval(S.timerId);
    S.timerId = null;
  }
  if (S.startTs) {
    S.time = (performance.now() - S.startTs) / 1000;
    document.getElementById('timer-val').textContent = S.time.toFixed(2);
  }
}

// ── Scoreboard (localStorage) ─────────────────────────────────────────────────

function loadScores() {
  try { return JSON.parse(localStorage.getItem('mines-scores') ?? '{}'); }
  catch { return {}; }
}

function saveScore(diff, time) {
  const scores = loadScores();
  if (!scores[diff]) scores[diff] = [];
  scores[diff].push({
    time,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  });
  scores[diff].sort((a, b) => a.time - b.time);
  scores[diff] = scores[diff].slice(0, 5);
  localStorage.setItem('mines-scores', JSON.stringify(scores));
}

function renderScoreboard() {
  const scores = loadScores();
  document.getElementById('scoreboard').innerHTML =
    ['easy', 'medium', 'hard'].map(diff => {
      const list = scores[diff] ?? [];
      const rows = list.length
        ? list.map((e, i) =>
            `<div class="score-row">
              <span class="score-rank">${i + 1}</span>
              <span class="score-time">${e.time.toFixed(2)}s</span>
              <span class="score-date">${e.date}</span>
            </div>`).join('')
        : '<div class="score-empty">No records yet</div>';
      return `<div class="score-section">
        <div class="score-diff-label">${diff}</div>${rows}
      </div>`;
    }).join('');
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

  const gap = S.cols <= 8 ? 4 : S.cols <= 12 ? 3 : 2;
  // Available pixels in main (subtract padding)
  const avW = mainEl.clientWidth  - 28;
  const avH = mainEl.clientHeight - 24;
  // Cell size constrained by both dimensions
  const csW = (avW - (S.cols - 1) * gap) / S.cols;
  const csH = (avH - (S.rows - 1) * gap) / S.rows;
  const cs  = Math.max(16, Math.floor(Math.min(csW, csH)));

  boardEl.style.setProperty('--cs',        `${cs}px`);
  boardEl.style.setProperty('--gap',       `${gap}px`);
  boardEl.style.setProperty('--cell-font', `${Math.max(9, Math.floor(cs * 0.46))}px`);
  boardEl.style.gridTemplateColumns = `repeat(${S.cols}, ${cs}px)`;
  boardEl.style.gridTemplateRows    = `repeat(${S.rows}, ${cs}px)`;

  const iconSz = Math.max(10, Math.floor(cs * 0.56));

  const frag = document.createDocumentFragment();
  for (let r = 0; r < S.rows; r++)
    for (let c = 0; c < S.cols; c++)
      frag.appendChild(buildCell(S.board[r][c], r, c, iconSz));

  boardEl.innerHTML = '';
  boardEl.appendChild(frag);
}

function buildCell(cell, r, c, iconSz) {
  const el     = document.createElement('button');
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
  // Sync difficulty active state to current game
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.diff === S.diff)
  );
  renderScoreboard();
  document.getElementById('settings-sheet').classList.add('open');
  document.getElementById('sheet-backdrop').classList.add('open');
}

function closeSheet() {
  document.getElementById('settings-sheet').classList.remove('open');
  document.getElementById('sheet-backdrop').classList.remove('open');
}

// ── Event wiring ──────────────────────────────────────────────────────────────

function setupEvents() {
  // Board: tap + long-press
  const boardEl = document.getElementById('board');
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

  // Flag mode toggle
  document.getElementById('flag-toggle').addEventListener('change', e => {
    S.flagMode = e.target.checked;
  });

  // Gear button
  document.getElementById('gear-btn').addEventListener('click', openSheet);
  document.getElementById('sheet-backdrop').addEventListener('click', closeSheet);

  // Difficulty buttons (inside sheet — only change selection, don't start game)
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // New Game button (inside sheet)
  document.getElementById('new-game-btn').addEventListener('click', () => {
    const active = document.querySelector('.diff-btn.active');
    closeSheet();
    newGame(active?.dataset.diff ?? S.diff);
  });

  // Play Again (overlay)
  document.getElementById('ov-btn').addEventListener('click', () => {
    hideOverlay(); newGame(S.diff);
  });

  // Theme toggle (in sheet)
  const themeToggle = document.getElementById('theme-toggle');
  const themeBtnH   = document.getElementById('theme-btn');
  const metaTheme   = document.getElementById('meta-theme');

  function applyTheme(light) {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    themeBtnH.innerHTML  = light ? I.moon() : I.sun();
    metaTheme.content    = light ? '#f2f2f7' : '#0e0e0e';
    themeToggle.checked  = light;
  }

  themeToggle.addEventListener('change', e => applyTheme(e.target.checked));
  themeBtnH.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme !== 'light'));

  // Re-layout on resize / orientation change
  window.addEventListener('resize', () => { if (S.board.length) renderBoard(); });
}

// ── Inject static icons into header ──────────────────────────────────────────

function injectHeaderIcons() {
  // mine icon before count
  document.getElementById('stat-mines')
    .insertAdjacentHTML('afterbegin', I.mine(18));
  // flag icon inside toggle label
  document.getElementById('flag-icon-wrap').innerHTML = I.flag(16);
  // gear button
  document.getElementById('gear-btn').innerHTML  = I.gear();
  // theme button (start in dark mode → show sun)
  document.getElementById('theme-btn').innerHTML = I.sun();
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  injectHeaderIcons();
  setupEvents();
  // rAF ensures layout is computed before first renderBoard() reads clientWidth/Height
  requestAnimationFrame(() => {
    newGame('easy');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  });
});
