// Seed 5 mockup missions into Firestore
// Run: node scripts/seedMissions.cjs

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDzn6L0F-w_o4KJN-_jPBYOLKaLlpgk1f4",
  authDomain: "truvamate-9e0fa.firebaseapp.com",
  projectId: "truvamate-9e0fa",
  storageBucket: "truvamate-9e0fa.firebasestorage.app",
  messagingSenderId: "896181893176",
  appId: "1:896181893176:web:cb4a98e430ef1921fa8ecd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date().toISOString();

const missions = [
  {
    title: { th: 'เช็คอินรายวัน', en: 'Daily Check-in', zh: '每日签到' },
    description: { th: 'เข้าสู่ระบบวันนี้เพื่อรับแต้มสะสม', en: 'Log in today to earn points', zh: '今天登录即可获得积分' },
    type: 'daily_login',
    condition: { type: 'login', threshold: 1, period: 'daily' },
    reward: {
      type: 'points',
      value: 10,
      description: { th: 'รับ 10 แต้ม', en: 'Earn 10 points', zh: '获得10积分' }
    },
    isActive: true,
    priority: 1,
    icon: '🔑',
    totalClaimed: 0,
    createdAt: now,
    updatedAt: now
  },
  {
    title: { th: 'ช้อปครบ 5,000 บาท', en: 'Spend ฿5,000', zh: '消费满฿5,000' },
    description: { th: 'ซื้อสินค้าสะสมครบ 5,000 บาท รับสิทธิ์ลุ้นรางวัล', en: 'Spend a total of ฿5,000 to earn a lucky draw ticket', zh: '累计消费满฿5,000即可获得抽奖机会' },
    type: 'spending',
    condition: { type: 'total_spending', threshold: 5000, period: 'monthly' },
    reward: {
      type: 'lucky_draw_ticket',
      value: 1,
      description: { th: 'รับสิทธิ์ลุ้นรางวัล 1 สิทธิ์', en: '1 Lucky Draw Ticket', zh: '获得1次抽奖机会' }
    },
    isActive: true,
    priority: 2,
    icon: '💰',
    totalClaimed: 0,
    createdAt: now,
    updatedAt: now
  },
  {
    title: { th: 'ซื้อครบ 10,000 บาท', en: 'Spend ฿10,000', zh: '消费满฿10,000' },
    description: { th: 'ยอดซื้อสะสมตลอดกาลครบ 10,000 บาท รับคูปองส่วนลด', en: 'Lifetime spending of ฿10,000 earns a discount coupon', zh: '终身累计消费满฿10,000即可获得优惠券' },
    type: 'spending',
    condition: { type: 'total_spending', threshold: 10000, period: 'lifetime' },
    reward: {
      type: 'coupon',
      value: 500,
      description: { th: 'คูปองส่วนลด ฿500', en: '฿500 Discount Coupon', zh: '฿500折扣券' }
    },
    isActive: true,
    priority: 3,
    icon: '🎁',
    totalClaimed: 0,
    createdAt: now,
    updatedAt: now
  },
  {
    title: { th: 'ชวนเพื่อนครบ 5 คน', en: 'Refer 5 Friends', zh: '邀请5位好友' },
    description: { th: 'แนะนำเพื่อนสมัครสมาชิกครบ 5 คน รับเงินคืน', en: 'Refer 5 friends to sign up and earn cashback', zh: '邀请5位好友注册即可获得返现' },
    type: 'referral',
    condition: { type: 'referral_count', threshold: 5, period: 'lifetime' },
    reward: {
      type: 'cashback',
      value: 200,
      description: { th: 'รับเงินคืน ฿200', en: '฿200 Cashback', zh: '获得฿200返现' }
    },
    isActive: true,
    priority: 4,
    icon: '👥',
    totalClaimed: 0,
    createdAt: now,
    updatedAt: now
  },
  {
    title: { th: 'สั่งซื้อครบ 3 ครั้ง', en: 'Place 3 Orders', zh: '下单满3次' },
    description: { th: 'สั่งซื้อสินค้าครบ 3 ครั้งในเดือนนี้ รับแต้มพิเศษ', en: 'Place 3 orders this month to earn bonus points', zh: '本月下单满3次即可获得额外积分' },
    type: 'purchase_count',
    condition: { type: 'order_count', threshold: 3, period: 'monthly' },
    reward: {
      type: 'points',
      value: 50,
      description: { th: 'รับ 50 แต้มพิเศษ', en: '50 Bonus Points', zh: '获得50额外积分' }
    },
    isActive: true,
    priority: 5,
    icon: '🛒',
    totalClaimed: 0,
    createdAt: now,
    updatedAt: now
  }
];

async function seed() {
  console.log('🚀 Seeding 5 missions into Firestore...');
  for (const mission of missions) {
    try {
      const docRef = await addDoc(collection(db, 'missions'), mission);
      console.log(`✅ Created: ${mission.title.th} (${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error creating ${mission.title.th}:`, error.message);
    }
  }
  console.log('\n🎉 Done! 5 missions seeded.');
  process.exit(0);
}

seed();
