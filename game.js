// Dino Warfare - game.js (MOBILE-ENHANCED VERSION)

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Responsive canvas setup
const canvas = document.getElementById("gameCanvas");
const gameContainer = document.getElementById("gameContainer");

// Set canvas size based on device
function resizeCanvas() {
  if (isMobile) {
    // Mobile: full screen with viewport fixes
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Use actual visible area instead of window.innerWidth
    const rect = canvas.getBoundingClientRect();
    const actualWidth = rect.width || window.innerWidth;
    const actualHeight = rect.height || window.innerHeight;
    
    canvas.width = Math.min(actualWidth, window.innerWidth);
    canvas.height = Math.min(actualHeight, window.innerHeight);
    
    // Use the smaller of viewport height or available height
    const availableHeight = window.innerHeight || document.documentElement.clientHeight;
    canvas.height = Math.min(canvas.height, availableHeight);
  } else {
    // Desktop: fixed size with max constraints
    canvas.width = Math.min(960, window.innerWidth - 40);
    canvas.height = Math.min(600, window.innerHeight - 40);
  }
  
  // Update game container size
  gameContainer.style.width = canvas.width + 'px';
  gameContainer.style.height = canvas.height + 'px';
  
  console.log('Canvas resized to:', canvas.width, 'x', canvas.height, 'Mobile:', isMobile);
}

// Initial resize
resizeCanvas();

// Handle window resize
window.addEventListener('resize', () => {
  resizeCanvas();
  if (isMobile) {
    setTimeout(initJoystick, 100);
  }
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    resizeCanvas();
    if (isMobile) {
      initJoystick();
    }
  }, 100);
});

const ctx = canvas.getContext("2d");
if (!ctx) {
  console.error('Failed to get 2D context from canvas!');
} else {
  console.log('Canvas 2D context obtained successfully');
}

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
    // Admin mode: unlock all features for admin@dino.com
    if (playerData.email && playerData.email.toLowerCase() === 'admin@dino.com') {
      playerData.subscription = true;
      playerData.isAdmin = true;
      playerData.maxLevel = 999;
    } else {
      playerData.isAdmin = false;
    }
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
playerImg.src = '/sprites/sprites_player.png';
const raptorImg = new Image();
raptorImg.src = '/sprites/sprites_raptor.png';
const trexImg = new Image();
trexImg.src = '/sprites/sprites_trex.png';
const motherDinoImg = new Image();
motherDinoImg.src = '/sprites/sprites_motherdino.png';
const bulletImg = new Image();
bulletImg.src = '/sprites/sprites_bullet.png';
const powerupImg = new Image();
powerupImg.src = '/sprites/sprites_powerup.png';
const velociraptorImg = new Image();
velociraptorImg.src = '/sprites/sprites_velociraptor.png';
const triceratopsImg = new Image();
triceratopsImg.src = '/sprites/sprites_triceratops.png';
const stegosaurusImg = new Image();
stegosaurusImg.src = '/sprites/sprites_stegosaurus.png';
const pterodactylImg = new Image();
pterodactylImg.src = '/sprites/sprites_pterodactyl.png';
const spinosaurusImg = new Image();
spinosaurusImg.src = '/sprites/sprites_spinosaurus.png';
const ankylosaurusImg = new Image();
ankylosaurusImg.src = '/sprites/sprites_ankylosaurus.png';
const pachycephalosaurusImg = new Image();
pachycephalosaurusImg.src = '/sprites/sprites_pachycephalosaurus.png';

// Player avatar image
const playerAvatarImg = new Image();

// Load sounds with error handling
const shootSound = new Audio('/sounds/sounds_shoot.wav');
const hitSound = new Audio('/sounds/sounds_hit.wav');
const gameOverSound = new Audio('/sounds/sounds_gameover.wav');
const regenSound = new Audio('/sounds/sounds_regen.wav');
const shieldSound = new Audio('/sounds/sounds_shield.wav');
const bgMusic = new Audio('/sounds/sounds_background.wav');
const bossIntroSound = new Audio('/sounds/sounds_boss_intro.mp3');

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
let particles = [];

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

