// Dino Warfare - game.js (ENHANCED VERSION)
const canvas = document.getElementById("gameCanvas");
canvas.width = 960;
canvas.height = 600;
const ctx = canvas.getContext("2d");

// Player data from sign-in
let playerData = {
  name: '',
  avatar: null,
  email: '',
  subscription: false,
  maxLevel: 1
};

// Load player data from localStorage
function loadPlayerData() {
  const saved = localStorage.getItem('dinoWarfareCurrentUser');
  if (saved) {
    playerData = JSON.parse(saved);
  }
}

// Check subscription status for level progression
function checkSubscriptionStatus(level) {
  // Free trial: levels 1-3
  if (level <= 3) return true;
  
  // Check if user has subscription
  if (playerData.subscription) return true;
  
  // Show subscription modal
  if (window.checkSubscriptionStatus) {
    return window.checkSubscriptionStatus(level);
  }
  
  return false;
}

// Load images
const playerImg = new Image();
playerImg.src = 'assets/sprites/sprites_player.png';
const raptorImg = new Image();
raptorImg.src = 'assets/sprites/sprites_raptor.png';
const trexImg = new Image();
trexImg.src = 'assets/sprites/sprites_trex.png';
const motherDinoImg = new Image();
motherDinoImg.src = 'assets/sprites/sprites_motherdino.png';
const bulletImg = new Image();
bulletImg.src = 'assets/sprites/sprites_bullet.png';
const powerupImg = new Image();
powerupImg.src = 'assets/sprites/sprites_powerup.png';
const velociraptorImg = new Image();
velociraptorImg.src = 'assets/sprites/sprites_velociraptor.png';
const triceratopsImg = new Image();
triceratopsImg.src = 'assets/sprites/sprites_triceratops.png';
const stegosaurusImg = new Image();
stegosaurusImg.src = 'assets/sprites/sprites_stegosaurus.png';
const pterodactylImg = new Image();
pterodactylImg.src = 'assets/sprites/sprites_pterodactyl.png';
const spinosaurusImg = new Image();
spinosaurusImg.src = 'assets/sprites/sprites_spinosaurus.png';
const ankylosaurusImg = new Image();
ankylosaurusImg.src = 'assets/sprites/sprites_ankylosaurus.png';
const pachycephalosaurusImg = new Image();
pachycephalosaurusImg.src = 'assets/sprites/sprites_pachycephalosaurus.png';

// Player avatar image
const playerAvatarImg = new Image();

// Load sounds with error handling
const shootSound = new Audio('./assets/sounds/sounds_shoot.wav');
const hitSound = new Audio('./assets/sounds/sounds_hit.wav');
const gameOverSound = new Audio('./assets/sounds/sounds_gameover.wav');
const regenSound = new Audio('./assets/sounds/sounds_regen.wav');
const shieldSound = new Audio('./assets/sounds/sounds_shield.wav');
const bgMusic = new Audio('./assets/sounds/sounds_background.wav');
const bossIntroSound = new Audio('./assets/sounds/sounds_boss_intro.mp3');

// Sound error handling
shootSound.addEventListener('error', () => console.warn('Failed to load shoot sound'));
hitSound.addEventListener('error', () => console.warn('Failed to load hit sound'));
gameOverSound.addEventListener('error', () => console.warn('Failed to load game over sound'));
regenSound.addEventListener('error', () => console.warn('Failed to load regen sound'));
shieldSound.addEventListener('error', () => console.warn('Failed to load shield sound'));
bgMusic.addEventListener('error', () => console.warn('Failed to load background music'));
bossIntroSound.addEventListener('error', () => console.warn('Failed to load boss intro sound'));

bgMusic.loop = true;

// Game state
let gameStarted = false;
let gameOver = false;
let gamePaused = false;
let shopOpen = false;
let score = 0;
let lives = 4;
let coins = 0;
let wave = 1;
let level = 1;
let lastEnemySpawn = 0;
let lastPowerupSpawn = 0;
let levelTransition = false;
let levelTransitionTimer = 0;

// Fruit of the Spirit level themes
const FRUIT_OF_SPIRIT = [
  "Love", "Joy", "Peace", "Patience", "Kindness", 
  "Goodness", "Faithfulness", "Gentleness", "Self-Control", "Faith", "Hope"
];

function getLevelTheme(levelNumber) {
  // Cycle through the fruit of the Spirit (1-11, then repeat)
  const index = (levelNumber - 1) % FRUIT_OF_SPIRIT.length;
  return FRUIT_OF_SPIRIT[index];
}

function getLevelDisplayName(levelNumber) {
  const theme = getLevelTheme(levelNumber);
  const cycle = Math.floor((levelNumber - 1) / FRUIT_OF_SPIRIT.length) + 1;
  return cycle > 1 ? `${theme} (Cycle ${cycle})` : theme;
}

// Player object
let player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  radius: 30,
  speed: 8,
  shield: false,
  bulletCooldown: 0,
  bulletSpeed: 12,
  maxBullets: 3,
  bulletSize: 4,
  diagonalShooting: false
};

// Game objects
let bullets = [];
let enemies = [];
let bossEnemies = [];
let fireballs = [];
let powerUps = [];

// Input handling
let keys = {};

// Enhanced enemy types with progression
const ENEMY_TYPES = [
  // Level 1 enemies
  { img: raptorImg, speed: 2, health: 1, points: 10, radius: 25, level: 1, name: "Raptor" },
  { img: trexImg, speed: 1.5, health: 2, points: 20, radius: 30, level: 1, name: "T-Rex" },
  
  // Level 2 enemies
  { img: velociraptorImg, speed: 3, health: 1, points: 15, radius: 20, level: 2, name: "Velociraptor" },
  { img: triceratopsImg, speed: 1, health: 3, points: 25, radius: 35, level: 2, name: "Triceratops" },
  
  // Level 3 enemies
  { img: stegosaurusImg, speed: 0.8, health: 4, points: 30, radius: 40, level: 3, name: "Stegosaurus" },
  { img: pterodactylImg, speed: 4, health: 1, points: 20, radius: 25, level: 3, name: "Pterodactyl" },
  
  // Level 4 enemies (Premium)
  { img: spinosaurusImg, speed: 1.2, health: 5, points: 40, radius: 45, level: 4, name: "Spinosaurus" },
  { img: ankylosaurusImg, speed: 0.6, health: 6, points: 35, radius: 35, level: 4, name: "Ankylosaurus" },
  
  // Level 5+ enemies (Premium)
  { img: pachycephalosaurusImg, speed: 2.5, health: 3, points: 30, radius: 30, level: 5, name: "Pachycephalosaurus" }
];

