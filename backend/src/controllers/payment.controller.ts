import { Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

// Helper function to get Stripe configuration from Firestore or environment variable
const getStripeConfig = async () => {
  // First, check environment variable (easier for development)
  if (process.env.STRIPE_SECRET_KEY) {
    logger.info('Using Stripe config from environment variable');
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      testMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
      // Note: Live keys start with 'sk_live_', test keys start with 'sk_test_'
    };
  }

  // Fallback to Firestore
  try {
    if (!db) {
      logger.error('Firebase Firestore is not initialized - cannot get Stripe config');
      return null;
    }

    const settingsDoc = await db.collection('payment_settings').doc('payment_settings').get();
    
    if (!settingsDoc.exists) {
      logger.warn('Payment settings document does not exist in Firestore');
      return null;
    }
    
    const settings = settingsDoc.data();
    const stripeGateway = settings?.gateways?.find((g: any) => g.id === 'stripe');
    
    if (!stripeGateway || !stripeGateway.enabled || !stripeGateway.config?.secretKey) {
      logger.warn('Stripe gateway not found or not enabled in Firestore');
      return null;
    }
    
    logger.info('Using Stripe config from Firestore');
    return {
      secretKey: stripeGateway.config.secretKey,
      webhookSecret: stripeGateway.config.webhookSecret,
      testMode: stripeGateway.testMode,
    };
  } catch (error: any) {
    logger.error('Error getting Stripe config:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
};

// Initialize Stripe instance with config from Firestore
const getStripeInstance = async (): Promise<Stripe | null> => {
  const config = await getStripeConfig();
  if (!config) {
    return null;
  }
  
  return new Stripe(config.secretKey, {
    apiVersion: '2023-10-16',
  });
};

// Create payment intent (Stripe)
export const createPaymentIntent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, currency = 'thb', paymentMethod } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields: amount and paymentMethod' });
    }

    // Check if Firebase is initialized
    if (!db) {
      logger.error('Firebase Firestore is not initialized');
      return res.status(503).json({ error: 'Database not available. Please check Firebase configuration.' });
    }

    // Get Stripe instance
    const stripe = await getStripeInstance();
    if (!stripe) {
      logger.error('Stripe instance is null - check STRIPE_SECRET_KEY in .env or Firestore configuration');
      return res.status(503).json({ error: 'Stripe payment gateway is not configured' });
    }
    
    logger.info('Stripe instance created successfully');

    // Create payment record first
    const paymentData = {
      userId,
      amount,
      currency,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    let paymentId: string;
    try {
    const paymentRef = await db.collection('payments').add(paymentData);
      paymentId = paymentRef.id;
      logger.info('Payment record created:', paymentId);
    } catch (dbError: any) {
      logger.error('Error creating payment record:', dbError);
      return res.status(500).json({ 
        error: 'Failed to create payment record',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    // Create Stripe payment intent
    // Convert amount to smallest currency unit (cents for THB)
    const amountInCents = Math.round(amount * 100);

    // Determine payment method configuration
    let paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        paymentId,
        userId,
        paymentMethod,
      },
    };

    // Handle different payment methods
    if (paymentMethod === 'card') {
      // Credit/Debit Card payment
      // Explicitly set payment method type to card only
      paymentIntentParams.payment_method_types = ['card'];
      // Use automatic confirmation - frontend will use Stripe.js to collect card and confirm
      paymentIntentParams.confirmation_method = 'automatic';
    } else if (paymentMethod === 'stripe_qr' || paymentMethod === 'alipay' || paymentMethod === 'wechat') {
      // Alipay/WeChat Pay (may not be available in all countries)
      try {
        paymentIntentParams.payment_method_types = ['alipay', 'wechat_pay'];
        paymentIntentParams.payment_method_options = {
          alipay: {},
          wechat_pay: {
            client: 'web',
          },
        };
        paymentIntentParams.confirmation_method = 'manual';
      } catch (error) {
        logger.warn('QR code payment methods not available, falling back to card payment');
        paymentIntentParams.payment_method_types = ['card'];
        paymentIntentParams.confirmation_method = 'automatic';
      }
    } else if (paymentMethod === 'bank' || paymentMethod === 'promptpay') {
      // PromptPay for Thailand - QR code bank transfer
      // According to Stripe docs: 
      // - Add 'promptpay' to payment_method_types OR use automatic_payment_methods
      // - Currency must be THB
      // - For PromptPay QR codes, use automatic confirmation
      if (currency.toLowerCase() === 'thb') {
        // For PromptPay, use explicit payment_method_types
        // Do NOT use automatic_payment_methods when specifying payment_method_types
        paymentIntentParams.payment_method_types = ['promptpay'];
        // Use automatic confirmation - Stripe will automatically provide QR code in next_action
        paymentIntentParams.confirmation_method = 'automatic';
      } else {
        // PromptPay only works with THB currency
        return res.status(400).json({ 
          error: 'PromptPay requires THB currency. Please use currency: "thb"' 
        });
      }
    } else {
      // Default: enable automatic payment methods (includes cards)
      paymentIntentParams.automatic_payment_methods = {
        enabled: true,
      };
    }

    logger.info('Creating Stripe payment intent with params:', JSON.stringify(paymentIntentParams, null, 2));
    
    let paymentIntent: Stripe.PaymentIntent;
    let qrCodeUnavailable = false;
    
    try {
      paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
      logger.info('Stripe payment intent created successfully:', paymentIntent.id);
    } catch (error: any) {
      logger.error('Error creating Stripe payment intent:', error);
      logger.error('Stripe error details:', {
        type: error.type,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });
      
      // If QR code payment methods are not available (e.g., in Thailand)
      if (error.type === 'invalid_request_error' && 
          (error.message?.includes('alipay') || error.message?.includes('wechat_pay') || 
           error.message?.includes('not available in your account') ||
           error.message?.includes('not currently available'))) {
        logger.warn('QR code payment methods not available, falling back to card payment:', error.message);
        qrCodeUnavailable = true;
        
        // Retry with card payment only
        paymentIntentParams.payment_method_types = undefined;
        paymentIntentParams.payment_method_options = undefined;
        paymentIntentParams.confirmation_method = undefined;
        paymentIntentParams.automatic_payment_methods = {
          enabled: true,
        };
        
        try {
          paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
          logger.info('Retry with card payment successful:', paymentIntent.id);
        } catch (retryError: any) {
          logger.error('Retry with card payment also failed:', retryError);
          return res.status(500).json({ 
            error: 'Failed to create payment intent',
            details: process.env.NODE_ENV === 'development' ? retryError.message : undefined
          });
        }
      } else {
        // Other errors - return 500
        logger.error('Stripe payment intent creation failed:', error);
        return res.status(500).json({ 
          error: 'Failed to create payment intent',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
    
    logger.info('Payment intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      next_action: paymentIntent.next_action?.type,
      qrCodeUnavailable,
    });

    // For PromptPay, check if we need to retrieve the payment intent to get QR code
    // Sometimes Stripe needs a moment to generate the QR code, especially with automatic confirmation
    if ((paymentMethod === 'bank' || paymentMethod === 'promptpay') && 
        !paymentIntent.next_action) {
      logger.info('PromptPay payment intent created but no QR code in next_action. Status:', paymentIntent.status);
      logger.info('Retrieving payment intent with expanded data to check for QR code...');
      
      // Try multiple retrieval attempts with increasing delays
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Wait progressively longer for Stripe to process (500ms, 1000ms, 2000ms)
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          
          // Retrieve the payment intent with expanded data
          const retrievedIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
            expand: ['payment_method', 'latest_attempt', 'charges'],
          });
          
          logger.info(`Attempt ${attempt}: Retrieved payment intent status:`, retrievedIntent.status, 'next_action:', retrievedIntent.next_action?.type || 'null');
          
          if (retrievedIntent.next_action) {
            paymentIntent = retrievedIntent;
            logger.info('Found next_action after retrieval:', retrievedIntent.next_action?.type);
            break; // Exit loop if we found next_action
          } else {
            logger.warn(`Attempt ${attempt}: PromptPay payment intent still has no next_action after retrieval.`);
            logger.warn('Payment intent details:', {
              id: retrievedIntent.id,
              status: retrievedIntent.status,
              payment_method_types: retrievedIntent.payment_method_types,
              confirmation_method: retrievedIntent.confirmation_method,
              last_payment_error: retrievedIntent.last_payment_error,
            });
            
            // For PromptPay, if status is requires_payment_method and no next_action,
            // it might mean PromptPay needs to be enabled in Stripe account
            if (retrievedIntent.status === 'requires_payment_method') {
              logger.warn('PromptPay may not be enabled in your Stripe account or requires additional setup.');
              logger.warn('Check Stripe Dashboard → Settings → Payment methods → PromptPay');
            }
            
            // If this is the last attempt, log full payment intent for debugging
            if (attempt === 3) {
              logger.error('=== PromptPay QR Code Debug Info (After 3 Retrieval Attempts) ===');
              logger.error('Payment Intent ID:', retrievedIntent.id);
              logger.error('Status:', retrievedIntent.status);
              logger.error('Payment Method Types:', retrievedIntent.payment_method_types);
              logger.error('Last Payment Error:', retrievedIntent.last_payment_error);
              logger.error('Full Payment Intent (first 3000 chars):', JSON.stringify(retrievedIntent, null, 2).substring(0, 3000));
              logger.error('=== End Debug Info ===');
            }
          }
        } catch (retrieveError: any) {
          logger.error(`Error retrieving payment intent (attempt ${attempt}):`, retrieveError);
          if (attempt === 3) {
            logger.error('Failed to retrieve payment intent after 3 attempts');
          }
        }
      }
    }

    // Extract QR code data if available
    let qrCodeData = null;
    if (paymentIntent.next_action) {
      logger.info('Payment intent has next_action:', paymentIntent.next_action.type);
      logger.info('Full next_action object:', JSON.stringify(paymentIntent.next_action, null, 2));
      
      // Check for PromptPay QR code
      if (paymentIntent.next_action.type === 'promptpay_display_qr_code') {
        const promptpayAction = paymentIntent.next_action as any;
        qrCodeData = {
          type: 'promptpay',
          qrCodeUrl: promptpayAction.promptpay_display_qr_code?.data || 
                    promptpayAction.promptpay_display_qr_code?.qr_code ||
                    promptpayAction.data,
          data: promptpayAction.promptpay_display_qr_code?.data || 
               promptpayAction.promptpay_display_qr_code?.qr_code ||
               promptpayAction.data,
        };
        logger.info('PromptPay QR code data extracted:', qrCodeData);
      }
      // Check for Alipay - returns redirect URL with QR code
      else if (paymentIntent.next_action.type === 'alipay_handle_redirect') {
        const alipayAction = paymentIntent.next_action as any;
        qrCodeData = {
          type: 'alipay',
          redirectUrl: alipayAction.alipay_handle_redirect?.native_url || 
                      alipayAction.alipay_handle_redirect?.redirect_url,
          qrCodeUrl: alipayAction.alipay_handle_redirect?.native_url || 
                    alipayAction.alipay_handle_redirect?.redirect_url,
        };
        logger.info('Alipay QR code data extracted:', qrCodeData);
      }
      // Check for WeChat Pay QR code
      else if (paymentIntent.next_action.type === 'wechat_pay_display_qr_code') {
        const wechatAction = paymentIntent.next_action as any;
        qrCodeData = {
          type: 'wechat',
          qrCodeUrl: wechatAction.wechat_pay_display_qr_code?.data || 
                    wechatAction.wechat_pay_display_qr_code?.qr_code ||
                    wechatAction.data,
          data: wechatAction.wechat_pay_display_qr_code?.data || 
                wechatAction.wechat_pay_display_qr_code?.qr_code ||
                wechatAction.data,
        };
        logger.info('WeChat Pay QR code data extracted:', qrCodeData);
      }
      // Check for PromptPay QR code (Thailand bank transfer)
      // Try multiple possible action types for PromptPay
      else if (paymentIntent.next_action.type === 'display_promptpay_qr_code' || 
               paymentIntent.next_action.type === 'promptpay_display_qr_code' ||
               paymentIntent.next_action.type === 'use_stripe_sdk') {
        const promptpayAction = paymentIntent.next_action as any;
        
        // Try various possible locations for QR code data
        const qrData = promptpayAction.display_promptpay_qr_code?.hosted_voucher_url ||
                      promptpayAction.display_promptpay_qr_code?.qr_code ||
                      promptpayAction.display_promptpay_qr_code?.data ||
                      promptpayAction.promptpay_display_qr_code?.data ||
                      promptpayAction.promptpay_display_qr_code?.qr_code ||
                      promptpayAction.data;
        
        if (qrData) {
          qrCodeData = {
            type: 'promptpay',
            qrCodeUrl: qrData,
            data: qrData,
          };
          logger.info('PromptPay QR code data extracted:', qrCodeData);
        } else {
          logger.warn('PromptPay next_action found but no QR code data:', JSON.stringify(promptpayAction, null, 2));
        }
      }
    } else {
      // No next_action - log full payment intent for debugging
      if (paymentMethod === 'promptpay' || paymentMethod === 'bank') {
        logger.warn('=== PromptPay QR Code Debug Info ===');
        logger.warn('Payment intent status:', paymentIntent.status);
        logger.warn('Payment intent ID:', paymentIntent.id);
        logger.warn('Payment method types:', paymentIntent.payment_method_types);
        logger.warn('Confirmation method:', paymentIntent.confirmation_method);
        logger.warn('Automatic payment methods:', paymentIntent.automatic_payment_methods);
        logger.warn('Next action:', paymentIntent.next_action ? JSON.stringify(paymentIntent.next_action, null, 2) : 'null');
        logger.warn('Client secret:', paymentIntent.client_secret);
        logger.warn('Full payment intent (first 2000 chars):', JSON.stringify(paymentIntent, null, 2).substring(0, 2000));
        logger.warn('=== End Debug Info ===');
      } else {
        logger.warn('Payment intent created but no next_action found. Status:', paymentIntent.status);
      }
    }

    // Update payment record with Stripe payment intent ID
    try {
      if (!db) {
        logger.warn('Firebase Firestore not available - cannot update payment record');
      } else {
        const paymentDoc = await db.collection('payments').doc(paymentId).get();
        if (paymentDoc.exists) {
          await paymentDoc.ref.update({
            stripePaymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            qrCodeData: qrCodeData,
          });
          logger.info('Payment record updated with Stripe payment intent ID');
        } else {
          logger.warn('Payment record not found for update:', paymentId);
        }
      }
    } catch (updateError: any) {
      logger.error('Error updating payment record with Stripe data:', updateError);
      // Don't fail the request - payment intent is already created
    }

    // For PromptPay, if no QR code data but payment intent was created successfully,
    // indicate that QR code is unavailable
    const isPromptPayWithoutQr = (paymentMethod === 'bank' || paymentMethod === 'promptpay') && 
                                   !qrCodeData && 
                                   !qrCodeUnavailable &&
                                   paymentIntent.status === 'requires_payment_method';

    const response = {
      success: true,
      paymentId,
      clientSecret: paymentIntent.client_secret,
      qrCodeData: qrCodeUnavailable || isPromptPayWithoutQr ? null : qrCodeData,
      payment: {
        ...paymentData,
        stripePaymentIntentId: paymentIntent.id,
      },
      paymentIntentStatus: paymentIntent.status,
      hasNextAction: !!paymentIntent.next_action,
      qrCodeUnavailable: qrCodeUnavailable || isPromptPayWithoutQr,
      message: qrCodeUnavailable || isPromptPayWithoutQr
        ? (paymentMethod === 'bank' || paymentMethod === 'promptpay')
          ? 'PromptPay QR code is not available. Please ensure PromptPay is enabled in your Stripe account settings (Settings → Payment methods → PromptPay), account country is set to Thailand, and you are using Live Mode. Or use Credit/Debit Card instead.'
          : 'QR code payment methods (Alipay/WeChat Pay) are not available in your region. Please use Credit/Debit Card instead.'
        : undefined,
    };
    
    logger.info('Sending response:', JSON.stringify(response, null, 2));
    
    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating payment intent:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: error.type,
      code: error.code,
    });
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        error: 'Payment failed', 
        message: error.message 
      });
    }
    
    // Handle invalid payment method errors (e.g., Alipay/WeChat Pay not available in region)
    if (error.type === 'StripeInvalidRequestError' || 
        error.type === 'invalid_request_error' ||
        (error.statusCode === 400 && 
         (error.message?.includes('alipay') || 
          error.message?.includes('wechat_pay') ||
          error.message?.includes('not available') ||
          error.message?.includes('not currently available')))) {
      logger.warn('Payment method not available in region, returning unavailable flag:', error.message);
      return res.status(400).json({
        success: false,
        error: 'Payment method not available',
        message: 'QR code payment methods (Alipay/WeChat Pay) are not available in your region. Please use Credit/Debit Card instead.',
        qrCodeUnavailable: true,
      });
    }
    
    next(error);
  }
};

