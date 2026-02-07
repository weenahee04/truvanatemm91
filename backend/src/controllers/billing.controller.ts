import { Request, Response } from 'express';
import fs from 'fs';
import { getKanitFontBase64, generateFontFaceCSS } from '../utils/fontLoader';
import { getPTJLogoHTML } from '../utils/logoLoader';
import puppeteer from 'puppeteer';

export interface BillingData {
  documentNo: string;
  date: string;
  ref?: string;
  customerName: string;
  customerAddress: string;
  customerTaxId?: string;
  items: BillingItem[];
  exchangeRate?: number;
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

const EXCHANGE_RATE = 35;

/**
 * Format date for display
 */
const formatDate = (date: string): string => {
  if (date && date !== 'Invalid Date') {
    return date;
  }
  return new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generate HTML template for billing document
 */
const generateHTML = async (
  data: BillingData,
  company: CompanyInfo,
  type: 'receipt' | 'invoice' | 'tax-invoice'
): Promise<string> => {
  const title = type === 'receipt' 
    ? 'ใบเสร็จรับเงิน / Receipt'
    : type === 'invoice'
    ? 'ใบแจ้งหนี้ / Invoice'
    : 'ใบกำกับภาษี / Tax Invoice';

  const subtotalTHB = data.items.reduce((sum, item) => sum + item.amountTHB, 0);
  const vatAmount = type === 'tax-invoice' ? subtotalTHB * 0.07 : 0;
  const priceExcludingVat = type === 'tax-invoice' ? subtotalTHB - vatAmount : subtotalTHB;
  const grandTotal = subtotalTHB;

  const formattedDate = formatDate(data.date);
  const exchangeRate = data.exchangeRate || EXCHANGE_RATE;

  // Fetch and embed Kanit fonts as base64
  const { regular: kanitRegular, bold: kanitBold } = await getKanitFontBase64();
  const fontFaceCSS = generateFontFaceCSS(kanitRegular, kanitBold);

  // PTJ Logo PNG (loaded from file as base64)
  const ptjLogoHTML = getPTJLogoHTML(30); // 30mm width (50% of original 60mm)

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${fontFaceCSS}
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Kanit', sans-serif;
      font-size: 10pt;
      line-height: 0.8;
      color: #000;
      padding: 10mm;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 5mm;
    }
    
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 5mm;
    }
    
    .header h1 {
      font-size: 18pt;
      font-weight: 700;
      margin-bottom: 5mm;
    }
    
    .header .subtitle {
      font-size: 10pt;
      margin-bottom: 10mm;
    }
    
