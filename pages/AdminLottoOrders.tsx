import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { getAllLottoOrders } from '../services/adminService';
import { lottoAPI } from '../services/api';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, 
  AlertCircle, DollarSign, Calendar, User, Ticket, Edit, Plus,
  Camera, FileText, MessageSquare, Phone, Mail, MapPin, CreditCard,
  ChevronDown, ChevronUp, RefreshCw, Send, Image, ExternalLink, Copy,
  BarChart3, Home, HardDrive, Users, Wallet, Settings, ChevronRight,
  Trophy, Package, Banknote, ScanLine, Award, LogOut, Receipt, TrendingUp, Shield
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

interface TicketDetail {
  id: string;
  ticketNumber: string;
  numbers: string;
  type: 'powerball' | 'megamillions' | 'other';
  price: number;
  photoUrl?: string;
}

interface PaymentInfo {
  method: 'bank_transfer' | 'promptpay' | 'credit_card' | 'crypto';
  transactionId?: string;
  paidAt?: string;
  slipUrl?: string;
}

interface StatusHistory {
  status: string;
  changedAt: string;
  changedBy: string;
  note?: string;
}

interface LottoOrder {
  id: string;
  _sourceCollection?: 'lottoOrders' | 'orders';
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  tickets: TicketDetail[];
  totalAmount: number;
  serviceFee: number;
  exchangeRate: number;
  status: 'pending' | 'confirmed' | 'purchased' | 'scanned' | 'won' | 'paid' | 'cancelled';
  drawDate: string;
  drawNumber: string;
  createdAt: string;
  updatedAt: string;
  winAmount?: number;
  winAmountUSD?: number;
  payment?: PaymentInfo;
  statusHistory: StatusHistory[];
  notes?: string;
  assignedAgent?: string;
}

