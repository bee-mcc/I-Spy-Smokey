class Level {
    constructor(levelData, canvasWidth, canvasHeight) {
        this.data = levelData;
        this.image = null;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.imageX = 0;
        this.imageY = 0;
        this.imageWidth = 0;
        this.imageHeight = 0;
        this.scale = 1; // Always 1:1 pixel ratio
        this.loaded = false;

        // Animation properties
        this.clickAnimation = null;
        this.shakeOffset = 0;
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;

        // Pan properties
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.originalImageX = 0;
        this.originalImageY = 0;
        this.originalImageWidth = 0;
        this.originalImageHeight = 0;
        this.initialViewportRandomized = false;
    }

    // Load the level image
    loadImage() {
        return new Promise((resolve, reject) => {
            this.image = loadImage(`levels/${this.data.image}`,
                (img) => {
                    this.calculateImageDimensions();
                    this.loaded = true;
                    resolve(img);
                },
                (error) => {
                    console.error('Error loading image:', error);
                    reject(error);
                }
            );
        });
    }

    // Calculate image dimensions scaled to desktop screen size
    calculateImageDimensions() {
        if (!this.image) return;

        // Target desktop screen size (typical desktop resolution)
        const targetDesktopWidth = 1920;
        const targetDesktopHeight = 1080;

        // Calculate scale to fit image within desktop screen size while maintaining aspect ratio
        const imageAspect = this.image.width / this.image.height;
        const desktopAspect = targetDesktopWidth / targetDesktopHeight;

        let scaledWidth, scaledHeight;

        if (imageAspect > desktopAspect) {
            // Image is wider than desktop aspect ratio: match width
            scaledWidth = targetDesktopWidth;
            scaledHeight = targetDesktopWidth / imageAspect;
        } else {
            // Image is taller or equal: match height
            scaledHeight = targetDesktopHeight;
            scaledWidth = targetDesktopHeight * imageAspect;
        }

        // Apply additional zoom for larger (desktop) viewports so players must pan
        const desktopBreakpoint = 1024;
        const desktopZoomFactor = this.data.desktopZoomFactor || 2;
        if (this.canvasWidth >= desktopBreakpoint) {
            scaledWidth *= desktopZoomFactor;
            scaledHeight *= desktopZoomFactor;
        }

        // Use scaled dimensions
        this.imageWidth = scaledWidth;
        this.imageHeight = scaledHeight;
        
        // Calculate scale factor for coordinate conversion (needed for click detection)
        this.scale = this.imageWidth / this.image.width;

        // Calculate initial viewport position
        // If image is larger than canvas, start at top-left (0,0) to show a viewport-sized portion
        // If image is smaller than canvas, center it
        let initialX = 0;
        let initialY = 0;

        if (this.imageWidth < this.canvasWidth) {
            initialX = (this.canvasWidth - this.imageWidth) / 2;
        }
        if (this.imageHeight < this.canvasHeight) {
            initialY = (this.canvasHeight - this.imageHeight) / 2;
        }

        // Store initial viewport position (for panning bounds calculation)
        this.originalImageX = initialX;
        this.originalImageY = initialY;
        this.originalImageWidth = this.imageWidth;
        this.originalImageHeight = this.imageHeight;

        if (!this.initialViewportRandomized) {
            this.setRandomInitialViewport();
            this.initialViewportRandomized = true;
        } else {
            // Constrain pan to valid bounds after resize/zoom changes
            this.constrainPan();
        }
    }

    // Constrain pan offset to keep viewport within image bounds
    constrainPan() {
        const maxPanX = Math.max(0, this.imageWidth - this.canvasWidth);
        const maxPanY = Math.max(0, this.imageHeight - this.canvasHeight);

        if (this.imageWidth <= this.canvasWidth) {
            this.panOffsetX = 0;
            this.imageX = this.originalImageX;
        } else {
            this.panOffsetX = Math.max(0, Math.min(maxPanX, this.panOffsetX));
            this.imageX = this.originalImageX + this.panOffsetX;
        }

        if (this.imageHeight <= this.canvasHeight) {
            this.panOffsetY = 0;
            this.imageY = this.originalImageY;
        } else {
            this.panOffsetY = Math.max(0, Math.min(maxPanY, this.panOffsetY));
            this.imageY = this.originalImageY + this.panOffsetY;
        }
    }

    // Set pan offset for touch controls with bounds checking
    setPanOffset(offsetX, offsetY) {
        this.panOffsetX = offsetX;
        this.panOffsetY = offsetY;

        this.constrainPan();
    }

    setRandomInitialViewport() {
        const maxPanX = Math.max(0, this.imageWidth - this.canvasWidth);
        const maxPanY = Math.max(0, this.imageHeight - this.canvasHeight);

        if (maxPanX > 0) {
            this.panOffsetX = Math.random() * maxPanX;
        } else {
            this.panOffsetX = 0;
        }

        if (maxPanY > 0) {
            this.panOffsetY = Math.random() * maxPanY;
        } else {
            this.panOffsetY = 0;
        }

        this.constrainPan();
    }

    // Display the level image
    display() {
        if (!this.loaded || !this.image) return;

        // Apply shake effect if active
        let offsetX = this.imageX + this.shakeOffset;
        let offsetY = this.imageY;

        // Calculate which portion of the image to display
        // If scaled image is larger than canvas, show only the viewport portion
        if (this.imageWidth > this.canvasWidth || this.imageHeight > this.canvasHeight) {
            // Calculate source rectangle in SCALED image coordinates
            let srcX = this.imageWidth > this.canvasWidth ? this.imageX : 0;
            let srcY = this.imageHeight > this.canvasHeight ? this.imageY : 0;
            
            // Apply shake effect to viewport position
            srcX += this.shakeOffset;
            
            const srcWidth = Math.min(this.canvasWidth, this.imageWidth);
            const srcHeight = Math.min(this.canvasHeight, this.imageHeight);
            
            // Convert scaled coordinates to original image coordinates for source rectangle
            // srcX_scaled / scale = srcX_original
            const originalSrcX = srcX / this.scale;
            const originalSrcY = srcY / this.scale;
            const originalSrcWidth = srcWidth / this.scale;
            const originalSrcHeight = srcHeight / this.scale;
            
            // Draw only the visible portion using source rectangle
            // image(img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight)
            image(this.image, 
                0, 0, // Destination position (always start at canvas origin)
                srcWidth, srcHeight, // Destination size (viewport size in scaled coordinates)
                originalSrcX, originalSrcY, // Source position in original image
                originalSrcWidth, originalSrcHeight // Source size in original image
            );
        } else {
            // Scaled image fits entirely in canvas, draw it centered
            image(this.image, offsetX, offsetY, this.imageWidth, this.imageHeight);
        }

        // Update shake animation
        if (this.shakeIntensity > 0) {
            this.shakeOffset = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= this.shakeDecay;

            if (this.shakeIntensity < 0.1) {
                this.shakeIntensity = 0;
                this.shakeOffset = 0;
            }
        }

        // Draw click animation if active
        if (this.clickAnimation) {
            this.drawClickAnimation();
        }
    }

    // Check if a click is within the clickable region
    isClickInRegion(mouseX, mouseY) {
        if (!this.loaded) return false;

        // First check if click is within canvas bounds
        if (mouseX < 0 || mouseX > this.canvasWidth ||
            mouseY < 0 || mouseY > this.canvasHeight) {
            return false;
        }

        // Convert canvas coordinates to scaled image coordinates
        let scaledImageMouseX, scaledImageMouseY;
        
        if (this.imageWidth > this.canvasWidth) {
            // Scaled image is larger - use viewport offset
            scaledImageMouseX = this.imageX + mouseX;
        } else {
            // Scaled image is smaller - account for centering
            scaledImageMouseX = mouseX - this.imageX;
        }
        
        if (this.imageHeight > this.canvasHeight) {
            // Scaled image is larger - use viewport offset
            scaledImageMouseY = this.imageY + mouseY;
        } else {
            // Scaled image is smaller - account for centering
            scaledImageMouseY = mouseY - this.imageY;
        }

        // Check if coordinates are within scaled image bounds
        if (scaledImageMouseX < 0 || scaledImageMouseX > this.imageWidth ||
            scaledImageMouseY < 0 || scaledImageMouseY > this.imageHeight) {
            return false;
        }

        // Convert scaled coordinates to original image coordinates for region checking
        // Region coordinates are in original image space
        const originalImageMouseX = scaledImageMouseX / this.scale;
        const originalImageMouseY = scaledImageMouseY / this.scale;

        const region = this.data.clickRegion;

        return originalImageMouseX >= region.x &&
            originalImageMouseX <= region.x + region.width &&
            originalImageMouseY >= region.y &&
            originalImageMouseY <= region.y + region.height;
    }

    // Handle click on the level
    handleClick(mouseX, mouseY) {
        if (!this.loaded) return false;

        const isCorrect = this.isClickInRegion(mouseX, mouseY);

        if (isCorrect) {
            this.triggerCorrectClickAnimation(mouseX, mouseY);
        } else {
            this.triggerIncorrectClickAnimation(mouseX, mouseY);
        }

        return isCorrect;
    }

    // Trigger correct click animation
    triggerCorrectClickAnimation(mouseX, mouseY) {
        this.clickAnimation = {
            type: 'correct',
            x: mouseX,
            y: mouseY,
            radius: 0,
            maxRadius: 150,
            alpha: 255,
            particles: this.createParticles(mouseX, mouseY, 20),
            confetti: this.createConfetti(mouseX, mouseY, 15),
            sparkles: this.createSparkles(mouseX, mouseY, 12)
        };
    }

    // Trigger incorrect click animation
    triggerIncorrectClickAnimation(mouseX, mouseY) {
        // Shake effect
        this.shakeIntensity = 10;

        // X mark animation
        this.clickAnimation = {
            type: 'incorrect',
            x: mouseX,
            y: mouseY,
            size: 0,
            maxSize: 30,
            alpha: 255,
            rotation: 0
        };
    }

    // Create particle effects for correct clicks
    createParticles(x, y, count) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 3 + Math.random() * 5;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.015,
                size: 3 + Math.random() * 4,
                color: this.getRandomParticleColor()
            });
        }
        return particles;
    }

    // Create confetti particles
    createConfetti(x, y, count) {
        const confetti = [];
        for (let i = 0; i < count; i++) {
            confetti.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 8 - 2,
                life: 1.0,
                decay: 0.01,
                size: 4 + Math.random() * 6,
                color: this.getRandomConfettiColor(),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        return confetti;
    }

    // Create sparkle effects
    createSparkles(x, y, count) {
        const sparkles = [];
        for (let i = 0; i < count; i++) {
            sparkles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                life: 1.0,
                decay: 0.03,
                size: 2 + Math.random() * 3,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        return sparkles;
    }

    // Get random particle color
    getRandomParticleColor() {
        const colors = [
            [255, 215, 0], // Gold
            [255, 165, 0], // Orange
            [255, 69, 0],  // Red-orange
            [255, 20, 147], // Deep pink
            [138, 43, 226]  // Blue violet
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Get random confetti color
    getRandomConfettiColor() {
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

    // Draw click animation
    drawClickAnimation() {
        if (!this.clickAnimation) return;

        push();

        if (this.clickAnimation.type === 'correct') {
            this.drawCorrectAnimation();
        } else if (this.clickAnimation.type === 'incorrect') {
            this.drawIncorrectAnimation();
        }

        pop();

        // Update animation
        this.updateClickAnimation();
    }

    // Draw correct click animation (expanding circle + particles + confetti + sparkles)
    drawCorrectAnimation() {
        const anim = this.clickAnimation;

        // Multiple expanding circles
        noFill();
        stroke(255, 215, 0, anim.alpha); // Gold color
        strokeWeight(4);
        circle(anim.x, anim.y, anim.radius * 2);

        stroke(255, 165, 0, anim.alpha * 0.7); // Orange
        strokeWeight(2);
        circle(anim.x, anim.y, anim.radius * 1.5);

        stroke(255, 69, 0, anim.alpha * 0.5); // Red-orange
        strokeWeight(1);
        circle(anim.x, anim.y, anim.radius * 1.2);

        // Particles
        for (let particle of anim.particles) {
            fill(particle.color[0], particle.color[1], particle.color[2], anim.alpha * particle.life);
            noStroke();
            circle(particle.x, particle.y, particle.size);
        }

        // Confetti
        for (let confetti of anim.confetti) {
            push();
            translate(confetti.x, confetti.y);
            rotate(confetti.rotation);
            fill(confetti.color[0], confetti.color[1], confetti.color[2], anim.alpha * confetti.life);
            noStroke();
            rect(-confetti.size / 2, -confetti.size / 2, confetti.size, confetti.size);
            pop();
        }

        // Sparkles
        for (let sparkle of anim.sparkles) {
            const twinkle = Math.sin(sparkle.twinkle) * 0.5 + 0.5;
            fill(255, 255, 255, anim.alpha * sparkle.life * twinkle);
            noStroke();
            circle(sparkle.x, sparkle.y, sparkle.size);

            // Add star shape for sparkles
            push();
            translate(sparkle.x, sparkle.y);
            rotate(sparkle.twinkle);
            stroke(255, 255, 255, anim.alpha * sparkle.life * twinkle);
            strokeWeight(1);
            line(-sparkle.size, 0, sparkle.size, 0);
            line(0, -sparkle.size, 0, sparkle.size);
            pop();
        }
    }

    // Draw incorrect click animation (X mark)
    drawIncorrectAnimation() {
        const anim = this.clickAnimation;

        push();
        translate(anim.x, anim.y);
        rotate(anim.rotation);

        stroke(255, 0, 0, anim.alpha); // Red color
        strokeWeight(4);
        line(-anim.size / 2, -anim.size / 2, anim.size / 2, anim.size / 2);
        line(anim.size / 2, -anim.size / 2, -anim.size / 2, anim.size / 2);

        pop();
    }

    // Update click animation
    updateClickAnimation() {
        const anim = this.clickAnimation;

        if (anim.type === 'correct') {
            anim.radius += 4;
            anim.alpha -= 4;

            // Update particles
            for (let particle of anim.particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= particle.decay;
                particle.vx *= 0.98; // Friction
                particle.vy *= 0.98;
            }

            // Update confetti
            for (let confetti of anim.confetti) {
                confetti.x += confetti.vx;
                confetti.y += confetti.vy;
                confetti.life -= confetti.decay;
                confetti.rotation += confetti.rotationSpeed;
                confetti.vy += 0.2; // Gravity
            }

            // Update sparkles
            for (let sparkle of anim.sparkles) {
                sparkle.life -= sparkle.decay;
                sparkle.twinkle += 0.3;
            }

            if (anim.radius >= anim.maxRadius || anim.alpha <= 0) {
                this.clickAnimation = null;
            }
        } else if (anim.type === 'incorrect') {
            anim.size += 2;
            anim.alpha -= 8;
            anim.rotation += 0.1;

            if (anim.size >= anim.maxSize || anim.alpha <= 0) {
                this.clickAnimation = null;
            }
        }
    }

    // Resize the level when canvas size changes
    resize(newWidth, newHeight) {
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;
        
        // Recalculate dimensions (this will recalculate originalImageX/Y based on new canvas size)
        // But preserve current pan offset to maintain viewport position as much as possible
        const savedPanX = this.panOffsetX;
        const savedPanY = this.panOffsetY;
        
        this.calculateImageDimensions();
        
        // Restore pan offset and constrain it
        this.panOffsetX = savedPanX;
        this.panOffsetY = savedPanY;
        this.constrainPan();
    }
}