// Premium power-up types
const PREMIUM_POWER_UPS = [
  { type: 'laser', color: 'red', points: 0 },
  { type: 'shield_plus', color: 'cyan', points: 0 },
  { type: 'time_slow', color: 'purple', points: 0 },
  { type: 'nuke', color: 'orange', points: 0 },
  { type: 'multi_shot', color: 'yellow', points: 0 }
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

// Mobile touch controls
let joystickActive = false;
let joystickX = 0;
let joystickY = 0;
let joystickBaseX = 0;
let joystickBaseY = 0;
let joystickRadius = 0;
let playerTouchActive = false;
let playerTouchX = 0;
let playerTouchY = 0;

// --- Add at the top with other globals ---
let playerTargetX = null;

// Initialize direct player touch control
function initPlayerTouchControl() {
  if (!isMobile) {
    console.log('Not mobile device, skipping player touch control initialization');
    return;
  }
  
  console.log('Initializing direct player touch control for mobile...');
  
  // Set up canvas touch events for direct player control
  canvas.addEventListener('touchstart', handlePlayerTouch, { passive: false });
  canvas.addEventListener('touchmove', handlePlayerTouch, { passive: false });
  canvas.addEventListener('touchend', handlePlayerTouchEnd, { passive: false });
  
  console.log('Direct player touch control initialized');
}

// Direct player touch control
function handlePlayerTouch(e) {
  if (!isMobile || !gameStarted || gameOver) return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const touchX = (touch.clientX - rect.left) * scaleX;
  // Allow movement anywhere horizontally
  playerTouchActive = true;
  playerTargetX = Math.max(50, Math.min(canvas.width - 50, touchX));
}

function handlePlayerTouchEnd(e) {
  if (!isMobile) return;
  playerTouchActive = false;
  playerTargetX = null;
}

// Mobile button events
function initMobileButtons() {
  if (!isMobile) {
    console.log('Not mobile device, skipping mobile button initialization');
    return;
  }
  
  console.log('Initializing mobile buttons...');
  
  try {
    // Shoot button
    const shootBtn = document.getElementById('shootBtn');
    console.log('Shoot button found:', !!shootBtn);
    if (shootBtn) {
      shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Shoot button touched!');
        keys[' '] = true; // Trigger shooting
      });
      shootBtn.addEventListener('touchend', () => {
        console.log('Shoot button released!');
        keys[' '] = false;
      });
    }
    
    // Pause button
    const pauseBtn = document.getElementById('pauseBtn');
    console.log('Pause button found:', !!pauseBtn);
    if (pauseBtn) {
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Pause button touched!');
        if (gameStarted && !gameOver) {
          gamePaused = !gamePaused;
          if (gamePaused) {
            bgMusic.pause();
          } else {
            bgMusic.play().catch(() => {});
          }
        }
      });
      // Add click fallback for iOS
      pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Pause button clicked (iOS fallback)!');
        if (gameStarted && !gameOver) {
          gamePaused = !gamePaused;
          if (gamePaused) {
            bgMusic.pause();
          } else {
            bgMusic.play().catch(() => {});
          }
        }
      });
    } else {
      console.error('Pause button not found!');
    }
    
    // Shop button
    const shopBtn = document.getElementById('shopBtn');
    console.log('Shop button found:', !!shopBtn);
    if (shopBtn) {
      shopBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Shop button touched!');
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
      }, { passive: false });
      // Add click event fallback for Android browsers
      shopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Shop button clicked (fallback)!');
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
      });
    }
    
    // Menu button
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    console.log('Menu button found:', !!menuBtn);
    console.log('Mobile menu found:', !!mobileMenu);
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Menu button touched!');
        mobileMenu.classList.add('active');
      });
      // Add click fallback for iOS
      menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Menu button clicked (iOS fallback)!');
        mobileMenu.classList.add('active');
      });
    }
    
    // Menu items
    const mobileResumeBtn = document.getElementById('mobileResumeBtn');
    const mobileShopBtn = document.getElementById('mobileShopBtn');
    const mobileShareBtn = document.getElementById('mobileShareBtn');
    const mobileDebugBtn = document.getElementById('mobileDebugBtn');
    const mobileCloseMenuBtn = document.getElementById('mobileCloseMenuBtn');
    
    console.log('Mobile menu buttons found:', {
      mobileResumeBtn: !!mobileResumeBtn,
      mobileShopBtn: !!mobileShopBtn,
      mobileShareBtn: !!mobileShareBtn,
      mobileDebugBtn: !!mobileDebugBtn,
      mobileCloseMenuBtn: !!mobileCloseMenuBtn
    });
    
    if (mobileResumeBtn) {
      mobileResumeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Mobile resume button touched!');
        if (!gameOver && gameStarted) {
          gamePaused = false;
          shopOpen = false;
          bgMusic.play().catch(() => {});
        }
        mobileMenu.classList.remove('active');
      });
    }
    
    if (mobileShopBtn) {
      mobileShopBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Mobile shop button touched!');
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
        mobileMenu.classList.remove('active');
      });
    }
    
    if (mobileShareBtn) {
      console.log('Setting up mobile share button event listeners...');
      mobileShareBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mobile share button touched!');
        console.log('Game state - started:', gameStarted, 'paused:', gamePaused, 'over:', gameOver);
        
        // Immediately call share function
        try {
          shareScore();
        } catch (error) {
          console.error('Error calling shareScore:', error);
        }
        
        // Close menu after a short delay to allow share dialog to appear
        setTimeout(() => {
          mobileMenu.classList.remove('active');
        }, 100);
      });
      // Add click event fallback for iOS
      mobileShareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mobile share button clicked (iOS fallback)!');
        console.log('Game state - started:', gameStarted, 'paused:', gamePaused, 'over:', gameOver);
        
        // Immediately call share function
        try {
          shareScore();
        } catch (error) {
          console.error('Error calling shareScore:', error);
        }
        
        // Close menu after a short delay to allow share dialog to appear
        setTimeout(() => {
          mobileMenu.classList.remove('active');
        }, 100);
      });
      console.log('Mobile share button event listeners attached successfully');
    } else {
      console.error('Mobile share button not found!');
    }
    
    if (mobileDebugBtn) {
      mobileDebugBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Mobile debug button touched!');
        if (gameStarted) {
          window.debugMode = !window.debugMode;
          console.log('Debug mode:', window.debugMode);
        }
        mobileMenu.classList.remove('active');
      });
    }
    
    if (mobileCloseMenuBtn) {
      mobileCloseMenuBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        console.log('Mobile close menu button touched!');
        mobileMenu.classList.remove('active');
      });
    }
    
    // Close menu when clicking outside
    if (mobileMenu) {
      mobileMenu.addEventListener('touchstart', (e) => {
        if (e.target === mobileMenu) {
          mobileMenu.classList.remove('active');
        }
      });
    }
    
    console.log('Mobile buttons initialization completed successfully');
  } catch (error) {
    console.error('Error initializing mobile buttons:', error);
  }
}

// Mobile touch event listeners are now handled in initPlayerTouchControl()

// Global click handler to ensure buttons are always accessible
window.addEventListener('click', (e) => {
  // If clicking outside canvas, ensure buttons are reset
  if (e.target !== canvas) {
    // Force redraw of buttons on next frame
    window.forceButtonRedraw = true;
  }
});

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

// --- CANVAS BUTTONS ---
const canvasButtons = [
  { key: 'pause', label: '⏸ Pause', action: () => {
      console.log('Pause button action triggered');
      if (gameStarted && !gameOver) {
        gamePaused = !gamePaused;
        if (gamePaused) { bgMusic.pause(); } else { bgMusic.play().catch(() => {}); }
        console.log('Pause button clicked: gamePaused =', gamePaused, 'shopOpen =', shopOpen);
        
        // Visual feedback
        showLevelMessage(gamePaused ? '⏸ Game Paused' : '▶️ Game Resumed');
        
        // Button click feedback
        window.lastButtonClick = { key: 'pause', time: Date.now() };
      }
    }
  },
  { key: 'stop', label: '⛔ Stop', action: () => {
      console.log('Stop button action triggered');
      if (gameStarted) {
        gamePaused = true;
        shopOpen = false;
        bgMusic.pause();
        console.log('Stop button clicked: gamePaused =', gamePaused, 'shopOpen =', shopOpen);
        
        // Button click feedback
        window.lastButtonClick = { key: 'stop', time: Date.now() };
      }
    }
  },
  { key: 'resume', label: '▶️ Resume', action: () => {
      console.log('Resume button action triggered');
      if (!gameOver && gameStarted) {
        gamePaused = false;
        shopOpen = false;
        bgMusic.play().catch(() => {});
        console.log('Resume button clicked: gamePaused =', gamePaused, 'shopOpen =', shopOpen);
        
        // Button click feedback
        window.lastButtonClick = { key: 'resume', time: Date.now() };
      }
    }
  },
  { key: 'shop', label: '🛒 Shop', action: () => {
      console.log('Shop button action triggered');
      if (gameStarted && !gameOver) {
        shopOpen = !shopOpen;
        if (shopOpen) {
          gamePaused = true;
          bgMusic.pause();
        } else {
          gamePaused = false;
          bgMusic.play().catch(() => {});
        }
        console.log('Shop button clicked: gamePaused =', gamePaused, 'shopOpen =', shopOpen);
        
        // Button click feedback
        window.lastButtonClick = { key: 'shop', time: Date.now() };
      }
    }
  }
];

