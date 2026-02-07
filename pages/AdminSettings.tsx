import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings, Save, Bell, Shield, Globe, Mail, Smartphone, Clock,
  BarChart3, Home, Camera, HardDrive, MapPin, Ticket, Users, Wallet,
  ChevronRight, Image, CreditCard, DollarSign, Key, Database, Cloud,
  Lock, Eye, EyeOff, RefreshCw, AlertTriangle, CheckCircle, Upload, TrendingUp,
  FileText, MessageSquare, Send, Phone, Facebook, Instagram, Twitter, ScanLine, Award, Package, LogOut
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
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
      { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null },
      { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null },
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null, isActive: true },
    ]
  }
];

export const AdminSettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, showToast } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'email' | 'notification' | 'security' | 'api' | 'social'>('general');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Truvamate',
    siteDescription: 'ตลาดซื้อขายล็อตเตอรี่ต่างประเทศและสินค้าออนไลน์',
    siteUrl: 'https://truvamate.com',
    adminEmail: 'admin@truvamate.com',
    supportEmail: 'support@truvamate.com',
    timezone: 'Asia/Bangkok',
    language: 'th',
    currency: 'THB',
    maintenanceMode: false,
    registrationEnabled: true,
    guestCheckout: false,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@truvamate.com',
    smtpPassword: '********',
    smtpSecure: true,
    senderName: 'Truvamate',
    senderEmail: 'noreply@truvamate.com',
    emailTemplates: {
      welcome: true,
      orderConfirmation: true,
      ticketPurchased: true,
      winningNotification: true,
      paymentReceived: true,
    }
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    smsEnabled: false,
    lineNotifyToken: '',
    telegramBotToken: '',
    telegramChatId: '',
    notifyOnNewOrder: true,
    notifyOnPayment: true,
    notifyOnNewUser: true,
    notifyOnLottoWin: true,
    notifyOnLowBalance: true,
    lowBalanceThreshold: 10000,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    ipWhitelist: '',
    enableCaptcha: true,
    captchaSiteKey: '',
    captchaSecretKey: '',
    enableSSL: true,
    enableCSRF: true,
  });

  // API Settings
  const [apiSettings, setApiSettings] = useState({
    googleClientId: '',
    googleClientSecret: '',
    googleDriveFolderId: '',
    googlePhotosAlbumId: '',
    firebaseProjectId: '',
    firebaseApiKey: '',
    openAiApiKey: '',
    telegramBotToken: '',
  });

  // Social Settings
  const [socialSettings, setSocialSettings] = useState({
    facebookUrl: 'https://facebook.com/truvamate',
    instagramUrl: 'https://instagram.com/truvamate',
    twitterUrl: 'https://twitter.com/truvamate',
    lineId: '@truvamate',
    phoneNumber: '+66 2 123 4567',
    whatsappNumber: '+66 81 234 5678',
  });

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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

  const sections = [
    { id: 'general', name: 'ทั่วไป', icon: Settings },
    { id: 'email', name: 'อีเมล', icon: Mail },
    { id: 'notification', name: 'การแจ้งเตือน', icon: Bell },
    { id: 'security', name: 'ความปลอดภัย', icon: Shield },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'social', name: 'Social Media', icon: MessageSquare },
  ];

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
                  <Settings className="text-brand-gold" size={28} />
                  ตั้งค่าระบบ
                </h1>
                <p className="text-sm text-slate-500 mt-1">การตั้งค่าทั่วไป, อีเมล, ความปลอดภัย และ API</p>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={handleSave} className="gap-2 shadow-lg" disabled={isSaved}>
                  <Save size={18} /> {isSaved ? 'บันทึกแล้ว!' : 'บันทึกการตั้งค่า'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="flex gap-8">
            
            {/* Settings Navigation */}
            <div className="w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">หมวดหมู่</h3>
                </div>
                <nav className="p-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-brand-gold text-slate-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm">{section.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 space-y-6">
              
              {/* General Settings */}
              {activeSection === 'general' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Settings className="text-blue-500" size={20} />
                    การตั้งค่าทั่วไป
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อเว็บไซต์</label>
                        <input
                          type="text"
                          value={generalSettings.siteName}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">URL เว็บไซต์</label>
                        <input
                          type="text"
                          value={generalSettings.siteUrl}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">คำอธิบายเว็บไซต์</label>
                      <textarea
                        value={generalSettings.siteDescription}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                        rows={3}
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">อีเมล Admin</label>
                        <input
                          type="email"
                          value={generalSettings.adminEmail}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">อีเมล Support</label>
                        <input
                          type="email"
                          value={generalSettings.supportEmail}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Timezone</label>
                        <select
                          value={generalSettings.timezone}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        >
                          <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">ภาษาหลัก</label>
                        <select
                          value={generalSettings.language}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        >
                          <option value="th">🇹🇭 ไทย</option>
                          <option value="en">🇺🇸 English</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">สกุลเงิน</label>
                        <select
                          value={generalSettings.currency}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        >
                          <option value="THB">🇹🇭 THB - บาท</option>
                          <option value="USD">🇺🇸 USD - Dollar</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-4">
                      <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">Maintenance Mode</span>
                            <p className="text-xs text-slate-500">ปิดเว็บไซต์ชั่วคราวเพื่อบำรุงรักษา</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={generalSettings.maintenanceMode}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                          className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="text-green-600" size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">เปิดรับสมาชิกใหม่</span>
                            <p className="text-xs text-slate-500">อนุญาตให้ลงทะเบียนสมาชิกใหม่</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={generalSettings.registrationEnabled}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, registrationEnabled: e.target.checked }))}
                          className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Wallet className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">Guest Checkout</span>
                            <p className="text-xs text-slate-500">อนุญาตให้ซื้อโดยไม่ต้องสมัครสมาชิก</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={generalSettings.guestCheckout}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, guestCheckout: e.target.checked }))}
                          className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Settings */}
              {activeSection === 'email' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Mail className="text-purple-500" size={20} />
                    การตั้งค่าอีเมล (SMTP)
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">SMTP Host</label>
                        <input
                          type="text"
                          value={emailSettings.smtpHost}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">SMTP Port</label>
                        <input
                          type="number"
                          value={emailSettings.smtpPort}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">SMTP Username</label>
                        <input
                          type="text"
                          value={emailSettings.smtpUser}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          SMTP Password
                          <button onClick={() => toggleShowSecret('smtp')} className="ml-2 text-slate-400 hover:text-slate-600">
                            {showSecrets['smtp'] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </label>
                        <input
                          type={showSecrets['smtp'] ? 'text' : 'password'}
                          value={emailSettings.smtpPassword}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อผู้ส่ง</label>
                        <input
                          type="text"
                          value={emailSettings.senderName}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, senderName: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">อีเมลผู้ส่ง</label>
                        <input
                          type="email"
                          value={emailSettings.senderEmail}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h3 className="font-bold text-slate-900 mb-4">Email Templates ที่เปิดใช้งาน</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(emailSettings.emailTemplates).map(([key, value]) => (
                          <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setEmailSettings(prev => ({
                                ...prev,
                                emailTemplates: { ...prev.emailTemplates, [key]: e.target.checked }
                              }))}
                              className="h-4 w-4 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                            />
                            <span className="text-sm text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                      <Send size={16} />
                      ทดสอบส่งอีเมล
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notification' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Bell className="text-yellow-500" size={20} />
                    การแจ้งเตือน
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">LINE Notify Token</label>
                        <input
                          type="text"
                          value={notificationSettings.lineNotifyToken}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, lineNotifyToken: e.target.value }))}
                          placeholder="ใส่ LINE Notify Token"
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Telegram Bot Token</label>
                        <input
                          type="text"
                          value={notificationSettings.telegramBotToken}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                          placeholder="ใส่ Telegram Bot Token"
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Telegram Chat ID</label>
                      <input
                        type="text"
                        value={notificationSettings.telegramChatId}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                        placeholder="ใส่ Chat ID"
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h3 className="font-bold text-slate-900 mb-4">แจ้งเตือนเมื่อ</h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                          <span className="font-medium text-slate-700">มีคำสั่งซื้อใหม่</span>
                          <input
                            type="checkbox"
                            checked={notificationSettings.notifyOnNewOrder}
                            onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyOnNewOrder: e.target.checked }))}
                            className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                          />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                          <span className="font-medium text-slate-700">มีการชำระเงิน</span>
                          <input
                            type="checkbox"
                            checked={notificationSettings.notifyOnPayment}
                            onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyOnPayment: e.target.checked }))}
                            className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                          />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                          <span className="font-medium text-slate-700">มีสมาชิกใหม่</span>
                          <input
                            type="checkbox"
                            checked={notificationSettings.notifyOnNewUser}
                            onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyOnNewUser: e.target.checked }))}
                            className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                          />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-green-50 rounded-xl cursor-pointer">
                          <span className="font-medium text-green-700">🎉 ลูกค้าถูกรางวัล</span>
                          <input
                            type="checkbox"
                            checked={notificationSettings.notifyOnLottoWin}
                            onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyOnLottoWin: e.target.checked }))}
                            className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                          />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-red-50 rounded-xl cursor-pointer">
                          <div>
                            <span className="font-medium text-red-700">⚠️ ยอดเงินต่ำกว่า</span>
                            <input
                              type="number"
                              value={notificationSettings.lowBalanceThreshold}
                              onChange={(e) => setNotificationSettings(prev => ({ ...prev, lowBalanceThreshold: parseInt(e.target.value) }))}
                              className="ml-2 w-24 bg-white border border-red-200 rounded px-2 py-1 text-sm"
                            />
                            <span className="text-sm text-red-600 ml-1">บาท</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.notifyOnLowBalance}
                            onChange={(e) => setNotificationSettings(prev => ({ ...prev, notifyOnLowBalance: e.target.checked }))}
                            className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeSection === 'security' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Shield className="text-red-500" size={20} />
                    ความปลอดภัย
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Session Timeout (นาที)</label>
                        <input
                          type="number"
                          value={securitySettings.sessionTimeout}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Max Login Attempts</label>
                        <input
                          type="number"
                          value={securitySettings.maxLoginAttempts}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Password Min Length</label>
                        <input
                          type="number"
                          value={securitySettings.passwordMinLength}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-4">
                      <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900">Two-Factor Authentication</span>
                          <p className="text-xs text-slate-500">บังคับใช้ 2FA สำหรับ Admin</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorEnabled}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                          className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900">Enable reCAPTCHA</span>
                          <p className="text-xs text-slate-500">ป้องกัน Bot ในหน้า Login</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={securitySettings.enableCaptcha}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, enableCaptcha: e.target.checked }))}
                          className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div>
                          <span className="font-bold text-slate-900">Require Special Character</span>
                          <p className="text-xs text-slate-500">รหัสผ่านต้องมีอักขระพิเศษ</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={securitySettings.requireSpecialChar}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireSpecialChar: e.target.checked }))}
                          className="h-5 w-5 rounded border-slate-300 text-brand-gold focus:ring-brand-gold"
                        />
                      </label>
                    </div>

                    {securitySettings.enableCaptcha && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-xl">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">reCAPTCHA Site Key</label>
                          <input
                            type="text"
                            value={securitySettings.captchaSiteKey}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, captchaSiteKey: e.target.value }))}
                            placeholder="6Le..."
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">reCAPTCHA Secret Key</label>
                          <input
                            type={showSecrets['captcha'] ? 'text' : 'password'}
                            value={securitySettings.captchaSecretKey}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, captchaSecretKey: e.target.value }))}
                            placeholder="6Le..."
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* API Settings */}
              {activeSection === 'api' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <Key className="text-orange-500" size={20} />
                    API Keys & Integrations
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <Cloud size={18} /> Google Cloud
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client ID</label>
                          <input
                            type="text"
                            value={apiSettings.googleClientId}
                            onChange={(e) => setApiSettings(prev => ({ ...prev, googleClientId: e.target.value }))}
                            placeholder="xxxxx.apps.googleusercontent.com"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Secret</label>
                          <input
                            type={showSecrets['google'] ? 'text' : 'password'}
                            value={apiSettings.googleClientSecret}
                            onChange={(e) => setApiSettings(prev => ({ ...prev, googleClientSecret: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Drive Folder ID</label>
                          <input
                            type="text"
                            value={apiSettings.googleDriveFolderId}
                            onChange={(e) => setApiSettings(prev => ({ ...prev, googleDriveFolderId: e.target.value }))}
                            placeholder="1ABC..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Photos Album ID</label>
                          <input
                            type="text"
                            value={apiSettings.googlePhotosAlbumId}
                            onChange={(e) => setApiSettings(prev => ({ ...prev, googlePhotosAlbumId: e.target.value }))}
                            placeholder="ABC..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                        <Database size={18} /> Firebase
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project ID</label>
                          <input
                            type="text"
                            value={apiSettings.firebaseProjectId}
                            onChange={(e) => setApiSettings(prev => ({ ...prev, firebaseProjectId: e.target.value }))}
                            placeholder="my-project-id"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key</label>
                          <input
                            type={showSecrets['firebase'] ? 'text' : 'password'}
                            value={apiSettings.firebaseApiKey}
                            onChange={(e) => setApiSettings(prev => ({ ...prev, firebaseApiKey: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                        <MessageSquare size={18} /> OpenAI
                      </h3>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key</label>
                        <input
                          type={showSecrets['openai'] ? 'text' : 'password'}
                          value={apiSettings.openAiApiKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, openAiApiKey: e.target.value }))}
                          placeholder="sk-..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Settings */}
              {activeSection === 'social' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                    <MessageSquare className="text-pink-500" size={20} />
                    Social Media & ช่องทางติดต่อ
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <Facebook size={16} className="text-blue-600" /> Facebook
                        </label>
                        <input
                          type="text"
                          value={socialSettings.facebookUrl}
                          onChange={(e) => setSocialSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <Instagram size={16} className="text-pink-600" /> Instagram
                        </label>
                        <input
                          type="text"
                          value={socialSettings.instagramUrl}
                          onChange={(e) => setSocialSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <Twitter size={16} className="text-sky-500" /> Twitter / X
                        </label>
                        <input
                          type="text"
                          value={socialSettings.twitterUrl}
                          onChange={(e) => setSocialSettings(prev => ({ ...prev, twitterUrl: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <MessageSquare size={16} className="text-green-500" /> LINE ID
                        </label>
                        <input
                          type="text"
                          value={socialSettings.lineId}
                          onChange={(e) => setSocialSettings(prev => ({ ...prev, lineId: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <Phone size={16} className="text-slate-600" /> เบอร์โทรศัพท์
                        </label>
                        <input
                          type="text"
                          value={socialSettings.phoneNumber}
                          onChange={(e) => setSocialSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                          <Smartphone size={16} className="text-green-600" /> WhatsApp
                        </label>
                        <input
                          type="text"
                          value={socialSettings.whatsappNumber}
                          onChange={(e) => setSocialSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
