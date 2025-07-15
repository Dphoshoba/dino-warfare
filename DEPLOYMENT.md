# 🚀 DinoWarfare Deployment Guide

This guide will help you deploy DinoWarfare to production with all features working correctly.

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Stripe account (for payments)
- A web hosting service (Vercel, Netlify, GitHub Pages, etc.)

## 🔧 Setup Steps

### 1. Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.template .env
   ```

2. Edit `.env` with your actual values:
   ```env
   # Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
   STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   STRIPE_SECRET_KEY=sk_test_your_actual_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
   
   # Game Configuration
   GAME_SUBSCRIPTION_PRICE=250
   GAME_CURRENCY=USD
   GAME_NAME=DinoWarfare
   ```

### 2. Stripe Setup

1. **Create a Stripe Account**:
   - Go to [stripe.com](https://stripe.com) and create an account
   - Complete the verification process

2. **Get API Keys**:
   - Go to [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
   - Copy your publishable key and secret key
   - Update your `.env` file

3. **Set Up Webhooks** (Optional for production):
   - Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://yourdomain.com/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret to your `.env` file

### 3. Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Test the Game**:
   - Open `http://localhost:5173`
   - Create an account and test the game
   - Test the demo payment system
   - Test the Stripe payment system (with test cards)

### 4. Build for Production

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Preview the Build**:
   ```bash
   npm run preview
   ```

3. **Test the Production Build**:
   - Open `http://localhost:4173`
   - Verify all features work correctly

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure Environment Variables**:
   - Go to your Vercel dashboard
   - Add your environment variables from `.env`

### Option 2: Netlify

1. **Build and Deploy**:
   ```bash
   npm run build
   ```

2. **Drag and Drop**:
   - Go to [netlify.com](https://netlify.com)
   - Drag the `dist` folder to deploy

3. **Configure Environment Variables**:
   - Go to Site Settings > Environment Variables
   - Add your environment variables

### Option 3: GitHub Pages

1. **Update vite.config.ts**:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   });
   ```

2. **Deploy**:
   ```bash
   npm run build
   git add dist
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

### Option 4: Traditional Web Hosting

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Upload Files**:
   - Upload all files from the `dist` folder to your web server
   - Ensure your server supports HTTPS (required for Stripe)

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use environment variables in your hosting platform
- Keep your Stripe secret keys secure

### HTTPS
- Stripe requires HTTPS in production
- Ensure your hosting provider supports SSL certificates
- Use Let's Encrypt for free SSL certificates

### Content Security Policy
- Consider adding CSP headers for additional security
- Example CSP for DinoWarfare:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.stripe.com;
  ```

## 📱 PWA Configuration

The game is configured as a Progressive Web App (PWA) with:

- **Service Worker**: Caches assets for offline play
- **Web App Manifest**: Provides app-like experience
- **Install Prompt**: Users can install the game on their devices

### PWA Features
- Offline capability (cached assets)
- App-like experience
- Installable on mobile devices
- Background sync (when supported)

## 🧪 Testing Checklist

Before deploying to production, test:

### Authentication
- [ ] User registration
- [ ] User login
- [ ] Profile setup
- [ ] Auto-login functionality

### Game Features
- [ ] Basic gameplay (levels 1-3)
- [ ] Premium features (level 4+)
- [ ] Power-ups and upgrades
- [ ] Shop functionality
- [ ] Score sharing

### Payment System
- [ ] Demo payment (for testing)
- [ ] Stripe payment integration
- [ ] Subscription status tracking
- [ ] Payment error handling

### PWA Features
- [ ] Offline functionality
- [ ] Install prompt
- [ ] Service worker caching
- [ ] App manifest

### Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## 🚨 Troubleshooting

### Common Issues

1. **Stripe Not Loading**:
   - Check your publishable key
   - Ensure HTTPS is enabled
   - Check browser console for errors

2. **Game Not Starting**:
   - Check browser console for JavaScript errors
   - Verify all assets are loading
   - Clear browser cache

3. **PWA Not Working**:
   - Check service worker registration
   - Verify manifest.json is accessible
   - Test on HTTPS

4. **Payment Failures**:
   - Use Stripe test cards for testing
   - Check webhook configuration
   - Verify environment variables

### Debug Mode
Enable debug mode by pressing `D` during gameplay to see additional information.

## 📞 Support

For deployment issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Test with Stripe test mode first
4. Check the README.md for additional information

## 🎉 Success!

Once deployed, your DinoWarfare game will be available with:
- ✅ Full authentication system
- ✅ Premium subscription features
- ✅ Stripe payment integration
- ✅ PWA capabilities
- ✅ Cross-platform compatibility
- ✅ Offline functionality

Enjoy your epic dinosaur battle game! 🦖⚔️ 