// Boss types for different levels - All using Mother Dino sprite
const BOSS_TYPES = [
  { img: motherDinoImg, health: 50, speed: 1.2, fireRate: 60, name: "Mother Dino", level: 1, scale: 1.0 },
  { img: motherDinoImg, health: 75, speed: 1.5, fireRate: 45, name: "Mother Dino Elite", level: 2, scale: 1.2 },
  { img: motherDinoImg, health: 100, speed: 1.8, fireRate: 40, name: "Mother Dino Alpha", level: 3, scale: 1.4 },
  { img: motherDinoImg, health: 150, speed: 1.0, fireRate: 30, name: "Mother Dino Supreme", level: 4, scale: 1.6 },
  { img: motherDinoImg, health: 200, speed: 1.3, fireRate: 25, name: "Mother Dino Legend", level: 5, scale: 1.8 }
];

// Power-up types
const POWER_UPS = [
  { type: 'regen', color: 'green', points: 0 },
  { type: 'shield', color: 'blue', points: 0 }
];

// Enhanced power-up system with premium features
let activePowerUps = [];

// Shop items
const SHOP_ITEMS = [
  { name: 'Extra Life', cost: 50, effect: 'lives', value: 1 },
  { name: 'Faster Bullets', cost: 30, effect: 'bulletSpeed', value: 2 },
  { name: 'More Bullets', cost: 40, effect: 'maxBullets', value: 1 },
  { name: 'Bigger Bullets', cost: 25, effect: 'bulletSize', value: 1 },
  { name: 'Faster Movement', cost: 35, effect: 'speed', value: 1 },
  { name: 'Extra Diagonal Bullets', cost: 60, effect: 'diagonalShooting', value: true }
];

// Event listeners
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// Add mouse move listener for shop debugging
canvas.addEventListener("mousemove", (e) => {
  if (shopOpen) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if mouse is over any buy button
    const startY = 160;
    const itemHeight = 60;
    
    SHOP_ITEMS.forEach((item, index) => {
      const itemY = startY + (index * itemHeight);
      const canAfford = coins >= item.cost;
      
      if (canAfford) {
        const buttonX = canvas.width / 2 + 50;
        const buttonY = itemY - 5;
        const buttonWidth = 80;
        const buttonHeight = 40;
        
        if (x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
          // Mouse is over this button - highlight it
          window.hoveredButton = { index, item };
        } else {
          window.hoveredButton = null;
        }
      }
    });
  }
});

canvas.addEventListener("click", (e) => {
  if (!gameStarted || gameOver) {
    startGame();
    return;
  }
  
  // Handle shop clicks
  if (shopOpen) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    console.log('Shop click detected at:', x, y, 'Canvas size:', canvas.width, 'x', canvas.height, 'Rect size:', rect.width, 'x', rect.height);
    
    const startY = 160;
    const itemHeight = 60;
    
    SHOP_ITEMS.forEach((item, index) => {
      const itemY = startY + (index * itemHeight);
      const canAfford = coins >= item.cost;
      
      // Match the exact buy button coordinates from drawShopInterface
      const buttonX = canvas.width / 2 + 50; // 480 + 50 = 530
      const buttonY = itemY - 5;
      const buttonWidth = 80;
      const buttonHeight = 40;
      
      console.log(`Item ${index} (${item.name}): Button at ${buttonX},${buttonY} size ${buttonWidth}x${buttonHeight}, canAfford: ${canAfford}`);
      
      // Only allow clicks on affordable items
      if (canAfford &&
          x >= buttonX && x <= buttonX + buttonWidth &&
          y >= buttonY && y <= buttonY + buttonHeight) {
        console.log('✅ Buying:', item.name, 'for', item.cost, 'coins');
        buyShopItem(item);
        return; // Exit after successful purchase
      } else if (!canAfford &&
                 x >= buttonX && x <= buttonX + buttonWidth &&
                 y >= buttonY && y <= buttonY + buttonHeight) {
        console.log('❌ Not enough coins for:', item.name);
        showPurchaseMessage(`❌ Not enough coins for ${item.name}`);
        return;
      }
    });
  }
  
  // Handle pause screen clicks
  if (gamePaused && !shopOpen) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    console.log('Pause screen click at:', x, y);
    
    // Check if share button was clicked
    const shareButtonY = canvas.height / 2 + 80;
    const shareButtonWidth = 200;
    const shareButtonHeight = 50;
    const shareButtonX = canvas.width / 2 - shareButtonWidth / 2;
    
    console.log('Share button area:', shareButtonX, shareButtonY, shareButtonWidth, shareButtonHeight);
    
    if (x >= shareButtonX && x <= shareButtonX + shareButtonWidth &&
        y >= shareButtonY && y <= shareButtonY + shareButtonHeight) {
      console.log('Share button clicked!');
      shareScore();
    }
  }
});

// Fixed pause button functionality
document.getElementById("pauseBtn").onclick = () => {
  if (gameStarted && !gameOver) {
    gamePaused = !gamePaused;
    if (gamePaused) {
      bgMusic.pause();
    } else {
      bgMusic.play().catch(() => {});
    }
  }
};

document.getElementById("resumeBtn").onclick = () => {
  if (!gameOver && gameStarted) {
    gamePaused = false;
    shopOpen = false;
    bgMusic.play().catch(() => {});
  }
};

document.getElementById("stopBtn").onclick = () => {
  if (gameStarted) {
    gamePaused = true;
    shopOpen = false;
    bgMusic.pause();
  }
};

// Shop button functionality
document.getElementById("shopBtn").onclick = () => {
  if (gameStarted && !gameOver) {
    shopOpen = !shopOpen;
    if (shopOpen) {
      gamePaused = true;
      bgMusic.pause();
    } else {
      gamePaused = false;
      bgMusic.play().catch(() => {});
    }
  }
};

// Premium features for level 3+
const PREMIUM_FEATURES = {
  // Special power-ups available only to subscribers
  PREMIUM_POWER_UPS: [
    { type: 'laser', color: 'red', points: 0, duration: 10000, effect: 'continuous laser beam' },
    { type: 'shield_plus', color: 'cyan', points: 0, duration: 15000, effect: 'invincible shield' },
    { type: 'time_slow', color: 'purple', points: 0, duration: 8000, effect: 'slow motion enemies' },
    { type: 'nuke', color: 'orange', points: 0, duration: 0, effect: 'destroy all enemies' },
    { type: 'multi_shot', color: 'yellow', points: 0, duration: 12000, effect: '5-way bullet spread' }
  ],
  
  // Enhanced boss abilities
  BOSS_ABILITIES: [
    'teleport', 'summon_minions', 'laser_beam', 'earthquake', 'meteor_shower'
  ],
  
  // Particle effects
  PARTICLE_SYSTEMS: {
    explosion: { count: 20, speed: 3, life: 60, color: 'orange' },
    laser: { count: 5, speed: 2, life: 30, color: 'red' },
    shield: { count: 8, speed: 1, life: 90, color: 'cyan' },
    powerup: { count: 15, speed: 2, life: 45, color: 'gold' }
  }
};

