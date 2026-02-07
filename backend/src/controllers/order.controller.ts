import { Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

// Create order
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { items, total, type, paymentMethod } = req.body;

    const orderData = {
      userId,
      items,
      total,
      type,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orderRef = await db.collection('orders').add(orderData);

    res.status(201).json({
      success: true,
      orderId: orderRef.id,
      order: orderData,
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    next(error);
  }
};

// Get my orders
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ orders });
  } catch (error) {
    logger.error('Error getting orders:', error);
    next(error);
  }
};

// Get order by ID
export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { id } = req.params;

    const doc = await db.collection('orders').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = doc.data();

    // Check if user owns the order or is admin
    if (order?.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      id: doc.id,
      ...order,
    });
  } catch (error) {
    logger.error('Error getting order:', error);
    next(error);
  }
};

// Get all orders (admin)
export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const snapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ orders });
  } catch (error) {
    logger.error('Error getting all orders:', error);
    next(error);
  }
};

// Update order status
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { status } = req.body;

    await db.collection('orders').doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    // If order is completed, check for referral commission
    if (status === 'completed') {
      const orderDoc = await db.collection('orders').doc(id).get();
      const order = orderDoc.data();

      if (order?.userId) {
        // Check if this is user's first order
        const userOrders = await db.collection('orders')
          .where('userId', '==', order.userId)
          .where('status', '==', 'completed')
          .get();

        if (userOrders.size === 1) {
          // This is the first completed order, process referral commission
          try {
            const referralSnapshot = await db.collection('referrals')
              .where('referredUserId', '==', order.userId)
              .where('status', '==', 'pending')
              .limit(1)
              .get();

            if (!referralSnapshot.empty) {
              // Get settings
              const settingsDoc = await db.collection('settings').doc('referral').get();
              const settings = settingsDoc.exists ? settingsDoc.data() : {
                commissionRate: 10,
                minOrderValue: 500,
                maxCommission: 500,
              };

              // Ensure settings has required fields
              const commissionRate = settings?.commissionRate || 10;
              const minOrderValue = settings?.minOrderValue || 500;
              const maxCommission = settings?.maxCommission || 500;

              if (order.total >= minOrderValue) {
                const referralDoc = referralSnapshot.docs[0];
                const referral = referralDoc.data();

                // Calculate commission
                let commission = order.total * (commissionRate / 100);
                if (commission > maxCommission) {
                  commission = maxCommission;
                }

                // Update referral
                await referralDoc.ref.update({
                  status: 'completed',
                  orderValue: order.total,
                  commission,
                  completedAt: new Date().toISOString(),
                });

                // Update referrer's total earnings
                const codeSnapshot = await db.collection('referralCodes')
                  .where('userId', '==', referral.referrerId)
                  .limit(1)
                  .get();

                if (!codeSnapshot.empty) {
                  const codeDoc = codeSnapshot.docs[0];
                  const currentEarnings = codeDoc.data().totalEarnings || 0;
                  await codeDoc.ref.update({
                    totalEarnings: currentEarnings + commission,
                  });
                }

                logger.info(`✅ Referral commission processed: ${commission} THB for order ${id}`);
              }
            }
          } catch (error) {
            logger.error('Error processing referral commission:', error);
            // Don't fail the order update if commission processing fails
          }
        }
      }
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
};
