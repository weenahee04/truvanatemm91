import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: string;
  totalReferrals: number;
  totalEarnings: number;
  isActive: boolean;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerCode: string;
  referredUserId: string;
  referredUserEmail: string;
  referredUserName: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  commission: number;
  commissionPaid: boolean;
  orderValue?: number;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

export interface ReferralSettings {
  commissionRate: number; // เปอร์เซ็นต์
  minOrderValue: number; // ยอดขั้นต่ำที่ได้ commission
  requireFirstPurchase: boolean; // ต้องซื้อก่อนถึงจะได้ commission
  maxCommissionPerReferral: number; // commission สูงสุดต่อคน
  maxReferrals: number; // จำนวนผู้ใช้สูงสุดที่ได้ cashback
}

// Default settings - Updated according to new rules
const DEFAULT_SETTINGS: ReferralSettings = {
  commissionRate: 2, // 2% cashback
  minOrderValue: 1000, // 1,000 บาท
  requireFirstPurchase: true,
  maxCommissionPerReferral: Infinity, // ไม่จำกัดต่อคน แต่จำกัดจำนวนคน
  maxReferrals: 10, // สูงสุด 10 คน
};

/**
 * Generate unique referral code - 6 random digits
 */
export const generateReferralCode = async (userId: string): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Generate 6 random digits (100000 to 999999)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if code already exists
    try {
      const codeDoc = await getDoc(doc(db, 'referralCodes', code));
      if (!codeDoc.exists()) {
        return code; // Code is unique
      }
    } catch {
      // If error checking, try next code
    }
    
    attempts++;
  }
  
  // Fallback: use timestamp-based code if all attempts fail
  const timestamp = Date.now().toString();
  return timestamp.substring(timestamp.length - 6);
};

/**
 * Create referral code for user
 */
export const createReferralCode = async (userId: string): Promise<ReferralCode> => {
  try {
    // First check if user document exists, create it if it doesn't
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      try {
        const { auth } = await import('../config/firebase');
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userId) {
          const basicUserData = {
            id: userId,
            email: currentUser.email || '',
            name: currentUser.displayName || 'User',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', userId), basicUserData);
        } else {
          await setDoc(doc(db, 'users', userId), {
            id: userId,
            createdAt: new Date().toISOString()
          });
        }
      } catch {
        // Continue anyway - might have been created by another process
      }
    }

    // Check if user already has a referral code
    const existingCode = await getReferralCodeByUserId(userId);
    if (existingCode) {
      return existingCode;
    }

    const code = await generateReferralCode(userId);
    
    const referralCode: ReferralCode = {
      code,
      userId,
      createdAt: new Date().toISOString(),
      totalReferrals: 0,
      totalEarnings: 0,
      isActive: true,
    };

    await setDoc(doc(db, 'referralCodes', code), referralCode);

    try {
      await updateDoc(doc(db, 'users', userId), {
        referralCode: code,
      });
    } catch (updateError: any) {
      if (updateError.code === 'not-found' || updateError.message?.includes('No document')) {
        const { auth } = await import('../config/firebase');
        const currentUser = auth.currentUser;
        const userData: any = {
          id: userId,
          referralCode: code,
          createdAt: new Date().toISOString()
        };
        if (currentUser && currentUser.uid === userId) {
          if (currentUser.email) userData.email = currentUser.email;
          if (currentUser.displayName) userData.name = currentUser.displayName;
        }
        await setDoc(doc(db, 'users', userId), userData, { merge: true });
      } else {
        throw updateError;
      }
    }

    return referralCode;
  } catch (error: any) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.referralCode) {
          const codeDoc = await getDoc(doc(db, 'referralCodes', userData.referralCode));
          if (codeDoc.exists()) {
            return codeDoc.data() as ReferralCode;
          }
        }
      }
    } catch {
      // Ignore check error
    }
    throw error;
  }
};

/**
 * Get referral code by user ID
 */
export const getReferralCodeByUserId = async (userId: string): Promise<ReferralCode | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      try {
        const { auth } = await import('../config/firebase');
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userId) {
          const basicUserData = {
            id: userId,
            email: currentUser.email || '',
            name: currentUser.displayName || 'User',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', userId), basicUserData);
          return null;
        }
      } catch {
        // Ignore create error
      }
      return null;
    }

    const userData = userDoc.data();
    if (!userData.referralCode) {
      return null;
    }

    const codeDoc = await getDoc(doc(db, 'referralCodes', userData.referralCode));
    if (!codeDoc.exists()) {
      return null;
    }

    return codeDoc.data() as ReferralCode;
  } catch {
    return null;
  }
};

/**
 * Validate referral code
 */
export const validateReferralCode = async (code: string): Promise<boolean> => {
  try {
    if (!code || code.trim().length === 0) {
      return false;
    }

    const codeDoc = await getDoc(doc(db, 'referralCodes', code.trim()));
    if (!codeDoc.exists()) {
      return false;
    }

    const data = codeDoc.data() as ReferralCode;
    return data.isActive === true;
  } catch {
    return false;
  }
};