// Particle system for premium effects
let particles = [];

function createParticles(x, y, type) {
  if (!playerData.subscription && level <= 3) return; // Only for premium users
  
  const particleConfig = PREMIUM_FEATURES.PARTICLE_SYSTEMS[type];
  if (!particleConfig) return;
  
  for (let i = 0; i < particleConfig.count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * particleConfig.speed,
      vy: (Math.random() - 0.5) * particleConfig.speed,
      life: particleConfig.life,
      maxLife: particleConfig.life,
      color: particleConfig.color,
      size: Math.random() * 3 + 1
    });
  }
}

function updateParticles() {
  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life--;
    
    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  });
}

function drawParticles() {
  particles.forEach(particle => {
    const alpha = particle.life / particle.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// Global function to test sharing (for debugging)
window.testShare = function() {
  console.log('Testing share functionality...');
  shareScore();
};

// Global function to start game from HTML authentication
window.startGameFromAuth = function() {
  loadPlayerData();
  
  // Load player avatar if available
  if (playerData.avatar) {
    playerAvatarImg.src = playerData.avatar;
  }
  
  gameStarted = true;
  gamePaused = false;
  gameOver = false;
  shopOpen = false;
  score = 0;
  lives = 4;
  coins = 0;
  wave = 1;
  level = 1;
  levelTransition = false;
  levelTransitionTimer = 0;
  lastEnemySpawn = 0;
  lastPowerupSpawn = 0;
  
  // Reset game objects
  bullets = [];
  enemies = [];
  bossEnemies = [];
  fireballs = [];
  powerUps = [];
  particles = [];
  
  // Reset player
  player.x = canvas.width / 2;
  player.y = canvas.height - 100;
  player.shield = false;
  player.bulletCooldown = 0;
  player.speed = 8;
  player.bulletSpeed = 12;
  player.maxBullets = 3;
  player.bulletSize = 4;
  player.diagonalShooting = false;
  
  // Premium player enhancements
  if (playerData.subscription) {
    player.speed += 2;
    player.bulletSpeed += 3;
    player.maxBullets += 1;
  }
  
  // Reset messages
  window.purchaseMessages = [];
  window.levelMessages = [];
  
  // Reset wave tracking variables
  window.lastWaveTime = Date.now();
  window.lastLevelWave = 0;
  window.lastRapidFireWave = 0;
  window.lastBossRushWave = 0;
  
  bgMusic.play().catch(() => {});
  
  console.log('Game started from authentication system');
  console.log('Player data:', playerData);
};

// Sound test function
window.testSounds = function() {
  console.log('Testing sounds...');
  
  // Test each sound
  shootSound.play().catch(e => console.warn('Shoot sound failed:', e));
  setTimeout(() => hitSound.play().catch(e => console.warn('Hit sound failed:', e)), 500);
  setTimeout(() => regenSound.play().catch(e => console.warn('Regen sound failed:', e)), 1000);
  setTimeout(() => shieldSound.play().catch(e => console.warn('Shield sound failed:', e)), 1500);
  
  console.log('Sound test completed');
};

// Fallback: if no authentication, start with default settings
if (!gameStarted) {
  console.log('No authentication detected, starting with default settings');
  loadPlayerData();
}

function buyShopItem(item) {
  if (coins >= item.cost) {
    coins -= item.cost;
    
    // Apply the effect
    switch (item.effect) {
      case 'lives':
        lives += item.value;
        break;
      case 'bulletSpeed':
        player.bulletSpeed += item.value;
        break;
      case 'maxBullets':
        player.maxBullets += item.value;
        break;
      case 'bulletSize':
        player.bulletSize += item.value;
        break;
      case 'speed':
        player.speed += item.value;
        break;
      case 'diagonalShooting':
        player.diagonalShooting = item.value;
        break;
    }
    
    // Play sound for purchase
    hitSound.play().catch(() => {});
    showPurchaseMessage(item.name);
  } else {
    // Not enough coins feedback
    showPurchaseMessage(`❌ Not enough coins for ${item.name}`);
  }
}

function showPurchaseMessage(itemName) {
  // Create a temporary message that fades out
  const message = {
    text: `✅ Purchased: ${itemName}`,
    x: canvas.width / 2,
    y: canvas.height / 2,
    alpha: 1,
    life: 120 // 2 seconds at 60fps
  };
  
  // Add to a messages array (we'll need to create this)
  if (!window.purchaseMessages) {
    window.purchaseMessages = [];
  }
  window.purchaseMessages.push(message);
}

function enforcePlayerBounds() {
  if (player.x < player.radius) player.x = player.radius;
  if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
}

function shoot() {
  if (player.bulletCooldown <= 0) {
    shootSound.play().catch(() => {});
    
    // Check for multi-shot power-up
    const multiShotActive = activePowerUps.find(p => p.type === 'multi_shot');
    
    if (multiShotActive) {
      // 8-way spread for multi-shot (including diagonals)
      const angles = [-45, -30, -15, 0, 15, 30, 45, 90];
      angles.forEach(angle => {
        const rad = (angle * Math.PI) / 180;
        bullets.push({
          x: player.x,
          y: player.y - 20,
          radius: player.bulletSize,
          speed: player.bulletSpeed,
          vx: Math.sin(rad) * player.bulletSpeed,
          vy: -Math.cos(rad) * player.bulletSpeed,
          diagonal: true
        });
      });
    } else {
      // Normal shooting (always active)
      for (let i = 0; i < player.maxBullets; i++) {
        const spread = (i - (player.maxBullets - 1) / 2) * 8;
        bullets.push({
          x: player.x + spread,
          y: player.y - 20,
          radius: player.bulletSize,
          speed: player.bulletSpeed,
          vx: 0,
          vy: -player.bulletSpeed,
          diagonal: false
        });
      }
      
      // Additional diagonal shooting if purchased
      if (player.diagonalShooting) {
        // 4-directional diagonal shooting (up-left, up-right, down-left, down-right)
        const diagonalAngles = [45, 135, 225, 315];
        diagonalAngles.forEach(angle => {
          const rad = (angle * Math.PI) / 180;
          bullets.push({
            x: player.x,
            y: player.y - 20,
            radius: player.bulletSize,
            speed: player.bulletSpeed,
            vx: Math.sin(rad) * player.bulletSpeed,
            vy: -Math.cos(rad) * player.bulletSpeed,
            diagonal: true
          });
        });
      }
    }
    
    // Check for laser mode
    const laserActive = activePowerUps.find(p => p.type === 'laser');
    if (laserActive) {
      // Create laser particles
      createParticles(player.x, player.y - 20, 'laser');
    }
    
    player.bulletCooldown = 15; // Reduced cooldown for better gameplay
  }
}

function updatePlayer() {
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;
  if (keys[' ']) shoot(); // Spacebar to shoot
  
  // Keyboard shortcuts
  if (keys['p'] || keys['P']) {
    if (gameStarted && !gameOver) {
      gamePaused = !gamePaused;
      if (gamePaused) {
        bgMusic.pause();
      } else {
        bgMusic.play().catch(() => {});
      }
    }
  }
  
  if (keys['s'] || keys['S']) {
    if (gameStarted && !gameOver) {
      shopOpen = !shopOpen;
      if (shopOpen) {
        gamePaused = true;
        bgMusic.pause();
      } else {
        gamePaused = false;
        bgMusic.play().catch(() => {});
      }
    }
  }
  
  // Debug mode toggle
  if (keys['d'] || keys['D']) {
    if (gameStarted) {
      window.debugMode = !window.debugMode;
    }
  }
  
  enforcePlayerBounds();
  
  if (player.bulletCooldown > 0) {
    player.bulletCooldown--;
  }
}

function updateBullets() {
  bullets.forEach((bullet, index) => {
    // Update bullet position
    if (bullet.vx !== undefined && bullet.vy !== undefined) {
      // Multi-shot bullets with custom velocity
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
    } else {
      // Normal bullets moving straight up
      bullet.y -= bullet.speed;
    }
    
    // Remove bullets that go off screen
    if (bullet.y < -10 || bullet.x < -10 || bullet.x > canvas.width + 10) {
      bullets.splice(index, 1);
    }
  });
}

function updateEnemies() {
  // Check for time slow effect
  const timeSlowActive = activePowerUps.find(p => p.type === 'time_slow');
  const timeSlowMultiplier = timeSlowActive ? 0.3 : 1.0;
  
  enemies.forEach((enemy, index) => {
    enemy.y += enemy.speed * timeSlowMultiplier;
    
    // Remove enemies that go off screen
    if (enemy.y > canvas.height + 50) {
      enemies.splice(index, 1);
    }
  });
}

function updateBoss() {
  bossEnemies.forEach((boss, index) => {
    boss.x += boss.speed * boss.direction;
    
    // Boss movement boundaries
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
      boss.direction *= -1;
    }
    
    // Boss shooting
    if (boss.fireCooldown <= 0) {
      fireballs.push({
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height,
        radius: 8,
        speed: 4
      });
      boss.fireCooldown = boss.fireRate;
    } else {
      boss.fireCooldown--;
    }
  });
}

function updateFireballs() {
  fireballs.forEach((fireball, index) => {
    fireball.y += fireball.speed;
    
    // Remove fireballs that go off screen
    if (fireball.y > canvas.height + 20) {
      fireballs.splice(index, 1);
    }
  });
}

function updatePowerUps() {
  powerUps.forEach((powerup, index) => {
    powerup.y += 2;
    
    // Remove powerups that go off screen
    if (powerup.y > canvas.height + 20) {
      powerUps.splice(index, 1);
    }
  });
}

function getAvailableEnemies() {
  return ENEMY_TYPES.filter(enemy => enemy.level <= level);
}

function spawnEnemies() {
  const currentTime = Date.now();
  const spawnInterval = Math.max(2000 - (wave * 100) - (level * 50), 800); // Faster spawning as level increases
  
  if (currentTime - lastEnemySpawn > spawnInterval) {
    // Cap maximum enemies to prevent performance issues
    const maxEnemies = Math.min(3 + Math.floor(wave / 3) + Math.floor(level / 2), 8);
    
    if (enemies.length < maxEnemies) {
      const availableEnemies = getAvailableEnemies();
      if (availableEnemies.length > 0) {
        const enemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
        enemies.push({
          x: Math.random() * (canvas.width - 60) + 30,
          y: -50,
          ...enemyType,
          currentHealth: enemyType.health
        });
      }
    }
    
    lastEnemySpawn = currentTime;
  }
}

function spawnBoss() {
  if (wave % 5 === 0 && bossEnemies.length === 0) {
    const bossType = BOSS_TYPES.find(boss => boss.level <= level) || BOSS_TYPES[0];
    const bossHealth = bossType.health + (level * 10); // Boss gets stronger each level
    const scale = bossType.scale || 1.0;
    const width = 120 * scale;
    const height = 120 * scale;
    
    bossEnemies.push({
      x: canvas.width / 2 - width / 2,
      y: 30,
      width: width,
      height: height,
      health: bossHealth,
      maxHealth: bossHealth,
      speed: bossType.speed,
      direction: 1,
      fireCooldown: 0,
      fireRate: bossType.fireRate,
      img: bossType.img,
      name: bossType.name
    });
    
    // Show boss announcement with special Mother Dino emphasis
    if (bossType.name.includes("Mother Dino")) {
      showLevelMessage(`🦖 BOSS WAVE: ${bossType.name} appears! 🦖`);
    } else {
      showLevelMessage(`BOSS WAVE: ${bossType.name} appears!`);
    }
    bossIntroSound.play().catch(() => {});
  }
  
  // Special Mother Dino event every 15 waves
  if (wave % 15 === 0 && wave > 5 && bossEnemies.length === 0) {
    const specialScale = 2.0; // Extra large for ultimate boss
    const specialWidth = 120 * specialScale;
    const specialHeight = 120 * specialScale;
    
    const specialBoss = {
      x: canvas.width / 2 - specialWidth / 2,
      y: 30,
      width: specialWidth,
      height: specialHeight,
      health: 300 + (level * 20),
      maxHealth: 300 + (level * 20),
      speed: 0.8,
      direction: 1,
      fireCooldown: 0,
      fireRate: 20,
      img: motherDinoImg,
      name: "Mother Dino Ultimate"
    };
    
    bossEnemies.push(specialBoss);
    showLevelMessage(`🦖 SPECIAL EVENT: Mother Dino Ultimate! 🦖`);
    bossIntroSound.play().catch(() => {});
  }
}

function spawnPowerUps() {
  const currentTime = Date.now();
  if (currentTime - lastPowerupSpawn > 10000) { // Spawn powerups every 10 seconds
    if (Math.random() < 0.3) { // 30% chance to spawn
      let availablePowerUps = [...POWER_UPS];
      
      // Add premium power-ups for subscribers or level 3+
      if (playerData.subscription || level >= 3) {
        availablePowerUps = availablePowerUps.concat(PREMIUM_FEATURES.PREMIUM_POWER_UPS);
      }
      
      const powerupType = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
      const newPowerUp = {
        x: Math.random() * (canvas.width - 30) + 15,
        y: -20,
        ...powerupType,
        radius: 15,
        pulse: 0
      };
      
      powerUps.push(newPowerUp);
      
      // Create particle effect for premium power-ups
      if (powerupType.type !== 'regen' && powerupType.type !== 'shield') {
        createParticles(newPowerUp.x, newPowerUp.y, 'powerup');
      }
    }
    lastPowerupSpawn = currentTime;
  }
}

function checkLevelProgression() {
  // Only check for level progression if not already in transition
  if (levelTransition) {
    return;
  }
  
  // Level up every 10 waves with strict validation
  if (wave % 10 === 0 && wave > 0 && wave !== window.lastLevelWave) {
    // Set the last level wave to prevent multiple triggers
    window.lastLevelWave = wave;
    
    // Check subscription status before allowing level progression
    const nextLevel = level + 1;
    if (!checkSubscriptionStatus(nextLevel)) {
      // User needs to subscribe to continue
      showLevelMessage("🔒 Subscribe to continue to Level " + nextLevel);
      return;
    }
    
    // Start level transition
    levelTransition = true;
    levelTransitionTimer = 90; // 1.5 seconds at 60fps
    level++;
    
    // Cap level to prevent performance issues (but allow cycling)
    if (level > 50) {
      level = 50;
    }
    
    // Update user's max level reached
    if (playerData.email) {
      const users = JSON.parse(localStorage.getItem('dinoWarfareUsers') || '{}');
      if (users[playerData.email]) {
        users[playerData.email].maxLevel = Math.max(users[playerData.email].maxLevel, level);
        localStorage.setItem('dinoWarfareUsers', JSON.stringify(users));
      }
    }
    
    // Clear all enemies for level transition
    enemies = [];
    bossEnemies = [];
    fireballs = [];
    
    // Bonus coins for completing level
    const bonusCoins = level * 25;
    coins += bonusCoins;
    
    const levelTheme = getLevelDisplayName(level);
    showLevelMessage(`LEVEL ${level}: ${levelTheme} COMPLETE! +${bonusCoins} coins`);
    
    // Special message for completing free trial
    if (level === 4) {
      showLevelMessage("🎉 Free trial completed! Subscribe for unlimited access!");
    }
  }
  
  // Special wave events (only if not in transition)
  if (!levelTransition) {
    if (wave % 7 === 0 && wave > 1 && wave !== window.lastRapidFireWave) {
      window.lastRapidFireWave = wave;
      showLevelMessage("RAPID FIRE WAVE - Enemies spawn faster!");
    }
    
    if (wave % 9 === 0 && wave > 1 && wave !== window.lastBossRushWave) {
      window.lastBossRushWave = wave;
      showLevelMessage("BOSS RUSH - Multiple bosses may appear!");
    }
  }
}

function showLevelMessage(message) {
  if (!window.levelMessages) {
    window.levelMessages = [];
  }
  
  // Limit the number of messages to prevent spam
  if (window.levelMessages.length < 3) {
    window.levelMessages.push({
      text: message,
      x: canvas.width / 2,
      y: canvas.height / 2,
      alpha: 1,
      life: 120 // Reduced from 180 to 2 seconds
    });
  }
}

function handleCollisions() {
  // Bullet vs Enemy collisions
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < bullet.radius + enemy.radius) {
        enemy.currentHealth--;
        
        if (enemy.currentHealth <= 0) {
          score += enemy.points;
          coins += Math.floor(enemy.points / 10);
          hitSound.play().catch(() => {});
          enemies.splice(enemyIndex, 1);
        }
        
        bullets.splice(bulletIndex, 1);
      }
    });
    
    // Bullet vs Boss collisions
    bossEnemies.forEach((boss, bossIndex) => {
      const dx = bullet.x - (boss.x + boss.width / 2);
      const dy = bullet.y - (boss.y + boss.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < bullet.radius + Math.max(boss.width, boss.height) / 2) {
        boss.health--;
        bullets.splice(bulletIndex, 1);
        
        if (boss.health <= 0) {
          score += 100;
          coins += 10;
          hitSound.play().catch(() => {});
          bossEnemies.splice(bossIndex, 1);
        }
      }
    });
  });
  
  // Player vs Enemy collisions
  enemies.forEach((enemy, index) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < player.radius + enemy.radius) {
      // Check for invincible shield
      const invincibleShield = activePowerUps.find(p => p.type === 'shield_plus');
      
      if (invincibleShield) {
        // Invincible shield - no damage taken
        createParticles(enemy.x, enemy.y, 'explosion');
        score += enemy.points;
        coins += Math.floor(enemy.points / 10);
        enemies.splice(index, 1);
      } else if (player.shield) {
        player.shield = false;
        shieldSound.play().catch(() => {});
        enemies.splice(index, 1);
      } else {
        lives--;
        if (lives <= 0) {
          gameOver = true;
          gameOverSound.play().catch(() => {});
          bgMusic.pause();
        }
        enemies.splice(index, 1);
      }
    }
  });
  
  // Player vs Fireball collisions
  fireballs.forEach((fireball, index) => {
    const dx = fireball.x - player.x;
    const dy = fireball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < fireball.radius + player.radius) {
      if (player.shield) {
        player.shield = false;
        shieldSound.play().catch(() => {});
      } else {
        lives--;
        if (lives <= 0) {
          gameOver = true;
          gameOverSound.play().catch(() => {});
          bgMusic.pause();
        }
      }
      fireballs.splice(index, 1);
    }
  });
  
  // Player vs Powerup collisions
  powerUps.forEach((powerup, index) => {
    const dx = player.x - powerup.x;
    const dy = player.y - powerup.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < player.radius + powerup.radius) {
      // Create particle effect
      createParticles(powerup.x, powerup.y, 'powerup');
      
      // Handle different power-up types
      switch (powerup.type) {
        case 'regen':
          lives++;
          regenSound.play().catch(() => {});
          showLevelMessage("💚 Health Restored!");
          break;
          
        case 'shield':
          player.shield = true;
          shieldSound.play().catch(() => {});
          showLevelMessage("🛡️ Shield Activated!");
          break;
          
        // Premium power-ups
        case 'laser':
          activateLaserMode();
          showLevelMessage("🔴 LASER MODE ACTIVATED!");
          break;
          
        case 'shield_plus':
          activateInvincibleShield();
          showLevelMessage("💎 INVINCIBLE SHIELD!");
          break;
          
        case 'time_slow':
          activateTimeSlow();
          showLevelMessage("⏰ TIME SLOW ACTIVATED!");
          break;
          
        case 'nuke':
          activateNuke();
          showLevelMessage("💥 NUKE DETONATED!");
          break;
          
        case 'multi_shot':
          activateMultiShot();
          showLevelMessage("🎯 MULTI-SHOT MODE!");
          break;
      }
      
      powerUps.splice(index, 1);
    }
  });
}

