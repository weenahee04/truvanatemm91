import { Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

const TICKET_PRICE_USD = 5.00; // Powerball ticket price
const SERVICE_FEE_USD = 0.00; // No separate service fee (included in ticket price)
const TOTAL_PER_TICKET_USD = 5.00;

// Get jackpots
export const getJackpots = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Mock data - in production, this should come from lottery API
    const jackpots = {
      Powerball: {
        amount: 420000000,
        nextDrawDate: '2025-12-15T22:59:00Z',
      },
      MegaMillions: {
        amount: 180000000,
        nextDrawDate: '2025-12-16T23:00:00Z',
      },
    };

    res.json(jackpots);
  } catch (error) {
    logger.error('Error fetching jackpots:', error);
    next(error);
  }
};

// Get game rules
export const getGameRules = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rules = {
      Powerball: {
        drawDays: ['Monday', 'Wednesday', 'Saturday'],
        drawTime: '22:59:00 EST',
        numberRange: { min: 1, max: 69 },
        numbersToSelect: 5,
        powerballRange: { min: 1, max: 26 },
        ticketPrice: TICKET_PRICE_USD,
        serviceFee: SERVICE_FEE_USD,
      },
      MegaMillions: {
        drawDays: ['Tuesday', 'Friday'],
        drawTime: '23:00:00 EST',
        numberRange: { min: 1, max: 70 },
        numbersToSelect: 5,
        megaballRange: { min: 1, max: 25 },
        ticketPrice: TICKET_PRICE_USD,
        serviceFee: SERVICE_FEE_USD,
      },
    };

    res.json(rules);
  } catch (error) {
    logger.error('Error fetching game rules:', error);
    next(error);
  }
};

// Get my tickets
export const getMyTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const snapshot = await db.collection('lottoTickets')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const tickets = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ tickets });
  } catch (error) {
    logger.error('Error getting tickets:', error);
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

    const snapshot = await db.collection('lottoOrders')
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

// Purchase ticket
export const purchaseTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gameType, numbers, extraBall, drawDate } = req.body;

    // Validate input
    if (!gameType || !numbers || !extraBall || !drawDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create ticket
    const ticketData = {
      userId,
      gameType,
      numbers,
      extraBall,
      drawDate,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const ticketRef = await db.collection('lottoTickets').add(ticketData);

    // Create order
    const orderData = {
      userId,
      ticketIds: [ticketRef.id],
      totalAmount: TOTAL_PER_TICKET_USD,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const orderRef = await db.collection('lottoOrders').add(orderData);

    res.status(201).json({
      success: true,
      ticketId: ticketRef.id,
      orderId: orderRef.id,
      ticket: ticketData,
    });
  } catch (error) {
    logger.error('Error purchasing ticket:', error);
    next(error);
  }
};

// Check results
export const checkResults = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ticketId } = req.params;

    const ticketDoc = await db.collection('lottoTickets').doc(ticketId).get();

    if (!ticketDoc.exists) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketDoc.data();

    // Check if user owns the ticket
    if (ticket?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get draw results for the ticket's draw date
    const drawSnapshot = await db.collection('drawResults')
      .where('gameType', '==', ticket.gameType)
      .where('drawDate', '==', ticket.drawDate)
      .limit(1)
      .get();

    if (drawSnapshot.empty) {
      return res.json({
        ticket: {
          id: ticketDoc.id,
          ...ticket,
        },
        result: null,
        message: 'Draw results not yet available',
      });
    }

    const drawResult = drawSnapshot.docs[0].data();

    // Check if ticket won
    const ticketNumbers = ticket.numbers.sort();
    const winningNumbers = drawResult.winningNumbers.sort();
    
    const matchedNumbers = ticketNumbers.filter((num: number) => 
      winningNumbers.includes(num)
    ).length;
    
    const matchedExtraBall = ticket.extraBall === drawResult.extraBall;

    let prize = 0;
    let tier = null;

    // Simplified prize calculation (you should implement actual game rules)
    if (matchedNumbers === 5 && matchedExtraBall) {
      prize = drawResult.jackpot;
      tier = 'jackpot';
    } else if (matchedNumbers === 5) {
      prize = 1000000;
      tier = '2nd';
    } else if (matchedNumbers === 4 && matchedExtraBall) {
      prize = 50000;
      tier = '3rd';
    } else if (matchedNumbers === 4) {
      prize = 100;
      tier = '4th';
    } else if (matchedNumbers === 3 && matchedExtraBall) {
      prize = 100;
      tier = '5th';
    }

    res.json({
      ticket: {
        id: ticketDoc.id,
        ...ticket,
      },
      result: {
        drawDate: drawResult.drawDate,
        winningNumbers: drawResult.winningNumbers,
        extraBall: drawResult.extraBall,
        matchedNumbers,
        matchedExtraBall,
        prize,
        tier,
      },
    });
  } catch (error) {
    logger.error('Error checking results:', error);
    next(error);
  }
};

// Get draw history
export const getDrawHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { gameType } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const snapshot = await db.collection('drawResults')
      .where('gameType', '==', gameType)
      .orderBy('drawDate', 'desc')
      .limit(limit)
      .get();

    const draws = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ draws });
  } catch (error) {
    logger.error('Error getting draw history:', error);
    next(error);
  }
};

// Update lotto order status (admin) — writes to lottoOrders or orders so customer sees new status
export const updateLottoOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, statusHistory } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Order id and status are required' });
    }

    const lottoRef = db.collection('lottoOrders').doc(id);
    const ordersRef = db.collection('orders').doc(id);
    const [lottoSnap, ordersSnap] = await Promise.all([lottoRef.get(), ordersRef.get()]);

    const docRef = lottoSnap.exists ? lottoRef : ordersSnap.exists ? ordersRef : null;
    if (!docRef) {
      return res.status(404).json({ error: 'Order not found in lottoOrders or orders' });
    }

    const payload: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (Array.isArray(statusHistory)) {
      payload.statusHistory = statusHistory.map((h: any) => ({
        status: h.status,
        changedAt: typeof h.changedAt === 'string' ? h.changedAt : (h.changedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()),
        changedBy: h.changedBy || 'Admin',
        note: h.note,
      }));
    }

    await docRef.update(payload);
    logger.info(`Lotto order ${id} status updated to ${status}`);
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    logger.error('Error updating lotto order status:', error);
    next(error);
  }
};
