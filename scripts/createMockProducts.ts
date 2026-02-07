/**
 * Script to create mock products with sellerId for testing
 * 
 * Usage: 
 *   1. Get a seller user ID from Firebase Console or use the test seller
 *   2. Run: npx ts-node scripts/createMockProducts.ts <sellerId>
 * 
 * Or run with default test seller ID:
 *   npx ts-node scripts/createMockProducts.ts
 */

import { collection, addDoc, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Mock products data with sellerId
const mockProducts = [
  {
    title: "iPhone 15 Pro Max 256GB",
    priceUSD: 1199,
    priceTHB: 42000,
    originalPriceTHB: 45000,
    image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500",
    rating: 4.9,
    sold: 234,
    isFlashSale: true,
    isUSImport: true,
    category: "Electronics",
    description: "iPhone 15 Pro Max นำเข้าจาก USA พร้อมประกัน 1 ปี",
    stockQuantity: 50,
    brand: "Apple",
    status: "active",
    isFeatured: true,
    shipsFrom: "USA"
  },
  {
    title: "Nike Air Jordan 1 Retro High",
    priceUSD: 170,
    priceTHB: 5950,
    originalPriceTHB: 6500,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    rating: 4.8,
    sold: 156,
    isFlashSale: false,
    isUSImport: true,
    category: "Fashion",
    description: "รองเท้า Nike Air Jordan 1 สีคลาสสิค นำเข้าตรงจาก USA",
    stockQuantity: 30,
    brand: "Nike",
    status: "active",
    isFeatured: false,
    shipsFrom: "USA"
  },
  {
    title: "Dyson V15 Detect Vacuum",
    priceUSD: 699,
    priceTHB: 24500,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500",
    rating: 4.7,
    sold: 89,
    isFlashSale: false,
    isUSImport: true,
    category: "Home & Garden",
    description: "เครื่องดูดฝุ่นไร้สาย Dyson V15 นำเข้าจาก USA",
    stockQuantity: 15,
    brand: "Dyson",
    status: "active",
    isFeatured: false,
    shipsFrom: "USA"
  },
  {
    title: "Sony WH-1000XM5 Headphones",
    priceUSD: 399,
    priceTHB: 13950,
    originalPriceTHB: 15000,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500",
    rating: 4.9,
    sold: 312,
    isFlashSale: true,
    isUSImport: true,
    category: "Electronics",
    description: "หูฟัง Noise Cancelling รุ่นท็อป นำเข้าจาก USA",
    stockQuantity: 40,
    brand: "Sony",
    status: "active",
    isFeatured: true,
    shipsFrom: "USA"
  },
  {
    title: "Levi's 501 Original Jeans",
    priceUSD: 69,
    priceTHB: 2415,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    rating: 4.6,
    sold: 445,
    isFlashSale: false,
    isUSImport: true,
    category: "Fashion",
    description: "กางเกงยีนส์ Levi's 501 คลาสสิค นำเข้าจาก USA",
    stockQuantity: 100,
    brand: "Levi's",
    status: "active",
    isFeatured: false,
    shipsFrom: "USA"
  },
  {
    title: "Nature Made Multivitamin",
    priceUSD: 19,
    priceTHB: 665,
    image: "https://images.unsplash.com/photo-1550572017-4bffc6faf18c?w=500",
    rating: 4.7,
    sold: 678,
    isFlashSale: false,
    isUSImport: true,
    category: "Health & Wellness",
    description: "วิตามินรวม Nature Made 100 เม็ด นำเข้าจาก USA",
    stockQuantity: 200,
    brand: "Nature Made",
    status: "active",
    isFeatured: false,
    shipsFrom: "USA"
  },
  {
    title: "LEGO Star Wars Millennium Falcon",
    priceUSD: 169,
    priceTHB: 5915,
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500",
    rating: 4.9,
    sold: 123,
    isFlashSale: false,
    isUSImport: true,
    category: "Toys & Games",
    description: "LEGO Star Wars Millennium Falcon 1351 ชิ้น",
    stockQuantity: 25,
    brand: "LEGO",
    status: "active",
    isFeatured: false,
    shipsFrom: "USA"
  },
  {
    title: "KitchenAid Stand Mixer",
    priceUSD: 379,
    priceTHB: 13265,
    originalPriceTHB: 14500,
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500",
    rating: 4.8,
    sold: 87,
    isFlashSale: true,
    isUSImport: true,
    category: "Home & Garden",
    description: "เครื่องผสมอาหาร KitchenAid รุ่น Classic",
    stockQuantity: 20,
    brand: "KitchenAid",
    status: "active",
    isFeatured: true,
    shipsFrom: "USA"
  },
  {
    title: "Ray-Ban Aviator Classic",
    priceUSD: 163,
    priceTHB: 5705,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500",
    rating: 4.7,
    sold: 234,
    isFlashSale: false,
    isUSImport: true,
    category: "Fashion",
    description: "แว่นตา Ray-Ban Aviator คลาสสิค นำเข้าจาก USA",
    stockQuantity: 60,
    brand: "Ray-Ban",
    status: "active",
    isFeatured: false,
    shipsFrom: "USA"
  },
  {
    title: "MacBook Air M3 15-inch",
    priceUSD: 1299,
    priceTHB: 45465,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
    rating: 4.9,
    sold: 156,
    isFlashSale: false,
    isUSImport: true,
    category: "Electronics",
    description: "MacBook Air M3 15-inch 256GB นำเข้าจาก USA",
    stockQuantity: 30,
    brand: "Apple",
    status: "active",
    isFeatured: true,
    shipsFrom: "USA"
  },
  {
    title: "Adidas Ultraboost 22",
    priceUSD: 180,
    priceTHB: 6300,
    originalPriceTHB: 7000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    rating: 4.8,
    sold: 289,
    isFlashSale: true,
    isUSImport: true,
    category: "Sports & Outdoors",
    description: "รองเท้าวิ่ง Adidas Ultraboost 22 นำเข้าจาก USA",
    stockQuantity: 45,
    brand: "Adidas",
    status: "active",
    isFeatured: false,
    shipsFrom: "USA"
  },
  {
    title: "Samsung Galaxy S24 Ultra",
    priceUSD: 1199,
    priceTHB: 42000,
    originalPriceTHB: 45000,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500",
    rating: 4.9,
    sold: 198,
    isFlashSale: false,
    isUSImport: true,
    category: "Electronics",
    description: "Samsung Galaxy S24 Ultra 256GB นำเข้าจาก USA",
    stockQuantity: 35,
    brand: "Samsung",
    status: "active",
    isFeatured: true,
    shipsFrom: "USA"
  }
];

async function createMockProducts(sellerId: string) {
  console.log('🚀 Starting mock product creation...');
  console.log(`📦 Using sellerId: ${sellerId}`);
  
  if (!sellerId || sellerId.trim() === '') {
    console.error('❌ Error: sellerId is required!');
    console.log('\nUsage:');
    console.log('  npx ts-node scripts/createMockProducts.ts <sellerId>');
    console.log('\nTo get a sellerId:');
    console.log('  1. Log in as a seller user');
    console.log('  2. Check Firebase Console > Authentication > Users');
    console.log('  3. Copy the User UID');
    process.exit(1);
  }

  try {
    const batch = writeBatch(db);
    const productsRef = collection(db, 'products');
    
    let count = 0;
    for (const product of mockProducts) {
      const docRef = doc(productsRef);
      batch.set(docRef, {
        ...product,
        sellerId: sellerId,
        sku: `MOCK-${Date.now()}-${count}`,
        lowStockThreshold: 5,
        mainImage: product.image,
        additionalImages: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: product.status || 'active'
      });
      count++;
      console.log(`✅ Prepared: ${product.title}`);
    }
    
    await batch.commit();
    console.log(`\n✨ Successfully created ${count} mock products with sellerId: ${sellerId}!`);
    console.log('\n📝 Note: These products will now appear on:');
    console.log('   - Homepage (/)\n   - Flash Sale (/category/flash-sale)\n   - Category pages (/category/:category)');
    
  } catch (error) {
    console.error('❌ Error creating mock products:', error);
    process.exit(1);
  }
}

// Get sellerId from command line argument
const sellerId = process.argv[2];

// Run the script
createMockProducts(sellerId || '');





