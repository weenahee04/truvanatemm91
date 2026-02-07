/**
 * Logo loader utility for embedding logo images as base64 data URIs in PDFs
 */

import fs from 'fs';
import path from 'path';

// Cache for logo to avoid reading file on every request
let logoCache: string | null = null;

/**
 * Clear logo cache (useful for development/testing)
 */
export function clearLogoCache(): void {
  logoCache = null;
  console.log('[PTJ Logo] Cache cleared');
}

/**
 * Read PNG file and convert to base64 data URI
 */
export function loadPNGAsBase64(filePath: string): string {
  try {
    // Resolve absolute path
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.warn(`Logo file not found at: ${absolutePath}`);
      return ''; // Return empty string if file not found
    }

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(absolutePath);
    const base64 = fileBuffer.toString('base64');
    
    // Determine MIME type based on file extension
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 
                     ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                     ext === '.svg' ? 'image/svg+xml' : 'image/png';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error: any) {
    console.error(`Error loading logo from ${filePath}:`, error.message);
    return ''; // Return empty string on error
  }
}

/**
 * Get PTJ Logo as base64 data URI
 * Uses in-memory cache to avoid reading file on every request
 */
export function getPTJLogoBase64(): string {
  // Return cached logo if available
  if (logoCache) {
    return logoCache;
  }

  const cwd = process.cwd();
  console.log(`[PTJ Logo] Current working directory: ${cwd}`);

  // Try multiple possible paths
  const possiblePaths = [
    // From environment variable
    process.env.PTJ_LOGO_PATH,
    // Relative to backend root
    path.resolve(cwd, 'assets', 'logo', 'PTJ-logo.png'),
    path.resolve(cwd, 'assets', 'PTJ-logo.png'),
    path.resolve(cwd, 'public', 'images', 'PTJ-logo.png'),
    path.resolve(cwd, 'logo', 'PTJ-logo.png'),
    path.resolve(cwd, 'PTJ-logo.png'),
    // Relative to src
    path.resolve(cwd, 'src', 'assets', 'PTJ-logo.png'),
    // Also try with different case
    path.resolve(cwd, 'assets', 'logo', 'ptj-logo.png'),
    path.resolve(cwd, 'assets', 'ptj-logo.png'),
  ].filter(Boolean) as string[];

  console.log(`[PTJ Logo] Searching for logo in ${possiblePaths.length} locations...`);

  for (const logoPath of possiblePaths) {
    if (logoPath) {
      console.log(`[PTJ Logo] Checking: ${logoPath}`);
      if (fs.existsSync(logoPath)) {
        const base64 = loadPNGAsBase64(logoPath);
        if (base64) {
          logoCache = base64;
          console.log(`[PTJ Logo] ✅ Logo loaded successfully from: ${logoPath}`);
          return logoCache;
        }
      } else {
        console.log(`[PTJ Logo] ❌ File not found: ${logoPath}`);
      }
    }
  }

  console.error('[PTJ Logo] ⚠️ Logo file not found in any of the expected locations.');
  console.error('[PTJ Logo] Searched paths:', possiblePaths);
  console.error('[PTJ Logo] Please either:');
  console.error('[PTJ Logo]   1. Place PTJ-logo.png in backend/assets/logo/ directory');
  console.error('[PTJ Logo]   2. Set PTJ_LOGO_PATH environment variable to the full path of the PNG file');
  
  // Return empty string - caller should handle fallback
  return '';
}

/**
 * Get PTJ Logo as HTML img tag with base64 data URI
 * Falls back to placeholder text if logo not found
 */
export function getPTJLogoHTML(size: number = 60): string {
  const base64 = getPTJLogoBase64();
  
  if (!base64) {
    // Return placeholder text if logo not found
    console.warn('[PTJ Logo] Logo not found, using placeholder text');
    return `
    <div style="text-align: center; margin-bottom: 5mm; padding: 10mm; background-color: #f0f0f0; border: 1px dashed #ccc;">
      <div style="font-size: 24pt; font-weight: bold; color: #666;">PTJ Logo</div>
      <div style="font-size: 10pt; color: #333; margin-top: 2mm; font-family: 'Kanit', sans-serif;">บริษัท เพื่อนที่จริงใจ จำกัด</div>
      <div style="font-size: 8pt; color: #999; margin-top: 2mm;">(Logo file not found. Please add PTJ-logo.png to backend/assets/logo/)</div>
    </div>
    `.trim();
  }
  
  return `
    <div style="text-align: center; margin-bottom: 5mm;">
      <img src="${base64}" alt="PTJ Logo" style="width: ${size}mm; height: auto; max-width: 100%; display: block; margin: 0 auto;" />
      <div style="font-size: 10pt; color: #000; margin-top: 2mm; font-family: 'Kanit', sans-serif; font-weight: 500;">บริษัท เพื่อนที่จริงใจ จำกัด</div>
    </div>
  `.trim();
}
