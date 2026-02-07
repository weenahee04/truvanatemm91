import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  getActiveMissions,
  getOrCreateUserMission,
  incrementMissionProgress,
  updateMissionProgress,
  Mission
} from './missionService';

// ==================== AUTO-TRACK: LOGIN ====================

export const trackDailyLogin = async (userId: string): Promise<void> => {
  try {
    const missions = await getActiveMissions();
    const loginMissions = missions.filter(
      m => m.type === 'daily_login' && m.condition.type === 'login'
    );

    for (const mission of loginMissions) {
      const userMission = await getOrCreateUserMission(userId, mission);
      if (!userMission.completed) {
        await updateMissionProgress(userId, mission.id, 1);
      }
    }
  } catch (error) {
    console.error('Error tracking daily login:', error);
  }
};

// ==================== AUTO-TRACK: SPENDING ====================

export const trackSpending = async (
  userId: string,
  orderAmount: number
): Promise<void> => {
  try {
    const missions = await getActiveMissions();
    const spendingMissions = missions.filter(
      m => m.type === 'spending' && m.condition.type === 'total_spending'
    );

    for (const mission of spendingMissions) {
      const userMission = await getOrCreateUserMission(userId, mission);
      if (!userMission.claimed) {
        let totalSpending = userMission.progress + orderAmount;

        // For lifetime missions, calculate total from orders if needed
        if (mission.condition.period === 'lifetime' && userMission.progress === 0) {
          totalSpending = await calculateTotalSpending(userId) + orderAmount;
        }

        await updateMissionProgress(userId, mission.id, totalSpending);
      }
    }
  } catch (error) {
    console.error('Error tracking spending:', error);
  }
};

// ==================== AUTO-TRACK: REFERRAL ====================

export const trackReferral = async (userId: string): Promise<void> => {
  try {
    const missions = await getActiveMissions();
    const referralMissions = missions.filter(
      m => m.type === 'referral' && m.condition.type === 'referral_count'
    );

    for (const mission of referralMissions) {
      const userMission = await getOrCreateUserMission(userId, mission);
      if (!userMission.claimed) {
        // Count actual referrals from Firestore
        const totalReferrals = await countUserReferrals(userId);
        await updateMissionProgress(userId, mission.id, totalReferrals);
      }
    }
  } catch (error) {
    console.error('Error tracking referral:', error);
  }
};

// ==================== AUTO-TRACK: ORDER COUNT ====================

export const trackOrderCount = async (userId: string): Promise<void> => {
  try {
    const missions = await getActiveMissions();
    const orderMissions = missions.filter(
      m => m.type === 'purchase_count' && m.condition.type === 'order_count'
    );

    for (const mission of orderMissions) {
      const userMission = await getOrCreateUserMission(userId, mission);
      if (!userMission.claimed) {
        await incrementMissionProgress(userId, mission.id, 1);
      }
    }
  } catch (error) {
    console.error('Error tracking order count:', error);
  }
};

// ==================== AUTO-TRACK ALL (on login) ====================

export const trackAllMissionsOnLogin = async (userId: string): Promise<void> => {
  try {
    const missions = await getActiveMissions();

    for (const mission of missions) {
      // Ensure user mission record exists
      await getOrCreateUserMission(userId, mission);
    }

    // Track daily login
    await trackDailyLogin(userId);

    // Recalculate spending-based missions
    const spendingMissions = missions.filter(
      m => m.type === 'spending' && m.condition.type === 'total_spending'
    );
    if (spendingMissions.length > 0) {
      const totalSpending = await calculateTotalSpending(userId);
      for (const mission of spendingMissions) {
        const userMission = await getOrCreateUserMission(userId, mission);
        if (!userMission.claimed && totalSpending > userMission.progress) {
          await updateMissionProgress(userId, mission.id, totalSpending);
        }
      }
    }

    // Recalculate referral-based missions
    const referralMissions = missions.filter(
      m => m.type === 'referral' && m.condition.type === 'referral_count'
    );
    if (referralMissions.length > 0) {
      const totalReferrals = await countUserReferrals(userId);
      for (const mission of referralMissions) {
        const userMission = await getOrCreateUserMission(userId, mission);
        if (!userMission.claimed && totalReferrals > userMission.progress) {
          await updateMissionProgress(userId, mission.id, totalReferrals);
        }
      }
    }
  } catch (error) {
    console.error('Error tracking all missions on login:', error);
  }
};

// ==================== HELPERS ====================

async function calculateTotalSpending(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    let total = 0;
    snapshot.docs.forEach(d => {
      const data = d.data();
      const status = (data.status || '').toLowerCase();
      if (status !== 'cancelled' && status !== 'refunded') {
        total += data.total || data.totalAmount || data.amount || 0;
      }
    });
    return total;
  } catch (error) {
    console.error('Error calculating total spending:', error);
    return 0;
  }
}

async function countUserReferrals(userId: string): Promise<number> {
  try {
    // Check referralCodes collection for user's code
    const codeQuery = query(
      collection(db, 'referralCodes'),
      where('userId', '==', userId)
    );
    const codeSnap = await getDocs(codeQuery);
    if (codeSnap.empty) return 0;

    const codeDoc = codeSnap.docs[0];
    const code = codeDoc.data().code || codeDoc.id;

    // Count referrals using this code
    const refQuery = query(
      collection(db, 'referrals'),
      where('referrerCode', '==', code)
    );
    const refSnap = await getDocs(refQuery);
    return refSnap.size;
  } catch (error) {
    console.error('Error counting referrals:', error);
    return 0;
  }
}
