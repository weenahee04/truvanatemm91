// Quick API Test - Get Firebase Token from Browser
// Run this in browser console after logging in

// Step 1: Get Firebase Token (run this in browser console)
const getToken = async () => {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error('Please login first');
    return null;
  }
  const token = await user.getIdToken();
  console.log('=== COPY THIS TOKEN ===');
  console.log(token);
  console.log('========================');
  return token;
};

// Step 2: Test PromptPay Payment Intent (run this in browser console with token)
const testPromptPay = async (token) => {
  try {
    const response = await fetch('http://localhost:5000/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'thb',
        paymentMethod: 'promptpay'
      })
    });
    
    const data = await response.json();
    console.log('PromptPay Response:', data);
    
    if (data.qrCodeData?.qrCodeUrl) {
      console.log('✅ QR Code URL:', data.qrCodeData.qrCodeUrl);
      console.log('📱 Scan this QR code with your bank app');
    } else if (data.qrCodeUnavailable) {
      console.warn('⚠️ QR Code not available:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Step 3: Test Alipay/WeChat Pay Payment Intent
const testAlipay = async (token) => {
  try {
    const response = await fetch('http://localhost:5000/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'thb',
        paymentMethod: 'stripe_qr'
      })
    });
    
    const data = await response.json();
    console.log('Alipay/WeChat Pay Response:', data);
    
    if (data.qrCodeData?.qrCodeUrl) {
      console.log('✅ QR Code URL:', data.qrCodeData.qrCodeUrl);
    } else if (data.qrCodeUnavailable) {
      console.warn('⚠️ QR Code not available:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Step 4: Test Payment Status
const testStatus = async (token, paymentIntentId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/payments/intent/${paymentIntentId}/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Status Response:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage instructions:
console.log(`
🧪 Stripe API Test Functions
============================

1. Get Token:
   const token = await getToken();

2. Test PromptPay:
   const result = await testPromptPay(token);

3. Test Alipay/WeChat Pay:
   const result = await testAlipay(token);

4. Test Status (use paymentIntentId from previous result):
   const status = await testStatus(token, 'pi_...');

Run these functions in the browser console after logging in.
`);





