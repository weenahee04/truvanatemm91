
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import i18n from '../i18n';
import { Product, CartItem, Order, User, SiteContent, ToastNotification, SavedCard, PayoutAccount } from '../types';
import { getSiteContent, updateSiteContent as updateFirestoreContent } from '../services/cmsService';
import { getUserLocation, saveLocationData, getSavedLocation, logLocationAnalytics, type LocationData } from '../services/locationService';
import { createOrder, getUserOrders } from '../services/orderService';
import { processReferralCommission } from '../services/referralService';
import { logout as firebaseLogout } from '../services/authService';
import { setSessionExpiry, clearSessionExpiry, isSessionExpired, SESSION_DURATION_MS } from '../utils/session';
// import { trackAllMissionsOnLogin, trackSpending, trackOrderCount } from '../services/missionTracker';

// Default Mock Data for CMS
const DEFAULT_CONTENT: SiteContent = {
  hero: {
    badge: 'OFFICIAL US IMPORTER',
    titleLine1: 'สินค้าอเมริกา',
    titleLine2: 'ส่งตรงถึงบ้านคุณ',
    description: 'พบกับสินค้าแบรนด์ดังและสินค้าพิเศษจาก USA กว่า 10,000 รายการ บริการฝากซื้อที่เชื่อถือได้ที่สุด',
    backgroundImage: 'https://i.ibb.co/s9g0FvQd/3.png' // Default background
  },
  promoBanners: [
    { 
      id: 1, 
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070', 
      title: 'MEGA US SALE', 
      subtitle: 'สินค้าแบรนด์ดังลดสูงสุด 70%', 
      link: '/category/flash-sale' 
    },
    { 
      id: 2, 
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070', 
      title: 'NEW ARRIVALS', 
      subtitle: 'คอลเลคชั่นใหม่ส่งตรงจาก NYC', 
      link: '/category/new' 
    }
  ],
  categoryBanners: [
    { id: 1, title: 'Summer Collection', subtitle: 'สดใสรับซัมเมอร์', image: 'https://picsum.photos/800/500?random=101', link: '/category/fashion' },
    { id: 2, title: 'Vintage Vibes', subtitle: 'สไตล์วินเทจสุดคลาสสิค', image: 'https://picsum.photos/800/500?random=102', link: '/category/fashion' },
    { id: 3, title: 'Outdoor Living', subtitle: 'ตกแต่งสวนและมุมพักผ่อน', image: 'https://picsum.photos/800/500?random=103', link: '/category/home' },
    { id: 4, title: 'Gadget Zone', subtitle: 'เทคโนโลยีล้ำสมัย', image: 'https://picsum.photos/800/500?random=104', link: '/category/electronics' },
    { id: 5, title: 'Healthy Life', subtitle: 'วิตามินนำเข้าจาก USA', image: 'https://picsum.photos/800/500?random=105', link: '/category/vitamins' },
    { id: 6, title: 'Kids & Toys', subtitle: 'ของเล่นเสริมพัฒนาการ', image: 'https://picsum.photos/800/500?random=106', link: '/category/toys' }
  ]
};

interface GlobalContextType {
  cart: CartItem[];
  orders: Order[];
  wishlist: Product[];
  user: User | null;
  siteContent: SiteContent;
  isAuthenticated: boolean;
  notifications: ToastNotification[];
  savedCards: SavedCard[];
  payoutAccounts: PayoutAccount[];
  userLocation: LocationData | null;
  isLoadingLocation: boolean;
  addToCart: (product: Product, quantity?: number, option?: string) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, delta: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  placeOrder: (order: Order) => Promise<void>;
  login: (emailOrUser: string | User) => void;
  logout: () => void;
  updateUserRole?: (role: string) => void;
  updateSiteContent: (newContent: SiteContent) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  addSavedCard: (card: Omit<SavedCard, 'id'>) => void;
  removeSavedCard: (id: string) => void;
  addPayoutAccount: (account: Omit<PayoutAccount, 'id'>) => void;
  removePayoutAccount: (id: string) => void;
  refreshLocation: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Helper function to get user-specific localStorage keys
  const getStorageKey = (baseKey: string, userId?: string) => {
    return userId ? `${baseKey}_${userId}` : baseKey;
  };