// Confirm payment
export const confirmPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { paymentId } = req.params;
    const { paymentIntentId } = req.body;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();

    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentDoc.data();

    if (payment?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get Stripe instance and verify payment intent
    const stripe = await getStripeInstance();
    if (stripe && paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
    // Update payment status
    await paymentDoc.ref.update({
      status: 'completed',
      paymentIntentId,
            completedAt: new Date().toISOString(),
          });

          return res.json({
            success: true,
            message: 'Payment confirmed',
          });
        } else {
          return res.status(400).json({
            success: false,
            error: `Payment intent status is ${paymentIntent.status}`,
          });
        }
      } catch (stripeError: any) {
        logger.error('Error verifying payment intent with Stripe:', stripeError);
        // Continue with basic confirmation if Stripe verification fails
      }
    }

    // Fallback: Update payment status without Stripe verification
    await paymentDoc.ref.update({
      status: 'completed',
      paymentIntentId: paymentIntentId || payment.stripePaymentIntentId,
      completedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Payment confirmed',
    });
  } catch (error) {
    logger.error('Error confirming payment:', error);
    next(error);
  }
};

// Get payment history
export const getPaymentHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.collection('payments')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const payments = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ payments });
  } catch (error) {
    logger.error('Error getting payment history:', error);
    next(error);
  }
};