function drawCanvasButtons() {
  const btnW = 65, btnH = 20, gap = 5; // Made buttons slightly larger
  const totalW = canvasButtons.length * btnW + (canvasButtons.length - 1) * gap;
  
  // Ensure buttons stay within screen bounds with better positioning
  let x = canvas.width - totalW - 10; // Start from right edge
  if (x < 10) {
    // If buttons are too wide, stack them vertically or reduce size
    x = 10;
    console.warn('Buttons too wide for screen, adjusting position');
  }
  
  const y = 95; // Fixed position - moved down to stay below UI elements
  
  // Force redraw if requested
  if (window.forceButtonRedraw) {
    console.log('Forcing button redraw due to health check');
    window.forceButtonRedraw = false;
  }
  
  // Ensure buttons are always drawn and positioned correctly
  canvasButtons.forEach((btn, i) => {
    // Double-check bounds before drawing
    if (x < 0 || x + btnW > canvas.width) {
      console.warn(`Button ${btn.key} out of bounds: x=${x}, canvas.width=${canvas.width}`);
      return; // Skip this button if it would be out of bounds
    }
    
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, btnW, btnH);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, btnW, btnH);
    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, x + btnW/2, y + btnH/2 + 1);
    ctx.restore();
    
    // Always update button rectangle - this is critical for click detection
    btn._rect = { x, y, w: btnW, h: btnH };
    
    // Debug: Show button areas when debug mode is on
    if (window.debugMode) {
      ctx.save();
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, btnW, btnH);
      ctx.fillStyle = '#ff00ff';
      ctx.font = '8px Arial';
      ctx.fillText(`${btn.key}`, x + 2, y + 8);
      ctx.restore();
    }
    
    x += btnW + gap;
  });
  
  // Debug: Log button positions periodically
  if (window.debugMode && Math.random() < 0.01) { // 1% chance each frame
    console.log('Button positions updated:', canvasButtons.map(btn => ({ key: btn.key, rect: btn._rect })));
  }
  
  // Force button redraw flag to ensure buttons are always responsive
  window.buttonsDrawn = true;
  
  // Show button click feedback
  if (window.lastButtonClick && Date.now() - window.lastButtonClick.time < 500) {
    const btn = canvasButtons.find(b => b.key === window.lastButtonClick.key);
    if (btn && btn._rect) {
      ctx.save();
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(btn._rect.x - 2, btn._rect.y - 2, btn._rect.w + 4, btn._rect.h + 4);
      ctx.restore();
    }
  }
}

// We'll call drawCanvasButtons directly in the draw function instead

// Handle mouse clicks for canvas buttons - COMPLETELY REWRITTEN
canvas.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Skip canvas button handling on mobile (use touch controls instead)
  if (isMobile) {
    // If game not started or game over, start game on click
    if (!gameStarted || gameOver) {
      startGameFromAuth();
    }
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  console.log('Canvas clicked at:', x, y, 'Canvas size:', canvas.width, 'x', canvas.height);
  
  // Check each button individually using their actual positions
  let buttonClicked = false;
  for (let i = 0; i < canvasButtons.length; i++) {
    const btn = canvasButtons[i];
    if (btn._rect && 
        x >= btn._rect.x && x <= btn._rect.x + btn._rect.w &&
        y >= btn._rect.y && y <= btn._rect.y + btn._rect.h) {
      console.log('Button clicked:', btn.key, 'at position:', btn._rect);
      btn.action();
      buttonClicked = true;
      return;
    }
  }
  
  // Fallback: If no button was clicked but we're in the button area, try keyboard shortcuts
  if (!buttonClicked && y >= 90 && y <= 120 && x >= canvas.width - 300) {
    console.log('Fallback: Button area clicked but no button detected, trying keyboard shortcuts');
    // Try to trigger the most likely button based on X position
    const buttonWidth = 65;
    const gap = 5;
    const totalButtonWidth = buttonWidth + gap;
    const relativeX = x - (canvas.width - 280);
    const buttonIndex = Math.floor(relativeX / totalButtonWidth);
    
    if (buttonIndex >= 0 && buttonIndex < canvasButtons.length) {
      const btn = canvasButtons[buttonIndex];
      console.log('Fallback: Activating button via index:', btn.key);
      btn.action();
      return;
    }
  }
  // If game not started or game over, start game on click
  if (!gameStarted || gameOver) {
    startGameFromAuth();
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

// Mobile touch handling for canvas
if (isMobile) {
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    console.log('Canvas touchstart at:', x, y, 'Canvas size:', canvas.width, 'x', canvas.height);

    // If game not started or game over, start game on touch
    if (!gameStarted || gameOver) {
      startGameFromAuth();
      return;
    }

    // Handle shop BUY button touches
    if (shopOpen) {
      const startY = 160;
      const itemHeight = 60;
      SHOP_ITEMS.forEach((item, index) => {
        const itemY = startY + (index * itemHeight);
        const canAfford = coins >= item.cost;
        const buttonX = canvas.width / 2 + 50;
        const buttonY = itemY - 5;
        const buttonWidth = 80;
        const buttonHeight = 40;
        if (canAfford &&
            x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
          console.log('✅ Buying (touch):', item.name, 'for', item.cost, 'coins');
          buyShopItem(item);
          return;
        } else if (!canAfford &&
                   x >= buttonX && x <= buttonX + buttonWidth &&
                   y >= buttonY && y <= buttonY + buttonHeight) {
          console.log('❌ Not enough coins for (touch):', item.name);
          showPurchaseMessage(`❌ Not enough coins for ${item.name}`);
          return;
        }
      });
      return;
    }
  }, { passive: false });
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
  // Ensure player doesn't get stuck at boundaries with better bounds checking
  const safeMargin = 40; // Keep player away from edges
  const minX = safeMargin;
  const maxX = canvas.width - safeMargin;
  const minY = safeMargin;
  const maxY = canvas.height - safeMargin;
  
  // Smoothly clamp player position
  player.x = Math.max(minX, Math.min(maxX, player.x));
  player.y = Math.max(minY, Math.min(maxY, player.y));
  
  // Debug: Log if player is at boundary
  if (window.debugMode && (player.x === minX || player.x === maxX || player.y === minY || player.y === maxY)) {
    console.log('Player at boundary:', { x: player.x, y: player.y, minX, maxX, minY, maxY });
  }
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
    
    // Add trail for each bullet
    bullets.forEach((bullet, i) => {
      bulletTrails.push({
        x: bullet.x,
        y: bullet.y,
        life: 18,
        color: BULLET_TRAIL_COLORS[i % BULLET_TRAIL_COLORS.length],
        radius: bullet.radius + 3
      });
    });
    
    player.bulletCooldown = 15; // Reduced cooldown for better gameplay
  }
}

