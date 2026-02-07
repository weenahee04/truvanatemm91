import { 
  doc, 
  getDoc, 
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getExchangeRate } from './exchangeRateService';

export interface LottoProductPricing {
  id: string;
  name: string;
  nameTH: string;
  logo: string;
  pricePerLine: number; // USD
  serviceFee: number; // USD
  minLines: number;
  maxLines: number;
  drawDays: string[];
  jackpotEstimate: string;
  enabled: boolean;
  popular: boolean;
  promotionDiscount: number; // percent
  promotionEndDate: string | null;
}

export interface BundlePackagePricing {
  id: string;
  name: string;
  lottoId: string;
  lines: number;
  originalPrice: number;
  discountPrice: number;
  savings: number;
  badge: string | null;
  enabled: boolean;
}

export interface LottoPricingSettings {
  products: LottoProductPricing[];
  bundles: BundlePackagePricing[];
  marginTHB: number; // Profit margin in THB (added to exchange rate)
  feeSettings: {
    baseServiceFee: number;
    expressProcessingFee: number;
    subscriptionDiscount: number;
    firstTimeDiscount: number;
    referralDiscount: number;
  };
  updatedAt?: string;
  updatedBy?: string;
}

const SETTINGS_DOC_ID = 'lotto-pricing';

// Default pricing configuration
const DEFAULT_PRICING: LottoPricingSettings = {
  products: [
    {
      id: 'powerball',
      name: 'Powerball',
      nameTH: 'พาวเวอร์บอล',
      logo: '🔴',
      pricePerLine: 5.00,
      serviceFee: 0.00,
      minLines: 1,
      maxLines: 50,
      drawDays: ['Monday', 'Wednesday', 'Saturday'],
      jackpotEstimate: '$500 Million',
      enabled: true,
      popular: true,
      promotionDiscount: 0,
      promotionEndDate: null,
    },
    {
      id: 'megamillions',
      name: 'Mega Millions',
      nameTH: 'เมกามิลเลียนส์',
      logo: '🟡',
      pricePerLine: 11.00,
      serviceFee: 0.00,
      minLines: 1,
      maxLines: 50,
      drawDays: ['Tuesday', 'Friday'],
      jackpotEstimate: '$350 Million',
      enabled: true,
      popular: true,
      promotionDiscount: 10,
      promotionEndDate: '2025-12-31',
    },
  ],
  bundles: [],
  marginTHB: 0, // Profit margin in THB (0 = no margin)
  feeSettings: {
    baseServiceFee: 3.00,
    expressProcessingFee: 5.00,
    subscriptionDiscount: 15,
    firstTimeDiscount: 20,
    referralDiscount: 10,
  },
};

/**
 * Get lotto pricing settings from Firestore
 */
export const getLottoPricing = async (): Promise<LottoPricingSettings> => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Merge products array: update existing products with default values if needed
      let mergedProducts = DEFAULT_PRICING.products.map(defaultProduct => {
        const existingProduct = data.products?.find((p: any) => p.id === defaultProduct.id);
        if (existingProduct) {
          // For Mega Millions, force update to 11 USD if it's not already
          if (defaultProduct.id === 'megamillions') {
            const totalPrice = (existingProduct.pricePerLine || 0) + (existingProduct.serviceFee || 0);
            // If total is not 11 USD, use default (11 USD with 0 service fee)
            if (Math.abs(totalPrice - 11.00) > 0.01) {
              return {
                ...defaultProduct,
                ...existingProduct,
                pricePerLine: 11.00,
                serviceFee: 0.00,
              };
            }
          }
          
          // Use existing product data, but ensure all fields are present
          return {
            ...defaultProduct,
            ...existingProduct,
          };
        }
        return defaultProduct;
      });
      
      // If there are products in Firestore that don't exist in defaults, add them
      if (data.products && Array.isArray(data.products)) {
        const existingIds = mergedProducts.map(p => p.id);
        const newProducts = data.products.filter((p: any) => !existingIds.includes(p.id));
        mergedProducts = [...mergedProducts, ...newProducts];
      }
      
      return {
        ...DEFAULT_PRICING,
        ...data,
        products: mergedProducts,
        bundles: data.bundles || DEFAULT_PRICING.bundles,
      } as LottoPricingSettings;
    }

    // Return default if not found
    return DEFAULT_PRICING;
  } catch (error) {
    console.error('Error getting lotto pricing:', error);
    // Return default on error
    return DEFAULT_PRICING;
  }
};

/**
 * Save lotto pricing settings to Firestore
 */
export const saveLottoPricing = async (
  settings: LottoPricingSettings,
  userId?: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const dataToSave = {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || 'system',
    };
    
    console.log('[saveLottoPricing] Saving to Firestore:', {
      documentId: SETTINGS_DOC_ID,
      marginTHB: settings.marginTHB,
      collection: 'settings',
    });
    
    await setDoc(docRef, dataToSave, { merge: true });
    
    console.log('[saveLottoPricing] Successfully saved to Firestore');
  } catch (error) {
    console.error('[saveLottoPricing] Error saving lotto pricing:', error);
    throw new Error('Failed to save pricing settings');
  }
};

/**
 * Get price for a specific product by ID
 * Uses realtime exchange rate + margin from settings
 */
export const getProductPrice = async (productId: string): Promise<{ priceUSD: number; priceTHB: number } | null> => {
  try {
    const settings = await getLottoPricing();
    const product = settings.products.find(p => p.id === productId);
    
    if (!product) return null;

    const priceUSD = product.pricePerLine + product.serviceFee;
    
    // Get realtime exchange rate with margin from API
    let finalRate: number;
    try {
      const rateData = await getExchangeRate();
      // Use finalRate (baseRate + marginTHB) from API
      finalRate = rateData.finalRate;
      console.log(`[getProductPrice] ${productId}: USD=${priceUSD}, finalRate=${finalRate}, margin=${rateData.marginTHB} THB, THB=${priceUSD * finalRate}`);
    } catch (error) {
      console.error('Failed to fetch realtime rate:', error);
      throw new Error('Failed to fetch exchange rate');
    }
    
    const priceTHB = priceUSD * finalRate;

    return {
      priceUSD,
      priceTHB,
    };
  } catch (error) {
    console.error('Error getting product price:', error);
    return null;
  }
};

/**
 * Get ticket price in THB (used by frontend pages)
 */
export const getTicketPriceTHB = async (productId: string = 'powerball'): Promise<number> => {
  try {
    const price = await getProductPrice(productId);
    return price ? Math.round(price.priceTHB) : 156; // Default to 156 if error
  } catch (error) {
    console.error('Error getting ticket price:', error);
    return 156; // Default fallback
  }
};