// Get payment intent status
export const getPaymentIntentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId } = req.params;

    // Get Stripe instance
    const stripe = await getStripeInstance();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe payment gateway is not configured' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      status: paymentIntent.status,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (error: any) {
    logger.error('Error getting payment intent status:', error);
    next(error);
  }
};

// Create Stripe Checkout Session
export const createCheckoutSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      items, 
      total, 
      orderId,
      successUrl, 
      cancelUrl,
      customerEmail,
      isLotto = false
    } = req.body;

    if (!items || !total || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required fields: items, total, successUrl, cancelUrl' });
    }

    // Get Stripe instance
    const stripe = await getStripeInstance();
    if (!stripe) {
      logger.error('Stripe instance is null - check STRIPE_SECRET_KEY');
      return res.status(503).json({ error: 'Stripe payment gateway is not configured' });
    }

    logger.info('Creating Stripe Checkout Session for order:', orderId);

    // Convert items to Stripe line_items format
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => ({
      price_data: {
        currency: 'thb',
        product_data: {
          name: item.name || item.productName || (isLotto ? `Lotto ${item.type} - ${item.numbers?.join(', ')}` : 'Product'),
          description: item.description || (isLotto ? `${item.type} Lottery Ticket` : undefined),
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round((item.price || item.total / item.quantity || total / items.length) * 100), // Convert to satang
      },
      quantity: item.quantity || 1,
    }));

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card', 'promptpay'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${cancelUrl}?order_id=${orderId}`,
      metadata: {
        orderId: orderId || '',
        userId,
        isLotto: isLotto.toString(),
      },
      client_reference_id: orderId,
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // For Thai payments, ensure THB currency
    sessionParams.currency = 'thb';

    const session = await stripe.checkout.sessions.create(sessionParams);

    logger.info('Stripe Checkout Session created:', {
      sessionId: session.id,
      orderId,
      url: session.url,
    });

    // Save session info to Firestore
    if (db && orderId) {
      try {
        await db.collection('checkout_sessions').doc(session.id).set({
          sessionId: session.id,
          orderId,
          userId,
          total,
          items,
          isLotto,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
        logger.info('Checkout session saved to Firestore');
      } catch (dbError: any) {
        logger.warn('Failed to save checkout session to Firestore:', dbError.message);
      }
    }

    res.status(201).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId,
    });
  } catch (error: any) {
    logger.error('Error creating checkout session:', error);
    logger.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
    });
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: error.message 
      });
    }
    
    next(error);
  }
};