/**
 * Register referral (when someone signs up with referral code)
 */
export const registerReferral = async (
  referralCode: string,
  newUserId: string,
  newUserEmail: string,
  newUserName: string
): Promise<void> => {
  try {
    const codeDoc = await getDoc(doc(db, 'referralCodes', referralCode));
    if (!codeDoc.exists()) {
      throw new Error('Invalid referral code');
    }

    const codeData = codeDoc.data() as ReferralCode;

    if (codeData.userId === newUserId) {
      throw new Error('Cannot refer yourself');
    }

    const referralId = `${codeData.userId}_${newUserId}`;
    const existingReferralDoc = await getDoc(doc(db, 'referrals', referralId));
    if (existingReferralDoc.exists()) {
      return;
    }

    // Create referral record
    const referral: Referral = {
      id: referralId,
      referrerId: codeData.userId,
      referrerCode: referralCode,
      referredUserId: newUserId,
      referredUserEmail: newUserEmail,
      referredUserName: newUserName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      commission: 0,
      commissionPaid: false,
    };

    await setDoc(doc(db, 'referrals', referralId), referral);

    try {
      await updateDoc(doc(db, 'referralCodes', referralCode), {
        totalReferrals: increment(1),
      });
    } catch {
      // Don't throw - referral is already created
    }

    try {
      await updateDoc(doc(db, 'users', newUserId), {
        referredBy: codeData.userId,
        referredByCode: referralCode,
      });
    } catch {
      // Don't throw - referral is already created
    }
  } catch (error: any) {
    if (error.message === 'Cannot refer yourself') {
      throw new Error('คุณไม่สามารถแนะนำตัวเองได้');
    }
    if (error.message === 'Invalid referral code') {
      throw new Error('รหัสแนะนำเพื่อนไม่ถูกต้อง');
    }
    throw error;
  }
};

/**
 * Process referral commission (after purchase)
 * Rules: 2% cashback when referred user spends over 1,000 baht
 *        Maximum cashback from 10 users
 */
export const processReferralCommission = async (
  userId: string,
  orderValue: number
): Promise<{ success: boolean; commission?: number; error?: string }> => {
  try {
    // Get user data to check if referred
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    if (!userData.referredBy) {
      return { success: false, error: 'User not referred' };
    }

    // Get referral record
    const referralId = `${userData.referredBy}_${userId}`;
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));
    
    // Get settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'referral'));
    const settings = settingsDoc.exists() 
      ? (settingsDoc.data() as ReferralSettings)
      : DEFAULT_SETTINGS;

    // Get all completed referrals for this referrer to check 10-user limit
    const referrerReferralsQuery = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userData.referredBy),
      where('status', '==', 'completed')
    );
    const referrerReferralsSnapshot = await getDocs(referrerReferralsQuery);
    const completedReferrals = referrerReferralsSnapshot.docs.map(d => d.data() as Referral);

    // Get current cumulative spending for this referred user
    let cumulativeSpending = orderValue;
    let existingReferral: Referral | null = null;
    
    if (referralDoc.exists()) {
      existingReferral = referralDoc.data() as Referral;
      const previousSpending = existingReferral.orderValue || 0;
      cumulativeSpending = previousSpending + orderValue;
      
      // If already completed, don't process again
      if (existingReferral.status === 'completed') {
        return { success: false, error: 'Cashback already processed for this referral' };
      }
    }

    // Check if cumulative spending meets minimum (1,000 baht)
    if (cumulativeSpending < settings.minOrderValue) {
      // Update cumulative spending but don't award cashback yet
      if (referralDoc.exists() && existingReferral) {
        await updateDoc(doc(db, 'referrals', referralId), {
          orderValue: cumulativeSpending,
        });
      } else {
        // Create new referral record if doesn't exist
        const referral: Referral = {
          id: referralId,
          referrerId: userData.referredBy,
          referrerCode: userData.referredByCode || '',
          referredUserId: userId,
          referredUserEmail: userData.email || '',
          referredUserName: userData.name || 'User',
          status: 'pending',
          createdAt: new Date().toISOString(),
          commission: 0,
          commissionPaid: false,
          orderValue: cumulativeSpending,
        };
        await setDoc(doc(db, 'referrals', referralId), referral);
      }
      return { success: false, error: `Cumulative spending must reach ${settings.minOrderValue} baht (currently ${cumulativeSpending.toFixed(2)} baht)` };
    }

    // Check if referrer already has 10 completed referrals (max limit)
    if (completedReferrals.length >= settings.maxReferrals) {
      // Still update spending but don't award
      if (referralDoc.exists() && existingReferral) {
        await updateDoc(doc(db, 'referrals', referralId), {
          orderValue: cumulativeSpending,
        });
      }
      return { success: false, error: 'Referrer has reached maximum cashback limit (10 users)' };
    }

    // Calculate commission (2% of cumulative spending)
    // Note: We award 2% of the cumulative amount that crosses the threshold
    const commission = (cumulativeSpending * settings.commissionRate) / 100;

    // Create or update referral record with completed status
    if (referralDoc.exists() && existingReferral) {
      await updateDoc(doc(db, 'referrals', referralId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        commission,
        orderValue: cumulativeSpending,
      });
    } else {
      // Create new referral record if doesn't exist (for social logins that might skip registration step)
      const referral: Referral = {
        id: referralId,
        referrerId: userData.referredBy,
        referrerCode: userData.referredByCode || '',
        referredUserId: userId,
        referredUserEmail: userData.email || '',
        referredUserName: userData.name || 'User',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        commission,
        commissionPaid: false,
        orderValue: cumulativeSpending,
      };
      await setDoc(doc(db, 'referrals', referralId), referral);
    }

    // Get referrer's referral code
    const referrerUserDoc = await getDoc(doc(db, 'users', userData.referredBy));
    const referrerCode = referrerUserDoc.exists() && referrerUserDoc.data().referralCode
      ? referrerUserDoc.data().referralCode
      : null;

    if (referrerCode) {
      // Update referral code stats
      await updateDoc(doc(db, 'referralCodes', referrerCode), {
        totalEarnings: increment(commission),
      });
    }

    // Create commission transaction
    const transactionId = `commission_${referralId}_${Date.now()}`;
    await setDoc(doc(db, 'referralTransactions', transactionId), {
      id: transactionId,
      referralId,
      referrerId: userData.referredBy,
      amount: commission,
      type: 'commission',
      status: 'pending',
      createdAt: new Date().toISOString(),
      orderValue,
    });

    return { success: true, commission };
  } catch (error: any) {
    // Commission processing failed
    return { success: false, error: error.message || 'Failed to process referral commission' };
  }
};

