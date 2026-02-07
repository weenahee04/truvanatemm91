import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== TYPES ====================

export interface MissionCondition {
  type: 'login' | 'total_spending' | 'referral_count' | 'order_count' | 'custom';
  threshold: number;
  period: 'daily' | 'weekly' | 'monthly' | 'lifetime';
}

export interface MissionReward {
  type: 'points' | 'coupon' | 'cashback' | 'lucky_draw_ticket';
  value: number;
  description: { th: string; en: string; zh: string };
}

export interface Mission {
  id: string;
  title: { th: string; en: string; zh: string };
  description: { th: string; en: string; zh: string };
  type: 'daily_login' | 'spending' | 'referral' | 'purchase_count' | 'custom';
  condition: MissionCondition;
  reward: MissionReward;
  isActive: boolean;
  priority: number;
  icon: string;
  startDate?: string;
  endDate?: string;
  maxClaims?: number;
  totalClaimed: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: string;
  claimedAt?: string;
  lastResetAt: string;
  createdAt: string;
}

// ==================== DEMO MISSIONS (fallback when Firestore is empty) ====================

const now = new Date().toISOString();

const DEMO_MISSIONS: Mission[] = [
  {
    id: 'demo_daily_login',
    title: { th: 'เช็คอินรายวัน', en: 'Daily Check-in', zh: '每日签到' },
    description: { th: 'เข้าสู่ระบบวันนี้เพื่อรับแต้มสะสม', en: 'Log in today to earn points', zh: '今天登录即可获得积分' },
    type: 'daily_login',
    condition: { type: 'login', threshold: 1, period: 'daily' },
    reward: { type: 'points', value: 10, description: { th: 'รับ 10 แต้ม', en: 'Earn 10 points', zh: '获得10积分' } },
    isActive: true, priority: 1, icon: '🔑', totalClaimed: 0, createdAt: now, updatedAt: now,
  },
  {
    id: 'demo_spending_5000',
    title: { th: 'ช้อปครบ 5,000 บาท', en: 'Spend ฿5,000', zh: '消费满฿5,000' },
    description: { th: 'ซื้อสินค้าสะสมครบ 5,000 บาท รับสิทธิ์ลุ้นรางวัล', en: 'Spend ฿5,000 to earn a lucky draw ticket', zh: '累计消费满฿5,000即可获得抽奖机会' },
    type: 'spending',
    condition: { type: 'total_spending', threshold: 5000, period: 'monthly' },
    reward: { type: 'lucky_draw_ticket', value: 1, description: { th: 'สิทธิ์ลุ้นรางวัล 1 สิทธิ์', en: '1 Lucky Draw Ticket', zh: '1次抽奖机会' } },
    isActive: true, priority: 2, icon: '💰', totalClaimed: 0, createdAt: now, updatedAt: now,
  },
  {
    id: 'demo_spending_10000',
    title: { th: 'ซื้อครบ 10,000 บาท', en: 'Spend ฿10,000', zh: '消费满฿10,000' },
    description: { th: 'ยอดซื้อสะสมตลอดกาลครบ 10,000 บาท รับคูปองส่วนลด', en: 'Lifetime spending of ฿10,000 earns a coupon', zh: '终身累计消费满฿10,000获得优惠券' },
    type: 'spending',
    condition: { type: 'total_spending', threshold: 10000, period: 'lifetime' },
    reward: { type: 'coupon', value: 500, description: { th: 'คูปองส่วนลด ฿500', en: '฿500 Discount Coupon', zh: '฿500折扣券' } },
    isActive: true, priority: 3, icon: '🎁', totalClaimed: 0, createdAt: now, updatedAt: now,
  },
  {
    id: 'demo_referral_5',
    title: { th: 'ชวนเพื่อนครบ 5 คน', en: 'Refer 5 Friends', zh: '邀请5位好友' },
    description: { th: 'แนะนำเพื่อนสมัครครบ 5 คน รับเงินคืน', en: 'Refer 5 friends to earn cashback', zh: '邀请5位好友注册获得返现' },
    type: 'referral',
    condition: { type: 'referral_count', threshold: 5, period: 'lifetime' },
    reward: { type: 'cashback', value: 200, description: { th: 'รับเงินคืน ฿200', en: '฿200 Cashback', zh: '获得฿200返现' } },
    isActive: true, priority: 4, icon: '👥', totalClaimed: 0, createdAt: now, updatedAt: now,
  },
  {
    id: 'demo_orders_3',
    title: { th: 'สั่งซื้อครบ 3 ครั้ง', en: 'Place 3 Orders', zh: '下单满3次' },
    description: { th: 'สั่งซื้อครบ 3 ครั้งในเดือนนี้ รับแต้มพิเศษ', en: 'Place 3 orders this month for bonus points', zh: '本月下单满3次获得额外积分' },
    type: 'purchase_count',
    condition: { type: 'order_count', threshold: 3, period: 'monthly' },
    reward: { type: 'points', value: 50, description: { th: 'รับ 50 แต้มพิเศษ', en: '50 Bonus Points', zh: '获得50额外积分' } },
    isActive: true, priority: 5, icon: '🛒', totalClaimed: 0, createdAt: now, updatedAt: now,
  },
];