// Verify Checkout Session (for success page)
export const verifyCheckoutSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get Stripe instance
    const stripe = await getStripeInstance();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe payment gateway is not configured' });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items'],
    });

    logger.info('Retrieved Checkout Session:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
    });

    // Update order status in Firestore
    if (db && session.metadata?.orderId) {
      try {
        // Update checkout_sessions collection
        await db.collection('checkout_sessions').doc(sessionId).update({
          status: session.payment_status === 'paid' ? 'completed' : session.status,
          paymentStatus: session.payment_status,
          updatedAt: new Date().toISOString(),
        });

        // Update orders collection if exists
        const orderRef = db.collection('orders').doc(session.metadata.orderId);
        const orderDoc = await orderRef.get();
        if (orderDoc.exists) {
          await orderRef.update({
            paymentStatus: session.payment_status,
            stripeSessionId: sessionId,
            updatedAt: new Date().toISOString(),
          });
        }

        logger.info('Order status updated in Firestore');
      } catch (dbError: any) {
        logger.warn('Failed to update order in Firestore:', dbError.message);
      }
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        paymentStatus: session.payment_status,
        status: session.status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_email,
        orderId: session.metadata?.orderId || session.client_reference_id,
      },
      isPaid: session.payment_status === 'paid',
    });
  } catch (error: any) {
    logger.error('Error verifying checkout session:', error);
    
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    next(error);
  }
};

