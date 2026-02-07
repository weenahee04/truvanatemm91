import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from '../config/firebase';
import { User } from '../types';

const PRIVACY_CONSENT_V1_TEXT = 'ข้าพเจ้ายอมรับนโยบายความเป็นส่วนตัว และยินยอมให้ Truvamate จัดเก็บและใช้ข้อมูลส่วนบุคคลเพื่อการให้บริการตามที่กฎหมายกำหนด';

// Register with Email & Password
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  options?: { privacyConsentAccepted?: boolean; privacyConsentText?: string; privacyConsentVersion?: string }
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userData: any = {
      id: user.uid,
      uid: user.uid,
      email: user.email || '',
      name: displayName,
      createdAt: new Date().toISOString()
    };

    if (user.photoURL) {
      userData.avatar = user.photoURL;
    }

    if (options?.privacyConsentAccepted) {
      userData.privacyConsent = {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        version: options.privacyConsentVersion || 'v1',
        text: options.privacyConsentText || PRIVACY_CONSENT_V1_TEXT,
        via: 'email',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };
    }

    await setDoc(doc(db, 'users', user.uid), userData);

    return { success: true, user: userData };
  } catch (error: any) {
    let errorMessage = error.message;
    
    // Provide user-friendly error messages
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'วิธีการยืนยันตัวตนนี้ยังไม่ได้เปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ หรือตรวจสอบการตั้งค่าใน Firebase Console';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'รหัสผ่านอ่อนเกินไป ควรมีอย่างน้อย 6 ตัวอักษร';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Register Seller with Email & Password
export const registerSellerWithEmail = async (email: string, password: string, displayName: string, shopName?: string, phone?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore with seller role
    const userData: any = {
      id: user.uid,
      email: user.email || '',
      name: displayName,
      role: 'seller',
      createdAt: new Date().toISOString()
    };

    if (shopName) {
      userData.shopName = shopName;
    }

    if (phone) {
      userData.phone = phone;
    }

    if (user.photoURL) {
      userData.avatar = user.photoURL;
    }

    await setDoc(doc(db, 'users', user.uid), userData);

    return { success: true, user: userData };
  } catch (error: any) {
    let errorMessage = error.message;
    
    // Provide user-friendly error messages
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'วิธีการยืนยันตัวตนนี้ยังไม่ได้เปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ หรือตรวจสอบการตั้งค่าใน Firebase Console';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'รหัสผ่านอ่อนเกินไป ควรมีอย่างน้อย 6 ตัวอักษร';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Login with Email & Password
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let userData: User | null = null;
    
    if (userDoc.exists()) {
      userData = userDoc.data() as User;
      // Always ensure id is set from Firebase Auth uid (cart/user-specific storage depends on it)
      userData = { ...userData, id: user.uid };
      // Ensure email is set from Firebase Auth if not in Firestore
      if (!userData.email && user.email) {
        userData.email = user.email;
      }
      // For email/password users, if name is empty, use email
      if (!userData.name && user.email) {
        userData.name = user.email;
      }
    } else {
      // If Firestore document doesn't exist, create a basic user object from Firebase Auth
      // For email/password users, use email as name if displayName is not available
      userData = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email || 'User',
        createdAt: new Date().toISOString()
      };
      
      // Add photoURL if available
      if (user.photoURL) {
        userData.avatar = user.photoURL;
      }
    }

    return { success: true, user: userData };
  } catch (error: any) {
    let errorMessage = error.message;

    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'การเข้าสู่ระบบด้วยอีเมล/รหัสผ่านยังไม่ได้เปิดใช้งาน\n\nกรุณาทำตามขั้นตอน:\n1. ไปที่ Firebase Console → Authentication → Sign-in method\n2. คลิกที่ "Email/Password"\n3. เปิดใช้งาน (Enable) - ตรวจสอบให้แน่ใจว่าเป็นสีเขียว\n4. บันทึก (Save)\n5. รอ 1-2 นาที แล้วลองอีกครั้ง';
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      errorMessage = 'ไม่พบผู้ใช้นี้ในระบบ หรืออีเมล/รหัสผ่านไม่ถูกต้อง\n\nกรุณาตรวจสอบ:\n1. อีเมล/Username ถูกต้องหรือไม่\n2. รหัสผ่านถูกต้องหรือไม่\n3. ผู้ใช้ถูกสร้างใน Firebase Authentication แล้วหรือยัง\n4. localhost ถูกเพิ่มใน Authorized domains หรือยัง\n\nถ้าใช้บน Vercel ได้แต่ localhost ไม่ได้:\n- เพิ่ม localhost ใน Firebase Console → Authentication → Settings → Authorized domains';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'รหัสผ่านไม่ถูกต้อง';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับ Firebase ได้\n\nกรุณาตรวจสอบ:\n1. เชื่อมต่ออินเทอร์เน็ตหรือไม่\n2. localhost ถูกเพิ่มใน Authorized domains หรือยัง';
    }
    
    return { success: false, error: errorMessage, errorCode: error?.code };
  }
};

