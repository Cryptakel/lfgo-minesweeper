class Minesweeper {
    constructor() {
        this.difficultySettings = {
            rookie: { rows: 8, cols: 8, mines: 10 },
            mid: { rows: 12, cols: 12, mines: 20 },
            galaxy: { rows: 16, cols: 16, mines: 40 }
        };
        
        this.currentDifficulty = 'rookie';
        this.rows = this.difficultySettings[this.currentDifficulty].rows;
        this.cols = this.difficultySettings[this.currentDifficulty].cols;
        this.mines = this.difficultySettings[this.currentDifficulty].mines;
        
        this.board = [];
        this.gameOver = false;
        this.firstClick = true;
        this.revealedCells = 0;
        this.timer = 0;
        this.timerInterval = null;

        // DOM Elements
        this.gameBoard = document.getElementById('game-board');
        this.minesCount = document.getElementById('mines-count');
        this.timerDisplay = document.getElementById('timer');
        this.statusMessage = document.getElementById('status-message');
        this.restartButton = document.getElementById('restart-button');
        this.highscoreDisplay = document.getElementById('highscore');
        this.reactionMessage = document.getElementById('reaction-message');
        this.difficultySelect = document.getElementById('difficulty');

        // Load highscore from localStorage
        this.loadHighscore();

        // Event Listeners
        this.restartButton.addEventListener('click', () => this.restart());
        this.difficultySelect.addEventListener('change', (e) => this.changeDifficulty(e.target.value));
        
        this.init();
    }

    changeDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        const settings = this.difficultySettings[difficulty];
        this.rows = settings.rows;
        this.cols = settings.cols;
        this.mines = settings.mines;
        this.restart();
    }

    loadHighscore() {
        const savedHighscore = localStorage.getItem(`minesweeperHighscore_${this.currentDifficulty}`);
        this.highscoreDisplay.textContent = savedHighscore ? `${savedHighscore}s` : '-';
    }

    updateHighscore() {
        const currentHighscore = localStorage.getItem(`minesweeperHighscore_${this.currentDifficulty}`);
        if (!currentHighscore || this.timer < parseInt(currentHighscore)) {
            localStorage.setItem(`minesweeperHighscore_${this.currentDifficulty}`, this.timer.toString());
            this.highscoreDisplay.textContent = `${this.timer}s`;
            this.highscoreDisplay.classList.add('win-animation');
            setTimeout(() => {
                this.highscoreDisplay.classList.remove('win-animation');
            }, 2000);
            this.showReactionMessage('New Highscore! 🏆');
        }
    }

    showReactionMessage(message) {
        this.reactionMessage.textContent = message;
        this.reactionMessage.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.reactionMessage.style.transform = 'scale(1)';
        }, 200);
    }

    getRandomReactionMessage() {
        const messages = [
            "Well done! 🎯",
            "Keep it up! 💪",
            "Super! ⭐",
            "Fantastic! 🌟",
            "Incredible! 🚀",
            "Perfect! 🎉",
            "Excellent! 🏆",
            "Brilliant! ✨",
            "Outstanding! 🎯",
            "Amazing! 🌈"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    init() {
        // Initialize board
        this.board = Array(this.rows).fill().map(() => 
            Array(this.cols).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            }))
        );

        // Set grid layout
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 40px)`;
        
        // Render board
        this.renderBoard();
        
        // Update mines counter
        this.minesCount.textContent = this.mines;
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Event listeners for left and right click
                cell.addEventListener('click', (e) => this.handleClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });
                
                this.gameBoard.appendChild(cell);
            }
        }
    }

    placeMines(firstRow, firstCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Keine Mine auf dem ersten Klick oder in der Nähe platzieren
            if (!this.board[row][col].isMine && 
                Math.abs(row - firstRow) > 1 || Math.abs(col - firstCol) > 1) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        
        // Nachbarminen zählen
        this.countNeighborMines();
    }

    countNeighborMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.getNeighborMines(row, col);
                }
            }
        }
    }

    getNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols && 
                    this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    async getAIReaction() {
        try {
            const response = await fetch('/api/degen-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error getting AI reaction:', error);
            return "Boom! 💥"; // Fallback message
        }
    }

    async handleClick(row, col) {
        if (this.gameOver || this.board[row][col].isFlagged) return;

        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
            this.startTimer();
            this.showReactionMessage("Let's go! 🎮");
        }

        if (this.board[row][col].isMine) {
            this.gameOver = true;
            this.revealAll();
            this.statusMessage.textContent = 'Game Over!';
            
            // Get AI reaction for mine hit
            const aiReaction = await this.getAIReaction();
            this.showReactionMessage(aiReaction);
            
            this.stopTimer();
            return;
        }

        this.revealCell(row, col);
        this.updateDisplay();

        // Check for win
        if (this.revealedCells === (this.rows * this.cols - this.mines)) {
            this.gameOver = true;
            this.statusMessage.textContent = 'You Win!';
            this.stopTimer();
            this.updateHighscore();
            this.showReactionMessage(this.getRandomReactionMessage());
        }
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.board[row][col].isRevealed) return;
        
        this.board[row][col].isFlagged = !this.board[row][col].isFlagged;
        this.updateDisplay();
        
        if (this.board[row][col].isFlagged) {
            this.showReactionMessage("Flag placed! 🚩");
        }
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols || 
            this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }

        this.board[row][col].isRevealed = true;
        this.revealedCells++;

        if (this.board[row][col].neighborMines === 0) {
            // Rekursiv leere Nachbarzellen aufdecken
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    this.revealCell(row + i, col + j);
                }
            }
        }
    }

    revealAll() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col].isRevealed = true;
            }
        }
        this.updateDisplay();
    }

    updateDisplay() {
        const cells = this.gameBoard.getElementsByClassName('cell');
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = cells[row * this.cols + col];
                const cellData = this.board[row][col];
                
                cell.className = 'cell';
                if (cellData.isRevealed) {
                    cell.classList.add('revealed');
                    if (cellData.isMine) {
                        const bombImg = document.createElement('img');
                        bombImg.src = 'assets/lego_bomb.png';
                        bombImg.alt = 'Bomb';
                        bombImg.className = 'bomb-icon';
                        cell.innerHTML = '';
                        cell.appendChild(bombImg);
                    } else {
                        cell.textContent = cellData.neighborMines || '';
                        if (cellData.neighborMines) {
                            cell.setAttribute('data-number', cellData.neighborMines);
                        }
                    }
                } else if (cellData.isFlagged) {
                    cell.textContent = '🚩';
                } else {
                    cell.textContent = '';
                }
            }
        }
    }

    startTimer() {
        this.timer = 0;
        this.timerDisplay.textContent = this.timer;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerDisplay.textContent = this.timer;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    restart() {
        this.gameOver = false;
        this.firstClick = true;
        this.revealedCells = 0;
        this.stopTimer();
        this.timerDisplay.textContent = '0';
        this.statusMessage.textContent = '';
        this.showReactionMessage("Good luck! 🍀");
        this.init();
    }
}

// Start the game
const game = new Minesweeper(); 