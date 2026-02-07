import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Download, Eye, DollarSign, CreditCard, CheckCircle, Clock, 
  XCircle, RefreshCw, AlertCircle, Users, Wallet, BarChart3, Home, Camera, 
  HardDrive, Ticket, Image, Settings, ChevronRight, MapPin, TrendingUp, 
  TrendingDown, ArrowUpRight, ArrowDownRight, Banknote, ScanLine, Award, Package, LogOut, FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getAllPayments, getAllLottoOrders, getAllOrders } from '../services/adminService';
import { getAllUsers } from '../services/adminService';
import { useGlobal } from '../context/GlobalContext';
import { adminPaymentAPI } from '../services/api';
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
      { name: 'การเงิน', icon: Wallet, path: '/admin/payments', badge: null, isActive: true },
      { name: 'การออกบิล', icon: FileText, path: '/admin/billing', badge: null },
      { name: 'Referral System', icon: Award, path: '/admin/referrals', badge: null },
      { name: 'Location Analytics', icon: MapPin, path: '/admin/location', badge: null },
      { name: 'Admin management', icon: Settings, path: '/admin/management', badge: null },
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

interface Payment {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  method: 'credit_card' | 'promptpay' | 'bank_transfer';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  type: 'purchase' | 'payout' | 'refund';
  date: string;
  transactionId: string;
}

const MOCK_PAYMENTS: Payment[] = [
  {
    id: '1',
    orderNumber: 'LTO-2025-123456',
    customerName: 'สมชาย ใจดี',
    amount: 525,
    method: 'credit_card',
    status: 'completed',
    type: 'purchase',
    date: '2025-12-10 10:30:00',
    transactionId: 'txn_abc123xyz',
  },
  {
    id: '2',
    orderNumber: 'LTO-2025-123457',
    customerName: 'สมหญิง รักสวย',
    amount: 50000,
    method: 'bank_transfer',
    status: 'completed',
    type: 'payout',
    date: '2025-12-09 14:20:00',
    transactionId: 'txn_def456uvw',
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-789012',
    customerName: 'วิชัย มั่งมี',
    amount: 2500,
    method: 'promptpay',
    status: 'pending',
    type: 'purchase',
    date: '2025-12-10 16:45:00',
    transactionId: 'txn_ghi789rst',
  },
  {
    id: '4',
    orderNumber: 'LTO-2025-123458',
    customerName: 'นภา สุขสันต์',
    amount: 156,
    method: 'credit_card',
    status: 'failed',
    type: 'purchase',
    date: '2025-12-10 18:00:00',
    transactionId: 'txn_jkl012mno',
  },
  {
    id: '5',
    orderNumber: 'ORD-2025-555666',
    customerName: 'ประยุทธ สมหวัง',
    amount: 850,
    method: 'credit_card',
    status: 'refunded',
    type: 'refund',
    date: '2025-12-08 11:15:00',
    transactionId: 'txn_pqr345stu',
  },
  {
    id: '6',
    orderNumber: 'LTO-2025-999888',
    customerName: 'กมล ยิ้มสู้',
    amount: 3500,
    method: 'promptpay',
    status: 'completed',
    type: 'purchase',
    date: '2025-12-11 09:15:00',
    transactionId: 'txn_abc999xyz',
  },
  {
    id: '7',
    orderNumber: 'LTO-2025-777666',
    customerName: 'ธนิดา รักดี',
    amount: 1200,
    method: 'bank_transfer',
    status: 'completed',
    type: 'purchase',
    date: '2025-12-11 11:45:00',
    transactionId: 'txn_def777uvw',
  },
];