// Login with Google
export const loginWithGoogle = async () => {
  try {
    if (auth.currentUser) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    // Prepare user data from Google
    const googleUserData: any = {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || 'User',
      createdAt: new Date().toISOString()
    };
    
    // Only add avatar if it exists (don't set undefined)
    if (user.photoURL) {
      googleUserData.avatar = user.photoURL;
    }
    
    if (!userDoc.exists()) {
      // Create new user document with Google data
      await setDoc(doc(db, 'users', user.uid), googleUserData);
      return { success: true, user: googleUserData };
    }

    // If user exists, update with latest Google data (but preserve role if it's admin/seller)
    const existingUserData = userDoc.data() as User;
    const updatedUserData: any = {
      ...googleUserData,
      // Update avatar and name from Google if available
      avatar: user.photoURL || existingUserData.avatar,
      name: user.displayName || existingUserData.name,
      // Keep existing createdAt
      createdAt: existingUserData.createdAt || googleUserData.createdAt
    };
    
    // Preserve role if user is admin, super_admin, accounting, or seller
    const role = existingUserData.role?.toLowerCase?.();
    if (['admin', 'super_admin', 'accounting', 'seller'].includes(role)) {
      updatedUserData.role = existingUserData.role;
    }
    
    // Update Firestore with latest Google data
    await setDoc(doc(db, 'users', user.uid), updatedUserData, { merge: true });
    
    return { success: true, user: updatedUserData };
  } catch (error: any) {
    let errorMessage = error.message;
    
    // Provide user-friendly error messages with detailed guidance
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'การเข้าสู่ระบบด้วย Google ยังไม่ได้เปิดใช้งาน\n\nกรุณาทำตามขั้นตอน:\n1. ไปที่ Firebase Console → Authentication → Sign-in method\n2. คลิกที่ Google\n3. เปิดใช้งาน (Enable) - ตรวจสอบให้แน่ใจว่าเป็นสีเขียว\n4. ตั้งค่า Project support email\n5. บันทึก (Save)\n6. รอ 1-2 นาที แล้วลองอีกครั้ง\n7. ล้าง browser cache (Ctrl+Shift+R)\n\nตรวจสอบ:\n- Google ต้องแสดงสถานะ "Enabled" (สีเขียว)\n- Project support email ต้องกรอก\n- Authorized domains ต้องมี localhost';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'คุณปิดหน้าต่างการเข้าสู่ระบบ กรุณาลองอีกครั้ง';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'มีการร้องขอการเข้าสู่ระบบอื่นอยู่ กรุณารอสักครู่แล้วลองอีกครั้ง';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'เบราว์เซอร์บล็อกป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับ localhost';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Login with Facebook
export const loginWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    // Prepare user data from Facebook
    const facebookUserData: any = {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || 'User',
      createdAt: new Date().toISOString()
    };
    
    // Only add avatar if it exists (don't set undefined)
    if (user.photoURL) {
      facebookUserData.avatar = user.photoURL;
    }
    
    if (!userDoc.exists()) {
      // Create new user document with Facebook data
      // Don't set role - let it default or be undefined for regular users
      await setDoc(doc(db, 'users', user.uid), facebookUserData);
      return { success: true, user: facebookUserData };
    }

    // If user exists, update with latest Facebook data (but preserve role if it's admin/seller)
    const existingUserData = userDoc.data() as User;
    const updatedUserData: any = {
      ...facebookUserData,
      // Update avatar and name from Facebook if available
      avatar: user.photoURL || existingUserData.avatar,
      name: user.displayName || existingUserData.name,
      // Keep existing createdAt
      createdAt: existingUserData.createdAt || facebookUserData.createdAt
    };
    
    // Preserve role if user is admin, super_admin, accounting, or seller
    const fbRole = existingUserData.role?.toLowerCase?.();
    if (['admin', 'super_admin', 'accounting', 'seller'].includes(fbRole)) {
      updatedUserData.role = existingUserData.role;
    }
    
    // Update Firestore with latest Facebook data
    await setDoc(doc(db, 'users', user.uid), updatedUserData, { merge: true });
    
    return { success: true, user: updatedUserData };
  } catch (error: any) {
    let errorMessage = error.message;
    
    // Provide user-friendly error messages
    if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'การเข้าสู่ระบบด้วย Facebook ยังไม่ได้เปิดใช้งาน กรุณาตรวจสอบการตั้งค่าใน Firebase Console';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'คุณปิดหน้าต่างการเข้าสู่ระบบ';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'มีการร้องขอการเข้าสู่ระบบอื่นอยู่';
    }
    
    console.error('Facebook login error:', error.code, error.message);
    return { success: false, error: errorMessage };
  }
};

export const recordPrivacyConsent = async (
  uid: string,
  via: 'google' | 'facebook' | 'email' | string = 'email',
  payload?: { version?: string; text?: string }
) => {
  try {
    if (!uid) return { success: false, error: 'Missing user id' };
    const privacyConsent = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      version: payload?.version || 'v1',
      text: payload?.text || PRIVACY_CONSENT_V1_TEXT,
      via,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
    await setDoc(doc(db, 'users', uid), { privacyConsent, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error recording privacy consent:', error);
    return { success: false, error: error?.message || 'Failed to record privacy consent' };
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Reset Password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Update seller profile (shop name, phone)
export const updateSellerProfile = async (shopName?: string, phone?: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบ' };
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (shopName) {
      updateData.shopName = shopName;
    }

    if (phone) {
      updateData.phone = phone;
    }

    await updateDoc(doc(db, 'users', currentUser.uid), updateData);

    return { success: true };
  } catch (error: any) {
    console.error('Error updating seller profile:', error);
    return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' };
  }
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: 'ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบ' };
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    // Update password
    await updatePassword(currentUser, newPassword);

    return { success: true };
  } catch (error: any) {
    console.error('Error changing password:', error);
    let errorMessage = 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
    
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'รหัสผ่านใหม่อ่อนเกินไป ควรมีอย่างน้อย 6 ตัวอักษร';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อเปลี่ยนรหัสผ่าน';
    }
    
    return { success: false, error: errorMessage };
  }
};
