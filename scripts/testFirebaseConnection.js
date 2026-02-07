/**
 * Test Firebase Connection on Localhost
 * Run this in browser console at http://localhost:3000
 */

console.log('🧪 Testing Firebase Connection...\n');

// Test 1: Check if Firebase is initialized
try {
  const { auth, db } = await import('../config/firebase.ts');
  console.log('✅ Firebase imports OK');
  console.log('   Auth:', auth ? 'Initialized' : 'NOT initialized');
  console.log('   DB:', db ? 'Initialized' : 'NOT initialized');
  console.log('   Project ID:', auth?.app?.options?.projectId);
  console.log('   Auth Domain:', auth?.app?.options?.authDomain);
} catch (error) {
  console.error('❌ Firebase import failed:', error);
}

// Test 2: Try to get auth state
try {
  const { auth } = await import('../config/firebase.ts');
  const { onAuthStateChanged } = await import('firebase/auth');
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ Auth state check: User logged in', user.email);
    } else {
      console.log('ℹ️ Auth state check: No user logged in');
    }
  });
} catch (error) {
  console.error('❌ Auth state check failed:', error);
}

// Test 3: Check authorized domains
console.log('\n📋 Instructions to fix:');
console.log('1. Go to: https://console.firebase.google.com/project/truvamate-e3b97/authentication/settings');
console.log('2. Scroll to "Authorized domains"');
console.log('3. Verify "localhost" is in the list');
console.log('4. If not, click "Add domain" and add "localhost"');
console.log('5. Wait 2-3 minutes');
console.log('6. Clear browser cache and try again');

// Test 4: Check sign-in methods
console.log('\n📋 Check Sign-in Methods:');
console.log('1. Go to: https://console.firebase.google.com/project/truvamate-e3b97/authentication/providers');
console.log('2. Verify Email/Password is enabled');
console.log('3. Verify Google is enabled (if using Google login)');








