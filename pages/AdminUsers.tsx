import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Download, Eye, Shield, Ban, CheckCircle, XCircle, Mail, Phone, 
  MapPin, TrendingUp, Calendar, DollarSign, ShoppingBag, Clock, Users, Wallet, BarChart3, 
  Home, Camera, HardDrive, Ticket, Image, CreditCard, Settings, ChevronRight, ScanLine, Award, Package, LogOut, FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getAllUsers, getAllOrders } from '../services/adminService';
import { getUserOrders } from '../services/orderService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
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
      { name: 'ผู้ใช้งาน', icon: Users, path: '/admin/users', badge: '3', isActive: true },
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
      { name: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings', badge: null },
    ]
  }
];

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinedDate: string;
  status: 'active' | 'blocked' | 'pending';
  kycStatus: 'approved' | 'pending' | 'rejected' | 'not_submitted';
  totalOrders: number;
  totalSpent: number;
  role: 'customer' | 'seller' | 'admin';
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'สมชาย ใจดี',
    email: 'somchai@email.com',
    phone: '081-234-5678',
    location: 'กรุงเทพมหานคร',
    joinedDate: '2025-01-15',
    status: 'active',
    kycStatus: 'approved',
    totalOrders: 12,
    totalSpent: 15500,
    role: 'customer',
  },
  {
    id: '2',
    name: 'สมหญิง รักสวย',
    email: 'somying@email.com',
    phone: '082-345-6789',
    location: 'เชียงใหม่',
    joinedDate: '2025-02-20',
    status: 'active',
    kycStatus: 'pending',
    totalOrders: 8,
    totalSpent: 8900,
    role: 'customer',
  },
  {
    id: '3',
    name: 'วิชัย มั่งมี',
    email: 'wichai@email.com',
    phone: '083-456-7890',
    location: 'ภูเก็ต',
    joinedDate: '2025-03-10',
    status: 'blocked',
    kycStatus: 'rejected',
    totalOrders: 3,
    totalSpent: 2100,
    role: 'customer',
  },
  {
    id: '4',
    name: 'นภา สุขสันต์',
    email: 'napa@email.com',
    phone: '084-567-8901',
    location: 'ขอนแก่น',
    joinedDate: '2025-04-05',
    status: 'pending',
    kycStatus: 'not_submitted',
    totalOrders: 0,
    totalSpent: 0,
    role: 'customer',
  },
  {
    id: '5',
    name: 'กมล ยิ้มสู้',
    email: 'kamol@email.com',
    phone: '085-678-9012',
    location: 'สงขลา',
    joinedDate: '2025-03-22',
    status: 'active',
    kycStatus: 'approved',
    totalOrders: 25,
    totalSpent: 45000,
    role: 'customer',
  },
  {
    id: '6',
    name: 'ธนิดา รักดี',
    email: 'thanida@email.com',
    phone: '086-789-0123',
    location: 'เชียงราย',
    joinedDate: '2025-02-01',
    status: 'active',
    kycStatus: 'approved',
    totalOrders: 18,
    totalSpent: 32500,
    role: 'customer',
  },
];

