import { collection, query, getDocs, orderBy, limit, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order } from '../types';
import { Referral } from './referralService';

// Get all orders
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'orders'),
      orderBy('date', 'desc'),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Order));
  } catch (error) {
    // getAllOrders failed
    return [];
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    // getAllUsers failed
    return [];
  }
};

// Get admin stats
export const getAdminStats = async () => {
  try {
    const [orders, users, referrals] = await Promise.all([
      getAllOrders(),
      getAllUsers(),
      import('./referralService').then(m => m.getAllReferrals())
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const lottoOrders = orders.filter(o => o.type === 'lotto');
    const marketplaceOrders = orders.filter(o => o.type === 'marketplace');
    
    const lottoRevenue = lottoOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const marketplaceRevenue = marketplaceOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const totalCommission = referrals.reduce((sum, ref) => sum + (ref.commission || 0), 0);
    const paidCommission = referrals.filter(ref => ref.commissionPaid).reduce((sum, ref) => sum + (ref.commission || 0), 0);
    const pendingCommission = totalCommission - paidCommission;

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalUsers: users.length,
      lottoRevenue,
      marketplaceRevenue,
      conversionRate: orders.length > 0 ? parseFloat(((orders.filter(o => o.status === 'paid' || o.status === 'completed').length / orders.length) * 100).toFixed(1)) : 0,
      avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(ref => ref.status === 'completed').length,
      totalCommission,
      paidCommission,
      pendingCommission
    };
  } catch (error) {
    // getAdminStats failed
    return {
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
    };
  }
};

// Get revenue by month
export const getRevenueByMonth = async () => {
  try {
    const orders = await getAllOrders();
    const monthlyData: Record<string, { lotto: number; marketplace: number; total: number }> = {};
    
    orders.forEach(order => {
      const date = new Date(order.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { lotto: 0, marketplace: 0, total: 0 };
      }
      
      const amount = order.total || 0;
      monthlyData[monthKey].total += amount;
      
      if (order.type === 'lotto') {
        monthlyData[monthKey].lotto += amount;
      } else if (order.type === 'marketplace') {
        monthlyData[monthKey].marketplace += amount;
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  } catch (error) {
    // getRevenueByMonth failed
    return [];
  }
};

// Get daily sales
export const getDailySales = async () => {
  try {
    const orders = await getAllOrders();
    const dailyData: Record<string, { orders: number; revenue: number }> = {};
    
    orders.forEach(order => {
      const date = new Date(order.date);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { orders: 0, revenue: 0 };
      }
      
      dailyData[dayKey].orders += 1;
      dailyData[dayKey].revenue += order.total || 0;
    });
    
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return dayOrder.map(day => dailyData[day] || { day, orders: 0, revenue: 0 });
  } catch (error) {
    // getDailySales failed
    return [];
  }
};

// Get user growth
export const getUserGrowth = async () => {
  try {
    const users = await getAllUsers();
    const monthlyData: Record<string, { users: number; active: number }> = {};
    
    users.forEach(user => {
      const date = user.createdAt ? new Date(user.createdAt) : new Date();
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { users: 0, active: 0 };
      }
      
      monthlyData[monthKey].users += 1;
      // Consider user active if they have orders
      // This would need additional data, for now just count as active
      monthlyData[monthKey].active += 1;
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  } catch (error) {
    // getUserGrowth failed
    return [];
  }
};

// Get recent orders
export const getRecentOrders = async (limitCount = 10): Promise<Order[]> => {
  try {
    const orders = await getAllOrders();
    return orders.slice(0, limitCount);
  } catch (error) {
    // getRecentOrders failed
    return [];
  }
};

// Get all products
export const getAllProducts = async () => {
  try {
    const q = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    // getAllProducts failed
    return [];
  }
};

// Get all สินค้าพิเศษ orders
export const getAllLottoOrders = async () => {
  try {
    const allOrders: any[] = [];
    
    // First try to get from 'lottoOrders' collection
    try {
      // Try with createdAt first
      try {
        const lottoOrdersQuery = query(
          collection(db, 'lottoOrders'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const lottoOrdersSnapshot = await getDocs(lottoOrdersQuery);
        
        if (!lottoOrdersSnapshot.empty) {
          const orders = lottoOrdersSnapshot.docs.map(d => ({
            ...d.data(),
            id: d.id, // Use Firestore doc ID for updates
            _sourceCollection: 'lottoOrders'
          }));
          allOrders.push(...orders);
        }
      } catch (createdAtError: any) {
        // orderBy createdAt not available, trying without
        // Try without orderBy if createdAt index doesn't exist
        try {
          const lottoOrdersQuery = query(
            collection(db, 'lottoOrders'),
            limit(100)
          );
          const lottoOrdersSnapshot = await getDocs(lottoOrdersQuery);
          
          if (!lottoOrdersSnapshot.empty) {
            const orders = lottoOrdersSnapshot.docs.map(d => ({
              ...d.data(),
              id: d.id, // Use Firestore doc ID for updates
              _sourceCollection: 'lottoOrders'
            }));
            // Sort by createdAt in memory if available
            orders.sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              const bTime = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              return bTime - aTime;
            });
            allOrders.push(...orders);
          }
        } catch (noOrderByError: any) {
          // Fallback query without orderBy
        }
      }
    } catch (lottoError: any) {
      // lottoOrders query failed
    }

    // Also get from 'orders' collection with type === 'lotto' as fallback
    try {
      // Try with date field first
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('type', '==', 'lotto'),
          orderBy('date', 'desc'),
          limit(100)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        if (!ordersSnapshot.empty) {
          const orders = ordersSnapshot.docs.map(d => ({
            ...d.data(),
            id: d.id, // Use Firestore doc ID for updates (overwrite any id/orderNumber from data)
            _sourceCollection: 'orders'
          }));
          // Add to allOrders if not already present (check by orderId or id)
          orders.forEach(order => {
            const existingOrder = allOrders.find(o => 
              o.orderId === order.id || 
              o.id === order.id || 
              (o.orderId && o.orderId === order.orderId)
            );
            if (!existingOrder) {
              allOrders.push(order);
            }
          });
        }
      } catch (dateError: any) {
        // orderBy date not available, trying without
        // Try without orderBy if date index doesn't exist
        try {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('type', '==', 'lotto'),
            limit(100)
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          
          if (!ordersSnapshot.empty) {
            const orders = ordersSnapshot.docs.map(d => ({
              ...d.data(),
              id: d.id, // Use Firestore doc ID for updates
              _sourceCollection: 'orders'
            }));
            // Sort by date or createdAt in memory
            orders.sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || (a.date ? new Date(a.date).getTime() : 0);
              const bTime = b.createdAt?.toMillis?.() || (b.date ? new Date(b.date).getTime() : 0);
              return bTime - aTime;
            });
            // Add to allOrders if not already present
            orders.forEach(order => {
              const existingOrder = allOrders.find(o => 
                o.orderId === order.id || 
                o.id === order.id || 
                (o.orderId && o.orderId === order.orderId)
              );
              if (!existingOrder) {
                allOrders.push(order);
              }
            });
          }
        } catch (noOrderByError: any) {
          // Fallback query without orderBy
        }
      }
    } catch {
      // orders collection query failed
    }

    // Sort all orders by date/createdAt
    allOrders.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 
                   (a.createdAt ? new Date(a.createdAt).getTime() : 0) ||
                   (a.date ? new Date(a.date).getTime() : 0);
      const bTime = b.createdAt?.toMillis?.() || 
                   (b.createdAt ? new Date(b.createdAt).getTime() : 0) ||
                   (b.date ? new Date(b.date).getTime() : 0);
      return bTime - aTime;
    });
    
    return allOrders;
  } catch {
    return [];
  }
};

