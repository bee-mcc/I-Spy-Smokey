// Global game variables
let game;
let leaderboard;

// p5.js setup
function setup() {
    // Create canvas
    const canvasContainer = document.getElementById('canvas-container');
    // Start full-screen so the image can cover immediately even before container is shown
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');

    // Initialize game components
    leaderboard = new Leaderboard();

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
    }
}

// p5.js mouse pressed
function mousePressed() {
    if (game) {
        game.handleMousePressed(mouseX, mouseY);
    }
}

// p5.js mouse dragged
function mouseDragged() {
    if (game) {
        game.handleMouseDragged(mouseX, mouseY);
    }
}

// p5.js mouse released
function mouseReleased() {
    if (game) {
        game.handleMouseReleased(mouseX, mouseY);
    }
}

// p5.js touch started
function touchStarted() {
    if (game) {
        game.handleTouchStarted(touches[0].x, touches[0].y);
    }
    return false; // Prevent default touch behavior
}

// p5.js touch moved
function touchMoved() {
    if (game) {
        game.handleTouchMoved(touches[0].x, touches[0].y);
    }
    return false; // Prevent default touch behavior
}

// p5.js touch ended
function touchEnded() {
    if (game) {
        game.handleTouchEnded(touches[0].x, touches[0].y);
    }
    return false; // Prevent default touch behavior
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

        // Timer system - uses accumulated elapsed time approach
        this.elapsedTime = 0; // Accumulated time while timer is running
        this.lastResumeTime = 0; // When timer was last resumed
        this.totalTime = 0;
        this.timer = 0;
        this.levelElapsedTime = 0; // Accumulated time for current level
        this.levelLastResumeTime = 0; // When level timer was last resumed
        this.levelTimer = 0; // Time spent on current level
        this.timerStarted = false;
        this.timerPaused = true;

        this.canvasWidth = 800;
        this.canvasHeight = 600;

        // Touch and pan controls
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.longPressTimer = null;
        this.longPressThreshold = 500; // milliseconds
        this.isLongPressing = false;
        this.longPressStartX = 0;
        this.longPressStartY = 0;

        // Penalty system
        this.penaltyTime = 0;
        this.penaltyPerClick = 5000; // 5 seconds per wrong click
        this.totalClicks = 0;
        this.correctClicks = 0;

        // Visual effects
        this.levelTransition = null;
        this.celebrationEffect = null;

        // UI / layout
        this.uiMode = 'overlay'; // 'overlay' or 'ui_above'
        this.instructionsFadeTimeout = null;

        // Level start screen
        this.levelStartShown = false;
        this.countdownActive = false;
        this.renderEnabled = false;

        // Color palettes for level start screens
        this.colorPalettes = [
            ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
            ['#A8E6CF', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D'],
            ['#C44569', '#F8B500', '#6C5CE7', '#00D2D3', '#FF6B81'],
            ['#10AC84', '#EE5A6F', '#5F27CD', '#00D2FF', '#FF9FF3'],
            ['#FF6348', '#2ED573', '#5352ED', '#FFA502', '#70A1FF']
        ];

        this.minInitialLoadTime = 1500;
    }

    getRandomBrightColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 80 + Math.floor(Math.random() * 20); // 80-99%
        const lightness = 50 + Math.floor(Math.random() * 10); // 50-59%
        return `hsl(${hue}deg, ${saturation}%, ${lightness}%)`;
    }

    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();

            const minLoadDelay = this.delay(this.minInitialLoadTime);

            // Load levels data with enforced delay to showcase loading animation
            await Promise.all([this.loadLevels(), minLoadDelay]);

            // Load first level
            if (this.levels.length > 0) {
                await this.loadCurrentLevel();
                this.hideLoadingScreen();
                this.showGameUI();
                this.state = 'playing';
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

        this.setRenderEnabled(false);

        // Try to load custom loading gif
        if (loadingGif) {
            loadingGif.style.display = 'block';
            loadingGif.onload = () => {
                loadingGif.style.display = 'block';
            };
            loadingGif.onerror = () => {
                console.log('Custom loading gif not found, using text only');
                loadingGif.style.display = 'none';
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

    // Simple delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setRenderEnabled(enabled) {
        this.renderEnabled = enabled;

        if (!enabled && typeof clear === 'function') {
            clear();
        }
    }

    pauseTimer() {
        if (!this.timerPaused && this.timerStarted) {
            // Accumulate elapsed time before pausing
            const now = millis();
            this.elapsedTime += now - this.lastResumeTime;
            if (this.levelLastResumeTime > 0) {
                this.levelElapsedTime += now - this.levelLastResumeTime;
            }
        }
        this.timerPaused = true;
    }

    resumeTimer(allowStart = false) {
        const now = millis();

        if (this.timerPaused) {
            if (this.timerStarted) {
                // Resume from pause - just record the resume time
                this.lastResumeTime = now;
                if (this.levelLastResumeTime > 0) {
                    this.levelLastResumeTime = now;
                }
            } else if (allowStart) {
                // Start timer for the first time
                this.timerStarted = true;
                this.lastResumeTime = now;
            }
            this.timerPaused = false;
        } else if (!this.timerStarted && allowStart) {
            // Start timer if not already started
            this.timerStarted = true;
            this.lastResumeTime = now;
        }
    }

    // Show game UI
    showGameUI() {
        const gameUI = document.getElementById('game-ui');
        const canvasContainer = document.getElementById('canvas-container');

        if (gameUI) gameUI.style.display = 'block';
        if (canvasContainer) canvasContainer.style.display = 'block';

        // Hide old UI elements
        const uiTop = document.querySelector('.ui-top');
        const instructions = document.querySelector('.instructions');
        if (uiTop) uiTop.style.display = 'none';
        if (instructions) instructions.style.display = 'none';
    }

    // Show level start screen
    showLevelStartScreen() {
        const levelStartScreen = document.getElementById('level-start-screen');
        if (!levelStartScreen) return;

        this.setRenderEnabled(false);
        const modalBackground = this.getRandomBrightColor();
        levelStartScreen.style.backgroundImage = 'none';
        levelStartScreen.style.background = modalBackground;

        // Update level info
        const levelTitle = document.getElementById('level-start-title');
        const levelCurrent = document.getElementById('level-start-current');
        const levelTotal = document.getElementById('level-start-total');
        const totalTimeDisplay = document.getElementById('level-start-total-time');
        const penaltiesDisplay = document.getElementById('level-start-penalties');

        if (this.currentLevel) {
            if (levelTitle) levelTitle.textContent = this.currentLevel.data.name;
        }

        if (levelCurrent) levelCurrent.textContent = this.currentLevelIndex + 1;
        if (levelTotal) levelTotal.textContent = this.levels.length;

        // Update stats
        const totalTime = this.timer + this.penaltyTime;
        if (totalTimeDisplay) totalTimeDisplay.textContent = leaderboard.formatTime(totalTime);
        if (penaltiesDisplay) penaltiesDisplay.textContent = `+${leaderboard.formatTime(this.penaltyTime)}`;

        // Generate random color palette and create decorative shapes
        this.generateDecorativeShapes();

        // Show the screen
        levelStartScreen.style.display = 'flex';
        this.levelStartShown = true;
        this.pauseTimer();

        // Hide floating timer
        const floatingTimer = document.getElementById('floating-timer');
        if (floatingTimer) floatingTimer.style.display = 'none';

        // Setup go button handler
        this.setupGoButton();
    }

    // Generate decorative shapes with random colors
    generateDecorativeShapes() {
        const shapesContainer = document.querySelector('.decorative-shapes');
        if (!shapesContainer) return;

        // Clear existing shapes
        shapesContainer.innerHTML = '';

        // Pick a random color palette
        const palette = this.colorPalettes[Math.floor(Math.random() * this.colorPalettes.length)];

        // Apply colors to level start screen elements
        const content = document.querySelector('.level-start-content');
        if (content) {
            const primaryColor = palette[0];
            content.style.borderTop = `8px solid ${primaryColor}`;
            const goButton = document.getElementById('go-button');
            if (goButton) {
                goButton.style.background = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
            }
        }

        // Create random decorative shapes
        const shapeTypes = ['circle', 'square', 'triangle'];
        const numShapes = 8 + Math.floor(Math.random() * 5); // 8-12 shapes

        for (let i = 0; i < numShapes; i++) {
            const shape = document.createElement('div');
            shape.className = `decorative-shape ${shapeTypes[Math.floor(Math.random() * shapeTypes.length)]}`;

            const color = palette[Math.floor(Math.random() * palette.length)];
            const size = 30 + Math.random() * 60; // 30-90px
            const left = Math.random() * 100; // 0-100%
            const top = Math.random() * 100; // 0-100%
            const delay = Math.random() * 2; // 0-2s delay

            if (shape.classList.contains('triangle')) {
                shape.style.borderLeftWidth = `${size / 2}px`;
                shape.style.borderRightWidth = `${size / 2}px`;
                shape.style.borderBottomWidth = `${size}px`;
                shape.style.borderLeftColor = 'transparent';
                shape.style.borderRightColor = 'transparent';
                shape.style.borderBottomColor = color;
            } else {
                shape.style.width = `${size}px`;
                shape.style.height = `${size}px`;
                shape.style.backgroundColor = color;
            }

            shape.style.left = `${left}%`;
            shape.style.top = `${top}%`;
            shape.style.animationDelay = `${delay}s`;

            shapesContainer.appendChild(shape);
        }
    }

    // Setup go button event handler
    setupGoButton() {
        const goButton = document.getElementById('go-button');
        if (!goButton) return;

        // Remove existing handlers
        const newButton = goButton.cloneNode(true);
        goButton.parentNode.replaceChild(newButton, goButton);

        // Add click handler
        newButton.addEventListener('click', () => {
            this.startCountdown();
        });
    }

    // Start countdown animation
    startCountdown() {
        const levelStartScreen = document.getElementById('level-start-screen');
        const countdownOverlay = document.getElementById('countdown-overlay');
        const countdownNumber = document.getElementById('countdown-number');

        if (!countdownOverlay || !countdownNumber) return;

        // Hide the canvas while transitioning between UI states to prevent image flashes
        this.setRenderEnabled(false);

        // Hide level start screen
        if (levelStartScreen) levelStartScreen.style.display = 'none';

        const overlayColors = [
            this.getRandomBrightColor(),
            this.getRandomBrightColor(),
            this.getRandomBrightColor(),
            this.getRandomBrightColor()
        ];
        const numberColors = [
            this.getRandomBrightColor(),
            this.getRandomBrightColor(),
            this.getRandomBrightColor(),
            this.getRandomBrightColor()
        ];
        let overlayIndex = 0;
        let numberIndex = 0;

        // Show countdown
        countdownOverlay.style.display = 'flex';
        countdownOverlay.style.backgroundImage = 'none';
        countdownOverlay.style.background = overlayColors[overlayIndex];
        this.countdownActive = true;

        // Start countdown sequence - show 3 immediately
        let count = 3;
        countdownNumber.textContent = count;
        countdownNumber.className = 'countdown-number';
        countdownNumber.style.background = numberColors[numberIndex];

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
                countdownNumber.className = 'countdown-number';
                countdownNumber.style.animation = 'none';
                overlayIndex = Math.min(overlayIndex + 1, overlayColors.length - 1);
                numberIndex = Math.min(numberIndex + 1, numberColors.length - 1);
                countdownOverlay.style.background = overlayColors[overlayIndex];
                countdownNumber.style.background = numberColors[numberIndex];
                // Force reflow to restart animation
                void countdownNumber.offsetWidth;
                countdownNumber.style.animation = '';
            } else {
                // Show GO
                countdownNumber.textContent = 'GO!';
                countdownNumber.className = 'countdown-number go';
                overlayIndex = Math.min(overlayIndex + 1, overlayColors.length - 1);
                numberIndex = Math.min(numberIndex + 1, numberColors.length - 1);
                countdownOverlay.style.background = overlayColors[overlayIndex];
                countdownNumber.style.background = numberColors[numberIndex];
                clearInterval(countdownInterval);

                // Hide countdown and start game after GO animation
                setTimeout(() => {
                    countdownOverlay.style.display = 'none';
                    this.countdownActive = false;
                    this.setRenderEnabled(true);
                    // Timer will be resumed in display() when renderEnabled becomes true
                }, 800);
            }
        }, 1000);
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
            this.updateUI();
            // After image is available, update layout and sizing
            this.updateLayoutMode();

            // Synchronize game pan offsets with level's initial viewport
            if (this.currentLevel) {
                this.panOffsetX = this.currentLevel.panOffsetX;
                this.panOffsetY = this.currentLevel.panOffsetY;
            }

            // Show level start screen
            this.showLevelStartScreen();
        } catch (error) {
            console.error('Error loading level:', error);
            throw error;
        }
    }

    // Update game state
    update() {
        if (this.state === 'playing' && this.timerStarted && !this.timerPaused) {
            // Calculate timer as accumulated time + current segment
            const now = millis();
            this.timer = this.elapsedTime + (now - this.lastResumeTime);
            if (this.levelLastResumeTime > 0) {
                this.levelTimer = this.levelElapsedTime + (now - this.levelLastResumeTime);
            }
            this.updateTimerDisplay();
        }
    }

    // Display current level
    display() {
        if (this.state === 'playing' && this.currentLevel) {
            // Start the timer when rendering begins (after countdown)
            if (this.renderEnabled && this.timerPaused) {
                this.resumeTimer(true);
                // Start level timer
                this.levelLastResumeTime = millis();
                this.levelElapsedTime = 0;
                this.levelTimer = 0;

                const floatingTimer = document.getElementById('floating-timer');
                if (floatingTimer) floatingTimer.style.display = 'block';
            }

            if (this.renderEnabled) {
                this.currentLevel.display();
            }
        }

        // Draw level transition effect
        if (this.levelTransition) {
            this.drawLevelTransition();
        }

        // Draw celebration effect
        if (this.celebrationEffect) {
            this.drawCelebrationEffect();
        }
    }

    // Handle mouse pressed
    handleMousePressed(mouseX, mouseY) {
        if (this.state !== 'playing' || !this.currentLevel) return;

        this.panStartX = mouseX;
        this.panStartY = mouseY;
        this.isPanning = false;

        // Start long press timer
        this.longPressStartX = mouseX;
        this.longPressStartY = mouseY;
        this.isLongPressing = false;
        this.longPressTimer = setTimeout(() => {
            this.isLongPressing = true;
            this.handleLongPress(mouseX, mouseY);
        }, this.longPressThreshold);


    }

    // Handle mouse dragged
    handleMouseDragged(mouseX, mouseY) {
        if (this.state !== 'playing' || !this.currentLevel) return;

        const deltaX = mouseX - this.panStartX;
        const deltaY = mouseY - this.panStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // If moved more than 10 pixels, start panning
        if (distance > 10) {
            this.isPanning = true;
            this.cancelLongPress();

            // Update pan offset (move content opposite drag direction)
            this.panOffsetX -= deltaX;
            this.panOffsetY -= deltaY;

            // Update level pan
            this.currentLevel.setPanOffset(this.panOffsetX, this.panOffsetY);

            this.panStartX = mouseX;
            this.panStartY = mouseY;
        }
    }

    // Handle mouse released
    handleMouseReleased(mouseX, mouseY) {
        if (this.state !== 'playing' || !this.currentLevel) return;

        this.cancelLongPress();

        // If not panning and not long pressing, treat as regular click
        if (!this.isPanning && !this.isLongPressing) {
            this.handleClick(mouseX, mouseY);
        }

        this.isPanning = false;
    }

    // Handle touch started
    handleTouchStarted(touchX, touchY) {
        this.handleMousePressed(touchX, touchY);
    }

    // Handle touch moved
    handleTouchMoved(touchX, touchY) {
        this.handleMouseDragged(touchX, touchY);
    }

    // Handle touch ended
    handleTouchEnded(touchX, touchY) {
        this.handleMouseReleased(touchX, touchY);
    }

    // Handle long press
    handleLongPress(mouseX, mouseY) {
        if (this.state !== 'playing' || !this.currentLevel) return;
        if (this.timerPaused || this.countdownActive) return; // Don't register clicks during pause/countdown

        // Start timer on first interaction (should already be started after countdown, but keep for safety)
        this.resumeTimer(true);

        // Track total clicks
        this.totalClicks++;

        // Handle level click
        const isCorrect = this.currentLevel.handleClick(mouseX, mouseY);

        if (isCorrect) {
            this.correctClicks++;
            this.pauseTimer();
            // Move to next level after a short delay
            setTimeout(() => {
                this.nextLevel();
            }, 1000);
        } else {
            // Add penalty for wrong click
            this.penaltyTime += this.penaltyPerClick;
            this.showPenaltyNotification();
        }
    }

    // Cancel long press timer
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        this.isLongPressing = false;
    }

    // Handle regular click (for non-touch devices)
    handleClick(mouseX, mouseY) {
        if (this.state !== 'playing' || !this.currentLevel) return;
        if (this.timerPaused || this.countdownActive) return; // Don't register clicks during pause/countdown

        // Start timer on first click (should already be started after countdown, but keep for safety)
        this.resumeTimer(true);

        // Track total clicks
        this.totalClicks++;

        // Handle level click
        const isCorrect = this.currentLevel.handleClick(mouseX, mouseY);

        if (isCorrect) {
            this.correctClicks++;
            this.pauseTimer();
            // Move to next level after a short delay
            setTimeout(() => {
                this.nextLevel();
            }, 1000);
        } else {
            // Add penalty for wrong click
            this.penaltyTime += this.penaltyPerClick;
            this.showPenaltyNotification();
        }
    }

    // Move to next level
    async nextLevel() {
        // Pause timer
        this.pauseTimer();
        // Reset level timer
        this.levelElapsedTime = 0;
        this.levelLastResumeTime = 0;
        this.levelTimer = 0;

        // Hide floating timer
        const floatingTimer = document.getElementById('floating-timer');
        if (floatingTimer) floatingTimer.style.display = 'none';

        // Start level transition effect
        this.startLevelTransition();

        // Wait for transition to complete
        setTimeout(async () => {
            this.currentLevelIndex++;

            if (this.currentLevelIndex < this.levels.length) {
                await this.loadCurrentLevel();
                this.endLevelTransition();
            } else {
                this.completeGame();
            }
        }, 800);
    }

    // Complete the game
    completeGame() {
        this.state = 'completed';
        this.pauseTimer();
        this.totalTime = this.timer + this.penaltyTime;
        this.startCelebrationEffect();
        this.showGameCompleteModal();
    }

    // Show penalty notification
    showPenaltyNotification() {
        // Create penalty notification element
        const notification = document.createElement('div');
        notification.className = 'penalty-notification';
        notification.textContent = `+${leaderboard.formatTime(this.penaltyPerClick)} penalty!`;

        // Add to game container
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(notification);

        // Animate and remove
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // Show game complete modal
    showGameCompleteModal() {
        const modal = document.getElementById('game-complete-modal');
        const finalTime = document.getElementById('final-time');
        const baseTime = document.getElementById('base-time');
        const penaltyTime = document.getElementById('penalty-time');
        const accuracy = document.getElementById('accuracy');

        if (modal) {
            modal.style.display = 'block';
        }

        if (finalTime) {
            finalTime.textContent = leaderboard.formatTime(this.totalTime);
        }

        if (baseTime) {
            baseTime.textContent = leaderboard.formatTime(this.timer);
        }

        if (penaltyTime) {
            penaltyTime.textContent = `+${leaderboard.formatTime(this.penaltyTime)}`;
        }

        if (accuracy) {
            const accuracyPercent = this.totalClicks > 0 ? Math.round((this.correctClicks / this.totalClicks) * 100) : 100;
            accuracy.textContent = `${accuracyPercent}%`;
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

        // Reset timer system
        this.elapsedTime = 0;
        this.lastResumeTime = 0;
        this.totalTime = 0;
        this.timer = 0;
        this.levelElapsedTime = 0;
        this.levelLastResumeTime = 0;
        this.levelTimer = 0;
        this.timerStarted = false;
        this.timerPaused = true;

        this.penaltyTime = 0;
        this.totalClicks = 0;
        this.correctClicks = 0;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.levelStartShown = false;
        this.countdownActive = false;
        this.state = 'loading';
        this.renderEnabled = false;

        // Hide UI elements
        const floatingTimer = document.getElementById('floating-timer');
        const levelStartScreen = document.getElementById('level-start-screen');
        const countdownOverlay = document.getElementById('countdown-overlay');
        if (floatingTimer) floatingTimer.style.display = 'none';
        if (levelStartScreen) levelStartScreen.style.display = 'none';
        if (countdownOverlay) countdownOverlay.style.display = 'none';

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
        // Update floating timer
        const floatingLevelTime = document.getElementById('floating-level-time');
        const floatingTotalTime = document.getElementById('floating-total-time');

        if (floatingLevelTime) {
            floatingLevelTime.textContent = leaderboard.formatTime(this.levelTimer);
        }

        if (floatingTotalTime) {
            const totalTime = this.timer + this.penaltyTime;
            floatingTotalTime.textContent = leaderboard.formatTime(totalTime);
        }

        // Also update old timer displays if they exist (for backwards compatibility)
        const timerDisplay = document.getElementById('timer-display');
        const penaltyDisplay = document.getElementById('penalty-display');
        const totalTimeDisplay = document.getElementById('total-time-display');

        if (timerDisplay) {
            timerDisplay.textContent = leaderboard.formatTime(this.timer);
        }

        if (penaltyDisplay) {
            penaltyDisplay.textContent = `+${leaderboard.formatTime(this.penaltyTime)}`;
        }

        if (totalTimeDisplay) {
            const totalTime = this.timer + this.penaltyTime;
            totalTimeDisplay.textContent = leaderboard.formatTime(totalTime);
        }
    }

    // Resize game when window resizes
    resize(newWidth, newHeight) {
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;

        if (this.currentLevel) {
            this.currentLevel.resize(newWidth, newHeight);
        }

        this.updateLayoutMode();
    }

    // Decide whether to show UI above or overlay, and size canvas accordingly
    // Images are always displayed at 1:1 pixel ratio, so layout decision is based on UI space only
    updateLayoutMode() {
        const container = document.getElementById('game-container');
        const instructionsEl = document.querySelector('.instructions');
        const uiTopEl = document.querySelector('.ui-top');

        if (!this.currentLevel || !this.currentLevel.image) return;

        const winW = windowWidth;
        const winH = windowHeight;

        // Estimate UI height (for placing above). Prefer actual measured heights if available
        const uiTopH = uiTopEl ? uiTopEl.offsetHeight : 80;
        const instructionsH = instructionsEl ? instructionsEl.offsetHeight : 64;
        const estimatedUIHeight = uiTopH + instructionsH + 16; // small padding

        // Decide layout based on available space for UI
        // If we have enough space, show UI above; otherwise overlay it
        const canShowAbove = winH >= estimatedUIHeight + 400; // Minimum canvas height

        if (canShowAbove) {
            // Switch to UI-above mode
            if (container) container.classList.add('ui-above');
            this.uiMode = 'ui_above';

            // Compute canvas height as remaining space
            const canvasH = Math.max(100, winH - estimatedUIHeight);
            resizeCanvas(winW, canvasH);
            this.canvasWidth = winW;
            this.canvasHeight = canvasH;

            if (this.currentLevel) {
                this.currentLevel.resize(this.canvasWidth, this.canvasHeight);
            }

            // Ensure instructions are visible (no fade) in above mode
            if (instructionsEl) instructionsEl.classList.remove('fade-out');
            this.clearInstructionsFadeTimer();
        } else {
            // Overlay mode, canvas takes full window
            if (container) container.classList.remove('ui-above');
            this.uiMode = 'overlay';

            resizeCanvas(winW, winH);
            this.canvasWidth = winW;
            this.canvasHeight = winH;

            if (this.currentLevel) {
                this.currentLevel.resize(this.canvasWidth, this.canvasHeight);
            }

            // Show instructions briefly, then fade out
            if (instructionsEl) {
                instructionsEl.classList.remove('fade-out');
                this.clearInstructionsFadeTimer();
                this.instructionsFadeTimeout = setTimeout(() => {
                    instructionsEl.classList.add('fade-out');
                }, 3500);
            }
        }
    }

    clearInstructionsFadeTimer() {
        if (this.instructionsFadeTimeout) {
            clearTimeout(this.instructionsFadeTimeout);
            this.instructionsFadeTimeout = null;
        }
    }

    // Start level transition effect
    startLevelTransition() {
        this.levelTransition = {
            type: 'fade',
            alpha: 0,
            maxAlpha: 255,
            duration: 800,
            startTime: millis()
        };
    }

    // End level transition effect
    endLevelTransition() {
        if (this.levelTransition) {
            this.levelTransition = null;
        }
    }

    // Start celebration effect
    startCelebrationEffect() {
        this.celebrationEffect = {
            type: 'confetti',
            particles: this.createCelebrationParticles(),
            duration: 3000,
            startTime: millis()
        };
    }

    // Create celebration particles
    createCelebrationParticles() {
        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * this.canvasWidth,
                y: -10,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 1,
                life: 1.0,
                decay: 0.002,
                size: 4 + Math.random() * 6,
                color: this.getRandomCelebrationColor(),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
        return particles;
    }

    // Get random celebration color
    getRandomCelebrationColor() {
        const colors = [
            [255, 0, 0],   // Red
            [0, 255, 0],   // Green
            [0, 0, 255],   // Blue
            [255, 255, 0], // Yellow
            [255, 0, 255], // Magenta
            [0, 255, 255], // Cyan
            [255, 165, 0], // Orange
            [128, 0, 128]  // Purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Draw level transition effect
    drawLevelTransition() {
        if (!this.levelTransition) return;

        const elapsed = millis() - this.levelTransition.startTime;
        const progress = Math.min(elapsed / this.levelTransition.duration, 1);

        if (this.levelTransition.type === 'fade') {
            const alpha = Math.sin(progress * Math.PI) * this.levelTransition.maxAlpha;

            push();
            fill(255, 255, 255, alpha);
            noStroke();
            rect(0, 0, this.canvasWidth, this.canvasHeight);
            pop();
        }

        if (progress >= 1) {
            this.levelTransition = null;
        }
    }

    // Draw celebration effect
    drawCelebrationEffect() {
        if (!this.celebrationEffect) return;

        const elapsed = millis() - this.celebrationEffect.startTime;
        const progress = Math.min(elapsed / this.celebrationEffect.duration, 1);

        for (let particle of this.celebrationEffect.particles) {
            if (particle.life > 0) {
                push();
                translate(particle.x, particle.y);
                rotate(particle.rotation);

                fill(particle.color[0], particle.color[1], particle.color[2], particle.life * 255);
                noStroke();
                rect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);

                pop();

                // Update particle
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= particle.decay;
                particle.rotation += particle.rotationSpeed;
                particle.vy += 0.1; // Gravity
            }
        }

        if (progress >= 1) {
            this.celebrationEffect = null;
        }
    }
}