// ==================== ADMIN: MISSION CRUD ====================

export const createMission = async (
  missionData: Omit<Mission, 'id' | 'totalClaimed' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'missions'), {
      ...missionData,
      totalClaimed: 0,
      createdAt: now,
      updatedAt: now
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating mission:', error);
    return { success: false, error: error.message };
  }
};

export const updateMission = async (
  missionId: string,
  updates: Partial<Mission>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const ref = doc(db, 'missions', missionId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating mission:', error);
    return { success: false, error: error.message };
  }
};

export const deleteMission = async (
  missionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await deleteDoc(doc(db, 'missions', missionId));
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting mission:', error);
    return { success: false, error: error.message };
  }
};

export const toggleMissionActive = async (
  missionId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> => {
  return updateMission(missionId, { isActive });
};

// ==================== FETCH MISSIONS ====================

export const getAllMissions = async (): Promise<Mission[]> => {
  try {
    let snapshot;
    try {
      const q = query(collection(db, 'missions'), orderBy('priority', 'asc'));
      snapshot = await getDocs(q);
    } catch {
      const fallbackQ = query(collection(db, 'missions'));
      snapshot = await getDocs(fallbackQ);
    }
    const results = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as Mission))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
    // Return demo missions if Firestore is empty
    return results.length > 0 ? results : DEMO_MISSIONS;
  } catch (error) {
    console.error('Error fetching missions:', error);
    return DEMO_MISSIONS;
  }
};

export const getActiveMissions = async (): Promise<Mission[]> => {
  try {
    let snapshot;
    try {
      const q = query(
        collection(db, 'missions'),
        where('isActive', '==', true),
        orderBy('priority', 'asc')
      );
      snapshot = await getDocs(q);
    } catch (indexError) {
      console.warn('Composite index not available, falling back:', indexError);
      const fallbackQ = query(collection(db, 'missions'));
      snapshot = await getDocs(fallbackQ);
    }

    const nowStr = new Date().toISOString();

    const results = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as Mission))
      .filter(m => {
        if (!m.isActive) return false;
        if (m.startDate && m.startDate > nowStr) return false;
        if (m.endDate && m.endDate < nowStr) return false;
        if (m.maxClaims && m.totalClaimed >= m.maxClaims) return false;
        return true;
      })
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // Return demo missions if Firestore is empty
    return results.length > 0 ? results : DEMO_MISSIONS;
  } catch (error) {
    console.error('Error fetching active missions:', error);
    return DEMO_MISSIONS;
  }
};

// ==================== USER MISSION PROGRESS ====================

const getUserMissionDocId = (userId: string, missionId: string) =>
  `${userId}_${missionId}`;

export const getUserMissions = async (userId: string): Promise<UserMission[]> => {
  try {
    const q = query(
      collection(db, 'userMissions'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserMission));
  } catch (error) {
    console.error('Error fetching user missions:', error);
    return [];
  }
};

export const getOrCreateUserMission = async (
  userId: string,
  mission: Mission
): Promise<UserMission> => {
  const docId = getUserMissionDocId(userId, mission.id);
  const nowTs = new Date().toISOString();
  const defaultUserMission: UserMission = {
    id: docId, userId, missionId: mission.id,
    progress: 0, completed: false, claimed: false,
    lastResetAt: nowTs, createdAt: nowTs,
  };

  try {
    const ref = doc(db, 'userMissions', docId);
    const existing = await getDoc(ref);

    if (existing.exists()) {
      const data = existing.data() as UserMission;
      if (shouldReset(data, mission.condition.period)) {
        const resetData: Partial<UserMission> = {
          progress: 0, completed: false, claimed: false,
          completedAt: undefined, claimedAt: undefined,
          lastResetAt: nowTs,
        };
        try { await updateDoc(ref, resetData); } catch { /* permission denied */ }
        return { ...data, ...resetData, id: docId };
      }
      return { ...data, id: docId };
    }

    // Create new user mission
    const newUserMission: Omit<UserMission, 'id'> = {
      userId, missionId: mission.id,
      progress: 0, completed: false, claimed: false,
      lastResetAt: nowTs, createdAt: nowTs,
    };

    try { await setDoc(ref, newUserMission); } catch { /* permission denied */ }
    return { ...newUserMission, id: docId };
  } catch (error) {
    console.warn('getOrCreateUserMission fallback for:', mission.id, error);
    return defaultUserMission;
  }
};

function shouldReset(userMission: UserMission, period: string): boolean {
  if (period === 'lifetime') return false;

  const lastReset = new Date(userMission.lastResetAt);
  const now = new Date();

  if (period === 'daily') {
    return lastReset.toDateString() !== now.toDateString();
  }

  if (period === 'weekly') {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return now.getTime() - lastReset.getTime() >= weekMs;
  }

  if (period === 'monthly') {
    return (
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear()
    );
  }

  return false;
}

