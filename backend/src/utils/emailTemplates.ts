import { getEmailTemplate } from './emailService';
import { emailDesignConfig } from './emailDesign';

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export interface PasswordResetEmailData {
  userName: string;
  resetLink: string;
  expiryHours?: number;
}

export interface OrderConfirmationEmailData {
  userName: string;
  orderId: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  currency?: string;
}

export interface OrderApproveEmailData {
  userName: string;
  orderId: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  currency?: string;
  trackingNumber?: string;
}

/**
 * Welcome email template for new user registration
 */
export const getWelcomeEmail = (data: WelcomeEmailData): string => {
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">ยินดีต้อนรับสู่ Truvamate! 🎉</h2>
    
    <p>สวัสดีคุณ <strong>${data.userName}</strong>,</p>
    
    <p>ขอบคุณที่สมัครสมาชิกกับ Truvamate! คุณได้เป็นส่วนหนึ่งของชุมชนที่รักสินค้าคุณภาพจากอเมริกาแล้ว</p>
    
    <h3 style="color: #1e293b;">คุณสามารถทำอะไรได้บ้าง:</h3>
    <ul>
      <li>🛒 ซื้อสินค้าจากอเมริกา พร้อมบริการจัดส่งถึงหน้าบ้าน</li>
      <li>🎫 ซื้อลอตเตอรี่อเมริกัน (Powerball & Mega Millions)</li>
      <li>📦 ติดตามสถานะออเดอร์แบบเรียลไทม์</li>
      <li>⭐ สะสมแต้มและรับสิทธิพิเศษ</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://truvamate.com" class="button" style="text-decoration: none; color: #1e293b;">เริ่มช้อปปิ้งเลย!</a>
    </div>
    
    <p>หากคุณมีคำถามหรือต้องการความช่วยเหลือ ติดต่อเราได้ตลอด 24 ชั่วโมง</p>
    
    <p>ขอให้สนุกกับการช้อปปิ้ง!<br>
    <strong>ทีม Truvamate</strong></p>
  `;

  return getEmailTemplate(content, 'ยินดีต้อนรับสู่ Truvamate', emailDesignConfig);
};

/**
 * Password reset email template
 */
export const getPasswordResetEmail = (data: PasswordResetEmailData): string => {
  const expiryText = data.expiryHours 
    ? `ลิงก์นี้จะมีอายุ ${data.expiryHours} ชั่วโมง`
    : 'ลิงก์นี้จะมีอายุ 24 ชั่วโมง';

  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">รีเซ็ตรหัสผ่าน</h2>
    
    <p>สวัสดีคุณ <strong>${data.userName}</strong>,</p>
    
    <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
    
    <p>กรุณาคลิกที่ปุ่มด้านล่างเพื่อรีเซ็ตรหัสผ่านใหม่:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.resetLink}" class="button" style="text-decoration: none; color: #1e293b;">รีเซ็ตรหัสผ่าน</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>
      <a href="${data.resetLink}" style="color: #0066cc; word-break: break-all;">${data.resetLink}</a>
    </p>
    
    <p style="color: #d32f2f; font-weight: bold;">
      ⚠️ ข้อสำคัญ:
    </p>
    <ul style="color: #666;">
      <li>${expiryText}</li>
      <li>หากคุณไม่ได้เป็นคนขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้</li>
      <li>ห้ามแชร์ลิงก์นี้กับผู้อื่น</li>
    </ul>
    
    <p>หากคุณไม่ต้องการรีเซ็ตรหัสผ่าน คุณสามารถเพิกเฉยอีเมลนี้ได้</p>
    
    <p>ขอแสดงความนับถือ,<br>
    <strong>ทีม Truvamate</strong></p>
  `;

  return getEmailTemplate(content, 'รีเซ็ตรหัสผ่าน', emailDesignConfig);
};

/**
 * Order confirmation email template
 */
