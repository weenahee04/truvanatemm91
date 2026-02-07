/**
 * Script to create Admin User in Firebase Authentication and Firestore
 * 
 * Run this in browser console on http://localhost:5001 or use Firebase Console
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const ADMIN_EMAIL = 'Truv_admin@truvamate.com';
const ADMIN_PASSWORD = 'super@admin';
const ADMIN_NAME = 'Truvamate Admin';

/**
 * Create admin user
 * Run this function in browser console after importing Firebase services
 */
export const createAdminUser = async () => {
  try {
    console.log('🔵 Creating admin user...');
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;
    
    console.log('✅ User created in Firebase Auth:', user.uid);
    
    // Create user document in Firestore with admin role
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    
    console.log('✅ Admin user document created in Firestore');
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('👤 Username for login:', 'Truv_admin');
    
    return { success: true, user };
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ User already exists. You can login with:');
      console.log('   Username: Truv_admin');
      console.log('   Password: super@admin');
      return { success: false, error: 'User already exists' };
    }
    
    return { success: false, error: error.message };
  }
};

// To use in browser console:
// 1. Open browser console on http://localhost:5001
// 2. Paste and run:

/*
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';

const createAdmin = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'Truv_admin@truvamate.com', 'super@admin');
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      id: userCredential.user.uid,
      email: 'Truv_admin@truvamate.com',
      name: 'Truvamate Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    console.log('✅ Admin user created!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

createAdmin();
*/








