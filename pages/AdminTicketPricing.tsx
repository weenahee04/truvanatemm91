import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  DollarSign, Save, Plus, Trash2, Edit2, CheckCircle, AlertTriangle,
  BarChart3, Home, Settings, Camera, HardDrive, MapPin, Ticket, Users, Wallet,
  ChevronRight, Image, CreditCard, Calendar, Percent, Tag, TrendingUp,
  Clock, Globe, Calculator, Info, ScanLine, Award, Package, LogOut, Loader2, FileText, RefreshCw, Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import { 
  getLottoPricing, 
  saveLottoPricing, 
  LottoPricingSettings,
  LottoProductPricing,
  BundlePackagePricing
} from '../services/lottoPricingService';
import { getRealtimeExchangeRate } from '../services/exchangeRateService';
import { auth } from '../config/firebase';
import { canEditTicketPricing, normalizeRole } from '../utils/rbac';
import { canSeeAdminNavPath } from '../utils/adminNav';

// Sidebar Menu Items
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
      { name: 'คำสั่งซื้อหวย', icon: Ticket, path: '/admin/lotto-orders', badge: '12' },
      { name: 'รูปตั๋ว (Google Photos)', icon: Camera, path: '/admin/photo-upload', badge: null },
      { name: 'รูปตั๋ว (Google Drive)', icon: HardDrive, path: '/admin/drive-photos', badge: null },
      { name: 'OCR สแกนตั๋ว', icon: ScanLine, path: '/admin/ocr-scanner', badge: 'New' },
    ]
  },
  {
    title: 'จัดการระบบ',
    items: [
      { name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: '3' },
      { name: 'Seller Management', icon: Package, path: '/admin/sellers', badge: null },
      { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null },
      { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null },
      { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null },
      { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null },
      { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null },
    ]
  },
  {
    title: 'ตั้งค่า',
    items: [
      { name: 'Hero & Banners', icon: Image, path: '/admin', badge: null },
      { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null },
      { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null, isActive: true },
      { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null },
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
    ]
  }
];

interface LottoProduct {
  id: string;
  name: string;
  nameTH: string;
  logo: string;
  pricePerLine: number; // USD
  serviceFee: number; // USD
  minLines: number;
  maxLines: number;
  drawDays: string[];
  jackpotEstimate: string;
  enabled: boolean;
  popular: boolean;
  promotionDiscount: number; // percent
  promotionEndDate: string | null;
}

interface BundlePackage {
  id: string;
  name: string;
  lottoId: string;
  lines: number;
  originalPrice: number;
  discountPrice: number;
  savings: number;
  badge: string | null;
  enabled: boolean;
}