  // Persist state with localStorage (user-specific)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('truvamate_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [savedCards, setSavedCards] = useState<SavedCard[]>(() => {
    const saved = localStorage.getItem('truvamate_cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>(() => {
    const saved = localStorage.getItem('truvamate_payouts');
    return saved ? JSON.parse(saved) : [];
  });

  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_CONTENT);

  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const [userLocation, setUserLocation] = useState<LocationData | null>(() => {
    return getSavedLocation();
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Load site content from Firestore on mount
  useEffect(() => {
    loadSiteContent();
  }, []);

  // Track user location on mount
  useEffect(() => {
    trackUserLocation();
  }, []);

  const loadSiteContent = async () => {
    const content = await getSiteContent();
    setSiteContent(content);
  };

  const trackUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getUserLocation();
      if (location) {
        setUserLocation(location);
        // Don't save again - getUserLocation already saves it
        logLocationAnalytics(location);
      }
      // Silently handle case where location is null - it's not critical
    } catch (error) {
      // Don't show error - location tracking is not critical for app functionality
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Location tracking failed (non-critical):', error);
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const refreshLocation = async () => {
    await trackUserLocation();
  };

  // Load user-specific data from localStorage when user changes
  useEffect(() => {
    if (user?.id) {
      // Load cart
      const savedCart = localStorage.getItem(getStorageKey('truvamate_cart', user.id));
      setCart(savedCart ? JSON.parse(savedCart) : []);

      // Load wishlist
      const savedWishlist = localStorage.getItem(getStorageKey('truvamate_wishlist', user.id));
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);

      // Load orders from Firestore (not localStorage)
      loadUserOrders(user.id);
    } else {
      // Not logged in - use anonymous keys
      const savedCart = localStorage.getItem('truvamate_cart');
      setCart(savedCart ? JSON.parse(savedCart) : []);
      const savedWishlist = localStorage.getItem('truvamate_wishlist');
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
      setOrders([]);
    }
  }, [user?.id]);

  // Session expiry: if app-level session expired, logout (token refresh is handled in api.ts)
  useEffect(() => {
    if (!user) return;
    const check = () => {
      if (isSessionExpired()) {
        clearSessionExpiry();
        firebaseLogout().catch(() => {});
        setUser(null);
        setOrders([]);
        setCart([]);
        sessionStorage.removeItem('truvamate_admin_session');
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || '';
          const loginPath = path.startsWith('/admin') ? '/admin/login' : '/login';
          window.location.href = `${loginPath}?redirect=${encodeURIComponent(path || '/')}`;
        }
      }
    };
    const interval = setInterval(check, 60 * 1000);
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  // Load orders from Firestore
  const loadUserOrders = async (userId: string) => {
    try {
      const userOrders = await getUserOrders(userId);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading user orders:', error);
      // Fallback to localStorage if Firestore fails
      const savedOrders = localStorage.getItem(getStorageKey('truvamate_orders', userId));
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        // Filter by userId to ensure only this user's orders
        setOrders(parsed.filter((o: Order) => o.userId === userId));
      } else {
        setOrders([]);
      }
    }
  };

  // Save user-specific data to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(getStorageKey('truvamate_cart', user.id), JSON.stringify(cart));
    } else {
      localStorage.setItem('truvamate_cart', JSON.stringify(cart));
    }
  }, [cart, user?.id]);

  useEffect(() => {
    if (user?.id) {
      // Orders are saved to Firestore, but also keep a local cache
      localStorage.setItem(getStorageKey('truvamate_orders', user.id), JSON.stringify(orders));
    }
  }, [orders, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(getStorageKey('truvamate_wishlist', user.id), JSON.stringify(wishlist));
    } else {
      localStorage.setItem('truvamate_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, user?.id]);

  useEffect(() => {
    if (user) localStorage.setItem('truvamate_user', JSON.stringify(user));
    else localStorage.removeItem('truvamate_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('truvamate_cards', JSON.stringify(savedCards));
  }, [savedCards]);

  useEffect(() => {
    localStorage.setItem('truvamate_payouts', JSON.stringify(payoutAccounts));
  }, [payoutAccounts]);

  // Toast System - use useRef to maintain counter across renders and track timeouts
  const toastCounterRef = useRef(0);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    // Use timestamp + counter + random string to ensure unique IDs even when toasts are created at the same time
    const id = `${Date.now()}-${++toastCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Store timeout so we can clean it up if needed
    const timeoutId = setTimeout(() => {
      removeToast(id);
      toastTimeoutsRef.current.delete(id);
    }, 3000);
    
    toastTimeoutsRef.current.set(id, timeoutId);
  };

  const removeToast = (id: string) => {
    // Clear timeout if it exists
    const timeoutId = toastTimeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      toastTimeoutsRef.current.delete(id);
    }
    
    // Use functional update to safely remove toast
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      toastTimeoutsRef.current.clear();
    };
  }, []);

  // Cart Logic
  const addToCart = (product: Product, quantity = 1, option = 'Standard') => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity, selectedOption: option }];
    });
    showToast(i18n.t('common:toast.addedToCart', { product: product.title }), 'success');
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    showToast(i18n.t('common:toast.removedFromCart'), 'info');
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  // Wishlist Logic
  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        showToast(i18n.t('common:toast.removedFromWishlist'), 'info');
        return prev.filter(p => p.id !== product.id);
      } else {
        showToast(i18n.t('common:toast.addedToWishlist'), 'success');
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  // Order Logic
  const placeOrder = async (order: Order) => {
    try {
      // Ensure userId is added to order
      const orderWithUserId = {
        ...order,
        userId: user?.id || undefined
      };

      // Add order to local state immediately for UI feedback (only if logged in)
      if (user?.id) {
        setOrders(prev => [orderWithUserId, ...prev]);
      }
      
      // Save to Firestore if user is logged in
      if (user?.id) {
        try {
          const result = await createOrder(user.id, orderWithUserId);
          
          if (result.success) {
            // Reload orders from Firestore to get the latest data
            await loadUserOrders(user.id);
            
            // Process referral commission (checks cumulative spending)
            const referralResult = await processReferralCommission(user.id, order.total);
            

            if (referralResult.success && referralResult.commission) {
              showToast(
                i18n.t('common:toast.orderSuccessReferral', { amount: referralResult.commission.toFixed(2) }),
                'success'
              );
            } else {
              showToast(i18n.t('common:toast.orderSuccess'), 'success');
            }
          } else {
            showToast(i18n.t('common:toast.orderSuccessPartial'), 'info');
          }
        } catch (error) {
          console.error('Error saving order to Firestore:', error);
          showToast(i18n.t('common:toast.orderSuccessPartial'), 'info');
        }
      } else {
        // Not logged in, just show success
        showToast(i18n.t('common:toast.orderSuccess'), 'success');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showToast(i18n.t('common:toast.orderError'), 'error');
    }
  };

  // Saved Cards Logic
  const addSavedCard = (card: Omit<SavedCard, 'id'>) => {
    const newCard = { ...card, id: Date.now().toString() };
    setSavedCards(prev => [...prev, newCard]);
  };

  const removeSavedCard = (id: string) => {
    setSavedCards(prev => prev.filter(card => card.id !== id));
    showToast(i18n.t('common:toast.savedCardRemoved'), 'info');
  };

  // Payout Accounts Logic
  const addPayoutAccount = (account: Omit<PayoutAccount, 'id'>) => {
    const newAccount = { ...account, id: Date.now().toString(), isDefault: payoutAccounts.length === 0 };
    setPayoutAccounts(prev => [...prev, newAccount]);
    showToast(i18n.t('common:toast.payoutAccountAdded'), 'success');
  };

  const removePayoutAccount = (id: string) => {
    setPayoutAccounts(prev => prev.filter(acc => acc.id !== id));
    showToast(i18n.t('common:toast.payoutAccountRemoved'), 'info');
  };

  // Auth Logic
  const login = (emailOrUser: string | User) => {
    // If it's a User object, use it directly
    if (typeof emailOrUser === 'object' && emailOrUser !== null) {
      // For email/password users, if name is empty or 'User', use email
      let displayName = emailOrUser.name;
      if ((!displayName || displayName === 'User') && emailOrUser.email) {
        displayName = emailOrUser.email;
      }
      
      const userData: User = {
        name: displayName || 'User',
        email: emailOrUser.email || '',
        avatar: emailOrUser.avatar,
        memberSince: emailOrUser.memberSince || emailOrUser.createdAt ? new Date(emailOrUser.createdAt || '').getFullYear().toString() : new Date().getFullYear().toString(),
        id: emailOrUser.id,
        role: emailOrUser.role,
        createdAt: emailOrUser.createdAt
      };
      setUser(userData);
      setSessionExpiry(SESSION_DURATION_MS);
      showToast(i18n.t('common:toast.welcome', { name: userData.name }), 'success');
    } else {
      // Legacy: if it's just an email string, use it as fallback
      setUser({
        name: emailOrUser, // Use email as name
        email: emailOrUser,
        memberSince: new Date().getFullYear().toString(),
        avatar: 'https://i.pravatar.cc/150?img=11'
      });
      setSessionExpiry(SESSION_DURATION_MS);
      showToast(i18n.t('common:toast.welcomeGeneric'), 'success');
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('truvamate_admin_session');
    clearSessionExpiry();
    // Must call Firebase signOut first - otherwise /admin stays accessible (Firebase session persists)
    try {
      await firebaseLogout();
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    // Clear user-specific data
    setUser(null);
    setOrders([]);
    setCart([]);
    try {
      localStorage.removeItem('truvamate_cart');
    } catch (_) {}
    showToast(i18n.t('common:toast.logoutSuccess'), 'info');
  };

  const updateUserRole = (role: string) => {
    if (user?.id) {
      setUser(prev => prev ? { ...prev, role: role as any } : null);
    }
  };

  const updateSiteContent = async (newContent: SiteContent) => {
    setSiteContent(newContent);
    const result = await updateFirestoreContent(newContent);
    if (result.success) {
      showToast(i18n.t('common:toast.siteContentSaved'), 'success');
    } else {
      showToast(i18n.t('common:toast.siteContentError', { error: result.error }), 'error');
    }
  };

  return (
    <GlobalContext.Provider value={{
      cart,
      orders,
      wishlist,
      user,
      siteContent,
      isAuthenticated: !!user,
      notifications,
      savedCards,
      payoutAccounts,
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      toggleWishlist,
      isInWishlist,
      placeOrder,
      login,
      logout,
      updateUserRole,
      updateSiteContent,
      showToast,
      removeToast,
      addSavedCard,
      removeSavedCard,
      addPayoutAccount,
      removePayoutAccount,
      userLocation,
      isLoadingLocation,
      refreshLocation
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
