import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCard, DollarSign, Save, CheckCircle, AlertTriangle, Eye, EyeOff,
  BarChart3, Home, Settings, Camera, HardDrive, MapPin, Ticket, Users, Wallet,
  ChevronRight, Image, Zap, Globe, Shield, Bell, RefreshCw, Plus, Trash2, TrendingUp,
  Building2, Smartphone, QrCode, ArrowRight, ScanLine, Award, Package, LogOut, FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import { getPaymentSettings, savePaymentSettings, PaymentGatewayConfig } from '../services/paymentService';
import { getApiUrl } from '../services/api';
import { canEditPaymentSettings, normalizeRole } from '../utils/rbac';
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
      { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null, isActive: true },
      { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null },
      { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null },
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
    ]
  }
];

interface PaymentGateway {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  testMode: boolean;
  config: {
    publicKey: string;
    secretKey: string;
    webhookSecret?: string;
    merchantId?: string;
  };
  description: string;
  supportedMethods: string[];
}

export const AdminPaymentSettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, showToast, user } = useGlobal();
  const canEdit = canEditPaymentSettings(user?.role);
  const roleLabel = normalizeRole(user?.role);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Payment Gateways State
  const [gateways, setGateways] = useState<PaymentGateway[]>([
    {
      id: 'stripe',
      name: 'Stripe',
      icon: CreditCard,
      enabled: true,
      testMode: true,
      config: {
        publicKey: 'pk_test_xxxxxxxxxxxxxxxxxxxxx',
        secretKey: 'sk_test_xxxxxxxxxxxxxxxxxxxxx',
        webhookSecret: 'whsec_xxxxxxxxxxxxxxxxxxxxx',
      },
      description: 'รับชำระผ่านบัตรเครดิต/เดบิต ระดับสากล',
      supportedMethods: ['Visa', 'Mastercard', 'AMEX', 'JCB'],
    },
    {
      id: 'omise',
      name: 'Omise',
      icon: Building2,
      enabled: true,
      testMode: true,
      config: {
        publicKey: 'pkey_test_xxxxxxxxxxxxxxxxxxxxx',
        secretKey: 'skey_test_xxxxxxxxxxxxxxxxxxxxx',
      },
      description: 'Payment Gateway สำหรับประเทศไทย',
      supportedMethods: ['Credit Card', 'PromptPay', 'TrueMoney'],
    },
    {
      id: 'promptpay',
      name: 'PromptPay QR',
      icon: QrCode,
      enabled: true,
      testMode: false,
      config: {
        publicKey: '',
        secretKey: '',
        merchantId: '0812345678',
      },
      description: 'รับชำระผ่าน PromptPay QR Code',
      supportedMethods: ['PromptPay'],
    },
    {
      id: 'truemoney',
      name: 'TrueMoney Wallet',
      icon: Smartphone,
      enabled: false,
      testMode: true,
      config: {
        publicKey: '',
        secretKey: '',
        merchantId: '',
      },
      description: 'รับชำระผ่าน TrueMoney Wallet',
      supportedMethods: ['TrueMoney Wallet'],
    },
    {
      id: 'linepay',
      name: 'LINE Pay',
      icon: Zap,
      enabled: false,
      testMode: true,
      config: {
        publicKey: '',
        secretKey: '',
        merchantId: '',
      },
      description: 'รับชำระผ่าน LINE Pay',
      supportedMethods: ['LINE Pay'],
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Globe,
      enabled: false,
      testMode: true,
      config: {
        publicKey: '',
        secretKey: '',
      },
      description: 'รับชำระผ่าน PayPal (International)',
      supportedMethods: ['PayPal Balance', 'Credit Card'],
    },
  ]);

  // Bank Transfer Settings
  const [bankAccounts, setBankAccounts] = useState([
    { id: 1, bank: 'ธนาคารกสิกรไทย', accountNumber: '123-4-56789-0', accountName: 'บริษัท ทรูวาเมท จำกัด', enabled: true },
    { id: 2, bank: 'ธนาคารไทยพาณิชย์', accountNumber: '987-6-54321-0', accountName: 'บริษัท ทรูวาเมท จำกัด', enabled: true },
    { id: 3, bank: 'ธนาคารกรุงเทพ', accountNumber: '111-2-33333-4', accountName: 'บริษัท ทรูวาเมท จำกัด', enabled: false },
  ]);

  // Currency & Fee Settings
  const [currencySettings, setCurrencySettings] = useState({
    primaryCurrency: 'THB',
    exchangeRate: 35.50,
    autoUpdateRate: true,
    marginPercent: 0, // Profit margin percentage
    transactionFeePercent: 3.5,
    transactionFeeFixed: 10,
    minWithdrawal: 500,
    maxWithdrawal: 100000,
  });

  // Realtime exchange rate state
  const [realtimeRate, setRealtimeRate] = useState<{
    baseRate: number;
    finalRate: number;
    marginPercent: number;
    lastUpdated: string;
  } | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  const toggleGateway = (id: string) => {
    setGateways(prev => prev.map(g => 
      g.id === id ? { ...g, enabled: !g.enabled } : g
    ));
    setIsSaved(false);
  };

  const toggleTestMode = (id: string) => {
    setGateways(prev => prev.map(g => 
      g.id === id ? { ...g, testMode: !g.testMode } : g
    ));
    setIsSaved(false);
  };

  const updateGatewayConfig = (id: string, field: string, value: string) => {
    setGateways(prev => prev.map(g => 
      g.id === id ? { ...g, config: { ...g.config, [field]: value } } : g
    ));
    setIsSaved(false);
  };

  const toggleShowSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Load payment settings on mount
  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await getPaymentSettings();
      
      // Map gateway configs to local state (with icons)
      const gatewayIcons: Record<string, React.ElementType> = {
        stripe: CreditCard,
        omise: Building2,
        promptpay: QrCode,
        truemoney: Smartphone,
        linepay: Zap,
        paypal: Globe,
      };
      
      const gatewaysWithIcons = settings.gateways.map(gateway => ({
        ...gateway,
        icon: gatewayIcons[gateway.id] || CreditCard,
      }));
      
      setGateways(gatewaysWithIcons);
      
      if (settings.bankAccounts) {
        setBankAccounts(settings.bankAccounts);
      }
      
      if (settings.currencySettings) {
        setCurrencySettings(prev => ({
          ...prev,
          ...settings.currencySettings,
          marginPercent: settings.currencySettings?.marginPercent ?? 0,
        }));
      }
      
      // Load realtime rate after settings are loaded
      loadRealtimeRate();
    } catch (error) {
      console.error('Error loading payment settings:', error);
      showToast('เกิดข้อผิดพลาดในการโหลดการตั้งค่า', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load realtime exchange rate
  const loadRealtimeRate = async () => {
    setIsLoadingRate(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/exchange-rate`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRealtimeRate(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      showToast('สิทธิ์ไม่เพียงพอ: เฉพาะ Super Admin เท่านั้นที่แก้ไขหน้านี้ได้', 'error');
      return;
    }
    try {
      // Convert local state to PaymentGatewayConfig (without icon)
      const gatewayConfigs: PaymentGatewayConfig[] = gateways.map(({ icon, ...gateway }) => gateway);
      
      const settings = {
        gateways: gatewayConfigs,
        bankAccounts,
        currencySettings,
      };
      
      const result = await savePaymentSettings(settings);
      
      if (result.success) {
        setIsSaved(true);
        showToast('บันทึกการตั้งค่าสำเร็จ', 'success');
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        showToast(result.error || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const addBankAccount = () => {
    setBankAccounts(prev => [...prev, {
      id: Date.now(),
      bank: 'ธนาคาร...',
      accountNumber: '',
      accountName: '',
      enabled: true,
    }]);
  };

  const removeBankAccount = (id: number) => {
    if (window.confirm('ต้องการลบบัญชีนี้หรือไม่?')) {
      setBankAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

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
                  <CreditCard className="text-brand-gold" size={28} />
                  Payment Gateway Settings
                </h1>
                <p className="text-sm text-slate-500 mt-1">ตั้งค่าช่องทางการรับชำระเงิน</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <RefreshCw size={20} className="text-slate-600" />
                </button>
                {!canEdit && (
                  <span className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                    View only ({roleLabel})
                  </span>
                )}
                <Button onClick={handleSave} className="gap-2 shadow-lg" disabled={!canEdit || isSaved}>
                  <Save size={18} /> {isSaved ? 'บันทึกแล้ว!' : 'บันทึกการตั้งค่า'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="animate-spin mx-auto mb-4 text-brand-gold" size={32} />
                <p className="text-slate-600">กำลังโหลดการตั้งค่า...</p>
              </div>
            </div>
          )}
          
          {!isLoading && (
            <>
          {/* Payment Gateways */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap className="text-yellow-500" size={20} />
                Payment Gateways
              </h2>
              <p className="text-sm text-slate-500 mt-1">เปิด/ปิด และตั้งค่า API Keys</p>
            </div>

            <div className="divide-y divide-slate-100">
              {gateways.map((gateway) => {
                const Icon = gateway.icon;
                return (
                  <div key={gateway.id} className={`p-6 ${gateway.enabled ? '' : 'opacity-60'}`}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        gateway.enabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Icon size={24} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-slate-900">{gateway.name}</h3>
                          {gateway.testMode && gateway.enabled && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                              Test Mode
                            </span>
                          )}
                          {gateway.enabled && !gateway.testMode && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{gateway.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {gateway.supportedMethods.map((method, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                              {method}
                            </span>
                          ))}
                        </div>

                        {/* Config Fields */}
                        {gateway.enabled && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Public Key / API Key</label>
                              <input
                                type="text"
                                value={gateway.config.publicKey}
                                onChange={(e) => updateGatewayConfig(gateway.id, 'publicKey', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                                placeholder="pk_xxxxx"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Secret Key
                                <button
                                  onClick={() => toggleShowSecret(gateway.id)}
                                  className="ml-2 text-slate-400 hover:text-slate-600"
                                >
                                  {showSecrets[gateway.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </label>
                              <input
                                type={showSecrets[gateway.id] ? 'text' : 'password'}
                                value={gateway.config.secretKey}
                                onChange={(e) => updateGatewayConfig(gateway.id, 'secretKey', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                                placeholder="sk_xxxxx"
                              />
                            </div>
                            {gateway.config.webhookSecret !== undefined && (
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Webhook Secret</label>
                                <input
                                  type={showSecrets[gateway.id] ? 'text' : 'password'}
                                  value={gateway.config.webhookSecret}
                                  onChange={(e) => updateGatewayConfig(gateway.id, 'webhookSecret', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                                  placeholder="whsec_xxxxx"
                                />
                              </div>
                            )}
                            {gateway.config.merchantId !== undefined && (
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Merchant ID / หมายเลขบัญชี</label>
                                <input
                                  type="text"
                                  value={gateway.config.merchantId}
                                  onChange={(e) => updateGatewayConfig(gateway.id, 'merchantId', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                                  placeholder="0812345678"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Toggle Buttons */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleGateway(gateway.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            gateway.enabled
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {gateway.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </button>
                        {gateway.enabled && (
                          <button
                            onClick={() => toggleTestMode(gateway.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              gateway.testMode
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {gateway.testMode ? 'Test Mode' : 'Live Mode'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bank Transfer Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="text-blue-500" size={20} />
                  บัญชีธนาคาร (โอนเงิน)
                </h2>
                <p className="text-sm text-slate-500 mt-1">บัญชีสำหรับรับโอนเงินจากลูกค้า</p>
              </div>
              <Button size="sm" onClick={addBankAccount} className="gap-2">
                <Plus size={16} /> เพิ่มบัญชี
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                  account.enabled ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center border">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={account.bank}
                      onChange={(e) => {
                        setBankAccounts(prev => prev.map(a => 
                          a.id === account.id ? { ...a, bank: e.target.value } : a
                        ));
                      }}
                      className="font-bold text-slate-900 bg-transparent border-none outline-none w-full"
                    />
                    <div className="flex gap-4 mt-1">
                      <input
                        type="text"
                        value={account.accountNumber}
                        onChange={(e) => {
                          setBankAccounts(prev => prev.map(a => 
                            a.id === account.id ? { ...a, accountNumber: e.target.value } : a
                          ));
                        }}
                        placeholder="เลขบัญชี"
                        className="text-sm text-slate-600 bg-transparent border-none outline-none font-mono"
                      />
                      <input
                        type="text"
                        value={account.accountName}
                        onChange={(e) => {
                          setBankAccounts(prev => prev.map(a => 
                            a.id === account.id ? { ...a, accountName: e.target.value } : a
                          ));
                        }}
                        placeholder="ชื่อบัญชี"
                        className="text-sm text-slate-600 bg-transparent border-none outline-none flex-1"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setBankAccounts(prev => prev.map(a => 
                        a.id === account.id ? { ...a, enabled: !a.enabled } : a
                      ));
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      account.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {account.enabled ? 'เปิด' : 'ปิด'}
                  </button>
                  <button
                    onClick={() => removeBankAccount(account.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Currency & Fees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <Globe className="text-purple-500" size={20} />
                สกุลเงินและอัตราแลกเปลี่ยน
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">สกุลเงินหลัก</label>
                  <select
                    value={currencySettings.primaryCurrency}
                    onChange={(e) => setCurrencySettings(prev => ({ ...prev, primaryCurrency: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                  >
                    <option value="THB">🇹🇭 THB - บาทไทย</option>
                    <option value="USD">🇺🇸 USD - US Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">อัตราแลกเปลี่ยน (1 USD = ? THB)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={currencySettings.exchangeRate}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) }))}
                      step="0.01"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                    <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2">
                      <RefreshCw size={16} />
                      อัพเดท
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currencySettings.autoUpdateRate}
                    onChange={(e) => setCurrencySettings(prev => ({ ...prev, autoUpdateRate: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                  />
                  <div>
                    <span className="font-medium text-slate-900">อัพเดทอัตราแลกเปลี่ยนอัตโนมัติ</span>
                    <p className="text-xs text-slate-500">ดึงอัตราล่าสุดทุก 6 ชั่วโมง</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <DollarSign className="text-green-500" size={20} />
                ค่าธรรมเนียมและขีดจำกัด
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ค่าธรรมเนียม (%)</label>
                    <input
                      type="number"
                      value={currencySettings.transactionFeePercent}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, transactionFeePercent: parseFloat(e.target.value) }))}
                      step="0.1"
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ค่าธรรมเนียมคงที่ (฿)</label>
                    <input
                      type="number"
                      value={currencySettings.transactionFeeFixed}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, transactionFeeFixed: parseFloat(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ถอนเงินขั้นต่ำ (฿)</label>
                    <input
                      type="number"
                      value={currencySettings.minWithdrawal}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, minWithdrawal: parseInt(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ถอนเงินสูงสุด (฿)</label>
                    <input
                      type="number"
                      value={currencySettings.maxWithdrawal}
                      onChange={(e) => setCurrencySettings(prev => ({ ...prev, maxWithdrawal: parseInt(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">ตัวอย่างการคำนวณ</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        ยอดซื้อ ฿1,000 → ค่าธรรมเนียม = ฿{(1000 * currencySettings.transactionFeePercent / 100 + currencySettings.transactionFeeFixed).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-brand-gold/20 rounded-xl flex items-center justify-center">
                <Shield className="text-brand-gold" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">ความปลอดภัย API Keys</h3>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• อย่าเปิดเผย Secret Keys ให้ผู้อื่น</li>
                  <li>• ใช้ Test Mode ในการทดสอบเสมอ</li>
                  <li>• ตั้ง Webhook URL ให้ถูกต้องเพื่อรับ Notification</li>
                  <li>• หมุนเวียน API Keys เป็นประจำเพื่อความปลอดภัย</li>
                </ul>
              </div>
            </div>
          </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminPaymentSettings;
