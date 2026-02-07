import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

// Get all products
export const getAllProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = await db.collection('products')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const products = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ products });
  } catch (error) {
    logger.error('Error getting products:', error);
    next(error);
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('products').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    logger.error('Error getting product:', error);
    next(error);
  }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;

    const snapshot = await db.collection('products')
      .where('category', '==', category)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const products = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ products });
  } catch (error) {
    logger.error('Error getting products by category:', error);
    next(error);
  }
};

// Search products
export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const snapshot = await db.collection('products')
      .where('isActive', '==', true)
      .get();

    const searchTerm = q.toLowerCase();
    const products = snapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((product: any) => 
        product.title?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.category?.toLowerCase().includes(searchTerm)
      );

    res.json({ products });
  } catch (error) {
    logger.error('Error searching products:', error);
    next(error);
  }
};

// Create product (seller/admin)
export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const productData = {
      ...req.body,
      sellerId: userId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const productRef = await db.collection('products').add(productData);

    res.status(201).json({
      success: true,
      productId: productRef.id,
      product: productData,
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    next(error);
  }
};

// Update product (seller/admin)
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { id } = req.params;

    const doc = await db.collection('products').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = doc.data();

    // Check if user owns the product or is admin
    if (product?.sellerId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.collection('products').doc(id).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    logger.error('Error updating product:', error);
    next(error);
  }
};

// Delete product (seller/admin)
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { id } = req.params;

    const doc = await db.collection('products').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = doc.data();

    // Check if user owns the product or is admin
    if (product?.sellerId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Soft delete
    await db.collection('products').doc(id).update({
      isActive: false,
      deletedAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    logger.error('Error deleting product:', error);
    next(error);
  }
};
