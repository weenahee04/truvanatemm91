import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { getSellingHistoryBySeller } from '../services/adminService';
import { logout as authLogout } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  lastOrderStatus?: string;
}

export const SellerCustomers: React.FC = () => {
  const { user, logout, showToast } = useGlobal();
  const navigate = useNavigate();
  const { t } = useTranslation('seller');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
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

    loadCustomers();
  }, [user]);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const orders = await getSellingHistoryBySeller(user.id);
      
      // Group orders by customer
      const customerMap: Record<string, Customer> = {};

      for (const order of orders) {
        if (!order.userId) continue;

        // Fetch customer data
        let customerData: Customer;
        if (customerMap[order.userId]) {
          customerData = customerMap[order.userId];
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', order.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              customerData = {
                id: order.userId,
                name: userData.name || userData.displayName || t('customers.noName'),
                email: userData.email || t('customers.noEmail'),
                phone: userData.phone || userData.phoneNumber || '',
                totalOrders: 0,
                totalSpent: 0
              };
            } else {
              // Skip if user doesn't exist
              continue;
            }
          } catch (error) {
            console.warn('Error fetching customer data:', error);
            continue;
          }
        }

        // Calculate seller's portion of order
        if (order.items && Array.isArray(order.items)) {
          const sellerItems = order.items.filter((item: any) => {
            return item.sellerId === user.id ||
                   item.seller === user.id ||
                   (item.product && item.product.sellerId === user.id);
          });

          if (sellerItems.length > 0) {
            const orderTotal = sellerItems.reduce((sum: number, item: any) => {
              const price = item.price || item.priceTHB || (item.priceUSD ? item.priceUSD * 35 : 0);
              const quantity = item.quantity || 1;
              return sum + (price * quantity);
            }, 0);

            customerData.totalOrders += 1;
            customerData.totalSpent += orderTotal;

            // Update last order date and status
            const orderDate = order.date || order.createdAt;
            if (!customerData.lastOrderDate || (orderDate && new Date(orderDate) > new Date(customerData.lastOrderDate))) {
              customerData.lastOrderDate = orderDate;
              customerData.lastOrderStatus = order.status || 'pending';
            }
          }
        }

        customerMap[order.userId] = customerData;
      }

      const customersList = Object.values(customerMap);
      setCustomers(customersList);
      filterCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
      showToast(t('customers.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = (customersList?: Customer[]) => {
    const customersToFilter = customersList || customers;
    let filtered = [...customersToFilter];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(customer => {
        const name = (customer.name || '').toLowerCase();
        const email = (customer.email || '').toLowerCase();
        const phone = (customer.phone || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase()) ||
               phone.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredCustomers(filtered);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
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
          <Link to="/seller/orders" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <ShoppingBag size={20} /> Orders
          </Link>
          <Link to="/seller/customers" className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg">
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
           <h1 className="font-bold text-slate-800 text-lg">Customer Management</h1>
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
          {/* Search */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, email, or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-navy w-full" 
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {filteredCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Customer Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Phone</th>
                      <th className="px-6 py-4 font-medium">Total Orders</th>
                      <th className="px-6 py-4 font-medium">Total Spent</th>
                      <th className="px-6 py-4 font-medium">Last Order</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{customer.name}</td>
                        <td className="px-6 py-4 text-slate-600">{customer.email}</td>
                        <td className="px-6 py-4 text-slate-600">{customer.phone || '-'}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{customer.totalOrders}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</td>
                        <td className="px-6 py-4 text-slate-600">{formatDate(customer.lastOrderDate)}</td>
                        <td className="px-6 py-4">
                          {customer.lastOrderStatus ? getStatusBadge(customer.lastOrderStatus) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">
                  {searchTerm 
                    ? t('customers.noCustomersSearch') 
                    : t('customers.noCustomers')}
                </p>
                {!searchTerm && (
                  <p className="text-sm mt-1">{t('customers.noCustomersDesc')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};