// ==================== TRACKING PROGRESS ====================

export const updateMissionProgress = async (
  userId: string,
  missionId: string,
  newProgress: number
): Promise<{ success: boolean; completed?: boolean; error?: string }> => {
  try {
    const docId = getUserMissionDocId(userId, missionId);
    const ref = doc(db, 'userMissions', docId);
    const missionRef = doc(db, 'missions', missionId);

    const [userMissionSnap, missionSnap] = await Promise.all([
      getDoc(ref),
      getDoc(missionRef)
    ]);

    if (!missionSnap.exists()) return { success: false, error: 'Mission not found' };
    const mission = missionSnap.data() as Mission;

    if (!userMissionSnap.exists()) {
      // Auto-create
      await getOrCreateUserMission(userId, { ...mission, id: missionId });
    }

    const completed = newProgress >= mission.condition.threshold;
    const updates: any = {
      progress: newProgress
    };

    if (completed) {
      updates.completed = true;
      updates.completedAt = new Date().toISOString();
    }

    await updateDoc(ref, updates);
    return { success: true, completed };
  } catch (error: any) {
    console.error('Error updating mission progress:', error);
    return { success: false, error: error.message };
  }
};

export const incrementMissionProgress = async (
  userId: string,
  missionId: string,
  incrementBy: number = 1
): Promise<{ success: boolean; completed?: boolean; error?: string }> => {
  try {
    const docId = getUserMissionDocId(userId, missionId);
    const ref = doc(db, 'userMissions', docId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { success: false, error: 'User mission not found' };

    const current = snap.data() as UserMission;
    if (current.completed && current.claimed) {
      return { success: true, completed: true }; // Already done
    }

    const newProgress = current.progress + incrementBy;
    return updateMissionProgress(userId, missionId, newProgress);
  } catch (error: any) {
    console.error('Error incrementing mission progress:', error);
    return { success: false, error: error.message };
  }
};

// ==================== CLAIM REWARD ====================

export const claimMissionReward = async (
  userId: string,
  missionId: string
): Promise<{ success: boolean; reward?: MissionReward; error?: string }> => {
  try {
    const docId = getUserMissionDocId(userId, missionId);
    const ref = doc(db, 'userMissions', docId);
    const missionRef = doc(db, 'missions', missionId);

    const [userMissionSnap, missionSnap] = await Promise.all([
      getDoc(ref),
      getDoc(missionRef)
    ]);

    if (!userMissionSnap.exists()) return { success: false, error: 'Mission progress not found' };
    if (!missionSnap.exists()) return { success: false, error: 'Mission not found' };

    const userMission = userMissionSnap.data() as UserMission;
    const mission = missionSnap.data() as Mission;

    if (!userMission.completed) return { success: false, error: 'Mission not completed' };
    if (userMission.claimed) return { success: false, error: 'Reward already claimed' };

    // Check max claims
    if (mission.maxClaims && mission.totalClaimed >= mission.maxClaims) {
      return { success: false, error: 'Maximum claims reached' };
    }

    // Mark as claimed
    await updateDoc(ref, {
      claimed: true,
      claimedAt: new Date().toISOString()
    });

    // Increment total claimed on mission
    await updateDoc(missionRef, {
      totalClaimed: (mission.totalClaimed || 0) + 1
    });

    // TODO: Actually distribute reward (points, coupon, etc.)
    // This would integrate with a points/wallet system

    return { success: true, reward: mission.reward };
  } catch (error: any) {
    console.error('Error claiming reward:', error);
    return { success: false, error: error.message };
  }
};

// ==================== HELPER: GET MISSIONS WITH USER PROGRESS ====================

export interface MissionWithProgress extends Mission {
  userProgress: number;
  userCompleted: boolean;
  userClaimed: boolean;
}

export const getMissionsWithProgress = async (
  userId: string
): Promise<MissionWithProgress[]> => {
  try {
    const [missions, userMissions] = await Promise.all([
      getActiveMissions(),
      getUserMissions(userId)
    ]);

    const userMissionMap = new Map<string, UserMission>();
    userMissions.forEach(um => userMissionMap.set(um.missionId, um));

    const results: MissionWithProgress[] = [];

    for (const mission of missions) {
      const userMission = userMissionMap.get(mission.id);

      // Check if reset is needed for periodic missions
      let progress = 0;
      let completed = false;
      let claimed = false;

      if (userMission) {
        if (shouldReset(userMission, mission.condition.period)) {
          // Reset needed — will be handled on next getOrCreate
          progress = 0;
          completed = false;
          claimed = false;
        } else {
          progress = userMission.progress;
          completed = userMission.completed;
          claimed = userMission.claimed;
        }
      }

      results.push({
        ...mission,
        userProgress: progress,
        userCompleted: completed,
        userClaimed: claimed
      });
    }

    return results;
  } catch (error) {
    console.error('Error getting missions with progress:', error);
    return [];
  }
};