const MOCK_ORDERS: LottoOrder[] = [
  {
    id: '1',
    orderNumber: 'LTO-2025-123456',
    customerName: 'สมชาย ใจดี',
    customerEmail: 'somchai@email.com',
    customerPhone: '081-234-5678',
    customerAddress: '123/45 ถ.สุขุมวิท กรุงเทพฯ 10110',
    tickets: [
      { id: 't1', ticketNumber: 'PB-001', numbers: '12-23-34-45-56 PB:07', type: 'powerball', price: 60 },
      { id: 't2', ticketNumber: 'PB-002', numbers: '05-15-25-35-45 PB:10', type: 'powerball', price: 60 },
      { id: 't3', ticketNumber: 'MM-001', numbers: '08-18-28-38-48 MB:05', type: 'megamillions', price: 55 },
    ],
    totalAmount: 525,
    serviceFee: 50,
    exchangeRate: 35.50,
    status: 'scanned',
    drawDate: '2025-12-15',
    drawNumber: 'PB-2025-098',
    createdAt: '2025-12-10 10:30:00',
    updatedAt: '2025-12-10 15:00:00',
    payment: {
      method: 'promptpay',
      transactionId: 'PP-123456789',
      paidAt: '2025-12-10 11:00:00',
      slipUrl: 'https://example.com/slip.jpg'
    },
    statusHistory: [
      { status: 'pending', changedAt: '2025-12-10 10:30:00', changedBy: 'System' },
      { status: 'confirmed', changedAt: '2025-12-10 11:05:00', changedBy: 'Admin' },
      { status: 'purchased', changedAt: '2025-12-10 14:00:00', changedBy: 'USA Agent', note: 'ซื้อที่ร้าน 7-Eleven Dallas' },
      { status: 'scanned', changedAt: '2025-12-10 15:00:00', changedBy: 'USA Agent', note: 'อัพโหลดรูปตั๋วแล้ว' },
    ],
    assignedAgent: 'John (USA)',
    notes: 'ลูกค้าขอให้เลือกเลขด้วยตัวเอง',
  },
  {
    id: '2',
    orderNumber: 'LTO-2025-123457',
    customerName: 'สมหญิง รักสวย',
    customerEmail: 'somying@email.com',
    customerPhone: '089-876-5432',
    tickets: [
      { id: 't4', ticketNumber: 'PB-003', numbers: '07-14-21-28-35 PB:12', type: 'powerball', price: 60, photoUrl: 'https://example.com/ticket1.jpg' },
      { id: 't5', ticketNumber: 'PB-004', numbers: '03-13-23-33-43 PB:08', type: 'powerball', price: 60, photoUrl: 'https://example.com/ticket2.jpg' },
    ],
    totalAmount: 350,
    serviceFee: 40,
    exchangeRate: 35.50,
    status: 'won',
    drawDate: '2025-12-12',
    drawNumber: 'PB-2025-097',
    createdAt: '2025-12-09 14:20:00',
    updatedAt: '2025-12-12 20:00:00',
    winAmount: 50000,
    winAmountUSD: 1408.45,
    payment: {
      method: 'bank_transfer',
      transactionId: 'TRF-987654321',
      paidAt: '2025-12-09 15:00:00',
    },
    statusHistory: [
      { status: 'pending', changedAt: '2025-12-09 14:20:00', changedBy: 'System' },
      { status: 'confirmed', changedAt: '2025-12-09 15:05:00', changedBy: 'Admin' },
      { status: 'purchased', changedAt: '2025-12-10 10:00:00', changedBy: 'USA Agent' },
      { status: 'scanned', changedAt: '2025-12-10 11:00:00', changedBy: 'USA Agent' },
      { status: 'won', changedAt: '2025-12-12 20:00:00', changedBy: 'System', note: 'ถูกรางวัลที่ 5 - $1,408.45' },
    ],
    assignedAgent: 'John (USA)',
  },
  {
    id: '3',
    orderNumber: 'LTO-2025-123458',
    customerName: 'วิชัย มั่งมี',
    customerEmail: 'wichai@email.com',
    customerPhone: '062-111-2222',
    tickets: [
      { id: 't6', ticketNumber: 'MM-002', numbers: '10-20-30-40-50 MB:01', type: 'megamillions', price: 55 },
      { id: 't7', ticketNumber: 'MM-003', numbers: '02-12-22-32-42 MB:03', type: 'megamillions', price: 55 },
    ],
    totalAmount: 350,
    serviceFee: 40,
    exchangeRate: 35.50,
    status: 'confirmed',
    drawDate: '2025-12-18',
    drawNumber: 'MM-2025-052',
    createdAt: '2025-12-10 16:45:00',
    updatedAt: '2025-12-10 17:00:00',
    payment: {
      method: 'credit_card',
      transactionId: 'CC-555666777',
      paidAt: '2025-12-10 16:50:00',
    },
    statusHistory: [
      { status: 'pending', changedAt: '2025-12-10 16:45:00', changedBy: 'System' },
      { status: 'confirmed', changedAt: '2025-12-10 17:00:00', changedBy: 'Admin' },
    ],
    assignedAgent: 'Mike (USA)',
  },
  {
    id: '4',
    orderNumber: 'LTO-2025-123459',
    customerName: 'นภา สุขสันต์',
    customerEmail: 'napa@email.com',
    customerPhone: '084-567-8901',
    tickets: [
      { id: 't11', ticketNumber: 'PB-006', numbers: '01-11-21-31-41 PB:15', type: 'powerball', price: 60 },
    ],
    totalAmount: 156,
    serviceFee: 30,
    exchangeRate: 35.50,
    status: 'pending',
    drawDate: '2025-12-15',
    drawNumber: 'PB-2025-098',
    createdAt: '2025-12-11 09:00:00',
    updatedAt: '2025-12-11 09:00:00',
    statusHistory: [
      { status: 'pending', changedAt: '2025-12-11 09:00:00', changedBy: 'System' },
    ],
  },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'รอดำเนินการ', color: 'yellow' },
  { value: 'confirmed', label: 'ยืนยันแล้ว', color: 'blue' },
  { value: 'purchased', label: 'ซื้อแล้ว', color: 'purple' },
  { value: 'scanned', label: 'อัพรูปแล้ว', color: 'indigo' },
  { value: 'won', label: 'ถูกรางวัล', color: 'green' },
  { value: 'paid', label: 'จ่ายแล้ว', color: 'emerald' },
  { value: 'cancelled', label: 'ยกเลิก', color: 'red' },
];

