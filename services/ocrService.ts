// OCR Service for Thai Lottery Ticket Scanning
// Uses Tesseract.js for client-side OCR

import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  numbers: string[];
  possibleLottoNumbers: string[];
  rawData: Tesseract.RecognizeResult | null;
}

export interface TicketMatch {
  orderNumber: string;
  ticketNumber: string;
  matchedPhotoUrl: string | null;
  matchConfidence: number;
  ocrNumbers: string[];
  isExactMatch: boolean;
  partialMatches: string[];
}

// Extract 6-digit lotto numbers from OCR text
function extractLottoNumbers(text: string): string[] {
  // Thai lottery is 6 digits
  const sixDigitPattern = /\b(\d{6})\b/g;
  const regexMatches: string[] = text.match(sixDigitPattern) || [];
  
  // Also try to find numbers that might be split across lines
  const allDigits = text.replace(/[^\d]/g, '');
  const additionalMatches: string[] = [];
  
  // Extract consecutive 6-digit sequences
  for (let i = 0; i <= allDigits.length - 6; i++) {
    const sixDigit = allDigits.substring(i, i + 6);
    if (!regexMatches.includes(sixDigit) && !additionalMatches.includes(sixDigit)) {
      additionalMatches.push(sixDigit);
    }
  }
  
  return [...new Set([...regexMatches, ...additionalMatches])];
}

// Extract all numbers from OCR text
function extractAllNumbers(text: string): string[] {
  const numberPattern = /\d+/g;
  return text.match(numberPattern) || [];
}

// Clean and preprocess image for better OCR
export async function preprocessImage(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // Increase contrast
        const contrast = 1.5;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        const newValue = Math.min(255, Math.max(0, factor * (avg - 128) + 128));
        
        // Threshold to black/white
        const threshold = newValue > 128 ? 255 : 0;
        
        data[i] = threshold;
        data[i + 1] = threshold;
        data[i + 2] = threshold;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

// Perform OCR on an image
export async function scanTicketImage(
  imageUrl: string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    // Preprocess image for better results
    let processedImage = imageUrl;
    try {
      processedImage = await preprocessImage(imageUrl);
    } catch {
      console.warn('Image preprocessing failed, using original');
    }
    
    const result = await Tesseract.recognize(processedImage, 'tha+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress * 100);
        }
      },
    });
    
    const text = result.data.text;
    const numbers = extractAllNumbers(text);
    const lottoNumbers = extractLottoNumbers(text);
    
    return {
      text,
      confidence: result.data.confidence,
      numbers,
      possibleLottoNumbers: lottoNumbers,
      rawData: result,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      text: '',
      confidence: 0,
      numbers: [],
      possibleLottoNumbers: [],
      rawData: null,
    };
  }
}

// Match OCR results with order ticket numbers
export function matchTicketNumbers(
  ocrNumbers: string[],
  orderTicketNumber: string
): { isMatch: boolean; confidence: number; matchType: 'exact' | 'partial' | 'none' } {
  // Check for exact match
  if (ocrNumbers.includes(orderTicketNumber)) {
    return { isMatch: true, confidence: 100, matchType: 'exact' };
  }
  
  // Check for partial matches (at least 4 consecutive digits)
  for (const num of ocrNumbers) {
    for (let len = 6; len >= 4; len--) {
      for (let i = 0; i <= orderTicketNumber.length - len; i++) {
        const substring = orderTicketNumber.substring(i, i + len);
        if (num.includes(substring)) {
          const confidence = (len / 6) * 100;
          return { isMatch: true, confidence, matchType: 'partial' };
        }
      }
    }
  }
  
  return { isMatch: false, confidence: 0, matchType: 'none' };
}

// Batch scan multiple images
export async function batchScanImages(
  imageUrls: string[],
  onProgress?: (current: number, total: number, result: OCRResult) => void
): Promise<OCRResult[]> {
  const results: OCRResult[] = [];
  
  for (let i = 0; i < imageUrls.length; i++) {
    const result = await scanTicketImage(imageUrls[i]);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, imageUrls.length, result);
    }
  }
  
  return results;
}

// Match ticket photos with orders
export async function matchPhotosWithOrders(
  photos: { url: string; filename: string }[],
  orders: { orderNumber: string; ticketNumbers: string[] }[],
  onProgress?: (current: number, total: number) => void
): Promise<TicketMatch[]> {
  const matches: TicketMatch[] = [];
  
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const ocrResult = await scanTicketImage(photo.url);
    
    for (const order of orders) {
      for (const ticketNumber of order.ticketNumbers) {
        const matchResult = matchTicketNumbers(ocrResult.possibleLottoNumbers, ticketNumber);
        
        if (matchResult.isMatch) {
          matches.push({
            orderNumber: order.orderNumber,
            ticketNumber,
            matchedPhotoUrl: photo.url,
            matchConfidence: matchResult.confidence,
            ocrNumbers: ocrResult.possibleLottoNumbers,
            isExactMatch: matchResult.matchType === 'exact',
            partialMatches: matchResult.matchType === 'partial' ? ocrResult.possibleLottoNumbers : [],
          });
        }
      }
    }
    
    if (onProgress) {
      onProgress(i + 1, photos.length);
    }
  }
  
  return matches;
}

export const ocrService = {
  scanTicketImage,
  preprocessImage,
  matchTicketNumbers,
  batchScanImages,
  matchPhotosWithOrders,
  extractLottoNumbers,
};

export default ocrService;
