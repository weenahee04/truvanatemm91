import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { Link } from 'react-router-dom';
import { Gift, Target, CheckCircle2, Trophy, Sparkles, ChevronRight, LogIn } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  getMissionsWithProgress,
  claimMissionReward,
  getOrCreateUserMission,
  createMission,
  MissionWithProgress
} from '../services/missionService';

const DailyMissions: React.FC = () => {
  const { t, i18n } = useTranslation('missions');
  const { user, showToast } = useGlobal();
  const lang = (i18n.language || 'th') as 'th' | 'en' | 'zh';

  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const seedMockupMissions = async () => {
    setSeeding(true);
    try {
      const mockups = [
        {
          title: { th: 'เช็คอินรายวัน', en: 'Daily Check-in', zh: '每日签到' },
          description: { th: 'เข้าสู่ระบบวันนี้เพื่อรับแต้มสะสม', en: 'Log in today to earn points', zh: '今天登录即可获得积分' },
          type: 'daily_login' as const, condition: { type: 'login' as const, threshold: 1, period: 'daily' as const },
          reward: { type: 'points' as const, value: 10, description: { th: 'รับ 10 แต้ม', en: 'Earn 10 points', zh: '获得10积分' } },
          isActive: true, priority: 1, icon: '🔑',
        },
        {
          title: { th: 'ช้อปครบ 5,000 บาท', en: 'Spend ฿5,000', zh: '消费满฿5,000' },
          description: { th: 'ซื้อสินค้าสะสมครบ 5,000 บาท', en: 'Spend ฿5,000 to earn a lucky draw ticket', zh: '累计消费满฿5,000即可获得抽奖机会' },
          type: 'spending' as const, condition: { type: 'total_spending' as const, threshold: 5000, period: 'monthly' as const },
          reward: { type: 'lucky_draw_ticket' as const, value: 1, description: { th: 'สิทธิ์ลุ้นรางวัล 1 สิทธิ์', en: '1 Lucky Draw Ticket', zh: '1次抽奖机会' } },
          isActive: true, priority: 2, icon: '💰',
        },
        {
          title: { th: 'ซื้อครบ 10,000 บาท', en: 'Spend ฿10,000', zh: '消费满฿10,000' },
          description: { th: 'ยอดซื้อสะสมตลอดกาลครบ 10,000 บาท', en: 'Lifetime spending of ฿10,000 earns a coupon', zh: '终身累计消费满฿10,000获得优惠券' },
          type: 'spending' as const, condition: { type: 'total_spending' as const, threshold: 10000, period: 'lifetime' as const },
          reward: { type: 'coupon' as const, value: 500, description: { th: 'คูปองส่วนลด ฿500', en: '฿500 Discount Coupon', zh: '฿500折扣券' } },
          isActive: true, priority: 3, icon: '🎁',
        },
        {
          title: { th: 'ชวนเพื่อนครบ 5 คน', en: 'Refer 5 Friends', zh: '邀请5位好友' },
          description: { th: 'แนะนำเพื่อนสมัครครบ 5 คน', en: 'Refer 5 friends to earn cashback', zh: '邀请5位好友注册获得返现' },
          type: 'referral' as const, condition: { type: 'referral_count' as const, threshold: 5, period: 'lifetime' as const },
          reward: { type: 'cashback' as const, value: 200, description: { th: 'รับเงินคืน ฿200', en: '฿200 Cashback', zh: '获得฿200返现' } },
          isActive: true, priority: 4, icon: '👥',
        },
        {
          title: { th: 'สั่งซื้อครบ 3 ครั้ง', en: 'Place 3 Orders', zh: '下单满3次' },
          description: { th: 'สั่งซื้อครบ 3 ครั้งในเดือนนี้', en: 'Place 3 orders this month for bonus points', zh: '本月下单满3次获得额外积分' },
          type: 'purchase_count' as const, condition: { type: 'order_count' as const, threshold: 3, period: 'monthly' as const },
          reward: { type: 'points' as const, value: 50, description: { th: 'รับ 50 แต้มพิเศษ', en: '50 Bonus Points', zh: '获得50额外积分' } },
          isActive: true, priority: 5, icon: '🛒',
        },
      ];
      for (const m of mockups) {
        await createMission(m);
      }
      showToast(t('admin.seedSuccess', { defaultValue: 'เพิ่ม 5 กิจกรรมตัวอย่างสำเร็จ!' }), 'success');
      await loadMissions();
    } catch {
      showToast(t('loadError'), 'error');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadMissions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadMissions = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getMissionsWithProgress(user.id);
      // Ensure user mission records exist
      for (const mission of data) {
        await getOrCreateUserMission(user.id, mission);
      }
      // Reload after ensuring records
      const refreshed = await getMissionsWithProgress(user.id);
      setMissions(refreshed);
    } catch (error) {
      console.error('Error loading missions:', error);
      showToast(t('loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (missionId: string) => {
    if (!user?.id) return;
    setClaimingId(missionId);
    try {
      const result = await claimMissionReward(user.id, missionId);
      if (result.success) {
        showToast(t('claimSuccess'), 'success');
        await loadMissions();
      } else {
        showToast(result.error || t('claimError'), 'error');
      }
    } catch {
      showToast(t('claimError'), 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const getProgressPercent = (mission: MissionWithProgress) => {
    return Math.min(100, (mission.userProgress / mission.condition.threshold) * 100);
  };

  const formatProgress = (mission: MissionWithProgress) => {
    const current = mission.condition.type === 'total_spending'
      ? `฿${mission.userProgress.toLocaleString()}`
      : mission.userProgress.toLocaleString();
    const target = mission.condition.type === 'total_spending'
      ? `฿${mission.condition.threshold.toLocaleString()}`
      : mission.condition.threshold.toLocaleString();
    return `${current} / ${target}`;
  };

  const getRewardLabel = (mission: MissionWithProgress) => {
    const desc = mission.reward.description[lang] || mission.reward.description.th;
    if (desc) return desc;
    return `${mission.reward.value} ${t(`rewardTypes.${mission.reward.type}`)}`;
  };

  const getPeriodColor = (period: string) => {
    switch (period) {
      case 'daily': return 'bg-blue-100 text-blue-700';
      case 'weekly': return 'bg-purple-100 text-purple-700';
      case 'monthly': return 'bg-orange-100 text-orange-700';
      case 'lifetime': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Not logged in
  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Trophy size={64} className="mx-auto mb-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('pageTitle')}</h1>
          <p className="text-slate-500 mb-8">{t('pleaseLogin')}</p>
          <Link to="/login">
            <Button className="gap-2">
              <LogIn size={18} /> {t('login')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const dailyMissions = missions.filter(m => m.condition.period === 'daily');
  const otherMissions = missions.filter(m => m.condition.period !== 'daily');

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles size={16} /> {t('pageTitle')}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('pageDesc')}</h1>
        </div>

        {missions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <Target size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="font-medium text-slate-500">{t('noMissions')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('noMissionsDesc')}</p>
            {user?.role === 'super_admin' && (
              <button
                onClick={seedMockupMissions}
                disabled={seeding}
                className="mt-6 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {seeding ? 'กำลังเพิ่ม...' : '🎯 เพิ่ม 5 กิจกรรมตัวอย่าง'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Daily Missions */}
            {dailyMissions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Target size={20} className="text-blue-500" /> {t('todaysMissions')}
                </h2>
                <div className="space-y-3">
                  {dailyMissions.map(mission => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      lang={lang}
                      t={t}
                      claimingId={claimingId}
                      onClaim={handleClaim}
                      getProgressPercent={getProgressPercent}
                      formatProgress={formatProgress}
                      getRewardLabel={getRewardLabel}
                      getPeriodColor={getPeriodColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Missions */}
            {otherMissions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Trophy size={20} className="text-amber-500" /> {t('allMissions')}
                </h2>
                <div className="space-y-3">
                  {otherMissions.map(mission => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      lang={lang}
                      t={t}
                      claimingId={claimingId}
                      onClaim={handleClaim}
                      getProgressPercent={getProgressPercent}
                      formatProgress={formatProgress}
                      getRewardLabel={getRewardLabel}
                      getPeriodColor={getPeriodColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ==================== Mission Card Component ====================

interface MissionCardProps {
  mission: MissionWithProgress;
  lang: 'th' | 'en' | 'zh';
  t: (key: string) => string;
  claimingId: string | null;
  onClaim: (id: string) => void;
  getProgressPercent: (m: MissionWithProgress) => number;
  formatProgress: (m: MissionWithProgress) => string;
  getRewardLabel: (m: MissionWithProgress) => string;
  getPeriodColor: (p: string) => string;
}

const getIconBg = (type: string) => {
  switch (type) {
    case 'daily_login': return 'bg-blue-100';
    case 'spending': return 'bg-emerald-100';
    case 'referral': return 'bg-purple-100';
    case 'purchase_count': return 'bg-orange-100';
    default: return 'bg-amber-100';
  }
};

const MissionCard: React.FC<MissionCardProps> = ({
  mission, lang, t, claimingId, onClaim,
  getProgressPercent, formatProgress, getRewardLabel, getPeriodColor
}) => {
  const percent = getProgressPercent(mission);
  const isClaimed = mission.userClaimed;
  const isCompleted = mission.userCompleted;
  const isClaiming = claimingId === mission.id;

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
      isClaimed ? 'opacity-60' : ''
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${getIconBg(mission.type)}`}>
            {mission.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 text-sm truncate">
                {mission.title[lang] || mission.title.th}
              </h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${getPeriodColor(mission.condition.period)}`}>
                {t(mission.condition.period)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {mission.description[lang] || mission.description.th}
            </p>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">{t('progress')}</span>
                <span className="font-medium text-slate-700">{formatProgress(mission)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isClaimed ? 'bg-slate-300' :
                    isCompleted ? 'bg-green-500' :
                    mission.type === 'daily_login' ? 'bg-blue-400' :
                    mission.type === 'spending' ? 'bg-emerald-400' :
                    mission.type === 'referral' ? 'bg-purple-400' :
                    mission.type === 'purchase_count' ? 'bg-orange-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Reward + Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                <Gift size={14} className={
                  mission.type === 'daily_login' ? 'text-blue-500' :
                  mission.type === 'spending' ? 'text-emerald-500' :
                  mission.type === 'referral' ? 'text-purple-500' :
                  mission.type === 'purchase_count' ? 'text-orange-500' : 'text-amber-500'
                } />
                <span className="text-slate-600">{getRewardLabel(mission)}</span>
              </div>

              {isClaimed ? (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle2 size={14} /> {t('claimed')}
                </span>
              ) : isCompleted ? (
                <button
                  onClick={() => onClaim(mission.id)}
                  disabled={isClaiming}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-amber-500 hover:to-orange-600 transition-all disabled:opacity-50 animate-pulse"
                >
                  {isClaiming ? t('claiming') : t('claimReward')}
                </button>
              ) : (
                <span className="text-xs text-slate-400">
                  {Math.round(percent)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMissions;
