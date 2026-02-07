import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Home, Ticket, Camera, HardDrive, ScanLine, Users, Package, Wallet, FileText,
  Award, MapPin, Shield, Image, CreditCard, DollarSign, TrendingUp, Settings, ChevronRight,
  LogOut, Search, Filter, Download, Receipt, FileCheck
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import { getAllOrders, getAllLottoOrders } from '../services/adminService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Button } from '../components/ui/Button';
import { billingAPI } from '../services/api';
import { canSeeAdminNavPath } from '../utils/adminNav';

const MENU_SECTIONS = [
  { title: 'หลัก', items: [{ name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard', badge: null }, { name: 'กลับหน้าหลัก', icon: Home, path: '/', badge: null }] },
  { title: 'จัดการหวย', items: [{ name: 'คำสั่งซื้อหวย', icon: Ticket, path: '/admin/lotto-orders', badge: null }, { name: 'รูปตั๋ว (Google Photos)', icon: Camera, path: '/admin/photo-upload', badge: null }, { name: 'รูปตั๋ว (Google Drive)', icon: HardDrive, path: '/admin/drive-photos', badge: null }, { name: 'OCR สแกนตั๋ว', icon: ScanLine, path: '/admin/ocr-scanner', badge: 'New' }] },
  { title: 'จัดการระบบ', items: [{ name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: null }, { name: 'Seller Management', icon: Package, path: '/admin/sellers', badge: null }, { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null }, { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null, isActive: true }, { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null }, { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null }, { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null }] },
  { title: 'ตั้งค่า', items: [{ name: 'Hero & Banners', icon: Image, path: '/admin', badge: null }, { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null }, { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null }, { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null }, { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null }] },
];

type BillingDocType = 'receipt' | 'invoice' | 'tax-invoice';

interface BillingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerAddress: string;
  customerTaxId?: string;
  date: string;
  amount: number;
  amountUSD: number;
  type: 'lotto' | 'marketplace';
  status: string;
  items: Array<{ description: string; quantity?: number; amountUSD: number; amountTHB: number }>;
}

const DOC_LABELS: Record<BillingDocType, string> = {
  receipt: 'ใบเสร็จ',
  invoice: 'ใบแจ้งหนี้',
  'tax-invoice': 'ใบกำกับภาษี'
};

const AdminBilling: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, showToast } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [generatingKey, setGeneratingKey] = useState<string | null>(null); // "orderId-docType"

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

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [marketplaceOrders, lottoOrders] = await Promise.all([
        getAllOrders(),
        getAllLottoOrders()
      ]);

      const userMap = new Map<string, { name?: string; address?: string; taxId?: string }>();
      const getUserInfo = async (userId: string) => {
        if (userMap.has(userId)) return userMap.get(userId)!;
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const d = userDoc.data();
            const info = {
              name: d.name || d.displayName || 'ไม่ระบุ',
              address: d.address || '',
              taxId: d.taxId || d.tax_id || d.taxNumber || ''
            };
            userMap.set(userId, info);
            return info;
          }
        } catch (_) {}
        return { name: 'ไม่ระบุ', address: '', taxId: '' };
      };

      const formatDate = (v: any): string => {
        if (!v) return new Date().toISOString();
        try {
          if (typeof v === 'string') return v;
          if (v?.toDate) return v.toDate().toISOString();
          return new Date(v).toISOString();
        } catch {
          return new Date().toISOString();
        }
      };

      const billingOrders: BillingOrder[] = [];

      for (const o of marketplaceOrders) {
        const info = o.userId ? await getUserInfo(o.userId) : { name: (o as any).customerName || 'ไม่ระบุ', address: (o as any).customerAddress || '', taxId: '' };
        const d = formatDate(o.date);
        const dateStr = d.replace('T', ' ').split('.')[0];
        const items = ((o as any).items || []).map((item: any) => ({
          description: item.name || item.title || item.productName || 'สินค้า',
          quantity: item.quantity || 1,
          amountUSD: item.price || item.amount || 0,
          amountTHB: (item.price || item.amount || 0) * ((o as any).exchangeRate || 35)
        }));
        if (items.length === 0 && (o as any).total) {
          items.push({
            description: 'คำสั่งซื้อ',
            quantity: 1,
            amountUSD: (o as any).total / ((o as any).exchangeRate || 35),
            amountTHB: (o as any).total
          });
        }
        billingOrders.push({
          id: `marketplace-${o.id}`,
          orderNumber: (o as any).orderNumber || (o as any).order_number || `ORD-${o.id.slice(0, 8)}`,
          customerName: info.name || 'ไม่ระบุ',
          customerAddress: info.address || '',
          customerTaxId: info.taxId,
          date: dateStr,
          amount: (o as any).total || 0,
          amountUSD: ((o as any).total || 0) / ((o as any).exchangeRate || 35),
          type: 'marketplace',
          status: (o as any).status || 'pending',
          items
        });
      }

      for (const o of lottoOrders) {
        const info = (o as any).userId ? await getUserInfo((o as any).userId) : { name: (o as any).customerName || 'ไม่ระบุ', address: (o as any).customerAddress || '', taxId: '' };
        const d = formatDate((o as any).createdAt || (o as any).date);
        const dateStr = d.replace('T', ' ').split('.')[0];
        const total = (o as any).total || (o as any).totalAmount || (o as any).totalAmountThb || 0;
        const rate = (o as any).exchangeRate || (o as any).exchange_rate || 35;
        const items = ((o as any).items || (o as any).tickets || []).map((item: any) => ({
          description: item.ticketNumber || item.numbers || 'ตั๋วหวย',
          quantity: 1,
          amountUSD: (item.price || 0) / rate,
          amountTHB: item.price || 0
        }));
        if (items.length === 0 && total) {
          items.push({
            description: 'คำสั่งซื้อหวย',
            quantity: 1,
            amountUSD: total / rate,
            amountTHB: total
          });
        }
        billingOrders.push({
          id: `lotto-${(o as any).id}`,
          orderNumber: (o as any).orderNumber || (o as any).order_number || `LTO-${String((o as any).id).slice(0, 8)}`,
          customerName: info.name || 'ไม่ระบุ',
          customerAddress: info.address || '',
          customerTaxId: info.taxId,
          date: dateStr,
          amount: total,
          amountUSD: total / rate,
          type: 'lotto',
          status: (o as any).status || 'pending',
          items
        });
      }

      billingOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(billingOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast?.('ไม่สามารถโหลดข้อมูลออเดอร์ได้', 'error');
    }
    setLoading(false);
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || o.type === filterType;
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const handleGeneratePDF = async (order: BillingOrder, docType: BillingDocType) => {
    const key = `${order.type}-${order.id}-${docType}`;
    setGeneratingKey(key);
    try {
      const res = await billingAPI.generatePDF({
        data: {
          documentNo: order.orderNumber,
          date: order.date.split(' ')[0],
          ref: order.orderNumber,
          customerName: order.customerName,
          customerAddress: order.customerAddress || '-',
          customerTaxId: order.customerTaxId,
          items: order.items.length ? order.items : [{ description: order.type === 'lotto' ? 'คำสั่งซื้อหวย' : 'คำสั่งซื้อ', quantity: 1, amountUSD: order.amountUSD, amountTHB: order.amount }],
          exchangeRate: order.amountUSD ? order.amount / order.amountUSD : 35
        },
        type: docType
      });
      const data = res.data as Blob | ArrayBuffer;
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
      if (blob.size === 0) {
        showToast?.(`ไม่สามารถสร้าง${DOC_LABELS[docType]}ได้ (ไฟล์ว่าง)`, 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${DOC_LABELS[docType]}-${order.orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast?.(`ดาวน์โหลด${DOC_LABELS[docType]}สำเร็จ`, 'success');
    } catch (err: any) {
      console.error('Generate PDF error:', err);
      let msg = `ไม่สามารถสร้าง${DOC_LABELS[docType]}ได้`;
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.error) msg = json.error;
        } catch (_) {}
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      showToast?.(msg, 'error');
    } finally {
      setGeneratingKey(null);
    }
  };

  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => ['paid', 'completed', 'purchased', 'scanned'].includes(o.status)).length;
  const totalAmount = orders.filter(o => ['paid', 'completed', 'purchased', 'scanned'].includes(o.status)).reduce((s, o) => s + o.amount, 0);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {sidebarCollapsed ? (
              <img src="/truvamate-logo.png" alt="Truvamate" className="h-10 w-auto" />
            ) : (
              <div className="flex items-center gap-3">
                <img src="/truvamate-logo.png" alt="Truvamate" className="h-8 w-auto" />
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mt-1">Billing</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU_SECTIONS.map((section, si) => {
            const visibleItems = section.items.filter(item => canSeeAdminNavPath(user?.role, item.path));
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
                  const isActive = (item as any).isActive || location.pathname === item.path;
                  const Icon = item.icon as any;
                  return (
                    <Link
                      key={ii}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-brand-gold text-slate-900 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
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
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors w-full">
            <LogOut size={18} />
            {!sidebarCollapsed && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="text-brand-gold" size={28} />
                  การออกบิล (Billing)
                </h1>
                <p className="text-sm text-slate-500 mt-1">ออกใบเสร็จ ใบแจ้งหนี้ ใบกำกับภาษี จากคำสั่งซื้อ</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download size={18} />
                Export
              </Button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ออเดอร์ทั้งหมด</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{totalOrders}</p>
                </div>
                <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FileCheck className="text-slate-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ชำระแล้ว</p>
                  <p className="text-3xl font-black text-green-600 mt-1">{paidOrders}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Receipt className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ยอดรวม (ชำระแล้ว)</p>
                  <p className="text-2xl font-black text-brand-gold mt-1">฿{totalAmount.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-brand-gold" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="ค้นหา Order, ชื่อลูกค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold appearance-none bg-white outline-none"
                >
                  <option value="all">ประเภททั้งหมด</option>
                  <option value="lotto">หวย</option>
                  <option value="marketplace">ตลาด</option>
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold appearance-none bg-white outline-none"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="pending">รอดำเนินการ</option>
                  <option value="paid">ชำระแล้ว</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="purchased">ซื้อแล้ว</option>
                  <option value="scanned">สแกนแล้ว</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-600 mt-4">กำลังโหลดข้อมูล...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto text-slate-300" size={48} />
                <p className="text-slate-500 mt-2">ไม่พบคำสั่งซื้อ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">Order</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">ลูกค้า</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">วันที่</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">ประเภท</th>
                      <th className="text-right px-6 py-4 text-sm font-bold text-slate-700">จำนวนเงิน</th>
                      <th className="text-center px-6 py-4 text-sm font-bold text-slate-700">สถานะ</th>
                      <th className="text-center px-6 py-4 text-sm font-bold text-slate-700">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-sm font-medium text-slate-900">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{order.customerName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{order.date.split(' ')[0]}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${order.type === 'lotto' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.type === 'lotto' ? 'หวย' : 'ตลาด'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-brand-gold">฿{order.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            ['paid','completed','purchased','scanned'].includes(order.status) ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2 justify-center">
                            {(['receipt', 'invoice', 'tax-invoice'] as BillingDocType[]).map((docType) => {
                              const genKey = `${order.type}-${order.id}-${docType}`;
                              const isGenerating = generatingKey === genKey;
                              return (
                                <Button
                                  key={docType}
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  disabled={!!generatingKey}
                                  onClick={() => handleGeneratePDF(order, docType)}
                                  type="button"
                                >
                                  {isGenerating ? (
                                    <span className="animate-spin">⏳</span>
                                  ) : (
                                    <Receipt size={14} />
                                  )}
                                  {DOC_LABELS[docType]}
                                </Button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminBilling;
