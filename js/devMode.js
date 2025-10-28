class DevMode {
    constructor() {
        this.enabled = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.imageX = 0;
        this.imageY = 0;
        this.imageWidth = 0;
        this.imageHeight = 0;
        this.scale = 1;
        this.currentLevel = null;
    }

    // Initialize dev mode
    init() {
        this.setupEventListeners();
        this.toggleButton();
    }

    // Setup event listeners
    setupEventListeners() {
        const devBtn = document.getElementById('dev-mode-btn');
        const copyBtn = document.getElementById('copy-coords');

        if (devBtn) {
            devBtn.addEventListener('click', () => this.toggle());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyCoordinates());
        }
    }

    // Toggle dev mode on/off
    toggle() {
        this.enabled = !this.enabled;
        this.toggleButton();
        this.toggleDevInfo();
    }

    // Toggle dev mode button text
    toggleButton() {
        const devBtn = document.getElementById('dev-mode-btn');
        if (devBtn) {
            devBtn.textContent = `Dev Mode: ${this.enabled ? 'ON' : 'OFF'}`;
            devBtn.className = this.enabled ? 'dev-mode-on' : 'dev-mode-off';
        }
    }

    // Toggle dev info display
    toggleDevInfo() {
        const devInfo = document.getElementById('dev-info');
        if (devInfo) {
            devInfo.style.display = this.enabled ? 'block' : 'none';
        }
    }

    // Update mouse position
    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
        this.updateDisplay();
    }

    // Update level information for coordinate conversion
    updateLevelInfo(level) {
        this.currentLevel = level;
        if (level) {
            this.imageX = level.imageX;
            this.imageY = level.imageY;
            this.imageWidth = level.imageWidth;
            this.imageHeight = level.imageHeight;
            this.scale = level.scale;
        }
    }

    // Update the display with current coordinates
    updateDisplay() {
        if (!this.enabled) return;

        const mousePos = document.getElementById('mouse-pos');
        const imagePos = document.getElementById('image-pos');

        if (mousePos) {
            mousePos.textContent = `${Math.round(this.mouseX)}, ${Math.round(this.mouseY)}`;
        }

        if (imagePos && this.currentLevel) {
            const imageMouseX = Math.round((this.mouseX - this.imageX) / this.scale);
            const imageMouseY = Math.round((this.mouseY - this.imageY) / this.scale);
            imagePos.textContent = `${imageMouseX}, ${imageMouseY}`;
        }
    }

    // Copy coordinates to clipboard
    copyCoordinates() {
        if (!this.currentLevel) return;

        const imageMouseX = Math.round((this.mouseX - this.imageX) / this.scale);
        const imageMouseY = Math.round((this.mouseY - this.imageY) / this.scale);

        const coordinates = {
            x: imageMouseX,
            y: imageMouseY,
            width: 80, // Default width, user can adjust
            height: 100 // Default height, user can adjust
        };

        const jsonString = JSON.stringify(coordinates, null, 2);

        navigator.clipboard.writeText(jsonString).then(() => {
            // Show feedback
            const copyBtn = document.getElementById('copy-coords');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#4CAF50';

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy coordinates:', err);
            alert('Failed to copy coordinates. Please copy manually:\n' + jsonString);
        });
    }

    // Draw dev mode overlay on canvas
    drawOverlay() {
        if (!this.enabled || !this.currentLevel) return;

        push();

        // Draw crosshair at mouse position
        stroke(255, 0, 0);
        strokeWeight(2);
        line(this.mouseX - 10, this.mouseY, this.mouseX + 10, this.mouseY);
        line(this.mouseX, this.mouseY - 10, this.mouseX, this.mouseY + 10);

        // Draw image bounds
        noFill();
        stroke(0, 255, 0);
        strokeWeight(1);
        rect(this.imageX, this.imageY, this.imageWidth, this.imageHeight);

        // Draw current click region if it exists
        if (this.currentLevel.data && this.currentLevel.data.clickRegion) {
            const region = this.currentLevel.data.clickRegion;
            const regionX = this.imageX + region.x * this.scale;
            const regionY = this.imageY + region.y * this.scale;
            const regionWidth = region.width * this.scale;
            const regionHeight = region.height * this.scale;

            noFill();
            stroke(255, 255, 0);
            strokeWeight(2);
            rect(regionX, regionY, regionWidth, regionHeight);

            // Label the region
            fill(255, 255, 0);
            noStroke();
            textAlign(LEFT);
            textSize(12);
            text(`Click Region: ${region.x}, ${region.y}`, regionX, regionY - 5);
        }

        // Draw coordinate text
        fill(255, 0, 0);
        noStroke();
        textAlign(LEFT);
        textSize(14);
        text(`Canvas: ${Math.round(this.mouseX)}, ${Math.round(this.mouseY)}`, 10, 30);

        if (this.currentLevel) {
            const imageMouseX = Math.round((this.mouseX - this.imageX) / this.scale);
            const imageMouseY = Math.round((this.mouseY - this.imageY) / this.scale);
            text(`Image: ${imageMouseX}, ${imageMouseY}`, 10, 50);
        }

        pop();
    }

    // Check if dev mode is enabled
    isEnabled() {
        return this.enabled;
    }
}
