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
        this.startTime = 0;
        this.totalTime = 0;
        this.timer = 0;
        this.timerStarted = false;
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

        if (gameUI) gameUI.style.display = 'block';
        if (canvasContainer) canvasContainer.style.display = 'block';
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

            // Update pan offset
            this.panOffsetX += deltaX;
            this.panOffsetY += deltaY;

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

        // Start timer on first interaction
        if (!this.timerStarted) {
            this.startTime = millis();
            this.timerStarted = true;
        }

        // Track total clicks
        this.totalClicks++;

        // Handle level click
        const isCorrect = this.currentLevel.handleClick(mouseX, mouseY);

        if (isCorrect) {
            this.correctClicks++;
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

        // Start timer on first click
        if (!this.timerStarted) {
            this.startTime = millis();
            this.timerStarted = true;
        }

        // Track total clicks
        this.totalClicks++;

        // Handle level click
        const isCorrect = this.currentLevel.handleClick(mouseX, mouseY);

        if (isCorrect) {
            this.correctClicks++;
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
        this.startTime = 0;
        this.totalTime = 0;
        this.timer = 0;
        this.timerStarted = false;
        this.penaltyTime = 0;
        this.totalClicks = 0;
        this.correctClicks = 0;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
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