export const getOrderConfirmationEmail = (data: OrderConfirmationEmailData): string => {
  const currency = data.currency || 'THB';
  const currencySymbol = currency === 'THB' ? '฿' : '$';
  
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">${currencySymbol}${item.price.toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">ยืนยันคำสั่งซื้อเรียบร้อยแล้ว! ✅</h2>
    
    <p>สวัสดีคุณ <strong>${data.userName}</strong>,</p>
    
    <p>เรายืนยันการรับคำสั่งซื้อของคุณแล้ว ขอบคุณที่เลือกใช้บริการ Truvamate!</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>เลขที่คำสั่งซื้อ:</strong> ${data.orderId}</p>
      <p style="margin: 0;"><strong>วันที่สั่งซื้อ:</strong> ${data.orderDate}</p>
    </div>
    
    <h3 style="color: #1e293b;">รายการสินค้า:</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #FFD700;">สินค้า</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #FFD700;">จำนวน</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #FFD700;">ราคา</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #FFD700;">รวมทั้งหมด:</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #1e293b; border-top: 2px solid #FFD700;">${currencySymbol}${data.total.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
    
    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FFD700;">
      <p style="margin: 0; color: #856404;">
        <strong>📌 สถานะ:</strong> รอการชำระเงิน<br>
        เราจะแจ้งเตือนคุณอีกครั้งเมื่อได้รับการชำระเงินและเริ่มดำเนินการจัดส่ง
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://truvamate.com/orders/${data.orderId}" class="button" style="text-decoration: none; color: #1e293b;">ดูรายละเอียดคำสั่งซื้อ</a>
    </div>
    
    <p>หากคุณมีคำถามเกี่ยวกับคำสั่งซื้อ กรุณาติดต่อเราที่ <a href="mailto:support@truvamate.com">support@truvamate.com</a></p>
    
    <p>ขอแสดงความนับถือ,<br>
    <strong>ทีม Truvamate</strong></p>
  `;

  return getEmailTemplate(content, 'ยืนยันคำสั่งซื้อ', emailDesignConfig);
};

/**
 * Order approval email template
 */
export const getOrderApproveEmail = (data: OrderApproveEmailData): string => {
  const currency = data.currency || 'THB';
  const currencySymbol = currency === 'THB' ? '฿' : '$';
  
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">${currencySymbol}${item.price.toLocaleString()}</td>
    </tr>
  `).join('');

  const trackingInfo = data.trackingNumber 
    ? `
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p style="margin: 0; color: #155724;">
          <strong>📦 เลขพัสดุ:</strong> ${data.trackingNumber}<br>
          คุณสามารถติดตามสถานะการจัดส่งได้ที่ลิงก์ด้านล่าง
        </p>
      </div>
    `
    : `
      <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
        <p style="margin: 0; color: #0c5460;">
          <strong>📦 สถานะ:</strong> กำลังจัดเตรียมสินค้า<br>
          เราจะส่งเลขพัสดุให้คุณทันทีเมื่อเริ่มจัดส่ง
        </p>
      </div>
    `;

  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">คำสั่งซื้อได้รับการอนุมัติแล้ว! 🎉</h2>
    
    <p>สวัสดีคุณ <strong>${data.userName}</strong>,</p>
    
    <p>เรามีข่าวดีสำหรับคุณ! คำสั่งซื้อของคุณได้รับการอนุมัติและกำลังดำเนินการจัดส่งแล้ว</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>เลขที่คำสั่งซื้อ:</strong> ${data.orderId}</p>
      <p style="margin: 0;"><strong>วันที่สั่งซื้อ:</strong> ${data.orderDate}</p>
    </div>
    
    <h3 style="color: #1e293b;">รายการสินค้า:</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #FFD700;">สินค้า</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #FFD700;">จำนวน</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #FFD700;">ราคา</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #FFD700;">รวมทั้งหมด:</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #1e293b; border-top: 2px solid #FFD700;">${currencySymbol}${data.total.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
    
    ${trackingInfo}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://truvamate.com/orders/${data.orderId}" class="button" style="text-decoration: none; color: #1e293b;">ดูรายละเอียดคำสั่งซื้อ</a>
    </div>
    
    <p>หากคุณมีคำถามเกี่ยวกับคำสั่งซื้อ กรุณาติดต่อเราที่ <a href="mailto:support@truvamate.com">support@truvamate.com</a></p>
    
    <p>ขอแสดงความนับถือ,<br>
    <strong>ทีม Truvamate</strong></p>
  `;

  return getEmailTemplate(content, 'คำสั่งซื้อได้รับการอนุมัติ', emailDesignConfig);
};