/**
 * Get user's referrals
 */
export const getUserReferrals = async (userId: string): Promise<Referral[]> => {
  try {
    // Try with orderBy first
    try {
      const q = query(
        collection(db, 'referrals'),
        where('referrerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Referral));
    } catch (orderByError: any) {
      // If orderBy fails (missing index), try without it
      if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
        // Index missing - use simple query and sort manually (works fine for small datasets)
        const q = query(
          collection(db, 'referrals'),
          where('referrerId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const referrals = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Referral));
        // Sort manually by createdAt (descending - newest first)
        return referrals.sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
      }
      throw orderByError;
    }
  } catch (error) {
    // getUserReferrals failed
    return [];
  }
};

/**
 * Get referral statistics
 */
export const getReferralStats = async (userId: string): Promise<ReferralStats> => {
  try {
    const referrals = await getUserReferrals(userId);

    const stats: ReferralStats = {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'completed').length,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      totalEarnings: referrals.reduce((sum, r) => sum + (r.commission || 0), 0),
      pendingEarnings: referrals
        .filter(r => r.status === 'completed' && !r.commissionPaid)
        .reduce((sum, r) => sum + (r.commission || 0), 0),
      paidEarnings: referrals
        .filter(r => r.commissionPaid)
        .reduce((sum, r) => sum + (r.commission || 0), 0),
    };

    return stats;
  } catch (error) {
    // getReferralStats failed
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
    };
  }
};

/**
 * Get all referrals (Admin)
 */
export const getAllReferrals = async (): Promise<Referral[]> => {
  try {
    const q = query(
      collection(db, 'referrals'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Referral);
  } catch (error) {
    // getAllReferrals failed
    return [];
  }
};

/**
 * Get referral settings
 */
export const getReferralSettings = async (): Promise<ReferralSettings> => {
  try {
    const docRef = doc(db, 'settings', 'referral');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return DEFAULT_SETTINGS;
    }
    return docSnap.data() as ReferralSettings;
  } catch (error) {
    // getReferralSettings failed
    return DEFAULT_SETTINGS;
  }
};

/**
 * Update referral settings (Admin)
 */
export const updateReferralSettings = async (settings: ReferralSettings): Promise<void> => {
  try {
    await setDoc(doc(db, 'settings', 'referral'), settings);
  } catch (error) {
    // updateReferralSettings failed
    throw error;
  }
};

/**
 * Mark commission as paid (Admin)
 */
export const markCommissionAsPaid = async (referralId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'referrals', referralId), {
      commissionPaid: true,
      paidAt: new Date().toISOString(),
    });
  } catch (error) {
    // markCommissionAsPaid failed
    throw error;
  }
};

export const referralService = {
  generateReferralCode,
  createReferralCode,
  getReferralCodeByUserId,
  validateReferralCode,
  registerReferral,
  processReferralCommission,
  getUserReferrals,
  getReferralStats,
  getAllReferrals,
  getReferralSettings,
  updateReferralSettings,
  markCommissionAsPaid,
};

export default referralService;
