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
        this.scale = 1;
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

    // Calculate image dimensions to fit canvas while maintaining aspect ratio
    calculateImageDimensions() {
        if (!this.image) return;

        const imageAspect = this.image.width / this.image.height;
        const canvasAspect = this.canvasWidth / this.canvasHeight;

        if (imageAspect > canvasAspect) {
            // Image is wider than canvas
            this.imageWidth = this.canvasWidth;
            this.imageHeight = this.canvasWidth / imageAspect;
        } else {
            // Image is taller than canvas
            this.imageHeight = this.canvasHeight;
            this.imageWidth = this.canvasHeight * imageAspect;
        }

        // Center the image
        this.imageX = (this.canvasWidth - this.imageWidth) / 2;
        this.imageY = (this.canvasHeight - this.imageHeight) / 2;

        // Store original values for panning
        this.originalImageX = this.imageX;
        this.originalImageY = this.imageY;
        this.originalImageWidth = this.imageWidth;
        this.originalImageHeight = this.imageHeight;

        // Calculate scale factor for coordinate conversion
        this.scale = this.imageWidth / this.image.width;
    }

    // Set pan offset for touch controls
    setPanOffset(offsetX, offsetY) {
        this.panOffsetX = offsetX;
        this.panOffsetY = offsetY;

        // Update image position with pan offset
        this.imageX = this.originalImageX + offsetX;
        this.imageY = this.originalImageY + offsetY;
    }

    // Display the level image
    display() {
        if (!this.loaded || !this.image) return;

        // Apply shake effect if active
        let offsetX = this.imageX + this.shakeOffset;
        let offsetY = this.imageY;

        // Draw the image
        image(this.image, offsetX, offsetY, this.imageWidth, this.imageHeight);

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

        // Convert mouse coordinates to image coordinates
        const imageMouseX = (mouseX - this.imageX) / this.scale;
        const imageMouseY = (mouseY - this.imageY) / this.scale;

        const region = this.data.clickRegion;

        return imageMouseX >= region.x &&
            imageMouseX <= region.x + region.width &&
            imageMouseY >= region.y &&
            imageMouseY <= region.y + region.height;
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
        this.calculateImageDimensions();

        // Reset pan offset when resizing
        this.panOffsetX = 0;
        this.panOffsetY = 0;
    }
}
