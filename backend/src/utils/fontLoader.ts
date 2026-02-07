/**
 * Font loader utility for embedding fonts as base64 data URIs
 */

// Cache for fonts to avoid fetching on every request
let fontCache: { regular: string; bold: string } | null = null;
let fontCachePromise: Promise<{ regular: string; bold: string }> | null = null;

/**
 * Fetch font from URL and convert to base64
 */
export async function fetchFontAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error: any) {
    console.error(`Error fetching font from ${url}:`, error.message);
    throw error;
  }
}

/**
 * Get Kanit font base64 strings
 * Uses in-memory cache to avoid fetching on every request
 * Attempts to fetch from CDN, falls back to empty string if network is unavailable
 */
export async function getKanitFontBase64(): Promise<{
  regular: string;
  bold: string;
}> {
  // Return cached fonts if available
  if (fontCache) {
    return fontCache;
  }

  // If already fetching, wait for that promise
  if (fontCachePromise) {
    return fontCachePromise;
  }

  // Start fetching fonts
  fontCachePromise = (async () => {
    const kanitRegularUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/kanit/Kanit-Regular.ttf';
    const kanitBoldUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/kanit/Kanit-Bold.ttf';

    try {
      // Try to fetch fonts from CDN
      const [regularBase64, boldBase64] = await Promise.all([
        fetchFontAsBase64(kanitRegularUrl),
        fetchFontAsBase64(kanitBoldUrl),
      ]);

      const result = {
        regular: regularBase64,
        bold: boldBase64,
      };

      // Cache the result
      fontCache = result;
      return result;
    } catch (error: any) {
      console.warn('Failed to fetch Kanit fonts from CDN, using fallback:', error.message);
      // Return empty strings as fallback - fonts won't work but PDF will still generate
      const result = {
        regular: '',
        bold: '',
      };
      fontCache = result;
      return result;
    } finally {
      // Clear the promise so we can retry if needed
      fontCachePromise = null;
    }
  })();

  return fontCachePromise;
}

/**
 * Generate @font-face CSS with embedded base64 fonts
 */
export function generateFontFaceCSS(regularBase64: string, boldBase64: string): string {
  if (!regularBase64 && !boldBase64) {
    // Fallback to system fonts if base64 not available
    return '';
  }

  let css = '<style>\n';
  
  if (regularBase64) {
    css += `@font-face {
  font-family: 'Kanit';
  src: url('data:font/ttf;base64,${regularBase64}') format('truetype');
  font-weight: normal;
  font-style: normal;
}\n`;
  }

  if (boldBase64) {
    css += `@font-face {
  font-family: 'Kanit';
  src: url('data:font/ttf;base64,${boldBase64}') format('truetype');
  font-weight: bold;
  font-style: normal;
}\n`;
  }

  css += '</style>\n';
  return css;
}
