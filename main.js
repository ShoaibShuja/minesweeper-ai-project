// --- Minesweeper Game Logic ---
const difficulties = {
    easy: { rows: 8, cols: 8, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 25 },
    hard: { rows: 16, cols: 16, mines: 50 }
};
let board = [], revealed = [], flagged = [], gameOver = false, score = 0, startTime = null, timer = null;
let currentDifficulty = 'easy';

const boardDiv = document.getElementById('minesweeper-board');
const currentScoreDiv = document.getElementById('current-score');
const highScoreDiv = document.getElementById('high-score');
const lastScoresUl = document.getElementById('last-scores');
const themeToggle = document.getElementById('theme-toggle');
const restartBtn = document.getElementById('restart');
const difficultySelect = document.getElementById('difficulty');

function saveScores(newScore) {
    let scores = JSON.parse(localStorage.getItem('minesweeper_scores') || '[]');
    scores.unshift(newScore);
    if (scores.length > 10) scores = scores.slice(0, 10);
    localStorage.setItem('minesweeper_scores', JSON.stringify(scores));
    let high = Math.max(...scores, parseInt(localStorage.getItem('minesweeper_highscore') || '0'));
    localStorage.setItem('minesweeper_highscore', high);
}
function loadScores() {
    let scores = JSON.parse(localStorage.getItem('minesweeper_scores') || '[]');
    let high = parseInt(localStorage.getItem('minesweeper_highscore') || '0');
    highScoreDiv.textContent = 'High Score: ' + high;
    lastScoresUl.innerHTML = '';
    scores.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        lastScoresUl.appendChild(li);
    });
}
function startGame() {
    const { rows, cols, mines } = difficulties[currentDifficulty];
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
    gameOver = false;
    score = 0;
    currentScoreDiv.textContent = 'Current Score: 0';
    boardDiv.innerHTML = '';
    boardDiv.style.setProperty('--cols', cols);
    // Place mines
    let placed = 0;
    while (placed < mines) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if (board[r][c] !== 'M') {
            board[r][c] = 'M';
            placed++;
        }
    }
    // Fill numbers
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 'M') continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === 'M') count++;
                }
            }
            board[r][c] = count;
        }
    }
    // Render
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.addEventListener('click', onCellClick);
            cell.addEventListener('contextmenu', onCellRightClick);
            boardDiv.appendChild(cell);
        }
    }
    startTime = Date.now();
    loadScores();
}
function onCellClick(e) {
    if (gameOver) return;
    const r = +this.dataset.r, c = +this.dataset.c;
    if (revealed[r][c] || flagged[r][c]) return;
    revealCell(r, c);
    checkWin();
}
function onCellRightClick(e) {
    e.preventDefault();
    if (gameOver) return;
    const r = +this.dataset.r, c = +this.dataset.c;
    if (revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    this.classList.toggle('flagged', flagged[r][c]);
    this.textContent = flagged[r][c] ? '🚩' : '';
}
function revealCell(r, c) {
    const { rows, cols } = difficulties[currentDifficulty];
    if (r < 0 || r >= rows || c < 0 || c >= cols || revealed[r][c] || flagged[r][c]) return;
    const cell = boardDiv.children[r * cols + c];
    revealed[r][c] = true;
    cell.classList.add('revealed');
    if (board[r][c] === 'M') {
        cell.classList.add('mine');
        cell.textContent = '💣';
        endGame(false);
        return;
    } else if (board[r][c] > 0) {
        cell.textContent = board[r][c];
        score++;
    } else {
        cell.textContent = '';
        score++;
        // Reveal neighbors
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr !== 0 || dc !== 0) revealCell(r + dr, c + dc);
            }
        }
    }
    currentScoreDiv.textContent = 'Current Score: ' + score;
}
function endGame(won) {
    gameOver = true;
    // Reveal all mines
    const { rows, cols } = difficulties[currentDifficulty];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = boardDiv.children[r * cols + c];
            if (board[r][c] === 'M') {
                cell.classList.add('mine');
                cell.textContent = '💣';
            }
            cell.classList.add('revealed');
        }
    }
    let elapsed = Math.floor((Date.now() - startTime) / 1000);
    let finalScore = won ? score + 1000 - elapsed : score;
    setTimeout(() => {
        alert(won ? `You win! Score: ${finalScore}` : `Game Over! Score: ${finalScore}`);
        saveScores(finalScore);
        loadScores();
    }, 100);
}
function checkWin() {
    const { rows, cols, mines } = difficulties[currentDifficulty];
    let unrevealed = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!revealed[r][c] && board[r][c] !== 'M') unrevealed++;
        }
    }
    if (unrevealed === 0) {
        endGame(true);
    }
}
// --- Theme Toggle ---
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('minesweeper_theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
}
function loadTheme() {
    const saved = localStorage.getItem('minesweeper_theme') || 'light';
    setTheme(saved);
}
// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    startGame();
});
themeToggle.addEventListener('click', toggleTheme);
restartBtn.addEventListener('click', startGame);
difficultySelect.addEventListener('change', e => {
    currentDifficulty = e.target.value;
    startGame();
});
