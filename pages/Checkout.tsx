
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { MapPin, CreditCard, Banknote, CheckCircle2, Wallet, QrCode, Ticket as TicketIcon, Lock, Plus, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { paymentAPI } from '../services/api';
import { StripeEmbeddedCheckout } from '../components/StripeEmbeddedCheckout';
import { auth } from '../config/firebase';

// All 77 Thailand Provinces
const THAILAND_PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา',
  'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด',
  'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี',
  'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี',
  'พระนครศรีอยุธยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่',
  'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยะลา', 'ยโสธร', 'ร้อยเอ็ด', 'ระนอง',
  'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร',
  'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี',
  'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ',
  'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('checkout');
  
  // Determine if this is a lotto order before setting initial step
  const isLottoInitial = location.state?.source === 'special-products' || location.state?.source === 'lotto';
  
  // Initialize step based on URL params (for payment return) or source
  const getInitialStep = () => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      return 4; // Go directly to success page
    }
    return isLottoInitial ? 2 : 1; // Lotto starts at step 2 (payment), normal cart at step 1 (address)
  };
  
  const [step, setStep] = useState(getInitialStep());
  const [paymentMethod, setPaymentMethod] = useState('stripe_checkout');
  
  // Order state
  const [orderId, setOrderId] = useState<string | null>(() => {
    // Try to get orderId from URL params if coming from payment return
    const returnedOrderId = searchParams.get('order_id');
    return returnedOrderId || null;
  });
  const [orderStatus, setOrderStatus] = useState<'pending' | 'processing' | 'paid' | 'failed'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Stripe Embedded Checkout state
  // Note: PaymentElement + useCheckout hook requires ui_mode='custom'
  const [checkoutMode, setCheckoutMode] = useState<'hosted' | 'embedded' | 'custom'>('custom'); // Default to 'custom' for PaymentElement + useCheckout compatibility
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Generate Order ID
  const generateOrderId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRV-${timestamp}-${random}`;
  };
  
  // Helper function: Calculate number of products from lotto tickets
  // Every 5 tickets = 1 product (1ชุด)
  // Example: 6 tickets = 2 products (5 tickets = 1st product, 6th ticket = 2nd product)
  const calculateLottoProducts = (ticketCount: number): number => {
    return Math.ceil(ticketCount / 5);
  };

  // Helper function: Group lotto tickets into products (every 5 tickets = 1 product)
  const groupLottoTicketsIntoProducts = (tickets: any[], ticketPrice: number) => {
    const totalProducts = calculateLottoProducts(tickets.length);
    const products = [];
    
    for (let i = 0; i < totalProducts; i++) {
      const startIndex = i * 5;
      const endIndex = Math.min(startIndex + 5, tickets.length);
      const ticketsInProduct = tickets.slice(startIndex, endIndex);
      
      products.push({
        productIndex: i + 1,
        tickets: ticketsInProduct,
        ticketCount: ticketsInProduct.length,
        price: ticketPrice * ticketsInProduct.length, // Price for this product (up to 5 tickets)
        isFullProduct: ticketsInProduct.length === 5, // True if this product has 5 tickets
      });
    }
    
    return products;
  };

  // Create Stripe Checkout Session and redirect
  const handleStripeCheckout = async () => {
    // Check if user is logged in before proceeding
    if (!user) {
      showToast(t('loginRequired'), 'error');
      navigate('/login?redirect=' + encodeURIComponent(location.pathname));
      return;
    }

    // Verify Firebase auth state
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast(t('sessionExpired'), 'error');
        navigate('/login?redirect=' + encodeURIComponent(location.pathname));
        return;
      }
      
      // Try to get token to verify it's available
      const token = await currentUser.getIdToken(true); // Force refresh
      if (!token) {
        console.error('❌ CRITICAL: Token is null after getIdToken()', {
          userId: currentUser.uid,
          email: currentUser.email,
        });
        showToast(t('tokenError'), 'error');
        navigate('/login?redirect=' + encodeURIComponent(location.pathname));
        return;
      }
      
      console.log('✅ User authenticated, proceeding with checkout', {
        userId: currentUser.uid,
        email: currentUser.email,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
      });
      
      // Double-check that token will be sent
      console.log('🔐 Verification: Auth state before API call', {
        hasCurrentUser: !!auth.currentUser,
        userId: auth.currentUser?.uid,
        willSendToken: !!token,
      });
    } catch (authError: any) {
      console.error('❌ Authentication error:', authError);
      showToast(t('authError'), 'error');
      navigate('/login?redirect=' + encodeURIComponent(location.pathname));
      return;
    }

    setIsProcessing(true);
    
    try {
      // Generate Order ID
      const newOrderId = generateOrderId();
      setOrderId(newOrderId);
      
      // Create Checkout Session via API - prepare items for Stripe
      let checkoutItems;
      
      if (isLotto) {
        // For lotto: Group tickets into products (every 5 tickets = 1 product)
        const lottoProducts = groupLottoTicketsIntoProducts(lottoTickets, ticketPrice);
        
        checkoutItems = lottoProducts.map((product, index) => {
          // Create a representative ticket for the product (first ticket in group)
          const representativeTicket = product.tickets[0];
          
          return {
            name: `${t('specialProduct', { index: product.productIndex })} (${product.ticketCount} ${t('unitTicket')})`,
            price: product.price, // Total price for this product (up to 5 tickets)
            quantity: 1, // Always 1 product per group
            description: `${representativeTicket?.type || 'Lottery'} Ticket - Set ${product.productIndex} (${product.ticketCount}/${product.isFullProduct ? '5' : product.ticketCount})`,
            image: representativeTicket?.image,
            ticketPrice: ticketPrice,
            ticketCount: product.ticketCount,
            productIndex: product.productIndex,
            tickets: product.tickets, // Include all tickets in this product
            isLottoProduct: true,
          };
        });
      } else {
        // For marketplace items: use existing logic
        checkoutItems = items.map((item: any) => {
          const itemPrice = item.price || item.priceTHB || item.total || 0;
          
          return {
            name: item.productName,
            price: itemPrice,
            quantity: item.quantity || 1,
            description: item.description,
            image: item.image,
          };
        });
      }
      
      const response = await paymentAPI.createCheckoutSession({
        items: checkoutItems,
        total: total,
        orderId: newOrderId,
        successUrl: `${window.location.origin}/checkout?payment=success`,
        cancelUrl: `${window.location.origin}/checkout?payment=cancel`,
        customerEmail: user?.email,
        isLotto: isLotto,
        uiMode: checkoutMode, // 'hosted' or 'embedded'
      });
      
      // Save order data to localStorage after creating checkout session
      const orderData = {
        orderId: newOrderId,
        items: checkoutItems, // Save processed items (already grouped into products for lotto)
        total: total,
        isLotto: isLotto,
        address: address,
        status: 'pending',
        paymentMethod: 'stripe_checkout',
        createdAt: new Date().toISOString(),
        userEmail: user?.email || 'guest',
        // For lotto: save original tickets and product count
        ...(isLotto && {
          originalTickets: lottoTickets,
          ticketCount: lottoTickets.length,
          productCount: calculateLottoProducts(lottoTickets.length),
        }),
      };
      localStorage.setItem(`order_${newOrderId}`, JSON.stringify(orderData));
      
      if (response.success) {
        // Save session ID
        localStorage.setItem(`session_${newOrderId}`, response.sessionId);
        
        console.log('✅ Checkout session created:', {
          sessionId: response.sessionId,
          clientSecret: response.clientSecret,
          url: response.url,
          uiMode: response.uiMode,
          checkoutMode,
        });
        
        if ((checkoutMode === 'embedded' || checkoutMode === 'custom') && response.clientSecret) {
          // Embedded/Custom mode: show embedded checkout with PaymentElement
          console.log('✅ Setting clientSecret and moving to step 3');
          setClientSecret(response.clientSecret);
          setStep(3); // Go to embedded checkout step
          showToast(t('loadingPayment'), 'info');
        } else if (response.url) {
          // Hosted mode: redirect to Stripe
          console.log('✅ Redirecting to Stripe hosted checkout');
          showToast(t('redirectingPayment'), 'info');
          window.location.href = response.url;
        } else {
          console.error('❌ No checkout URL or client secret received:', response);
          throw new Error('No checkout URL or client secret received');
        }
      } else {
        console.error('❌ Checkout session creation failed:', response);
        throw new Error(response.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      // Safely log error details without rendering objects
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        hasResponseData: !!error.response?.data,
      };
      console.error('Error details:', errorDetails);
      if (error.response?.data) {
        // Log response data separately to avoid rendering issues
        try {
          const responseDataStr = typeof error.response.data === 'string' 
            ? error.response.data 
            : JSON.stringify(error.response.data);
          console.error('Response data:', responseDataStr);
        } catch (e) {
          console.error('Response data (could not stringify):', error.response.data);
        }
      }
      // Extract error message, handling both string and object formats
      const errorData = error.response?.data?.error || error.response?.data?.message;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (errorData?.message || errorData?.error || error.message || t('checkoutError'));
      showToast(errorMessage || t('checkoutError'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Verify payment session on return from Stripe
  const verifyPaymentSession = async (sessionId: string, returnedOrderId: string) => {
    setIsVerifying(true);
    
    try {
      const response = await paymentAPI.verifyCheckoutSession(sessionId);
      
      console.log('Payment verification response:', response);
      
      if (response.success && response.isPaid) {
        // Get order data from localStorage
        const orderData = JSON.parse(localStorage.getItem(`order_${returnedOrderId}`) || '{}');
        
        // Update order data with payment information from Stripe
        const updatedOrderData = {
          ...orderData,
          status: 'paid',
          paidAt: response.session.paymentDate || new Date().toISOString(),
          stripeSessionId: sessionId,
          paymentInfo: {
            amountTotal: response.session.amountTotalFormatted || `฿${((response.session.amountTotal || 0) / 100).toLocaleString()}`,
            amountTotalRaw: response.session.amountTotal || 0, // Store raw amount in satang/cents
            currency: response.session.currency,
            paymentStatus: response.session.paymentStatus,
            customerEmail: response.session.customerEmail,
            paymentMethod: response.paymentIntent?.payment_method_types?.[0] || 'card',
            validatedTotal: response.metadata?.validatedTotal || (response.session.amountTotal ? response.session.amountTotal / 100 : null),
          },
          stripePaymentIntentId: response.paymentIntent?.id,
        };
        
        // Save updated order to localStorage
        localStorage.setItem(`order_${returnedOrderId}`, JSON.stringify(updatedOrderData));
        
        // Save order to Firestore via placeOrder
        try {
          // Prepare order data with proper structure
          const orderToSave: any = {
            id: returnedOrderId,
            date: new Date().toLocaleString('en-GB', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit'
            }),
            items: orderData.items || items, // Use items from saved order data (already grouped for lotto)
            total: response.metadata?.validatedTotal || (response.session.amountTotal ? response.session.amountTotal / 100 : total),
            status: 'Paid',
            type: isLotto ? 'lotto' : 'marketplace',
            paymentMethod: 'stripe_checkout',
            paymentIntentId: response.paymentIntent?.id,
            stripeSessionId: sessionId,
            paymentInfo: updatedOrderData.paymentInfo,
          };
          
          // For lotto orders, add additional required fields for AdminLottoOrders
          if (isLotto) {
            // Include customer information
            orderToSave.customerName = user?.name || user?.email?.split('@')[0] || 'Guest';
            orderToSave.customerEmail = user?.email || response.session.customerEmail || '';
            orderToSave.customerPhone = user?.phoneNumber || '';
            
            // Include original tickets data for lotto orders (THIS IS CRITICAL - all individual tickets)
            const finalTickets = orderData.originalTickets || lottoTickets;
            orderToSave.originalTickets = finalTickets;
            orderToSave.ticketCount = finalTickets.length;
            orderToSave.productCount = calculateLottoProducts(finalTickets.length);
            
            // IMPORTANT: Also set tickets field for AdminLottoOrders to read from
            // This ensures all individual tickets are saved separately from grouped products
            orderToSave.tickets = finalTickets;
            
            // Include order number format for lotto
            orderToSave.orderNumber = `LTO-${new Date().getFullYear()}-${returnedOrderId.split('-').pop() || returnedOrderId.slice(-6)}`;
            
            // Include address if available
            if (address) {
              orderToSave.customerAddress = address;
            }
            
            // Include draw date (default to next draw)
            orderToSave.drawDate = orderData.drawDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 days from now
            
            console.log('🎫 Lotto Order Tickets Info:', {
              ticketCount: finalTickets.length,
              productCount: orderToSave.productCount,
              ticketsSample: finalTickets.slice(0, 3).map((t: any) => ({
                numbers: t.numbers,
                type: t.type,
                special: t.special,
              })),
            });
          }
          
          console.log('💾 Saving order to Firestore:', {
            orderId: returnedOrderId,
            type: orderToSave.type,
            itemsCount: orderToSave.items?.length || 0, // Grouped products count
            ticketsCount: isLotto ? orderToSave.tickets?.length : undefined, // Individual tickets count
            total: orderToSave.total,
            isLotto,
            ticketCount: isLotto ? orderToSave.ticketCount : undefined,
            productCount: isLotto ? orderToSave.productCount : undefined,
          });
          
          await placeOrder(orderToSave);
          
          console.log('✅ Order saved successfully to Firestore');
          
          // Clear cart if it was a marketplace order
          if (!isLotto) {
            clearCart();
          }
          
          console.log('Order saved to Firestore successfully');
        } catch (orderError: any) {
          console.error('Error saving order to Firestore:', orderError);
          // Continue even if Firestore save fails - order is already in localStorage
        }
        
        setOrderStatus('paid');
        setOrderId(returnedOrderId);
        setStep(4); // Go to success page
        showToast(t('paymentSuccess'), 'success');
      } else {
        // Payment not complete
        setOrderStatus('pending');
        showToast(t('paymentPending'), 'warning');
      }
    } catch (error: any) {
      console.error('Error verifying session:', error);
      // Safely log error details without rendering objects
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        hasResponseData: !!error.response?.data,
      };
      console.error('Error details:', errorDetails);
      if (error.response?.data) {
        try {
          const responseDataStr = typeof error.response.data === 'string' 
            ? error.response.data 
            : JSON.stringify(error.response.data);
          console.error('Response data:', responseDataStr);
        } catch (e) {
          console.error('Response data (could not stringify)');
        }
      }
      
      // If we got here from Stripe success_url, still show success but log warning
      if (sessionId && returnedOrderId) {
        console.warn('Verification failed but proceeding with success page (came from Stripe success URL)');
        setOrderStatus('paid');
        setOrderId(returnedOrderId);
        setStep(4);
        showToast(t('paymentVerifying'), 'info');
      } else {
        showToast(t('paymentVerifyFailed'), 'error');
      }
    } finally {
      setIsVerifying(false);
    }
  };
  
  const { cart, placeOrder, clearCart, savedCards, addSavedCard, user, showToast } = useGlobal();
  
  // Logic to handle Special Products Checkout vs Normal Cart Checkout
  const isLotto = location.state?.source === 'special-products' || location.state?.source === 'lotto';
  const lottoTickets = location.state?.tickets || [];
  
  // Determine Items
  const items = isLotto ? lottoTickets : cart;

  // Calculate Totals - Price will be loaded from Firestore
  // Must declare ticketPrice BEFORE using it in useMemo
  const [ticketPrice, setTicketPrice] = useState(156); // Default fallback
  
  // For lotto: Calculate products (every 5 tickets = 1 product)
  // Memoize this to avoid recalculating on every render
  const lottoProducts = React.useMemo(() => {
    if (!isLotto || lottoTickets.length === 0) return [];
    return groupLottoTicketsIntoProducts(lottoTickets, ticketPrice);
  }, [isLotto, lottoTickets, ticketPrice]);
  
  useEffect(() => {
    if (isLotto) {
      // Load ticket price from Firestore
      import('../services/lottoPricingService').then(({ getTicketPriceTHB }) => {
        getTicketPriceTHB('powerball').then(price => setTicketPrice(price));
      });
    }
  }, [isLotto]);

  const subtotal = isLotto 
    ? lottoTickets.length * ticketPrice 
    : cart.reduce((sum, item) => sum + (item.priceTHB * item.quantity), 0);
  
  const shipping = isLotto ? 0 : (subtotal > 2500 ? 0 : 45);
  const total = subtotal + shipping;

  // Address Form State
  const getStorageKey = () => {
    return user?.id ? `truvamate_address_${user.id}` : 'truvamate_address';
  };

  const loadSavedAddress = () => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  };

  const [address, setAddress] = useState(() => {
    const saved = loadSavedAddress();
    return saved || {
      fullName: '',
      phone: '',
      address: '',
      province: '',
      postalCode: ''
    };
  });

  const [rememberAddress, setRememberAddress] = useState(false);

  // Credit Card Form State
  const [selectedCardId, setSelectedCardId] = useState<string>(savedCards.length > 0 ? savedCards[0].id : 'new');
  const [newCardData, setNewCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [saveCardForLater, setSaveCardForLater] = useState(false);

  // Stripe QR Code State
  const [stripeQrCode, setStripeQrCode] = useState<{ qrCodeUrl?: string; paymentIntentId?: string; paymentId?: string } | null>(null);
  const [loadingQrCode, setLoadingQrCode] = useState(false);
  const [qrCodePaymentStatus, setQrCodePaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');
  
  // Bank/PromptPay QR Code State
  const [bankQrCode, setBankQrCode] = useState<{ qrCodeUrl?: string; paymentIntentId?: string; paymentId?: string } | null>(null);
  const [loadingBankQrCode, setLoadingBankQrCode] = useState(false);
  const [bankQrCodePaymentStatus, setBankQrCodePaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');

  // Handle return from Stripe Checkout - MUST run first to prevent step reset
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const returnedOrderId = searchParams.get('order_id');
    
    if (paymentStatus === 'success' && sessionId) {
      // Verify payment with backend
      if (returnedOrderId) {
        setOrderId(returnedOrderId); // Set orderId first
        verifyPaymentSession(sessionId, returnedOrderId);
      } else {
        // Try to find order from localStorage
        const keys = Object.keys(localStorage).filter(k => k.startsWith('session_'));
        for (const key of keys) {
          const savedSession = localStorage.getItem(key);
          if (savedSession === sessionId) {
            const oid = key.replace('session_', '');
            setOrderId(oid); // Set orderId first
            verifyPaymentSession(sessionId, oid);
            break;
          }
        }
      }
      return; // Don't continue to step initialization
    } else if (paymentStatus === 'cancel') {
      showToast(t('paymentCancelled'), 'warning');
      if (isLotto) {
        setStep(2);
      } else {
        setStep(1);
      }
      return; // Don't continue to step initialization
    }

    // Initialize step based on source (only if not coming from payment return and not already on success page)
    // For Lotto: start at step 2 (payment)
    // For normal cart: start at step 1 (address)
    // But only if we're not already on step 4 (success) or step 3 (payment processing)
    // Note: paymentStatus already declared above in this useEffect
    if (!paymentStatus && step < 3) {
      if (isLotto && step === 1) {
        setStep(2);
      } else if (!isLotto && step < 1) {
        setStep(1);
      }
    }
  }, [searchParams, isLotto, step]);

  // Initialize step based on source
  // For Lotto: start at step 2 (payment)
  // For normal cart: start at step 1 (address)

  // Handle QR Code generation when moving to payment step (step 3)
  useEffect(() => {
    // Only create QR codes when we reach step 3 (payment display step)
    if (step === 3) {
      if (paymentMethod === 'stripe_qr') {
        createStripeQrCode();
      } else if (paymentMethod === 'bank' || paymentMethod === 'promptpay') {
        createBankQrCode();
      }
    } else {
      // Clear QR codes when not on payment display step
      if (paymentMethod !== 'stripe_qr') {
        setStripeQrCode(null);
        setQrCodePaymentStatus('pending');
      }
      if (paymentMethod !== 'bank' && paymentMethod !== 'promptpay') {
        setBankQrCode(null);
        setBankQrCodePaymentStatus('pending');
      }
    }
  }, [paymentMethod, step]);

  // Poll for payment status when QR code is displayed
  useEffect(() => {
    if (!stripeQrCode?.paymentIntentId || qrCodePaymentStatus !== 'pending') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await paymentAPI.getPaymentIntentStatus(stripeQrCode.paymentIntentId!);
        if (response.data.success) {
          const status = response.data.status;
          if (status === 'succeeded') {
            setQrCodePaymentStatus('succeeded');
            // Auto proceed to order confirmation after a short delay
            setTimeout(() => {
              handleConfirmOrder();
            }, 2000);
          } else if (status === 'processing') {
            setQrCodePaymentStatus('processing');
          } else if (status === 'requires_payment_method' || status === 'canceled') {
            setQrCodePaymentStatus('failed');
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [stripeQrCode, qrCodePaymentStatus]);

  // Poll for bank/PromptPay payment status when QR code is displayed
  useEffect(() => {
    if (!bankQrCode?.paymentIntentId || bankQrCodePaymentStatus !== 'pending') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await paymentAPI.getPaymentIntentStatus(bankQrCode.paymentIntentId!);
        if (response.data.success) {
          const status = response.data.status;
          if (status === 'succeeded') {
            setBankQrCodePaymentStatus('succeeded');
            // Auto proceed to order confirmation after a short delay
            setTimeout(() => {
              handleConfirmOrder();
            }, 2000);
          } else if (status === 'processing') {
            setBankQrCodePaymentStatus('processing');
          } else if (status === 'requires_payment_method' || status === 'canceled') {
            setBankQrCodePaymentStatus('failed');
          }
        }
      } catch (error) {
        console.error('Error polling bank payment status:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [bankQrCode, bankQrCodePaymentStatus]);

  const createStripeQrCode = async () => {
    setLoadingQrCode(true);
    try {
      const response = await paymentAPI.createIntent({
        amount: total,
        currency: 'thb',
        paymentMethod: 'stripe_qr',
      });

      console.log('Payment Intent Response:', response.data);

      if (response.data.success) {
        // Check if QR code methods are not available in this region
        if (response.data.qrCodeUnavailable) {
          console.warn('QR code payment methods not available:', response.data.message);
          setStripeQrCode(null);
          // Show user-friendly message
          showToast('QR code payment (Alipay/WeChat Pay) is not available in your region. Please use Credit/Debit Card instead.', 'info');
          // Switch to card payment method automatically
          setPaymentMethod('card');
          return;
        }

        const qrCodeData = response.data.qrCodeData;
        const payment = response.data.payment;
        const clientSecret = response.data.clientSecret;
        
        // Check if QR code data is available
        if (qrCodeData && (qrCodeData.qrCodeUrl || qrCodeData.redirectUrl)) {
          setStripeQrCode({
            qrCodeUrl: qrCodeData.qrCodeUrl || qrCodeData.redirectUrl,
            paymentIntentId: payment?.stripePaymentIntentId,
            paymentId: response.data.paymentId,
          });
          setQrCodePaymentStatus('pending');
        } else if (clientSecret) {
          // If we have clientSecret but no QR code, payment intent was created
          // but QR code may need to be confirmed first
          console.warn('Payment intent created but QR code not yet available. Payment Intent ID:', payment?.stripePaymentIntentId);
          console.warn('Response data:', response.data);
          
          // Still set the payment intent ID so we can check status
          setStripeQrCode({
            paymentIntentId: payment?.stripePaymentIntentId,
            paymentId: response.data.paymentId,
          });
          setQrCodePaymentStatus('pending');
          
          // Show message to user
          console.error('QR code will be available after payment confirmation. Please try a different payment method or contact support.');
          setStripeQrCode(null);
        } else {
          console.error('QR code data not available in response:', response.data);
          console.error('Full response:', JSON.stringify(response.data, null, 2));
          setStripeQrCode(null);
        }
      } else {
        console.error('Failed to create QR code. Response:', response.data);
        setStripeQrCode(null);
      }
    } catch (error: any) {
      console.error('Error creating Stripe QR code:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data || error.message);
      
      // Check if QR code is unavailable (e.g., not supported in region)
      if (error.response?.data?.qrCodeUnavailable || 
          error.response?.status === 400 && 
          (error.response?.data?.message?.includes('not available') || 
           error.response?.data?.message?.includes('not currently available'))) {
        console.warn('QR code payment methods not available:', error.response?.data?.message);
        setStripeQrCode(null);
        // Show user-friendly message and switch to card payment
        showToast('QR code payment (Alipay/WeChat Pay) is not available in your region. Please use Credit/Debit Card instead.', 'info');
        setPaymentMethod('card');
      } else if (error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
        showToast('Authentication failed. Please log in again.', 'error');
      } else if (error.response?.status === 503) {
        console.error('Payment gateway not configured. Please contact support.');
        showToast('Payment gateway not configured. Please contact support.', 'error');
      } else {
        console.error('Failed to create payment QR code. Please try again.');
        showToast('Failed to create payment QR code. Please try again.', 'error');
      }
      setStripeQrCode(null);
    } finally {
      setLoadingQrCode(false);
    }
  };

  const createBankQrCode = async () => {
    setLoadingBankQrCode(true);
    try {
      console.log('🔄 Creating PromptPay/Bank QR code...', {
        amount: total,
        currency: 'thb',
        paymentMethod: paymentMethod === 'promptpay' ? 'promptpay' : 'bank',
      });

      const response = await paymentAPI.createIntent({
        amount: total,
        currency: 'thb',
        paymentMethod: paymentMethod === 'promptpay' ? 'promptpay' : 'bank', // Use 'promptpay' or 'bank' to trigger PromptPay
      });

      console.log('✅ Bank Payment Intent Response:', response.data);

      if (response.data.success) {
        // Check if QR code is unavailable
        if (response.data.qrCodeUnavailable) {
          console.warn('PromptPay QR code not available:', response.data.message);
          setBankQrCode(null);
          showToast(response.data.message || 'PromptPay QR code is not available. Please ensure PromptPay is enabled in your Stripe account settings, or use Credit/Debit Card instead.', 'info');
          // Optionally switch to card payment
          // setPaymentMethod('card');
          return;
        }

        const qrCodeData = response.data.qrCodeData;
        const payment = response.data.payment;
        
        // Check if QR code data is available
        if (qrCodeData && qrCodeData.qrCodeUrl) {
          setBankQrCode({
            qrCodeUrl: qrCodeData.qrCodeUrl,
            paymentIntentId: payment?.stripePaymentIntentId,
            paymentId: response.data.paymentId,
          });
          setBankQrCodePaymentStatus('pending');
        } else {
          console.error('QR code data not available in response:', response.data);
          setBankQrCode(null);
          // Check if we have a client secret but no QR code - might need to enable PromptPay
          if (response.data.clientSecret && response.data.paymentIntentStatus === 'requires_payment_method') {
            showToast('PromptPay QR code is not available. Please ensure PromptPay is enabled in your Stripe Dashboard (Settings → Payment methods).', 'warning');
          } else {
            showToast(t('qrCreateFailedGeneric'), 'error');
          }
        }
      } else {
        console.error('Failed to create bank QR code. Response:', response.data);
        setBankQrCode(null);
        showToast(t('qrCreateFailedGeneric'), 'error');
      }
    } catch (error: any) {
      console.error('❌ Error creating bank QR code:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error config:', error.config);
      
      setBankQrCode(null);
      
      // Show more specific error messages based on error type
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        console.error('🔴 Network Error: Backend server may not be running');
        showToast(t('networkError'), 'error');
      } else if (error.response?.status === 401) {
        console.error('🔴 Authentication Error: User not logged in');
        showToast(t('loginAgain'), 'error');
      } else if (error.response?.status === 403) {
        console.error('🔴 Forbidden: Insufficient permissions');
        showToast(t('noPermission'), 'error');
      } else if (error.response?.status === 400) {
        // Extract error message, handling both string and object formats
        const errorData = error.response?.data?.error || error.response?.data?.message;
        const errorMsg = typeof errorData === 'string' 
          ? errorData 
          : (errorData?.message || errorData?.error || JSON.stringify(errorData));
        console.error('🔴 Bad Request:', errorMsg);
        showToast(errorMsg || t('invalidData'), 'error');
      } else if (error.response?.status === 500) {
        // Extract error message, handling both string and object formats
        const errorData = error.response?.data?.error || error.response?.data?.message;
        const errorDetails = typeof errorData === 'string' 
          ? errorData 
          : (errorData?.message || errorData?.error || JSON.stringify(errorData));
        console.error('🔴 Server Error:', errorDetails);
        console.error('Full error response:', JSON.stringify(error.response?.data, null, 2));
        showToast(errorDetails || t('serverError'), 'error');
      } else if (error.response?.status) {
        console.error(`🔴 HTTP Error ${error.response.status}:`, error.response?.data);
        showToast(t('httpError', { status: error.response.status }), 'error');
      } else {
        console.error('🔴 Unknown Error:', error);
        showToast(t('qrCreateFailedGeneric'), 'error');
      }
    } finally {
      setLoadingBankQrCode(false);
    }
  };

  // Load saved address when user changes
  useEffect(() => {
    const saved = loadSavedAddress();
    if (saved) {
      setAddress(saved);
      setRememberAddress(true);
    }
  }, [user?.id]);

  // Handle address field changes
  const handleAddressChange = (field: string, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save address when proceeding to next step
  const handleProceedToPayment = () => {
    if (rememberAddress) {
      localStorage.setItem(getStorageKey(), JSON.stringify(address));
    }
    setStep(2);
  };

  // Handle payment method selection next - go to payment/QR code display step
  const handlePaymentMethodNext = () => {
    // For QR code payment methods, go to step 3 (QR code display)
    // For card payment, also go to step 3 (card confirmation)
    if (paymentMethod === 'stripe_qr' || paymentMethod === 'bank' || paymentMethod === 'promptpay' || paymentMethod === 'card') {
      setStep(3);
    } else {
      showToast(t('selectPaymentMethod'), 'error');
    }
  };

  const handleConfirmOrder = async () => {
    // For QR code payments (Stripe QR or Bank/PromptPay), save order when payment succeeds
    if (paymentMethod === 'stripe_qr' && qrCodePaymentStatus === 'succeeded') {
      try {
        const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
        const orderToSave: any = {
          id: orderId,
          date: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}),
          items: items,
          total: total,
          status: 'Paid',
          type: isLotto ? 'lotto' : 'marketplace',
          paymentMethod: 'stripe_qr',
          paymentIntentId: stripeQrCode?.paymentIntentId,
          paymentId: stripeQrCode?.paymentId,
        };
        
          // For lotto orders, add additional required fields
          if (isLotto) {
            orderToSave.customerName = user?.name || user?.email?.split('@')[0] || 'Guest';
            orderToSave.customerEmail = user?.email || '';
            orderToSave.customerPhone = user?.phoneNumber || '';
            // CRITICAL: Save all individual tickets
            orderToSave.originalTickets = lottoTickets;
            orderToSave.tickets = lottoTickets; // Also set tickets field for AdminLottoOrders
            orderToSave.ticketCount = lottoTickets.length;
            orderToSave.productCount = calculateLottoProducts(lottoTickets.length);
            orderToSave.orderNumber = `LTO-${new Date().getFullYear()}-${orderId.split('-').pop() || orderId.slice(-6)}`;
            if (address) {
              orderToSave.customerAddress = address;
            }
            orderToSave.drawDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            console.log('🎫 Lotto Order Tickets Info (Card Payment):', {
              ticketCount: lottoTickets.length,
              productCount: orderToSave.productCount,
              ticketsSample: lottoTickets.slice(0, 3).map((t: any) => ({
                numbers: t.numbers,
                type: t.type,
                special: t.special,
              })),
            });
          }
        
        await placeOrder(orderToSave);
        
        if (!isLotto) {
          clearCart();
        }
        
        showToast(t('paymentSuccess'), 'success');
        setStep(4);
      } catch (error: any) {
        console.error('Error saving QR code order:', error);
        showToast(t('orderSaveFailed'), 'error');
      }
      return;
    }
    
    // For Bank/PromptPay QR code payments
    if ((paymentMethod === 'bank' || paymentMethod === 'promptpay') && bankQrCodePaymentStatus === 'succeeded') {
      try {
        const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
        const orderToSave: any = {
          id: orderId,
          date: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}),
          items: items,
          total: total,
          status: 'Paid',
          type: isLotto ? 'lotto' : 'marketplace',
          paymentMethod: paymentMethod,
          paymentIntentId: bankQrCode?.paymentIntentId,
          paymentId: bankQrCode?.paymentId,
        };
        
          // For lotto orders, add additional required fields
          if (isLotto) {
            orderToSave.customerName = user?.name || user?.email?.split('@')[0] || 'Guest';
            orderToSave.customerEmail = user?.email || '';
            orderToSave.customerPhone = user?.phoneNumber || '';
            // CRITICAL: Save all individual tickets
            orderToSave.originalTickets = lottoTickets;
            orderToSave.tickets = lottoTickets; // Also set tickets field for AdminLottoOrders
            orderToSave.ticketCount = lottoTickets.length;
            orderToSave.productCount = calculateLottoProducts(lottoTickets.length);
            orderToSave.orderNumber = `LTO-${new Date().getFullYear()}-${orderId.split('-').pop() || orderId.slice(-6)}`;
            if (address) {
              orderToSave.customerAddress = address;
            }
            orderToSave.drawDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            console.log('🎫 Lotto Order Tickets Info (Card Payment):', {
              ticketCount: lottoTickets.length,
              productCount: orderToSave.productCount,
              ticketsSample: lottoTickets.slice(0, 3).map((t: any) => ({
                numbers: t.numbers,
                type: t.type,
                special: t.special,
              })),
            });
          }
        
        await placeOrder(orderToSave);
        
        if (!isLotto) {
          clearCart();
        }
        
        showToast(t('paymentSuccess'), 'success');
        setStep(4);
      } catch (error: any) {
        console.error('Error saving Bank/PromptPay order:', error);
        showToast(t('orderSaveFailed'), 'error');
      }
      return;
    }

    // For credit card payment, create payment intent and confirm payment
    if (paymentMethod === 'card') {
      try {
        // Validate card data if using new card
        if (selectedCardId === 'new') {
          if (!newCardData.number || !newCardData.name || !newCardData.expiry || !newCardData.cvv) {
            showToast(t('fillCardInfo'), 'error');
            return;
          }
        }

        // Create payment intent for card payment
        const response = await paymentAPI.createIntent({
          amount: total,
          currency: 'thb',
          paymentMethod: 'card',
        });

        if (response.data.success && response.data.clientSecret) {
          // For now, we'll use the clientSecret for Stripe.js integration
          // In a full implementation, you would use Stripe.js Elements here
          // For now, we'll proceed with the order as the payment intent is created
          
    // If using a new card and opted to save it
          if (selectedCardId === 'new' && saveCardForLater && newCardData.number) {
            addSavedCard({
              type: 'visa', // Mocking detection
              last4: newCardData.number.slice(-4) || '0000',
              holderName: newCardData.name || 'Card Holder',
              expiry: newCardData.expiry || '12/25'
            });
          }

          // Prepare order data
          const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
          const orderToSave: any = {
            id: orderId,
            date: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}),
            items: items,
            total: total,
            status: 'Paid', // Payment intent created successfully
            type: isLotto ? 'lotto' : 'marketplace',
            paymentMethod: paymentMethod,
            paymentIntentId: response.data.payment?.stripePaymentIntentId,
            paymentId: response.data.paymentId,
          };
          
          // For lotto orders, add additional required fields
          if (isLotto) {
            orderToSave.customerName = user?.name || user?.email?.split('@')[0] || 'Guest';
            orderToSave.customerEmail = user?.email || '';
            orderToSave.customerPhone = user?.phoneNumber || '';
            orderToSave.originalTickets = lottoTickets;
            orderToSave.tickets = lottoTickets; // CRITICAL: Also set tickets field for AdminLottoOrders
            orderToSave.ticketCount = lottoTickets.length;
            orderToSave.productCount = calculateLottoProducts(lottoTickets.length);
            orderToSave.orderNumber = `LTO-${new Date().getFullYear()}-${orderId.split('-').pop() || orderId.slice(-6)}`;
            if (address) {
              orderToSave.customerAddress = address;
            }
            orderToSave.drawDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 days from now
            
            console.log('🎫 Lotto Order Tickets Info (Card Payment):', {
              ticketCount: lottoTickets.length,
              productCount: orderToSave.productCount,
              ticketsSample: lottoTickets.slice(0, 3).map((t: any) => ({
                numbers: t.numbers,
                type: t.type,
                special: t.special,
              })),
            });
          }
          
          // Save to global history and Firestore
          await placeOrder(orderToSave);

          // Clear cart if it was a marketplace order
          if (!isLotto) {
            clearCart();
          }

          showToast(t('paymentSuccess'), 'success');
          setStep(4);
        } else {
          showToast(t('paymentIntentFailed'), 'error');
        }
      } catch (error: any) {
        console.error('Error processing card payment:', error);
        // Extract error message, handling both string and object formats
        const errorData = error.response?.data?.error;
        const errorMsg = typeof errorData === 'string' 
          ? errorData 
          : (errorData?.message || errorData?.error || t('paymentError'));
        showToast(errorMsg || t('paymentError'), 'error');
      }
      return;
    }

    // For other payment methods, proceed as before
    // If using a new card and opted to save it (shouldn't reach here for card, but keeping for safety)
    if (paymentMethod === 'card' && selectedCardId === 'new' && saveCardForLater && newCardData.number) {
       addSavedCard({
         type: 'visa', // Mocking detection
         last4: newCardData.number.slice(-4) || '0000',
         holderName: newCardData.name || 'Card Holder',
         expiry: newCardData.expiry || '12/25'
       });
    }

    // Save to global history and Firestore
    await placeOrder({
      id: `ORD-2023-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}),
      items: items,
      total: total,
          status: isLotto ? 'Waiting for Draw' : (paymentMethod === 'stripe_qr' || paymentMethod === 'bank' || paymentMethod === 'promptpay') ? 'Paid' : (paymentMethod === 'card' ? 'Paid' : 'Pending'),
      type: isLotto ? 'lotto' : 'marketplace',
      paymentMethod: paymentMethod
    });

    // Clear cart if it was a marketplace order
    if (!isLotto) {
      clearCart();
    }

    setStep(4); // Go to success page
  };

  // Step 3: Payment/QR Code Display, Embedded Checkout, or Card Confirmation
  if (step === 3 && paymentMethod !== 'stripe_link') {
    // For Stripe Checkout Embedded Mode
    console.log('🔍 Step 3 render check:', {
      step,
      paymentMethod,
      clientSecret: clientSecret ? 'present' : 'missing',
      orderId,
    });
    
    if (paymentMethod === 'stripe_checkout') {
      if (!clientSecret) {
    return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
              <p className="text-yellow-600 font-bold mb-2">{t('loading')}</p>
              <p className="text-sm text-yellow-700">{t('pleaseWait')}</p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  {t('back')}
                </Button>
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <CreditCard size={24} className="text-brand-gold" />
              {t('payWithStripe')}
            </h2>
            
            <div className="mb-6">
              <StripeEmbeddedCheckout
                clientSecret={clientSecret}
                onComplete={async () => {
                  // Payment completed via embedded checkout
                  const sessionId = localStorage.getItem(`session_${orderId}`);
                  if (sessionId && orderId) {
                    await verifyPaymentSession(sessionId, orderId);
                  }
                }}
                onError={(error) => {
                  console.error('Stripe checkout error:', error);
                  showToast(t('stripePaymentError') + error.message, 'error');
                }}
              />
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => {
                setStep(2);
                setClientSecret(null);
              }} className="text-slate-500">
                {t('goBack')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // For QR code payment methods, show QR code screen
    if (paymentMethod === 'stripe_qr' || paymentMethod === 'bank' || paymentMethod === 'promptpay') {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <QrCode size={24} className="text-brand-gold" />
              {t('scanQrToPay')}
            </h2>
            
            {/* Stripe QR Code Display */}
            {(paymentMethod === 'stripe_qr' && stripeQrCode?.qrCodeUrl) && (
              <div className="text-center space-y-4">
                <div className="bg-white p-6 rounded-lg border-2 border-slate-200 inline-block">
                  <img 
                    src={stripeQrCode.qrCodeUrl.startsWith('http') 
                      ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(stripeQrCode.qrCodeUrl)}`
                      : `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(stripeQrCode.qrCodeUrl)}`} 
                    alt="QR Code" 
                    className="w-80 h-80 mx-auto" 
                  />
                </div>
                <p className="text-slate-600">{t('scanWithApp', { app: stripeQrCode.qrCodeUrl.startsWith('http') ? 'Alipay' : 'WeChat Pay' })}</p>
                <div className="text-sm text-slate-500">
                  {t('status')}: {qrCodePaymentStatus === 'pending' && t('statusPending')}
                  {qrCodePaymentStatus === 'processing' && t('statusProcessing')}
                  {qrCodePaymentStatus === 'succeeded' && t('statusSuccess')}
                </div>
                {qrCodePaymentStatus === 'succeeded' && (
                  <div className="mt-4">
                    <Button onClick={handleConfirmOrder}>{t('proceed')}</Button>
                  </div>
                )}
              </div>
            )}

            {/* PromptPay/Bank QR Code Display */}
            {(paymentMethod === 'bank' || paymentMethod === 'promptpay') && bankQrCode?.qrCodeUrl && (
              <div className="text-center space-y-4">
                <div className="bg-white p-6 rounded-lg border-2 border-slate-200 inline-block">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(bankQrCode.qrCodeUrl)}`} 
                    alt="PromptPay QR Code" 
                    className="w-80 h-80 mx-auto" 
                  />
                </div>
                <p className="text-slate-600">{t('scanWithBankApp')}</p>
                <div className="text-sm text-slate-500">
                  {t('status')}: {bankQrCodePaymentStatus === 'pending' && t('statusPending')}
                  {bankQrCodePaymentStatus === 'processing' && t('statusProcessing')}
                  {bankQrCodePaymentStatus === 'succeeded' && t('statusSuccess')}
                </div>
                {bankQrCodePaymentStatus === 'succeeded' && (
                  <div className="mt-4">
                    <Button onClick={handleConfirmOrder}>{t('proceed')}</Button>
                  </div>
                )}
              </div>
            )}

            {/* QR Code Loading/Error State */}
            {((paymentMethod === 'stripe_qr' && !stripeQrCode?.qrCodeUrl && !loadingQrCode) ||
              ((paymentMethod === 'bank' || paymentMethod === 'promptpay') && !bankQrCode?.qrCodeUrl && !loadingBankQrCode)) && (
              <div className="text-center py-12 space-y-4">
                {((paymentMethod === 'stripe_qr' && loadingQrCode) || 
                  ((paymentMethod === 'bank' || paymentMethod === 'promptpay') && loadingBankQrCode)) ? (
                  <>
                    <div className="animate-spin h-12 w-12 border-4 border-brand-navy border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-600">{t('creatingQr')}</p>
                  </>
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md mx-auto">
                    <div className="text-red-600 mb-4">
                      <p className="font-bold text-lg mb-2">{t('qrCreateFailed')}</p>
                      <p className="text-sm text-slate-600 mb-4">
                        {t('promptPayCheck')}
                      </p>
                      <ul className="text-sm text-left text-slate-700 space-y-2 mb-4">
                        <li>• {t('promptPayEnabled')}</li>
                        <li>• {t('promptPayCountry')}</li>
                        <li>• {t('promptPayLive')}</li>
                      </ul>
                      <p className="text-xs text-slate-500">
                        {t('promptPayDashboard')}
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => {
                        if (paymentMethod === 'stripe_qr') {
                          createStripeQrCode();
                        } else if (paymentMethod === 'bank' || paymentMethod === 'promptpay') {
                          createBankQrCode();
                        }
                      }} variant="outline" className="mt-2">
                        {t('tryAgain')}
                      </Button>
                      <Button onClick={() => setStep(2)} variant="ghost" className="mt-2">
                        {t('chooseOther')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-500">{t('goBack')}</Button>
            </div>
          </div>
        </div>
      );
    }

    // For card payment, show card form and confirmation
    if (paymentMethod === 'card') {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <CreditCard size={24} className="text-brand-gold" />
              {t('confirmCreditCard')}
            </h2>
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-4">{t('confirmPayment')}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{t('totalAmount')}</span>
                  <span className="font-black text-xl text-slate-900">฿{total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-500">{t('goBack')}</Button>
                <Button onClick={handleConfirmOrder} className="bg-brand-navy">{t('confirmPayment')}</Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  // Step 4: Success Page - รอตรวจสอบการชำระเงิน
  if (step === 4) {
    // Get order data from localStorage to display payment info
    const savedOrderData = orderId ? JSON.parse(localStorage.getItem(`order_${orderId}`) || '{}') : {};
    const paymentInfo = savedOrderData.paymentInfo || {};
    
    // Get items from saved order data (this is what was actually purchased)
    const orderItems = savedOrderData.items || items || [];
    
    // Use validated total from paymentInfo first, then fallback to order data
    // paymentInfo.amountTotal is formatted (e.g., "฿1,560"), so we need to extract the number
    const getPaymentAmount = (): number => {
      // PRIORITY 1: Try validatedTotal from paymentInfo (this is the actual amount charged)
      if (paymentInfo.validatedTotal !== undefined && paymentInfo.validatedTotal !== null) {
        const validatedTotal = typeof paymentInfo.validatedTotal === 'number' 
          ? paymentInfo.validatedTotal 
          : parseFloat(paymentInfo.validatedTotal);
        if (!isNaN(validatedTotal) && validatedTotal > 0) {
          console.log('✅ Using validatedTotal from paymentInfo:', validatedTotal);
          return validatedTotal;
        }
      }
      
      // PRIORITY 2: Try amountTotalRaw from paymentInfo (raw amount in satang/cents)
      if (paymentInfo.amountTotalRaw !== undefined && paymentInfo.amountTotalRaw !== null) {
        const amountTotalRaw = typeof paymentInfo.amountTotalRaw === 'number' 
          ? paymentInfo.amountTotalRaw / 100 // Convert from satang/cents to baht
          : parseFloat(paymentInfo.amountTotalRaw) / 100;
        if (!isNaN(amountTotalRaw) && amountTotalRaw > 0) {
          console.log('✅ Using amountTotalRaw from paymentInfo (converted from satang):', amountTotalRaw);
          return amountTotalRaw;
        }
      }
      
      // PRIORITY 3: Try to get from paymentInfo.amountTotal (from Stripe, formatted string)
      if (paymentInfo.amountTotal) {
        // Extract number from formatted string like "฿1,560" or "฿1560"
        const amountStr = paymentInfo.amountTotal.toString().replace(/[฿,\s]/g, '');
        const parsed = parseFloat(amountStr);
        if (!isNaN(parsed) && parsed > 0) {
          console.log('✅ Using amountTotal from paymentInfo (parsed):', parsed);
          return parsed;
        }
      }
      
      // PRIORITY 4: Try to get from savedOrderData.total (this should be the validated total)
      if (savedOrderData.total !== undefined && savedOrderData.total !== null) {
        const savedTotal = typeof savedOrderData.total === 'number' 
          ? savedOrderData.total 
          : parseFloat(savedOrderData.total);
        // Only use if it's greater than shipping cost (45) to avoid using shipping as total
        if (!isNaN(savedTotal) && savedTotal > 100) { // Assume real orders are > 100 baht
          console.log('✅ Using savedOrderData.total:', savedTotal);
          return savedTotal;
        } else {
          console.warn('⚠️ savedOrderData.total seems incorrect (too small):', savedTotal);
        }
      }
      
      // PRIORITY 5: Calculate from items if available
      if (orderItems.length > 0) {
        const calculatedTotal = orderItems.reduce((sum: number, item: any) => {
          const itemPrice = item.price || item.ticketPrice || item.total || 0;
          const quantity = item.quantity || 1;
          return sum + (itemPrice * quantity);
        }, 0);
        if (calculatedTotal > 0 && calculatedTotal > 100) { // Only use if reasonable
          console.log('✅ Using calculated total from items:', calculatedTotal);
          return calculatedTotal;
        }
      }
      
      // PRIORITY 6: Final fallback to current total (but only if reasonable)
      if (total && total > 100) {
        console.warn('⚠️ Using current total as fallback:', total);
        return total;
      }
      
      console.error('❌ Could not determine payment amount. All fallbacks failed.');
      return 0;
    };
    
    const orderTotal = getPaymentAmount();
    
    console.log('Success page data:', {
      orderId,
      savedOrderData,
      paymentInfo,
      orderItems,
      orderTotal,
      isLotto,
    });
    const paidAt = savedOrderData.paidAt ? new Date(savedOrderData.paidAt).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : new Date().toLocaleString('th-TH');
    
    return (
      <div className="min-h-[60vh] px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl mx-auto animate-bounce">
          <CheckCircle2 size={48} />
        </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">{t('paymentSuccessTitle')}</h1>
            <p className="text-slate-600 mb-6 font-medium text-lg">{t('thankYou')}</p>
            
            {/* Order ID Display */}
            {orderId && (
              <div className="bg-gradient-to-r from-brand-navy to-brand-navy/80 text-white px-8 py-4 rounded-xl mb-6 inline-block">
                <span className="text-sm font-medium opacity-90">{t('orderNumber')}: </span>
                <span className="font-mono font-bold text-xl">{orderId}</span>
        </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Payment Summary */}
            <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                {t('paymentSummary')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('amount')}</span>
                  <span className="font-bold text-slate-900 text-lg">
                    {paymentInfo.amountTotal || `฿${orderTotal.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('paymentMethodLabel')}</span>
                  <span className="font-semibold text-slate-900">
                    {paymentInfo.paymentMethod === 'card' ? t('creditDebit') : 
                     paymentInfo.paymentMethod === 'promptpay' ? 'PromptPay' :
                     paymentMethod === 'stripe_checkout' ? 'Stripe Checkout' : t('other')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('statusLabel')}</span>
                  <span className="font-semibold text-green-600">
                    {orderStatus === 'paid' ? t('paid') : t('pendingVerify')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('paymentDate')}</span>
                  <span className="font-semibold text-slate-900 text-sm">{paidAt}</span>
                </div>
                {paymentInfo.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Email</span>
                    <span className="font-semibold text-slate-900 text-sm">{paymentInfo.customerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="h-2 w-2 bg-brand-navy rounded-full"></div>
                {t('orderItems')}
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {orderItems.length > 0 ? (
                  orderItems.map((item: any, index: number) => {
                    // For lotto products, show product info with ticket count
                    if (isLotto && item.isLottoProduct) {
                      return (
                        <div key={index} className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 text-sm">
                              {item.name || t('specialProduct', { index: item.productIndex || index + 1 })}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {t('tickets', { count: item.ticketCount || item.quantity || 0 })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              ฿{(item.price || item.total || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    // For regular items or individual lotto tickets (legacy)
                    return (
                      <div key={index} className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-sm">
                            {item.name || item.productName || (isLotto ? `${item.type} - ${item.numbers?.join(', ')}` : 'Product')}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {t('quantity', { count: item.quantity || 1, unit: isLotto ? t('unitTicket') : t('unitPiece') })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">
                            ฿{((item.price || item.total || 0) * (item.quantity || 1)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-sm">{t('noItems')}</p>
                )}
                <div className="pt-3 border-t-2 border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{t('totalAmount')}</span>
                    <span className="font-black text-xl text-brand-navy">
                      {paymentInfo.amountTotal || `฿${orderTotal.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Info */}
          {orderStatus === 'paid' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="font-bold text-green-800">{t('paymentConfirmed')}</span>
              </div>
              <p className="text-sm text-green-700 text-center">
                {t('paymentConfirmedDesc')}
              </p>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-blue-800 mb-4 text-center">{t('whatsNext')}</h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-blue-500 mt-0.5" size={18} />
                <span>{t('emailConfirmation', { email: paymentInfo.customerEmail || user?.email || t('yourEmail') })}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-blue-500 mt-0.5" size={18} />
                <span>{t('trackOrder')} <Link to="/profile" className="underline font-semibold">"{t('myAccount')}"</Link></span>
              </li>
              {isLotto && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="text-blue-500 mt-0.5" size={18} />
                  <span>{t('lottoEmailNote')}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-blue-500 mt-0.5" size={18} />
                <span>{t('contactLine')}<span className="font-semibold">@truvamate</span></span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/profile">
              <Button className="w-full sm:w-auto" variant="outline" size="lg">
                {t('viewMyOrders')}
              </Button>
          </Link>
          <Link to="/">
              <Button className="w-full sm:w-auto" size="lg">
                {t('backToHome')}
              </Button>
          </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-10 gap-4 text-sm font-bold">
        {/* Step 1 is only for physical goods */}
        {!isLotto && (
          <>
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-brand-navy' : 'text-slate-300'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-brand-navy bg-brand-navy text-white' : 'border-slate-300'}`}>1</div>
              {t('shippingAddress')}
            </div>
            <div className={`w-12 h-1 ${step >= 2 ? 'text-brand-navy bg-brand-navy' : 'bg-slate-200'}`}></div>
          </>
        )}
        
        <div className={`flex items-center gap-2 ${(step >= 2 || isLotto) ? 'text-brand-navy' : 'text-slate-300'}`}>
           <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${(step >= 2 || isLotto) ? 'border-brand-navy bg-brand-navy text-white' : 'border-slate-300'}`}>
             {isLotto ? 1 : 2}
           </div>
          {t('title')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          
          {/* Step 1: Address (Skipped for สินค้าพิเศษ) */}
          {step === 1 && !isLotto && (
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="bg-brand-gold p-2 rounded-lg text-slate-900">
                  <MapPin size={24} />
                </div>
                {t('shippingAddressTitle')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">{t('fullName')} <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={address.fullName}
                    onChange={(e) => handleAddressChange('fullName', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900" 
                    placeholder={t('fullNamePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">{t('phone')} <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    value={address.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900" 
                    placeholder="081-234-5678"
                    required
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">{t('address')} <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={address.address}
                    onChange={(e) => handleAddressChange('address', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900" 
                    placeholder={t('addressPlaceholder')}
                    required
                  />
                </div>
                 <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">{t('province')} <span className="text-red-500">*</span></label>
                  <select 
                    value={address.province}
                    onChange={(e) => handleAddressChange('province', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900"
                    required
                  >
                    <option value="">{t('selectProvince')}</option>
                    {THAILAND_PROVINCES.map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">{t('postalCode')} <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none text-slate-900" 
                    placeholder="10310"
                    maxLength={5}
                    required
                  />
                </div>
              </div>

              {/* Remember Address Checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberAddress}
                    onChange={(e) => setRememberAddress(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-navy focus:ring-brand-navy border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{t('rememberAddress')}</span>
                </label>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleProceedToPayment} 
                  size="lg" 
                  className="px-8 font-bold"
                  disabled={!address.fullName || !address.phone || !address.address || !address.province || !address.postalCode}
                >
                  {t('proceed')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm Order (Or Step 1 for สินค้าพิเศษ) */}
          {(step === 2 || (isLotto && step === 2)) && (
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="bg-brand-gold p-2 rounded-lg text-slate-900">
                  <CreditCard size={24} />
                </div>
                {t('confirmOrder')}
              </h2>

              {/* Order Summary */}
              <div className="bg-slate-50 p-4 rounded-xl mb-6">
                <h3 className="font-bold text-slate-900 mb-3">{t('orderSummaryTitle')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('itemCount')}</span>
                    <span className="font-medium">
                      {isLotto 
                        ? t('lottoSets', { sets: calculateLottoProducts(lottoTickets.length), tickets: lottoTickets.length })
                        : t('itemCountLabel', { count: items.length })
                      }
                    </span>
                        </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('subtotal')}</span>
                    <span className="font-medium">฿{subtotal.toLocaleString()}</span>
                      </div>
                  {!isLotto && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t('shipping')}</span>
                      <span className="font-medium">{shipping === 0 ? t('shippingFree') : `฿${shipping}`}</span>
                      </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-black">
                      <span>{t('totalPayable')}</span>
                      <span className="text-purple-600">฿{total.toLocaleString()}</span>
                    </div>
                                </div>
                              </div>
                        </div>

              {/* Payment Method Info */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard size={24} className="text-purple-600" />
                  <div>
                    <div className="font-bold text-slate-900">{t('payViaStripe')}</div>
                    <div className="text-xs text-slate-600">{t('stripePaymentMethods')}</div>
                              </div>
                           </div>
                <div className="flex gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-5 object-contain opacity-70" alt="Visa" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-5 object-contain opacity-70" alt="Mastercard" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Alipay_logo.svg/2560px-Alipay_logo.svg.png" className="h-4 object-contain opacity-70" alt="Alipay" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/WeChat_logo.svg/1024px-WeChat_logo.svg.png" className="h-5 object-contain opacity-70" alt="WeChat" />
                           </div>
                </div>

              {/* Back Button - Above Payment Button */}
              <Button
                variant="outline"
                onClick={() => {
                  if (isLotto) {
                    navigate('/special-products');
                  } else {
                    navigate('/cart');
                  }
                }}
                className="w-full mb-3 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
              >
                <ArrowLeft size={18} className="mr-2" />
                {t('goBack')}
              </Button>

              {/* Checkout Button - Stripe Checkout */}
              <Button
                onClick={handleStripeCheckout}
                disabled={isProcessing || !user}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    {t('creatingSession')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock size={20} />
                    {t('payAmount', { amount: total.toLocaleString() })}
                    <ExternalLink size={16} />
                  </span>
                )}
              </Button>
              
              {!user && (
                <p className="text-sm text-red-500 text-center mt-2">
                  {t('loginRequired')} <Link to="/login" className="underline font-bold">{t('loginAgain')}</Link>
                </p>
              )}
              
              <p className="text-xs text-slate-500 text-center mt-3">
                {t('stripeSecure')}
              </p>

              {/* Back button for non-lotto */}
              {!isLotto && (
                <div className="mt-6">
                  <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-500">{t('goBack')}</Button>
                        </div>
              )}
                     </div>
                  )}

          {/* Step 3: Verifying Payment */}
          {step === 3 && (
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <Loader2 size={40} className="text-blue-600 animate-spin" />
                  </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">{t('verifyingPayment')}</h2>
                <p className="text-slate-600 mb-6">{t('pleaseWaitVerify')}</p>
                
                {orderId && (
                  <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block">
                    <span className="text-sm text-slate-600">{t('orderNumber')}: </span>
                    <span className="font-mono font-bold text-slate-900">{orderId}</span>
                     </div>
                  )}
              </div>
            </div>
          )}

        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 sticky top-24">
            <h3 className="font-bold text-slate-900 mb-4 text-lg">{t('orderSummary')}</h3>
            
            {/* Items List */}
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {isLotto ? (
                // For lotto: Show products grouped by 5 tickets
                lottoProducts.map((product: any, index: number) => (
                   <div key={index} className="flex gap-3 items-center text-sm border-b border-slate-50 pb-2">
                      <div className="h-10 w-10 rounded-full bg-brand-gold flex items-center justify-center text-slate-900 font-bold shrink-0">
                        <TicketIcon size={16} />
                      </div>
                      <div className="flex-1">
                      <div className="font-bold text-slate-900">{t('specialProduct', { index: product.productIndex })}</div>
                      <div className="text-xs text-slate-500">
                        {product.ticketCount} {t('unitTicket')} {product.isFullProduct ? `(${t('lottoFullSet')})` : `(${t('lottoPartialSet', { count: product.ticketCount })})`}
                        </div>
                      </div>
                    <div className="font-bold text-slate-900">฿{product.price.toLocaleString()}</div>
                   </div>
                ))
                ) : (
                // For marketplace: Show individual items
                items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-3 text-sm border-b border-slate-50 pb-2">
                    <div className="h-12 w-12 bg-slate-100 rounded overflow-hidden shrink-0">
                      <img src={item.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 line-clamp-1">{item.title}</div>
                      <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-bold text-slate-900">฿{(item.priceTHB * item.quantity).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 text-sm border-t border-slate-100 pt-4 mb-4">
              <div className="flex justify-between text-slate-600">
                <span>{t('subtotal')}</span>
                <span>฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('shipping')}</span>
                <span>{shipping === 0 ? t('shippingFree') : `฿${shipping}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end mb-6 pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-900">{t('totalNet')}</span>
              <span className="text-2xl font-black text-brand-navy">฿{total.toLocaleString()}</span>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 items-start">
               <CheckCircle2 size={16} className="text-brand-navy mt-0.5 shrink-0" />
               <p className="text-xs text-brand-navy font-medium">
                 {t('sslSecure')}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