// Premium power-up activation functions
function activateLaserMode() {
  if (!activePowerUps.find(p => p.type === 'laser')) {
    activePowerUps.push({
      type: 'laser',
      duration: 10000,
      startTime: Date.now()
    });
  }
}

function activateInvincibleShield() {
  if (!activePowerUps.find(p => p.type === 'shield_plus')) {
    activePowerUps.push({
      type: 'shield_plus',
      duration: 15000,
      startTime: Date.now()
    });
  }
}

function activateTimeSlow() {
  if (!activePowerUps.find(p => p.type === 'time_slow')) {
    activePowerUps.push({
      type: 'time_slow',
      duration: 8000,
      startTime: Date.now()
    });
  }
}

function activateNuke() {
  // Destroy all enemies
  enemies.forEach(enemy => {
    createParticles(enemy.x, enemy.y, 'explosion');
    score += enemy.points;
    coins += Math.floor(enemy.points / 10);
  });
  enemies = [];
  
  // Damage bosses
  bossEnemies.forEach(boss => {
    boss.health = Math.max(0, boss.health - 50);
    createParticles(boss.x + boss.width/2, boss.y + boss.height/2, 'explosion');
  });
}

function activateMultiShot() {
  if (!activePowerUps.find(p => p.type === 'multi_shot')) {
    activePowerUps.push({
      type: 'multi_shot',
      duration: 12000,
      startTime: Date.now()
    });
  }
}

