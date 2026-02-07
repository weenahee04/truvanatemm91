import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { logout as authLogout } from '../services/authService';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Ticket, Users, 
  Calendar, BarChart3, Home, Settings, Image, Type, LayoutDashboard,
  CreditCard, FileText, Camera, HardDrive, MapPin, Package, Bell,
  LogOut, ChevronDown, ChevronRight, Eye, Clock, CheckCircle, AlertTriangle,
  Wallet, ArrowUpRight, ArrowDownRight, Activity, Target, Award, Zap,
  Globe, Smartphone, Monitor, Filter, Download, RefreshCw, ScanLine, Shield, Trophy
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';
import { getAdminStats, getRevenueByMonth, getDailySales, getUserGrowth, getRecentOrders, getCategoryBreakdown, getTopProducts, getLottoStats, getRecentActivities, getDeviceStats, getCountryStats, getAllSellers } from '../services/adminService';
import { getAllReferrals } from '../services/referralService';
import { Order } from '../types';
import { canSeeAdminNavPath } from '../utils/adminNav';

// Mock Data
const REVENUE_DATA = [
  { month: 'Jan', lotto: 45000, marketplace: 32000, total: 77000 },
  { month: 'Feb', lotto: 52000, marketplace: 38000, total: 90000 },
  { month: 'Mar', lotto: 61000, marketplace: 42000, total: 103000 },
  { month: 'Apr', lotto: 58000, marketplace: 45000, total: 103000 },
  { month: 'May', lotto: 70000, marketplace: 51000, total: 121000 },
  { month: 'Jun', lotto: 82000, marketplace: 58000, total: 140000 },
  { month: 'Jul', lotto: 88000, marketplace: 62000, total: 150000 },
  { month: 'Aug', lotto: 95000, marketplace: 68000, total: 163000 },
  { month: 'Sep', lotto: 102000, marketplace: 72000, total: 174000 },
  { month: 'Oct', lotto: 110000, marketplace: 78000, total: 188000 },
  { month: 'Nov', lotto: 118000, marketplace: 85000, total: 203000 },
  { month: 'Dec', lotto: 125000, marketplace: 92000, total: 217000 },
];

const DAILY_SALES = [
  { day: 'Mon', orders: 45, revenue: 12500 },
  { day: 'Tue', orders: 52, revenue: 14800 },
  { day: 'Wed', orders: 48, revenue: 13200 },
  { day: 'Thu', orders: 61, revenue: 17500 },
  { day: 'Fri', orders: 78, revenue: 22400 },
  { day: 'Sat', orders: 95, revenue: 28500 },
  { day: 'Sun', orders: 82, revenue: 24200 },
];

const HOURLY_TRAFFIC = [
  { hour: '00:00', visitors: 45 },
  { hour: '02:00', visitors: 28 },
  { hour: '04:00', visitors: 15 },
  { hour: '06:00', visitors: 32 },
  { hour: '08:00', visitors: 85 },
  { hour: '10:00', visitors: 145 },
  { hour: '12:00', visitors: 178 },
  { hour: '14:00', visitors: 165 },
  { hour: '16:00', visitors: 195 },
  { hour: '18:00', visitors: 220 },
  { hour: '20:00', visitors: 245 },
  { hour: '22:00', visitors: 125 },
];

const CATEGORY_DATA = [
  { name: 'Powerball', value: 320000, color: '#EF4444', percent: 41 },
  { name: 'Mega Millions', value: 180000, color: '#F59E0B', percent: 23 },
  { name: 'Electronics', value: 95000, color: '#3B82F6', percent: 12 },
  { name: 'Fashion', value: 75000, color: '#8B5CF6', percent: 10 },
  { name: 'Home & Living', value: 62000, color: '#10B981', percent: 8 },
  { name: 'Others', value: 48000, color: '#6B7280', percent: 6 },
];

const LOTTO_STATS = [
  { name: 'Powerball', pending: 45, purchased: 128, won: 12, paid: 8 },
  { name: 'Mega Millions', pending: 32, purchased: 95, won: 8, paid: 5 },
];

