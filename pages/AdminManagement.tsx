import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Home, Ticket, Camera, HardDrive, ScanLine, Users, Package, Wallet, FileText,
  Award, MapPin, Shield, Image, CreditCard, DollarSign, TrendingUp, Settings, ChevronRight,
  LogOut, Save, UserPlus, Lock, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import { canSeeAdminNavPath } from '../utils/adminNav';
import { getAllUsers } from '../services/adminService';
import { adminUsersAPI } from '../services/api';

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Master Admin (เต็มสิทธิ์)' },
  { value: 'accounting', label: 'บัญชี (Accounting)' },
  { value: 'admin_limited', label: 'Admin (Order, OCR, ลูกค้า)' },
] as const;

const MENU_SECTIONS = [
  { title: 'หลัก', items: [{ name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard', badge: null }, { name: 'กลับหน้าหลัก', icon: Home, path: '/', badge: null }] },
  { title: 'จัดการหวย', items: [{ name: 'คำสั่งซื้อหวย', icon: Ticket, path: '/admin/lotto-orders', badge: null }, { name: 'รูปตั๋ว (Google Photos)', icon: Camera, path: '/admin/photo-upload', badge: null }, { name: 'รูปตั๋ว (Google Drive)', icon: HardDrive, path: '/admin/drive-photos', badge: null }, { name: 'OCR สแกนตั๋ว', icon: ScanLine, path: '/admin/ocr-scanner', badge: 'New' }] },
  { title: 'จัดการระบบ', items: [{ name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: null }, { name: 'Seller Management', icon: Package, path: '/admin/sellers', badge: null }, { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null }, { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null }, { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null }, { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null }, { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null, isActive: true }] },
  { title: 'ตั้งค่า', items: [{ name: 'Hero & Banners', icon: Image, path: '/admin', badge: null }, { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null }, { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null }, { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null }, { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null }] },
];

interface AdminUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

export const AdminManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, showToast } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<string, string>>({});
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteRole, setPromoteRole] = useState('admin_limited');
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [createRole, setCreateRole] = useState('admin_limited');
  const [createLoading, setCreateLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{ userId: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await authLogout();
      logout();
      navigate('/admin/login');
      showToast?.('ออกจากระบบสำเร็จ', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast?.('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      const list = (Array.isArray(users) ? users : []).map((u: any) => ({
        id: u.id || u.uid,
        email: u.email || '',
        name: u.name || u.displayName || u.email?.split('@')[0] || '-',
        role: (u.role || 'customer').toLowerCase(),
      }));
      setAllUsers(list);
      const admins = list.filter(
        (u) =>
          u.role === 'super_admin' ||
          u.role === 'accounting' ||
          u.role === 'admin_limited' ||
          u.role === 'admin'
      );
      setAdminUsers(admins);
      const drafts: Record<string, string> = {};
      admins.forEach((u) => {
        drafts[u.id] = u.role === 'admin' ? 'super_admin' : u.role;
      });
      setDraftRoles(drafts);
    } catch (e) {
      console.error('Error loading users:', e);
      showToast?.('โหลดข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await adminUsersAPI.getLogs();
      setLogs(res.data?.logs || []);
    } catch (e) {
      showToast?.('โหลด log ไม่สำเร็จ', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveRole = async (userId: string) => {
    const role = draftRoles[userId];
    if (!role) return;
    setSavingId(userId);
    try {
      await adminUsersAPI.updateUserRole(userId, role);
      showToast?.('อัปเดต role สำเร็จ', 'success');
      loadUsers();
    } catch (e: any) {
      showToast?.(e?.response?.data?.error || 'อัปเดตไม่สำเร็จ', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateAdmin = async () => {
    const email = createEmail.trim().toLowerCase();
    if (!email || !createPassword) {
      showToast?.('กรอกอีเมลและรหัสผ่าน', 'error');
      return;
    }
    if (createPassword.length < 6) {
      showToast?.('รหัสผ่านอย่างน้อย 6 ตัวอักษร', 'error');
      return;
    }
    setCreateLoading(true);
    try {
      await adminUsersAPI.createAdminUser({
        email,
        password: createPassword,
        name: createName.trim() || undefined,
        role: createRole,
      });
      showToast?.('สร้างบัญชีแอดมินสำเร็จ', 'success');
      setCreateEmail('');
      setCreatePassword('');
      setCreateName('');
      loadUsers();
    } catch (e: any) {
      showToast?.(e?.response?.data?.error || 'สร้างบัญชีไม่สำเร็จ', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordModal || !newPassword) return;
    if (newPassword.length < 6) {
      showToast?.('รหัสผ่านอย่างน้อย 6 ตัวอักษร', 'error');
      return;
    }
    setPasswordLoading(true);
    try {
      await adminUsersAPI.updateUserPassword(passwordModal.userId, newPassword);
      showToast?.('ตั้งรหัสผ่านใหม่สำเร็จ', 'success');
      setPasswordModal(null);
      setNewPassword('');
    } catch (e: any) {
      showToast?.(e?.response?.data?.error || 'ตั้งรหัสผ่านไม่สำเร็จ', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePromote = async () => {
    const email = promoteEmail.trim().toLowerCase();
    if (!email) {
      showToast?.('กรอกอีเมล', 'error');
      return;
    }
    const found = allUsers.find((u) => (u.email || '').toLowerCase() === email);
    if (!found) {
      showToast?.(`ไม่พบผู้ใช้ ${email}`, 'error');
      return;
    }
    setPromoteLoading(true);
    try {
      await adminUsersAPI.updateUserRole(found.id, promoteRole);
      showToast?.('กำหนด role สำเร็จ', 'success');
      setPromoteEmail('');
      loadUsers();
    } catch (e: any) {
      showToast?.(e?.response?.data?.error || 'กำหนด role ไม่สำเร็จ', 'error');
    } finally {
      setPromoteLoading(false);
    }
  };

  const roleLabel = (r: string) => {
    if (r === 'admin') return 'Master Admin (legacy)';
    const found = ADMIN_ROLES.find((x) => x.value === r);
    return found?.label || r;
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {sidebarCollapsed ? (
              <img src="/truvamate-logo.png" alt="Truvamate" className="h-10 w-auto" />
            ) : (
              <div className="flex items-center gap-3">
                <img src="/truvamate-logo.png" alt="Truvamate" className="h-8 w-auto" />
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mt-1">Admin management</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU_SECTIONS.map((section, si) => {
            const visibleItems = section.items.filter((item) => canSeeAdminNavPath(user?.role, item.path));
            if (visibleItems.length === 0) return null;
            return (
            <div key={si} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-6 mb-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{section.title}</span>
                </div>
              )}
              <div className="space-y-1 px-3">
                {visibleItems.map((item, ii) => {
                  const isActive = (('isActive' in item) && Boolean((item as any).isActive)) || location.pathname === item.path;
                  const Icon = item.icon as any;
                  return (
                    <Link
                      key={ii}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive ? 'bg-brand-gold text-slate-900 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <Icon size={20} className="shrink-0" />
                      {!sidebarCollapsed && <span className="flex-1 text-sm">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full">
            <ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors w-full">
            <LogOut size={18} />
            {!sidebarCollapsed && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      <main className={`${sidebarCollapsed ? 'ml-20' : 'ml-72'} flex-1 transition-all duration-300`}>
        <div className="p-6 md:p-10">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Admin management</h1>
          <p className="text-slate-500 text-sm mb-6">สร้างและจัดการบัญชีแอดมิน (Super Admin เท่านั้น)</p>

          {/* สร้างบัญชีแอดมินใหม่ */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus size={20} />
              สร้างบัญชีแอดมินใหม่
            </h2>
            <p className="text-slate-600 text-sm mb-4">สร้างบัญชีใหม่พร้อมกำหนดอีเมล รหัสผ่าน และ Role</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">รหัสผ่าน (6 ตัวขึ้นไป)</label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อ (ถ้ามี)</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="ชื่อ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                >
                  {ADMIN_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateAdmin}
                disabled={createLoading}
                className="px-4 py-2 bg-brand-gold text-slate-900 font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {createLoading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
              </button>
            </div>
          </div>

          {/* กำหนด Role ผู้ใช้ที่มีอยู่แล้ว */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus size={20} />
              กำหนด Role แอดมิน (ผู้ใช้ที่มีบัญชีแล้ว)
            </h2>
            <p className="text-slate-600 text-sm mb-4">ค้นหาผู้ใช้ที่มีบัญชีแล้ว แล้วกำหนด role เป็นแอดมิน</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                />
              </div>
              <div className="w-64">
                <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                <select
                  value={promoteRole}
                  onChange={(e) => setPromoteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                >
                  {ADMIN_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handlePromote}
                disabled={promoteLoading}
                className="px-4 py-2 bg-brand-gold text-slate-900 font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {promoteLoading ? 'กำลังบันทึก...' : 'กำหนด Role'}
              </button>
            </div>
          </div>

          {/* รายการแอดมิน */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield size={20} />
              รายการแอดมิน ({adminUsers.length})
            </h2>
            {loading ? (
              <p className="text-slate-500 py-8">กำลังโหลด...</p>
            ) : adminUsers.length === 0 ? (
              <p className="text-slate-500 py-8">ยังไม่มีบัญชีแอดมิน</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold text-slate-700">ชื่อ</th>
                      <th className="py-3 px-4 font-semibold text-slate-700">อีเมล</th>
                      <th className="py-3 px-4 font-semibold text-slate-700">Role ปัจจุบัน</th>
                      <th className="py-3 px-4 font-semibold text-slate-700">เปลี่ยน Role</th>
                      <th className="py-3 px-4 font-semibold text-slate-700">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{u.name}</td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-slate-100 rounded text-sm">{roleLabel(u.role)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={draftRoles[u.id] ?? u.role}
                            onChange={(e) => setDraftRoles((prev) => ({ ...prev, [u.id]: e.target.value }))}
                            className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-brand-gold"
                          >
                            {ADMIN_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleSaveRole(u.id)}
                              disabled={savingId === u.id}
                              className="px-3 py-1.5 bg-brand-gold text-slate-900 font-bold rounded text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Save size={14} />
                              {savingId === u.id ? 'บันทึก...' : 'บันทึก'}
                            </button>
                            <button
                              onClick={() => setPasswordModal({ userId: u.id, email: u.email || '' })}
                              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-100 flex items-center gap-1"
                              title="ตั้งรหัสผ่าน"
                            >
                              <Lock size={14} />
                              รหัสผ่าน
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Admin Logs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-6">
            <button
              onClick={() => { setLogsOpen(!logsOpen); if (!logsOpen) loadLogs(); }}
              className="flex items-center gap-2 text-lg font-bold text-slate-900 w-full"
            >
              <FileText size={20} />
              Log การใช้งาน Admin
              {logsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {logsOpen && (
              <div className="mt-4 overflow-x-auto">
                {logsLoading ? (
                  <p className="text-slate-500 py-4">กำลังโหลด...</p>
                ) : logs.length === 0 ? (
                  <p className="text-slate-500 py-4">ไม่มี log</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 px-3 text-left font-semibold text-slate-700">เวลา</th>
                        <th className="py-2 px-3 text-left font-semibold text-slate-700">ผู้ทำ</th>
                        <th className="py-2 px-3 text-left font-semibold text-slate-700">Action</th>
                        <th className="py-2 px-3 text-left font-semibold text-slate-700">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log: any, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 px-3 text-slate-600">{new Date(log.timestamp).toLocaleString('th-TH')}</td>
                          <td className="py-2 px-3">{log.adminEmail || log.adminUid}</td>
                          <td className="py-2 px-3">{log.action}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {log.targetEmail && `เป้าหมาย: ${log.targetEmail}`}
                            {log.details?.path && ` หน้า: ${log.details.path}`}
                            {log.details?.fromRole && ` ${log.details.fromRole}→${log.details.toRole}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal ตั้งรหัสผ่าน */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">ตั้งรหัสผ่านใหม่</h3>
              <button onClick={() => { setPasswordModal(null); setNewPassword(''); }} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-600 text-sm mb-4">{passwordModal.email}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่านใหม่ (6 ตัวขึ้นไป)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setPasswordModal(null); setNewPassword(''); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleResetPassword}
                disabled={passwordLoading || newPassword.length < 6}
                className="px-4 py-2 bg-brand-gold text-slate-900 font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {passwordLoading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
