<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🛍️ Truvamate Marketplace

> แพลตฟอร์มซื้อสินค้าอเมริกา + บริการฝากซื้อ สินค้าพิเศษ USA

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Firebase** (สำคัญ!)
   - อ่านคู่มือใน [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - คัดลอก Firebase config ไปใส่ในไฟล์ `.env.local`

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. เปิดเบราว์เซอร์ที่: `http://localhost:3000`

---

## 📦 ฟีเจอร์

### ✅ ระบบผู้ใช้
- สมัครสมาชิก/เข้าสู่ระบบด้วยอีเมล
- Social Login (Google, Facebook)
- รีเซ็ตรหัสผ่าน
- โปรไฟล์ผู้ใช้

### 🛒 ระบบ Marketplace
- ดูสินค้าทั้งหมด
- กรองตามหมวดหมู่
- ตะกร้าสินค้า
- Checkout
- ประวัติคำสั่งซื้อ

### 🎰 ระบบ สินค้าพิเศษ USA
- ซื้อ Powerball & Mega Millions
- เลือกเลขเอง/สุ่มเลข
- ประวัติการซื้อ
- ข้อกำหนดตามกฎหมาย

### 👨‍💼 ระบบ Seller
- จัดการสินค้า
- จัดการคำสั่งซื้อ
- Dashboard สถิติ

### 🔧 ระบบ Admin
- จัดการผู้ใช้
- จัดการสินค้า
- จัดการคำสั่งซื้อทั้งหมด

---

## 🗂️ โครงสร้างโปรเจค

```
truvamate-marketplace/
├── config/
│   └── firebase.ts          # Firebase configuration
├── services/
│   ├── authService.ts       # Authentication
│   ├── productService.ts    # จัดการสินค้า
│   ├── orderService.ts      # จัดการคำสั่งซื้อ
│   └── storageService.ts    # Upload รูปภาพ
├── pages/
│   ├── Login.tsx            # หน้า Login/Register
│   ├── Home.tsx             # หน้าแรก
│   ├── Cart.tsx             # ตะกร้า
│   ├── Checkout.tsx         # ชำระเงิน
│   ├── Lotto.tsx            # ซื้อ สินค้าพิเศษ
│   └── Profile.tsx          # โปรไฟล์
├── components/
│   ├── Layout/              # Header, Footer, BottomNav
│   ├── Marketplace/         # ProductCard
│   └── ui/                  # Button, Toast
├── data/
│   └── sample-products.json # ข้อมูลตัวอย่าง
└── scripts/
    └── importProducts.js    # Import ข้อมูลเข้า Firestore
```

---

## 🔥 Firebase Setup

ดูคู่มือละเอียดใน: **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

### สรุปสั้นๆ:
1. สร้าง Firebase Project
2. เปิดใช้งาน Authentication (Email, Google, Facebook)
3. สร้าง Firestore Database
4. สร้าง Storage
5. คัดลอก config ไปใส่ใน `.env.local`

---

## 📱 Technologies

- **Frontend:** React 19 + TypeScript
- **Routing:** React Router v7
- **Build Tool:** Vite
- **Backend:** Firebase
  - Authentication
  - Firestore Database
  - Storage
- **Styling:** Tailwind CSS (ใน index.html)
- **Icons:** Lucide React
- **Charts:** Recharts

---

## 🌐 Environment Variables

สร้างไฟล์ `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📝 Scripts

```bash
npm run dev      # เปิด development server
npm run build    # Build สำหรับ production
npm run preview  # Preview production build
```

---

## 🚀 Deployment

### Vercel (แนะนำ)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy folder: dist
```

---

## 📚 เอกสารเพิ่มเติม

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - คู่มือติดตั้ง Firebase
- [FIREBASE_INTEGRATION_SUMMARY.md](./FIREBASE_INTEGRATION_SUMMARY.md) - สรุปการติดตั้ง

---

## 🆘 การแก้ไขปัญหา

### Login ไม่ได้
- ตรวจสอบว่าตั้งค่า Firebase Authentication แล้ว
- ตรวจสอบ `.env.local` ว่ากรอกครบถ้วน

### ไม่มีสินค้าแสดง
- Import ข้อมูลจาก `data/sample-products.json`
- ตรวจสอบ Firestore Rules

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Created with ❤️ by GitHub Copilot