const TOP_PRODUCTS = [
  { rank: 1, name: 'Powerball Ticket (5 Lines)', sales: 1250, revenue: 218750, growth: 28 },
  { rank: 2, name: 'Mega Millions Ticket (3 Lines)', sales: 780, revenue: 136500, growth: 15 },
  { rank: 3, name: 'Wireless Headphones Pro', sales: 342, revenue: 85500, growth: 12 },
  { rank: 4, name: 'Smart Watch Series 5', sales: 256, revenue: 76800, growth: -5 },
  { rank: 5, name: 'Designer Handbag', sales: 189, revenue: 94500, growth: 8 },
  { rank: 6, name: 'iPhone 15 Pro Case', sales: 156, revenue: 23400, growth: 22 },
  { rank: 7, name: 'Bluetooth Speaker', sales: 134, revenue: 26800, growth: 3 },
  { rank: 8, name: 'Running Shoes', sales: 128, revenue: 38400, growth: -2 },
];

const USER_GROWTH = [
  { month: 'Jan', users: 120, active: 85 },
  { month: 'Feb', users: 185, active: 145 },
  { month: 'Mar', users: 242, active: 198 },
  { month: 'Apr', users: 318, active: 256 },
  { month: 'May', users: 405, active: 325 },
  { month: 'Jun', users: 521, active: 420 },
  { month: 'Jul', users: 648, active: 512 },
  { month: 'Aug', users: 785, active: 615 },
  { month: 'Sep', users: 925, active: 728 },
  { month: 'Oct', users: 1080, active: 852 },
  { month: 'Nov', users: 1245, active: 985 },
  { month: 'Dec', users: 1420, active: 1125 },
];

const RECENT_ORDERS = [
  { id: 'LT-20251211-001', customer: 'สมชาย ใจดี', type: 'สินค้าพิเศษ', product: 'Powerball x5', amount: 780, status: 'pending', time: '5 นาทีที่แล้ว' },
  { id: 'MP-20251211-002', customer: 'สมหญิง รักเรียน', type: 'Marketplace', product: 'Wireless Headphones', amount: 2500, status: 'paid', time: '12 นาทีที่แล้ว' },
  { id: 'LT-20251211-003', customer: 'วิชัย มั่นคง', type: 'สินค้าพิเศษ', product: 'Mega Millions x3', amount: 525, status: 'confirmed', time: '18 นาทีที่แล้ว' },
  { id: 'MP-20251211-004', customer: 'นภา สวยงาม', type: 'Marketplace', product: 'Smart Watch', amount: 4500, status: 'shipped', time: '25 นาทีที่แล้ว' },
  { id: 'LT-20251211-005', customer: 'พิชัย รวยแน่', type: 'สินค้าพิเศษ', product: 'Powerball x10', amount: 1560, status: 'purchased', time: '32 นาทีที่แล้ว' },
];

const RECENT_ACTIVITIES = [
  { type: 'order', message: 'คำสั่งซื้อใหม่ #LT-20251211-001 จาก สมชาย ใจดี', time: '5 นาที', icon: ShoppingCart, color: 'blue' },
  { type: 'payment', message: 'ชำระเงินสำเร็จ ฿2,500 จาก สมหญิง รักเรียน', time: '12 นาที', icon: CreditCard, color: 'green' },
  { type: 'user', message: 'สมาชิกใหม่ลงทะเบียน: ภูมิ สร้างชาติ', time: '25 นาที', icon: Users, color: 'purple' },
  { type: 'lotto', message: 'ซื้อตั๋ว Powerball สำเร็จ 10 ใบ', time: '45 นาที', icon: Ticket, color: 'yellow' },
  { type: 'alert', message: 'ยอดเงินในระบบต่ำกว่า ฿50,000', time: '1 ชม.', icon: AlertTriangle, color: 'red' },
  { type: 'win', message: '🎉 ลูกค้าถูกรางวัล! วิชัย มั่นคง ถูก $500', time: '2 ชม.', icon: Award, color: 'gold' },
];

const DEVICE_STATS = [
  { device: 'Mobile', percent: 65, icon: Smartphone, color: '#3B82F6' },
  { device: 'Desktop', percent: 28, icon: Monitor, color: '#8B5CF6' },
  { device: 'Tablet', percent: 7, icon: LayoutDashboard, color: '#10B981' },
];

