/**
 * Script to clear all products from Firestore (TypeScript version)
 * 
 * Usage:
 *   ts-node scripts/clearAllProducts.ts
 *   or
 *   npm run clear-products
 * 
 * WARNING: This will DELETE ALL products from Firestore!
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(__dirname, '../backend/serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found at:', serviceAccountPath);
    console.log('\n📝 Please ensure the service account key file exists.\n');
    process.exit(1);
  }
  
  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  
  const db = admin.firestore();
  
  async function clearAllProducts() {
    try {
      console.log('🚀 Starting to clear all products...');
      
      const productsRef = db.collection('products');
      const snapshot = await productsRef.get();
      
      if (snapshot.empty) {
        console.log('✅ No products found. Collection is already empty.');
        process.exit(0);
      }
      
      console.log(`📦 Found ${snapshot.size} products to delete.`);
      
      // Delete in batches (Firestore batch limit is 500)
      const batchSize = 500;
      let deleted = 0;
      
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = snapshot.docs.slice(i, i + batchSize);
        
        batchDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        deleted += batchDocs.length;
        console.log(`⏳ Deleted ${deleted}/${snapshot.size} products...`);
      }
      
      console.log(`✅ Successfully deleted ${snapshot.size} products!`);
      console.log('🎉 All products have been cleared from Firestore.');
      console.log('\n💡 Next steps:');
      console.log('   1. Sellers can now create products via /seller/products/new');
      console.log('   2. All products will be linked to their sellerId');
      console.log('   3. Only products with sellerId will be displayed\n');
      
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Error clearing products:', error.message);
      process.exit(1);
    }
  }
  
  clearAllProducts();
  
} catch (error: any) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}






