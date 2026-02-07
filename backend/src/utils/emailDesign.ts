/**
 * Email Design Configuration
 * 
 * ปรับแต่งดีไซน์อีเมลได้ที่นี่
 * สามารถแก้ไขสี สไตล์ และเนื้อหาได้ตามต้องการ
 */

import { EmailDesignConfig } from './emailService';

/**
 * ค่าการตั้งค่าเริ่มต้นสำหรับดีไซน์อีเมล
 * สามารถปรับแต่งได้ตามต้องการ
 */
export const emailDesignConfig: EmailDesignConfig = {
  // สีหลัก (Primary Color) - สีทองของ Truvamate
  primaryColor: process.env.EMAIL_PRIMARY_COLOR || '#FFD700',
  
  // สีรอง (Secondary Color) - สีน้ำเงินเข้ม
  secondaryColor: process.env.EMAIL_SECONDARY_COLOR || '#1e293b',
  
  // URL ของ Logo (ต้องเป็น publicly accessible URL)
  // ตัวอย่าง: 'https://truvamate.com/truvamate-logo.png'
  logoUrl: process.env.EMAIL_LOGO_URL || undefined,
  
  // ชื่อบริษัท
  companyName: process.env.EMAIL_COMPANY_NAME || 'Truvamate',
  
  // Tagline
  companyTagline: process.env.EMAIL_COMPANY_TAGLINE || 'USA Import Marketplace & สินค้าพิเศษ',
  
  // URL เว็บไซต์
  websiteUrl: process.env.FRONTEND_URL || process.env.EMAIL_WEBSITE_URL || 'https://truvamate.com',
  
  // Email สำหรับติดต่อ
  supportEmail: process.env.EMAIL_SUPPORT || 'support@truvamate.com',
  
  // Social Media Links (ถ้าไม่ต้องการแสดง ให้ลบหรือตั้งเป็น undefined)
  socialLinks: {
    facebook: process.env.EMAIL_FACEBOOK_URL || 'https://facebook.com/truvamate',
    instagram: process.env.EMAIL_INSTAGRAM_URL || 'https://instagram.com/truvamate',
    twitter: process.env.EMAIL_TWITTER_URL || undefined,
  },
};

/**
 * ตัวอย่างการใช้งาน:
 * 
 * 1. เปลี่ยนสีหลัก:
 *    primaryColor: '#FF6B6B',
 * 
 * 2. เพิ่ม Logo:
 *    logoUrl: 'https://yourdomain.com/logo.png',
 * 
 * 3. ซ่อน Social Links:
 *    socialLinks: undefined,
 * 
 * 4. เปลี่ยน Support Email:
 *    supportEmail: 'help@truvamate.com',
 */