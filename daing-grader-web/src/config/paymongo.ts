/**
 * PayMongo Configuration
 * 
 * IMPORTANT: These are TEST keys - no real money involved!
 * Test cards will work, real cards will be rejected.
 * 
 * Secret key is now stored securely in backend environment variables.
 * Only public key is exposed in frontend (which is safe and required).
 */

export const PAYMONGO_CONFIG = {
  // Public key - safe to use in frontend, required for PayMongo.js
  // This is read from environment variable for security
  publicKey: import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || 'pk_test_JsM6hAfEyDF58ULeova92Jfp',
  
  // API base URL - now points to our backend for secure operations
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // Test mode indicator
  isTestMode: true,
}

/**
 * PayMongo Test Cards for Testing
 * Use these during checkout - they won't charge real money!
 */
export const TEST_CARDS = {
  success: {
    number: '4343434343434345',
    expiry: '12/28',
    cvv: '123',
    description: 'Always succeeds'
  },
  declined: {
    number: '4571736000000008',
    expiry: '12/28', 
    cvv: '123',
    description: 'Always declined'
  },
  threeDSecure: {
    number: '4120000000000007',
    expiry: '12/28',
    cvv: '123',
    description: 'Requires 3D Secure'
  }
}
