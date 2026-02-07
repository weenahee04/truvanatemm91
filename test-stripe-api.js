// Test Stripe Payment API with Node.js
// Usage: node test-stripe-api.js

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api/payments`;

// Configuration - Replace with your Firebase ID token
const FIREBASE_TOKEN = process.env.FIREBASE_TOKEN || 'YOUR_FIREBASE_TOKEN_HERE';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    log('✅ Backend is running', 'green');
    return true;
  } catch (error) {
    log('❌ Backend is not running. Please start it first:', 'red');
    log('   cd backend && npm run dev', 'yellow');
    return false;
  }
}

async function testPromptPayPaymentIntent() {
  log('\n🧪 Test 1: Create PromptPay Payment Intent', 'blue');
  log('------------------------------------------', 'blue');
  
  try {
    const response = await axios.post(`${API_URL}/create-intent`, {
      amount: 100,
      currency: 'thb',
      paymentMethod: 'promptpay',
    }, {
      headers: {
        'Authorization': `Bearer ${FIREBASE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      log(`✅ PromptPay Payment Intent created successfully`, 'green');
      log(`   Payment ID: ${response.data.paymentId}`, 'green');
      if (response.data.payment?.stripePaymentIntentId) {
        log(`   Payment Intent ID: ${response.data.payment.stripePaymentIntentId}`, 'green');
      }
      
      if (response.data.qrCodeData?.qrCodeUrl) {
        log(`   QR Code URL: ${response.data.qrCodeData.qrCodeUrl}`, 'green');
      } else {
        log(`   ⚠️  QR Code not available - may need to enable PromptPay in Stripe Dashboard`, 'yellow');
      }
      
      return response.data;
    } else {
      log('❌ Failed to create PromptPay Payment Intent', 'red');
      return null;
    }
  } catch (error) {
    log('❌ Error creating PromptPay Payment Intent', 'red');
    if (error.response) {
      console.error('Response:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

async function testAlipayPaymentIntent() {
  log('\n🧪 Test 2: Create Alipay/WeChat Pay Payment Intent', 'blue');
  log('---------------------------------------------', 'blue');
  
  try {
    const response = await axios.post(`${API_URL}/create-intent`, {
      amount: 100,
      currency: 'thb',
      paymentMethod: 'stripe_qr',
    }, {
      headers: {
        'Authorization': `Bearer ${FIREBASE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      if (response.data.qrCodeUnavailable) {
        log('⚠️  Alipay/WeChat Pay QR code is not available', 'yellow');
        if (response.data.message) {
          log(`   Message: ${response.data.message}`, 'yellow');
        }
        log('   This is expected if your Stripe account is in Thailand', 'yellow');
      } else {
        log('✅ Alipay/WeChat Pay Payment Intent created successfully', 'green');
        log(`   Payment ID: ${response.data.paymentId}`, 'green');
        if (response.data.qrCodeData?.qrCodeUrl) {
          log(`   QR Code URL: ${response.data.qrCodeData.qrCodeUrl}`, 'green');
        }
      }
      return response.data;
    } else {
      log('❌ Failed to create Alipay/WeChat Pay Payment Intent', 'red');
      return null;
    }
  } catch (error) {
    log('❌ Error creating Alipay/WeChat Pay Payment Intent', 'red');
    if (error.response) {
      console.error('Response:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

async function testPaymentIntentStatus(paymentIntentId) {
  if (!paymentIntentId) {
    return;
  }

  log('\n🧪 Test 3: Get Payment Intent Status', 'blue');
  log('------------------------------------', 'blue');
  
  try {
    const response = await axios.get(`${API_URL}/intent/${paymentIntentId}/status`, {
      headers: {
        'Authorization': `Bearer ${FIREBASE_TOKEN}`,
      },
    });

    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      log(`✅ Payment Intent Status retrieved`, 'green');
      log(`   Status: ${response.data.status}`, 'green');
      return response.data;
    } else {
      log('❌ Failed to get Payment Intent Status', 'red');
      return null;
    }
  } catch (error) {
    log('❌ Error getting Payment Intent Status', 'red');
    if (error.response) {
      console.error('Response:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

async function main() {
  log('🧪 Testing Stripe Payment API', 'blue');
  log('==============================', 'blue');
  
  // Check backend health
  const isBackendRunning = await testBackendHealth();
  if (!isBackendRunning) {
    process.exit(1);
  }

  // Check token
  if (FIREBASE_TOKEN === 'YOUR_FIREBASE_TOKEN_HERE') {
    log('\n⚠️  Please set FIREBASE_TOKEN environment variable or update the script', 'yellow');
    log('   To get a Firebase ID token:', 'yellow');
    log('   1. Open browser and go to http://localhost:5001', 'yellow');
    log('   2. Login to your account', 'yellow');
    log('   3. Open Browser Console (F12)', 'yellow');
    log('   4. Run: const user = firebase.auth().currentUser; const token = await user.getIdToken(); console.log(token);', 'yellow');
    log('   5. Copy the token and run: FIREBASE_TOKEN="your-token" node test-stripe-api.js', 'yellow');
    process.exit(1);
  }

  // Test PromptPay
  const promptpayResult = await testPromptPayPaymentIntent();
  
  // Test Alipay/WeChat Pay
  const alipayResult = await testAlipayPaymentIntent();
  
  // Test Payment Intent Status
  if (promptpayResult?.payment?.stripePaymentIntentId) {
    await testPaymentIntentStatus(promptpayResult.payment.stripePaymentIntentId);
  }

  log('\n✅ Testing complete!', 'green');
  log('\nNext steps:', 'blue');
  log('1. Check the QR codes in the responses', 'blue');
  log('2. Test payment by scanning QR codes with appropriate apps', 'blue');
  log('3. Monitor payment status using the status endpoint', 'blue');
}

main().catch(console.error);





