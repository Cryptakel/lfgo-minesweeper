// Game state
let board = [];
let mines = [];
let gameOver = false;
let firstClick = true;
let startTime;
let timerInterval;
let difficulty = 'easy';

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: { size: 9, mines: 10 },
    medium: { size: 16, mines: 40 },
    hard: { size: 24, mines: 99 }
};

// DOM Elements
const gameBoard = document.getElementById('game-board');
const minesCountDisplay = document.getElementById('mines-count');
const timerDisplay = document.getElementById('timer');
const highscoreDisplay = document.getElementById('highscore');
const statusMessage = document.getElementById('status-message');
const reactionMessage = document.getElementById('reaction-message');
const restartButton = document.getElementById('restart-button');
const difficultySelect = document.getElementById('difficulty-select');

// Initialize game
function initGame() {
    gameOver = false;
    firstClick = true;
    clearInterval(timerInterval);
    startTime = null;
    timerDisplay.textContent = 'Time: 0s';
    
    const settings = DIFFICULTY_SETTINGS[difficulty];
    minesCountDisplay.textContent = `Mines: ${settings.mines}`;
    
    createBoard(settings.size);
    placeMines(settings.mines);
    updateHighscore();
}

// Create the game board
function createBoard(size) {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${size}, 30px)`;
    gameBoard.style.gridTemplateRows = `repeat(${size}, 30px)`;
    gameBoard.style.gap = '2px';
    
    board = Array(size).fill().map(() => Array(size).fill(0));
    
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
            
            gameBoard.appendChild(cell);
        }
    }
}

// Place mines randomly
function placeMines(numMines) {
    const size = board.length;
    mines = [];
    
    while (mines.length < numMines) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        const key = `${row},${col}`;
        
        if (!mines.includes(key)) {
            mines.push(key);
            board[row][col] = -1;
        }
    }
}

// Handle cell click
function handleCellClick(row, col) {
    if (gameOver) return;
    
    if (firstClick) {
        firstClick = false;
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) {
        return;
    }
    
    if (board[row][col] === -1) {
        gameOver = true;
        revealAll();
        showGameOver();
        return;
    }
    
    revealCell(row, col);
    checkWin();
}

// Handle right click (flag)
function handleRightClick(row, col) {
    if (gameOver) return;
    
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (cell.classList.contains('revealed')) {
        return;
    }
    
    cell.classList.toggle('flagged');
    updateMinesCount();
}

// Reveal cell and its neighbors
function revealCell(row, col) {
    if (row < 0 || row >= board.length || col < 0 || col >= board.length) {
        return;
    }
    
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) {
        return;
    }
    
    cell.classList.add('revealed');
    
    if (board[row][col] === 0) {
        const neighbors = getNeighbors(row, col);
        neighbors.forEach(([r, c]) => revealCell(r, c));
    } else {
        cell.textContent = board[row][col];
    }
}

// Get neighboring cells
function getNeighbors(row, col) {
    const neighbors = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board.length) {
                neighbors.push([newRow, newCol]);
            }
        }
    }
    return neighbors;
}

// Reveal all cells
function revealAll() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (board[row][col] === -1) {
            cell.classList.add('mine');
        }
        cell.classList.add('revealed');
    });
}

// Check for win
function checkWin() {
    const cells = document.querySelectorAll('.cell');
    const revealedCount = document.querySelectorAll('.cell.revealed').length;
    const totalCells = cells.length;
    const mineCount = mines.length;
    
    if (revealedCount === totalCells - mineCount) {
        gameOver = true;
        clearInterval(timerInterval);
        showWin();
    }
}

// Show game over message
function showGameOver() {
    statusMessage.textContent = 'Game Over!';
    statusMessage.className = 'status-message game-over';
    reactionMessage.textContent = 'Better luck next time, degen!';
}

// Show win message
function showWin() {
    const time = Math.floor((Date.now() - startTime) / 1000);
    statusMessage.textContent = `You won in ${time} seconds!`;
    statusMessage.className = 'status-message win';
    reactionMessage.textContent = 'LFGO! You absolute legend!';
    updateHighscore(time);
}

// Update timer display
function updateTimer() {
    const time = Math.floor((Date.now() - startTime) / 1000);
    timerDisplay.textContent = `Time: ${time}s`;
}

// Update mines count display
function updateMinesCount() {
    const flaggedCount = document.querySelectorAll('.cell.flagged').length;
    const remainingMines = mines.length - flaggedCount;
    minesCountDisplay.textContent = `Mines: ${remainingMines}`;
}

// Update highscore
function updateHighscore(currentTime) {
    const difficultyKey = `highscore_${difficulty}`;
    const currentHighscore = localStorage.getItem(difficultyKey);
    
    if (currentTime && (!currentHighscore || currentTime < parseInt(currentHighscore))) {
        localStorage.setItem(difficultyKey, currentTime);
        highscoreDisplay.textContent = `Best Time: ${currentTime}s`;
    } else if (currentHighscore) {
        highscoreDisplay.textContent = `Best Time: ${currentHighscore}s`;
    } else {
        highscoreDisplay.textContent = 'Best Time: -';
    }
}

// Event Listeners
restartButton.addEventListener('click', initGame);

difficultySelect.addEventListener('change', (e) => {
    difficulty = e.target.value;
    initGame();
});

// Initialize game
initGame(); 