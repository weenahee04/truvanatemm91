// Location tracking service using IP geolocation

export interface LocationData {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  timestamp: string;
}

/**
 * Get user's location based on IP address
 * Uses ipapi.co free service (no API key required)
 * Falls back to saved location if API fails
 */
export async function getUserLocation(): Promise<LocationData | null> {
  // First check if we have a saved location that's still valid (within 24 hours)
  const savedLocation = getSavedLocation();
  if (savedLocation && savedLocation.timestamp) {
    const savedTime = new Date(savedLocation.timestamp).getTime();
    const now = new Date().getTime();
    const hoursSinceSaved = (now - savedTime) / (1000 * 60 * 60);
    
    // Use saved location if it's less than 24 hours old
    if (hoursSinceSaved < 24) {
      return savedLocation;
    }
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        // API returned an error
        throw new Error(data.reason || 'Location API error');
      }

      const locationData: LocationData = {
        ip: data.ip || 'unknown',
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        region: data.region_code || '',
        regionName: data.region || '',
        city: data.city || 'Unknown',
        zip: data.postal || '',
        lat: data.latitude || 0,
        lon: data.longitude || 0,
        timezone: data.timezone || 'UTC',
        isp: data.org || 'Unknown',
        timestamp: new Date().toISOString()
      };

      // Save successful fetch
      saveLocationData(locationData);

      return locationData;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Check if it's an abort error (timeout)
      if (fetchError.name === 'AbortError') {
        // Timeout occurred - use saved location or return null
        if (savedLocation) {
          return savedLocation;
        }
        return null;
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    // Silently handle errors - don't show console.error in production
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn('Location service unavailable, using saved location:', error.message);
    }

    // Return saved location as fallback, or null if no saved location
    return savedLocation || null;
  }
}

/**
 * Save location data to localStorage
 */
export function saveLocationData(location: LocationData): void {
  try {
    localStorage.setItem('truvamate_location', JSON.stringify(location));
    
    // Also save to location history
    const history = getLocationHistory();
    history.push(location);
    
    // Keep only last 10 entries
    const recentHistory = history.slice(-10);
    localStorage.setItem('truvamate_location_history', JSON.stringify(recentHistory));
  } catch (error) {
    console.error('Error saving location:', error);
  }
}

/**
 * Get saved location data from localStorage
 */
export function getSavedLocation(): LocationData | null {
  try {
    const saved = localStorage.getItem('truvamate_location');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error reading saved location:', error);
    return null;
  }
}

/**
 * Get location history
 */
export function getLocationHistory(): LocationData[] {
  try {
    const saved = localStorage.getItem('truvamate_location_history');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error reading location history:', error);
    return [];
  }
}

/**
 * Check if user is accessing from USA
 */
export function isFromUSA(location: LocationData | null): boolean {
  return location?.countryCode === 'US';
}

/**
 * Check if user is accessing from Thailand
 */
export function isFromThailand(location: LocationData | null): boolean {
  return location?.countryCode === 'TH';
}

/**
 * Log location analytics (can be sent to Firebase Analytics later)
 */
export function logLocationAnalytics(location: LocationData): void {
  console.log('📍 User Location Analytics:', {
    country: location.country,
    region: location.regionName,
    city: location.city,
    timezone: location.timezone,
    timestamp: location.timestamp
  });

  // TODO: Send to Firebase Analytics
  // analytics.logEvent('user_location', {
  //   country: location.country,
  //   region: location.regionName,
  //   city: location.city
  // });
}
