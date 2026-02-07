/**
 * Script to verify Firebase Configuration
 * Run this in browser console at http://localhost:5001
 */

console.log('🔍 Verifying Firebase Configuration...\n');

// Check if Firebase is loaded
if (typeof window.firebase === 'undefined') {
  console.error('❌ Firebase is not loaded on window object');
  console.log('💡 Try: Check if Firebase SDK is properly imported');
}

// Expected config
const expectedConfig = {
  apiKey: "AIzaSyB_OWhpMZ9pemfqMJmZ_hv30cFksLlg6lU",
  authDomain: "truvamate-e3b97.firebaseapp.com",
  projectId: "truvamate-e3b97",
  storageBucket: "truvamate-e3b97.firebasestorage.app",
  messagingSenderId: "693226652314",
  appId: "1:693226652314:web:1d814042d754194131d523"
};

console.log('📋 Expected Config:', expectedConfig);
console.log('\n');

// Instructions
console.log('📝 To verify Google Sign-in is enabled:');
console.log('1. Go to: https://console.firebase.google.com/project/truvamate-e3b97/authentication/providers');
console.log('2. Click on "Google"');
console.log('3. Verify "Enable" toggle is ON (green)');
console.log('4. Verify "Project support email" is filled');
console.log('5. Check "Authorized domains" includes "localhost"');
console.log('\n');

console.log('📝 To verify OAuth consent screen:');
console.log('1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=truvamate-e3b97');
console.log('2. Check if OAuth consent screen is configured');
console.log('3. If in "Testing" mode, make sure your email is in test users');
console.log('\n');

console.log('🧪 Test Google Sign-in manually:');
console.log('Try clicking Google login button and check browser console for detailed errors');