function updatePlayer() {
  if (player.speed <= 0) player.speed = 8;
  const prevX = player.x;
  if (isMobile) {
    // Only move if touch is active and target is set
    if (playerTouchActive && playerTargetX !== null) {
      // Smoothly move towards target X
      const dx = playerTargetX - player.x;
      const maxStep = player.speed * 1.5; // Cap speed
      if (Math.abs(dx) > 2) {
        player.x += Math.sign(dx) * Math.min(Math.abs(dx), maxStep);
      }
    }
    // Lock Y position
    player.y = canvas.height - 100;
    // Bounds
    const safeMargin = 40;
    player.x = Math.max(safeMargin, Math.min(canvas.width - safeMargin, player.x));
    // --- Prevent mobile events from setting keys[' '] on desktop ---
    if (!isMobile) keys[' '] = false;
  } else {
    // --- Only allow keyboard input on desktop ---
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    const safeMargin = 40;
    player.y = Math.max(safeMargin, Math.min(canvas.height - safeMargin, player.y));
    // --- Ensure mobile touch does not affect desktop ---
    playerTouchActive = false;
    playerTargetX = null;
  }
  if (keys[' ']) shoot();
  if ((keys['ArrowLeft'] || keys['ArrowRight']) && player.x === prevX) {
    console.log('Player movement stuck detected, resetting position');
    player.x = canvas.width / 2;
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
    // Add vibrant trail as bullet moves
    bulletTrails.push({
      x: bullet.x,
      y: bullet.y,
      life: 18,
      color: BULLET_TRAIL_COLORS[(index + Math.floor(Math.random()*3)) % BULLET_TRAIL_COLORS.length],
      radius: bullet.radius + 3
    });
  });
  // Update and fade bullet trails
  bulletTrails.forEach((trail, i) => {
    trail.life--;
    if (trail.life <= 0) bulletTrails.splice(i, 1);
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
        availablePowerUps = availablePowerUps.concat(PREMIUM_POWER_UPS);
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

// --- GLOBALS FOR EFFECTS/UI POLISH ---
let screenShakeFrames = 0;
let screenShakeIntensity = 0;
let bulletTrails = [];
const BULLET_TRAIL_COLORS = [
  'rgba(255,255,100,0.7)', // yellow
  'rgba(100,200,255,0.6)', // blue
  'rgba(255,120,40,0.5)'   // orange
];
let scorePop = 0, coinsPop = 0, livesPop = 0;
let lastScore = 0, lastCoins = 0, lastLives = 0;
let floatingTexts = [];
let comboCount = 0, comboTimer = 0;

// Animated background layers and helpers
const bgLayers = [
  { speed: 0.2, color: '#222', y: 480, h: 120 }, // distant ground
  { speed: 0.4, color: '#2d2d2d', y: 420, h: 60 }, // mid ground
  { speed: 0.7, color: '#3a3a2d', y: 390, h: 40 }, // near ground
];
let bgClouds = Array.from({length: 5}, (_,i) => ({
  x: Math.random()*960,
  y: 60+Math.random()*80,
  speed: 0.15+Math.random()*0.1,
  w: 120+Math.random()*60,
  h: 40+Math.random()*20
}));
let bgTrees = Array.from({length: 8}, (_,i) => ({
  x: Math.random()*960,
  y: 350+Math.random()*60,
  speed: 0.5+Math.random()*0.2,
  h: 60+Math.random()*30
}));
let lastLevelDrawn = 1;
let levelAnimFrame = 0;

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
          // Animate score/coin pop
          scorePop = 12;
          coinsPop = 12;
          // Floating text
          floatingTexts.push({
            x: enemy.x, y: enemy.y, text: `+${enemy.points} pts`, color: 'yellow', life: 32
          });
          floatingTexts.push({
            x: enemy.x, y: enemy.y+18, text: `+${Math.floor(enemy.points/10)} coins`, color: 'gold', life: 32
          });
          // Combo logic
          comboCount++;
          comboTimer = 40;
        }
        
        bullets.splice(bulletIndex, 1);
        // Impact explosion
        createParticles(enemy.x, enemy.y, 'explosion');
        // Screen shake for large enemies
        if (enemy.radius >= 35) {
          screenShakeFrames = 18;
          screenShakeIntensity = 14;
        }
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
          // Animate score/coin pop
          scorePop = 16;
          coinsPop = 16;
          floatingTexts.push({
            x: boss.x+boss.width/2, y: boss.y+boss.height/2, text: '+100 pts', color: 'yellow', life: 40
          });
          floatingTexts.push({
            x: boss.x+boss.width/2, y: boss.y+boss.height/2+18, text: '+10 coins', color: 'gold', life: 40
          });
          comboCount++;
          comboTimer = 40;
        }
        // Impact explosion
        createParticles(bullet.x, bullet.y, 'explosion');
        // Screen shake for boss
        screenShakeFrames = 28;
        screenShakeIntensity = 22;
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
  
  // Animate score/coin/life pop
  if (score !== lastScore) scorePop = 14;
  if (coins !== lastCoins) coinsPop = 14;
  if (lives !== lastLives) livesPop = 14;
  lastScore = score;
  lastCoins = coins;
  lastLives = lives;
  if (scorePop > 0) scorePop--;
  if (coinsPop > 0) coinsPop--;
  if (livesPop > 0) livesPop--;
  // Update floating texts
  floatingTexts.forEach((ft, i) => {
    ft.y -= 0.7;
    ft.life--;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  });
  // Combo timer
  if (comboTimer > 0) comboTimer--;
  if (comboTimer === 0 && comboCount > 1) {
    // Show combo popup
    floatingTexts.push({
      x: canvas.width/2, y: 120, text: `${comboCount} KILL COMBO!`, color: '#ff66cc', life: 48, size: 28
    });
    comboCount = 0;
  } else if (comboTimer === 0) {
    comboCount = 0;
  }
}

