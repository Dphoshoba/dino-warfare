// Stripe Configuration for DinoWarfare
// This file handles payment processing for premium subscriptions

// Stripe configuration (Client-side compatible)
const STRIPE_CONFIG = {
  publishableKey: 'pk_test_demo_key_here', // Demo key for testing
  secretKey: 'sk_test_demo_key_here', // Demo key for testing
  webhookSecret: 'whsec_demo_secret_here', // Demo webhook secret
  subscriptionPrice: 250, // $2.50 in cents
  currency: 'USD',
  gameName: 'DinoWarfare'
};

// Payment processing functions
class StripePaymentProcessor {
  constructor() {
    this.stripe = null;
    this.elements = null;
    this.cardElement = null;
    this.isInitialized = false;
  }

  // Initialize Stripe
  async initialize() {
    try {
      // For demo purposes, we'll simulate Stripe initialization
      console.log('Initializing Stripe with demo configuration...');
      
      // Try to load Stripe.js if available
      if (!window.Stripe) {
        try {
          await this.loadStripeScript();
        } catch (error) {
          console.warn('Stripe.js not available, using demo mode');
          this.isInitialized = true; // Mark as initialized for demo
          return true;
        }
      }
      
      // Try to initialize Stripe with demo key
      if (window.Stripe) {
        this.stripe = Stripe(STRIPE_CONFIG.publishableKey);
      }
      
      this.isInitialized = true;
      console.log('✅ Stripe initialized successfully (demo mode)');
      return true;
    } catch (error) {
      console.warn('❌ Stripe initialization failed, using demo mode:', error);
      this.isInitialized = true; // Still allow demo functionality
      return true;
    }
  }

  // Load Stripe.js script
  loadStripeScript() {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }

  // Create payment elements
  createPaymentElements() {
    if (!this.isInitialized) {
      console.error('Stripe not initialized');
      return false;
    }

    try {
      this.elements = this.stripe.elements();
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#ffffff',
            '::placeholder': {
              color: '#aab7c4'
            }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      });

      // Mount the card element
      const cardContainer = document.getElementById('card-element');
      if (cardContainer) {
        this.cardElement.mount(cardContainer);
        console.log('✅ Payment elements created');
        return true;
      } else {
        console.error('Card element container not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to create payment elements:', error);
      return false;
    }
  }

  // Process payment
  async processPayment(amount = STRIPE_CONFIG.subscriptionPrice) {
    console.log('Processing payment for amount:', amount);
    
    if (!this.isInitialized) {
      console.error('Stripe not properly initialized');
      return { success: false, error: 'Payment system not ready' };
    }

    try {
      // If we have a real Stripe instance and card element
      if (this.stripe && this.cardElement) {
        // Create payment method
        const { paymentMethod, error } = await this.stripe.createPaymentMethod({
          type: 'card',
          card: this.cardElement,
          billing_details: {
            name: 'DinoWarfare Premium Subscription'
          }
        });

        if (error) {
          console.error('Payment method error:', error);
          return { success: false, error: error.message };
        }

        console.log('Payment method created:', paymentMethod.id);
        
        // Simulate server-side payment processing
        const paymentResult = await this.simulateServerPayment(paymentMethod.id, amount);
        return paymentResult;
      } else {
        // Demo mode - simulate payment without real Stripe
        console.log('Running in demo mode - simulating payment');
        const paymentResult = await this.simulateServerPayment('demo_payment_method', amount);
        return paymentResult;
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  // Simulate server-side payment processing (for demo)
  async simulateServerPayment(paymentMethodId, amount) {
    // In a real application, this would be a server-side API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 95% success rate
        const isSuccess = Math.random() > 0.05;
        
        if (isSuccess) {
          resolve({
            success: true,
            transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
            amount: amount,
            currency: STRIPE_CONFIG.currency
          });
        } else {
          resolve({
            success: false,
            error: 'Payment declined by bank'
          });
        }
      }, 2000); // Simulate network delay
    });
  }

  // Handle payment errors
  handlePaymentError(error) {
    const errorElement = document.getElementById('card-errors');
    if (errorElement) {
      errorElement.textContent = error;
      errorElement.style.display = 'block';
    }
    console.error('Payment error:', error);
  }

  // Clear payment errors
  clearPaymentErrors() {
    const errorElement = document.getElementById('card-errors');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  // Get subscription price in dollars
  getSubscriptionPrice() {
    return (STRIPE_CONFIG.subscriptionPrice / 100).toFixed(2);
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: STRIPE_CONFIG.currency
    }).format(amount / 100);
  }
}

// Global payment processor instance
window.stripePaymentProcessor = new StripePaymentProcessor();

// Initialize Stripe when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Stripe config loading...');
  
  // Always try to initialize for demo purposes
  try {
    const initialized = await window.stripePaymentProcessor.initialize();
    console.log('Stripe initialization result:', initialized);
    
    // Only create payment elements if the form exists
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm && initialized) {
      const elementsCreated = window.stripePaymentProcessor.createPaymentElements();
      console.log('Stripe elements created:', elementsCreated);
    }
  } catch (error) {
    console.warn('Stripe initialization failed:', error);
    // Continue without Stripe - demo payment will still work
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StripePaymentProcessor, STRIPE_CONFIG };
}

