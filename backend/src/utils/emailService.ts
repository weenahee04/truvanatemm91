import type { Transporter } from 'nodemailer';
import { logger } from './logger';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'noreply@truvamate.com';
const FROM_NAME = process.env.FROM_NAME || 'Truvamate';

// Create reusable transporter (lazy-load nodemailer to allow build without it)
let transporter: Transporter | null = null;
let nodemailerModule: typeof import('nodemailer') | null = null;

const loadNodemailer = (): typeof import('nodemailer') | null => {
  if (nodemailerModule) return nodemailerModule;
  try {
    nodemailerModule = require('nodemailer');
    return nodemailerModule;
  } catch {
    logger.warn('nodemailer not installed. Run: npm install nodemailer @types/nodemailer');
    return null;
  }
};

const createTransporter = (): Transporter | null => {
  if (transporter) {
    return transporter;
  }

  const nodemailer = loadNodemailer();
  if (!nodemailer) return null;

  if (!SMTP_USER || !SMTP_PASS) {
    logger.warn('SMTP credentials not configured. Email sending will be disabled.');
    logger.warn('Please set SMTP_USER and SMTP_PASS environment variables.');
    logger.warn('For Gmail: Use App Password (not regular password)');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // For Gmail
      ...(SMTP_HOST.includes('gmail.com') && {
        service: 'gmail',
      }),
    });

    logger.info(`Email transporter created: ${SMTP_HOST}:${SMTP_PORT}`);
    return transporter;
  } catch (error: any) {
    logger.error('Error creating email transporter:', error.message);
    return null;
  }
};

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Nodemailer (SMTP)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const emailTransporter = createTransporter();
    
    if (!emailTransporter) {
      logger.error('Email transporter not available. Please configure SMTP settings.');
      return false;
    }

    const mailOptions = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
      subject: options.subject,
      text: options.text || stripHtml(options.html),
      html: options.html,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}: ${options.subject} (Message ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    logger.error('Error sending email:', {
      to: options.to,
      subject: options.subject,
      error: error.message,
      code: error.code,
    });
    return false;
  }
};

/**
 * Verify SMTP connection
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const emailTransporter = createTransporter();
    if (!emailTransporter) {
      return false;
    }

    await emailTransporter.verify();
    logger.info('✅ Email SMTP configuration is valid');
    return true;
  } catch (error: any) {
    logger.error('❌ Email SMTP configuration error:', error.message);
    return false;
  }
};

/**
 * Strip HTML tags to create plain text version
 */
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
};

/**
 * Email design configuration
 */
export interface EmailDesignConfig {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  companyName?: string;
  companyTagline?: string;
  websiteUrl?: string;
  supportEmail?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

// Default design configuration
const defaultConfig: EmailDesignConfig = {
  primaryColor: '#FFD700', // Brand gold
  secondaryColor: '#1e293b', // Dark blue
  logoUrl: process.env.EMAIL_LOGO_URL || 'https://truvamate.com/truvamate-logo.png',
  companyName: 'Truvamate',
  companyTagline: 'USA Import Marketplace & สินค้าพิเศษ',
  websiteUrl: process.env.FRONTEND_URL || 'https://truvamate.com',
  supportEmail: 'support@truvamate.com',
  socialLinks: {
    facebook: 'https://facebook.com/truvamate',
    instagram: 'https://instagram.com/truvamate',
    twitter: 'https://twitter.com/truvamate',
  },
};

/**
 * Generate email template with common layout
 */
export const getEmailTemplate = (
  content: string, 
  title?: string,
  config: EmailDesignConfig = {}
): string => {
  const design = { ...defaultConfig, ...config };
  
  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || design.companyName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .email-header {
      background: linear-gradient(135deg, ${design.primaryColor} 0%, #ffed4e 100%);
      padding: 30px 40px;
      text-align: center;
      border-bottom: 3px solid ${design.secondaryColor};
    }
    
    .logo-container {
      margin-bottom: 10px;
    }
    
    .logo-img {
      max-width: 180px;
      height: auto;
      margin: 0 auto;
      display: block;
    }
    
    .logo-text {
      font-size: 32px;
      font-weight: 900;
      color: ${design.secondaryColor};
      margin-bottom: 5px;
      letter-spacing: -1px;
    }
    
    .tagline {
      color: #475569;
      font-size: 14px;
      font-weight: 500;
      margin: 0;
    }
    
    .email-content {
      padding: 40px;
    }
    
    .email-footer {
      background-color: #f8f9fa;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .social-links {
      margin: 20px 0;
    }
    
    .social-links a {
      display: inline-block;
      width: 36px;
      height: 36px;
      line-height: 36px;
      text-align: center;
      background-color: ${design.secondaryColor};
      color: #ffffff;
      border-radius: 50%;
      margin: 0 5px;
      text-decoration: none;
      transition: transform 0.2s;
    }
    
    .social-links a:hover {
      transform: scale(1.1);
      background-color: ${design.primaryColor};
    }
    
    .footer-links {
      margin: 15px 0;
      font-size: 12px;
    }
    
    .footer-links a {
      color: #64748b;
      text-decoration: none;
      margin: 0 8px;
      transition: color 0.2s;
    }
    
    .footer-links a:hover {
      color: ${design.primaryColor};
    }
    
    .copyright {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 15px;
    }
    
    /* Button styles */
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, ${design.primaryColor} 0%, #ffed4e 100%);
      color: ${design.secondaryColor};
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        border-radius: 0;
      }
      
      .email-header,
      .email-content,
      .email-footer {
        padding: 25px 20px;
      }
      
      .logo-text {
        font-size: 26px;
      }
      
      .button {
        display: block;
        text-align: center;
        margin: 20px auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="logo-container">
        ${design.logoUrl 
          ? `<img src="${design.logoUrl}" alt="${design.companyName}" class="logo-img" />`
          : `<div class="logo-text">${design.companyName}</div>`
        }
      </div>
      <p class="tagline">${design.companyTagline}</p>
    </div>
    
    <div class="email-content">
      ${content}
    </div>
    
    <div class="email-footer">
      ${design.socialLinks && (design.socialLinks.facebook || design.socialLinks.instagram || design.socialLinks.twitter) ? `
      <div class="social-links">
        ${design.socialLinks.facebook ? `<a href="${design.socialLinks.facebook}" target="_blank" title="Facebook">📘</a>` : ''}
        ${design.socialLinks.instagram ? `<a href="${design.socialLinks.instagram}" target="_blank" title="Instagram">📷</a>` : ''}
        ${design.socialLinks.twitter ? `<a href="${design.socialLinks.twitter}" target="_blank" title="Twitter">🐦</a>` : ''}
      </div>
      ` : ''}
      
      <div class="footer-links">
        <a href="${design.websiteUrl}">เว็บไซต์</a>
        <a href="${design.websiteUrl}/legal">นโยบายความเป็นส่วนตัว</a>
        <a href="${design.websiteUrl}/terms">ข้อกำหนดการใช้งาน</a>
      </div>
      
      <div class="copyright">
        <p>© ${new Date().getFullYear()} ${design.companyName}. All rights reserved.</p>
        <p style="margin-top: 8px;">
          หากคุณมีคำถาม กรุณาติดต่อ: 
          <a href="mailto:${design.supportEmail}" style="color: ${design.primaryColor};">${design.supportEmail}</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};