function draw() {
  // Screen shake effect
  if (screenShakeFrames > 0) {
    ctx.save();
    const dx = (Math.random() - 0.5) * screenShakeIntensity;
    const dy = (Math.random() - 0.5) * screenShakeIntensity;
    ctx.translate(dx, dy);
    screenShakeFrames--;
  }
  // Animated background
  drawAnimatedBackground();
  // Fill with black background instead of clearing
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vertical offset for UI to clear the buttons
  const uiOffsetY = 70;

  // --- Always draw canvas buttons on desktop, even if game is paused, over, or not started ---
  if (!isMobile) {
    drawCanvasButtons();
  }

  if (!gameStarted) {
    drawStartScreen();
    return;
  }

  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  // Defensive drawImage usage in draw()
  // Draw player (use avatar if available, otherwise default sprite)
  if (playerData.avatar && playerAvatarImg.complete && playerAvatarImg.naturalWidth > 0) {
    ctx.drawImage(playerAvatarImg, player.x - 30, player.y - 30, 60, 60);
  } else if (playerImg.complete && playerImg.naturalWidth > 0) {
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
    if (enemy.img && enemy.img.complete && enemy.img.naturalWidth > 0) {
      ctx.drawImage(enemy.img, enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2);
    }
  });

  // Draw boss enemies (Mother Dino with proper scaling)
  bossEnemies.forEach(boss => {
    const bossType = BOSS_TYPES.find(type => type.name === boss.name) || BOSS_TYPES[0];
    const scale = bossType.scale || 1.0;
    const width = 120 * scale;
    const height = 120 * scale;
    if (boss.img && boss.img.complete && boss.img.naturalWidth > 0) {
      ctx.drawImage(boss.img, boss.x, boss.y, width, height);
    }
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

  // Draw particles (includes bullet trails)
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
  if (!isMobile) {
    // Desktop UI - Soft glow for UI
    ctx.save();
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 12;
    ctx.fillStyle = "white";
    ctx.font = `bold ${18 + (scorePop>0?scorePop/2:0)}px Arial`;
    ctx.fillText(`Score: ${score}`, 20, 30 + uiOffsetY);
    ctx.font = `bold ${18 + (livesPop>0?livesPop/2:0)}px Arial`;
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(`Lives: ${lives}`, 160, 30 + uiOffsetY);
    ctx.font = `bold ${18 + (coinsPop>0?coinsPop/2:0)}px Arial`;
    ctx.fillStyle = 'gold';
    ctx.fillText(`Coins: ${coins}`, 260, 30 + uiOffsetY);
    ctx.restore();
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Wave: ${wave}`, 380, 30 + uiOffsetY);
    // Draw player name if available
    if (playerData.name) {
      ctx.fillStyle = "#4CAF50";
      ctx.font = "16px Arial";
      ctx.fillText(`Player: ${playerData.name}`, 20, 55 + uiOffsetY);
    }
  } else {
    // Mobile UI - Update HTML elements instead of drawing on canvas
    const scoreText = document.getElementById('scoreText');
    const livesText = document.getElementById('livesText');
    const coinsText = document.getElementById('coinsText');
    const levelText = document.getElementById('levelText');
    
    if (scoreText) scoreText.textContent = `Score: ${score}`;
    if (livesText) livesText.textContent = `Lives: ${lives}`;
    if (coinsText) coinsText.textContent = `Coins: ${coins}`;
    if (levelText) levelText.textContent = `Level ${level}: ${getLevelDisplayName(level)}`;
  }
  
  // Debug: Show player position and speed (temporary)
  if (window.debugMode) {
    ctx.fillStyle = "#ff00ff";
    ctx.font = "12px Arial";
    ctx.fillText(`Player X: ${Math.round(player.x)} | Speed: ${player.speed}`, 20, 200 + uiOffsetY);
    ctx.fillText(`Keys: L=${keys['ArrowLeft']} R=${keys['ArrowRight']}`, 20, 215 + uiOffsetY);
    ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 20, 230 + uiOffsetY);
    
    // Draw player position indicator
    ctx.save();
    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, 0);
    ctx.lineTo(player.x, canvas.height);
    ctx.stroke();
    ctx.restore();
    
    // Draw button area indicator
    ctx.save();
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width - 280, 95, 260, 20);
    ctx.fillStyle = "#00ff00";
    ctx.font = "10px Arial";
    ctx.fillText("BUTTON AREA", canvas.width - 270, 90);
    ctx.restore();
    
    // Show button health status
    let buttonsHealthy = true;
    canvasButtons.forEach(btn => {
      if (!btn._rect || typeof btn._rect.x !== 'number') {
        buttonsHealthy = false;
      }
    });
    
    if (!buttonsHealthy) {
      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 14px Arial";
      ctx.fillText("⚠️ BUTTONS NOT RESPONDING", canvas.width - 280, 120);
    }
  }
  
  // Mobile: Show safe movement area indicator
  if (isMobile && window.debugMode) {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.font = "12px Arial";
    ctx.fillText("SAFE MOVEMENT AREA", canvas.width / 2 - 60, 35);
    ctx.restore();
  }
  // Animate level/theme text when it changes
  if (level !== lastLevelDrawn) {
    levelAnimFrame = 40;
    lastLevelDrawn = level;
  }
  if (levelAnimFrame > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5*Math.sin(levelAnimFrame/4);
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#ffe066";
    ctx.fillText(`Level ${level}: ${getLevelDisplayName(level)}`, 20, playerData.name ? 80 + uiOffsetY : 50 + uiOffsetY);
    ctx.restore();
    levelAnimFrame--;
  } else {
    ctx.fillStyle = "gold";
    ctx.font = "16px Arial";
    ctx.fillText(`Level ${level}: ${getLevelDisplayName(level)}`, 20, playerData.name ? 80 + uiOffsetY : 50 + uiOffsetY);
  }
  // Draw subscription status
  if (playerData.isAdmin) {
    ctx.fillStyle = "#ff00cc";
    ctx.font = "bold 16px Arial";
    ctx.fillText("👑 ADMIN MODE: All features unlocked", 20, playerData.name ? 125 + uiOffsetY : 95 + uiOffsetY);
  } else if (playerData.subscription) {
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
  // End screen shake
  if (screenShakeFrames > 0) {
    ctx.restore();
  }
  // Draw floating texts
  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.life/32);
    ctx.font = ft.size ? `bold ${ft.size}px Arial` : 'bold 18px Arial';
    ctx.fillStyle = ft.color;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.textAlign = 'left';
    ctx.restore();
  });
  // Animate Share Score button when paused
  if (gamePaused && !shopOpen) {
    const shareButtonY = canvas.height / 2 + 80;
    const shareButtonWidth = 200;
    const shareButtonHeight = 50;
    const shareButtonX = canvas.width / 2 - shareButtonWidth / 2;
    ctx.save();
    ctx.shadowColor = '#4fc3f7';
    ctx.shadowBlur = 24 + 8*Math.sin(Date.now()/200);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 4;
    ctx.strokeRect(shareButtonX-4, shareButtonY-4, shareButtonWidth+8, shareButtonHeight+8);
    ctx.restore();
  }
  // Only draw canvas buttons on desktop
  if (!isMobile) {
    drawCanvasButtons();
  }
}

function drawStartScreen() {
  const fontSize = isMobile ? 24 : 40;
  const titleFontSize = isMobile ? 28 : 40;
  const subtitleFontSize = isMobile ? 14 : 20;
  const smallFontSize = isMobile ? 12 : 16;
  
  ctx.fillStyle = "white";
  ctx.font = `${titleFontSize}px Arial`;
  ctx.fillText("🦖 DINO WARFARE", canvas.width / 2 - (titleFontSize * 4.5), canvas.height / 2 - 120);
  ctx.font = `${subtitleFontSize}px Arial`;
  ctx.fillText("Fruit of the Spirit Edition", canvas.width / 2 - (subtitleFontSize * 6), canvas.height / 2 - 80);
  
  // Show creator information
  ctx.fillStyle = "#4CAF50";
  ctx.font = `${smallFontSize}px Arial`;
  ctx.fillText("Created by David Oshoba George", canvas.width / 2 - (smallFontSize * 7.5), canvas.height / 2 - 50);
  
  // Show player name if available
  if (playerData.name) {
    ctx.fillStyle = "gold";
    ctx.font = `${smallFontSize + 2}px Arial`;
    ctx.fillText(`Welcome back, ${playerData.name}!`, canvas.width / 2 - (smallFontSize * 5.5), canvas.height / 2 - 20);
  }
  
  ctx.fillStyle = "white";
  ctx.font = `${fontSize}px Arial`;
  const startText = isMobile ? "Tap to Start" : "Click to Start";
  ctx.fillText(startText, canvas.width / 2 - (fontSize * 3), canvas.height / 2 + 10);
  
  ctx.font = `${smallFontSize}px Arial`;
  ctx.fillText("Controls:", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 50);
  
  if (isMobile) {
    ctx.fillText("Joystick - Move", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 70);
    ctx.fillText("🎯 Button - Shoot", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 90);
    ctx.fillText("⏸ Button - Pause", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 110);
    ctx.fillText("🛒 Button - Shop", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 130);
    ctx.fillText("☰ Menu - More Options", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 150);
  } else {
    ctx.fillText("Arrow Keys - Move", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 70);
    ctx.fillText("Spacebar - Shoot", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 90);
    ctx.fillText("P - Pause/Resume", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 110);
    ctx.fillText("S - Open/Close Shop", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 130);
    ctx.fillText("D - Debug Mode", canvas.width / 2 - (smallFontSize * 3.5), canvas.height / 2 + 150);
  }
  
  ctx.font = `${smallFontSize - 2}px Arial`;
  ctx.fillStyle = "gold";
  ctx.fillText("Level Themes: Love, Joy, Peace, Patience, Kindness...", canvas.width / 2 - (smallFontSize * 7.5), canvas.height / 2 + 180);
  ctx.fillText("💡 Buy 'Extra Diagonal Bullets' in shop for additional 4-way fire!", canvas.width / 2 - (smallFontSize * 7.5), canvas.height / 2 + 200);
}

function drawGameOverScreen() {
  const fontSize = isMobile ? 24 : 40;
  const smallFontSize = isMobile ? 16 : 24;
  
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = `${fontSize}px Arial`;
  ctx.fillText("GAME OVER", canvas.width / 2 - (fontSize * 2.5), canvas.height / 2 - 50);
  ctx.font = `${smallFontSize}px Arial`;
  ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - (smallFontSize * 3), canvas.height / 2);
  const restartText = isMobile ? "Tap to restart" : "Click to restart";
  ctx.fillText(restartText, canvas.width / 2 - (smallFontSize * 3), canvas.height / 2 + 50);
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
  console.log('User agent:', navigator.userAgent);
  console.log('Protocol:', window.location.protocol);
  console.log('URL:', window.location.href);
  
  // Create a more shareable message
  const shareText = `🦖 DINO WARFARE SCORE CHALLENGE! 🦖

I scored ${score} points in DinoWarfare!
Level: ${level} - ${getLevelDisplayName(level)}
Theme: ${getLevelTheme(level)}

Can you beat my score? 
Challenge accepted? 💪

#DinoWarfare #Gaming #Challenge`;

  // Check if we're on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  console.log('iOS detected:', isIOS);
  console.log('Safari detected:', isSafari);

  // iOS-specific sharing approach
  if (isIOS) {
    console.log('Using iOS-specific sharing approach...');
    
    // Try Web Share API first (iOS 13+)
    if (navigator.share && window.location.protocol === 'https:') {
      console.log('Attempting iOS Web Share API...');
      const gameData = {
        title: "🦖 DinoWarfare Score Challenge",
        text: shareText,
        url: window.location.href
      };
      
      navigator.share(gameData)
        .then(() => {
          console.log('iOS Web Share API succeeded!');
          showShareSuccess('Score shared successfully!');
        })
        .catch((error) => {
          console.log('iOS Web Share API failed:', error);
          // Fall back to iOS-specific methods
          tryIOSSharing(shareText);
        });
    } else {
      console.log('Web Share API not available on iOS, trying alternative methods...');
      tryIOSSharing(shareText);
    }
  } else {
    // Non-iOS devices
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
          showSocialShareOptions();
        });
    } else {
      console.log('Web Share API not available, showing social share options...');
      showSocialShareOptions();
    }
  }
}

