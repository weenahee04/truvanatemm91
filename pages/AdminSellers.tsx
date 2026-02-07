import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Home, Ticket, Camera, HardDrive, ScanLine, Users, Package, Wallet, FileText, Award, MapPin, Shield, Image, CreditCard, DollarSign, TrendingUp, Settings, ChevronRight, LogOut, Search, RefreshCw, Mail, Phone, CheckCircle, Ban } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import { canSeeAdminNavPath } from '../utils/adminNav';
import { getAllSellers } from '../services/adminService';

const MENU_SECTIONS = [
  { title: 'หลัก', items: [{ name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard', badge: null }, { name: 'กลับหน้าหลัก', icon: Home, path: '/', badge: null }] },
  { title: 'จัดการหวย', items: [{ name: 'คำสั่งซื้อหวย', icon: Ticket, path: '/admin/lotto-orders', badge: null }, { name: 'รูปตั๋ว (Google Photos)', icon: Camera, path: '/admin/photo-upload', badge: null }, { name: 'รูปตั๋ว (Google Drive)', icon: HardDrive, path: '/admin/drive-photos', badge: null }, { name: 'OCR สแกนตั๋ว', icon: ScanLine, path: '/admin/ocr-scanner', badge: 'New' }] },
  { title: 'จัดการระบบ', items: [{ name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: null }, { name: 'Seller Management', icon: Package, path: '/admin/sellers', badge: null, isActive: true }, { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null }, { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null }, { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null }, { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null }, { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null }] },
  { title: 'ตั้งค่า', items: [{ name: 'Hero & Banners', icon: Image, path: '/admin', badge: null }, { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null }, { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null }, { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null }, { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null }] },
];

type SellerRow = { id: string; name?: string; email?: string; phone?: string; status?: string; createdAt?: any; disabled?: boolean };
const toDateText = (v: any) => {
  try { if (!v) return '-'; const d = typeof v?.toDate === 'function' ? v.toDate() : typeof v === 'string' ? new Date(v) : v instanceof Date ? v : new Date(v); return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('th-TH'); } catch { return '-'; }
};

const AdminSellers: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, showToast } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const filtered = useMemo(() => { const q = queryText.trim().toLowerCase(); if (!q) return sellers; return sellers.filter(s => `${s.id} ${s.name || ''} ${s.email || ''} ${s.phone || ''}`.toLowerCase().includes(q)); }, [queryText, sellers]);

  const load = async () => {
    setLoading(true);
    try { const rows = await getAllSellers(); setSellers((rows || []).map((r: any) => ({ id: r.id, name: r.name || r.displayName || r.fullName, email: r.email, phone: r.phone || r.tel, status: r.status || (r.disabled ? 'disabled' : 'active'), createdAt: r.createdAt, disabled: Boolean(r.disabled) }))); } catch (e: any) { console.error(e); showToast?.('โหลดรายชื่อ seller ไม่สำเร็จ', 'error'); setSellers([]); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleLogout = async () => { try { await authLogout(); logout(); navigate('/admin/login'); showToast?.('ออกจากระบบสำเร็จ', 'success'); } catch (error) { console.error('Logout error:', error); showToast?.('เกิดข้อผิดพลาดในการออกจากระบบ', 'error'); } };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">{sidebarCollapsed ? <img src="/truvamate-logo.png" alt="Truvamate" className="h-10 w-auto" /> : <div className="flex items-center gap-3"><img src="/truvamate-logo.png" alt="Truvamate" className="h-8 w-auto" /><div><span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mt-1">Seller Management</span></div></div>}</div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">{MENU_SECTIONS.map((section, si) => { const visibleItems = section.items.filter(item => canSeeAdminNavPath(user?.role, item.path)); if (visibleItems.length === 0) return null; return (<div key={si} className="mb-6">{!sidebarCollapsed && <div className="px-6 mb-2"><span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{section.title}</span></div>}<div className="space-y-1 px-3">{visibleItems.map((item, ii) => { const isActive = (('isActive' in item) && Boolean((item as any).isActive)) || location.pathname === item.path; const Icon = item.icon as any; return <Link key={ii} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-brand-gold text-slate-900 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title={sidebarCollapsed ? item.name : undefined}><Icon size={20} className="shrink-0" />{!sidebarCollapsed && <span className="flex-1 text-sm">{item.name}</span>}</Link>; })}</div></div>); })}</nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"><ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />{!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}</button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors w-full"><LogOut size={18} />{!sidebarCollapsed && <span className="text-sm">ออกจากระบบ</span>}</button>
        </div>
      </aside>
      <main className={`${sidebarCollapsed ? 'ml-20' : 'ml-72'} flex-1 transition-all duration-300`}>
        <div className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div><h1 className="text-2xl md:text-3xl font-black text-slate-900">Seller Management</h1><p className="text-slate-500 text-sm">ดูรายชื่อ Seller ในระบบ</p></div>
            <Button onClick={load} className="gap-2"><RefreshCw size={18} /> รีเฟรช</Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-3"><div className="p-2 bg-slate-100 rounded-lg"><Search size={18} className="text-slate-600" /></div><input value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="ค้นหา (ชื่อ / email / เบอร์ / uid)" className="flex-1 outline-none text-sm" /></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between"><div className="font-bold text-slate-900">รายชื่อ Seller</div><div className="text-xs text-slate-500">{loading ? 'กำลังโหลด...' : `${filtered.length} รายการ`}</div></div>
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-5 py-3 font-bold">Seller</th><th className="text-left px-5 py-3 font-bold">ติดต่อ</th><th className="text-left px-5 py-3 font-bold">สถานะ</th><th className="text-left px-5 py-3 font-bold">สร้างเมื่อ</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td className="px-5 py-6 text-slate-500" colSpan={4}>กำลังโหลด...</td></tr> : filtered.length === 0 ? <tr><td className="px-5 py-6 text-slate-500" colSpan={4}>ไม่พบ seller</td></tr> : filtered.map(s => (<tr key={s.id} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="font-bold text-slate-900">{s.name || '-'}</div><div className="text-xs text-slate-500">{s.id}</div></td><td className="px-5 py-4"><div className="flex flex-col gap-1"><div className="flex items-center gap-2 text-slate-700"><Mail size={14} className="text-slate-400" /><span>{s.email || '-'}</span></div><div className="flex items-center gap-2 text-slate-700"><Phone size={14} className="text-slate-400" /><span>{s.phone || '-'}</span></div></div></td><td className="px-5 py-4">{s.disabled || s.status === 'disabled' ? <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold"><Ban size={14} /> Disabled</span> : <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold"><CheckCircle size={14} /> Active</span>}</td><td className="px-5 py-4 text-slate-700">{toDateText(s.createdAt)}</td></tr>))}</tbody></table></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSellers;