// Webhook handler for Stripe
export const handleWebhook = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Log incoming request for debugging
    logger.info('Webhook request received:', {
      method: req.method,
      path: req.path,
      headers: {
        'content-type': req.headers['content-type'],
        'stripe-signature': req.headers['stripe-signature'] ? 'present' : 'missing',
      },
      bodyType: typeof req.body,
      bodyLength: Buffer.isBuffer(req.body) ? req.body.length : JSON.stringify(req.body).length,
    });

    // Handle OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
      res.header('Access-Control-Max-Age', '86400');
      return res.status(204).send();
    }

    // Only allow POST for webhooks
    if (req.method !== 'POST') {
      logger.warn(`Webhook received ${req.method} request, only POST is allowed`);
      return res.status(405).json({ error: `Method ${req.method} not allowed. Only POST is supported.` });
    }

    // Get Stripe config for webhook secret
    const config = await getStripeConfig();
    if (!config || !config.webhookSecret) {
      logger.warn('Stripe webhook secret not configured');
      return res.status(400).json({ error: 'Webhook not configured' });
    }

    const stripe = await getStripeInstance();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    // Get the signature from headers
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      logger.warn('Webhook request missing stripe-signature header');
      return res.status(400).json({ error: 'No signature found' });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        config.webhookSecret
      );
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    logger.info('Stripe webhook received:', { type: event.type, id: event.id });

    // Handle the event
    switch (event.type) {
      case 'payment_intent.created':
        // Payment intent created - just acknowledge, no action needed
        const paymentIntentCreated = event.data.object as Stripe.PaymentIntent;
        logger.info('PaymentIntent created:', paymentIntentCreated.id);
        // Optionally update payment record with Stripe payment intent ID if not already set
        try {
          const metadata = paymentIntentCreated.metadata;
          if (metadata?.paymentId) {
            const paymentDoc = await db.collection('payments').doc(metadata.paymentId).get();
            if (paymentDoc.exists) {
              const paymentData = paymentDoc.data();
              if (!paymentData?.stripePaymentIntentId) {
                await paymentDoc.ref.update({
                  stripePaymentIntentId: paymentIntentCreated.id,
                });
                logger.info('Payment record updated with Stripe payment intent ID:', metadata.paymentId);
              }
            }
          }
        } catch (updateError: any) {
          // Log error but don't fail the webhook - this is not critical
          logger.warn('Failed to update payment record with Stripe payment intent ID:', updateError.message);
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
        logger.info('PaymentIntent succeeded:', paymentIntentSucceeded.id);
        
        // Find payment by Stripe payment intent ID
        try {
          const paymentsSnapshot = await db.collection('payments')
            .where('stripePaymentIntentId', '==', paymentIntentSucceeded.id)
            .limit(1)
            .get();
          
          if (!paymentsSnapshot.empty) {
            const paymentDoc = paymentsSnapshot.docs[0];
            await paymentDoc.ref.update({
            status: 'completed',
            completedAt: new Date().toISOString(),
          });
            logger.info('Payment updated to completed:', paymentDoc.id);
          } else {
            logger.warn('Payment not found for payment intent:', paymentIntentSucceeded.id);
          }
        } catch (updateError: any) {
          logger.error('Error updating payment to completed:', updateError);
          // Don't throw - acknowledge webhook to prevent retries
        }
        break;

      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        logger.info('PaymentIntent failed:', paymentIntentFailed.id);
        
        // Find payment by Stripe payment intent ID
        try {
          const failedPaymentsSnapshot = await db.collection('payments')
            .where('stripePaymentIntentId', '==', paymentIntentFailed.id)
            .limit(1)
            .get();
          
          if (!failedPaymentsSnapshot.empty) {
            const paymentDoc = failedPaymentsSnapshot.docs[0];
            await paymentDoc.ref.update({
            status: 'failed',
            failedAt: new Date().toISOString(),
              failureReason: paymentIntentFailed.last_payment_error?.message || 'Payment failed',
            });
            logger.info('Payment updated to failed:', paymentDoc.id);
          } else {
            logger.warn('Payment not found for failed payment intent:', paymentIntentFailed.id);
          }
        } catch (updateError: any) {
          logger.error('Error updating payment to failed:', updateError);
          // Don't throw - acknowledge webhook to prevent retries
        }
        break;

      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        logger.info('Checkout session completed:', checkoutSession.id);
        
        // Update order status
        try {
          const orderId = checkoutSession.metadata?.orderId || checkoutSession.client_reference_id;
          
          if (orderId) {
            // Update checkout_sessions collection
            const checkoutRef = db.collection('checkout_sessions').doc(checkoutSession.id);
            const checkoutDoc = await checkoutRef.get();
            if (checkoutDoc.exists) {
              await checkoutRef.update({
                status: 'completed',
                paymentStatus: checkoutSession.payment_status,
                completedAt: new Date().toISOString(),
              });
            }

            // Update orders collection
            const orderRef = db.collection('orders').doc(orderId);
            const orderDoc = await orderRef.get();
            if (orderDoc.exists) {
              await orderRef.update({
                status: 'paid',
                paymentStatus: 'completed',
                stripeSessionId: checkoutSession.id,
                paidAt: new Date().toISOString(),
              });
              logger.info('Order updated to paid:', orderId);
            }

            // Update lotto_orders if isLotto
            if (checkoutSession.metadata?.isLotto === 'true') {
              const lottoRef = db.collection('lotto_orders').doc(orderId);
              const lottoDoc = await lottoRef.get();
              if (lottoDoc.exists) {
                await lottoRef.update({
                  status: 'paid',
                  paymentStatus: 'completed',
                  paidAt: new Date().toISOString(),
                });
                logger.info('Lotto order updated to paid:', orderId);
              }
            }
          }
        } catch (updateError: any) {
          logger.error('Error updating order after checkout session completed:', updateError);
        }
        break;

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session;
        logger.info('Checkout session expired:', expiredSession.id);
        
        try {
          const expiredOrderId = expiredSession.metadata?.orderId || expiredSession.client_reference_id;
          
          if (expiredOrderId) {
            // Update checkout_sessions collection
            await db.collection('checkout_sessions').doc(expiredSession.id).update({
              status: 'expired',
              expiredAt: new Date().toISOString(),
            });

            // Update orders collection
            const orderRef = db.collection('orders').doc(expiredOrderId);
            const orderDoc = await orderRef.get();
            if (orderDoc.exists) {
              await orderRef.update({
                status: 'expired',
                paymentStatus: 'expired',
              });
            }
          }
        } catch (updateError: any) {
          logger.error('Error updating expired session:', updateError);
        }
        break;

      default:
        logger.info('Unhandled webhook event type (acknowledging):', event.type);
    }

    // Always return success to acknowledge receipt of the event
    // This prevents Stripe from retrying the webhook
    res.json({ received: true });
  } catch (error: any) {
    logger.error('Error handling webhook:', error);
    // Log full error details for debugging
    logger.error('Webhook error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return 200 with error info to acknowledge receipt
    // This prevents Stripe from retrying indefinitely
    // But still log the error for investigation
    res.status(200).json({ 
      received: true, 
      error: 'Webhook processed but encountered an error',
      errorMessage: error.message 
    });
  }
};