// Update active power-ups
function updateActivePowerUps() {
  const currentTime = Date.now();
  activePowerUps = activePowerUps.filter(powerup => {
    return (currentTime - powerup.startTime) < powerup.duration;
  });
}

function update() {
  if (gamePaused || !gameStarted || gameOver) return;
  
  // Handle level transition
  if (levelTransition) {
    levelTransitionTimer--;
    if (levelTransitionTimer <= 0) {
      levelTransition = false;
    }
  }
  
  // Always update player and bullets regardless of level transition
  updatePlayer();
  updateBullets();
  
  // Update other game elements
  updateEnemies();
  updateBoss();
  updateFireballs();
  updatePowerUps();
  updateParticles();
  updateActivePowerUps();
  
  // Only spawn new enemies if not in level transition
  if (!levelTransition) {
    spawnEnemies();
    spawnBoss();
    spawnPowerUps();
    handleCollisions();
  }
  
  // Update purchase messages
  if (window.purchaseMessages) {
    window.purchaseMessages.forEach((message, index) => {
      message.life--;
      message.alpha = message.life / 120;
      message.y -= 0.5; // Move up slightly
      
      if (message.life <= 0) {
        window.purchaseMessages.splice(index, 1);
      }
    });
  }
  
  // Update level messages
  if (window.levelMessages) {
    window.levelMessages.forEach((message, index) => {
      message.life--;
      message.alpha = message.life / 120;
      message.y -= 0.3; // Move up slightly
      
      if (message.life <= 0) {
        window.levelMessages.splice(index, 1);
      }
    });
  }
  
  // Increase wave every 30 seconds using proper timer
  if (!window.lastWaveTime) {
    window.lastWaveTime = Date.now();
  }
  
  const currentTime = Date.now();
  if (currentTime - window.lastWaveTime >= 30000 && !levelTransition) { // 30 seconds, no increment during transition
    wave++;
    window.lastWaveTime = currentTime;
  }
  
  checkLevelProgression();
}

