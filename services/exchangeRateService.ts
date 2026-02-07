/**
 * Exchange Rate Service
 * Fetches real-time exchange rates from backend API
 */

export interface ExchangeRateResponse {
  baseRate: number; // Rate from API (1 USD = X THB)
  marginTHB: number; // Profit margin in THB (added to base rate)
  finalRate: number; // Final rate with margin applied (baseRate + marginTHB)
  lastUpdated: string; // ISO timestamp
  source: string; // API source
}

/**
 * Get exchange rate from backend API
 */
export async function getExchangeRate(): Promise<ExchangeRateResponse> {
  try {
    // Use same API URL logic as services/api.ts
    const getApiUrl = (): string => {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl && String(envUrl).trim()) {
        const url = String(envUrl).trim();
        return url.replace(/\/api\/?$/, '').replace(/\/$/, '');
      }
      if (import.meta.env.PROD) {
        // If running on production domain (not localhost), use relative URL
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          // Use relative URL - Nginx will proxy /api to backend
          return '';
        }
        // Fallback for Vercel deployments
        return 'https://truvamate-api.vercel.app';
      }
      // Dev fallback: match backend dev bind host (127.0.0.1)
      return 'http://127.0.0.1:5003';
    };
    
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/api/exchange-rate`);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch exchange rate');
    }
    
    return result.data;
  } catch (error: any) {
    console.error('Error fetching exchange rate:', error.message);
    throw error;
  }
}

/**
 * Alias for getExchangeRate (for compatibility)
 */
export const getRealtimeExchangeRate = getExchangeRate;

/**
 * Convert USD to THB using realtime exchange rate
 * @param usdAmount - Amount in USD
 * @returns Amount in THB
 */
export async function convertUSDToTHB(usdAmount: number): Promise<number> {
  try {
    const rateData = await getExchangeRate();
    return usdAmount * rateData.finalRate;
  } catch (error) {
    // Fallback to default rate if API fails
    console.warn('Using fallback exchange rate');
    const fallbackRate = 35.50;
    return usdAmount * fallbackRate;
  }
}
