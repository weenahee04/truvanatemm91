/**
 * Stripe Payment Integration Status Checker
 * 
 * This script checks the status of Stripe payment integration
 * Run with: node scripts/checkStripeStatus.js
 */

// Note: This is a reference script. You can run it in browser console or adapt for Node.js

const checkStripeStatus = async () => {
  console.log('🔍 Checking Stripe Payment Integration Status...\n');
  
  const status = {
    firestore: {
      rulesDeployed: '❓ Unknown',
      settingsExist: '❓ Unknown',
      stripeEnabled: '❓ Unknown',
      keysConfigured: '❓ Unknown',
    },
    backend: {
      controllerExists: '❓ Unknown',
      routesConfigured: '❓ Unknown',
    },
    frontend: {
      serviceExists: '❓ Unknown',
      adminPanelExists: '❓ Unknown',
    }
  };

  // Instructions for manual check
  console.log('📋 Manual Status Check Instructions:\n');
  
  console.log('1. Check Firestore Configuration:');
  console.log('   - Go to Firebase Console → Firestore Database');
  console.log('   - Open collection: payment_settings');
  console.log('   - Open document: payment_settings');
  console.log('   - Check if Stripe gateway exists and is enabled\n');
  
  console.log('2. Check Admin Panel:');
  console.log('   - Go to: /admin/payment-settings');
  console.log('   - Check if Stripe section shows enabled');
  console.log('   - Check if keys are filled in\n');
  
  console.log('3. Check Backend:');
  console.log('   - File exists: backend/src/controllers/payment.controller.ts');
  console.log('   - Stripe SDK installed: backend/package.json has "stripe"');
  console.log('   - Routes configured: backend/src/routes/payment.routes.ts\n');
  
  console.log('4. Test Payment Intent Creation:');
  console.log('   - POST /api/payments/create-intent');
  console.log('   - Should return clientSecret if configured\n');
  
  return status;
};

// If running in browser console, you can check Firestore directly:
const checkStripeInBrowser = async () => {
  console.log('🔍 Browser-based Stripe Status Check\n');
  
  try {
    // Import Firebase (if available)
    const { db } = await import('../config/firebase.js');
    const { doc, getDoc } = await import('firebase/firestore');
    
    console.log('📊 Checking Firestore payment_settings...\n');
    
    const settingsRef = doc(db, 'payment_settings', 'payment_settings');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      console.log('❌ payment_settings document does not exist');
      console.log('   → Go to /admin/payment-settings to initialize');
      return;
    }
    
    const settings = settingsSnap.data();
    console.log('✅ payment_settings document exists\n');
    
    const stripeGateway = settings.gateways?.find(g => g.id === 'stripe');
    
    if (!stripeGateway) {
      console.log('❌ Stripe gateway not found in settings');
      return;
    }
    
    console.log('📋 Stripe Configuration:');
    console.log(`   Enabled: ${stripeGateway.enabled ? '✅ Yes' : '❌ No'}`);
    console.log(`   Mode: ${stripeGateway.testMode ? '🧪 Test Mode' : '🚀 Live Mode'}`);
    console.log(`   Public Key: ${stripeGateway.config?.publicKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Secret Key: ${stripeGateway.config?.secretKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Webhook Secret: ${stripeGateway.config?.webhookSecret ? '✅ Configured' : '⚠️  Not configured (optional)'}`);
    
    if (stripeGateway.config?.publicKey) {
      const keyType = stripeGateway.config.publicKey.startsWith('pk_live_') ? 'Live' : 
                     stripeGateway.config.publicKey.startsWith('pk_test_') ? 'Test' : 'Unknown';
      console.log(`   Key Type: ${keyType}`);
    }
    
    console.log('\n📝 Summary:');
    const isConfigured = stripeGateway.enabled && 
                        stripeGateway.config?.publicKey && 
                        stripeGateway.config?.secretKey;
    
    if (isConfigured) {
      console.log('✅ Stripe is properly configured and ready to use!');
    } else {
      console.log('⚠️  Stripe configuration is incomplete:');
      if (!stripeGateway.enabled) console.log('   - Enable Stripe in admin panel');
      if (!stripeGateway.config?.publicKey) console.log('   - Add Public Key');
      if (!stripeGateway.config?.secretKey) console.log('   - Add Secret Key');
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
    console.log('\n💡 Tip: Run this in browser console while on the admin panel page');
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkStripeStatus, checkStripeInBrowser };
}

// Instructions
console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Stripe Payment Integration Status Check                  ║
╚══════════════════════════════════════════════════════════════╝

📋 Quick Check Methods:

1. Admin Panel (Easiest):
   → Go to /admin/payment-settings
   → Check Stripe section status

2. Firebase Console:
   → Firestore Database → payment_settings collection
   → Check payment_settings document

3. Browser Console (on admin panel):
   → F12 → Console tab
   → Run: checkStripeInBrowser()

4. Backend API Test:
   → POST /api/payments/create-intent
   → Check response for configuration status

═══════════════════════════════════════════════════════════════
`);






