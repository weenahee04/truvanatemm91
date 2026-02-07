import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Home, Ticket, Camera, HardDrive, ScanLine, Users, Package, Wallet, FileText, Award, MapPin, Shield, Image, CreditCard, DollarSign, TrendingUp, Settings, ChevronRight, LogOut, RefreshCw, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import { canSeeAdminNavPath } from '../utils/adminNav';
import { getExchangeRate, type ExchangeRateResponse } from '../services/exchangeRateService';

const MENU_SECTIONS = [
  { title: 'หลัก', items: [{ name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard', badge: null }, { name: 'กลับหน้าหลัก', icon: Home, path: '/', badge: null }] },
  { title: 'จัดการหวย', items: [{ name: 'คำสั่งซื้อหวย', icon: Ticket, path: '/admin/lotto-orders', badge: null }, { name: 'รูปตั๋ว (Google Photos)', icon: Camera, path: '/admin/photo-upload', badge: null }, { name: 'รูปตั๋ว (Google Drive)', icon: HardDrive, path: '/admin/drive-photos', badge: null }, { name: 'OCR สแกนตั๋ว', icon: ScanLine, path: '/admin/ocr-scanner', badge: 'New' }] },
  { title: 'จัดการระบบ', items: [{ name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: null }, { name: 'Seller Management', icon: Package, path: '/admin/sellers', badge: null }, { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null }, { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null }, { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null }, { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null }, { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null }] },
  { title: 'ตั้งค่า', items: [{ name: 'Hero & Banners', icon: Image, path: '/admin', badge: null }, { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null }, { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null }, { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null, isActive: true }, { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null }] },
];

const AdminExchangeRate: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, showToast } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExchangeRateResponse | null>(null);

  const load = async () => { setLoading(true); try { const d = await getExchangeRate(); setData(d); showToast?.('อัปเดตเรทสำเร็จ', 'success'); } catch (e: any) { console.error(e); showToast?.('โหลด Exchange Rate ไม่สำเร็จ', 'error'); setData(null); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleLogout = async () => { try { await authLogout(); logout(); navigate('/admin/login'); showToast?.('ออกจากระบบสำเร็จ', 'success'); } catch (error) { console.error('Logout error:', error); showToast?.('เกิดข้อผิดพลาดในการออกจากระบบ', 'error'); } };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
        <div className="p-6 border-b border-slate-800"><div className="flex items-center gap-3">{sidebarCollapsed ? <img src="/truvamate-logo.png" alt="Truvamate" className="h-10 w-auto" /> : <div className="flex items-center gap-3"><img src="/truvamate-logo.png" alt="Truvamate" className="h-8 w-auto" /><div><span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mt-1">Exchange Rate</span></div></div>}</div></div>
        <nav className="flex-1 py-4 overflow-y-auto">{MENU_SECTIONS.map((section, si) => { const visibleItems = section.items.filter(item => canSeeAdminNavPath(user?.role, item.path)); if (visibleItems.length === 0) return null; return (<div key={si} className="mb-6">{!sidebarCollapsed && <div className="px-6 mb-2"><span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{section.title}</span></div>}<div className="space-y-1 px-3">{visibleItems.map((item, ii) => { const isActive = (('isActive' in item) && Boolean((item as any).isActive)) || location.pathname === item.path; const Icon = item.icon as any; return <Link key={ii} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-brand-gold text-slate-900 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title={sidebarCollapsed ? item.name : undefined}><Icon size={20} className="shrink-0" />{!sidebarCollapsed && <span className="flex-1 text-sm">{item.name}</span>}</Link>; })}</div></div>); })}</nav>
        <div className="p-4 border-t border-slate-800 space-y-2"><button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"><ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />{!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}</button><button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors w-full"><LogOut size={18} />{!sidebarCollapsed && <span className="text-sm">ออกจากระบบ</span>}</button></div>
      </aside>
      <main className={`${sidebarCollapsed ? 'ml-20' : 'ml-72'} flex-1 transition-all duration-300`}>
        <div className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"><div><h1 className="text-2xl md:text-3xl font-black text-slate-900">Exchange Rate</h1><p className="text-slate-500 text-sm">ดูเรท USD → THB</p></div><Button onClick={load} className="gap-2" disabled={loading}><RefreshCw size={18} /> {loading ? 'กำลังโหลด...' : 'Refresh'}</Button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"><div className="text-xs font-bold text-slate-500 uppercase">Base rate</div><div className="text-3xl font-black text-slate-900 mt-2">{data ? data.baseRate.toFixed(3) : '-'}</div><div className="text-xs text-slate-500 mt-1">1 USD = X THB</div></div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"><div className="text-xs font-bold text-slate-500 uppercase">Margin (THB)</div><div className="text-3xl font-black text-slate-900 mt-2">{data ? data.marginTHB.toFixed(0) : '-'}</div><div className="text-xs text-slate-500 mt-1">บวกเพิ่มจากหน้าตั้งราคา</div></div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"><div className="text-xs font-bold text-slate-500 uppercase">Final rate</div><div className="text-3xl font-black text-slate-900 mt-2">{data ? data.finalRate.toFixed(3) : '-'}</div><div className="text-xs text-slate-500 mt-1">ใช้คูณ USD → THB</div></div>
          </div>
          <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5"><div className="flex items-start gap-3"><div className="p-2 bg-slate-100 rounded-lg"><Info size={18} className="text-slate-600" /></div><div className="text-sm text-slate-700"><div className="font-bold text-slate-900 mb-1">ข้อมูลล่าสุด</div><div><span className="text-slate-500">Updated:</span> {data?.lastUpdated || '-'}</div><div><span className="text-slate-500">Source:</span> {data?.source || '-'}</div></div></div></div>
        </div>
      </main>
    </div>
  );
};

export default AdminExchangeRate;
