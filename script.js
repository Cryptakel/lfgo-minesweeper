class Minesweeper {
    constructor(rows = 9, cols = 9, mines = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.gameOver = false;
        this.firstClick = true;
        this.revealedCells = 0;
        this.timer = 0;
        this.timerInterval = null;

        // DOM-Elemente
        this.gameBoard = document.getElementById('game-board');
        this.minesCount = document.getElementById('mines-count');
        this.timerDisplay = document.getElementById('timer');
        this.statusMessage = document.getElementById('status-message');
        this.restartButton = document.getElementById('restart-button');
        this.highscoreDisplay = document.getElementById('highscore');
        this.reactionMessage = document.getElementById('reaction-message');

        // Highscore aus localStorage laden
        this.loadHighscore();

        // Event-Listener
        this.restartButton.addEventListener('click', () => this.restart());
        
        this.init();
    }

    loadHighscore() {
        const savedHighscore = localStorage.getItem('minesweeperHighscore');
        this.highscoreDisplay.textContent = savedHighscore ? `${savedHighscore}s` : '-';
    }

    updateHighscore() {
        const currentHighscore = localStorage.getItem('minesweeperHighscore');
        if (!currentHighscore || this.timer < parseInt(currentHighscore)) {
            localStorage.setItem('minesweeperHighscore', this.timer.toString());
            this.highscoreDisplay.textContent = `${this.timer}s`;
            this.highscoreDisplay.classList.add('win-animation');
            setTimeout(() => {
                this.highscoreDisplay.classList.remove('win-animation');
            }, 2000);
            this.showReactionMessage('Neuer Highscore! 🏆');
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
            "Gut gemacht! 🎯",
            "Weiter so! 💪",
            "Super! ⭐",
            "Fantastisch! 🌟",
            "Unglaublich! 🚀",
            "Perfekt! 🎉",
            "Ausgezeichnet! 🏆",
            "Brilliant! ✨",
            "Hervorragend! 🎯",
            "Großartig! 🌈"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    init() {
        // Spielfeld initialisieren
        this.board = Array(this.rows).fill().map(() => 
            Array(this.cols).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            }))
        );

        // Grid-Layout für das Spielfeld setzen
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 40px)`;
        
        // Spielfeld rendern
        this.renderBoard();
        
        // Minen-Zähler aktualisieren
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
                
                // Event-Listener für Links- und Rechtsklick
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
            this.showReactionMessage("Los geht's! 🎮");
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

        // Prüfen auf Sieg
        if (this.revealedCells === (this.rows * this.cols - this.mines)) {
            this.gameOver = true;
            this.statusMessage.textContent = 'Gewonnen!';
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
            this.showReactionMessage("Flagge gesetzt! 🚩");
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
                        cell.textContent = '🐸';
                        cell.style.fontSize = '1.2rem';
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

// Spiel starten
const game = new Minesweeper(); 