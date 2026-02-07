import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order } from '../types';

// Create new order
export const createOrder = async (
  userId: string, 
  orderData: Omit<Order, 'id'>
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true, orderId: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Normalize date from Firestore doc or Order for sorting
function getOrderDate(d: any): number {
  if (!d) return 0;
  const raw = d.date || d.createdAt || d.updatedAt;
  if (!raw) return 0;
  if (typeof raw === 'string') return new Date(raw).getTime();
  if (raw.toMillis) return raw.toMillis();
  if (raw.toDate) return raw.toDate().getTime();
  return 0;
}

// Get user orders (marketplace + lotto) so customer sees all orders and status from admin
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const results: Order[] = [];

    // 1) Orders collection (marketplace + lotto in orders)
    const ordersQ = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );
    const ordersSnap = await getDocs(ordersQ);
    ordersSnap.docs.forEach(d => {
      const data = d.data();
      results.push({
        ...data,
        id: d.id,
        type: (data.type === 'lotto' ? 'lotto' : 'marketplace') as Order['type'],
        date: data.date || (data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? ''),
        status: data.status || 'pending',
        total: data.total ?? data.totalAmount ?? 0,
        items: data.items ?? data.tickets ?? [],
        paymentMethod: data.paymentMethod ?? data.payment?.method ?? '',
        userId: data.userId,
      } as Order);
    });

    // 2) Lotto orders collection (same user) — admin status updates appear here
    const lottoQ = query(
      collection(db, 'lottoOrders'),
      where('userId', '==', userId)
    );
    const lottoSnap = await getDocs(lottoQ);
    lottoSnap.docs.forEach(d => {
      const data = d.data();
      // Avoid duplicate if same id already in results (from orders)
      if (results.some(o => o.id === d.id)) return;
      results.push({
        id: d.id,
        type: 'lotto',
        date: data.date || (data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? ''),
        status: data.status || 'pending',
        total: data.total ?? data.totalAmount ?? data.totalAmountThb ?? 0,
        items: data.items ?? data.tickets ?? [],
        paymentMethod: data.paymentMethod ?? data.payment?.method ?? '',
        userId: data.userId,
      } as Order);
    });

    return results.sort((a, b) => getOrderDate(b) - getOrderDate(a));
  } catch (error) {
    console.error('Error getting user orders:', error);
    return [];
  }
};

// Get order by ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as Order : null;
  } catch (error) {
    console.error('Error getting order:', error);
    return null;
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string, 
  status: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get all orders (for admin)
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Order));
  } catch (error) {
    console.error('Error getting all orders:', error);
    return [];
  }
};

// Get seller orders
export const getSellerOrders = async (sellerId: string): Promise<Order[]> => {
  try {
    // Query without orderBy to avoid needing composite index
    // We'll sort in memory instead
    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerId)
    );
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Order));
    
    return orders.sort((a, b) => getOrderDate(b) - getOrderDate(a));
  } catch (error) {
    console.error('Error getting seller orders:', error);
    return [];
  }
};

// Update order tracking
export const updateOrderTracking = async (
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      trackingNumber,
      carrier,
      status: 'shipped',
      shippedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