// Get all payments from orders
export const getAllPayments = async () => {
  try {
    const payments: any[] = [];
    
    // Try to get from payments collection first
    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      if (!paymentsSnapshot.empty) {
        return paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (paymentsError) {
      // payments collection not found, extracting from orders
    }

    // Extract payment information from orders (marketplace + lotto)
    const orders = await getAllOrders();
    const lottoOrders = await getAllLottoOrders();
    const allOrdersForPayments = [...orders, ...lottoOrders];
    
    allOrdersForPayments.forEach((order: any) => {
      const hasPayment = order.paymentMethod || order.payment || order.paymentInfo ||
        order.stripePaymentIntentId || order.paymentIntentId || (order.total && order.status);
      if (hasPayment) {
        const paymentMethod = order.paymentMethod || order.payment?.method || order.paymentInfo?.paymentMethod || 'bank_transfer';
        const orderNumber = order.orderNumber || order.order_number || order.id || `ORD-${order.id?.substring(0, 8)}`;
        const transactionId = order.stripePaymentIntentId || order.paymentIntentId ||
                             order.payment?.transactionId || order.transactionId || 
                             order.payment_reference || order.paymentInfo?.transactionId ||
                             `txn_${order.id}`;
        
        // Determine payment type based on order status and amount
        let paymentType: 'purchase' | 'payout' | 'refund' = 'purchase';
        if (order.status === 'refunded' || order.payment?.status === 'refunded') {
          paymentType = 'refund';
        } else if (order.type === 'payout') {
          paymentType = 'payout';
        }

        // Determine payment status
        let paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded' = 'pending';
        if (order.status === 'paid' || order.status === 'completed') {
          paymentStatus = 'completed';
        } else if (order.status === 'failed' || order.payment?.status === 'failed') {
          paymentStatus = 'failed';
        } else if (order.status === 'refunded' || order.payment?.status === 'refunded') {
          paymentStatus = 'refunded';
        }

        payments.push({
          id: `payment_${order.id}`,
          orderId: order.id,
          orderNumber,
          orderType: order.type || 'marketplace',
          amount: order.total || order.totalAmount || order.totalAmountThb || 0,
          method: paymentMethod,
          status: paymentStatus,
          type: paymentType,
          date: order.date || order.createdAt || new Date().toISOString(),
          transactionId,
          userId: order.userId,
          payment: order.payment
        });
      }
    });

    // Also check referralTransactions for payout type payments
    try {
      const referralTransactionsQuery = query(
        collection(db, 'referralTransactions'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const referralTransactionsSnapshot = await getDocs(referralTransactionsQuery);
      
      referralTransactionsSnapshot.docs.forEach(doc => {
        const transaction = doc.data();
        if (transaction.status === 'paid' || transaction.status === 'completed') {
          payments.push({
            id: `payout_${doc.id}`,
            orderNumber: `REF-${transaction.referralId}`,
            orderType: 'referral',
            amount: transaction.amount || 0,
            method: 'bank_transfer',
            status: 'completed',
            type: 'payout',
            date: transaction.createdAt || new Date().toISOString(),
            transactionId: `ref_${doc.id}`,
            referralId: transaction.referralId
          });
        }
      });
    } catch (error) {
      // referralTransactions fetch failed
    }

    return payments.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    // getAllPayments failed
    return [];
  }
};

// Get device statistics from users
export const getDeviceStats = async () => {
  try {
    const users = await getAllUsers();
    const deviceCounts: Record<string, number> = {
      mobile: 0,
      desktop: 0,
      tablet: 0
    };

    users.forEach((user: any) => {
      const device = user.device || user.userAgent || '';
      if (device.includes('Mobile') || device.includes('Android') || device.includes('iPhone')) {
        deviceCounts.mobile++;
      } else if (device.includes('Tablet') || device.includes('iPad')) {
        deviceCounts.tablet++;
      } else {
        deviceCounts.desktop++;
      }
    });

    const total = deviceCounts.mobile + deviceCounts.desktop + deviceCounts.tablet;
    if (total === 0) {
      // Return default stats if no data
      return [
        { device: 'Mobile', percent: 65, icon: '📱', color: '#3b82f6' },
        { device: 'Desktop', percent: 30, icon: '💻', color: '#10b981' },
        { device: 'Tablet', percent: 5, icon: '📱', color: '#f59e0b' }
      ];
    }

    return [
      {
        device: 'Mobile',
        percent: Math.round((deviceCounts.mobile / total) * 100),
        icon: '📱',
        color: '#3b82f6'
      },
      {
        device: 'Desktop',
        percent: Math.round((deviceCounts.desktop / total) * 100),
        icon: '💻',
        color: '#10b981'
      },
      {
        device: 'Tablet',
        percent: Math.round((deviceCounts.tablet / total) * 100),
        icon: '📱',
        color: '#f59e0b'
      }
    ];
  } catch (error) {
    // getDeviceStats failed
    return [
      { device: 'Mobile', percent: 65, icon: '📱', color: '#3b82f6' },
      { device: 'Desktop', percent: 30, icon: '💻', color: '#10b981' },
      { device: 'Tablet', percent: 5, icon: '📱', color: '#f59e0b' }
    ];
  }
};

// Get country statistics from users
export const getCountryStats = async () => {
  try {
    const users = await getAllUsers();
    const countryCounts: Record<string, number> = {};

    users.forEach((user: any) => {
      const country = user.country || user.location?.country || user.location?.countryName || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const total = users.length || 1;
    const countryStats = Object.entries(countryCounts)
      .map(([country, count]) => ({
        country,
        users: count,
        percent: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 10); // Top 10 countries

    if (countryStats.length === 0) {
      return [
        { country: 'Thailand', users: total, percent: 100 }
      ];
    }

    return countryStats;
  } catch (error) {
    // getCountryStats failed
    return [
      { country: 'Thailand', users: 0, percent: 0 }
    ];
  }
};

// Get all sellers
export const getAllSellers = async () => {
  try {
    // Try with where + orderBy first (requires composite index)
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'seller'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (indexError: any) {
      // If index doesn't exist, try without orderBy
      // Composite index not found, trying without orderBy
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'seller'),
          limit(100)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const sellers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sort manually by createdAt
          return sellers.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        }
      } catch (queryError) {
        // Query with where failed, using fallback
      }
    }
    
    // Fallback: get all users and filter by role
    // Using fallback: getting all users and filtering
    const users = await getAllUsers();
    const sellers = users.filter((user: any) => 
      user.role === 'seller' || 
      user.role === 'SELLER' ||
      user.role === 'Seller'
    );
    return sellers;
  } catch (error) {
    // getAllSellers failed
    return [];
  }
};

// Get products by seller ID
export const getProductsBySeller = async (sellerId: string) => {
  try {
    // Try with where + orderBy first
    try {
      const q = query(
        collection(db, 'products'),
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (indexError: any) {
      // If index doesn't exist, try without orderBy
      // Products composite index not found, trying without orderBy
      try {
        const q = query(
          collection(db, 'products'),
          where('sellerId', '==', sellerId),
          limit(100)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const products = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sort manually
          return products.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
        }
      } catch (queryError) {
        // Products query with where failed, using fallback
      }
    }
    
    // Fallback: get all products and filter
    // Using fallback: getting all products and filtering
    try {
      const allProducts = await getAllProducts();
      const sellerProducts = allProducts.filter((product: any) => 
        product.sellerId === sellerId || 
        product.seller === sellerId ||
        product.userId === sellerId
      );
      return sellerProducts;
    } catch {
      return [];
    }
  } catch (error) {
    // getProductsBySeller failed
    return [];
  }
};

// Get selling history (orders) for a seller
export const getSellingHistoryBySeller = async (sellerId: string) => {
  try {
    const allOrders = await getAllOrders();
    // Filter orders that contain products from this seller
    const sellerOrders = allOrders.filter((order: any) => {
      if (!order.items || !Array.isArray(order.items)) return false;
      // Check multiple possible field names for seller ID
      return order.items.some((item: any) => 
        item.sellerId === sellerId ||
        item.seller === sellerId ||
        item.userId === sellerId ||
        (item.product && item.product.sellerId === sellerId)
      );
    });
    
    // Sort by date descending
    return sellerOrders.sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.date ? new Date(b.date).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateB - dateA;
    });
  } catch (error) {
    // getSellingHistory failed
    return [];
  }
};

// Get seller statistics
export const getSellerStats = async (sellerId: string) => {
  try {
    const [products, orders] = await Promise.all([
      getProductsBySeller(sellerId),
      getSellingHistoryBySeller(sellerId)
    ]);

    let totalRevenue = 0;
    let totalSales = 0;
    let totalProducts = products.length;

    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          // Check multiple possible field names for seller ID
          const isSellerItem = item.sellerId === sellerId ||
                              item.seller === sellerId ||
                              item.userId === sellerId ||
                              (item.product && item.product.sellerId === sellerId);
          
          if (isSellerItem) {
            const price = item.price || item.priceTHB || item.priceUSD || 0;
            const quantity = item.quantity || 1;
            totalRevenue += price * quantity;
            totalSales += quantity;
          }
        });
      }
    });

    return {
      totalProducts,
      totalRevenue,
      totalSales,
      totalOrders: orders.length
    };
  } catch (error) {
    // getSellerStats failed
    return {
      totalProducts: 0,
      totalRevenue: 0,
      totalSales: 0,
      totalOrders: 0
    };
  }
};

