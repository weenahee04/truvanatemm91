import { Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

// Generate unique referral code
const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create referral code for user
export const createReferralCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user already has a code
    const existingCode = await db.collection('referralCodes')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingCode.empty) {
      return res.json({ code: existingCode.docs[0].data() });
    }

    // Generate unique code
    let code = generateCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await db.collection('referralCodes').doc(code).get();
      if (!existing.exists) {
        isUnique = true;
      } else {
        code = generateCode();
      }
    }

    // Create referral code
    const referralCode = {
      code,
      userId,
      createdAt: new Date().toISOString(),
      totalReferrals: 0,
      totalEarnings: 0,
      isActive: true,
    };

    await db.collection('referralCodes').doc(code).set(referralCode);

    res.status(201).json({ code: referralCode });
  } catch (error) {
    logger.error('Error creating referral code:', error);
    next(error);
  }
};

// Validate referral code
export const validateReferralCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const doc = await db.collection('referralCodes').doc(code).get();

    if (!doc.exists) {
      return res.json({ valid: false, message: 'Code not found' });
    }

    const data = doc.data();
    if (!data?.isActive) {
      return res.json({ valid: false, message: 'Code is inactive' });
    }

    res.json({ valid: true, code: data });
  } catch (error) {
    logger.error('Error validating referral code:', error);
    next(error);
  }
};

// Register referral
export const registerReferral = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code, newUserId } = req.body;

    if (!code || !newUserId) {
      return res.status(400).json({ error: 'Code and newUserId are required' });
    }

    // Get referral code
    const codeDoc = await db.collection('referralCodes').doc(code).get();
    if (!codeDoc.exists) {
      return res.status(404).json({ error: 'Code not found' });
    }

    const codeData = codeDoc.data();
    const referrerId = codeData?.userId;

    // Don't allow self-referral
    if (referrerId === newUserId) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    // Get user data
    const [referrerDoc, referredDoc] = await Promise.all([
      db.collection('users').doc(referrerId).get(),
      db.collection('users').doc(newUserId).get(),
    ]);

    // Create referral
    const referralData = {
      referrerId,
      referrerName: referrerDoc.data()?.name || 'Unknown',
      referrerEmail: referrerDoc.data()?.email || '',
      referredUserId: newUserId,
      referredUserName: referredDoc.data()?.name || 'Unknown',
      referredUserEmail: referredDoc.data()?.email || '',
      createdAt: new Date().toISOString(),
      status: 'pending',
      orderValue: 0,
      commission: 0,
      commissionPaid: false,
    };

    const referralRef = await db.collection('referrals').add(referralData);

    // Update referral code stats
    await db.collection('referralCodes').doc(code).update({
      totalReferrals: (codeData?.totalReferrals || 0) + 1,
    });

    res.status(201).json({ 
      success: true, 
      referralId: referralRef.id,
      referral: referralData 
    });
  } catch (error) {
    logger.error('Error registering referral:', error);
    next(error);
  }
};

// Get user's referrals
export const getUserReferrals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.collection('referrals')
      .where('referrerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const referrals = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ referrals });
  } catch (error) {
    logger.error('Error getting user referrals:', error);
    next(error);
  }
};

// Get referral stats
export const getReferralStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.collection('referrals')
      .where('referrerId', '==', userId)
      .get();

    let totalReferrals = 0;
    let completedReferrals = 0;
    let totalEarnings = 0;
    let pendingEarnings = 0;

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      totalReferrals++;
      if (data.status === 'completed') {
        completedReferrals++;
        totalEarnings += data.commission || 0;
        if (!data.commissionPaid) {
          pendingEarnings += data.commission || 0;
        }
      }
    });

    res.json({
      totalReferrals,
      completedReferrals,
      totalEarnings,
      pendingEarnings,
    });
  } catch (error) {
    logger.error('Error getting referral stats:', error);
    next(error);
  }
};

// Process commission
export const processCommission = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, orderValue } = req.body;

    if (!userId || !orderValue) {
      return res.status(400).json({ error: 'userId and orderValue are required' });
    }

    // Get settings
    const settingsDoc = await db.collection('settings').doc('referral').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {
      commissionRate: 10,
      minOrderValue: 500,
      maxCommission: 500,
    };

    // Ensure settings has required fields
    const commissionRate = settings?.commissionRate || 10;
    const minOrderValue = settings?.minOrderValue || 500;
    const maxCommission = settings?.maxCommission || 500;

    // Check min order value
    if (orderValue < minOrderValue) {
      return res.json({ 
        processed: false, 
        message: 'Order value below minimum' 
      });
    }

    // Find pending referral for this user
    const snapshot = await db.collection('referrals')
      .where('referredUserId', '==', userId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ 
        processed: false, 
        message: 'No pending referral found' 
      });
    }

    const referralDoc = snapshot.docs[0];
    const referral = referralDoc.data();

    // Calculate commission
    let commission = orderValue * (commissionRate / 100);
    if (commission > maxCommission) {
      commission = maxCommission;
    }

    // Update referral
    await referralDoc.ref.update({
      status: 'completed',
      orderValue,
      commission,
      completedAt: new Date().toISOString(),
    });

    // Update referrer's total earnings
    const codeSnapshot = await db.collection('referralCodes')
      .where('userId', '==', referral.referrerId)
      .limit(1)
      .get();

    if (!codeSnapshot.empty) {
      const codeDoc = codeSnapshot.docs[0];
      const currentEarnings = codeDoc.data().totalEarnings || 0;
      await codeDoc.ref.update({
        totalEarnings: currentEarnings + commission,
      });
    }

    res.json({ 
      processed: true, 
      commission,
      referralId: referralDoc.id 
    });
  } catch (error) {
    logger.error('Error processing commission:', error);
    next(error);
  }
};

// Get all referrals (admin)
export const getAllReferrals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const snapshot = await db.collection('referrals')
      .orderBy('createdAt', 'desc')
      .get();

    const referrals = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ referrals });
  } catch (error) {
    logger.error('Error getting all referrals:', error);
    next(error);
  }
};

// Mark commission as paid (admin)
export const markAsPaid = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    await db.collection('referrals').doc(id).update({
      commissionPaid: true,
      paidAt: new Date().toISOString(),
    });

    // Create transaction record
    const referralDoc = await db.collection('referrals').doc(id).get();
    const referralData = referralDoc.data();

    await db.collection('referralTransactions').add({
      referralId: id,
      referrerId: referralData?.referrerId,
      amount: referralData?.commission,
      paidAt: new Date().toISOString(),
      paidBy: req.user?.uid,
    });

    res.json({ success: true, message: 'Marked as paid' });
  } catch (error) {
    logger.error('Error marking as paid:', error);
    next(error);
  }
};

// Get settings
export const getSettings = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await db.collection('settings').doc('referral').get();
    
    const settings = doc.exists ? doc.data() : {
      commissionRate: 10,
      minOrderValue: 500,
      maxCommission: 500,
    };

    res.json({ settings });
  } catch (error) {
    logger.error('Error getting settings:', error);
    next(error);
  }
};

// Update settings (admin)
export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { commissionRate, minOrderValue, maxCommission } = req.body;

    await db.collection('settings').doc('referral').set({
      commissionRate: commissionRate || 10,
      minOrderValue: minOrderValue || 500,
      maxCommission: maxCommission || 500,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid,
    }, { merge: true });

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    logger.error('Error updating settings:', error);
    next(error);
  }
};
