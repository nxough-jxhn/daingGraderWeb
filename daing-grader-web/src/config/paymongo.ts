/**
 * PayMongo Configuration
 * 
 * IMPORTANT: These are TEST keys - no real money involved!
 * Test cards will work, real cards will be rejected.
 */

export const PAYMONGO_CONFIG = {
  // Public key - safe to use in frontend
  publicKey: 'pk_test_JsM6hAfEyDF58ULeova92Jfp',
  
  // Secret key - should ideally be in backend, but for school project it's ok
  secretKey: 'sk_test_LjXwVfQP9a7QMdnuuuL8gfAb',
  
  // API base URL
  apiUrl: 'https://api.paymongo.com/v1',
  
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
