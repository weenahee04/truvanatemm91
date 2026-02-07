import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { getLocationHistory, isFromUSA, isFromThailand, type LocationData } from '../services/locationService';
import { 
  MapPin, Globe, Clock, Wifi, RefreshCw, History, TrendingUp, BarChart3, 
  Home, Camera, HardDrive, Ticket, Users, Wallet, Image, CreditCard, 
  DollarSign, Settings, ChevronRight, Shield, Monitor, Smartphone, Activity,
  Eye, ScanLine, Award, Package, LogOut
} from 'lucide-react';
import { Button } from '../components/ui/Button';
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
      { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null },
      { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null, isActive: true },
      { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null },
    ]
  },
  {
    title: 'ตั้งค่า',
    items: [
      { name: 'Hero & Banners', icon: Image, path: '/admin', badge: null },
      { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null },
      { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null },
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
    ]
  }
];

export const LocationAnalytics: React.FC = () => {
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const { user, userLocation, isLoadingLocation, refreshLocation, logout, showToast } = useGlobal();
  const locationHistory = getLocationHistory();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleRefresh = async () => {
    await refreshLocation();
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

  // Mock analytics data
  const analyticsData = {
    totalVisitors: 1247,
    uniqueCountries: 15,
    topCountries: [
      { country: 'Thailand', code: 'TH', visits: 856, flag: '🇹🇭', percent: 68.6 },
      { country: 'USA', code: 'US', visits: 234, flag: '🇺🇸', percent: 18.8 },
      { country: 'Japan', code: 'JP', visits: 67, flag: '🇯🇵', percent: 5.4 },
      { country: 'Singapore', code: 'SG', visits: 45, flag: '🇸🇬', percent: 3.6 },
      { country: 'UK', code: 'GB', visits: 28, flag: '🇬🇧', percent: 2.2 },
      { country: 'Others', code: 'XX', visits: 17, flag: '🌍', percent: 1.4 },
    ],
    deviceTypes: [
      { type: 'Mobile', icon: Smartphone, count: 823, percent: 66 },
      { type: 'Desktop', icon: Monitor, count: 399, percent: 32 },
      { type: 'Tablet', icon: Monitor, count: 25, percent: 2 },
    ],
    recentVisits: [
      { ip: '110.168.xxx.xxx', country: 'Thailand', city: 'Bangkok', time: '2 นาทีที่แล้ว', device: 'iPhone' },
      { ip: '192.168.xxx.xxx', country: 'USA', city: 'New York', time: '5 นาทีที่แล้ว', device: 'Chrome/Windows' },
      { ip: '203.154.xxx.xxx', country: 'Thailand', city: 'Chiang Mai', time: '8 นาทีที่แล้ว', device: 'Android' },
      { ip: '45.67.xxx.xxx', country: 'Japan', city: 'Tokyo', time: '12 นาทีที่แล้ว', device: 'Safari/Mac' },
      { ip: '88.99.xxx.xxx', country: 'Singapore', city: 'Singapore', time: '15 นาทีที่แล้ว', device: 'Chrome/Windows' },
    ]
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white fixed left-0 top-0 h-full overflow-y-auto transition-all duration-300 z-40 flex flex-col`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-gold rounded-lg flex items-center justify-center font-black text-slate-900 text-lg">
              T
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-xl font-black tracking-tighter text-brand-gold uppercase">Truvamate</h2>
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Admin Panel</span>
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
                  const isActive = item.isActive || routeLocation.pathname === item.path;
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

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"
          >
            <ChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="text-sm">ย่อเมนู</span>}
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
                  <MapPin className="text-brand-gold" size={28} />
                  Location Analytics
                </h1>
                <p className="text-sm text-slate-500 mt-1">ข้อมูลตำแหน่งที่ตั้งของผู้เข้าใช้งาน</p>
              </div>
              <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={isLoadingLocation}>
                <RefreshCw size={18} className={isLoadingLocation ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ผู้เข้าชมวันนี้</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{analyticsData.totalVisitors}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Eye className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ประเทศ</p>
                  <p className="text-3xl font-black text-purple-600 mt-1">{analyticsData.uniqueCountries}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Globe className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ออนไลน์ตอนนี้</p>
                  <p className="text-3xl font-black text-green-600 mt-1">24</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Activity className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ประวัติการเข้าชม</p>
                  <p className="text-3xl font-black text-orange-600 mt-1">{locationHistory.length}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <History className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Location Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <MapPin className="text-brand-gold" size={20} />
                ตำแหน่งปัจจุบันของคุณ
              </h3>
              
              {isLoadingLocation ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="animate-spin text-brand-gold" size={32} />
                </div>
              ) : userLocation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="h-14 w-14 bg-brand-gold/20 rounded-xl flex items-center justify-center text-3xl">
                      {isFromUSA(userLocation) ? '🇺🇸' : isFromThailand(userLocation) ? '🇹🇭' : '🌍'}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{userLocation.country}</p>
                      <p className="text-sm text-slate-500">{userLocation.city}, {userLocation.region}</p>
                    </div>
                    {isFromUSA(userLocation) && (
                      <span className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                        USA Access
                      </span>
                    )}
                    {isFromThailand(userLocation) && (
                      <span className="ml-auto bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
                        Thailand Access
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Wifi size={16} />
                        <span className="text-xs uppercase font-bold">IP Address</span>
                      </div>
                      <p className="font-mono font-bold text-slate-900">{userLocation.ip}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Clock size={16} />
                        <span className="text-xs uppercase font-bold">Timezone</span>
                      </div>
                      <p className="font-mono font-bold text-slate-900">{userLocation.timezone}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Shield size={16} />
                      <span className="text-xs uppercase font-bold">ISP / Organization</span>
                    </div>
                    <p className="font-bold text-slate-900">{userLocation.isp}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <MapPin size={48} className="mx-auto mb-4 text-slate-300" />
                  <p>ไม่สามารถตรวจสอบตำแหน่งได้</p>
                </div>
              )}
            </div>

            {/* Top Countries */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <TrendingUp className="text-green-500" size={20} />
                ประเทศที่เข้าชมมากที่สุด
              </h3>
              
              <div className="space-y-4">
                {analyticsData.topCountries.map((country, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900">{country.country}</span>
                        <span className="text-sm text-slate-500">{country.visits} ({country.percent}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-gold rounded-full transition-all"
                          style={{ width: `${country.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Types */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <Monitor className="text-blue-500" size={20} />
                ประเภทอุปกรณ์
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                {analyticsData.deviceTypes.map((device, index) => {
                  const Icon = device.icon;
                  return (
                    <div key={index} className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="h-12 w-12 mx-auto bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                        <Icon className="text-blue-600" size={24} />
                      </div>
                      <p className="font-bold text-slate-900">{device.type}</p>
                      <p className="text-2xl font-black text-blue-600">{device.percent}%</p>
                      <p className="text-xs text-slate-500">{device.count} visits</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Visits */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <History className="text-orange-500" size={20} />
                การเข้าชมล่าสุด
              </h3>
              
              <div className="space-y-3">
                {analyticsData.recentVisits.map((visit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Globe size={18} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{visit.country} - {visit.city}</p>
                        <p className="text-xs text-slate-500">{visit.ip} • {visit.device}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{visit.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location History */}
          {locationHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <History className="text-purple-500" size={20} />
                ประวัติการตรวจสอบตำแหน่ง (ในเครื่องนี้)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">เวลา</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">ประเทศ</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">เมือง</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">IP</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">ISP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {locationHistory.slice(0, 10).map((loc, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(loc.timestamp).toLocaleString('th-TH')}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {loc.country} ({loc.countryCode})
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{loc.city}</td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-600">{loc.ip}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{loc.isp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LocationAnalytics;
