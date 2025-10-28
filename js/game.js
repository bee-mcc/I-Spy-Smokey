// Global game variables
let game;
let leaderboard;
let devMode;

// p5.js setup
function setup() {
    // Create canvas
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = createCanvas(800, 600);
    canvas.parent('canvas-container');

    // Initialize game components
    leaderboard = new Leaderboard();
    devMode = new DevMode();
    devMode.init();

    // Initialize game
    game = new Game();
    game.init();
}

// p5.js draw loop
function draw() {
    background(240);

    if (game) {
        game.update();
        game.display();

        // Draw dev mode overlay if enabled
        if (devMode.isEnabled()) {
            devMode.drawOverlay();
        }
    }
}

// p5.js mouse pressed
function mousePressed() {
    if (game) {
        game.handleClick(mouseX, mouseY);
    }
}

// p5.js window resized
function windowResized() {
    // Resize canvas to fit container
    const container = document.getElementById('canvas-container');
    if (container) {
        const rect = container.getBoundingClientRect();
        resizeCanvas(rect.width, rect.height);

        if (game) {
            game.resize(rect.width, rect.height);
        }
    }
}

class Game {
    constructor() {
        this.state = 'loading'; // loading, playing, completed
        this.levels = [];
        this.currentLevelIndex = 0;
        this.startTime = 0;
        this.totalTime = 0;
        this.timer = 0;
        this.timerStarted = false;
        this.canvasWidth = 800;
        this.canvasHeight = 600;
    }

    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();

            // Load levels data
            await this.loadLevels();

            // Load first level
            if (this.levels.length > 0) {
                await this.loadCurrentLevel();
                this.state = 'playing';
                this.hideLoadingScreen();
                this.showGameUI();
            } else {
                console.error('No levels found');
                this.showError('No levels found. Please add level images and metadata.');
            }
        } catch (error) {
            console.error('Error initializing game:', error);
            this.showError('Failed to load game. Please check the console for details.');
        }
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingGif = document.getElementById('loading-gif');

        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }

        // Try to load custom loading gif
        if (loadingGif) {
            loadingGif.onload = () => {
                loadingGif.style.display = 'block';
            };
            loadingGif.onerror = () => {
                console.log('Custom loading gif not found, using text only');
            };
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    // Show game UI
    showGameUI() {
        const gameUI = document.getElementById('game-ui');
        const canvasContainer = document.getElementById('canvas-container');
        const devToggle = document.getElementById('dev-mode-toggle');

        if (gameUI) gameUI.style.display = 'block';
        if (canvasContainer) canvasContainer.style.display = 'block';
        if (devToggle) devToggle.style.display = 'block';
    }

    // Show error message
    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div class="error-message">${message}</div>
                    <button onclick="location.reload()">Reload Game</button>
                </div>
            `;
        }
    }

    // Load levels from JSON file
    async loadLevels() {
        try {
            const response = await fetch('levels/levels.json');
            const data = await response.json();
            this.levels = data.levels || [];
            console.log(`Loaded ${this.levels.length} levels`);
        } catch (error) {
            console.error('Error loading levels:', error);
            throw error;
        }
    }

    // Load current level
    async loadCurrentLevel() {
        if (this.currentLevelIndex >= this.levels.length) {
            this.completeGame();
            return;
        }

        const levelData = this.levels[this.currentLevelIndex];
        const level = new Level(levelData, this.canvasWidth, this.canvasHeight);

        try {
            await level.loadImage();
            this.currentLevel = level;
            devMode.updateLevelInfo(level);
            this.updateUI();
        } catch (error) {
            console.error('Error loading level:', error);
            throw error;
        }
    }

    // Update game state
    update() {
        if (this.state === 'playing' && this.timerStarted) {
            this.timer = millis() - this.startTime;
            this.updateTimerDisplay();
        }
    }

    // Display current level
    display() {
        if (this.state === 'playing' && this.currentLevel) {
            this.currentLevel.display();
        }
    }

    // Handle mouse clicks
    handleClick(mouseX, mouseY) {
        if (this.state !== 'playing' || !this.currentLevel) return;

        // Start timer on first click
        if (!this.timerStarted) {
            this.startTime = millis();
            this.timerStarted = true;
        }

        // Update dev mode mouse position
        devMode.updateMousePosition(mouseX, mouseY);

        // Handle level click
        const isCorrect = this.currentLevel.handleClick(mouseX, mouseY);

        if (isCorrect) {
            // Move to next level after a short delay
            setTimeout(() => {
                this.nextLevel();
            }, 1000);
        }
    }

    // Move to next level
    async nextLevel() {
        this.currentLevelIndex++;

        if (this.currentLevelIndex < this.levels.length) {
            await this.loadCurrentLevel();
        } else {
            this.completeGame();
        }
    }

    // Complete the game
    completeGame() {
        this.state = 'completed';
        this.totalTime = this.timer;
        this.showGameCompleteModal();
    }

    // Show game complete modal
    showGameCompleteModal() {
        const modal = document.getElementById('game-complete-modal');
        const finalTime = document.getElementById('final-time');

        if (modal) {
            modal.style.display = 'block';
        }

        if (finalTime) {
            finalTime.textContent = leaderboard.formatTime(this.totalTime);
        }

        // Display leaderboard
        leaderboard.displayLeaderboard();

        // Setup modal event listeners
        this.setupModalEventListeners();
    }

    // Setup modal event listeners
    setupModalEventListeners() {
        const playAgainBtn = document.getElementById('play-again');
        const closeBtn = document.getElementById('close-modal');
        const saveScoreBtn = document.getElementById('save-score');
        const nameInput = document.getElementById('player-name');

        if (playAgainBtn) {
            playAgainBtn.onclick = () => this.restartGame();
        }

        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal();
        }

        if (saveScoreBtn) {
            saveScoreBtn.onclick = () => this.saveScore();
        }

        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveScore();
                }
            });
        }
    }

    // Save player score
    saveScore() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput ? nameInput.value.trim() : 'Anonymous';

        if (name) {
            leaderboard.addScore(name, this.totalTime);
            leaderboard.displayLeaderboard();

            // Clear name input
            if (nameInput) {
                nameInput.value = '';
            }
        }
    }

    // Restart the game
    restartGame() {
        this.closeModal();
        this.currentLevelIndex = 0;
        this.startTime = 0;
        this.totalTime = 0;
        this.timer = 0;
        this.timerStarted = false;
        this.state = 'loading';
        this.init();
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('game-complete-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Update UI elements
    updateUI() {
        const levelName = document.getElementById('level-name');
        const currentLevel = document.getElementById('current-level');
        const totalLevels = document.getElementById('total-levels');

        if (this.currentLevel) {
            if (levelName) {
                levelName.textContent = this.currentLevel.data.name;
            }
        }

        if (currentLevel) {
            currentLevel.textContent = this.currentLevelIndex + 1;
        }

        if (totalLevels) {
            totalLevels.textContent = this.levels.length;
        }
    }

    // Update timer display
    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = leaderboard.formatTime(this.timer);
        }
    }

    // Resize game when window resizes
    resize(newWidth, newHeight) {
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;

        if (this.currentLevel) {
            this.currentLevel.resize(newWidth, newHeight);
            devMode.updateLevelInfo(this.currentLevel);
        }
    }
}
