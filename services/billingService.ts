// @ts-ignore - jsPDF may not have TypeScript definitions
import { jsPDF } from 'jspdf';

// Font name constant - using Kanit which supports Thai vowels properly
const FONT_FAMILY = 'Kanit';

// Cache to track if fonts have been loaded per document
const fontCache = new Map<string, boolean>();

/**
 * Convert ArrayBuffer to base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Load and add Kanit font to jsPDF document
 * Uses jsdelivr CDN to get TTF files from Google Fonts repository
 * Kanit supports Thai vowels and subscripts properly
 */
const loadKanitFont = async (doc: jsPDF): Promise<void> => {
  // Create a unique key for this document instance using object reference
  const docKey = (doc as any).__uniqueId || Math.random().toString(36).substr(2, 9);
  (doc as any).__uniqueId = docKey;
  
  // Check if fonts already loaded for this document
  if (fontCache.get(docKey)) {
    return;
  }

  try {
    console.log('Loading Kanit fonts for PDF...');
    
    // Using jsdelivr CDN - Kanit supports Thai vowels properly
    const regularFontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/kanit/Kanit-Regular.ttf';
    const boldFontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/kanit/Kanit-Bold.ttf';
    
    // Fetch TTF fonts
    const [regularResponse, boldResponse] = await Promise.all([
      fetch(regularFontUrl),
      fetch(boldFontUrl)
    ]);

    if (!regularResponse.ok || !boldResponse.ok) {
      throw new Error(`Failed to fetch font files: ${regularResponse.status}/${boldResponse.status}`);
    }

    const [regularArrayBuffer, boldArrayBuffer] = await Promise.all([
      regularResponse.arrayBuffer(),
      boldResponse.arrayBuffer()
    ]);

    console.log(`Font files fetched: Regular=${regularArrayBuffer.byteLength} bytes, Bold=${boldArrayBuffer.byteLength} bytes`);

    // Convert ArrayBuffer to base64
    const regularBase64 = arrayBufferToBase64(regularArrayBuffer);
    const boldBase64 = arrayBufferToBase64(boldArrayBuffer);

    // Add fonts to jsPDF Virtual File System (VFS)
    (doc as any).addFileToVFS('Kanit-Regular.ttf', regularBase64);
    (doc as any).addFileToVFS('Kanit-Bold.ttf', boldBase64);

    // Register fonts - IMPORTANT: must use the exact same name
    (doc as any).addFont('Kanit-Regular.ttf', FONT_FAMILY, 'normal');
    (doc as any).addFont('Kanit-Bold.ttf', FONT_FAMILY, 'bold');

    // Verify font is registered
    const fontList = (doc as any).getFontList();
    console.log('Available fonts after registration:', Object.keys(fontList || {}));
    
    fontCache.set(docKey, true);
    console.log('Kanit fonts loaded and registered successfully');
  } catch (error) {
    console.error('Failed to load Kanit font:', error);
    fontCache.set(docKey, false);
    throw error; // Re-throw to allow caller to handle
  }
};

// Helper function to set font with Kanit (or fallback to helvetica)
const setFont = (doc: jsPDF, style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal') => {
  try {
    const docKey = (doc as any).__uniqueId || 'default';
    const isLoaded = fontCache.get(docKey);
    
    if (isLoaded) {
      const fontStyle = style === 'bold' || style === 'bolditalic' ? 'bold' : 'normal';
      try {
        // Try to set Kanit font
        doc.setFont(FONT_FAMILY, fontStyle);
        
        // Verify font was actually set
        const currentFont = (doc as any).getFont();
        if (currentFont && currentFont.fontName === FONT_FAMILY) {
          return; // Successfully set font
        } else {
          console.warn(`Font ${FONT_FAMILY} not actually set, current font:`, currentFont);
        }
      } catch (fontError: any) {
        console.warn(`Failed to set font ${FONT_FAMILY}:`, fontError?.message);
        // Fall through to helvetica
      }
    }
    
    // Fallback to helvetica if Kanit is not available
    doc.setFont('helvetica', style);
  } catch (error) {
    console.error('Error in setFont:', error);
    // Fallback to helvetica if any error occurs
    try {
      doc.setFont('helvetica', style);
    } catch (fallbackError) {
      // Last resort - use default
      console.error('Even helvetica fallback failed:', fallbackError);
    }
  }
};


export interface BillingData {
  documentNo: string;
  date: string;
  ref?: string;
  customerName: string;
  customerAddress: string;
  customerTaxId?: string;
  items: BillingItem[];
  exchangeRate?: number; // USD to THB rate, default 35
}