export const AdminUsers: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast, logout, user } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterKYC, setFilterKYC] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [firestoreUsers, allOrders] = await Promise.all([
        getAllUsers(),
        getAllOrders()
      ]);

      // Calculate orders and spending for each user
      const usersWithStats: User[] = await Promise.all(
        firestoreUsers.map(async (firestoreUser: any) => {
          const userId = firestoreUser.id || firestoreUser.uid;
          
          // Get user orders
          const userOrders = allOrders.filter((order: any) => {
            const orderUserId = order.userId || order.user?.id;
            return orderUserId === userId;
          });

          const totalOrders = userOrders.length;
          const totalSpent = userOrders.reduce((sum: number, order: any) => {
            return sum + (order.total || 0);
          }, 0);

          // Get location from user data or set default
          const location = firestoreUser.location || 
                          firestoreUser.address?.province || 
                          firestoreUser.address?.city || 
                          'ไม่ระบุ';

          // Get phone from user data
          const phone = firestoreUser.phone || 
                       firestoreUser.phoneNumber || 
                       'ไม่ระบุ';

          // Format joinedDate - safely handle date conversion
          let joinedDate = new Date().toISOString().split('T')[0]; // Default to today
          try {
            const createdAt = firestoreUser.createdAt || firestoreUser.memberSince;
            if (createdAt) {
              const dateObj = typeof createdAt === 'string' 
                ? new Date(createdAt) 
                : createdAt.toDate 
                ? createdAt.toDate() 
                : new Date(createdAt);
              
              // Check if date is valid
              if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                joinedDate = dateObj.toISOString().split('T')[0];
              }
            }
          } catch (error) {
            console.warn('Error parsing date for user:', userId, error);
            // Use default date
          }

          return {
            id: userId,
            name: firestoreUser.name || firestoreUser.displayName || 'ไม่ระบุชื่อ',
            email: firestoreUser.email || 'ไม่ระบุอีเมล',
            phone: phone,
            location: location,
            joinedDate: joinedDate,
            status: (firestoreUser.status || 'active') as User['status'],
            kycStatus: (firestoreUser.kycStatus || 'not_submitted') as User['kycStatus'],
            totalOrders: totalOrders,
            totalSpent: totalSpent,
            role: (firestoreUser.role || 'customer') as User['role']
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('ไม่สามารถโหลดข้อมูลผู้ใช้ได้', 'error');
      // Use mock data as fallback
      setUsers(MOCK_USERS);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={14} />, label: 'Active' },
      blocked: { bg: 'bg-red-100', text: 'text-red-800', icon: <Ban size={14} />, label: 'Blocked' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={14} />, label: 'Pending' },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getKYCBadge = (status: string) => {
    const badges = {
      approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <Shield size={14} />, label: 'ผ่าน' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={14} />, label: 'รอตรวจสอบ' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle size={14} />, label: 'ไม่ผ่าน' },
      not_submitted: { bg: 'bg-slate-100', text: 'text-slate-800', icon: <XCircle size={14} />, label: 'ยังไม่ส่ง' },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.phone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchKYC = filterKYC === 'all' || user.kycStatus === filterKYC;
    return matchSearch && matchStatus && matchKYC;
  });

  const updateUserStatus = async (userId: string, newStatus: User['status']) => {
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      setSelectedUser(null);
      showToast(`อัพเดทสถานะผู้ใช้เป็น ${newStatus} เรียบร้อย`, 'success');
    } catch (error) {
      console.error('Error updating user status:', error);
      showToast('เกิดข้อผิดพลาดในการอัพเดทสถานะ', 'error');
    }
  };

  const updateKYCStatus = async (userId: string, newStatus: User['kycStatus']) => {
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', userId), {
        kycStatus: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, kycStatus: newStatus } : user
      ));
      setSelectedUser(null);
      showToast(`อัพเดทสถานะ KYC เป็น ${newStatus} เรียบร้อย`, 'success');
    } catch (error) {
      console.error('Error updating KYC status:', error);
      showToast('เกิดข้อผิดพลาดในการอัพเดทสถานะ KYC', 'error');
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

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingKYC = users.filter(u => u.kycStatus === 'pending').length;
  const blockedUsers = users.filter(u => u.status === 'blocked').length;

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
                  <Users className="text-brand-gold" size={28} />
                  จัดการผู้ใช้งาน
                </h1>
                <p className="text-sm text-slate-500 mt-1">User Management - ดูแลและจัดการสมาชิก</p>
              </div>
              <Button className="gap-2 shadow-lg">
                <Download size={18} />
                Export Users
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
                  <p className="text-sm text-slate-500 font-medium">ผู้ใช้ทั้งหมด</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{totalUsers}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ผู้ใช้งานปกติ</p>
                  <p className="text-3xl font-black text-green-600 mt-1">{activeUsers}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">รอตรวจสอบ KYC</p>
                  <p className="text-3xl font-black text-yellow-600 mt-1">{pendingKYC}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ถูกบล็อก</p>
                  <p className="text-3xl font-black text-red-600 mt-1">{blockedUsers}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Ban className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                  disabled={loading}
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent appearance-none bg-white outline-none"
                  disabled={loading}
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* KYC Filter */}
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <select
                  value={filterKYC}
                  onChange={(e) => setFilterKYC(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent appearance-none bg-white outline-none"
                  disabled={loading}
                >
                  <option value="all">KYC ทั้งหมด</option>
                  <option value="approved">ผ่านแล้ว</option>
                  <option value="pending">รอตรวจสอบ</option>
                  <option value="rejected">ไม่ผ่าน</option>
                  <option value="not_submitted">ยังไม่ส่ง</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ผู้ใช้</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ติดต่อ</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">สถานที่</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">KYC</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">คำสั่งซื้อ</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ยอดซื้อ</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                            <span>กำลังโหลดข้อมูล...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          ไม่พบข้อมูลผู้ใช้
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar size={12} />
                              {user.joinedDate}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Mail size={14} />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Phone size={14} />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin size={14} />
                          {user.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getKYCBadge(user.kycStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                          <ShoppingBag size={14} />
                          {user.totalOrders}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-600">฿{user.totalSpent.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-brand-navy"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                    ))
                    )}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">ไม่พบผู้ใช้งาน</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-brand-gold p-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">รายละเอียดผู้ใช้</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-black/10 rounded-lg">
                <XCircle className="text-slate-900" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-full flex items-center justify-center text-white font-black text-2xl">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedUser.name}</h4>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">สถานะบัญชี</label>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">สถานะ KYC</label>
                  <div className="mt-1">{getKYCBadge(selectedUser.kycStatus)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">เบอร์โทร</label>
                  <div className="text-lg font-bold text-slate-900 mt-1">{selectedUser.phone}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">สถานที่</label>
                  <div className="text-lg font-bold text-slate-900 mt-1">{selectedUser.location}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">คำสั่งซื้อทั้งหมด</label>
                  <div className="text-2xl font-black text-slate-900 mt-1">{selectedUser.totalOrders}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">ยอดซื้อรวม</label>
                  <div className="text-2xl font-black text-green-600 mt-1">฿{selectedUser.totalSpent.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">จัดการผู้ใช้</label>
                <div className="space-y-2">
                  {selectedUser.kycStatus === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => updateKYCStatus(selectedUser.id, 'approved')} className="w-full bg-green-600">
                        อนุมัติ KYC
                      </Button>
                      <Button onClick={() => updateKYCStatus(selectedUser.id, 'rejected')} variant="outline" className="w-full border-red-300 text-red-600">
                        ปฏิเสธ KYC
                      </Button>
                    </div>
                  )}
                  {selectedUser.status === 'active' ? (
                    <Button onClick={() => updateUserStatus(selectedUser.id, 'blocked')} variant="outline" className="w-full border-red-300 text-red-600">
                      <Ban size={18} />
                      บล็อกผู้ใช้
                    </Button>
                  ) : selectedUser.status === 'blocked' ? (
                    <Button onClick={() => updateUserStatus(selectedUser.id, 'active')} className="w-full bg-green-600">
                      <CheckCircle size={18} />
                      ปลดบล็อก
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
