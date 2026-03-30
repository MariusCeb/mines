'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFF = {
  easy:   { rows: 8,  cols: 8,  mines: 10 },
  medium: { rows: 12, cols: 12, mines: 22 },
  hard:   { rows: 16, cols: 16, mines: 40 },
};

const CDN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/';
const IMG = {
  bomb: `<img src="${CDN}1f4a3.svg" alt="💣" draggable="false">`,
  flag: `<img src="${CDN}1f6a9.svg" alt="🚩" draggable="false">`,
  win:  `<img src="${CDN}1f389.svg" alt="🎉" draggable="false">`,
  lose: `<img src="${CDN}1f4a5.svg" alt="💥" draggable="false">`,
};

// ── State ─────────────────────────────────────────────────────────────────────

const S = {
  board: [],
  rows: 8, cols: 8, mines: 10,
  diff: 'easy',
  status: 'idle',   // idle | playing | won | lost
  flagMode: false,
  minesLeft: 10,
  time: 0,
  timerId: null,
  firstMove: true,
};

// ── Board logic ───────────────────────────────────────────────────────────────

function createBoard(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
      isHit: false,
    }))
  );
}

function placeMines(board, rows, cols, count, safeR, safeC) {
  // Safe zone: first-clicked cell + its 8 neighbours
  const forbidden = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const r = safeR + dr, c = safeC + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols)
        forbidden.add(r * cols + c);
    }

  const pool = [];
  for (let i = 0; i < rows * cols; i++)
    if (!forbidden.has(i)) pool.push(i);

  // Partial Fisher-Yates: select `count` positions uniformly at random
  const take = Math.min(count, pool.length);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (let i = 0; i < take; i++) {
    board[Math.floor(pool[i] / cols)][pool[i] % cols].isMine = true;
  }
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

// Iterative BFS flood-reveal for zero cells
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
  let revealed = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (board[r][c].revealed) revealed++;
  return revealed === rows * cols - mines;
}

// ── Game actions ──────────────────────────────────────────────────────────────

function newGame(diff) {
  stopTimer();
  const { rows, cols, mines } = DIFF[diff];
  S.board     = createBoard(rows, cols);
  S.rows      = rows;
  S.cols      = cols;
  S.mines     = mines;
  S.diff      = diff;
  S.status    = 'idle';
  S.minesLeft = mines;
  S.time      = 0;
  S.timerId   = null;
  S.firstMove = true;
  S.flagMode  = false;
  document.getElementById('flag-toggle').checked = false;
  render();
}

function reveal(r, c) {
  if (S.status === 'won' || S.status === 'lost') return;
  const cell = S.board[r][c];
  if (cell.revealed || cell.flagged) return;

  // First tap: now place mines (guaranteeing safe first click)
  if (S.firstMove) {
    S.firstMove = false;
    placeMines(S.board, S.rows, S.cols, S.mines, r, c);
    calcAdjacent(S.board, S.rows, S.cols);
    S.status = 'playing';
    startTimer();
  }

  if (cell.isMine) {
    cell.revealed = true;
    cell.isHit    = true;
    S.status      = 'lost';
    stopTimer();
    // Reveal all other mines
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
    render();
    setTimeout(() => showOverlay(true), 350);
    return;
  }

  renderBoard();
  updateStats();
}

