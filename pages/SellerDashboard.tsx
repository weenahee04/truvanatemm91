import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, TrendingUp, DollarSign, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { getSellerStats, getProductsBySeller, getSellingHistoryBySeller } from '../services/adminService';
import { logout as authLogout } from '../services/authService';

export const SellerDashboard: React.FC = () => {
  const { user, logout, showToast } = useGlobal();
  const navigate = useNavigate();
  const { t } = useTranslation('seller');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRevenue: 0,
    totalSales: 0,
    totalOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [weeklySales, setWeeklySales] = useState<any[]>([]);

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

    loadSellerData();
  }, [user]);

  const loadSellerData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [sellerStats, products, orders] = await Promise.all([
        getSellerStats(user.id),
        getProductsBySeller(user.id),
        getSellingHistoryBySeller(user.id)
      ]);

      setStats(sellerStats);

      // Get recent orders (latest 5)
      const sortedOrders = orders
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.date || 0).getTime();
          const dateB = new Date(b.createdAt || b.date || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      setRecentOrders(sortedOrders);

      // Calculate weekly sales for the last 7 days
      const weeklyData = calculateWeeklySales(orders);
      setWeeklySales(weeklyData);

      // Update orders badge count in sidebar would be handled by the parent component
    } catch (error) {
      console.error('Error loading seller data:', error);
      showToast(t('dashboard.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklySales = (orders: any[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesByDay: Record<string, number> = {};
    
    // Initialize all days with 0
    days.forEach(day => {
      salesByDay[day] = 0;
    });

    // Get last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      orders.forEach((order: any) => {
        const orderDate = new Date(order.createdAt || order.date || 0);
        if (
          orderDate.toDateString() === date.toDateString() &&
          order.items &&
          Array.isArray(order.items)
        ) {
          order.items.forEach((item: any) => {
            const isSellerItem = item.sellerId === user?.id ||
                                item.seller === user?.id ||
                                item.userId === user?.id ||
                                (item.product && item.product.sellerId === user?.id);
            
            if (isSellerItem) {
              const price = item.price || item.priceTHB || item.priceUSD || 0;
              const quantity = item.quantity || 1;
              salesByDay[dayName] += price * quantity;
            }
          });
        }
      });
    }

    return days.map(day => ({
      name: day,
      sales: Math.round(salesByDay[day])
    }));
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

  const getOrderStatus = (order: any) => {
    return order.status || 'pending';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; border: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Confirmed' },
      shipped: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'Shipped' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Cancelled' }
    };

    const statusStyle = statusMap[status.toLowerCase()] || statusMap.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
        {statusStyle.label}
      </span>
    );
  };
  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  const pendingOrdersCount = recentOrders.filter(order => {
    const status = getOrderStatus(order);
    return status === 'pending' || status === 'confirmed';
  }).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Sidebar - Yellow Background */}
      <aside className="w-64 bg-brand-gold text-slate-900 hidden lg:flex flex-col border-r border-slate-200 shrink-0">
        <div className="p-6">
          <img 
            src="/truvamate-logo.png" 
            alt="Truvamate" 
            className="h-12 w-auto mb-2"
          />
          <span className="text-xs uppercase tracking-widest text-slate-800 font-bold block mt-1">Seller Center</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link to="/seller" className="flex items-center gap-3 px-4 py-3 bg-black text-brand-gold rounded-lg font-bold shadow-md">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/seller/products" className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:bg-black/10 rounded-lg transition-colors font-medium">
            <Package size={20} /> Products
          </Link>
          <Link to="/seller/orders" className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:bg-black/10 rounded-lg transition-colors font-medium">
            <ShoppingBag size={20} /> Orders {pendingOrdersCount > 0 && (
              <span className="ml-auto bg-slate-900 text-brand-gold text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingOrdersCount}
              </span>
            )}
          </Link>
          <Link to="/seller/customers" className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:bg-black/10 rounded-lg transition-colors font-medium">
            <Users size={20} /> Customers
          </Link>
          <Link to="/seller/settings" className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:bg-black/10 rounded-lg transition-colors font-medium">
            <Settings size={20} /> Shop Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-black/10">
           <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-800 hover:text-black font-medium transition-colors w-full"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-hidden">
        <header className="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center justify-between px-8">
           <h1 className="font-bold text-slate-900 text-lg uppercase tracking-wide">Dashboard Overview</h1>
           <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{user?.shopName || user?.name || 'Seller'}</div>
                <div className="text-xs text-slate-500">Verified Seller</div>
              </div>
              <div className="h-10 w-10 bg-brand-gold rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-900 font-bold">
                {(user?.shopName || user?.name || 'S')[0].toUpperCase()}
              </div>
           </div>
        </header>

        <div className="p-8 space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Revenue</div>
                <div className="p-2 bg-brand-gold/20 text-slate-900 rounded-lg"><DollarSign size={20} /></div>
              </div>
              <div className="text-4xl font-black text-slate-900">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-slate-400 text-sm mt-2 font-medium">{t('dashboard.totalAll')}</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Orders to Ship</div>
                <div className="p-2 bg-slate-100 text-slate-900 rounded-lg"><Package size={20} /></div>
              </div>
              <div className="text-4xl font-black text-slate-900">{pendingOrdersCount}</div>
              <div className="text-slate-400 text-sm mt-2 font-medium">
                {pendingOrdersCount > 0 ? 'Requires immediate action' : 'All orders processed'}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Products</div>
                <div className="p-2 bg-slate-100 text-slate-900 rounded-lg"><ShoppingBag size={20} /></div>
              </div>
              <div className="text-4xl font-black text-slate-900">{stats.totalProducts}</div>
              <div className="text-slate-400 text-sm mt-2 font-medium">{t('dashboard.allProducts')}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Weekly Sales</h3>
              <div className="h-80 w-full">
                {weeklySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklySales}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 12, fontWeight: 500}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '0px', border: '2px solid #000', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)'}} formatter={(value: any) => formatCurrency(value)} />
                      <Bar dataKey="sales" fill="#FFD700" radius={[0, 0, 0, 0]} barSize={40} stroke="#000" strokeWidth={2} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <p>{t('dashboard.noSalesData')}</p>
                  </div>
                )}
              </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Sales Trend</h3>
              <div className="h-80 w-full">
                {weeklySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklySales}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#000', fontSize: 12, fontWeight: 500}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip contentStyle={{borderRadius: '0px', border: '2px solid #000', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)'}} formatter={(value: any) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="sales" stroke="#000" strokeWidth={3} dot={{r: 4, fill: '#FFD700', strokeWidth: 2}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <p>{t('dashboard.noSalesData')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Recent Orders</h3>
              <Link to="/seller/orders" className="text-sm text-slate-900 underline hover:no-underline font-bold">View All</Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-900">Order ID</th>
                      <th className="px-6 py-4 font-bold text-slate-900">Product</th>
                      <th className="px-6 py-4 font-bold text-slate-900">Customer</th>
                      <th className="px-6 py-4 font-bold text-slate-900">Status</th>
                      <th className="px-6 py-4 font-bold text-slate-900 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders
                      .filter((order: any) => {
                        // Filter out orders with no seller items before mapping
                        const sellerItems = order.items?.filter((item: any) => {
                          return item.sellerId === user?.id ||
                                 item.seller === user?.id ||
                                 item.userId === user?.id ||
                                 (item.product && item.product.sellerId === user?.id);
                        }) || [];
                        return sellerItems.length > 0;
                      })
                      .map((order: any, index: number) => {
                        const sellerItems = order.items?.filter((item: any) => {
                          return item.sellerId === user?.id ||
                                 item.seller === user?.id ||
                                 item.userId === user?.id ||
                                 (item.product && item.product.sellerId === user?.id);
                        }) || [];

                        const totalAmount = sellerItems.reduce((sum: number, item: any) => {
                          const price = item.price || item.priceTHB || item.priceUSD || 0;
                          const quantity = item.quantity || 1;
                          return sum + (price * quantity);
                        }, 0);

                        const firstItem = sellerItems[0];
                        const productName = firstItem.name || firstItem.title || 'Product';
                        const customerName = order.customerName || order.name || 'Customer';

                        // Create unique key combining order ID and index to prevent duplicates
                        // Use index as primary uniqueness factor since it's always unique
                        const uniqueKey = `${order.id || order.orderNumber || `order-${index}`}-${index}`;

                        return (
                          <tr key={uniqueKey} className="hover:bg-yellow-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">#{order.orderNumber || order.id?.substring(0, 8) || `ORD-${index}`}</td>
                            <td className="px-6 py-4 text-slate-600">
                              {productName.length > 30 ? `${productName.substring(0, 30)}...` : productName}
                              {sellerItems.length > 1 && ` +${sellerItems.length - 1} more`}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{customerName}</td>
                            <td className="px-6 py-4">
                              {getStatusBadge(getOrderStatus(order))}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(totalAmount)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">{t('dashboard.noOrders')}</p>
                <p className="text-sm mt-1">{t('dashboard.noOrdersDesc')}</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};