export interface BillingItem {
  description: string;
  quantity?: number;
  amountUSD: number;
  amountTHB: number;
}

export interface CompanyInfo {
  sellerName: string;
  address: string;
  taxId: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  sellerName: 'Truvamate',
  address: 'ที่อยู่บริษัท',
  taxId: '1234567890123'
};

const EXCHANGE_RATE = 35; // 1 USD = 35 THB

/**
 * Generate Receipt PDF (ใบเสร็จรับเงิน)
 */
export const generateReceiptPDF = async (data: BillingData, company: CompanyInfo = DEFAULT_COMPANY) => {
  const doc = new jsPDF();
  
  // Load Kanit font before generating PDF
  try {
    await loadKanitFont(doc);
  } catch (error) {
    console.error('Warning: Could not load Kanit font, PDF will use default font (may not display Thai correctly):', error);
  }
  
  // Set line height factor for better Thai vowel display (increased to prevent vowel sinking)
  (doc as any).setLineHeightFactor(1.6);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  setFont(doc, 'bold');
  doc.text('ใบเสร็จรับเงิน / Receipt', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.setFontSize(10);
  setFont(doc, 'normal');
  doc.text('ต้นฉบับ / Original', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Company and Document Info
  doc.setFontSize(10);
  setFont(doc, 'normal');
  
  // Seller Name (left) and Document No (right) - same line, labels on top, content below
  doc.text('ชื่อผู้ประกอบการ / Seller Name:', margin, yPos);
  setFont(doc, 'bold');
  yPos += 6; // Increased spacing for Thai vowels
  doc.text(company.sellerName, margin, yPos, { maxWidth: 100 });
  
  // Document number on the right side (same line as Seller Name)
  setFont(doc, 'normal');
  doc.text('เลขที่เอกสาร / Document No:', pageWidth - margin - 60, yPos - 6);
  setFont(doc, 'bold');
  yPos += 6;
  doc.text(data.documentNo, pageWidth - margin, yPos - 6, { align: 'right', maxWidth: 60 });
  yPos += 3;

  // Address (left) and Date (right) - same line, labels on top, content below
  setFont(doc, 'normal');
  doc.text('ที่อยู่ / Address:', margin, yPos);
  const formattedDate = data.date && data.date !== 'Invalid Date' ? data.date : new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text('วันที่ / Date:', pageWidth - margin - 60, yPos);
  yPos += 6;
  doc.text(company.address, margin, yPos, { maxWidth: 100 });
  doc.text(formattedDate, pageWidth - margin, yPos, { align: 'right', maxWidth: 60 });
  yPos += 9;

  // Tax ID (left) and Ref (right) - same line, labels on top, content below
  setFont(doc, 'normal');
  doc.text('เลขประจำตัวผู้เสียภาษี / Tax ID:', margin, yPos);
  if (data.ref) {
    doc.text('อ้างอิง / Ref.:', pageWidth - margin - 60, yPos);
  }
  yPos += 6;
  doc.text(company.taxId, margin, yPos, { maxWidth: 100 });
  if (data.ref) {
    doc.text(data.ref, pageWidth - margin, yPos, { align: 'right', maxWidth: 60 });
  }
  yPos += 12;

  // Customer Info
  doc.setFontSize(11);
  setFont(doc, 'bold');
  doc.text('ชื่อลูกค้า / Customer Name:', margin, yPos);
  setFont(doc, 'normal');
  doc.text(data.customerName, margin + 55, yPos, { maxWidth: 100 });
  yPos += 7;

  doc.text('ที่อยู่ / Address:', margin, yPos);
  doc.text(data.customerAddress, margin + 55, yPos, { maxWidth: 100 });
  yPos += 7;

  if (data.customerTaxId) {
    doc.text('เลขประจำตัวผู้เสียภาษี / Tax ID:', margin, yPos);
    doc.text(data.customerTaxId, margin + 55, yPos, { maxWidth: 100 });
    yPos += 7;
  }
  yPos += 8;

  // Draw line first
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Items Table Header - moved below the stroke
  doc.setFontSize(9);
  setFont(doc, 'bold');
  const tableStartY = yPos;
  doc.text('ลำดับ / No.', margin, yPos);
  // Description: moved further right (closer to Qty)
  const qtyX = pageWidth - margin - 90; // Qty position at 100mm
  const descriptionX = margin + 70; // Moved further right to 90mm (before Qty)
  const descriptionMaxWidth = qtyX - descriptionX - 10; // Reserve 10mm space before Qty
  doc.text('รายละเอียด / Description', descriptionX, yPos);
  doc.text('จำนวน / Qty', pageWidth - margin - 90, yPos, { align: 'center' });
  doc.text('จำนวนเงิน (USD)', pageWidth - margin - 30, yPos, { align: 'right' }); // Closer to THB (30mm apart)
  doc.text('จำนวนเงิน (THB)', pageWidth - margin, yPos, { align: 'right' }); // Rightmost
  yPos += 6; // Increased spacing for Thai vowels
  
  setFont(doc, 'normal');
  doc.setFontSize(8);
  doc.text(`(1 USD = ${data.exchangeRate || EXCHANGE_RATE} THB)`, pageWidth - margin - 30, yPos, { align: 'right' });
  yPos += 8; // Increased spacing

  // Items
  doc.setFontSize(9);
  let itemNo = 1;
  let subtotalTHB = 0;
  
  data.items.forEach(item => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    setFont(doc, 'bold');
    doc.text(itemNo.toString(), margin, yPos);
    setFont(doc, 'normal');
    doc.text(item.description, descriptionX, yPos, { maxWidth: descriptionMaxWidth, lineHeightFactor: 1.5 }); // Use calculated width
    if (item.quantity !== undefined) {
      doc.text(item.quantity.toString(), pageWidth - margin - 90, yPos, { align: 'center' });
    }
    doc.text(item.amountUSD.toFixed(2), pageWidth - margin - 30, yPos, { align: 'right' }); // Closer to THB
    doc.text(item.amountTHB.toFixed(2), pageWidth - margin, yPos, { align: 'right' }); // Rightmost
    subtotalTHB += item.amountTHB;
    yPos += 10; // Increased spacing for Thai vowels
    itemNo++;
  });

  yPos += 3;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Totals - aligned to left
  doc.setFontSize(9);
  setFont(doc, 'normal');
  doc.text('รวมเป็นเงิน / Subtotal:', margin, yPos);
  setFont(doc, 'bold');
  doc.text(subtotalTHB.toFixed(2), margin + 120, yPos);
  yPos += 6;

  setFont(doc, 'normal');
  doc.text('ภาษีมูลค่าเพิ่ม 7% / VAT 7%:', margin, yPos);
  doc.text('0.00', margin + 120, yPos);
  yPos += 6;

  doc.text('ราคาไม่รวมภาษี / Price excluding VAT:', margin, yPos);
  doc.text('0.00', margin + 120, yPos);
  yPos += 6;

  setFont(doc, 'bold');
  doc.setFontSize(10);
  doc.text('รวมทั้งสิ้น / Grand Total:', margin, yPos);
  doc.text(subtotalTHB.toFixed(2), margin + 120, yPos);
  yPos += 10;

  // Footer
  setFont(doc, 'normal');
  doc.setFontSize(9);
  doc.text('ได้รับเงินครบถ้วนถูกต้องแล้ว / Received in good order', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.text('ผู้รับเงิน / Authorized Signature ______________________', margin, yPos);
  doc.text('วันที่ / Date ___________________', pageWidth - margin - 50, yPos, { align: 'right' });

  return doc;
};

/**
 * Generate Invoice PDF (ใบแจ้งหนี้)
 */
export const generateInvoicePDF = async (data: BillingData, company: CompanyInfo = DEFAULT_COMPANY) => {
  const doc = new jsPDF();
  
  // Load Kanit font before generating PDF
  try {
    await loadKanitFont(doc);
  } catch (error) {
    console.error('Warning: Could not load Kanit font, PDF will use default font (may not display Thai correctly):', error);
  }
  
  // Set line height factor for better Thai vowel display (increased to prevent vowel sinking)
  (doc as any).setLineHeightFactor(1.6);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  setFont(doc, 'bold');
  doc.text('ใบแจ้งหนี้ / Invoice', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.setFontSize(10);
  setFont(doc, 'normal');
  doc.text('ต้นฉบับ / Original', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Company and Document Info (same as Receipt)
  doc.setFontSize(10);
  setFont(doc, 'normal');
  
  // Seller Name (left) and Document No (right) - same line, labels on top, content below
  doc.text('ชื่อผู้ประกอบการ / Seller Name:', margin, yPos);
  setFont(doc, 'bold');
  yPos += 6; // Increased spacing for Thai vowels
  doc.text(company.sellerName, margin, yPos, { maxWidth: 100 });
  
  // Document number on the right side (same line as Seller Name)
  setFont(doc, 'normal');
  doc.text('เลขที่เอกสาร / Document No:', pageWidth - margin - 60, yPos - 6);
  setFont(doc, 'bold');
  yPos += 6;
  doc.text(data.documentNo, pageWidth - margin, yPos - 6, { align: 'right', maxWidth: 60 });
  yPos += 3;

  // Address (left) and Date (right) - same line, labels on top, content below
  setFont(doc, 'normal');
  doc.text('ที่อยู่ / Address:', margin, yPos);
  const formattedDate = data.date && data.date !== 'Invalid Date' ? data.date : new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text('วันที่ / Date:', pageWidth - margin - 60, yPos);
  yPos += 6;
  doc.text(company.address, margin, yPos, { maxWidth: 100 });
  doc.text(formattedDate, pageWidth - margin, yPos, { align: 'right', maxWidth: 60 });
  yPos += 9;

  // Tax ID (left) and Ref (right) - same line, labels on top, content below
  setFont(doc, 'normal');
  doc.text('เลขประจำตัวผู้เสียภาษี / Tax ID:', margin, yPos);
  if (data.ref) {
    doc.text('อ้างอิง / Ref.:', pageWidth - margin - 60, yPos);
  }
  yPos += 6;
  doc.text(company.taxId, margin, yPos, { maxWidth: 100 });
  if (data.ref) {
    doc.text(data.ref, pageWidth - margin, yPos, { align: 'right', maxWidth: 60 });
  }
  yPos += 12;

  // Customer Info - with extra spacing for Thai vowels
  doc.setFontSize(11);
  setFont(doc, 'bold');
  doc.text('ชื่อลูกค้า / Customer Name:', margin, yPos);
  setFont(doc, 'normal');
  doc.text(data.customerName, margin + 55, yPos, { maxWidth: 100 });
  yPos += 8;

  doc.text('ที่อยู่ / Address:', margin, yPos);
  doc.text(data.customerAddress, margin + 55, yPos, { maxWidth: 100 });
  yPos += 8;

  if (data.customerTaxId) {
    doc.text('เลขประจำตัวผู้เสียภาษี / Tax ID:', margin, yPos);
    doc.text(data.customerTaxId, margin + 55, yPos, { maxWidth: 100 });
    yPos += 8;
  }
  yPos += 8;

  // Draw line first
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Items Table Header - moved below the stroke
  doc.setFontSize(9);
  setFont(doc, 'bold');
  doc.text('ลำดับ / No.', margin, yPos);
  // Description: moved further right (closer to Qty)
  const qtyX = pageWidth - margin - 90; // Qty position at 100mm
  const descriptionX = margin + 70; // Moved further right to 90mm (before Qty)
  const descriptionMaxWidth = qtyX - descriptionX - 10; // Reserve 10mm space before Qty
  doc.text('รายละเอียด / Description', descriptionX, yPos);
  doc.text('จำนวน / Qty', pageWidth - margin - 90, yPos, { align: 'center' });
  doc.text('จำนวนเงิน (USD)', pageWidth - margin - 30, yPos, { align: 'right' }); // Closer to THB (30mm apart)
  doc.text('จำนวนเงิน (THB)', pageWidth - margin, yPos, { align: 'right' }); // Rightmost
  yPos += 6;
  
  setFont(doc, 'normal');
  doc.setFontSize(8);
  doc.text(`(1 USD = ${data.exchangeRate || EXCHANGE_RATE} THB)`, pageWidth - margin - 30, yPos, { align: 'right' });
  yPos += 8;

  // Items
  doc.setFontSize(9);
  let itemNo = 1;
  let subtotalTHB = 0;
  
  data.items.forEach(item => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    setFont(doc, 'bold');
    doc.text(itemNo.toString(), margin, yPos);
    setFont(doc, 'normal');
    doc.text(item.description, descriptionX, yPos, { maxWidth: descriptionMaxWidth, lineHeightFactor: 1.5 }); // Use calculated width
    if (item.quantity !== undefined) {
      doc.text(item.quantity.toString(), pageWidth - margin - 90, yPos, { align: 'center' });
    }
    doc.text(item.amountUSD.toFixed(2), pageWidth - margin - 30, yPos, { align: 'right' }); // Closer to THB
    doc.text(item.amountTHB.toFixed(2), pageWidth - margin, yPos, { align: 'right' }); // Rightmost
    subtotalTHB += item.amountTHB;
    yPos += 10; // Increased spacing for Thai vowels
    itemNo++;
  });

  yPos += 3;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Totals - aligned to left
  doc.setFontSize(9);
  setFont(doc, 'normal');
  doc.text('รวมเป็นเงิน / Subtotal:', margin, yPos);
  setFont(doc, 'bold');
  doc.text(subtotalTHB.toFixed(2), margin + 120, yPos);
  yPos += 6;

  setFont(doc, 'normal');
  doc.text('ภาษีมูลค่าเพิ่ม 7% / VAT 7%:', margin, yPos);
  doc.text('0.00', margin + 120, yPos);
  yPos += 6;

  doc.text('ราคาไม่รวมภาษี / Price excluding VAT:', margin, yPos);
  doc.text('0.00', margin + 120, yPos);
  yPos += 6;

  setFont(doc, 'bold');
  doc.setFontSize(10);
  doc.text('รวมทั้งสิ้น / Grand Total:', margin, yPos);
  doc.text(subtotalTHB.toFixed(2), margin + 120, yPos);
  yPos += 10;

  // Footer
  setFont(doc, 'normal');
  doc.setFontSize(9);
  doc.text('ได้รับเงินครบถ้วนถูกต้องแล้ว / Received in good order', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.text('ผู้รับเงิน / Authorized Signature ______________________', margin, yPos);
  doc.text('วันที่ / Date ___________________', pageWidth - margin - 50, yPos, { align: 'right' });

  return doc;
};

/**
 * Generate Tax Invoice PDF (ใบกำกับภาษี)
 */
export const generateTaxInvoicePDF = async (data: BillingData, company: CompanyInfo = DEFAULT_COMPANY) => {
  const doc = new jsPDF();
  
  // Load Kanit font before generating PDF
  try {
    await loadKanitFont(doc);
  } catch (error) {
    console.error('Warning: Could not load Kanit font, PDF will use default font (may not display Thai correctly):', error);
  }
  
  // Set line height factor for better Thai vowel display (increased to prevent vowel sinking)
  (doc as any).setLineHeightFactor(1.6);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  setFont(doc, 'bold');
  doc.text('ใบกำกับภาษี / Tax Invoice', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.setFontSize(10);
  setFont(doc, 'normal');
  doc.text('ต้นฉบับ / Original', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Company and Document Info (same as others)
  doc.setFontSize(10);
  setFont(doc, 'normal');
  
  // Seller Name (left) and Document No (right) - same line, labels on top, content below
  doc.text('ชื่อผู้ประกอบการ / Seller Name:', margin, yPos);
  setFont(doc, 'bold');
  yPos += 6; // Increased spacing for Thai vowels
  doc.text(company.sellerName, margin, yPos, { maxWidth: 100 });
  
  // Document number on the right side (same line as Seller Name)
  setFont(doc, 'normal');
  doc.text('เลขที่เอกสาร / Document No:', pageWidth - margin - 60, yPos - 6);
  setFont(doc, 'bold');
  yPos += 6;
  doc.text(data.documentNo, pageWidth - margin, yPos - 6, { align: 'right', maxWidth: 60 });
  yPos += 3;

  // Address (left) and Date (right) - same line, labels on top, content below
  setFont(doc, 'normal');
  doc.text('ที่อยู่ / Address:', margin, yPos);
  const formattedDateTax = data.date && data.date !== 'Invalid Date' ? data.date : new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text('วันที่ / Date:', pageWidth - margin - 60, yPos);
  yPos += 6;
  doc.text(company.address, margin, yPos, { maxWidth: 100 });
  doc.text(formattedDateTax, pageWidth - margin, yPos, { align: 'right', maxWidth: 60 });
  yPos += 9;

  // Tax ID (left) and Ref (right) - same line, labels on top, content below
  setFont(doc, 'normal');
  doc.text('เลขประจำตัวผู้เสียภาษี / Tax ID:', margin, yPos);
  if (data.ref) {
    doc.text('อ้างอิง / Ref.:', pageWidth - margin - 60, yPos);
  }
  yPos += 6;
  doc.text(company.taxId, margin, yPos, { maxWidth: 100 });
  if (data.ref) {
    doc.text(data.ref, pageWidth - margin, yPos, { align: 'right', maxWidth: 60 });
  }
  yPos += 12;

  // Customer Info - with extra spacing for Thai vowels
  doc.setFontSize(11);
  setFont(doc, 'bold');
  doc.text('ชื่อลูกค้า / Customer Name:', margin, yPos);
  setFont(doc, 'normal');
  doc.text(data.customerName, margin + 55, yPos, { maxWidth: 100 });
  yPos += 8;

  doc.text('ที่อยู่ / Address:', margin, yPos);
  doc.text(data.customerAddress, margin + 55, yPos, { maxWidth: 100 });
  yPos += 8;

  if (data.customerTaxId) {
    doc.text('เลขประจำตัวผู้เสียภาษี / Tax ID:', margin, yPos);
    doc.text(data.customerTaxId, margin + 55, yPos, { maxWidth: 100 });
    yPos += 8;
  }
  yPos += 8;

  // Draw line first
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Items Table Header - moved below the stroke
  doc.setFontSize(9);
  setFont(doc, 'bold');
  doc.text('ลำดับ / No.', margin, yPos);
  // Description: moved further right (closer to Qty)
  const qtyX = pageWidth - margin - 90; // Qty position at 100mm
  const descriptionX = margin + 70; // Moved further right to 90mm (before Qty)
  const descriptionMaxWidth = qtyX - descriptionX - 10; // Reserve 10mm space before Qty
  doc.text('รายละเอียด / Description', descriptionX, yPos);
  doc.text('จำนวน / Qty', pageWidth - margin - 90, yPos, { align: 'center' });
  doc.text('จำนวนเงิน (USD)', pageWidth - margin - 30, yPos, { align: 'right' }); // Closer to THB (30mm apart)
  doc.text('จำนวนเงิน (THB)', pageWidth - margin, yPos, { align: 'right' }); // Rightmost
  yPos += 6;
  
  setFont(doc, 'normal');
  doc.setFontSize(8);
  doc.text(`(1 USD = ${data.exchangeRate || EXCHANGE_RATE} THB)`, pageWidth - margin - 30, yPos, { align: 'right' });
  yPos += 8;

  // Items
  doc.setFontSize(9);
  let itemNo = 1;
  let subtotalTHB = 0;
  
  data.items.forEach(item => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    setFont(doc, 'bold');
    doc.text(itemNo.toString(), margin, yPos);
    setFont(doc, 'normal');
    doc.text(item.description, descriptionX, yPos, { maxWidth: descriptionMaxWidth, lineHeightFactor: 1.5 }); // Use calculated width
    if (item.quantity !== undefined) {
      doc.text(item.quantity.toString(), pageWidth - margin - 90, yPos, { align: 'center' });
    }
    doc.text(item.amountUSD.toFixed(2), pageWidth - margin - 30, yPos, { align: 'right' }); // Closer to THB
    doc.text(item.amountTHB.toFixed(2), pageWidth - margin, yPos, { align: 'right' }); // Rightmost
    subtotalTHB += item.amountTHB;
    yPos += 10; // Increased spacing for Thai vowels
    itemNo++;
  });

  yPos += 3;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Calculate VAT
  const vatAmount = subtotalTHB * 0.07;
  const priceExcludingVat = subtotalTHB - vatAmount;
  const grandTotal = subtotalTHB;

  // Totals - aligned to left
  doc.setFontSize(9);
  setFont(doc, 'normal');
  doc.text('รวมเป็นเงิน / Subtotal:', margin, yPos);
  setFont(doc, 'bold');
  doc.text(subtotalTHB.toFixed(2), margin + 120, yPos);
  yPos += 6;

  setFont(doc, 'normal');
  doc.text('ภาษีมูลค่าเพิ่ม 7% / VAT 7%:', margin, yPos);
  doc.text(vatAmount.toFixed(2), margin + 120, yPos);
  yPos += 6;

  doc.text('ราคาไม่รวมภาษี / Price excluding VAT:', margin, yPos);
  doc.text(priceExcludingVat.toFixed(2), margin + 120, yPos);
  yPos += 6;

  setFont(doc, 'bold');
  doc.setFontSize(10);
  doc.text('รวมทั้งสิ้น / Grand Total:', margin, yPos);
  doc.text(grandTotal.toFixed(2), margin + 120, yPos);
  yPos += 10;

  // Footer
  setFont(doc, 'normal');
  doc.setFontSize(9);
  doc.text('ได้รับเงินครบถ้วนถูกต้องแล้ว / Received in good order', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.text('ผู้รับเงิน / Authorized Signature ______________________', margin, yPos);
  doc.text('วันที่ / Date ___________________', pageWidth - margin - 50, yPos, { align: 'right' });

  return doc;
};
