import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Save,
  Target, Gift, Calendar, Users, ShoppingBag, LogIn, Star, Trophy
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  getAllMissions,
  createMission,
  updateMission,
  deleteMission,
  toggleMissionActive,
  Mission,
  MissionCondition,
  MissionReward
} from '../services/missionService';

const MISSION_TYPES = [
  { value: 'daily_login', icon: '🔑' },
  { value: 'spending', icon: '💰' },
  { value: 'referral', icon: '👥' },
  { value: 'purchase_count', icon: '🛒' },
  { value: 'custom', icon: '⭐' },
];

const CONDITION_TYPES = ['login', 'total_spending', 'referral_count', 'order_count', 'custom'];
const PERIODS = ['daily', 'weekly', 'monthly', 'lifetime'];
const REWARD_TYPES = ['points', 'coupon', 'cashback', 'lucky_draw_ticket'];

const DEFAULT_FORM: Omit<Mission, 'id' | 'totalClaimed' | 'createdAt' | 'updatedAt'> = {
  title: { th: '', en: '', zh: '' },
  description: { th: '', en: '', zh: '' },
  type: 'daily_login',
  condition: { type: 'login', threshold: 1, period: 'daily' },
  reward: {
    type: 'points',
    value: 10,
    description: { th: '', en: '', zh: '' }
  },
  isActive: true,
  priority: 0,
  icon: '🔑',
};

