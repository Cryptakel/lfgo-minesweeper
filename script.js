// Game configuration
const config = {
    easy: { size: 9, mines: 10, name: 'Degen Starter' },
    medium: { size: 16, mines: 40, name: 'Degen Pro' },
    hard: { size: 24, mines: 99, name: 'Degen Master' }
};

let currentDifficulty = 'easy';
let gameBoard = [];
let mines = [];
let gameOver = false;
let firstClick = true;
let timer = 0;
let timerInterval;
let highscore = localStorage.getItem('highscore') || Infinity;

// DOM Elements
const gameBoardElement = document.getElementById('game-board');
const minesCountElement = document.getElementById('mines-count');
const timerElement = document.getElementById('timer');
const highscoreElement = document.getElementById('highscore');
const statusMessageElement = document.getElementById('status-message');
const reactionMessageElement = document.getElementById('reaction-message');
const difficultySelect = document.getElementById('difficulty-select');
const restartButton = document.getElementById('restart-button');

// Initialize game
function initGame() {
    const { size, mines: mineCount } = config[currentDifficulty];
    gameBoard = Array(size).fill().map(() => Array(size).fill(0));
    mines = [];
    gameOver = false;
    firstClick = true;
    timer = 0;
    clearInterval(timerInterval);
    updateTimer();
    updateMinesCount(mineCount);
    createBoard(size);
    updateHighscore();
}

// Create game board
function createBoard(size) {
    gameBoardElement.style.gridTemplateColumns = `repeat(${size}, 40px)`;
    gameBoardElement.innerHTML = '';
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', () => handleCellClick(i, j));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(i, j);
            });
            gameBoardElement.appendChild(cell);
        }
    }
}

// Handle cell click
function handleCellClick(row, col) {
    if (gameOver) return;
    
    if (firstClick) {
        firstClick = false;
        placeMines(row, col);
        startTimer();
    }
    
    const cell = gameBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;
    
    if (mines.some(mine => mine.row === row && mine.col === col)) {
        gameOver = true;
        revealAllMines();
        showPopup('Game Over! Better luck next time!', 'lose');
        clearInterval(timerInterval);
        return;
    }
    
    revealCell(row, col);
    checkWin();
}

// Handle right click (flag)
function handleRightClick(row, col) {
    if (gameOver) return;
    
    const cell = gameBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (cell.classList.contains('revealed')) return;
    
    if (cell.classList.contains('flagged')) {
        cell.classList.remove('flagged');
        cell.textContent = '';
        updateMinesCount(config[currentDifficulty].mines - document.querySelectorAll('.flagged').length);
    } else {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
        updateMinesCount(config[currentDifficulty].mines - document.querySelectorAll('.flagged').length);
    }
}

// Place mines
function placeMines(firstRow, firstCol) {
    const { size, mines: mineCount } = config[currentDifficulty];
    
    while (mines.length < mineCount) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        
        // Don't place mine on first click or adjacent cells
        if (Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1) continue;
        
        // Don't place duplicate mines
        if (mines.some(mine => mine.row === row && mine.col === col)) continue;
        
        mines.push({ row, col });
        gameBoard[row][col] = -1;
    }
    
    // Calculate numbers
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (gameBoard[i][j] === -1) continue;
            
            let count = 0;
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    const ni = i + di;
                    const nj = j + dj;
                    if (ni >= 0 && ni < size && nj >= 0 && nj < size && gameBoard[ni][nj] === -1) {
                        count++;
                    }
                }
            }
            gameBoard[i][j] = count;
        }
    }
}

// Reveal cell
function revealCell(row, col) {
    const { size } = config[currentDifficulty];
    const cell = gameBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (cell.classList.contains('revealed')) return;
    
    cell.classList.add('revealed');
    
    if (gameBoard[row][col] === 0) {
        // Reveal adjacent cells for empty cells
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const ni = row + di;
                const nj = col + dj;
                if (ni >= 0 && ni < size && nj >= 0 && nj < size) {
                    revealCell(ni, nj);
                }
            }
        }
    } else {
        cell.textContent = gameBoard[row][col];
        cell.dataset.number = gameBoard[row][col];
    }
}

// Reveal all mines
function revealAllMines() {
    mines.forEach(mine => {
        const cell = gameBoardElement.querySelector(`[data-row="${mine.row}"][data-col="${mine.col}"]`);
        cell.classList.add('revealed');
        cell.innerHTML = '<img src="lego-brick.png" alt="💣" class="bomb-icon">';
    });
}

// Check win condition
function checkWin() {
    const { size, mines: mineCount } = config[currentDifficulty];
    const revealedCells = document.querySelectorAll('.cell.revealed').length;
    const totalCells = size * size;
    
    if (revealedCells === totalCells - mineCount) {
        gameOver = true;
        clearInterval(timerInterval);
        
        if (timer < highscore) {
            highscore = timer;
            localStorage.setItem('highscore', highscore);
            updateHighscore();
            showPopup('New Highscore! You\'re a Degen Master!', 'win');
        } else {
            showPopup('You Won! Time to go touch some grass!', 'win');
        }
        
        // Add win animation to all cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.add('win-animation');
        });
    }
}

// Update mines count
function updateMinesCount(count) {
    minesCountElement.textContent = `Mines: ${count}`;
}

// Update timer
function updateTimer() {
    timerElement.textContent = `Time: ${timer}s`;
}

// Start timer
function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        updateTimer();
    }, 1000);
}

// Update highscore
function updateHighscore() {
    highscoreElement.textContent = `Best Time: ${highscore === Infinity ? '-' : highscore}s`;
}

// Show popup
function showPopup(message, type) {
    const popup = document.createElement('div');
    popup.className = `popup popup-${type}`;
    popup.textContent = message;
    
    const container = document.querySelector('.game-board-container');
    container.appendChild(popup);
    
    // Trigger animation
    setTimeout(() => popup.classList.add('show'), 100);
    
    // Remove popup after animation
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 500);
    }, 3000);
}

// Event Listeners
difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    initGame();
});

restartButton.addEventListener('click', initGame);

// Initialize game on load
initGame(); 