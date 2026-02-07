import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from '../types';

// Get all products (only products with sellerId from real sellers)
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products = querySnapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id 
    } as Product));
    
    // Filter to only show products that have a sellerId (created by real sellers)
    return products.filter(product => product.sellerId && product.sellerId.trim() !== '');
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as Product : null;
  } catch (error) {
    console.error('Error getting product:', error);
    return null;
  }
};

// Get products by category (only products with sellerId from real sellers)
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'), 
      where('category', '==', category)
    );
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id 
    } as Product));
    
    // Filter to only show products that have a sellerId (created by real sellers)
    return products.filter(product => product.sellerId && product.sellerId.trim() !== '');
  } catch (error) {
    console.error('Error getting products by category:', error);
    return [];
  }
};

// Get flash sale products (only products with sellerId from real sellers)
export const getFlashSaleProducts = async (): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'), 
      where('isFlashSale', '==', true),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id 
    } as Product));
    
    // Filter to only show products that have a sellerId (created by real sellers)
    return products.filter(product => product.sellerId && product.sellerId.trim() !== '');
  } catch (error) {
    console.error('Error getting flash sale products:', error);
    return [];
  }
};

// Add new product (for sellers)
export const addProduct = async (product: Omit<Product, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Update product
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Delete product
export const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await deleteDoc(doc(db, 'products', id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Search products (only products with sellerId from real sellers)
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia or ElasticSearch
    const querySnapshot = await getDocs(collection(db, 'products'));
    const allProducts = querySnapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id 
    } as Product));
    
    // Filter to only show products that have a sellerId (created by real sellers)
    // Then filter by search term
    return allProducts
      .filter(product => product.sellerId && product.sellerId.trim() !== '')
      .filter(product => 
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};