const AdminMissions: React.FC = () => {
  const { t } = useTranslation('missions');
  const { showToast } = useGlobal();
  const navigate = useNavigate();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    setLoading(true);
    const data = await getAllMissions();
    setMissions(data);
    setLoading(false);
  };

  const openCreateForm = () => {
    setForm({ ...DEFAULT_FORM });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (mission: Mission) => {
    setForm({
      title: { ...mission.title },
      description: { ...mission.description },
      type: mission.type,
      condition: { ...mission.condition },
      reward: {
        ...mission.reward,
        description: { ...mission.reward.description }
      },
      isActive: mission.isActive,
      priority: mission.priority,
      icon: mission.icon,
      startDate: mission.startDate,
      endDate: mission.endDate,
      maxClaims: mission.maxClaims,
    });
    setEditingId(mission.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const result = await updateMission(editingId, form);
        if (result.success) {
          showToast(t('admin.saveSuccess'), 'success');
        } else {
          showToast(result.error || t('admin.saveError'), 'error');
        }
      } else {
        const result = await createMission(form);
        if (result.success) {
          showToast(t('admin.saveSuccess'), 'success');
        } else {
          showToast(result.error || t('admin.saveError'), 'error');
        }
      }
      setShowForm(false);
      await loadMissions();
    } catch {
      showToast(t('admin.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.deleteConfirm'))) return;
    const result = await deleteMission(id);
    if (result.success) {
      showToast(t('admin.deleteSuccess'), 'success');
      await loadMissions();
    } else {
      showToast(result.error || t('admin.deleteError'), 'error');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await toggleMissionActive(id, !current);
    await loadMissions();
  };

  const updateForm = (path: string, value: any) => {
    setForm(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  // Auto-set condition type based on mission type
  const handleTypeChange = (type: string) => {
    const typeMap: Record<string, string> = {
      daily_login: 'login',
      spending: 'total_spending',
      referral: 'referral_count',
      purchase_count: 'order_count',
      custom: 'custom',
    };
    const iconMap: Record<string, string> = {
      daily_login: '🔑',
      spending: '💰',
      referral: '👥',
      purchase_count: '🛒',
      custom: '⭐',
    };
    updateForm('type', type);
    updateForm('condition.type', typeMap[type] || 'custom');
    updateForm('icon', iconMap[type] || '⭐');
    if (type === 'daily_login') {
      updateForm('condition.threshold', 1);
      updateForm('condition.period', 'daily');
    }
  };

  const seedMockupMissions = async () => {
    const now = new Date().toISOString();
    const mockups = [
      {
        title: { th: 'เช็คอินรายวัน', en: 'Daily Check-in', zh: '每日签到' },
        description: { th: 'เข้าสู่ระบบวันนี้เพื่อรับแต้มสะสม', en: 'Log in today to earn points', zh: '今天登录即可获得积分' },
        type: 'daily_login' as const,
        condition: { type: 'login' as const, threshold: 1, period: 'daily' as const },
        reward: { type: 'points' as const, value: 10, description: { th: 'รับ 10 แต้ม', en: 'Earn 10 points', zh: '获得10积分' } },
        isActive: true, priority: 1, icon: '🔑',
      },
      {
        title: { th: 'ช้อปครบ 5,000 บาท', en: 'Spend ฿5,000', zh: '消费满฿5,000' },
        description: { th: 'ซื้อสินค้าสะสมครบ 5,000 บาท รับสิทธิ์ลุ้นรางวัล', en: 'Spend ฿5,000 to earn a lucky draw ticket', zh: '累计消费满฿5,000即可获得抽奖机会' },
        type: 'spending' as const,
        condition: { type: 'total_spending' as const, threshold: 5000, period: 'monthly' as const },
        reward: { type: 'lucky_draw_ticket' as const, value: 1, description: { th: 'สิทธิ์ลุ้นรางวัล 1 สิทธิ์', en: '1 Lucky Draw Ticket', zh: '1次抽奖机会' } },
        isActive: true, priority: 2, icon: '💰',
      },
      {
        title: { th: 'ซื้อครบ 10,000 บาท', en: 'Spend ฿10,000', zh: '消费满฿10,000' },
        description: { th: 'ยอดซื้อสะสมตลอดกาลครบ 10,000 บาท รับคูปองส่วนลด', en: 'Lifetime spending of ฿10,000 earns a coupon', zh: '终身累计消费满฿10,000获得优惠券' },
        type: 'spending' as const,
        condition: { type: 'total_spending' as const, threshold: 10000, period: 'lifetime' as const },
        reward: { type: 'coupon' as const, value: 500, description: { th: 'คูปองส่วนลด ฿500', en: '฿500 Discount Coupon', zh: '฿500折扣券' } },
        isActive: true, priority: 3, icon: '🎁',
      },
      {
        title: { th: 'ชวนเพื่อนครบ 5 คน', en: 'Refer 5 Friends', zh: '邀请5位好友' },
        description: { th: 'แนะนำเพื่อนสมัครครบ 5 คน รับเงินคืน', en: 'Refer 5 friends to earn cashback', zh: '邀请5位好友注册获得返现' },
        type: 'referral' as const,
        condition: { type: 'referral_count' as const, threshold: 5, period: 'lifetime' as const },
        reward: { type: 'cashback' as const, value: 200, description: { th: 'รับเงินคืน ฿200', en: '฿200 Cashback', zh: '获得฿200返现' } },
        isActive: true, priority: 4, icon: '👥',
      },
      {
        title: { th: 'สั่งซื้อครบ 3 ครั้ง', en: 'Place 3 Orders', zh: '下单满3次' },
        description: { th: 'สั่งซื้อครบ 3 ครั้งในเดือนนี้ รับแต้มพิเศษ', en: 'Place 3 orders this month for bonus points', zh: '本月下单满3次获得额外积分' },
        type: 'purchase_count' as const,
        condition: { type: 'order_count' as const, threshold: 3, period: 'monthly' as const },
        reward: { type: 'points' as const, value: 50, description: { th: 'รับ 50 แต้มพิเศษ', en: '50 Bonus Points', zh: '获得50额外积分' } },
        isActive: true, priority: 5, icon: '🛒',
      },
    ];

    setSaving(true);
    try {
      for (const m of mockups) {
        await createMission(m);
      }
      showToast('เพิ่ม 5 กิจกรรมตัวอย่างสำเร็จ!', 'success');
      await loadMissions();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="text-amber-500" /> {t('admin.title')}
            </h1>
          </div>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus size={18} /> {t('admin.addMission')}
          </Button>
        </div>

        {/* Mission List */}
        {missions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Target size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="font-medium text-slate-500">{t('admin.noMissions')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('admin.noMissionsDesc')}</p>
            <button
              onClick={seedMockupMissions}
              disabled={saving}
              className="mt-6 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'กำลังเพิ่ม...' : '🎯 เพิ่ม 5 กิจกรรมตัวอย่าง'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {missions.map(mission => (
              <div
                key={mission.id}
                className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${
                  !mission.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-3xl">{mission.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{mission.title.th}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          mission.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {mission.isActive ? t('admin.active') : t('admin.inactive')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {t(mission.condition.period)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{mission.description.th}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Target size={14} />
                          {t(`conditionTypes.${mission.condition.type}`)}: {mission.condition.threshold.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift size={14} />
                          {t(`rewardTypes.${mission.reward.type}`)}: {mission.reward.value.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {t('admin.totalClaimed')}: {mission.totalClaimed || 0}
                          {mission.maxClaims ? ` / ${mission.maxClaims}` : ` (${t('admin.unlimited')})`}
                        </span>
                        {mission.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(mission.startDate).toLocaleDateString()} - {mission.endDate ? new Date(mission.endDate).toLocaleDateString() : '∞'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggle(mission.id, mission.isActive)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      title={mission.isActive ? t('admin.inactive') : t('admin.active')}
                    >
                      {mission.isActive
                        ? <ToggleRight size={24} className="text-green-500" />
                        : <ToggleLeft size={24} className="text-slate-400" />
                      }
                    </button>
                    <button
                      onClick={() => openEditForm(mission)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(mission.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? t('admin.editMission') : t('admin.addMission')}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Mission Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.missionType')}</label>
                <div className="grid grid-cols-5 gap-2">
                  {MISSION_TYPES.map(mt => (
                    <button
                      key={mt.value}
                      onClick={() => handleTypeChange(mt.value)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        form.type === mt.value
                          ? 'border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{mt.icon}</span>
                      <span className="text-xs text-slate-600">{t(`conditionTypes.${mt.value === 'daily_login' ? 'login' : mt.value === 'spending' ? 'total_spending' : mt.value === 'referral' ? 'referral_count' : mt.value === 'purchase_count' ? 'order_count' : 'custom'}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title (3 languages) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.missionTitle')}</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">TH</span>
                    <input type="text" value={form.title.th} onChange={e => updateForm('title.th', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="ชื่อกิจกรรม (ไทย)" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">EN</span>
                    <input type="text" value={form.title.en} onChange={e => updateForm('title.en', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="Mission title (English)" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">ZH</span>
                    <input type="text" value={form.title.zh} onChange={e => updateForm('title.zh', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="任务名称 (中文)" />
                  </div>
                </div>
              </div>

              {/* Description (3 languages) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.missionDesc')}</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">TH</span>
                    <input type="text" value={form.description.th} onChange={e => updateForm('description.th', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="คำอธิบาย (ไทย)" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">EN</span>
                    <input type="text" value={form.description.en} onChange={e => updateForm('description.en', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="Description (English)" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">ZH</span>
                    <input type="text" value={form.description.zh} onChange={e => updateForm('description.zh', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="描述 (中文)" />
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.threshold')}</label>
                  <input type="number" value={form.condition.threshold} onChange={e => updateForm('condition.threshold', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.period')}</label>
                  <select value={form.condition.period} onChange={e => updateForm('condition.period', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy bg-white">
                    {PERIODS.map(p => (
                      <option key={p} value={p}>{t(p)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reward */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.rewardType')}</label>
                  <select value={form.reward.type} onChange={e => updateForm('reward.type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy bg-white">
                    {REWARD_TYPES.map(r => (
                      <option key={r} value={r}>{t(`rewardTypes.${r}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.rewardValue')}</label>
                  <input type="number" value={form.reward.value} onChange={e => updateForm('reward.value', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" min={0} />
                </div>
              </div>

              {/* Reward Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.rewardDesc')}</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">TH</span>
                    <input type="text" value={form.reward.description.th} onChange={e => updateForm('reward.description.th', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="รับ 10 แต้ม" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">EN</span>
                    <input type="text" value={form.reward.description.en} onChange={e => updateForm('reward.description.en', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="Earn 10 points" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8 text-slate-400">ZH</span>
                    <input type="text" value={form.reward.description.zh} onChange={e => updateForm('reward.description.zh', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" placeholder="获得10积分" />
                  </div>
                </div>
              </div>

              {/* Priority, Dates, Max Claims */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.priority')}</label>
                  <input type="number" value={form.priority} onChange={e => updateForm('priority', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.startDate')}</label>
                  <input type="date" value={form.startDate ? form.startDate.split('T')[0] : ''} onChange={e => updateForm('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.endDate')}</label>
                  <input type="date" value={form.endDate ? form.endDate.split('T')[0] : ''} onChange={e => updateForm('endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.maxClaims')}</label>
                  <input type="number" value={form.maxClaims || ''} onChange={e => updateForm('maxClaims', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" min={0} placeholder={t('admin.maxClaimsHint')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('admin.icon')}</label>
                  <input type="text" value={form.icon} onChange={e => updateForm('icon', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy text-2xl text-center" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t('admin.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save size={18} />
                {saving ? t('admin.saving') : t('admin.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMissions;