// iOS-specific sharing methods
function tryIOSSharing(shareText) {
  console.log('Trying iOS-specific sharing methods...');
  
  // Method 1: Try to copy to clipboard first
  if (navigator.clipboard) {
    console.log('Trying clipboard API...');
    navigator.clipboard.writeText(shareText)
      .then(() => {
        console.log('Text copied to clipboard successfully');
        showShareSuccess('Score copied to clipboard! You can now paste it anywhere.');
      })
      .catch((error) => {
        console.log('Clipboard API failed:', error);
        // Fall back to execCommand
        fallbackCopyToClipboard(shareText);
      });
  } else {
    console.log('Clipboard API not available, using fallback...');
    fallbackCopyToClipboard(shareText);
  }
}

// Fallback copy method for older iOS versions
function fallbackCopyToClipboard(text) {
  console.log('Using fallback copy method...');
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      console.log('Fallback copy successful');
      showShareSuccess('Score copied to clipboard! You can now paste it anywhere.');
    } else {
      console.log('Fallback copy failed');
      showSocialShareOptions();
    }
  } catch (error) {
    console.log('Fallback copy error:', error);
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
  shareDialog.setAttribute('role', 'dialog');
  shareDialog.setAttribute('aria-modal', 'true');
  shareDialog.setAttribute('aria-label', 'Share your score');
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
      <button aria-label="Share on Twitter" onclick="window.open('${shareUrls.twitter}', '_blank')" style="background: #1DA1F2; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        🐦 Share on Twitter
      </button>
      
      <button aria-label="Share on Facebook" onclick="window.open('${shareUrls.facebook}', '_blank')" style="background: #4267B2; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        📘 Share on Facebook
      </button>
      
      <button aria-label="Share on WhatsApp" onclick="window.open('${shareUrls.whatsapp}', '_blank')" style="background: #25D366; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        💬 Share on WhatsApp
      </button>
      
      <button aria-label="Share on Telegram" onclick="window.open('${shareUrls.telegram}', '_blank')" style="background: #0088cc; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        📱 Share on Telegram
      </button>
      
      <button aria-label="Share via Email" onclick="window.open('${shareUrls.email}', '_blank')" style="background: #EA4335; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        📧 Share via Email
      </button>
    </div>
    
    <button aria-label="Copy score to clipboard" onclick="copyToClipboard('${shareText}')" style="background: #4CAF50; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 10px;">
      📋 Copy to Clipboard
    </button>
    
    <button aria-label="Close share dialog" onclick="this.parentElement.parentElement.remove()" style="background: #666; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px;">
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
  // Add debug logging for first few frames
  if (!window.frameCount) {
    window.frameCount = 0;
  }
  window.frameCount++;
  
  if (window.frameCount <= 5) {
    console.log(`Game loop frame ${window.frameCount}: gameStarted=${gameStarted}, gamePaused=${gamePaused}, gameOver=${gameOver}`);
  }
  
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
  console.log('Page loaded, initializing game...');
  
  // Check if canvas exists
  if (!canvas) {
    console.error('Canvas not found!');
    return;
  }
  
  console.log('Canvas found, initializing...');
  initializeCanvas();
  initializeSound();

  // Initialize mobile controls
  if (isMobile) {
    console.log('Setting up mobile controls...');
    
    // Try to initialize immediately
    initPlayerTouchControl();
    initMobileButtons();
    
    // Also try again after a short delay in case elements weren't ready
    setTimeout(() => {
      console.log('Retrying mobile control initialization...');
      initPlayerTouchControl();
      initMobileButtons();
    }, 500);
    
    // And one more time after a longer delay
    setTimeout(() => {
      console.log('Final mobile control initialization attempt...');
      initPlayerTouchControl();
      initMobileButtons();
    }, 1000);
    
    // Additional attempts for iOS
    setTimeout(() => {
      console.log('iOS-specific mobile control initialization...');
      initPlayerTouchControl();
      initMobileButtons();
    }, 2000);
    
    console.log('Mobile controls initialization scheduled');
  }
  
  // Ensure canvas has black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  console.log('Canvas initialized, size:', canvas.width, 'x', canvas.height);

  // Auto-start the game for debugging
  if (!gameStarted) {
    console.log('Auto-starting game...');
    window.startGameFromAuth();
  } else {
    console.log('Game already started');
  }

  // Debug overlay (desktop only)
  if (!isMobile) {
    setInterval(() => {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#222';
      ctx.fillRect(10, 10, 260, 90);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`gameStarted: ${gameStarted}`, 20, 30);
      ctx.fillText(`gamePaused: ${gamePaused}`, 20, 50);
      ctx.fillText(`gameOver: ${gameOver}`, 20, 70);
      ctx.fillText(`shopOpen: ${shopOpen}`, 20, 90);
      ctx.restore();
    }, 500);
  }

  // Button health check - ensure buttons remain responsive
  setInterval(() => {
    if (gameStarted && !gameOver) {
      // Check if buttons have valid rectangles
      let buttonsValid = true;
      canvasButtons.forEach((btn, index) => {
        if (!btn._rect || typeof btn._rect.x !== 'number' || typeof btn._rect.y !== 'number') {
          console.warn(`Button ${index} (${btn.key}) has invalid rectangle:`, btn._rect);
          buttonsValid = false;
        }
      });
      
      if (!buttonsValid) {
        console.log('Button health check failed - forcing button redraw');
        window.forceButtonRedraw = true;
      }
    }
  }, 2000); // Check every 2 seconds

  console.log('DinoWarfare initialized successfully');
  console.log('Canvas size:', canvas.width, 'x', canvas.height);
  console.log('Sound files loaded:', {
    shoot: shootSound.readyState,
    hit: hitSound.readyState,
    bgMusic: bgMusic.readyState
  });

  // Attempt to lock orientation to portrait on supported browsers
  if (window.screen.orientation && window.screen.orientation.lock) {
    window.screen.orientation.lock('portrait').catch(function(e) {
      console.log('Orientation lock failed:', e);
    });
  }
});

