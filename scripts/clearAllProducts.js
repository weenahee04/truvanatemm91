/**
 * Script to clear all products from Firestore
 * 
 * Usage:
 *   node scripts/clearAllProducts.js
 * 
 * WARNING: This will DELETE ALL products from Firestore!
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
try {
  const serviceAccount = require(path.join(__dirname, '../../backend/serviceAccountKey.json'));
  
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
      
      const batch = db.batch();
      let count = 0;
      const batchSize = 500; // Firestore batch limit is 500
      
      snapshot.docs.forEach((doc, index) => {
        batch.delete(doc.ref);
        count++;
        
        // Commit batch when reaching limit
        if (count >= batchSize) {
          batch.commit();
          console.log(`⏳ Committed batch of ${count} deletions...`);
          count = 0;
        }
      });
      
      // Commit remaining deletions
      if (count > 0) {
        await batch.commit();
        console.log(`⏳ Committed final batch of ${count} deletions...`);
      }
      
      console.log(`✅ Successfully deleted ${snapshot.size} products!`);
      console.log('🎉 All products have been cleared from Firestore.');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error clearing products:', error);
      process.exit(1);
    }
  }
  
  clearAllProducts();
  
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n📝 Make sure serviceAccountKey.json exists in backend/ folder');
  console.log('   Or set up Firebase Admin SDK properly.\n');
  process.exit(1);
}