function draw() {
  // Fill with black background instead of clearing
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vertical offset for UI to clear the buttons
  const uiOffsetY = 70;

  if (!gameStarted) {
    drawStartScreen();
    return;
  }

  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  // Draw player (use avatar if available, otherwise default sprite)
  if (playerData.avatar && playerAvatarImg.complete) {
    ctx.drawImage(playerAvatarImg, player.x - 30, player.y - 30, 60, 60);
  } else {
    ctx.drawImage(playerImg, player.x - 30, player.y - 30, 60, 60);
  }

  // Draw shield effect
  if (player.shield) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Draw bullets
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();
  });

  // Draw enemies
  enemies.forEach(enemy => {
    ctx.drawImage(enemy.img, enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2);
  });

  // Draw boss enemies (Mother Dino with proper scaling)
  bossEnemies.forEach(boss => {
    const bossType = BOSS_TYPES.find(type => type.name === boss.name) || BOSS_TYPES[0];
    const scale = bossType.scale || 1.0;
    const width = 120 * scale;
    const height = 120 * scale;
    ctx.drawImage(boss.img, boss.x, boss.y, width, height);
    // Health bar
    const isMotherDino = boss.name.includes("Mother Dino");
    if (isMotherDino) {
      ctx.fillStyle = "purple";
      ctx.font = "bold 18px Arial";
      ctx.fillText(`🦖 ${boss.name} 🦖`, boss.x, boss.y - 10);
      ctx.fillStyle = 'red';
      ctx.fillRect(boss.x, boss.y - 15, width, 12);
      ctx.fillStyle = 'purple';
      ctx.fillRect(boss.x, boss.y - 15, width * (boss.health / boss.maxHealth), 12);
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText(`${boss.health}/${boss.maxHealth}`, boss.x + width / 2 - 20, boss.y + 10);
    } else {
      ctx.fillStyle = "red";
      ctx.font = "16px Arial";
      ctx.fillText(`BOSS: ${boss.name}`, boss.x, boss.y - 10);
      ctx.fillRect(boss.x, boss.y - 15, width, 10);
      ctx.fillStyle = "green";
      ctx.fillRect(boss.x, boss.y - 15, width * (boss.health / boss.maxHealth), 10);
      ctx.fillStyle = "white";
      ctx.fillText(`${boss.health}/${boss.maxHealth}`, boss.x + width / 2 - 20, boss.y + 10);
    }
  });

  // Draw fireballs
  fireballs.forEach(fireball => {
    ctx.beginPath();
    ctx.arc(fireball.x, fireball.y, fireball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "orange";
    ctx.fill();
  });

  // Draw powerups
  powerUps.forEach(powerup => {
    if (powerup.type !== 'regen' && powerup.type !== 'shield') {
      powerup.pulse += 0.2;
      const pulseSize = Math.sin(powerup.pulse) * 3;
      ctx.beginPath();
      ctx.arc(powerup.x, powerup.y, powerup.radius + pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = powerup.color;
      ctx.fill();
      ctx.shadowColor = powerup.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
      ctx.fillStyle = powerup.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.beginPath();
      ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
      ctx.fillStyle = powerup.color;
      ctx.fill();
    }
  });

  // Draw particles
  drawParticles();

  // Draw active power-up effects
  activePowerUps.forEach(powerup => {
    const timeLeft = powerup.duration - (Date.now() - powerup.startTime);
    const alpha = timeLeft / powerup.duration;
    switch (powerup.type) {
      case 'laser':
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = 'red';
        ctx.fillRect(0, player.y - 20, canvas.width, 40);
        ctx.restore();
        break;
      case 'shield_plus':
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
        break;
      case 'time_slow':
        ctx.save();
        ctx.globalAlpha = alpha * 0.2;
        ctx.fillStyle = 'purple';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        break;
      case 'multi_shot':
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'yellow';
        ctx.font = '16px Arial';
        ctx.fillText('🎯 MULTI-SHOT ACTIVE', 20, canvas.height - 20);
        ctx.restore();
        break;
    }
  });

  // Draw UI (with offset)
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`Score: ${score}  Lives: ${lives}  Coins: ${coins}  Wave: ${wave}`, 20, 30 + uiOffsetY);

  // Draw player name if available
  if (playerData.name) {
    ctx.fillStyle = "#4CAF50";
    ctx.font = "16px Arial";
    ctx.fillText(`Player: ${playerData.name}`, 20, 55 + uiOffsetY);
  }

  // Draw current level theme
  const currentTheme = getLevelDisplayName(level);
  ctx.fillStyle = "gold";
  ctx.font = "16px Arial";
  ctx.fillText(`Level ${level}: ${currentTheme}`, 20, playerData.name ? 80 + uiOffsetY : 50 + uiOffsetY);

  // Draw subscription status
  if (playerData.subscription) {
    ctx.fillStyle = "#4CAF50";
    ctx.font = "14px Arial";
    ctx.fillText("✅ Premium Subscriber", 20, playerData.name ? 105 + uiOffsetY : 75 + uiOffsetY);
  } else if (level <= 3) {
    ctx.fillStyle = "#7c5cff";
    ctx.font = "14px Arial";
    ctx.fillText("🎮 Free Trial (Levels 1-3)", 20, playerData.name ? 105 + uiOffsetY : 75 + uiOffsetY);
  }

  // Draw shop interface
  if (shopOpen) {
    drawShopInterface();
  } else if (gamePaused) {
    drawPauseScreen();
  }
  
  // Draw purchase messages
  if (window.purchaseMessages) {
    window.purchaseMessages.forEach(message => {
      ctx.save();
      ctx.globalAlpha = message.alpha;
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(message.text, message.x, message.y);
      ctx.textAlign = 'left';
      ctx.restore();
    });
  }
}

