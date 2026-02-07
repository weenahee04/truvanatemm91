import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, Search, Filter, Eye, Truck, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { getSellingHistoryBySeller } from '../services/adminService';
import { logout as authLogout } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface OrderItem {
  id?: string;
  productId?: string;
  name?: string;
  title?: string;
  image?: string;
  images?: string[];
  quantity?: number;
  price?: number;
  priceTHB?: number;
  priceUSD?: number;
  sellerId?: string;
  seller?: string;
  product?: {
    id?: string;
    sellerId?: string;
  };
}

interface Order {
  id: string;
  orderNumber?: string;
  items: OrderItem[];
  total?: number;
  status?: string;
  trackingNumber?: string;
  carrier?: string;
  shippingCarrier?: string;
  date?: string;
  createdAt?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
}

export const SellerOrders: React.FC = () => {
  const { user, logout, showToast } = useGlobal();
  const navigate = useNavigate();
  const { t } = useTranslation('seller');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !user.id) {
      showToast(t('dashboard.pleaseLogin'), 'error');
      navigate('/seller/login');
      return;
    }

    // Check if user is seller
    if (user.role !== 'seller' && user.role !== 'SELLER') {
      showToast(t('dashboard.noAccess'), 'error');
      navigate('/seller/login');
      return;
    }

    loadOrders();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [activeTab, searchTerm, orders]);

  const loadOrders = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const sellerOrders = await getSellingHistoryBySeller(user.id);
      
      // Fetch customer details for each order
      const ordersWithCustomer = await Promise.all(
        sellerOrders.map(async (order: any) => {
          let customerName = t('customers.noName');
          let customerEmail = t('customers.noEmail');

          if (order.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', order.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                customerName = userData.name || userData.displayName || customerName;
                customerEmail = userData.email || customerEmail;
              }
            } catch (error) {
              console.warn('Error fetching customer data:', error);
            }
          }

          return {
            ...order,
            customerName,
            customerEmail
          };
        })
      );

      setOrders(ordersWithCustomer);
      filterOrders(ordersWithCustomer);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast(t('ordersPage.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (ordersList?: Order[]) => {
    const ordersToFilter = ordersList || orders;
    let filtered = [...ordersToFilter];

    // Apply status filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => {
        const status = (order.status || '').toLowerCase();
        if (activeTab === 'pending') {
          return status === 'pending' || status === 'payment_pending' || status === 'processing';
        } else if (activeTab === 'shipping') {
          return status === 'shipped' || status === 'shipping' || status === 'in_transit';
        } else if (activeTab === 'completed') {
          return status === 'completed' || status === 'delivered';
        } else if (activeTab === 'cancelled') {
          return status === 'cancelled' || status === 'refunded';
        }
        return true;
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(order => {
        const orderId = (order.id || order.orderNumber || '').toLowerCase();
        const customerName = (order.customerName || '').toLowerCase();
        return orderId.includes(searchTerm.toLowerCase()) || 
               customerName.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredOrders(filtered);
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      logout();
      navigate('/seller/login');
      showToast(t('dashboard.logoutSuccess'), 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showToast(t('dashboard.logoutError'), 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString('th-TH')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    let bgColor = 'bg-slate-100';
    let textColor = 'text-slate-800';
    let borderColor = 'border-slate-200';
    let label = status || 'Unknown';

    if (statusLower === 'pending' || statusLower === 'payment_pending' || statusLower === 'processing') {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      borderColor = 'border-yellow-200';
      label = 'Pending';
    } else if (statusLower === 'shipped' || statusLower === 'shipping' || statusLower === 'in_transit') {
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      borderColor = 'border-blue-200';
      label = 'Shipping';
    } else if (statusLower === 'completed' || statusLower === 'delivered') {
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      borderColor = 'border-green-200';
      label = 'Completed';
    } else if (statusLower === 'cancelled' || statusLower === 'refunded') {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      borderColor = 'border-red-200';
      label = 'Cancelled';
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-bold border ${bgColor} ${textColor} ${borderColor}`}>
        {label}
      </span>
    );
  };

  const getSellerItems = (order: Order) => {
    if (!order.items || !Array.isArray(order.items)) return [];
    if (!user?.id) return [];

    return order.items.filter((item: OrderItem) => {
      return item.sellerId === user.id ||
             item.seller === user.id ||
             (item.product && item.product.sellerId === user.id);
    });
  };

  const getSellerOrderTotal = (order: Order) => {
    const sellerItems = getSellerItems(order);
    return sellerItems.reduce((total, item) => {
      const price = item.price || item.priceTHB || (item.priceUSD ? item.priceUSD * 35 : 0);
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const getProductImage = (item: OrderItem) => {
    if (item.image) return item.image;
    if (item.images && item.images.length > 0) return item.images[0];
    return 'https://via.placeholder.com/100?text=No+Image';
  };

  const getProductName = (item: OrderItem) => {
    return item.name || item.title || 'Product';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy text-white hidden lg:flex flex-col shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tighter text-brand-gold uppercase">Truvamate</h2>
          <span className="text-xs uppercase tracking-widest text-slate-400">Seller Center</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link to="/seller" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/seller/products" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Package size={20} /> Products
          </Link>
          <Link to="/seller/orders" className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg">
            <ShoppingBag size={20} /> Orders
          </Link>
          <Link to="/seller/customers" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Users size={20} /> Customers
          </Link>
          <Link to="/seller/settings" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Settings size={20} /> Shop Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-700">
           <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 w-full overflow-hidden">
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-8">
           <h1 className="font-bold text-slate-800 text-lg">Order Management</h1>
           <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{user?.shopName || user?.name || 'Seller'}</div>
                <div className="text-xs text-slate-500">Verified Seller</div>
              </div>
              <div className="h-10 w-10 bg-brand-navy rounded-full flex items-center justify-center text-white font-bold">
                {(user?.shopName || user?.name || 'S')[0].toUpperCase()}
              </div>
           </div>
        </header>

        <div className="p-8">
           {/* Filters */}
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {['all', 'pending', 'shipping', 'completed', 'cancelled'].map(tab => (
                       <button 
                         key={tab}
                         onClick={() => setActiveTab(tab)}
                         className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                       >
                         {tab}
                       </button>
                    ))}
                 </div>
                 <div className="flex gap-2">
                    <div className="relative">
                       <input 
                         type="text" 
                         placeholder="Search Order ID or Customer" 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy" 
                       />
                       <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Orders Table */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             {filteredOrders.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4 font-medium">Order ID</th>
                       <th className="px-6 py-4 font-medium">Product(s)</th>
                       <th className="px-6 py-4 font-medium">Customer</th>
                       <th className="px-6 py-4 font-medium">Total Price</th>
                       <th className="px-6 py-4 font-medium">Status</th>
                       <th className="px-6 py-4 font-medium">Carrier</th>
                       <th className="px-6 py-4 font-medium text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredOrders.map((order, index) => {
                       const sellerItems = getSellerItems(order);
                       const sellerTotal = getSellerOrderTotal(order);
                       const orderId = order.orderNumber || order.id || `ORD-${index + 1}`;
                       const firstItem = sellerItems[0];
                       const hasMultipleItems = sellerItems.length > 1;

                       if (sellerItems.length === 0) return null;

                       return (
                         <tr key={`${order.id}-${index}`} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-900">#{orderId}</td>
                           <td className="px-6 py-4">
                             {firstItem && (
                               <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 bg-slate-100 rounded object-cover overflow-hidden shrink-0">
                                   <img 
                                     src={getProductImage(firstItem)} 
                                     className="w-full h-full object-cover" 
                                     alt={getProductName(firstItem)}
                                     onError={(e) => {
                                       (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                                     }}
                                   />
                                 </div>
                                 <div>
                                    <div className="font-medium text-slate-900 line-clamp-1">
                                      {getProductName(firstItem)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Qty: {firstItem.quantity || 1}
                                      {hasMultipleItems && ` +${sellerItems.length - 1} more`}
                                    </div>
                                 </div>
                               </div>
                             )}
                           </td>
                           <td className="px-6 py-4">
                             <div className="text-sm text-slate-900">{order.customerName || t('customers.noName')}</div>
                             <div className="text-xs text-slate-500">{order.customerEmail || ''}</div>
                           </td>
                           <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(sellerTotal)}</td>
                           <td className="px-6 py-4">
                             {getStatusBadge(order.status || 'pending')}
                           </td>
                           <td className="px-6 py-4 text-slate-600">
                             {order.trackingNumber ? (
                               <div>
                                 <div className="text-sm font-medium">{order.carrier || order.shippingCarrier || 'N/A'}</div>
                                 <div className="text-xs text-slate-500">{order.trackingNumber}</div>
                               </div>
                             ) : (
                               <span className="text-slate-400">-</span>
                             )}
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 className="h-8 w-8 p-0 flex items-center justify-center"
                                 title="View Details"
                               >
                                 <Eye size={16} />
                               </Button>
                               {(order.status === 'pending' || order.status === 'payment_pending' || order.status === 'processing') && (
                                 <Button 
                                   size="sm" 
                                   className="h-8 gap-1 text-xs"
                                   title="Ship Order"
                                 >
                                   <Truck size={14} /> Ship
                                 </Button>
                               )}
                             </div>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="p-12 text-center text-slate-400">
                 <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                 <p className="font-medium">
                   {searchTerm || activeTab !== 'all' 
                     ? t('ordersPage.noOrdersSearch') 
                     : t('ordersPage.noOrders')}
                 </p>
                 {!searchTerm && activeTab === 'all' && (
                   <p className="text-sm mt-1">{t('ordersPage.noOrdersDesc')}</p>
                 )}
               </div>
             )}
           </div>
        </div>
      </main>
    </div>
  );
};