const COUNTRY_STATS = [
  { country: 'Thailand', users: 1180, percent: 83 },
  { country: 'USA', users: 125, percent: 9 },
  { country: 'Japan', users: 58, percent: 4 },
  { country: 'Others', users: 57, percent: 4 },
];

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, showToast } = useGlobal();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Real data states
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    lottoRevenue: 0,
    marketplaceRevenue: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    totalReferrals: 0,
    completedReferrals: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lottoStats, setLottoStats] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [deviceStats, setDeviceStats] = useState<any[]>([]);
  const [countryStats, setCountryStats] = useState<any[]>([]);
  const [revenueComparison, setRevenueComparison] = useState({ change: 0, amount: 0 });
  const [ordersComparison, setOrdersComparison] = useState({ change: 0, todayCount: 0 });
  const [usersComparison, setUsersComparison] = useState({ change: 0, active: 0, activePercent: 0 });
  const [sellersCount, setSellersCount] = useState<number>(0);

  // Sidebar Menu Items (moved inside component to access sellersCount)
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
        { name: 'OCR สแกนตั๋ว', icon: ScanLine, path: '/admin/ocr-scanner', badge: 'New' },
      ]
    },
    {
      title: 'จัดการระบบ',
      items: [
        { name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: null },
        { name: 'Seller Management', icon: Package, path: '/admin/sellers', badge: sellersCount > 0 ? sellersCount.toString() : null },
        { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null },
        { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null },
        { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null },
        { name: 'กิจกรรมประจำวัน', icon: Trophy, path: '/admin/missions', badge: null },
        { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null },
        { name: 'Admin management', icon: Shield, path: '/admin/management', badge: null },
      ]
    },
    {
      title: 'เนื้อหาเว็บไซต์',
      items: [
        { name: 'Hero & Banners', icon: Image, path: '/admin', badge: null },
        { name: 'Payment Gateway', icon: CreditCard, path: '/admin/payment-settings', badge: null },
        { name: 'ตั้งราคาตั๋ว', icon: DollarSign, path: '/admin/ticket-pricing', badge: null },
        { name: 'Exchange Rate', icon: TrendingUp, path: '/admin/exchange-rate', badge: null },
        { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
      ]
    }
  ];

  // Load real data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        adminStats, 
        monthlyRevenue, 
        daily, 
        growth, 
        orders, 
        allReferrals,
        categories,
        topProds,
        lotto,
        activities,
        devices,
        countries,
        sellers
      ] = await Promise.all([
        getAdminStats(),
        getRevenueByMonth(),
        getDailySales(),
        getUserGrowth(),
        getRecentOrders(10),
        getAllReferrals(),
        getCategoryBreakdown(),
        getTopProducts(),
        getLottoStats(),
        getRecentActivities(),
        getDeviceStats(),
        getCountryStats(),
        getAllSellers()
      ]);

      setStats(adminStats);
      setRevenueData(monthlyRevenue.length > 0 ? monthlyRevenue : []);
      setDailySales(daily.length > 0 ? daily : []);
      setUserGrowth(growth.length > 0 ? growth : []);
      setRecentOrders(orders);
      setReferrals(allReferrals.slice(0, 10)); // Show latest 10 referrals
      setCategoryData(categories.length > 0 ? categories : []);
      setTopProducts(topProds.length > 0 ? topProds : []);
      setLottoStats(lotto.length > 0 ? lotto : []);
      setRecentActivities(activities.length > 0 ? activities : []);
      setDeviceStats(devices);
      setCountryStats(countries);
      setSellersCount(sellers.length);

      // Calculate comparisons
      if (monthlyRevenue.length >= 2) {
        const thisMonth = monthlyRevenue[monthlyRevenue.length - 1].total || 0;
        const lastMonth = monthlyRevenue[monthlyRevenue.length - 2].total || 0;
        const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
        setRevenueComparison({ change, amount: thisMonth - lastMonth });
      }

      // Calculate today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter((order: any) => {
        const orderDate = order.date ? new Date(order.date) : new Date(order.createdAt);
        return orderDate >= today;
      });
      setOrdersComparison({ change: 0, todayCount: todayOrders.length });

      // Calculate active users (users who placed orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = new Set();
      orders.forEach((order: any) => {
        const orderDate = order.date ? new Date(order.date) : new Date(order.createdAt);
        if (orderDate >= thirtyDaysAgo && order.userId) {
          activeUsers.add(order.userId);
        }
      });
      const activeCount = activeUsers.size;
      const totalUsers = adminStats.totalUsers || 1;
      const activePercent = Math.round((activeCount / totalUsers) * 100);
      setUsersComparison({ change: 0, active: activeCount, activePercent });
    } catch (error) {
      console.error('Error loading admin data:', error);
      showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    }
    setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'purchased': return 'bg-purple-100 text-purple-700';
      case 'shipped': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอชำระ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'paid': return 'ชำระแล้ว';
      case 'purchased': return 'ซื้อแล้ว';
      case 'shipped': return 'จัดส่งแล้ว';
      default: return status;
    }
  };

  // Destructure stats for easier use
  const {
    totalRevenue,
    totalOrders,
    totalUsers,
    lottoRevenue,
    marketplaceRevenue,
    conversionRate,
    avgOrderValue
  } = stats;

  return (
    <div className="flex min-h-screen bg-slate-100">
      
      {/* Sidebar - Fixed Left */}
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
            const visibleItems = section.items.filter((item) => canSeeAdminNavPath(user?.role, item.path));
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
                  const isActive = location.pathname === item.path;
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

        {/* Footer */}
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
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="text-brand-gold" size={28} />
                  Dashboard Overview
                </h1>
                <p className="text-sm text-slate-500 mt-1">ภาพรวมและสถิติการขายทั้งหมด</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Period Selector */}
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {['today', 'week', 'month', 'year'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedPeriod === period
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {period === 'today' ? 'วันนี้' : period === 'week' ? 'สัปดาห์' : period === 'month' ? 'เดือน' : 'ปี'}
                    </button>
                  ))}
                </div>
                
                {/* Actions */}
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
                  <Bell size={20} className="text-slate-600" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <RefreshCw size={20} className="text-slate-600" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <Download size={16} />
                  <span className="text-sm font-medium">Export</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          
          {/* Key Metrics - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <DollarSign size={120} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <DollarSign size={24} />
                  </div>
                  {revenueComparison.change !== 0 && (
                    <div className={`flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full`}>
                      {revenueComparison.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{revenueComparison.change > 0 ? '+' : ''}{revenueComparison.change.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <p className="text-sm opacity-90 font-medium">รายได้รวม</p>
                <p className="text-3xl font-black mt-1">฿{totalRevenue.toLocaleString()}</p>
                {revenueComparison.amount !== 0 && (
                  <p className="text-xs opacity-75 mt-2">
                    เทียบกับเดือนที่แล้ว {revenueComparison.amount > 0 ? '+' : ''}฿{Math.abs(revenueComparison.amount).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <ShoppingCart size={120} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <ShoppingCart size={24} />
                  </div>
                  {ordersComparison.todayCount > 0 && (
                    <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                      <TrendingUp size={14} />
                      <span>+{ordersComparison.todayCount}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm opacity-90 font-medium">คำสั่งซื้อทั้งหมด</p>
                <p className="text-3xl font-black mt-1">{totalOrders.toLocaleString()}</p>
                {ordersComparison.todayCount > 0 && (
                  <p className="text-xs opacity-75 mt-2">วันนี้ +{ordersComparison.todayCount} orders</p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <Users size={120} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Users size={24} />
                  </div>
                  {usersComparison.activePercent > 0 && (
                    <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                      <TrendingUp size={14} />
                      <span>{usersComparison.activePercent}%</span>
                    </div>
                  )}
                </div>
                <p className="text-sm opacity-90 font-medium">ผู้ใช้งานทั้งหมด</p>
                <p className="text-3xl font-black mt-1">{totalUsers.toLocaleString()}</p>
                <p className="text-xs opacity-75 mt-2">Active: {usersComparison.active.toLocaleString()} ({usersComparison.activePercent || 0}%)</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <Ticket size={120} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Ticket size={24} />
                  </div>
                </div>
                <p className="text-sm opacity-90 font-medium">Lotto Revenue</p>
                <p className="text-3xl font-black mt-1">฿{lottoRevenue.toLocaleString()}</p>
                {totalRevenue > 0 && (
                  <p className="text-xs opacity-75 mt-2">
                    {Math.round((lottoRevenue / totalRevenue) * 100)}% ของรายได้รวม
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Target className="text-cyan-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Conversion Rate</p>
                  <p className="text-xl font-black text-slate-900">{conversionRate}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Wallet className="text-pink-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Order Value</p>
                  <p className="text-xl font-black text-slate-900">฿{avgOrderValue}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Award className="text-amber-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">ลูกค้าถูกรางวัล</p>
                  <p className="text-xl font-black text-slate-900">{stats.completedReferrals} คน</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Zap className="text-emerald-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">เงินรางวัลจ่าย</p>
                  <p className="text-xl font-black text-slate-900">฿{stats.paidCommission?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">รายได้รายเดือน</h3>
                  <p className="text-sm text-slate-500">เปรียบเทียบ Lotto และ Marketplace</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <span className="text-slate-600">Lotto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600">Marketplace</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueData.length > 0 ? revenueData : []}>
                  <defs>
                    <linearGradient id="colorLotto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMarketplace" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [`฿${value.toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="lotto" stroke="#F59E0B" strokeWidth={3} fill="url(#colorLotto)" name="สินค้าพิเศษ" />
                  <Area type="monotone" dataKey="marketplace" stroke="#3B82F6" strokeWidth={3} fill="url(#colorMarketplace)" name="Marketplace" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">สัดส่วนรายได้</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData.length > 0 ? categoryData : CATEGORY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {(categoryData.length > 0 ? categoryData : CATEGORY_DATA).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`฿${value.toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {(categoryData.length > 0 ? categoryData : CATEGORY_DATA).slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lotto Stats & Daily Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Lotto Overview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">🎟️ สถานะ Lotto วันนี้</h3>
                <Link to="/admin/lotto-orders" className="text-sm text-brand-gold hover:underline font-medium flex items-center gap-1">
                  ดูทั้งหมด <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4 text-slate-500">กำลังโหลดข้อมูล...</div>
                ) : (lottoStats.length > 0 ? lottoStats : LOTTO_STATS).map((lotto, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-slate-900">{lotto.name}</span>
                      <span className="text-sm text-slate-500">{lotto.pending + lotto.purchased + lotto.won + lotto.paid} orders</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center p-2 bg-yellow-100 rounded-lg">
                        <div className="text-lg font-black text-yellow-700">{lotto.pending}</div>
                        <div className="text-xs text-yellow-600">รอซื้อ</div>
                      </div>
                      <div className="text-center p-2 bg-purple-100 rounded-lg">
                        <div className="text-lg font-black text-purple-700">{lotto.purchased}</div>
                        <div className="text-xs text-purple-600">ซื้อแล้ว</div>
                      </div>
                      <div className="text-center p-2 bg-green-100 rounded-lg">
                        <div className="text-lg font-black text-green-700">{lotto.won}</div>
                        <div className="text-xs text-green-600">ถูกรางวัล</div>
                      </div>
                      <div className="text-center p-2 bg-blue-100 rounded-lg">
                        <div className="text-lg font-black text-blue-700">{lotto.paid}</div>
                        <div className="text-xs text-blue-600">จ่ายแล้ว</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Sales Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">📈 ยอดขายรายวัน</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={dailySales.length > 0 ? dailySales : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="left" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar yAxisId="left" dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={3} name="Revenue" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders & Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">🛒 คำสั่งซื้อล่าสุด</h3>
                <Link to="/admin/lotto-orders" className="text-sm text-brand-gold hover:underline font-medium flex items-center gap-1">
                  ดูทั้งหมด <ChevronRight size={14} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">ลูกค้า</th>
                      <th className="pb-3">สินค้า</th>
                      <th className="pb-3">ยอด</th>
                      <th className="pb-3">สถานะ</th>
                      <th className="pb-3">เวลา</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          กำลังโหลดข้อมูล...
                        </td>
                      </tr>
                    ) : recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          ยังไม่มีคำสั่งซื้อ
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3">
                            <span className={`text-sm font-mono ${order.type === 'lotto' ? 'text-yellow-600' : 'text-blue-600'}`}>
                              {order.id}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-sm font-medium text-slate-900">
                              {order.items && order.items.length > 0 ? 'Customer' : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-sm text-slate-600">
                              {order.type === 'lotto' ? 'สินค้าพิเศษ Ticket' : order.items?.length > 0 ? `${order.items.length} items` : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-sm font-bold text-slate-900">฿{order.total?.toLocaleString() || '0'}</span>
                          </td>
                          <td className="py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status || 'pending')}`}>
                              {getStatusText(order.status || 'pending')}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-xs text-slate-500">
                              {order.date ? new Date(order.date).toLocaleString('th-TH') : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">🔔 กิจกรรมล่าสุด</h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-slate-500">กำลังโหลดข้อมูล...</div>
                ) : (recentActivities.length > 0 ? recentActivities : RECENT_ACTIVITIES).map((activity, index) => {
                  const Icon = activity.icon === 'ShoppingCart' ? ShoppingCart :
                              activity.icon === 'Users' ? Users :
                              activity.icon === 'CreditCard' ? CreditCard :
                              activity.icon === 'Ticket' ? Ticket :
                              activity.icon === 'AlertTriangle' ? AlertTriangle :
                              activity.icon === 'Award' ? Award : activity.icon;
                  const colorClasses: Record<string, string> = {
                    blue: 'bg-blue-100 text-blue-600',
                    green: 'bg-green-100 text-green-600',
                    purple: 'bg-purple-100 text-purple-600',
                    yellow: 'bg-yellow-100 text-yellow-600',
                    red: 'bg-red-100 text-red-600',
                    gold: 'bg-amber-100 text-amber-600',
                  };
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[activity.color]}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-tight">{activity.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Products & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top Products */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">🏆 สินค้าขายดี Top 8</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-slate-500">กำลังโหลดข้อมูล...</div>
                ) : (topProducts.length > 0 ? topProducts : TOP_PRODUCTS).map((product, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-black text-white ${
                      index < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-slate-400'
                    }`}>
                      #{product.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{product.name}</div>
                      <div className="text-sm text-slate-500">{product.sales} ชิ้น</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-green-600">฿{product.revenue.toLocaleString()}</div>
                      <div className={`text-xs flex items-center justify-end gap-1 ${product.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {product.growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(product.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device & Location Stats */}
            <div className="space-y-6">
              {/* Device Stats */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">📱 อุปกรณ์ที่ใช้</h3>
                <div className="space-y-3">
                  {deviceStats.length > 0 ? deviceStats.map((device, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '16px' }}>{device.icon}</span>
                          <span className="text-sm text-slate-600">{device.device}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{device.percent}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${device.percent}%`, backgroundColor: device.color }}
                        ></div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-4">ไม่มีข้อมูล</p>
                  )}
                </div>
              </div>

              {/* Country Stats */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">🌍 ผู้ใช้ตามประเทศ</h3>
                <div className="space-y-3">
                  {countryStats.length > 0 ? countryStats.map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{country.country}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{country.users}</span>
                        <span className="text-xs text-slate-400">({country.percent}%)</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-4">ไม่มีข้อมูล</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Growth & Traffic */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">👥 การเติบโตของผู้ใช้</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={userGrowth.length > 0 ? userGrowth : []}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={3} fill="url(#colorUsers)" name="ผู้ใช้ทั้งหมด" />
                  <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Active Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Hourly Traffic */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">⏰ Traffic ตามชั่วโมง (วันนี้)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={HOURLY_TRAFFIC}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="hour" stroke="#64748B" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="visitors" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Visitors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Referral History Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="text-brand-gold" size={20} />
                Referral History
              </h3>
              <Link to="/admin/referrals" className="text-sm text-brand-gold hover:underline font-medium flex items-center gap-1">
                ดูทั้งหมด <ChevronRight size={14} />
              </Link>
            </div>
            
            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <Users className="text-purple-600" size={24} />
                  <div>
                    <p className="text-xs text-purple-600 font-bold uppercase">Total Referrals</p>
                    <p className="text-2xl font-black text-purple-900">{stats.totalReferrals}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={24} />
                  <div>
                    <p className="text-xs text-green-600 font-bold uppercase">Completed</p>
                    <p className="text-2xl font-black text-green-900">{stats.completedReferrals}</p>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-amber-600" size={24} />
                  <div>
                    <p className="text-xs text-amber-600 font-bold uppercase">Total Commission</p>
                    <p className="text-2xl font-black text-amber-900">฿{stats.totalCommission.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-600" size={24} />
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase">Pending</p>
                    <p className="text-2xl font-black text-blue-900">฿{stats.pendingCommission.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Referrals Table */}
            {loading ? (
              <div className="text-center py-8 text-slate-500">กำลังโหลดข้อมูล...</div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">ยังไม่มีข้อมูล Referral</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-3">ผู้แนะนำ</th>
                      <th className="pb-3">ผู้ถูกแนะนำ</th>
                      <th className="pb-3">ยอดใช้จ่าย</th>
                      <th className="pb-3">ค่าคอมมิชชั่น</th>
                      <th className="pb-3">สถานะ</th>
                      <th className="pb-3">วันที่</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referrals.slice(0, 10).map((referral) => (
                      <tr key={referral.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{referral.referrerName || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{referral.referrerEmail || ''}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{referral.referredUserName || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{referral.referredUserEmail || ''}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-sm font-bold text-slate-900">
                            ฿{((referral.orderValue || 0) / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-sm font-bold text-green-600">
                            ฿{((referral.commission || 0) / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            referral.status === 'completed' 
                              ? 'bg-green-100 text-green-700'
                              : referral.commissionPaid
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {referral.status === 'completed' ? 'สำเร็จ' : referral.commissionPaid ? 'จ่ายแล้ว' : 'รอจ่าย'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-xs text-slate-500">
                            {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString('th-TH') : 'N/A'}
                          </span>
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

export default AdminDashboard;
