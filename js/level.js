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

        // Calculate scale factor for coordinate conversion
        this.scale = this.imageWidth / this.image.width;
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
            maxRadius: 100,
            alpha: 255,
            particles: this.createParticles(mouseX, mouseY, 8)
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
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                decay: 0.02
            });
        }
        return particles;
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

    // Draw correct click animation (expanding circle + particles)
    drawCorrectAnimation() {
        const anim = this.clickAnimation;

        // Expanding circle
        noFill();
        stroke(255, 215, 0, anim.alpha); // Gold color
        strokeWeight(3);
        circle(anim.x, anim.y, anim.radius * 2);

        // Particles
        for (let particle of anim.particles) {
            fill(255, 215, 0, anim.alpha * particle.life);
            noStroke();
            circle(particle.x, particle.y, 4);
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
            anim.radius += 3;
            anim.alpha -= 5;

            // Update particles
            for (let particle of anim.particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= particle.decay;
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
    }
}