function drawStartScreen() {
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText("🦖 DINO WARFARE", canvas.width / 2 - 180, canvas.height / 2 - 120);
  ctx.font = "20px Arial";
  ctx.fillText("Fruit of the Spirit Edition", canvas.width / 2 - 120, canvas.height / 2 - 80);
  
  // Show creator information
  ctx.fillStyle = "#4CAF50";
  ctx.font = "16px Arial";
  ctx.fillText("Created by David Oshoba George", canvas.width / 2 - 120, canvas.height / 2 - 50);
  
  // Show player name if available
  if (playerData.name) {
    ctx.fillStyle = "gold";
    ctx.font = "18px Arial";
    ctx.fillText(`Welcome back, ${playerData.name}!`, canvas.width / 2 - 100, canvas.height / 2 - 20);
  }
  
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Click to Start", canvas.width / 2 - 80, canvas.height / 2 + 10);
  
  ctx.font = "16px Arial";
  ctx.fillText("Controls:", canvas.width / 2 - 100, canvas.height / 2 + 50);
  ctx.fillText("Arrow Keys - Move", canvas.width / 2 - 100, canvas.height / 2 + 70);
  ctx.fillText("Spacebar - Shoot", canvas.width / 2 - 100, canvas.height / 2 + 90);
  ctx.fillText("P - Pause/Resume", canvas.width / 2 - 100, canvas.height / 2 + 110);
  ctx.fillText("S - Open/Close Shop", canvas.width / 2 - 100, canvas.height / 2 + 130);
  ctx.fillText("D - Debug Mode", canvas.width / 2 - 100, canvas.height / 2 + 150);
  
  ctx.font = "14px Arial";
  ctx.fillStyle = "gold";
  ctx.fillText("Level Themes: Love, Joy, Peace, Patience, Kindness...", canvas.width / 2 - 150, canvas.height / 2 + 180);
  ctx.fillText("💡 Buy 'Extra Diagonal Bullets' in shop for additional 4-way fire!", canvas.width / 2 - 150, canvas.height / 2 + 200);
}

function drawGameOverScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2 - 50);
  ctx.font = "24px Arial";
  ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2);
  ctx.fillText("Click to restart", canvas.width / 2 - 80, canvas.height / 2 + 50);
}

function drawShopInterface() {
  // Semi-transparent background
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Shop title
  ctx.fillStyle = "white";
  ctx.font = "36px Arial";
  ctx.fillText("🛒 SHOP", canvas.width / 2 - 60, 80);
  
  // Coins display
  ctx.font = "24px Arial";
  ctx.fillText(`💰 Coins: ${coins}`, canvas.width / 2 - 60, 120);
  
  // Shop items
  const startY = 160;
  const itemHeight = 60;
  
  SHOP_ITEMS.forEach((item, index) => {
    const y = startY + (index * itemHeight);
    const canAfford = coins >= item.cost;
    
    // Item background
    ctx.fillStyle = canAfford ? "rgba(255, 255, 255, 0.1)" : "rgba(100, 100, 100, 0.3)";
    ctx.fillRect(canvas.width / 2 - 150, y - 10, 300, 50);
    
    // Item border
    ctx.strokeStyle = canAfford ? "white" : "gray";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 150, y - 10, 300, 50);
    
    // Item name
    ctx.fillStyle = canAfford ? "white" : "gray";
    ctx.font = "20px Arial";
    ctx.fillText(item.name, canvas.width / 2 - 140, y + 10);
    
    // Item cost
    ctx.font = "16px Arial";
    ctx.fillText(`Cost: ${item.cost} coins`, canvas.width / 2 - 140, y + 30);
    
    // Buy button
    if (canAfford) {
      // Check if this button is being hovered
      const isHovered = window.hoveredButton && window.hoveredButton.index === index;
      
      ctx.fillStyle = isHovered ? "lime" : "green";
      ctx.fillRect(canvas.width / 2 + 50, y - 5, 80, 40);
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText("BUY", canvas.width / 2 + 70, y + 20);
      
      // Add button border for better visibility
      ctx.strokeStyle = isHovered ? "yellow" : "lime";
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.strokeRect(canvas.width / 2 + 50, y - 5, 80, 40);
    }
  });
  
  // Instructions
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Click on BUY to purchase items", canvas.width / 2 - 100, canvas.height - 60);
  ctx.fillText("Press SHOP button again to close", canvas.width / 2 - 100, canvas.height - 40);
}

function drawPauseScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Pause title
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText("⏸ PAUSED", canvas.width / 2 - 100, canvas.height / 2 - 80);
  
  // Game info
  ctx.font = "20px Arial";
  ctx.fillText(`Level: ${level} - ${getLevelDisplayName(level)}`, canvas.width / 2 - 120, canvas.height / 2 - 40);
  ctx.fillText(`Score: ${score} | Lives: ${lives} | Coins: ${coins}`, canvas.width / 2 - 140, canvas.height / 2 - 15);
  
  // Instructions
  ctx.font = "18px Arial";
  ctx.fillText("Press P or PAUSE button to resume", canvas.width / 2 - 140, canvas.height / 2 + 15);
  ctx.fillText("Press S or SHOP button to open shop", canvas.width / 2 - 140, canvas.height / 2 + 40);
  
  // Share button area
  const shareButtonY = canvas.height / 2 + 80;
  const shareButtonWidth = 200;
  const shareButtonHeight = 50;
  const shareButtonX = canvas.width / 2 - shareButtonWidth / 2;
  
  // Share button background
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(shareButtonX, shareButtonY, shareButtonWidth, shareButtonHeight);
  
  // Share button border for better visibility
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 3;
  ctx.strokeRect(shareButtonX, shareButtonY, shareButtonWidth, shareButtonHeight);
  
  // Share button text
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("📤 Share Score", canvas.width / 2, shareButtonY + 32);
  ctx.textAlign = "left";
  
  // Share button description
  ctx.fillStyle = "#CCCCCC";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Share score with friends", canvas.width / 2, shareButtonY + 55);
  ctx.textAlign = "left";
}

// Share score function
function shareScore() {
  console.log('Share button clicked!');
  console.log('Web Share API available:', !!navigator.share);
  
  // Create a more shareable message
  const shareText = `🦖 DINO WARFARE SCORE CHALLENGE! 🦖

I scored ${score} points in DinoWarfare!
Level: ${level} - ${getLevelDisplayName(level)}
Theme: ${getLevelTheme(level)}

Can you beat my score? 
Challenge accepted? 💪

#DinoWarfare #Gaming #Challenge`;

  // Always try Web Share API first (works on mobile and some desktop browsers)
  if (navigator.share) {
    console.log('Attempting to use Web Share API...');
    const gameData = {
      title: "🦖 DinoWarfare Score Challenge",
      text: shareText,
      url: window.location.href
    };
    
    navigator.share(gameData)
      .then(() => {
        console.log('Score shared successfully via Web Share API');
        showShareSuccess('Score shared successfully!');
      })
      .catch((error) => {
        console.log('Web Share API failed:', error);
        // Fallback to social share options
        showSocialShareOptions();
      });
  } else {
    console.log('Web Share API not available, showing social share options...');
    // Fallback: show social share options
    showSocialShareOptions();
  }
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showShareSuccess();
      })
      .catch((error) => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showShareSuccess();
      });
  } else {
    // Final fallback
    showShareSuccess(text);
  }
}

// Show success message for sharing
function showShareSuccess(text = null) {
  if (text) {
    alert(`Score shared successfully!\n\n${text}\n\nShare this with your friends!`);
  } else {
    alert('🎉 Score copied to clipboard!\n\nShare it with your friends and challenge them to beat your score!');
  }
}

// Enhanced sharing with social media options
function showSocialShareOptions() {
  console.log('Showing social share options dialog...');
  const shareText = `🦖 DINO WARFARE SCORE CHALLENGE! 🦖

I scored ${score} points in DinoWarfare!
Level: ${level} - ${getLevelDisplayName(level)}
Theme: ${getLevelTheme(level)}

Can you beat my score? 
Challenge accepted? 💪

#DinoWarfare #Gaming #Challenge`;

  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(shareText);
  
  // Create social media share URLs
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    email: `mailto:?subject=DinoWarfare Score Challenge&body=${text}%0A%0A${url}`
  };
  
  // Create share options dialog
  const shareDialog = document.createElement('div');
  shareDialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  
  const shareContent = document.createElement('div');
  shareContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  `;
  
  shareContent.innerHTML = `
    <h2 style="color: #333; margin-bottom: 20px;">🦖 Share Your Score!</h2>
    <p style="color: #666; margin-bottom: 25px;">Choose how you want to share your amazing score:</p>
    
    <div style="display: grid; gap: 10px; margin-bottom: 20px;">
      <button onclick="window.open('${shareUrls.twitter}', '_blank')" style="background: #1DA1F2; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        🐦 Share on Twitter
      </button>
      
      <button onclick="window.open('${shareUrls.facebook}', '_blank')" style="background: #4267B2; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        📘 Share on Facebook
      </button>
      
      <button onclick="window.open('${shareUrls.whatsapp}', '_blank')" style="background: #25D366; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        💬 Share on WhatsApp
      </button>
      
      <button onclick="window.open('${shareUrls.telegram}', '_blank')" style="background: #0088cc; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        📱 Share on Telegram
      </button>
      
      <button onclick="window.open('${shareUrls.email}', '_blank')" style="background: #EA4335; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        📧 Share via Email
      </button>
    </div>
    
    <button onclick="copyToClipboard('${shareText}')" style="background: #4CAF50; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 10px;">
      📋 Copy to Clipboard
    </button>
    
    <button onclick="this.parentElement.parentElement.remove()" style="background: #666; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
      ❌ Close
    </button>
  `;
  
  shareDialog.appendChild(shareContent);
  document.body.appendChild(shareDialog);
  
  // Close dialog when clicking outside
  shareDialog.addEventListener('click', (e) => {
    if (e.target === shareDialog) {
      shareDialog.remove();
    }
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Initialize canvas background
function initializeCanvas() {
  // Set canvas background to black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add a subtle grid pattern for better visibility
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  
  // Draw grid lines
  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Initialize sound system
function initializeSound() {
  // Set volume levels
  shootSound.volume = 0.3;
  hitSound.volume = 0.4;
  gameOverSound.volume = 0.5;
  regenSound.volume = 0.4;
  shieldSound.volume = 0.4;
  bgMusic.volume = 0.2;
  bossIntroSound.volume = 0.4;
  
  console.log('Sound system initialized');
}

// Initialize everything when the page loads
window.addEventListener('load', () => {
  initializeCanvas();
  initializeSound();
  
  // Ensure canvas has black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  console.log('DinoWarfare initialized successfully');
  console.log('Canvas size:', canvas.width, 'x', canvas.height);
  console.log('Sound files loaded:', {
    shoot: shootSound.readyState,
    hit: hitSound.readyState,
    bgMusic: bgMusic.readyState
  });
});

// Start the game loop
gameLoop(); 