# 🦖 DinoWarfare - Premium Edition

An epic dinosaur battle game with authentication, subscription system, and premium features. Created by David Oshoba George.

## 🎮 Game Features

### Free Trial (Levels 1-3)
- **Basic Gameplay**: Move, shoot, collect power-ups
- **Standard Enemies**: Raptors, T-Rex, Velociraptors, Triceratops
- **Basic Power-ups**: Health regeneration, Shield
- **Mother Dino Boss**: Epic boss battles
- **Fruits of the Spirit Themes**: Love, Joy, Peace levels

### Premium Features (Level 4+)
- **Unlimited Progression**: Access to all levels and themes
- **Enhanced Boss Battles**: Special abilities and scaling
- **Premium Power-ups**:
  - 🔴 **Laser Mode**: Continuous laser beam effect
  - 💎 **Invincible Shield**: Complete damage immunity
  - ⏰ **Time Slow**: Slow motion enemies
  - 💥 **Nuke**: Destroy all enemies instantly
  - 🎯 **Multi-Shot**: 5-way bullet spread
- **Particle Effects**: Visual enhancements for all actions
- **Enhanced Visuals**: Glowing effects, pulse animations
- **Premium Player Stats**: Increased speed, bullet speed, and capacity

## 🔐 Authentication System

### User Registration
- Email and password authentication
- Profile setup with avatar upload
- Display name customization
- Data persistence across sessions

### User Management
- Secure login/logout system
- Profile management
- Subscription status tracking
- Game progress saving

## 💳 Payment Integration

### Stripe Configuration
The game includes a complete Stripe payment integration setup:

#### Environment Variables (.env)
```env
# Stripe Payment Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Game Configuration
GAME_SUBSCRIPTION_PRICE=250
GAME_CURRENCY=USD
GAME_NAME=DinoWarfare
```

#### Payment Features
- **One-time payment**: $2.50 for lifetime access
- **Secure processing**: Stripe integration
- **Demo mode**: Test payment functionality
- **Subscription tracking**: User subscription status
- **Payment history**: Complete transaction records

### Setting Up Stripe
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Update the `.env` file with your actual keys:
   - Replace `pk_test_your_stripe_publishable_key_here` with your publishable key
   - Replace `sk_test_your_stripe_secret_key_here` with your secret key
   - Replace `whsec_your_webhook_secret_here` with your webhook secret

## 🚀 Getting Started

### Prerequisites
- Node.js (for development server)
- Modern web browser
- Stripe account (for payments)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Stripe keys in `.env` file
4. Start development server: `npm run dev`

### Game Controls
- **Movement**: Arrow Keys or WASD
- **Shoot**: Spacebar
- **Pause/Resume**: P key or Pause button
- **Shop**: S key or Shop button
- **Debug Mode**: D key

## 🎯 Premium Power-ups Explained

### Laser Mode 🔴
- **Effect**: Continuous laser beam across screen
- **Duration**: 10 seconds
- **Visual**: Red beam effect with particles
- **Strategy**: Perfect for clearing waves of enemies

### Invincible Shield 💎
- **Effect**: Complete damage immunity
- **Duration**: 15 seconds
- **Visual**: Cyan shield with particle effects
- **Strategy**: Use during boss battles or heavy enemy waves

### Time Slow ⏰
- **Effect**: Enemies move at 30% speed
- **Duration**: 8 seconds
- **Visual**: Purple overlay effect
- **Strategy**: Gives you time to aim and dodge

### Nuke 💥
- **Effect**: Instantly destroys all enemies, damages bosses
- **Duration**: Instant
- **Visual**: Explosion particles for each enemy
- **Strategy**: Emergency escape from overwhelming situations

### Multi-Shot 🎯
- **Effect**: 5-way bullet spread
- **Duration**: 12 seconds
- **Visual**: Yellow indicator text
- **Strategy**: Increased coverage for multiple enemies

## 🎨 Visual Enhancements

### Particle Systems
- **Explosion**: Orange particles for enemy destruction
- **Laser**: Red particles for laser mode
- **Shield**: Cyan particles for shield activation
- **Power-up**: Gold particles for power-up collection

### Premium Effects
- **Glowing Power-ups**: Premium power-ups have glow effects
- **Pulse Animation**: Premium power-ups pulse to attract attention
- **Screen Effects**: Time slow overlay, laser beam effects
- **Enhanced UI**: Premium status indicators

## 🔧 Technical Features

### Game Engine
- **Canvas-based rendering**: Smooth 60fps gameplay
- **Particle system**: Dynamic visual effects
- **Collision detection**: Precise hit detection
- **Audio integration**: Sound effects and background music

### Data Management
- **LocalStorage**: User data persistence
- **Session management**: Auto-login functionality
- **Progress tracking**: Level and score saving
- **Subscription status**: Payment verification

### Performance
- **Optimized rendering**: Efficient canvas operations
- **Memory management**: Proper cleanup of game objects
- **Smooth animations**: RequestAnimationFrame usage
- **Responsive design**: Works on all screen sizes

## 🎮 Game Progression

### Level System
- **Level 1-3**: Free trial with basic features
- **Level 4+**: Premium content with enhanced features
- **Theme Cycling**: Fruits of the Spirit themes repeat
- **Boss Scaling**: Bosses get stronger each level

### Wave System
- **Wave Progression**: Enemies spawn every 30 seconds
- **Special Events**: Rapid fire waves, boss rushes
- **Difficulty Scaling**: Enemies get stronger over time
- **Reward System**: Coins and score accumulation

## 🛠️ Development

### File Structure
```
DinoWarfare/
├── index.html          # Main HTML with authentication
├── game.js             # Game engine and logic
├── style.css           # Styling and animations
├── stripe-config.js    # Payment integration
├── .env                # Environment variables
├── assets/             # Game assets
│   ├── sprites/        # Game sprites
│   └── sounds/         # Audio files
└── README.md           # This file
```

### Key Components
- **Authentication System**: User registration and login
- **Game Engine**: Core gameplay mechanics
- **Premium System**: Subscription and feature unlocking
- **Payment Integration**: Stripe payment processing
- **Particle System**: Visual effects engine

## 🎯 Future Enhancements

### Planned Features
- **Multiplayer Mode**: Real-time multiplayer battles
- **Leaderboards**: Global and friend leaderboards
- **Achievement System**: Unlockable achievements
- **Custom Skins**: Player and enemy customization
- **Mobile Support**: Touch controls and mobile optimization

### Technical Improvements
- **Server-side Processing**: Backend API for data management
- **Real-time Updates**: Live game updates and patches
- **Analytics**: Player behavior tracking
- **A/B Testing**: Feature testing framework

## 📞 Support

For support or questions about DinoWarfare:
- **Creator**: David Oshoba George
- **Email**: [Your contact email]
- **Documentation**: This README file

## 📄 License

This project is created by David Oshoba George. All rights reserved.

---

**Enjoy the ultimate dinosaur warfare experience! 🦖⚔️** 