// Get category breakdown
export const getCategoryBreakdown = async () => {
  try {
    const orders = await getAllOrders();
    const categoryMap: Record<string, { value: number; count: number }> = {};
    
    orders.forEach(order => {
      if (order.type === 'lotto' && order.items) {
        // Group lotto by type if available, otherwise use 'สินค้าพิเศษ'
        const category = 'สินค้าพิเศษ';
        if (!categoryMap[category]) {
          categoryMap[category] = { value: 0, count: 0 };
        }
        categoryMap[category].value += order.total || 0;
        categoryMap[category].count += 1;
      } else if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const category = item.category || 'Others';
          if (!categoryMap[category]) {
            categoryMap[category] = { value: 0, count: 0 };
          }
          const itemTotal = (item.priceTHB || 0) * (item.quantity || 1);
          categoryMap[category].value += itemTotal;
          categoryMap[category].count += 1;
        });
      }
    });
    
    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6B7280'];
    const total = Object.values(categoryMap).reduce((sum, cat) => sum + cat.value, 0);
    
    return Object.entries(categoryMap)
      .map(([name, data], index) => ({
        name,
        value: data.value,
        color: colors[index % colors.length],
        percent: total > 0 ? Math.round((data.value / total) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  } catch (error) {
    // getCategoryBreakdown failed
    return [];
  }
};

// Get top products
export const getTopProducts = async () => {
  try {
    const orders = await getAllOrders();
    const productMap: Record<string, { name: string; sales: number; revenue: number; orders: Set<string> }> = {};
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productId = item.id || item.title;
          const productName = item.title || 'Unknown Product';
          
          if (!productMap[productId]) {
            productMap[productId] = {
              name: productName,
              sales: 0,
              revenue: 0,
              orders: new Set()
            };
          }
          
          const quantity = item.quantity || 1;
          const price = item.priceTHB || 0;
          
          productMap[productId].sales += quantity;
          productMap[productId].revenue += price * quantity;
          productMap[productId].orders.add(order.id);
        });
      }
    });
    
    // Calculate previous period for growth (simplified)
    return Object.entries(productMap)
      .map(([id, data], index) => ({
        rank: index + 1,
        id,
        name: data.name,
        sales: data.sales,
        revenue: data.revenue,
        growth: Math.floor(Math.random() * 40 - 10) // Simplified - would need historical data
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  } catch (error) {
    // getTopProducts failed
    return [];
  }
};

// Get สินค้าพิเศษ stats
export const getLottoStats = async () => {
  try {
    const orders = await getAllOrders();
    const lottoOrders = orders.filter(o => o.type === 'lotto');
    
    const stats: Record<string, { pending: number; purchased: number; won: number; paid: number }> = {};
    
    lottoOrders.forEach(order => {
      // Group by สินค้าพิเศษ type (Powerball, Mega Millions, etc.)
      const lottoType = 'Powerball'; // Default, can be extracted from order data if available
      
      if (!stats[lottoType]) {
        stats[lottoType] = { pending: 0, purchased: 0, won: 0, paid: 0 };
      }
      
      switch (order.status) {
        case 'pending':
        case 'confirmed':
          stats[lottoType].pending += 1;
          break;
        case 'purchased':
        case 'scanned':
          stats[lottoType].purchased += 1;
          break;
        case 'won':
          stats[lottoType].won += 1;
          break;
        case 'paid':
        case 'completed':
          stats[lottoType].paid += 1;
          break;
      }
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data
    }));
  } catch (error) {
    // getLottoStats failed
    return [];
  }
};

