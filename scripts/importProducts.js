/**
 * Script to import sample products to Firestore
 * Run this script after setting up Firebase configuration
 * 
 * Usage: node scripts/importProducts.js
 */

import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import sampleProducts from '../data/sample-products.json' assert { type: 'json' };

async function importProducts() {
  console.log('🚀 Starting product import...');
  
  try {
    const batch = writeBatch(db);
    const productsRef = collection(db, 'products');
    
    let count = 0;
    for (const product of sampleProducts) {
      const { id, ...productData } = product;
      const docRef = doc(productsRef, id);
      batch.set(docRef, {
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      count++;
      console.log(`✅ Prepared: ${product.title}`);
    }
    
    await batch.commit();
    console.log(`\n✨ Successfully imported ${count} products to Firestore!`);
    
  } catch (error) {
    console.error('❌ Error importing products:', error);
  }
}

// Run the import
importProducts();
