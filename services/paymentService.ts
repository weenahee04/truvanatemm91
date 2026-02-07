import api from './api';

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  enabled: boolean;
  testMode: boolean;
  config: {
    publicKey: string;
    secretKey: string;
    webhookSecret?: string;
    merchantId?: string;
  };
  description: string;
  supportedMethods: string[];
}

export interface PaymentSettings {
  gateways: PaymentGatewayConfig[];
  bankAccounts?: Array<{
    id: number;
    bank: string;
    accountNumber: string;
    accountName: string;
    enabled: boolean;
  }>;
  currencySettings?: {
    primaryCurrency: string;
    exchangeRate: number;
    autoUpdateRate: boolean;
    marginPercent: number; // Profit margin percentage
    transactionFeePercent: number;
    transactionFeeFixed: number;
    minWithdrawal: number;
    maxWithdrawal: number;
  };
  updatedAt?: string;
}

const PAYMENT_SETTINGS_DOC_ID = 'payment_settings';

// Default payment settings
const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  gateways: [
    {
      id: 'stripe',
      name: 'Stripe',
      enabled: false,
      testMode: true,
      config: {
        publicKey: '',
        secretKey: '',
        webhookSecret: '',
      },
      description: 'รับชำระผ่านบัตรเครดิต/เดบิต ระดับสากล',
      supportedMethods: ['Visa', 'Mastercard', 'AMEX', 'JCB'],
    },
    {
      id: 'omise',
      name: 'Omise',
      enabled: false,
      testMode: true,
      config: {
        publicKey: '',
        secretKey: '',
      },
      description: 'Payment Gateway สำหรับประเทศไทย',
      supportedMethods: ['Credit Card', 'PromptPay', 'TrueMoney'],
    },
    {
      id: 'promptpay',
      name: 'PromptPay QR',
      enabled: false,
      testMode: false,
      config: {
        publicKey: '',
        secretKey: '',
        merchantId: '',
      },
      description: 'รับชำระผ่าน PromptPay QR Code',
      supportedMethods: ['PromptPay'],
    },
  ],
  bankAccounts: [],
  currencySettings: {
    primaryCurrency: 'THB',
    exchangeRate: 35.50,
    autoUpdateRate: true,
    marginPercent: 0, // Profit margin percentage (0 = no margin)
    transactionFeePercent: 3.5,
    transactionFeeFixed: 10,
    minWithdrawal: 500,
    maxWithdrawal: 100000,
  },
};

// Get payment settings from Firestore
export const getPaymentSettings = async (): Promise<PaymentSettings> => {
  try {
    const res = await api.get('/admin/payment-settings');
    const data = res.data?.settings as PaymentSettings | null;
    if (data) {
      return {
        ...DEFAULT_PAYMENT_SETTINGS,
        ...data,
        gateways: data.gateways || DEFAULT_PAYMENT_SETTINGS.gateways,
      };
    }
    return DEFAULT_PAYMENT_SETTINGS;
  } catch (error) {
    console.error('Error getting payment settings:', error);
    return DEFAULT_PAYMENT_SETTINGS;
  }
};

// Save payment settings to Firestore
export const savePaymentSettings = async (settings: PaymentSettings): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.put('/admin/payment-settings', { settings });
    return { success: true };
  } catch (error: any) {
    console.error('Error saving payment settings:', error);
    return { success: false, error: error?.response?.data?.error || error.message };
  }
};

// Get Stripe configuration (for frontend use)
export const getStripeConfig = async (): Promise<{ publicKey: string; enabled: boolean; testMode: boolean } | null> => {
  try {
    const settings = await getPaymentSettings();
    const stripeGateway = settings.gateways.find(g => g.id === 'stripe');
    
    if (!stripeGateway || !stripeGateway.enabled) {
      return null;
    }
    
    return {
      publicKey: stripeGateway.config.publicKey,
      enabled: stripeGateway.enabled,
      testMode: stripeGateway.testMode,
    };
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return null;
  }
};






