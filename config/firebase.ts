import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDzn6L0F-w_o4KJN-_jPBYOLKaLlpgk1f4",
  authDomain: "truvamate-9e0fa.firebaseapp.com",
  projectId: "truvamate-9e0fa",
  storageBucket: "truvamate-9e0fa.firebasestorage.app",
  messagingSenderId: "896181893176",
  appId: "1:896181893176:web:cb4a98e430ef1921fa8ecd",
  measurementId: "G-14CMG00HGS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth providers (must be declared before console.log statements)
export const googleProvider = new GoogleAuthProvider();
// Add email scope to ensure email is available
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const facebookProvider = new FacebookAuthProvider();
// Facebook provider - let it use default scopes

// Verify Firebase is initialized (for debugging)
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase initialized:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    auth: auth ? 'OK' : 'FAILED',
    db: db ? 'OK' : 'FAILED',
  });
  
  // Check Google provider
  console.log('🔍 Google Provider initialized:', googleProvider ? 'OK' : 'FAILED');
  console.log('🔍 Facebook Provider initialized:', facebookProvider ? 'OK' : 'FAILED');
  
  // Log important info for debugging
  console.log('📋 Firebase Config Check:');
  console.log('   - Project ID:', firebaseConfig.projectId);
  console.log('   - Auth Domain:', firebaseConfig.authDomain);
  console.log('   - Current Domain:', window.location.hostname);
  console.log('   - To verify Google Sign-in enabled:');
  console.log('     https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/providers');
  console.log('   - To add authorized domains:');
  console.log('     https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/settings');
  
  // Check if domain is authorized
  const currentDomain = window.location.hostname;
  if (currentDomain.includes('vercel.app') || currentDomain.includes('localhost')) {
    console.log('⚠️ Current domain:', currentDomain);
    console.log('   Make sure this domain is in Firebase Authorized domains!');
    console.log('   If you see "auth/unauthorized-domain" error, add this domain:');
    console.log('   ', currentDomain);
  }
}

export default app;