export const AdminPayments: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast, logout, user } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const [firestorePayments, users, allOrders] = await Promise.all([
        getAllPayments(),
        getAllUsers(),
        getAllOrders()
      ]);

      // Create user lookup map
      const userMap = new Map();
      users.forEach((user: any) => {
        userMap.set(user.id, user);
      });

      // Get all lotto orders to extract payment info
      const lottoOrders = await getAllLottoOrders();

      // Combine all orders (marketplace + lotto)
      const allOrdersCombined = [...allOrders, ...lottoOrders];

      // Transform Firestore payments to Payment format
      const transformedPayments: Payment[] = await Promise.all(
        firestorePayments.map(async (paymentData: any) => {
          // Get customer name from user data
          let customerName = 'ไม่ระบุชื่อ';
          if (paymentData.userId) {
            const user = userMap.get(paymentData.userId);
            if (user) {
              customerName = user.name || user.displayName || user.email || customerName;
            }
          }

          // Format date safely
          const formatDate = (dateValue: any): string => {
            if (!dateValue) return new Date().toISOString();
            try {
              if (typeof dateValue === 'string') {
                const date = new Date(dateValue);
                return isNaN(date.getTime()) ? new Date().toISOString() : dateValue;
              } else if (dateValue.toDate) {
                return dateValue.toDate().toISOString();
              } else if (dateValue instanceof Date) {
                return dateValue.toISOString();
              }
              return new Date().toISOString();
            } catch {
              return new Date().toISOString();
            }
          };

          const paymentDate = formatDate(paymentData.date || paymentData.createdAt || paymentData.paidAt);
          const formattedDate = paymentDate.includes('T') 
            ? paymentDate.replace('T', ' ').split('.')[0]
            : paymentDate;

          // Get order number
          const orderNumber = paymentData.orderNumber || 
                            paymentData.order_number || 
                            paymentData.orderId ||
                            `PAY-${paymentData.id?.substring(0, 8)}`;

          // Get transaction ID - prioritize Stripe payment intent ID
          const transactionId = paymentData.stripePaymentIntentId ||
                              paymentData.paymentIntentId ||
                              paymentData.transactionId || 
                              paymentData.transaction_id ||
                              paymentData.payment_reference ||
                              paymentData.provider_transaction_id ||
                              `txn_${paymentData.id}`;

          // Determine payment type
          let paymentType: 'purchase' | 'payout' | 'refund' = paymentData.type || 'purchase';
          if (paymentData.orderType === 'referral' || paymentData.referralId) {
            paymentType = 'payout';
          }

          // Determine payment status from Stripe or Firestore
          let paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded' = 'pending';
          
          // Check Stripe payment intent status if available
          if (paymentData.stripePaymentIntentId || paymentData.paymentIntentId) {
            try {
              const paymentIntentId = paymentData.stripePaymentIntentId || paymentData.paymentIntentId;
              const response = await adminPaymentAPI.getPaymentIntentStatus(paymentIntentId);
              if (response.status === 'succeeded') {
                paymentStatus = 'completed';
              } else if (response.status === 'failed' || response.status === 'canceled') {
                paymentStatus = 'failed';
              } else if (response.status === 'requires_payment_method' || response.status === 'requires_action') {
                paymentStatus = 'pending';
              }
            } catch (stripeError) {
              console.warn('Error checking Stripe status:', stripeError);
              // Fallback to Firestore status
              if (paymentData.paymentInfo?.paymentStatus === 'paid' || paymentData.paymentStatus === 'paid') {
                paymentStatus = 'completed';
              } else if (paymentData.paymentInfo?.paymentStatus === 'failed' || paymentData.paymentStatus === 'failed') {
                paymentStatus = 'failed';
              } else if (paymentData.status) {
                paymentStatus = paymentData.status as Payment['status'];
              }
            }
          } else {
            // Use Firestore status if no Stripe payment intent
            if (paymentData.paymentInfo?.paymentStatus === 'paid' || paymentData.paymentStatus === 'paid') {
              paymentStatus = 'completed';
            } else if (paymentData.paymentInfo?.paymentStatus === 'failed' || paymentData.paymentStatus === 'failed') {
              paymentStatus = 'failed';
            } else if (paymentData.status) {
              paymentStatus = paymentData.status as Payment['status'];
            }
          }

          // Get payment method
          let paymentMethod: 'credit_card' | 'promptpay' | 'bank_transfer' = 'bank_transfer';
          const method = paymentData.method || paymentData.payment_method || paymentData.paymentMethod || paymentData.paymentInfo?.paymentMethod;
          if (method === 'credit_card' || method === 'card' || method === 'stripe' || method === 'stripe_checkout') {
            paymentMethod = 'credit_card';
          } else if (method === 'promptpay' || method === 'prompt_pay') {
            paymentMethod = 'promptpay';
          } else if (method === 'bank_transfer' || method === 'bank' || method === 'transfer') {
            paymentMethod = 'bank_transfer';
          }

          return {
            id: paymentData.id,
            orderNumber,
            customerName,
            amount: paymentData.amount || paymentData.amountThb || paymentData.amount_thb || paymentData.total || 0,
            method: paymentMethod,
            status: paymentStatus,
            type: paymentType,
            date: formattedDate,
            transactionId
          };
        })
      );

      // Also extract payments from orders that have payment info (broader filter)
      const hasPaymentData = (o: any) => o.paymentInfo || o.payment || o.stripePaymentIntentId || 
        o.paymentIntentId || o.paymentMethod || (o.total && o.status) || o.totalAmount;
      const orderPayments: Payment[] = await Promise.all(
        allOrdersCombined
          .filter((order: any) => hasPaymentData(order))
          .map(async (order: any) => {
            let customerName = 'ไม่ระบุชื่อ';
            if (order.userId) {
              const user = userMap.get(order.userId);
              if (user) {
                customerName = user.name || user.displayName || user.email || customerName;
              }
            } else if (order.customerName) {
              customerName = order.customerName;
            }

            const formatDate = (dateValue: any): string => {
              if (!dateValue) return new Date().toISOString();
              try {
                if (typeof dateValue === 'string') {
                  const date = new Date(dateValue);
                  return isNaN(date.getTime()) ? new Date().toISOString() : dateValue;
                } else if (dateValue.toDate) {
                  return dateValue.toDate().toISOString();
                } else if (dateValue instanceof Date) {
                  return dateValue.toISOString();
                }
                return new Date().toISOString();
              } catch {
                return new Date().toISOString();
              }
            };

            const paymentDate = formatDate(order.date || order.createdAt || order.paidAt);
            const formattedDate = paymentDate.includes('T') 
              ? paymentDate.replace('T', ' ').split('.')[0]
              : paymentDate;

            const orderNumber = order.orderNumber || order.order_number || order.id || `ORD-${order.id?.substring(0, 8)}`;
            
            // Get Stripe payment intent ID
            const paymentIntentId = order.stripePaymentIntentId || 
                                  order.paymentIntentId || 
                                  order.paymentInfo?.stripePaymentIntentId;

            // Check Stripe status
            let paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded' = 'pending';
            if (paymentIntentId) {
              try {
                const response = await adminPaymentAPI.getPaymentIntentStatus(paymentIntentId);
                if (response.status === 'succeeded') {
                  paymentStatus = 'completed';
                } else if (response.status === 'failed' || response.status === 'canceled') {
                  paymentStatus = 'failed';
                } else {
                  paymentStatus = 'pending';
                }
              } catch (error) {
                // Fallback to order status
                if (order.paymentInfo?.paymentStatus === 'paid' || order.status === 'paid') {
                  paymentStatus = 'completed';
                } else if (order.paymentInfo?.paymentStatus === 'failed') {
                  paymentStatus = 'failed';
                }
              }
            } else {
              // Use order status if no Stripe payment intent
              if (order.paymentInfo?.paymentStatus === 'paid' || order.status === 'paid') {
                paymentStatus = 'completed';
              } else if (order.paymentInfo?.paymentStatus === 'failed') {
                paymentStatus = 'failed';
              }
            }

            let paymentMethod: 'credit_card' | 'promptpay' | 'bank_transfer' = 'bank_transfer';
            const method = order.paymentMethod || order.paymentInfo?.paymentMethod || order.payment?.method;
            if (method === 'credit_card' || method === 'card' || method === 'stripe' || method === 'stripe_checkout') {
              paymentMethod = 'credit_card';
            } else if (method === 'promptpay' || method === 'prompt_pay') {
              paymentMethod = 'promptpay';
            }

            return {
              id: `order_${order.id}`,
              orderNumber,
              customerName,
              amount: order.total || order.totalAmount || order.totalAmountThb || 0,
              method: paymentMethod,
              status: paymentStatus,
              type: 'purchase' as const,
              date: formattedDate,
              transactionId: paymentIntentId || `order_${order.id}`
            };
          })
      );

      // Combine and deduplicate payments
      const allPayments = [...transformedPayments, ...orderPayments];
      const uniquePayments = allPayments.filter((payment, index, self) =>
        index === self.findIndex(p => p.transactionId === payment.transactionId || 
          (p.orderNumber === payment.orderNumber && p.date === payment.date))
      );

      // Sort by date descending
      uniquePayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Fallback to mock data when empty (so UI still shows structure)
      setPayments(uniquePayments.length > 0 ? uniquePayments : MOCK_PAYMENTS);
    } catch (error) {
      console.error('Error loading payments:', error);
      showToast('ไม่สามารถโหลดข้อมูลการชำระเงินได้', 'error');
      // Use mock data as fallback
      setPayments(MOCK_PAYMENTS);
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

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={14} />, label: 'สำเร็จ' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={14} />, label: 'รอดำเนินการ' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle size={14} />, label: 'ล้มเหลว' },
      refunded: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <RefreshCw size={14} />, label: 'คืนเงิน' },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      purchase: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <ArrowUpRight size={14} />, label: 'ซื้อ' },
      payout: { bg: 'bg-green-100', text: 'text-green-800', icon: <ArrowDownRight size={14} />, label: 'จ่ายเงิน' },
      refund: { bg: 'bg-orange-100', text: 'text-orange-800', icon: <RefreshCw size={14} />, label: 'คืนเงิน' },
    };
    const badge = badges[type as keyof typeof badges];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <CreditCard size={16} className="text-blue-500" />;
      case 'promptpay': return <Banknote size={16} className="text-purple-500" />;
      case 'bank_transfer': return <DollarSign size={16} className="text-green-500" />;
      default: return <Wallet size={16} />;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'credit_card': return 'บัตรเครดิต';
      case 'promptpay': return 'PromptPay';
      case 'bank_transfer': return 'โอนเงิน';
      default: return method;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchSearch = payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchType = filterType === 'all' || payment.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // Stats calculations
  const totalIncome = payments.filter(p => p.type === 'purchase' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const totalPayout = payments.filter(p => p.type === 'payout' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const failedPayments = payments.filter(p => p.status === 'failed').length;

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
                  <Wallet className="text-brand-gold" size={28} />
                  จัดการการเงิน
                </h1>
                <p className="text-sm text-slate-500 mt-1">Payment Management - ติดตามธุรกรรมและการชำระเงิน</p>
              </div>
              <Button className="gap-2 shadow-lg">
                <Download size={18} />
                Export Report
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
                  <p className="text-sm text-slate-500 font-medium">รายรับทั้งหมด</p>
                  <p className="text-2xl font-black text-green-600 mt-1">฿{totalIncome.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">จ่ายออก</p>
                  <p className="text-2xl font-black text-red-600 mt-1">฿{totalPayout.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">รอดำเนินการ</p>
                  <p className="text-3xl font-black text-yellow-600 mt-1">{pendingPayments}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ล้มเหลว</p>
                  <p className="text-3xl font-black text-red-600 mt-1">{failedPayments}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
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
                  placeholder="ค้นหา Order, ชื่อลูกค้า, Transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
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
                  <option value="completed">สำเร็จ</option>
                  <option value="pending">รอดำเนินการ</option>
                  <option value="failed">ล้มเหลว</option>
                  <option value="refunded">คืนเงิน</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent appearance-none bg-white outline-none"
                  disabled={loading}
                >
                  <option value="all">ประเภททั้งหมด</option>
                  <option value="purchase">ซื้อ</option>
                  <option value="payout">จ่ายเงิน</option>
                  <option value="refund">คืนเงิน</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Transaction</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ประเภท</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ช่องทาง</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">จำนวนเงิน</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">วันที่</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                          <span>กำลังโหลดข้อมูล...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        ไม่พบข้อมูลการชำระเงิน
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-slate-900">{payment.orderNumber}</div>
                          <div className="text-xs text-slate-500 font-mono">{payment.transactionId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {payment.customerName.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900">{payment.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(payment.type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.method)}
                          <span className="text-sm text-slate-600">{getMethodName(payment.method)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-bold ${payment.type === 'payout' || payment.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                          {payment.type === 'payout' || payment.type === 'refund' ? '-' : '+'}฿{payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{payment.date}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedPayment(payment)}
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
          </div>
        </div>
      </main>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-brand-gold p-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">รายละเอียดธุรกรรม</h3>
              <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-black/10 rounded-lg">
                <XCircle className="text-slate-900" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Order Number</label>
                  <div className="text-lg font-bold text-slate-900">{selectedPayment.orderNumber}</div>
                </div>
                {getStatusBadge(selectedPayment.status)}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Transaction ID</label>
                <div className="text-sm font-mono text-slate-900">{selectedPayment.transactionId}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">ประเภท</label>
                  <div className="mt-1">{getTypeBadge(selectedPayment.type)}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">ช่องทาง</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getMethodIcon(selectedPayment.method)}
                    <span className="font-medium">{getMethodName(selectedPayment.method)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">จำนวนเงิน</label>
                <div className={`text-3xl font-black ${selectedPayment.type === 'payout' || selectedPayment.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedPayment.type === 'payout' || selectedPayment.type === 'refund' ? '-' : '+'}฿{selectedPayment.amount.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">ลูกค้า</label>
                <div className="text-lg font-bold text-slate-900">{selectedPayment.customerName}</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">วันที่ทำรายการ</label>
                <div className="text-sm text-slate-900">{selectedPayment.date}</div>
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <Button className="w-full bg-green-600">
                    <CheckCircle size={18} />
                    อนุมัติ
                  </Button>
                  <Button variant="outline" className="w-full border-red-300 text-red-600">
                    <XCircle size={18} />
                    ปฏิเสธ
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