export const AdminTicketPricing: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, showToast, user } = useGlobal();
  const canEdit = canEditTicketPricing(user?.role);
  const roleLabel = normalizeRole(user?.role);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  // Realtime exchange rate state
  const [realtimeRate, setRealtimeRate] = useState<{
    baseRate: number;
    finalRate: number;
    marginTHB: number;
    lastUpdated: string;
  } | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  
  // Margin in THB
  const [marginTHB, setMarginTHB] = useState(0);

  // สินค้าพิเศษ Products
  const [lottoProducts, setLottoProducts] = useState<LottoProduct[]>([]);
  
  // Bundle Packages
  const [bundles, setBundles] = useState<BundlePackage[]>([]);
  
  // Service Fee Settings
  const [feeSettings, setFeeSettings] = useState({
    baseServiceFee: 3.00,
    expressProcessingFee: 5.00,
    subscriptionDiscount: 15,
    firstTimeDiscount: 20,
    referralDiscount: 10,
  });

  // Load pricing from Firestore on mount
  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      setIsLoading(true);
      const pricing = await getLottoPricing();
      setLottoProducts(pricing.products);
      setBundles(pricing.bundles);
      setMarginTHB(pricing.marginTHB || 0);
      setFeeSettings(pricing.feeSettings);
      
      // Load realtime rate after settings are loaded
      await loadRealtimeRate(pricing.marginTHB || 0);
    } catch (error) {
      console.error('Error loading pricing:', error);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลราคา', 'error');
      // Use default values if load fails - fallback to hardcoded defaults
      setLottoProducts([
        {
          id: 'powerball',
          name: 'Powerball',
          nameTH: 'พาวเวอร์บอล',
          logo: '🔴',
          pricePerLine: 5.00,
          serviceFee: 0.00,
          minLines: 1,
          maxLines: 50,
          drawDays: ['Monday', 'Wednesday', 'Saturday'],
          jackpotEstimate: '$500 Million',
          enabled: true,
          popular: true,
          promotionDiscount: 0,
          promotionEndDate: null,
        },
        {
          id: 'megamillions',
          name: 'Mega Millions',
          nameTH: 'เมกามิลเลียนส์',
          logo: '🟡',
          pricePerLine: 11.00,
          serviceFee: 0.00,
          minLines: 1,
          maxLines: 50,
          drawDays: ['Tuesday', 'Friday'],
          jackpotEstimate: '$350 Million',
          enabled: true,
          popular: true,
          promotionDiscount: 10,
          promotionEndDate: '2025-12-31',
        },
      ]);
      setBundles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load realtime exchange rate
  const loadRealtimeRate = async (margin?: number) => {
    setIsLoadingRate(true);
    try {
      const rateData = await getRealtimeExchangeRate();
      
      if (rateData) {
        // Use margin parameter or marginTHB state
        const currentMargin = margin !== undefined ? margin : marginTHB;
        // finalRate already includes margin from API, but we calculate it here for display
        const finalRateWithMargin = rateData.baseRate + currentMargin;
        
        setRealtimeRate({
          baseRate: rateData.baseRate,
          finalRate: finalRateWithMargin,
          marginTHB: currentMargin,
          lastUpdated: rateData.lastUpdated,
        });
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      // Keep previous rate or set to null
      setRealtimeRate(null);
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Calculate THB using realtime rate + margin
  const calculateTHB = (usd: number) => {
    if (!realtimeRate?.finalRate) {
      return '0.00';
    }
    return (usd * realtimeRate.finalRate).toFixed(2);
  };

  const updateProduct = (id: string, field: keyof LottoProduct, value: any) => {
    setLottoProducts(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
    setIsSaved(false);
  };

  const addBundle = () => {
    const newBundle: BundlePackage = {
      id: `bundle-${Date.now()}`,
      name: 'New Bundle',
      lottoId: 'powerball',
      lines: 3,
      originalPrice: 15.00,
      discountPrice: 13.50,
      savings: 10,
      badge: null,
      enabled: true,
    };
    setBundles(prev => [...prev, newBundle]);
    setIsSaved(false);
  };

  const removeBundle = (id: string) => {
    if (window.confirm('ต้องการลบ Bundle นี้หรือไม่?')) {
      setBundles(prev => prev.filter(b => b.id !== id));
      setIsSaved(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      showToast('สิทธิ์ไม่เพียงพอ: เฉพาะ Super Admin เท่านั้นที่แก้ไขหน้านี้ได้', 'error');
      return;
    }
    try {
      setIsSaving(true);
      const userId = auth.currentUser?.uid || user?.id;
      
      const pricingSettings: LottoPricingSettings = {
        products: lottoProducts,
        bundles: bundles,
        marginTHB: marginTHB,
        feeSettings: feeSettings,
      };

      await saveLottoPricing(pricingSettings, userId);
      
      setIsSaved(true);
      showToast('บันทึกข้อมูลราคาสำเร็จ', 'success');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving pricing:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      logout(); // Call GlobalContext logout
      navigate('/admin/login');
      showToast('ออกจากระบบสำเร็จ', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
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

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"
          >
            <ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors w-full"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span className="text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Ticket className="text-brand-gold" size={28} />
                  ตั้งราคาตั๋ว สินค้าพิเศษ
                </h1>
                <p className="text-sm text-slate-500 mt-1">จัดการราคาและโปรโมชั่นตั๋วหวยต่างประเทศ</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Realtime Exchange Rate (Read-only) */}
                {realtimeRate ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <Globe size={16} className="text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Realtime:</span>
                    <span className="text-sm font-bold text-green-900">
                      1 USD = {realtimeRate.baseRate.toFixed(4)} THB
                      {realtimeRate.marginTHB > 0 && (
                        <span className="text-xs text-green-600 ml-1">
                          (+{realtimeRate.marginTHB.toFixed(2)} THB = {realtimeRate.finalRate.toFixed(4)})
                        </span>
                      )}
                    </span>
                    <button
                      onClick={loadRealtimeRate}
                      disabled={isLoadingRate}
                      className="ml-2 p-1 hover:bg-green-100 rounded disabled:opacity-50"
                      title="รีเฟรชอัตราแลกเปลี่ยน"
                    >
                      <RefreshCw size={14} className={`text-green-600 ${isLoadingRate ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                    <Globe size={16} className="text-slate-500" />
                    <span className="text-sm text-slate-600">Loading rate...</span>
                  </div>
                )}
                
                {/* Margin Input */}
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <Tag size={16} className="text-blue-600" />
                  <span className="text-xs text-blue-700 font-medium">Margin:</span>
                <input
                    type="number"
                    value={isNaN(marginTHB) ? '' : marginTHB}
                    onChange={(e) => {
                      const value = e.target.value;
                      const margin = value === '' ? 0 : (parseFloat(value) || 0);
                      setMarginTHB(margin);
                      setIsSaved(false);
                      // Update realtime rate display if available
                      if (realtimeRate) {
                        setRealtimeRate(prev => prev ? {
                          ...prev,
                          marginTHB: margin,
                          finalRate: prev.baseRate + margin,
                        } : null);
                      }
                    }}
                    step="0.01"
                    min="0"
                    className="w-24 bg-white border border-blue-300 rounded px-2 py-1 text-sm font-bold text-center"
                    disabled={!canEdit}
                  />
                  <span className="text-xs text-blue-700">THB</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {!canEdit && (
                    <span className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                      View only ({roleLabel})
                    </span>
                  )}
                  <Button onClick={handleSave} className="gap-2 shadow-lg" disabled={!canEdit || isSaved || isSaving || isLoading}>
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {isSaving ? 'กำลังบันทึก...' : isSaved ? 'บันทึกแล้ว!' : 'บันทึก'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Ticket className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">สินค้าที่เปิดขาย</p>
                  <p className="text-xl font-black text-slate-900">
                    {lottoProducts.filter(p => p.enabled).length} / {lottoProducts.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Bundles ที่เปิด</p>
                  <p className="text-xl font-black text-slate-900">
                    {bundles.filter(b => b.enabled).length} / {bundles.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Percent className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">โปรโมชั่นใช้งาน</p>
                  <p className="text-xl font-black text-slate-900">
                    {lottoProducts.filter(p => p.promotionDiscount > 0).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">ค่าบริการเฉลี่ย</p>
                  <p className="text-xl font-black text-slate-900">
                    ${feeSettings.baseServiceFee.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* สินค้าพิเศษ Products */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="text-red-500" size={20} />
                สินค้าพิเศษ ต่างประเทศ
              </h2>
              <p className="text-sm text-slate-500 mt-1">ตั้งราคา ค่าบริการ และโปรโมชั่น</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">สินค้า</th>
                    <th className="px-4 py-4">ราคา/Line (USD)</th>
                    <th className="px-4 py-4">ราคา (THB)</th>
                    <th className="px-4 py-4">ค่าบริการ</th>
                    <th className="px-4 py-4">Min-Max Lines</th>
                    <th className="px-4 py-4">โปรโมชั่น</th>
                    <th className="px-4 py-4">สถานะ</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lottoProducts.map((product) => (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${!product.enabled ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{product.logo}</span>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {product.name}
                              {product.popular && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">🔥 Popular</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{product.nameTH}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              {product.drawDays.join(', ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          value={product.pricePerLine}
                          onChange={(e) => updateProduct(product.id, 'pricePerLine', parseFloat(e.target.value))}
                          step="0.01"
                          className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-mono text-center"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-green-600">
                          ฿{calculateTHB(product.pricePerLine)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          value={product.serviceFee}
                          onChange={(e) => updateProduct(product.id, 'serviceFee', parseFloat(e.target.value))}
                          step="0.01"
                          className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-mono text-center"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={product.minLines}
                            onChange={(e) => updateProduct(product.id, 'minLines', parseInt(e.target.value))}
                            className="w-12 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-center"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="number"
                            value={product.maxLines}
                            onChange={(e) => updateProduct(product.id, 'maxLines', parseInt(e.target.value))}
                            className="w-12 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-center"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={product.promotionDiscount}
                            onChange={(e) => updateProduct(product.id, 'promotionDiscount', parseInt(e.target.value))}
                            className="w-14 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-center"
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                        {product.promotionDiscount > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            ลด {product.promotionDiscount}%
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => updateProduct(product.id, 'enabled', !product.enabled)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            product.enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {product.enabled ? 'เปิด' : 'ปิด'}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateProduct(product.id, 'popular', !product.popular)}
                            className={`p-1.5 rounded-lg ${
                              product.popular
                                ? 'bg-red-100 text-red-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                            title="Popular"
                          >
                            <TrendingUp size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bundle Packages */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="text-purple-500" size={20} />
                  Bundle Packages
                </h2>
                <p className="text-sm text-slate-500 mt-1">แพ็คเกจราคาพิเศษ</p>
              </div>
              <Button size="sm" onClick={addBundle} className="gap-2">
                <Plus size={16} /> เพิ่ม Bundle
              </Button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bundles.map((bundle) => {
                const lotto = lottoProducts.find(p => p.id === bundle.lottoId);
                return (
                  <div key={bundle.id} className={`border rounded-xl p-4 relative ${
                    bundle.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}>
                    {bundle.badge && (
                      <span className="absolute -top-2 -right-2 text-xs px-2 py-1 bg-red-500 text-white rounded-full font-bold">
                        {bundle.badge}
                      </span>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{lotto?.logo || '🎫'}</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={bundle.name}
                          onChange={(e) => {
                            setBundles(prev => prev.map(b => 
                              b.id === bundle.id ? { ...b, name: e.target.value } : b
                            ));
                          }}
                          className="font-bold text-slate-900 bg-transparent border-none outline-none w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-slate-500">Lines</label>
                        <input
                          type="number"
                          value={bundle.lines}
                          onChange={(e) => {
                            setBundles(prev => prev.map(b => 
                              b.id === bundle.id ? { ...b, lines: parseInt(e.target.value) } : b
                            ));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">สินค้าพิเศษ</label>
                        <select
                          value={bundle.lottoId}
                          onChange={(e) => {
                            setBundles(prev => prev.map(b => 
                              b.id === bundle.id ? { ...b, lottoId: e.target.value } : b
                            ));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm"
                        >
                          {lottoProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-slate-500">ราคาเต็ม ($)</label>
                        <input
                          type="number"
                          value={bundle.originalPrice}
                          onChange={(e) => {
                            setBundles(prev => prev.map(b => 
                              b.id === bundle.id ? { ...b, originalPrice: parseFloat(e.target.value) } : b
                            ));
                          }}
                          step="0.01"
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm line-through text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">ราคาขาย ($)</label>
                        <input
                          type="number"
                          value={bundle.discountPrice}
                          onChange={(e) => {
                            setBundles(prev => prev.map(b => 
                              b.id === bundle.id ? { ...b, discountPrice: parseFloat(e.target.value) } : b
                            ));
                          }}
                          step="0.01"
                          className="w-full bg-green-50 border border-green-200 rounded px-2 py-1 text-sm font-bold text-green-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          ประหยัด {bundle.savings}%
                        </span>
                        <span className="text-xs text-slate-500">
                          ≈ ฿{calculateTHB(bundle.discountPrice)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setBundles(prev => prev.map(b => 
                              b.id === bundle.id ? { ...b, enabled: !b.enabled } : b
                            ));
                          }}
                          className={`p-1.5 rounded ${
                            bundle.enabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => removeBundle(bundle.id)}
                          className="p-1.5 rounded bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fee Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <Calculator className="text-blue-500" size={20} />
                ค่าบริการและค่าธรรมเนียม
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ค่าบริการพื้นฐาน ($)</label>
                    <input
                      type="number"
                      value={feeSettings.baseServiceFee}
                      onChange={(e) => setFeeSettings(prev => ({ ...prev, baseServiceFee: parseFloat(e.target.value) }))}
                      step="0.01"
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ค่า Express Processing ($)</label>
                    <input
                      type="number"
                      value={feeSettings.expressProcessingFee}
                      onChange={(e) => setFeeSettings(prev => ({ ...prev, expressProcessingFee: parseFloat(e.target.value) }))}
                      step="0.01"
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <Percent className="text-green-500" size={20} />
                ส่วนลดอัตโนมัติ
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Subscription (%)</label>
                    <input
                      type="number"
                      value={feeSettings.subscriptionDiscount}
                      onChange={(e) => setFeeSettings(prev => ({ ...prev, subscriptionDiscount: parseInt(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ซื้อครั้งแรก (%)</label>
                    <input
                      type="number"
                      value={feeSettings.firstTimeDiscount}
                      onChange={(e) => setFeeSettings(prev => ({ ...prev, firstTimeDiscount: parseInt(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Referral (%)</label>
                    <input
                      type="number"
                      value={feeSettings.referralDiscount}
                      onChange={(e) => setFeeSettings(prev => ({ ...prev, referralDiscount: parseInt(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Calculator Preview */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Info className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">💰 ตัวอย่างราคาที่ลูกค้าจ่าย</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {lottoProducts.filter(p => p.enabled).slice(0, 3).map(product => {
                    const linesCount = 5;
                    const basePrice = product.pricePerLine * linesCount;
                    const serviceFee = product.serviceFee;
                    const discount = product.promotionDiscount > 0 ? (basePrice * product.promotionDiscount / 100) : 0;
                    const totalUSD = basePrice + serviceFee - discount;
                    const rate = realtimeRate?.finalRate || 0;
                    const totalTHB = rate > 0 ? totalUSD * rate : 0;
                    
                    return (
                      <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{product.logo}</span>
                          <span className="font-bold">{product.name}</span>
                          <span className="text-xs opacity-75">x{linesCount} lines</span>
                        </div>
                        <div className="text-sm opacity-90 space-y-1">
                          <div className="flex justify-between">
                            <span>ค่าตั๋ว:</span>
                            <span>${basePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ค่าบริการ:</span>
                            <span>${serviceFee.toFixed(2)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-green-200">
                              <span>ส่วนลด ({product.promotionDiscount}%):</span>
                              <span>-${discount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg border-t border-white/20 pt-2 mt-2">
                            <span>รวม:</span>
                            <span>฿{totalTHB.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminTicketPricing;