function toggleFlag(r, c) {
  if (S.status === 'won' || S.status === 'lost') return;
  if (S.firstMove) return; // no flagging before game starts
  const cell = S.board[r][c];
  if (cell.revealed) return;
  cell.flagged  = !cell.flagged;
  S.minesLeft  += cell.flagged ? -1 : 1;
  renderBoard();
  updateStats();
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer() {
  S.timerId = setInterval(() => {
    S.time = Math.min(S.time + 1, 999);
    document.getElementById('timer-val').textContent = S.time;
  }, 1000);
}

function stopTimer() {
  clearInterval(S.timerId);
  S.timerId = null;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function render() {
  renderBoard();
  updateStats();
}

function updateStats() {
  document.getElementById('mines-left').textContent = S.minesLeft;
  document.getElementById('timer-val').textContent  = S.time;
}

function renderBoard() {
  const boardEl = document.getElementById('board');

  // Gap scales with density
  const gap = S.cols <= 8 ? 4 : S.cols <= 12 ? 3 : 2;
  boardEl.style.setProperty('--cols', S.cols);
  boardEl.style.setProperty('--gap', `${gap}px`);

  // Compute font size from actual cell pixel width
  const wrapW = document.getElementById('board-wrap').offsetWidth
              || Math.min(window.innerWidth, 480) - 32;
  const cellW  = (wrapW - (S.cols - 1) * gap) / S.cols;
  boardEl.style.setProperty('--cell-font', `${Math.max(9, Math.floor(cellW * 0.47))}px`);

  const frag = document.createDocumentFragment();
  for (let r = 0; r < S.rows; r++)
    for (let c = 0; c < S.cols; c++)
      frag.appendChild(buildCell(S.board[r][c], r, c));

  boardEl.innerHTML = '';
  boardEl.appendChild(frag);
}

function buildCell(cell, r, c) {
  const el       = document.createElement('button');
  el.className   = 'cell';
  el.dataset.r   = r;
  el.dataset.c   = c;
  el.disabled    = cell.revealed && !cell.isMine; // prevent re-tapping open cells

  if (cell.revealed) {
    el.classList.add('revealed');
    if (cell.isMine) {
      el.classList.add(cell.isHit ? 'mine-hit' : 'mine-show');
      el.innerHTML = IMG.bomb;
    } else if (cell.adjacent > 0) {
      el.classList.add(`n${cell.adjacent}`);
      el.textContent = cell.adjacent;
    }
  } else if (cell.flagged) {
    el.innerHTML = IMG.flag;
  }

  return el;
}

function showOverlay(won) {
  document.getElementById('ov-emoji').innerHTML = won ? IMG.win : IMG.lose;
  document.getElementById('ov-title').textContent = won ? 'You won' : 'Game over';
  document.getElementById('ov-sub').textContent   = won
    ? `${S.diff} · ${S.time}s`
    : 'Better luck next time';
  document.getElementById('overlay').classList.remove('hidden');
}

function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}

// ── Input ─────────────────────────────────────────────────────────────────────

function setupEvents() {
  const boardEl = document.getElementById('board');

  // Long-press to flag
  let lpTimer = null, lpFired = false, lpX = 0, lpY = 0;

  boardEl.addEventListener('pointerdown', e => {
    const el = e.target.closest('.cell');
    if (!el) return;
    lpFired = false;
    lpX = e.clientX;
    lpY = e.clientY;
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
    const r = +el.dataset.r, c = +el.dataset.c;
    S.flagMode ? toggleFlag(r, c) : reveal(r, c);
  });

  boardEl.addEventListener('contextmenu', e => e.preventDefault());

  // Flag toggle switch
  document.getElementById('flag-toggle').addEventListener('change', e => {
    S.flagMode = e.target.checked;
  });

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      hideOverlay();
      newGame(btn.dataset.diff);
    });
  });

  // Restart
  document.getElementById('restart-btn').addEventListener('click', () => {
    hideOverlay();
    newGame(S.diff);
  });

  // Play again
  document.getElementById('ov-btn').addEventListener('click', () => {
    hideOverlay();
    newGame(S.diff);
  });

  // Theme toggle
  const themeBtn  = document.getElementById('theme-btn');
  const metaTheme = document.getElementById('meta-theme');
  themeBtn.addEventListener('click', () => {
    const html  = document.documentElement;
    const dark  = html.dataset.theme !== 'dark';
    html.dataset.theme = dark ? 'dark' : 'light';
    themeBtn.textContent = dark ? '☀' : '🌙';
    metaTheme.content   = dark ? '#0e0e0e' : '#f2f2f7';
  });

  // Re-compute cell size on resize / orientation change
  window.addEventListener('resize', () => {
    if (S.board.length) renderBoard();
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  newGame('easy');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