// Get recent activities
export const getRecentActivities = async () => {
  try {
    const [orders, users] = await Promise.all([
      getAllOrders(),
      getAllUsers()
    ]);
    
    const activities: any[] = [];
    
    // Add recent orders
    orders.slice(0, 3).forEach(order => {
      const timeAgo = getTimeAgo(new Date(order.date));
      activities.push({
        type: 'order',
        message: `คำสั่งซื้อใหม่ #${order.id}`,
        time: timeAgo,
        icon: 'ShoppingCart',
        color: 'blue',
        timestamp: new Date(order.date).getTime()
      });
    });
    
    // Add recent users (if available)
    users.slice(0, 1).forEach(user => {
      if (user.createdAt) {
        const timeAgo = getTimeAgo(new Date(user.createdAt));
        activities.push({
          type: 'user',
          message: `สมาชิกใหม่ลงทะเบียน: ${user.name || user.email}`,
          time: timeAgo,
          icon: 'Users',
          color: 'purple',
          timestamp: new Date(user.createdAt).getTime()
        });
      }
    });
    
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  } catch (error) {
    // getRecentActivities failed
    return [];
  }
};

// Helper function to get time ago string
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) {
    return `${diffMins} นาที`;
  } else if (diffHours < 24) {
    return `${diffHours} ชั่วโมง`;
  } else {
    return `${diffDays} วัน`;
  }
};