// Start the game loop
gameLoop(); 

// --- Animated Prehistoric Background ---
function drawAnimatedBackground() {
  // Sky gradient
  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0, '#181c24');
  grad.addColorStop(1, '#232323');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Parallax ground layers
  bgLayers.forEach((layer, i) => {
    ctx.save();
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, layer.y);
    for (let x = 0; x <= canvas.width; x += 80) {
      ctx.lineTo(x, layer.y + Math.sin((x/80 + i + Date.now()/4000*layer.speed)) * 10);
    }
    ctx.lineTo(canvas.width, layer.y+layer.h);
    ctx.lineTo(0, layer.y+layer.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  // Trees (simple silhouettes)
  bgTrees.forEach(tree => {
    tree.x -= tree.speed;
    if (tree.x < -20) tree.x = 980;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#2e3d1f';
    ctx.fillRect(tree.x, tree.y, 12, tree.h);
    ctx.beginPath();
    ctx.arc(tree.x+6, tree.y, 18, Math.PI, 0);
    ctx.fillStyle = '#3e5d2d';
    ctx.fill();
    ctx.restore();
  });
  // Clouds
  bgClouds.forEach(cloud => {
    cloud.x -= cloud.speed;
    if (cloud.x < -cloud.w) cloud.x = 980;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.w, cloud.h, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
} 

// Move or ensure startGameFromAuth is defined before this point
function startGameFromAuth() {
  loadPlayerData();
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
  lastEnemySpawn = Date.now() - 10000;
  lastPowerupSpawn = Date.now();
  bullets = [];
  enemies = [];
  bossEnemies = [];
  fireballs = [];
  powerUps = [];
  particles = [];
  bulletTrails = [];
  player.x = canvas.width / 2;
  player.y = canvas.height - 100;
  player.shield = false;
  player.bulletCooldown = 0;
  player.speed = 8;
  player.bulletSpeed = 12;
  player.maxBullets = 3;
  player.bulletSize = 4;
  player.diagonalShooting = false;
  if (playerData.subscription) {
    player.speed += 2;
    player.bulletSpeed += 3;
    player.maxBullets += 1;
  }
  window.purchaseMessages = [];
  window.levelMessages = [];
  window.lastWaveTime = Date.now() - 25000;
  window.lastLevelWave = 0;
  window.lastRapidFireWave = 0;
  window.lastBossRushWave = 0;
  bgMusic.play().catch(() => {});
  // --- Reset all input states on game start ---
  keys['ArrowLeft'] = false;
  keys['ArrowRight'] = false;
  keys[' '] = false;
  playerTouchActive = false;
  playerTargetX = null;
  // --- End input reset ---
  console.log('Game started from authentication system');
  console.log('Player data:', playerData);
}
window.startGameFromAuth = startGameFromAuth;





function createParticles(x, y, type) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30,
      maxLife: 30,
      color: type === 'explosion' ? 'orange' : 'yellow',
      size: Math.random() * 3 + 2
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  // Draw bullet trails first (under everything)
  if (typeof bulletTrails !== 'undefined') {
    bulletTrails.forEach(trail => {
      ctx.save();
      ctx.globalAlpha = trail.life / 18;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
      ctx.fillStyle = trail.color;
      ctx.shadowColor = trail.color;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.restore();
    });
  }
  if (typeof particles !== 'undefined') {
    particles.forEach(particle => {
      const alpha = particle.life / (particle.maxLife || 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size || 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

if (isMobile) {
  // --- Enhanced debugging for shop BUY buttons ---
  function handleShopTouch(e) {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : null);
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    console.log('[DEBUG] Canvas touch at:', x, y, 'shopOpen:', shopOpen, 'gameStarted:', gameStarted, 'gameOver:', gameOver);

    // Draw a visual indicator where the user tapped
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.restore();

    // If game not started or game over, start game on touch
    if (!gameStarted || gameOver) {
      startGameFromAuth();
      return;
    }

    // Handle shop BUY button touches
    if (shopOpen) {
      const startY = 160;
      const itemHeight = 60;
      SHOP_ITEMS.forEach((item, index) => {
        const itemY = startY + (index * itemHeight);
        const canAfford = coins >= item.cost;
        const buttonX = canvas.width / 2 + 50;
        const buttonY = itemY - 5;
        const buttonWidth = 80;
        const buttonHeight = 40;
        console.log(`[DEBUG] Checking button for ${item.name}: x=${buttonX}-${buttonX+buttonWidth}, y=${buttonY}-${buttonY+buttonHeight}, canAfford=${canAfford}`);
        if (x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
          if (canAfford) {
            console.log('✅ Buying (touch):', item.name, 'for', item.cost, 'coins');
            buyShopItem(item);
          } else {
            console.log('❌ Not enough coins for (touch):', item.name);
            showPurchaseMessage(`❌ Not enough coins for ${item.name}`);
          }
        }
      });
      return;
    }
  }
  canvas.addEventListener('touchstart', handleShopTouch, { passive: false });
  // Add touchend fallback for Android browsers
  canvas.addEventListener('touchend', handleShopTouch, { passive: false });
}

// Test function for iOS sharing debugging
function testIOSSharing() {
  console.log('=== iOS SHARING DEBUG TEST ===');
  console.log('User Agent:', navigator.userAgent);
  console.log('Platform:', navigator.platform);
  console.log('Vendor:', navigator.vendor);
  console.log('Protocol:', window.location.protocol);
  console.log('URL:', window.location.href);
  console.log('Web Share API:', !!navigator.share);
  console.log('Clipboard API:', !!navigator.clipboard);
  console.log('ExecCommand copy:', !!document.execCommand);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  console.log('iOS detected:', isIOS);
  console.log('Safari detected:', isSafari);
  
  if (isIOS) {
    alert('iOS detected! Check console for debug info. Tap OK to test sharing.');
    shareScore();
  } else {
    alert('Not iOS. Current platform: ' + navigator.platform);
  }
}

// Add test function to window for easy access
window.testIOSSharing = testIOSSharing;

// Test function to verify mobile share button
function testMobileShareButton() {
  console.log('=== TESTING MOBILE SHARE BUTTON ===');
  const mobileShareBtn = document.getElementById('mobileShareBtn');
  console.log('Mobile share button found:', !!mobileShareBtn);
  
  if (mobileShareBtn) {
    console.log('Button text content:', mobileShareBtn.textContent);
    console.log('Button HTML:', mobileShareBtn.outerHTML);
    console.log('Button visible:', mobileShareBtn.offsetWidth > 0 && mobileShareBtn.offsetHeight > 0);
    console.log('Button style display:', window.getComputedStyle(mobileShareBtn).display);
    console.log('Button style visibility:', window.getComputedStyle(mobileShareBtn).visibility);
    
    // Try to trigger a click programmatically
    console.log('Attempting to trigger click programmatically...');
    mobileShareBtn.click();
    
    // Also try to trigger touchstart
    console.log('Attempting to trigger touchstart programmatically...');
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    mobileShareBtn.dispatchEvent(touchEvent);
  } else {
    console.error('Mobile share button not found in DOM!');
  }
}

// Add test function to window for easy access
window.testMobileShareButton = testMobileShareButton;

// Test function to check mobile controls
function testMobileControls() {
  console.log('=== TESTING MOBILE CONTROLS ===');
  console.log('Is mobile:', isMobile);
  console.log('Game started:', gameStarted);
  console.log('Game over:', gameOver);
  console.log('Game paused:', gamePaused);
  
  // Check if buttons exist
  const pauseBtn = document.getElementById('pauseBtn');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  
  console.log('Pause button exists:', !!pauseBtn);
  console.log('Menu button exists:', !!menuBtn);
  console.log('Mobile menu exists:', !!mobileMenu);
  
  if (pauseBtn) {
    console.log('Pause button visible:', pauseBtn.offsetWidth > 0 && pauseBtn.offsetHeight > 0);
    console.log('Pause button style:', window.getComputedStyle(pauseBtn).display);
  }
  
  if (menuBtn) {
    console.log('Menu button visible:', menuBtn.offsetWidth > 0 && menuBtn.offsetHeight > 0);
    console.log('Menu button style:', window.getComputedStyle(menuBtn).display);
  }
  
  // Try to trigger pause button
  if (pauseBtn) {
    console.log('Attempting to trigger pause button...');
    pauseBtn.click();
  }
  
  // Check if mobile menu is visible
  if (mobileMenu) {
    console.log('Mobile menu has active class:', mobileMenu.classList.contains('active'));
  }
}

// Add test function to window for easy access
window.testMobileControls = testMobileControls;

// Simple test function for pause button
function testPauseButton() {
  console.log('=== TESTING PAUSE BUTTON ===');
  const pauseBtn = document.getElementById('pauseBtn');
  console.log('Pause button found:', !!pauseBtn);
  
  if (pauseBtn) {
    console.log('Pause button visible:', pauseBtn.offsetWidth > 0 && pauseBtn.offsetHeight > 0);
    console.log('Pause button style:', window.getComputedStyle(pauseBtn).display);
    console.log('Game state - started:', gameStarted, 'paused:', gamePaused, 'over:', gameOver);
    
    // Try to trigger pause button
    console.log('Attempting to trigger pause button...');
    pauseBtn.click();
    
    // Check if game paused
    setTimeout(() => {
      console.log('Game paused after click:', gamePaused);
    }, 100);
  }
}

// Simple test function for menu button
function testMenuButton() {
  console.log('=== TESTING MENU BUTTON ===');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  
  console.log('Menu button found:', !!menuBtn);
  console.log('Mobile menu found:', !!mobileMenu);
  
  if (menuBtn) {
    console.log('Menu button visible:', menuBtn.offsetWidth > 0 && menuBtn.offsetHeight > 0);
    console.log('Menu button style:', window.getComputedStyle(menuBtn).display);
  }
  
  if (mobileMenu) {
    console.log('Mobile menu visible:', mobileMenu.offsetWidth > 0 && mobileMenu.offsetHeight > 0);
    console.log('Mobile menu style:', window.getComputedStyle(mobileMenu).display);
    console.log('Mobile menu has active class:', mobileMenu.classList.contains('active'));
  }
  
  // Try to open menu
  if (menuBtn) {
    console.log('Attempting to open menu...');
    menuBtn.click();
    
    setTimeout(() => {
      if (mobileMenu) {
        console.log('Mobile menu active after click:', mobileMenu.classList.contains('active'));
        console.log('Mobile menu visible after click:', mobileMenu.offsetWidth > 0 && mobileMenu.offsetHeight > 0);
      }
    }, 100);
  }
}

// Add test functions to window for easy access
window.testPauseButton = testPauseButton;
window.testMenuButton = testMenuButton;
window.testMobileControls = testMobileControls;

// Simple test function for share button
function testShareFunction() {
  console.log('=== TESTING SHARE FUNCTION ===');
  console.log('Game state - started:', gameStarted, 'paused:', gamePaused, 'over:', gameOver);
  console.log('Score:', score, 'Level:', level);
  
  try {
    console.log('Calling shareScore function...');
    shareScore();
    console.log('shareScore function called successfully');
  } catch (error) {
    console.error('Error calling shareScore:', error);
  }
}

// Add test function to window for easy access
window.testShareFunction = testShareFunction;