    .company-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10mm;
    }
    
    .company-info-left, .company-info-right {
      width: 48%;
    }
    
    .info-row {
      margin-bottom: 3mm;
    }
    
    .info-label {
      font-size: 10pt;
      margin-bottom: 1.5mm;
    }
    
    .info-value {
      font-size: 10pt;
      font-weight: 500;
    }
    
    .customer-info {
      margin-bottom: 5mm;
    }
    
    .customer-info-row {
      margin-bottom: 2.5mm;
      display: flex;
    }
    
    .customer-label {
      font-weight: 600;
      margin-right: 10mm;
      min-width: 55mm;
    }
    
    .divider {
      border-top: 0.5px solid #000;
      margin: 5mm 0;
    }
    
    .table {
      width: 100%;
      margin-bottom: 5mm;
    }
    
    .table-header {
      display: flex;
      font-weight: 700;
      font-size: 9pt;
      padding: 2.5mm 0;
      border-bottom: 0.5px solid #000;
    }
    
    .table-row {
      display: flex;
      font-size: 9pt;
      padding: 2.5mm 0;
      border-bottom: 0.5px solid #eee;
    }
    
    .col-no {
      width: 15mm;
    }
    
    .col-description {
      flex: 1;
      min-width: 80mm;
      margin: 0 5mm;
    }
    
    .col-qty {
      width: 30mm;
      text-align: center;
    }
    
    .col-usd {
      width: 45mm;
      text-align: right;
    }
    
    .col-thb {
      width: 40mm;
      text-align: right;
    }
    
    .totals {
      margin-top: 5mm;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2mm;
      font-size: 9pt;
    }
    
    .total-label {
      font-weight: 500;
    }
    
    .total-value {
      font-weight: 700;
      text-align: right;
      min-width: 120mm;
    }
    
    .grand-total {
      font-size: 10pt;
      font-weight: 700;
    }
    
    .footer {
      margin-top: 5mm;
      margin-bottom: 3mm;
      text-align: center;
      font-size: 9pt;
    }
    
    .signature {
      margin-top: 5mm;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-container">
      ${ptjLogoHTML}
    </div>
    <h1>${title}</h1>
    <div class="subtitle">ต้นฉบับ / Original</div>
  </div>
  
  <div class="company-info">
    <div class="company-info-left">
      <div class="info-row">
        <div class="info-label">ชื่อผู้ประกอบการ / Seller Name:</div>
        <div class="info-value">${company.sellerName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">ที่อยู่ / Address:</div>
        <div class="info-value">${company.address}</div>
      </div>
      <div class="info-row">
        <div class="info-label">เลขประจำตัวผู้เสียภาษี / Tax ID:</div>
        <div class="info-value">${company.taxId}</div>
      </div>
    </div>
    
    <div class="company-info-right">
      <div class="info-row">
        <div class="info-label">เลขที่เอกสาร / Document No:</div>
        <div class="info-value">${data.documentNo}</div>
      </div>
      <div class="info-row">
        <div class="info-label">วันที่ / Date:</div>
        <div class="info-value">${formattedDate}</div>
      </div>
      ${data.ref ? `
      <div class="info-row">
        <div class="info-label">อ้างอิง / Ref.:</div>
        <div class="info-value">${data.ref}</div>
      </div>
      ` : ''}
    </div>
  </div>
  
  <div class="customer-info">
    <div class="customer-info-row">
      <span class="customer-label">ชื่อลูกค้า / Customer Name:</span>
      <span>${data.customerName}</span>
    </div>
    <div class="customer-info-row">
      <span class="customer-label">ที่อยู่ / Address:</span>
      <span>${data.customerAddress}</span>
    </div>
    ${data.customerTaxId ? `
    <div class="customer-info-row">
      <span class="customer-label">เลขประจำตัวผู้เสียภาษี / Tax ID:</span>
      <span>${data.customerTaxId}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="divider"></div>
  
  <div style="text-align: right; margin-bottom: 5mm; font-size: 8pt;">
    (1 USD = ${exchangeRate} THB)
  </div>
  
  <div class="table">
    <div class="table-header">
      <div class="col-no">ลำดับ / No.</div>
      <div class="col-description">รายละเอียด / Description</div>
      <div class="col-qty">จำนวน / Qty</div>
      <div class="col-usd">จำนวนเงิน (USD)</div>
      <div class="col-thb">จำนวนเงิน (THB)</div>
    </div>
    ${data.items.map((item, index) => `
    <div class="table-row">
      <div class="col-no">${index + 1}</div>
      <div class="col-description">${item.description}</div>
      <div class="col-qty">${item.quantity || ''}</div>
      <div class="col-usd">${item.amountUSD.toFixed(2)}</div>
      <div class="col-thb">${item.amountTHB.toFixed(2)}</div>
    </div>
    `).join('')}
  </div>
  
  <div class="divider"></div>
  
  <div class="totals">
    <div class="total-row">
      <span class="total-label">รวมเป็นเงิน / Subtotal:</span>
      <span class="total-value">${subtotalTHB.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span class="total-label">ภาษีมูลค่าเพิ่ม 7% / VAT 7%:</span>
      <span class="total-value">${vatAmount.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span class="total-label">ราคาไม่รวมภาษี / Price excluding VAT:</span>
      <span class="total-value">${priceExcludingVat.toFixed(2)}</span>
    </div>
    <div class="total-row grand-total">
      <span class="total-label">รวมทั้งสิ้น / Grand Total:</span>
      <span class="total-value">${grandTotal.toFixed(2)}</span>
    </div>
  </div>
  
  <div class="footer">
    <div>ได้รับเงินครบถ้วนถูกต้องแล้ว / Received in good order</div>
  </div>
  
  <div class="signature">
    <div>ผู้รับเงิน / Authorized Signature ______________________</div>
    <div>วันที่ / Date ___________________</div>
  </div>
</body>
</html>
  `.trim();
};


/**
 * POST /api/billing/generate
 * Generate billing PDF (Receipt, Invoice, or Tax Invoice)
 */
export const generateBillingPDF = async (req: Request, res: Response) => {
  const origin = req.headers.origin;
  
  try {
    const { data, company, type } = req.body as {
      data: BillingData;
      company?: CompanyInfo;
      type: 'receipt' | 'invoice' | 'tax-invoice';
    };

    if (!data) {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(400).json({ error: 'Billing data is required' });
    }

    console.log('Generating PDF for:', data.documentNo, 'Type:', type);
    const companyInfo = company || DEFAULT_COMPANY;
    const html = await generateHTML(data, companyInfo, type);
    
    // Set CORS headers for PDF response
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    let browser;
    try {
      // Resolve Chrome/Chromium path: env > Mac Chrome > Linux chromium > puppeteer bundled
      let executablePath: string | undefined;
      if (process.env.CHROME_BIN) {
        executablePath = process.env.CHROME_BIN;
      } else if (process.platform === 'darwin') {
        const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (fs.existsSync(macChrome)) executablePath = macChrome;
        // else: use puppeteer bundled
      } else {
        const linuxPaths = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
        executablePath = linuxPaths.find(p => fs.existsSync(p));
      }
      console.log('Launching browser...', executablePath ? `executable: ${executablePath}` : '(puppeteer bundled)');
      const launchOpts: Parameters<typeof puppeteer.launch>[0] = {
        ...(executablePath && { executablePath }),
        headless: 'new' as any,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-features=TranslateUI',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--enable-automation',
          '--password-store=basic',
          '--use-mock-keychain',
        ],
      };
      browser = await puppeteer.launch(launchOpts);

      const page = await browser.newPage();

      // Use 'domcontentloaded' instead of 'networkidle0' since fonts are embedded as base64
      // This significantly reduces wait time
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      // Ensure PDF is a Buffer
      const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${data.documentNo}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.send(pdfBuffer);

    } catch (err: any) {
      console.error('PDF generation error:', err);
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.status(500).json({ 
        error: 'Failed to generate PDF', 
        message: err.message || 'Unknown error'
      });
    } finally {
      if (browser) await browser.close();
    }
  } catch (error: any) {
    // Set CORS headers even for errors
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      message: error.message || 'Unknown error'
    });
  }
};

