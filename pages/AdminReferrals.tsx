import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import {
  Users, DollarSign, TrendingUp, Settings, Download, Search, Filter,
  CheckCircle, Clock, XCircle, Calendar, Mail, User, ArrowUpDown,
  RefreshCw, Edit, Save, X, Gift, Award, AlertCircle, Home,
  BarChart3, ShoppingCart, Package, CreditCard, Image, ScanLine,
  LogOut, ChevronRight, Ticket, HardDrive, Camera, MapPin, Wallet, DollarSign as DollarSignIcon, FileText, Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  getAllReferrals,
  getReferralSettings,
  updateReferralSettings,
  markCommissionAsPaid,
  type Referral,
  type ReferralSettings
} from '../services/referralService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { normalizeRole } from '../utils/rbac';
import { canSeeAdminNavPath } from '../utils/adminNav';

// Sidebar Menu Items - Same as AdminDashboard
const MENU_SECTIONS = [
  {
    title: 'หลัก',
    items: [
      { name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard', badge: null },
      { name: 'กลับหน้าหลัก', icon: Home, path: '/', badge: null },
    ]
  },
  {
    title: 'จัดการหวย',
    items: [
      { name: 'คำสั่งซื้อหวย', icon: Ticket, path: '/admin/lotto-orders', badge: null },
      { name: 'รูปตั๋ว (Google Photos)', icon: Camera, path: '/admin/photo-upload', badge: null },
      { name: 'รูปตั๋ว (Google Drive)', icon: HardDrive, path: '/admin/drive-photos', badge: null },
      { name: 'OCR สแกนตั๋ว', icon: Image, path: '/admin/ocr-scanner', badge: 'New' },
    ]
  },
  {
    title: 'จัดการระบบ',
    items: [
      { name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: null },
      { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null },
      { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null },
      { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null, isActive: true },
      { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null },
      { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null },
    ]
  },
  {
    title: 'ตั้งค่า',
    items: [
      { name: 'Hero & Banners', icon: Image, path: '/admin', badge: null },
      { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null },
      { name: 'ตั้งราคาตั๋ว', icon: DollarSignIcon, path: '/admin/ticket-pricing', badge: null },
      { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null },
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
    ]
  }
];

export const AdminReferrals: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, showToast, logout } = useGlobal();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'commission'>('date');
  const [editingSettings, setEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<ReferralSettings | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole === 'super_admin' || userRole === 'admin') {
      loadData();
    }
  }, [userRole]);

  const checkUserRole = async () => {
    setCheckingAuth(true);
    try {
      // First check if user is logged in from context
      if (!user) {
        setUserRole(null);
        setCheckingAuth(false);
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setUserRole(null);
        setCheckingAuth(false);
        return;
      }

      const isAdminLevel = (raw: any) => {
        const r = normalizeRole(raw);
        return r === 'super_admin' || r === 'admin';
      };

      // Priority 1: Check from context user (most reliable after login)
      if (isAdminLevel(user?.role)) {
        setUserRole(normalizeRole(user?.role));
        setCheckingAuth(false);
        return;
      }

      // Priority 2: Check user role from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;

          if (isAdminLevel(role)) {
            setUserRole(normalizeRole(role));
            setCheckingAuth(false);
            return;
          }
        }
      } catch {
        // Firestore role read failed
      }

      // Priority 3: Check custom claims from ID token
      try {
        const idTokenResult = await currentUser.getIdTokenResult();
        const claims = idTokenResult.claims;

        if (isAdminLevel(claims.role)) {
          setUserRole(normalizeRole(claims.role));
          setCheckingAuth(false);
          return;
        }
      } catch {
        // ID token claims read failed
      }

      setUserRole(user?.role ? normalizeRole(user?.role) : null);
    } catch {
      // Final fallback to user from context
      setUserRole(user?.role ? normalizeRole(user?.role) : null);
    }
    setCheckingAuth(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [allReferrals, currentSettings] = await Promise.all([
        getAllReferrals(),
        getReferralSettings(),
      ]);

      setReferrals(allReferrals);
      setSettings(currentSettings);
      setTempSettings(currentSettings);
    } catch {
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    }
    setLoading(false);
  };

  const handleMarkAsPaid = async (referralId: string) => {
    try {
      await markCommissionAsPaid(referralId);
      showToast('อัพเดทสถานะเรียบร้อย', 'success');
      await loadData();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleSaveSettings = async () => {
    if (!tempSettings) return;

    try {
      await updateReferralSettings(tempSettings);
      setSettings(tempSettings);
      setEditingSettings(false);
      showToast('บันทึกการตั้งค่าแล้ว', 'success');
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const filteredReferrals = referrals
    .filter((ref) => {
      const matchesSearch =
        ref.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.referredUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.referrerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.referredUserEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && !ref.commissionPaid) ||
        (statusFilter === 'completed' && ref.commissionPaid);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return b.commission - a.commission;
      }
    });

  const stats = {
    total: referrals.length,
    completed: referrals.filter((r) => r.commissionPaid).length,
    pending: referrals.filter((r) => !r.commissionPaid).length,
    totalCommission: referrals.reduce((sum, r) => sum + r.commission, 0),
    paidCommission: referrals.filter((r) => r.commissionPaid).reduce((sum, r) => sum + r.commission, 0),
    pendingCommission: referrals.filter((r) => !r.commissionPaid).reduce((sum, r) => sum + r.commission, 0),
  };

  const exportToCSV = () => {
    const headers = ['วันที่', 'ผู้แนะนำ', 'อีเมล', 'เพื่อน', 'อีเมล', 'ค่าคอมมิชชั่น', 'สถานะ'];
    const rows = filteredReferrals.map((ref) => [
      new Date(ref.createdAt).toLocaleDateString('th-TH'),
      ref.referrerName,
      ref.referrerEmail,
      ref.referredUserName,
      ref.referredUserEmail,
      ref.commission,
      ref.commissionPaid ? 'จ่ายแล้ว' : 'รอจ่าย',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // Allow admin-level roles (Super Admin / Admin)
  const isAdmin = (() => {
    const a = normalizeRole(userRole);
    const b = normalizeRole(user?.role);
    return a === 'super_admin' || a === 'admin' || b === 'super_admin' || b === 'admin';
  })();

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <p className="text-sm text-slate-500 mb-4">กรุณา login ด้วยบัญชี Admin</p>
          <div className="text-xs text-slate-400 mb-4 space-y-1">
            <p>Current userRole: {userRole || 'none'}</p>
            <p>Context user.role: {user?.role || 'none'}</p>
            <p>User ID: {auth.currentUser?.uid || 'none'}</p>
          </div>
          <Link to="/admin/login">
            <Button>ไปหน้า Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await authLogout();
      logout();
      navigate('/admin/login');
      showToast('ออกจากระบบสำเร็จ', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-gold rounded-lg flex items-center justify-center font-black text-slate-900 text-lg">
                T
              </div>
            </div>
          </div>
        </aside>
        <main className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300 flex items-center justify-center`}>
          <RefreshCw className="animate-spin text-brand-gold" size={32} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      
      {/* Sidebar - Fixed Left (Same as AdminDashboard) */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {sidebarCollapsed ? (
              <img 
                src="/truvamate-logo.png" 
                alt="Truvamate" 
                className="h-10 w-auto"
              />
            ) : (
              <div className="flex items-center gap-3">
                <img 
                  src="/truvamate-logo.png" 
                  alt="Truvamate" 
                  className="h-8 w-auto"
                />
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mt-1">Admin Panel</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Menu Sections */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU_SECTIONS.map((section, sectionIndex) => {
            const visibleItems = section.items.filter(item => canSeeAdminNavPath(user?.role, item.path));
            if (visibleItems.length === 0) return null;
            return (
            <div key={sectionIndex} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-6 mb-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{section.title}</span>
                </div>
              )}
              <div className="space-y-1 px-3">
                {visibleItems.map((item, itemIndex) => {
                  const isActive = item.isActive || location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={itemIndex}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-brand-gold text-slate-900 font-bold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <Icon size={20} className="shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-sm">{item.name}</span>
                          {item.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.badge === 'New' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"
          >
            <ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full mt-2"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-black text-slate-900 mb-2">จัดการโปรแกรมแนะนำเพื่อน</h1>
            <p className="text-slate-600">Admin Referral Management</p>
          </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Users className="text-blue-500" size={24} />
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Total
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500 mt-1">Referrals ทั้งหมด</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Paid
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">฿{stats.paidCommission.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1">จ่ายแล้ว ({stats.completed})</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="text-orange-500" size={24} />
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900">฿{stats.pendingCommission.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1">รอจ่าย ({stats.pending})</p>
              </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="text-purple-500" size={24} />
                  ตั้งค่าโปรแกรม
                </h2>
                {!editingSettings && (
                  <Button onClick={() => setEditingSettings(true)} variant="outline" size="sm">
                    <Edit size={16} />
                    แก้ไข
                  </Button>
                )}
              </div>

              {editingSettings && tempSettings ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        value={tempSettings.commissionRate}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, commissionRate: parseFloat(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Min Order Value (฿)
                      </label>
                      <input
                        type="number"
                        value={tempSettings.minOrderValue}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, minOrderValue: parseFloat(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Max Commission (฿)
                      </label>
                      <input
                        type="number"
                        value={tempSettings.maxCommission}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, maxCommission: parseFloat(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700">
                      <Save size={16} />
                      บันทึก
                    </Button>
                    <Button onClick={() => {
                      setEditingSettings(false);
                      setTempSettings(settings);
                    }} variant="outline">
                      <X size={16} />
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Award className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900">{settings?.commissionRate}%</p>
                      <p className="text-sm text-slate-500">Commission Rate</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900">฿{settings?.minOrderValue}</p>
                      <p className="text-sm text-slate-500">Min Order</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900">฿{settings?.maxCommission}</p>
                      <p className="text-sm text-slate-500">Max Commission</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Referrals Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Referrals ({filteredReferrals.length})</h2>
                  <div className="flex gap-2">
                    <Button onClick={loadData} variant="outline" size="sm">
                      <RefreshCw size={16} />
                    </Button>
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                      <Download size={16} />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ, อีเมล..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="pending">รอจ่าย</option>
                    <option value="completed">จ่ายแล้ว</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="date">วันที่</option>
                    <option value="commission">ค่าคอมมิชชั่น</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">วันที่</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">ผู้แนะนำ</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">เพื่อนที่แนะนำ</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">ค่าคอมมิชชั่น</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">สถานะ</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredReferrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar size={14} />
                            {new Date(referral.createdAt).toLocaleDateString('th-TH')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{referral.referrerName}</p>
                            <p className="text-sm text-slate-500">{referral.referrerEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{referral.referredUserName}</p>
                            <p className="text-sm text-slate-500">{referral.referredUserEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">฿{referral.commission.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          {referral.commissionPaid ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                              <CheckCircle size={14} />
                              จ่ายแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                              <Clock size={14} />
                              รอจ่าย
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!referral.commissionPaid && (
                            <Button
                              onClick={() => handleMarkAsPaid(referral.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle size={14} />
                              จ่ายเงิน
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredReferrals.length === 0 && (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">ไม่พบข้อมูล</p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReferrals;