export const AdminLottoOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast, logout, user } = useGlobal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orders, setOrders] = useState<LottoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<LottoOrder | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const firestoreOrders = await getAllLottoOrders();
      
      // Transform Firestore data to สินค้าพิเศษOrder format
      const transformedOrders: LottoOrder[] = await Promise.all(
        firestoreOrders.map(async (orderData: any) => {
          const orderId = orderData.id;
          
          // Get user info if userId exists
          let customerName = 'ไม่ระบุชื่อ';
          let customerEmail = 'ไม่ระบุอีเมล';
          let customerPhone = 'ไม่ระบุ';
          let customerAddress = '';

          if (orderData.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', orderData.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                customerName = userData.name || userData.displayName || customerName;
                customerEmail = userData.email || customerEmail;
                customerPhone = userData.phone || userData.phoneNumber || customerPhone;
                customerAddress = userData.address || customerAddress;
              }
            } catch (error) {
              console.warn('Error fetching user data for order:', orderId, error);
            }
          }

          // Extract tickets from items or tickets array
          const items = orderData.items || orderData.tickets || [];
          const tickets: TicketDetail[] = items.map((item: any, index: number) => {
            // Handle สินค้าพิเศษTicket format
            if (item.numbers && Array.isArray(item.numbers)) {
              return {
                id: item.id || `ticket-${index}`,
                ticketNumber: item.ticketNumber || `TICKET-${index + 1}`,
                numbers: item.special 
                  ? `${item.numbers.join('-')} PB:${item.special}` 
                  : item.numbers.join('-'),
                type: (item.type || 'powerball').toLowerCase() as 'powerball' | 'megamillions' | 'other',
                price: item.price || 156,
                photoUrl: item.photoUrl || item.photo
              };
            }
            // Handle other formats
            return {
              id: item.id || `ticket-${index}`,
              ticketNumber: item.ticketNumber || item.number || `TICKET-${index + 1}`,
              numbers: item.numbers || item.numbersString || 'N/A',
              type: (item.type || 'powerball').toLowerCase() as 'powerball' | 'megamillions' | 'other',
              price: item.price || 175,
              photoUrl: item.photoUrl || item.photo
            };
          });

          // Format dates safely
          const formatDate = (dateValue: any): string => {
            if (!dateValue) return new Date().toISOString();
            try {
              if (typeof dateValue === 'string') {
                return new Date(dateValue).toISOString();
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

          const createdAt = formatDate(orderData.createdAt || orderData.date);
          const updatedAt = formatDate(orderData.updatedAt || orderData.createdAt || orderData.date);
          const drawDate = formatDate(orderData.drawDate || orderData.draw_date);
          const paidAt = orderData.payment?.paidAt || orderData.paidAt 
            ? formatDate(orderData.payment.paidAt || orderData.paidAt) 
            : undefined;

          // Build order number
          const orderNumber = orderData.orderNumber || 
                            orderData.order_number || 
                            `LTO-${orderId.substring(0, 8).toUpperCase()}`;

          // Calculate totals
          const totalAmount = orderData.total || 
                            orderData.totalAmount || 
                            orderData.totalAmountThb || 
                            tickets.reduce((sum: number, t: TicketDetail) => sum + (t.price || 0), 0);
          
          const serviceFee = orderData.serviceFee || 
                           orderData.service_fee || 
                           orderData.serviceFeeThb || 
                           0;

          const exchangeRate = orderData.exchangeRate || 
                              orderData.exchange_rate || 
                              35.0;

          return {
            id: orderId,
            _sourceCollection: orderData._sourceCollection,
            orderNumber,
            customerName: orderData.customerName || customerName,
            customerEmail: orderData.customerEmail || customerEmail,
            customerPhone: orderData.customerPhone || customerPhone,
            customerAddress: orderData.customerAddress || customerAddress,
            tickets,
            totalAmount,
            serviceFee,
            exchangeRate,
            status: (orderData.status || 'pending') as LottoOrder['status'],
            drawDate: drawDate.split('T')[0],
            drawNumber: orderData.drawNumber || orderData.draw_number || 'N/A',
            createdAt: createdAt.split('T')[0] + ' ' + createdAt.split('T')[1].split('.')[0],
            updatedAt: updatedAt.split('T')[0] + ' ' + updatedAt.split('T')[1].split('.')[0],
            winAmount: orderData.winAmount || orderData.winning_amount_thb,
            winAmountUSD: orderData.winAmountUSD || orderData.winning_amount_usd,
            payment: orderData.payment || (orderData.payment_method ? {
              method: orderData.payment_method as PaymentInfo['method'],
              transactionId: orderData.payment_reference || orderData.transactionId,
              paidAt: paidAt ? paidAt.split('T')[0] + ' ' + paidAt.split('T')[1].split('.')[0] : undefined,
              slipUrl: orderData.payment_slip_url || orderData.slipUrl
            } : undefined),
            statusHistory: orderData.statusHistory || orderData.status_history || [],
            notes: orderData.notes || orderData.notes_text,
            assignedAgent: orderData.assignedAgent || orderData.assigned_agent
          };
        })
      );

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading สินค้าพิเศษ orders:', error);
      showToast('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้', 'error');
      // Use mock data as fallback
      setOrders(MOCK_ORDERS);
    }
    setLoading(false);
  };

  const toggleOrderExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    const colors: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      green: 'bg-green-100 text-green-800',
      emerald: 'bg-emerald-100 text-emerald-800',
      red: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock size={14} />,
      confirmed: <CheckCircle size={14} />,
      purchased: <Package size={14} />,
      scanned: <Camera size={14} />,
      won: <Trophy size={14} />,
      paid: <Banknote size={14} />,
      cancelled: <XCircle size={14} />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${colors[option?.color || 'gray']}`}>
        {icons[status]}
        {option?.label || status}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateOrderStatus = async (orderId: string, newStatus: LottoOrder['status'], _sourceCollection?: 'lottoOrders' | 'orders') => {
    try {
      const currentHistory = orders.find(o => o.id === orderId)?.statusHistory || [];
      const historyForWrite = [
        ...currentHistory.map((h: StatusHistory) => ({
          status: h.status,
          changedAt: typeof h.changedAt === 'string' ? h.changedAt : (h.changedAt as any)?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          changedBy: h.changedBy,
          note: h.note
        })),
        { status: newStatus, changedAt: new Date().toISOString(), changedBy: 'Admin' }
      ];

      await lottoAPI.updateOrderStatus(orderId, { status: newStatus, statusHistory: historyForWrite });

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
              updatedAt: new Date().toISOString().split('T')[0] + ' ' + new Date().toISOString().split('T')[1].split('.')[0],
              statusHistory: [
                ...(order.statusHistory || []),
                { status: newStatus, changedAt: new Date().toISOString(), changedBy: 'Admin' }
              ]
            }
          : order
      ));
      setSelectedOrder(null);
      showToast(`อัพเดทสถานะเป็น ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus} เรียบร้อย (ลูกค้าเห็นที่หน้าสินค้าของเขา)`, 'success');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      const msg = error?.response?.data?.error || error?.message || 'เกิดข้อผิดพลาดในการอัพเดทสถานะ';
      showToast(msg, 'error');
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

  // Stats
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const purchasedCount = orders.filter(o => o.status === 'purchased' || o.status === 'scanned').length;
  const wonCount = orders.filter(o => o.status === 'won').length;
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);

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
                  const isActive = (item as any).isActive || location.pathname === item.path;
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
                  คำสั่งซื้อหวย
                </h1>
                <p className="text-sm text-slate-500 mt-1">สินค้าพิเศษ Orders - จัดการคำสั่งซื้อล็อตเตอรี่ต่างประเทศ</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Download size={18} />
                  Export
                </Button>
                <Button className="gap-2 shadow-lg">
                  <Plus size={18} />
                  สร้างคำสั่งซื้อ
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">รอดำเนินการ</p>
                  <p className="text-3xl font-black text-yellow-600 mt-1">{pendingCount}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">กำลังดำเนินการ</p>
                  <p className="text-3xl font-black text-blue-600 mt-1">{purchasedCount}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">ถูกรางวัล</p>
                  <p className="text-3xl font-black text-green-600 mt-1">{wonCount}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Trophy className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">รายได้รวม</p>
                  <p className="text-2xl font-black text-brand-gold mt-1">฿{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="text-brand-gold" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="ค้นหา Order, ชื่อลูกค้า, อีเมล..."
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
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-slate-500">ไม่พบข้อมูลคำสั่งซื้อ</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Order Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-xl flex items-center justify-center text-white font-bold">
                        <Ticket size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900">{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                          {order.winAmount && (
                            <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                              <Trophy size={12} /> ฿{order.winAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><User size={14} /> {order.customerName}</span>
                          <span className="flex items-center gap-1"><Calendar size={14} /> งวด {order.drawDate}</span>
                          <span className="flex items-center gap-1"><Ticket size={14} /> {order.tickets.length} ใบ</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-black text-brand-gold">฿{order.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">${(order.totalAmount / order.exchangeRate).toFixed(2)} USD</p>
                      </div>
                      {expandedOrders.has(order.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedOrders.has(order.id) && (
                  <div className="border-t border-slate-100 p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={16} className="text-slate-400" />
                        <span>{order.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-slate-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                      {order.assignedAgent && (
                        <div className="flex items-center gap-2 text-sm">
                          <User size={16} className="text-slate-400" />
                          <span>Agent: {order.assignedAgent}</span>
                        </div>
                      )}
                    </div>

                    {/* Tickets */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3">ตั๋ว ({order.tickets.length} ใบ)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {order.tickets.map((ticket) => (
                          <div key={ticket.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-900">{ticket.ticketNumber}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                ticket.type === 'powerball' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {ticket.type === 'powerball' ? 'Powerball' : 'Mega Millions'}
                              </span>
                            </div>
                            <p className="font-mono text-lg font-bold text-slate-900">{ticket.numbers}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-slate-500">${ticket.price}</span>
                              {ticket.photoUrl && (
                                <a href={ticket.photoUrl} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline flex items-center gap-1 text-sm">
                                  <Camera size={14} /> ดูรูป
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Info */}
                    {order.payment && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                          <CreditCard size={16} /> ข้อมูลการชำระเงิน
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-green-600">ช่องทาง:</span>
                            <span className="font-bold text-green-800 ml-2 capitalize">{order.payment.method.replace('_', ' ')}</span>
                          </div>
                          <div>
                            <span className="text-green-600">Transaction:</span>
                            <span className="font-bold text-green-800 ml-2">{order.payment.transactionId}</span>
                          </div>
                          <div>
                            <span className="text-green-600">ชำระเมื่อ:</span>
                            <span className="font-bold text-green-800 ml-2">{order.payment.paidAt}</span>
                          </div>
                          {order.payment.slipUrl && (
                            <a href={order.payment.slipUrl} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline flex items-center gap-1">
                              <ExternalLink size={14} /> ดูสลิป
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">เปลี่ยนสถานะ:</span>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as LottoOrder['status'], order._sourceCollection)}
                          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                        >
                          {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Camera size={16} /> อัพรูปตั๋ว
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <MessageSquare size={16} /> ส่งข้อความ
                        </Button>
                        <Button size="sm" className="gap-1" onClick={() => setSelectedOrder(order)}>
                          <Eye size={16} /> ดูรายละเอียด
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-brand-gold p-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">รายละเอียดคำสั่งซื้อ {selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-black/10 rounded-lg">
                <XCircle className="text-slate-900" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status History */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText size={16} /> ประวัติสถานะ
                </h4>
                <div className="space-y-3">
                  {selectedOrder.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 bg-brand-gold rounded-full mt-1.5 shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(history.status)}
                          <span className="text-slate-500">{history.changedAt}</span>
                          <span className="text-slate-400">by {history.changedBy}</span>
                        </div>
                        {history.note && (
                          <p className="text-slate-600 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} /> หมายเหตุ
                  </h4>
                  <p className="text-yellow-900">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Win Info */}
              {selectedOrder.winAmount && (
                <div className="bg-green-100 border border-green-300 rounded-xl p-6 text-center">
                  <Trophy className="mx-auto text-green-600 mb-2" size={40} />
                  <h4 className="text-2xl font-black text-green-800">🎉 ถูกรางวัล!</h4>
                  <p className="text-4xl font-black text-green-600 mt-2">฿{selectedOrder.winAmount.toLocaleString()}</p>
                  <p className="text-green-700">(${selectedOrder.winAmountUSD?.toLocaleString()} USD)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLottoOrders;
