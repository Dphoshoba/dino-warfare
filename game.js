class Sprite {
    constructor(image, frameWidth, frameHeight, frameCount) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.currentFrame = 0;
        this.frameDelay = 5;
        this.frameCounter = 0;
    }
    
    update() {
        this.frameCounter++;
        if (this.frameCounter >= this.frameDelay) {
            this.frameCounter = 0;
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }
    }
    
    draw(ctx, x, y, width, height, flipX = false) {
        ctx.save();
        if (flipX) {
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            x = 0;
        }
        ctx.drawImage(
            this.image,
            this.currentFrame * this.frameWidth,
            0,
            this.frameWidth,
            this.frameHeight,
            x,
            y,
            width,
            height
        );
        ctx.restore();
    }
}

class ExplosionEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = 40;
        this.alpha = 1;
        this.done = false;
    }
    update() {
        this.radius += 3;
        this.alpha -= 0.07;
        if (this.radius >= this.maxRadius || this.alpha <= 0) {
            this.done = true;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'orange';
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        console.log('[DEBUG] Game started. Player health:', this.player.health);
        this.dinosaurs = [];
        this.bullets = [];
        this.score = 0;
        this.gameOver = false;
        
        this.spawnInterval = 2000; // Spawn a dinosaur every 2 seconds
        this.lastSpawnTime = 0;
        
        this.powerUps = [];
        this.powerUpSpawnInterval = 10000; // Spawn power-up every 10 seconds
        this.lastPowerUpSpawnTime = 0;
        this.playerSpeedBoost = 1;
        this.speedBoostTimer = 0;
        
        // Sound setup
        this.sounds = {
            shoot: document.getElementById('shootSound'),
            hit: document.getElementById('hitSound'),
            powerUp: document.getElementById('powerUpSound'),
            gameOver: document.getElementById('gameOverSound'),
            background: document.getElementById('backgroundMusic'),
            shield: document.getElementById('shieldSound'),
            dodge: document.getElementById('dodgeSound'),
            armor: document.getElementById('armorSound'),
            regen: document.getElementById('regenSound'),
            stun: document.getElementById('stunSound'),
            boss: document.getElementById('bossMusic')
        };
        
        this.soundEnabled = true;
        this.setupSoundControls();
        
        this.setupEventListeners();
        this.loadSprites();
        
        // Difficulty settings
        this.difficulty = 1;
        this.difficultyIncreaseInterval = 30000; // Increase difficulty every 30 seconds
        this.lastDifficultyIncrease = 0;
        this.maxDifficulty = 10;
        
        // Difficulty-based spawn rates
        this.baseSpawnInterval = 2000;
        this.spawnInterval = this.baseSpawnInterval;
        
        this.wave = 1;
        this.dinosPerWave = 10;
        this.dinosSpawned = 0;
        this.dinosDefeated = 0;
        this.inWaveTransition = false;
        this.paused = false;
        
        this.effects = [];
        
        this.stunOverlayTimer = 0;
        this.bossActive = false;
        
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('endButton').addEventListener('click', () => this.endGame());
        
        window.game = this;
        document.getElementById('gameOver').classList.add('hidden');
    }
    
    setupSoundControls() {
        const soundToggle = document.getElementById('soundToggle');
        soundToggle.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundToggle.classList.toggle('muted');
            if (this.soundEnabled) {
                this.sounds.background.play();
                soundToggle.textContent = '🔊';
            } else {
                this.sounds.background.pause();
                soundToggle.textContent = '🔇';
            }
        });
    }
    
    playSound(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play();
        }
    }
    
    setupEventListeners() {
        // Mouse movement for player
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.player.x = e.clientX - rect.left;
        });
        
        // Shooting
        this.canvas.addEventListener('click', () => {
            if (!this.gameOver && this.player.ammo > 0) {
                // Create bullet at center of player
                const bullet = new Bullet(this.player.x + this.player.width/2, this.player.y);
                this.bullets.push(bullet);
                console.log(`Bullet created at x=${bullet.x}, y=${bullet.y}`);
                this.player.ammo--;
                document.getElementById('ammo').textContent = this.player.ammo;
                this.playSound('shoot');
            }
        });
        
        // Restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });
        
        // Start background music when user first interacts
        const startGame = () => {
            if (this.soundEnabled) {
                this.sounds.background.play();
            }
            document.removeEventListener('click', startGame);
        };
        document.addEventListener('click', startGame);
    }
    
    async loadSprites() {
        const spritePromises = [
            this.loadSprite('player', 'sprites/sprites_player.png', 64, 64, 4),
            this.loadSprite('raptor', 'sprites/sprites_raptor.png', 64, 64, 4),
            this.loadSprite('triceratops', 'sprites/sprites_triceratops.png', 64, 64, 4),
            this.loadSprite('trex', 'sprites/sprites_trex.png', 64, 64, 4),
            this.loadSprite('bullet', 'sprites/sprites_bullet.png', 32, 32, 2),
            this.loadSprite('powerup', 'sprites/sprites_powerup.png', 32, 32, 4),
            this.loadSprite('pterodactyl', 'sprites/sprites_pterodactyl.png', 64, 64, 4),
            this.loadSprite('stegosaurus', 'sprites/sprites_stegosaurus.png', 64, 64, 4),
            this.loadSprite('ankylosaurus', 'sprites/sprites_ankylosaurus.png', 64, 64, 4),
            this.loadSprite('velociraptor', 'sprites/sprites_velociraptor.png', 64, 64, 4),
            this.loadSprite('spinosaurus', 'sprites/sprites_spinosaurus.png', 64, 64, 4),
            this.loadSprite('pachycephalosaurus', 'sprites/sprites_pachycephalosaurus.png', 64, 64, 4)
        ];
        
        await Promise.all(spritePromises);
        this.gameLoop();
    }
    
    loadSprite(name, src, frameWidth, frameHeight, frameCount) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.sprites = this.sprites || {};
                this.sprites[name] = new Sprite(img, frameWidth, frameHeight, frameCount);
                resolve();
            };
            img.src = src;
        });
    }
    
    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pauseButton').textContent = this.paused ? '▶️' : '⏸️';
        if (!this.paused) this.gameLoop();
    }
    
    startNextWave() {
        this.wave++;
        this.dinosPerWave += 3;
        this.dinosSpawned = 0;
        this.dinosDefeated = 0;
        this.inWaveTransition = false;
        this.showWaveMessage();
        this.player.health = Math.min(100, this.player.health + 10);
        this.player.ammo += 10;
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('ammo').textContent = this.player.ammo;
        console.log(`--- Starting Wave ${this.wave} ---`);
        console.log(`dinosPerWave: ${this.dinosPerWave}`);
    }
    
    showWaveMessage() {
        const message = document.createElement('div');
        message.className = 'difficulty-message';
        message.textContent = `Wave ${this.wave}`;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 2000);
    }
    
    spawnDinosaur() {
        if (this.inWaveTransition) return;
        const now = Date.now();
        if (now - this.lastSpawnTime > this.spawnInterval && this.dinosSpawned < this.dinosPerWave) {
            const x = Math.random() * (this.canvas.width - 60);
            const dino = new Dinosaur(x, -50);
            
            // Scale dinosaur properties based on difficulty
            dino.speed *= (1 + (this.difficulty - 1) * 0.1);
            dino.health = Math.ceil(dino.health * (1 + (this.difficulty - 1) * 0.2));
            dino.points = Math.floor(dino.points * (1 + (this.difficulty - 1) * 0.1));
            
            this.dinosaurs.push(dino);
            this.dinosSpawned++;
            this.lastSpawnTime = now;
            console.log(`Spawned dino: ${this.dinosSpawned}/${this.dinosPerWave}`);
        }
    }
    
    spawnPowerUp() {
        const now = Date.now();
        if (now - this.lastPowerUpSpawnTime > this.powerUpSpawnInterval) {
            const x = Math.random() * (this.canvas.width - 30);
            this.powerUps.push(new PowerUp(x, -50));
            this.lastPowerUpSpawnTime = now;
        }
    }
    
    update() {
        console.log(`[DEBUG] Update: Player health: ${this.player.health}, gameOver: ${this.gameOver}, paused: ${this.paused}`);
        console.log(`Wave: ${this.wave}, dinosSpawned: ${this.dinosSpawned}, dinosDefeated: ${this.dinosDefeated}, dinosPerWave: ${this.dinosPerWave}, inWaveTransition: ${this.inWaveTransition}`);
        if (this.gameOver || this.paused) return;
        
        // Update difficulty
        this.updateDifficulty();
        
        this.spawnDinosaur();
        this.spawnPowerUp();
        
        // Update player
        this.player.update();
        
        // End game if player has no lives left
        if (this.player.lives <= 0 && !this.gameOver) {
            this.endGame();
            return;
        }
        
        // Update speed boost timer
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer--;
            if (this.speedBoostTimer === 0) {
                this.playerSpeedBoost = 1;
            }
        }
        
        // Update dinosaurs and check for screen boundaries
        for (let i = this.dinosaurs.length - 1; i >= 0; i--) {
            const dino = this.dinosaurs[i];
            dino.update();
            
            // Count dinosaurs that leave the screen as defeated
            if (dino.y > this.canvas.height || dino.x > this.canvas.width || dino.x + dino.width < 0) {
                this.dinosDefeated++;
                this.dinosaurs.splice(i, 1);
                console.log(`Dino left screen at (${dino.x}, ${dino.y}). dinosDefeated: ${this.dinosDefeated}`);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(dino, this.player)) {
                if (this.player.shieldActive) {
                    this.player.shieldActive = false;
                    this.dinosDefeated++;
                    this.dinosaurs.splice(i, 1);
                    console.log(`Dino destroyed by shield. dinosDefeated: ${this.dinosDefeated}`);
                } else {
                    this.player.takeDamage(20);
                    this.dinosDefeated++;
                    this.dinosaurs.splice(i, 1);
                    console.log(`Player hit by dino. dinosDefeated: ${this.dinosDefeated}`);
                }
            }
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            console.log(`Bullet at x=${bullet.x}, y=${bullet.y}`);
            
            // Handle bouncing bullets
            if (bullet.bouncing && bullet.y <= 0) {
                bullet.y = 0;
                bullet.vy = -bullet.vy;
            }
            
            // Handle homing bullets
            if (bullet.homing) {
                // Find nearest dinosaur
                let nearestDino = null;
                let minDist = Infinity;
                for (const dino of this.dinosaurs) {
                    const dx = dino.x + dino.width/2 - bullet.x;
                    const dy = dino.y + dino.height/2 - bullet.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestDino = dino;
                    }
                }
                
                // Adjust bullet trajectory towards nearest dinosaur
                if (nearestDino && minDist < 200) {
                    const dx = nearestDino.x + nearestDino.width/2 - bullet.x;
                    const dy = nearestDino.y + nearestDino.height/2 - bullet.y;
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(bullet.vx*bullet.vx + bullet.vy*bullet.vy);
                    bullet.vx = Math.cos(angle) * speed;
                    bullet.vy = Math.sin(angle) * speed;
                }
            }
            
            // Check collision with dinosaurs
            let hitDino = false;
            for (let i = this.dinosaurs.length - 1; i >= 0; i--) {
                const dino = this.dinosaurs[i];
                if (this.checkCollision(bullet, dino)) {
                    console.log(`Bullet hit dino: type=${dino.type}, health=${dino.health}`);
                    // Velociraptor: 30% chance to dodge
                    if (dino.type === 'velociraptor' && Math.random() < 0.3) {
                        console.log('Velociraptor dodged!');
                        continue;
                    }
                    // Stegosaurus: 10% chance to reflect, immune for 1s
                    if (dino.type === 'stegosaurus') {
                        if (dino.reflectCooldown > 0) {
                            console.log('Stegosaurus is immune!');
                            continue;
                        } else if (Math.random() < 0.1) {
                            dino.reflectCooldown = 60; // immune for 1s
                            console.log('Stegosaurus reflected the bullet!');
                            continue;
                        }
                    }
                    // Ankylosaurus: takes half damage (normally), but now set to 0.5 for one-hit kill
                    if (dino.type === 'ankylosaurus') {
                        dino.health = 0.5;
                        console.log(`Ankylosaurus hit! New health: ${dino.health}`);
                    } else {
                        dino.health = 0;
                        console.log(`Dino health after hit: ${dino.health}`);
                    }
                    this.playSound('hit');
                    if (dino.health <= 0) {
                        this.score += dino.points;
                        this.dinosDefeated++;
                        document.getElementById('score').textContent = this.score;
                        pulseHudValue('score');
                        this.effects.push(new ExplosionEffect(dino.x + dino.width/2, dino.y + dino.height/2));
                        this.dinosaurs.splice(i, 1);
                        setPlayerStatus('DINO DEFEATED', '#00eaff');
                        showFloatingText('DEFEATED!', dino.x + dino.width/2, dino.y, '#00eaff');
                        console.log('Dino defeated!');
                    }
                    hitDino = true;
                    if (!bullet.piercing) {
                        return false; // Remove bullet if not piercing
                    }
                }
            }
            
            // Remove bullet if it hits a dinosaur (and isn't piercing) or leaves the screen
            return !hitDino && bullet.y > 0 && bullet.y < this.canvas.height && 
                   bullet.x > 0 && bullet.x < this.canvas.width;
        });
        
        // Update power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update();
            
            // Check collision with player
            if (this.checkCollision(powerUp, this.player)) {
                this.applyPowerUp(powerUp);
                return false;
            }
            
            return powerUp.y < this.canvas.height;
        });
        
        // Check for wave completion
        if (!this.inWaveTransition && this.dinosDefeated >= this.dinosPerWave && this.dinosaurs.length === 0) {
            this.inWaveTransition = true;
            setTimeout(() => this.startNextWave(), 2000);
            console.log(`Wave ${this.wave} complete. dinosDefeated: ${this.dinosDefeated}`);
        }
        
        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.update();
            return !effect.done;
        });
        
        if (this.stunOverlayTimer > 0) {
            this.stunOverlayTimer--;
        }
        
        // Example: show rapid fire timer as weapon bar
        let percent = 0;
        if (this.player.rapidFire && this.rapidFireTimer > 0) {
            percent = (this.rapidFireTimer / 300) * 100;
        } else if (this.player.tripleShot && this.player.tripleShotTimer > 0) {
            percent = (this.player.tripleShotTimer / 300) * 100;
        } else if (this.player.piercingShot && this.player.piercingShotTimer > 0) {
            percent = (this.player.piercingShotTimer / 300) * 100;
        } else if (this.player.bouncingShot && this.player.bouncingShotTimer > 0) {
            percent = (this.player.bouncingShotTimer / 300) * 100;
        } else if (this.player.homingShot && this.player.homingShotTimer > 0) {
            percent = (this.player.homingShotTimer / 300) * 100;
        }
        updateWeaponBar(percent);
        
        let weaponType = 'default';
        if (this.player.rapidFire) weaponType = 'rapidfire';
        else if (this.player.tripleShot) weaponType = 'tripleshot';
        else if (this.player.piercingShot) weaponType = 'piercing';
        else if (this.player.bouncingShot) weaponType = 'bouncing';
        else if (this.player.homingShot) weaponType = 'homing';
        setWeaponIcon(weaponType);
    }
    
    updateDifficulty() {
        const now = Date.now();
        if (now - this.lastDifficultyIncrease > this.difficultyIncreaseInterval) {
            this.difficulty = Math.min(this.maxDifficulty, this.difficulty + 1);
            this.lastDifficultyIncrease = now;
            
            // Update spawn rate
            this.spawnInterval = Math.max(500, this.baseSpawnInterval - (this.difficulty * 150));
            
            // Show difficulty increase message
            this.showDifficultyMessage();
        }
    }
    
    showDifficultyMessage() {
        const message = document.createElement('div');
        message.className = 'difficulty-message';
        message.textContent = `Difficulty Level: ${this.difficulty}`;
        document.body.appendChild(message);
        
        // Remove message after animation
        setTimeout(() => {
            message.remove();
        }, 2000);
    }
    
    checkCollision(obj1, obj2) {
        // Use center-based collision for bullets
        const left1 = obj1.x - obj1.width/2;
        const right1 = obj1.x + obj1.width/2;
        const top1 = obj1.y - obj1.height/2;
        const bottom1 = obj1.y + obj1.height/2;
        const left2 = obj2.x;
        const right2 = obj2.x + obj2.width;
        const top2 = obj2.y;
        const bottom2 = obj2.y + obj2.height;
        const overlap = left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2;
        if (obj1 instanceof Bullet && obj2 instanceof Dinosaur) {
            console.log(`Bullet [${left1},${top1},${right1},${bottom1}] Dino [${left2},${top2},${right2},${bottom2}] => ${overlap}`);
        }
        return overlap;
    }
    
    applyPowerUp(powerUp) {
        this.playSound('powerUp');
        switch(powerUp.type) {
            case 'health':
                this.player.health = Math.min(100, this.player.health + powerUp.value);
                document.getElementById('health').textContent = this.player.health;
                pulseHudValue('health');
                setPlayerStatus('HEALTH UP', '#00ff99');
                updateHealthBar(this.player.health);
                break;
            case 'ammo':
                this.player.ammo += powerUp.value;
                document.getElementById('ammo').textContent = this.player.ammo;
                pulseHudValue('ammo');
                setPlayerStatus('AMMO UP', '#00eaff');
                break;
            case 'speed':
                this.playerSpeedBoost = powerUp.value;
                this.speedBoostTimer = 300; // 5 seconds at 60 FPS
                setPlayerStatus('SPEED BOOST', '#00eaff');
                break;
            case 'shield':
                this.player.shield = (this.player.shield || 0) + 1;
                setPlayerStatus('SHIELD UP', '#00ff99');
                break;
            case 'rapidfire':
                this.player.rapidFire = true;
                this.rapidFireTimer = 300; // 5 seconds at 60 FPS
                setPlayerStatus('RAPID FIRE', '#00eaff');
                break;
            case 'tripleshot':
                this.player.tripleShot = true;
                this.player.tripleShotTimer = 300; // 5 seconds at 60 FPS
                setPlayerStatus('TRIPLE SHOT', '#ff00cc');
                break;
            case 'piercing':
                this.player.piercingShot = true;
                this.player.piercingShotTimer = 300; // 5 seconds at 60 FPS
                setPlayerStatus('PIERCING SHOT', '#800080');
                break;
            case 'bouncing':
                this.player.bouncingShot = true;
                this.player.bouncingShotTimer = 300; // 5 seconds at 60 FPS
                setPlayerStatus('BOUNCING SHOT', '#4B0082');
                break;
            case 'homing':
                this.player.homingShot = true;
                this.player.homingShotTimer = 300; // 5 seconds at 60 FPS
                setPlayerStatus('HOMING SHOT', '#00FF7F');
                break;
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        
        // Draw dinosaurs
        this.dinosaurs.forEach(dino => dino.draw(this.ctx));
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
        
        // Draw effects
        this.effects.forEach(effect => effect.draw(this.ctx));
        
        // Player stun overlay
        if (this.stunOverlayTimer > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.4;
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
            this.ctx.save();
            this.ctx.font = '48px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.globalAlpha = 1;
            this.ctx.fillText('STUNNED!', this.canvas.width/2 - 100, this.canvas.height/2);
            this.ctx.restore();
        }
    }
    
    gameLoop() {
        console.log('Game loop running. paused:', this.paused, 'gameOver:', this.gameOver, 'inWaveTransition:', this.inWaveTransition);
        if (!this.gameOver) {
            if (!this.paused) {
                this.update();
                this.draw();
            }
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.paused = false;
        this.playSound('gameOver');
        this.sounds.background.pause();
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
    }
    
    restart() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        this.dinosaurs = [];
        this.bullets = [];
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.wave = 1;
        this.dinosPerWave = 10;
        this.dinosSpawned = 0;
        this.dinosDefeated = 0;
        this.inWaveTransition = false;
        this.effects = [];
        document.getElementById('score').textContent = '0';
        document.getElementById('health').textContent = '100';
        document.getElementById('ammo').textContent = '60';
        document.getElementById('gameOver').classList.add('hidden');
        if (this.soundEnabled) {
            this.sounds.background.play();
        }
        this.spawnInterval = this.baseSpawnInterval;
        this.lastDifficultyIncrease = Date.now();
        this.gameLoop();
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.health = 100;
        this.lives = 4;
        this.ammo = 60;
        this.baseSpeed = 5;
        this.shield = 0;
        this.rapidFire = false;
        this.tripleShot = false;
        this.piercingShot = false;
        this.bouncingShot = false;
        this.homingShot = false;
        this.tripleShotTimer = 0;
        this.piercingShotTimer = 0;
        this.bouncingShotTimer = 0;
        this.homingShotTimer = 0;
    }
    
    update() {
        // Keep player within canvas bounds with speed boost
        const speed = this.baseSpeed * game.playerSpeedBoost;
        this.x = Math.max(0, Math.min(this.x, 800 - this.width));
        
        // Update power-up timers
        if (this.tripleShotTimer > 0) {
            this.tripleShotTimer--;
            if (this.tripleShotTimer === 0) {
                this.tripleShot = false;
            }
        }
        if (this.piercingShotTimer > 0) {
            this.piercingShotTimer--;
            if (this.piercingShotTimer === 0) {
                this.piercingShot = false;
            }
        }
        if (this.bouncingShotTimer > 0) {
            this.bouncingShotTimer--;
            if (this.bouncingShotTimer === 0) {
                this.bouncingShot = false;
            }
        }
        if (this.homingShotTimer > 0) {
            this.homingShotTimer--;
            if (this.homingShotTimer === 0) {
                this.homingShot = false;
            }
        }
        updateHealthBar(this.health);
        document.getElementById('lives').textContent = this.lives;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        document.getElementById('health').textContent = this.health;
        updateHealthBar(this.health);
        if (this.health <= 0) {
            if (this.lives > 1) {
                this.lives--;
                this.health = 100;
                this.ammo = 60;
                document.getElementById('lives').textContent = this.lives;
                document.getElementById('health').textContent = this.health;
                document.getElementById('ammo').textContent = this.ammo;
                updateHealthBar(this.health);
                setPlayerStatus('LIFE LOST', '#ff0044');
            } else {
                this.lives = 0;
                document.getElementById('lives').textContent = this.lives;
                // Game over will be handled in Game.update()
            }
        }
    }
    
    draw(ctx) {
        if (game.sprites && game.sprites.player) {
            const flipX = this.x < game.canvas.width / 2;
            game.sprites.player.draw(ctx, this.x, this.y, this.width, this.height, flipX);
            
            // Draw power-up effects
            if (this.tripleShot) {
                ctx.save();
                ctx.strokeStyle = '#FF00FF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            if (this.piercingShot) {
                ctx.save();
                ctx.strokeStyle = '#800080';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            if (this.bouncingShot) {
                ctx.save();
                ctx.strokeStyle = '#4B0082';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 11, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            if (this.homingShot) {
                ctx.save();
                ctx.strokeStyle = '#00FF7F';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 14, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        } else {
            // Fallback to basic shape if sprite not loaded
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Dinosaur {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.type = this.getRandomType();
        this.setProperties();
    }
    
    getRandomType() {
        const types = [
            'raptor', 'triceratops', 't-rex', 'pterodactyl',
            'stegosaurus', 'ankylosaurus', 'velociraptor', 'spinosaurus', 'pachycephalosaurus'
        ];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    setProperties() {
        switch(this.type) {
            case 'raptor':
                this.speed = 4;
                this.health = 1;
                this.color = '#A0522D';
                this.points = 10;
                break;
            case 'triceratops':
                this.speed = 1.5;
                this.health = 3;
                this.color = '#228B22';
                this.points = 20;
                break;
            case 't-rex':
                this.speed = 2;
                this.health = 2;
                this.color = '#556B2F';
                this.points = 15;
                break;
            case 'pterodactyl':
                this.speed = 3;
                this.health = 1;
                this.color = '#C2B280';
                this.points = 25;
                this.amplitude = 40 + Math.random() * 40;
                this.frequency = 0.02 + Math.random() * 0.02;
                this.baseY = this.y;
                break;
            case 'stegosaurus':
                this.speed = 1.2;
                this.health = 6;
                this.color = '#4682B4';
                this.points = 30;
                this.reflectCooldown = 0;
                break;
            case 'ankylosaurus':
                this.speed = 1.5;
                this.health = 10;
                this.color = '#A9A9A9';
                this.points = 35;
                break;
            case 'velociraptor':
                this.speed = 6.5;
                this.health = 1;
                this.color = '#FFA500';
                this.points = 12;
                break;
            case 'spinosaurus':
                this.speed = 2.2;
                this.health = 15;
                this.color = '#2F4F4F';
                this.points = 50;
                break;
            case 'pachycephalosaurus':
                this.speed = 3.5;
                this.health = 2;
                this.color = '#800080';
                this.points = 18;
                break;
        }
    }
    
    update() {
        if (this.type === 'pterodactyl') {
            this.x += this.speed;
            this.y = this.baseY + Math.sin(this.x * this.frequency) * this.amplitude;
        } else if (this.type === 'pachycephalosaurus') {
            // Charge in bursts
            if (!this.chargeTimer || this.chargeTimer <= 0) {
                this.chargeTimer = Math.floor(Math.random() * 60) + 30;
                this.chargeSpeed = Math.random() > 0.5 ? this.speed * 2 : this.speed;
            }
            this.y += this.chargeSpeed;
            this.chargeTimer--;
        } else {
            this.y += this.speed;
        }
        // Spinosaurus: Regenerate health slowly
        if (this.type === 'spinosaurus' && this.health < this.getMaxHealth() && Math.random() < 0.01) {
            this.health++;
        }
        // Stegosaurus: Reflect bullets occasionally
        if (this.type === 'stegosaurus' && this.reflectCooldown > 0) {
            this.reflectCooldown--;
        }
    }
    
    draw(ctx) {
        if (game.sprites) {
            let sprite;
            switch(this.type) {
                case 'raptor': sprite = game.sprites.raptor; break;
                case 'triceratops': sprite = game.sprites.triceratops; break;
                case 't-rex': sprite = game.sprites.trex; break;
                case 'pterodactyl': sprite = game.sprites.pterodactyl; break;
                case 'stegosaurus': sprite = game.sprites.stegosaurus; break;
                case 'ankylosaurus': sprite = game.sprites.ankylosaurus; break;
                case 'velociraptor': sprite = game.sprites.velociraptor; break;
                case 'spinosaurus': sprite = game.sprites.spinosaurus; break;
                case 'pachycephalosaurus': sprite = game.sprites.pachycephalosaurus; break;
            }
            if (sprite) {
                sprite.draw(ctx, this.x, this.y, this.width, this.height);
            } else {
                this.drawBasic(ctx);
            }
        } else {
            this.drawBasic(ctx);
        }
        this.drawHealthBar(ctx);
        // Draw hitbox for debugging
        ctx.save();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    
    drawBasic(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 20, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 45, this.y + 20, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y + 35);
        ctx.lineTo(this.x + 40, this.y + 35);
        ctx.stroke();
    }
    
    drawHealthBar(ctx) {
        const healthBarWidth = this.width;
        const healthBarHeight = 5;
        const healthPercentage = this.health / this.getMaxHealth();
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#0F0';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth * healthPercentage, healthBarHeight);
    }
    
    getMaxHealth() {
        switch(this.type) {
            case 'raptor': return 1;
            case 'triceratops': return 3;
            case 't-rex': return 2;
            case 'pterodactyl': return 1;
            case 'stegosaurus': return 4;
            case 'ankylosaurus': return 5;
            case 'velociraptor': return 1;
            case 'spinosaurus': return 6;
            case 'pachycephalosaurus': return 2;
        }
    }
}

class Bullet {
    constructor(x, y, vx = 0, vy = -5) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 20;
        this.vx = vx;
        this.vy = vy;
        this.piercing = false;
        this.bouncing = false;
        this.homing = false;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw(ctx) {
        if (game.sprites && game.sprites.bullet) {
            game.sprites.bullet.draw(ctx, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            // Draw effects for special bullets
            if (this.piercing) {
                ctx.save();
                ctx.strokeStyle = '#800080';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/2 + 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            if (this.bouncing) {
                ctx.save();
                ctx.strokeStyle = '#4B0082';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/2 + 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            if (this.homing) {
                ctx.save();
                ctx.strokeStyle = '#00FF7F';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width/2 + 6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        } else {
            // Fallback to basic shape if sprite not loaded
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
        // Draw hitbox for debugging
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = this.getRandomType();
        this.speed = 2;
        this.setProperties();
    }
    
    getRandomType() {
        const types = ['health', 'ammo', 'speed', 'shield', 'rapidfire', 'tripleshot', 'piercing', 'bouncing', 'homing'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    setProperties() {
        switch(this.type) {
            case 'health':
                this.color = '#FF0000';
                this.value = 20;
                break;
            case 'ammo':
                this.color = '#FFFF00';
                this.value = 15;
                break;
            case 'speed':
                this.color = '#00FFFF';
                this.value = 2;
                break;
            case 'shield':
                this.color = '#00FF00';
                this.value = 1;
                break;
            case 'rapidfire':
                this.color = '#FFA500';
                this.value = 1;
                break;
            case 'tripleshot':
                this.color = '#FF00FF';
                this.value = 1;
                break;
            case 'piercing':
                this.color = '#800080';
                this.value = 1;
                break;
            case 'bouncing':
                this.color = '#4B0082';
                this.value = 1;
                break;
            case 'homing':
                this.color = '#00FF7F';
                this.value = 1;
                break;
        }
    }
    
    update() {
        this.y += this.speed;
    }
    
    draw(ctx) {
        if (game.sprites && game.sprites.powerup) {
            // Draw base powerup sprite
            game.sprites.powerup.draw(ctx, this.x, this.y, this.width, this.height);
            // Draw icon overlay for new types
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = '#000';
            if (this.type === 'shield') {
                ctx.beginPath();
                ctx.arc(this.width/2, this.height/2, this.width/3, 0, Math.PI * 2);
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else if (this.type === 'rapidfire') {
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(this.width/2-6, this.height/2-2, 12, 4);
                ctx.beginPath();
                ctx.moveTo(this.width/2+6, this.height/2);
                ctx.lineTo(this.width-4, this.height/2-6);
                ctx.lineTo(this.width-4, this.height/2+6);
                ctx.closePath();
                ctx.fill();
            } else if (this.type === 'tripleshot') {
                // Draw three arrows in a spread pattern
                ctx.fillStyle = '#FF00FF';
                for (let i = -1; i <= 1; i++) {
                    ctx.save();
                    ctx.translate(this.width/2, this.height/2);
                    ctx.rotate(i * Math.PI/6);
                    ctx.beginPath();
                    ctx.moveTo(-6, 0);
                    ctx.lineTo(6, 0);
                    ctx.lineTo(0, -8);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            } else if (this.type === 'piercing') {
                // Draw a line with arrow through a circle
                ctx.strokeStyle = '#800080';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.width/2, this.height/2, this.width/4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(this.width/4, this.height/2);
                ctx.lineTo(this.width*3/4, this.height/2);
                ctx.lineTo(this.width*3/4-4, this.height/2-4);
                ctx.moveTo(this.width*3/4, this.height/2);
                ctx.lineTo(this.width*3/4-4, this.height/2+4);
                ctx.stroke();
            } else if (this.type === 'bouncing') {
                // Draw a bouncing arrow
                ctx.strokeStyle = '#4B0082';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.width/4, this.height*3/4);
                ctx.lineTo(this.width/2, this.height/4);
                ctx.lineTo(this.width*3/4, this.height*3/4);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(this.width/2, this.height/4);
                ctx.lineTo(this.width/2-4, this.height/4+4);
                ctx.moveTo(this.width/2, this.height/4);
                ctx.lineTo(this.width/2+4, this.height/4+4);
                ctx.stroke();
            } else if (this.type === 'homing') {
                // Draw a target with arrow
                ctx.strokeStyle = '#00FF7F';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.width/2, this.height/2, this.width/4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(this.width/2, this.height/2);
                ctx.lineTo(this.width*3/4, this.height/2);
                ctx.lineTo(this.width*3/4-4, this.height/2-4);
                ctx.moveTo(this.width*3/4, this.height/2);
                ctx.lineTo(this.width*3/4-4, this.height/2+4);
                ctx.stroke();
            }
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    // Don't start the game automatically - it will be started by the player setup button
    const setup = document.getElementById('playerSetup');
    if (setup) {
        setup.style.display = 'block';
        setup.setAttribute('aria-hidden', 'false');
    }
    updatePlayerHUD();
});

// --- HUD/FX Utilities ---
function pulseHudValue(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('pulse');
    setTimeout(() => el.classList.remove('pulse'), 700);
}
function showFloatingText(text, x, y, color = '#00eaff') {
    const float = document.createElement('div');
    float.textContent = text;
    float.className = 'floating-text';
    float.style.left = `${x}px`;
    float.style.top = `${y}px`;
    float.style.color = color;
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 1200);
}
function screenShake(intensity = 8, duration = 300) {
    const container = document.querySelector('.game-container');
    if (!container) return;
    container.style.transition = 'none';
    let shake = setInterval(() => {
        container.style.transform = `translate(${(Math.random()-0.5)*intensity}px, ${(Math.random()-0.5)*intensity}px)`;
    }, 16);
    setTimeout(() => {
        clearInterval(shake);
        container.style.transform = '';
        container.style.transition = '';
    }, duration);
}
function setPlayerStatus(status, color = '#00ff99') {
    const el = document.getElementById('playerStatus');
    if (el) {
        el.textContent = status;
        el.style.color = color;
        el.style.textShadow = `0 0 8px ${color}88`;
    }
}
// Update health bar
function updateHealthBar(health) {
    const bar = document.getElementById('healthBar');
    if (bar) {
        bar.style.width = Math.max(0, Math.min(100, health)) + '%';
    }
}
// Update weapon bar (for powerup duration, etc.)
function updateWeaponBar(percent) {
    const bar = document.getElementById('weaponBar');
    if (bar) {
        bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
    }
}
// Add floating text CSS
if (!document.querySelector('style[data-fx]')) {
    const style = document.createElement('style');
    style.setAttribute('data-fx', '');
    style.innerHTML = `
.floating-text {
    position: absolute;
    font-family: 'Orbitron', Arial, sans-serif;
    font-size: 1.2em;
    font-weight: bold;
    pointer-events: none;
    z-index: 9999;
    text-shadow: 0 0 8px #000, 0 0 16px #00eaff;
    animation: floatUp 1.2s cubic-bezier(.4,2,.6,1) forwards;
}
@keyframes floatUp {
    0% { opacity: 1; transform: translateY(0) scale(1);}
    80% { opacity: 1; }
    100% { opacity: 0; transform: translateY(-40px) scale(1.2);}
}
`;
    document.head.appendChild(style);
}
// --- Dynamic Weapon Icon ---
function setWeaponIcon(type) {
    const icon = document.getElementById('weaponIcon');
    if (!icon) return;
    let svg = '';
    switch(type) {
        case 'tripleshot':
            svg = '<g><rect x="4" y="10" width="16" height="4" rx="2" fill="#00ff99"/><rect x="8" y="7" width="8" height="2" rx="1" fill="#00eaff"/><rect x="8" y="15" width="8" height="2" rx="1" fill="#00eaff"/></g>';
            break;
        case 'piercing':
            svg = '<g><rect x="4" y="10" width="16" height="4" rx="2" fill="#800080"/><line x1="12" y1="6" x2="12" y2="18" stroke="#00eaff" stroke-width="2"/></g>';
            break;
        case 'bouncing':
            svg = '<g><rect x="4" y="10" width="16" height="4" rx="2" fill="#4B0082"/><circle cx="12" cy="12" r="4" fill="none" stroke="#00eaff" stroke-width="2"/></g>';
            break;
        case 'homing':
            svg = '<g><rect x="4" y="10" width="16" height="4" rx="2" fill="#00FF7F"/><circle cx="12" cy="12" r="6" fill="none" stroke="#00eaff" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#00eaff"/></g>';
            break;
        case 'rapidfire':
            svg = '<g><rect x="4" y="10" width="16" height="4" rx="2" fill="#FFA500"/><rect x="16" y="8" width="4" height="8" rx="2" fill="#00eaff"/></g>';
            break;
        default:
            svg = '<rect x="4" y="10" width="16" height="4" rx="2" fill="#00ff99"/>';
    }
    icon.innerHTML = svg;
}
// --- Animated Background Particles ---
const bgCanvas = document.getElementById('bgParticles');
const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
const particles = [];
const PARTICLE_COUNT = 40;
function initParticles() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            color: Math.random() > 0.5 ? '#00eaff' : '#00ff99',
            alpha: Math.random() * 0.5 + 0.2
        });
    }
}
function drawParticles() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    for (const p of particles) {
        bgCtx.save();
        bgCtx.globalAlpha = p.alpha;
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bgCtx.fillStyle = p.color;
        bgCtx.shadowColor = p.color;
        bgCtx.shadowBlur = 8;
        bgCtx.fill();
        bgCtx.restore();
        // Move
        p.x += p.dx;
        p.y += p.dy;
        // Wrap
        if (p.x < 0) p.x = bgCanvas.width;
        if (p.x > bgCanvas.width) p.x = 0;
        if (p.y < 0) p.y = bgCanvas.height;
        if (p.y > bgCanvas.height) p.y = 0;
    }
    requestAnimationFrame(drawParticles);
}
if (bgCanvas && bgCtx) {
    initParticles();
    drawParticles();
}

// --- Animated Nebula/Cloud Layer (Restored & Enhanced) ---
const nebulaCanvas = document.getElementById('bgNebula');
const nebulaCtx = nebulaCanvas ? nebulaCanvas.getContext('2d') : null;
let nebulaTime = 0;
function drawNebula() {
    if (!nebulaCtx) return;
    nebulaTime += 0.004;
    nebulaCtx.clearRect(0, 0, nebulaCanvas.width, nebulaCanvas.height);
    // Animate 4-5 moving radial gradients for a cloudy effect
    for (let i = 0; i < 5; i++) {
        const cx = 400 + Math.sin(nebulaTime * (0.7 + i*0.1) + i) * (180 + i*30);
        const cy = 300 + Math.cos(nebulaTime * (0.6 + i*0.13) + i * 2) * (140 + i*20);
        const r = 160 + Math.sin(nebulaTime * (0.8 + i*0.07) + i) * 70;
        const grad = nebulaCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, i % 2 === 0 ? 'rgba(0,255,200,0.13)' : 'rgba(0,100,255,0.10)');
        grad.addColorStop(0.5, i % 2 === 0 ? 'rgba(0,255,150,0.09)' : 'rgba(0,100,255,0.07)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        nebulaCtx.globalAlpha = 0.7;
        nebulaCtx.beginPath();
        nebulaCtx.arc(cx, cy, r, 0, Math.PI * 2);
        nebulaCtx.fillStyle = grad;
        nebulaCtx.fill();
    }
    requestAnimationFrame(drawNebula);
}
if (nebulaCanvas && nebulaCtx) drawNebula();

// --- Animated Sparks Layer ---
const sparksCanvas = document.getElementById('bgSparks');
const sparksCtx = sparksCanvas ? sparksCanvas.getContext('2d') : null;
const sparks = [];
const SPARK_COUNT = 18;
function initSparks() {
    for (let i = 0; i < SPARK_COUNT; i++) {
        resetSpark(i);
    }
}
function resetSpark(i) {
    sparks[i] = {
        x: Math.random() * sparksCanvas.width,
        y: Math.random() * sparksCanvas.height,
        vx: (Math.random() - 0.5) * 2.5,
        vy: Math.random() * 1.5 + 0.5,
        len: Math.random() * 40 + 30,
        alpha: Math.random() * 0.4 + 0.2,
        color: Math.random() > 0.5 ? '#00eaff' : '#00ff99'
    };
}
function drawSparks() {
    if (!sparksCtx) return;
    sparksCtx.clearRect(0, 0, sparksCanvas.width, sparksCanvas.height);
    for (let i = 0; i < SPARK_COUNT; i++) {
        const s = sparks[i];
        sparksCtx.save();
        sparksCtx.globalAlpha = s.alpha;
        sparksCtx.strokeStyle = s.color;
        sparksCtx.shadowColor = s.color;
        sparksCtx.shadowBlur = 12;
        sparksCtx.beginPath();
        sparksCtx.moveTo(s.x, s.y);
        sparksCtx.lineTo(s.x + s.vx * s.len, s.y + s.vy * s.len);
        sparksCtx.lineWidth = 2;
        sparksCtx.stroke();
        sparksCtx.restore();
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -50 || s.x > sparksCanvas.width + 50 || s.y > sparksCanvas.height + 20) {
            resetSpark(i);
            s.y = -10;
        }
    }
    requestAnimationFrame(drawSparks);
}
if (sparksCanvas && sparksCtx) {
    initSparks();
    drawSparks();
}

// --- Animated Starfield ---
const starsCanvas = document.getElementById('bgStars');
const starsCtx = starsCanvas ? starsCanvas.getContext('2d') : null;
const STAR_COUNT = 80;
const stars = [];
function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * starsCanvas.width,
            y: Math.random() * starsCanvas.height,
            r: Math.random() * 1.2 + 0.3,
            speed: Math.random() * 0.15 + 0.05,
            alpha: Math.random() * 0.7 + 0.3,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}
function drawStars() {
    if (!starsCtx) return;
    starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    for (const s of stars) {
        s.twinkle += 0.03;
        let a = s.alpha + Math.sin(s.twinkle) * 0.2;
        starsCtx.save();
        starsCtx.globalAlpha = Math.max(0, Math.min(1, a));
        starsCtx.beginPath();
        starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        starsCtx.fillStyle = '#eafffa';
        starsCtx.shadowColor = '#00eaff';
        starsCtx.shadowBlur = 8;
        starsCtx.fill();
        starsCtx.restore();
        s.x += s.speed * 0.5;
        if (s.x > starsCanvas.width) s.x = 0;
    }
    requestAnimationFrame(drawStars);
}
if (starsCanvas && starsCtx) {
    initStars();
    drawStars();
}

// --- Animated Grid Lines ---
const gridCanvas = document.getElementById('bgGrid');
const gridCtx = gridCanvas ? gridCanvas.getContext('2d') : null;
let gridTime = 0;
function drawGrid() {
    if (!gridCtx) return;
    gridTime += 0.008;
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    gridCtx.save();
    // Glow effect
    gridCtx.shadowColor = '#00eaff';
    gridCtx.shadowBlur = 8;
    // Vertical lines
    for (let x = 0; x <= gridCanvas.width; x += 64) {
        gridCtx.globalAlpha = 0.12 + 0.08 * Math.abs(Math.sin(gridTime + x * 0.01));
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, gridCanvas.height);
        gridCtx.strokeStyle = '#00eaff';
        gridCtx.lineWidth = 1.2;
        gridCtx.stroke();
    }
    // Horizontal lines
    for (let y = 0; y <= gridCanvas.height; y += 64) {
        gridCtx.globalAlpha = 0.12 + 0.08 * Math.abs(Math.cos(gridTime + y * 0.01));
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(gridCanvas.width, y);
        gridCtx.strokeStyle = '#00eaff';
        gridCtx.lineWidth = 1.2;
        gridCtx.stroke();
    }
    gridCtx.restore();
    requestAnimationFrame(drawGrid);
}
if (gridCanvas && gridCtx) drawGrid();

// --- Player Setup Logic ---
const playerSetup = document.getElementById('playerSetup');
const playerNameInput = document.getElementById('playerNameInput');
const playerPhotoInput = document.getElementById('playerPhotoInput');
const playerSetupBtn = document.getElementById('playerSetupBtn');
const playerAvatar = document.getElementById('playerAvatar');
const playerStatus = document.getElementById('playerStatus');
const avatarPreviewImg = document.getElementById('avatarPreviewImg');

let playerName = 'Commander';
let playerPhotoURL = 'sprites/sprites_player.png';

// Update HUD and preview with current name and photo
function updatePlayerHUD() {
    if (playerStatus) playerStatus.textContent = playerName.toUpperCase();
    if (playerAvatar) playerAvatar.src = playerPhotoURL;
    if (avatarPreviewImg) avatarPreviewImg.src = playerPhotoURL;
}

// Live update name in HUD as user types
playerNameInput.oninput = function() {
    playerName = playerNameInput.value.trim() || 'Commander';
    updatePlayerHUD();
    // Save to localStorage
    localStorage.setItem('dinoWarfarePlayerName', playerName);
};

// Live preview and set photo
playerPhotoInput.onchange = function() {
    if (playerPhotoInput.files && playerPhotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            playerPhotoURL = e.target.result;
            updatePlayerHUD();
            // Save photo to localStorage
            localStorage.setItem('dinoWarfarePlayerPhoto', playerPhotoURL);
        };
        reader.onerror = function() {
            playerPhotoURL = 'sprites/sprites_player.png';
            updatePlayerHUD();
            // Save fallback to localStorage
            localStorage.setItem('dinoWarfarePlayerPhoto', playerPhotoURL);
        };
        reader.readAsDataURL(playerPhotoInput.files[0]);
    } else {
        playerPhotoURL = 'sprites/sprites_player.png';
        updatePlayerHUD();
        // Save fallback to localStorage
        localStorage.setItem('dinoWarfarePlayerPhoto', playerPhotoURL);
    }
};

playerSetupBtn.onclick = function() {
    playerName = playerNameInput.value.trim() || 'Commander';
    updatePlayerHUD();
    // Save to localStorage
    localStorage.setItem('dinoWarfarePlayerName', playerName);
    localStorage.setItem('dinoWarfarePlayerPhoto', playerPhotoURL);
    const setup = document.getElementById('playerSetup');
    if (setup) {
        setup.parentNode.removeChild(setup); // Remove from DOM
        console.log('Player setup modal removed from DOM');
    }
    console.log('[DEBUG] Starting new Game from player setup');
    new Game();
};

window.onload = function() {
    const setup = document.getElementById('playerSetup');
    if (setup) {
        setup.style.display = 'block';
        setup.setAttribute('aria-hidden', 'false');
    }
    // Pre-fill name if found in localStorage
    const savedName = localStorage.getItem('dinoWarfarePlayerName');
    if (savedName) {
        playerNameInput.value = savedName;
        playerName = savedName;
    }
    // Pre-fill photo if found in localStorage
    const savedPhoto = localStorage.getItem('dinoWarfarePlayerPhoto');
    if (savedPhoto) {
        playerPhotoURL = savedPhoto;
        updatePlayerHUD();
    }
    updatePlayerHUD();
};

// --- Share Progress Button ---
const shareButton = document.getElementById('shareButton');
if (shareButton) {
    shareButton.onclick = function() {
        // Draw shareable image
        const canvas = document.getElementById('shareCanvas');
        const ctx = canvas.getContext('2d');
        // Background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const grad = ctx.createLinearGradient(0, 0, 400, 300);
        grad.addColorStop(0, '#10131a');
        grad.addColorStop(1, '#00eaff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 300);

        // Avatar
        const img = new window.Image();
        img.onload = function() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(60, 60, 40, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, 20, 20, 80, 80);
            ctx.restore();

            // Name
            ctx.font = 'bold 22px Orbitron, Arial';
            ctx.fillStyle = '#00ff99';
            ctx.textAlign = 'left';
            ctx.fillText(playerName, 120, 60);

            // Score
            ctx.font = 'bold 32px Orbitron, Arial';
            ctx.fillStyle = '#eafffa';
            ctx.textAlign = 'center';
            ctx.fillText('SCORE: ' + document.getElementById('finalScore').textContent, 200, 140);

            // Game Title
            ctx.font = 'bold 18px Orbitron, Arial';
            ctx.fillStyle = '#00eaff';
            ctx.textAlign = 'center';
            ctx.fillText('DINO WARFARE', 200, 180);

            // Download or share
            const dataUrl = canvas.toDataURL('image/png');
            // Try Web Share API
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([], '')] })) {
                fetch(dataUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], 'dino_warfare_score.png', { type: 'image/png' });
                        navigator.share({
                            title: 'Dino Warfare',
                            text: `I scored ${document.getElementById('finalScore').textContent} in Dino Warfare! - ${playerName}`,
                            files: [file]
                        }).catch(err => {
                            console.error('Share failed:', err);
                            alert('Sharing failed. Downloading image instead.');
                            const link = document.createElement('a');
                            link.href = dataUrl;
                            link.download = 'dino_warfare_score.png';
                            link.click();
                        });
                    })
                    .catch(err => {
                        console.error('Blob fetch failed:', err);
                        alert('Could not prepare image for sharing. Downloading instead.');
                        const link = document.createElement('a');
                        link.href = dataUrl;
                        link.download = 'dino_warfare_score.png';
                        link.click();
                    });
            } else {
                // Download fallback
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = 'dino_warfare_score.png';
                link.click();
                alert('Sharing is not supported on this device. Image downloaded instead.');
            }
        };
        img.onerror = function() {
            // fallback to default avatar
            img.src = 'sprites/sprites_player.png';
        };
        img.src = playerPhotoURL;
    };
} 