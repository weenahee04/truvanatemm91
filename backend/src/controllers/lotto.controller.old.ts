import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { LottoOrder, LottoOrderStatus } from '../entities/LottoOrder';
import { LottoTicket, GameType } from '../entities/LottoTicket';
import { DrawResult } from '../entities/DrawResult';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import redis from '../config/redis';

const TICKET_PRICE_USD = 2.00;
const SERVICE_FEE_USD = 5.00;
const TOTAL_PER_TICKET_USD = 7.00;

export class LottoController {
  private lottoOrderRepository = AppDataSource.getRepository(LottoOrder);
  private lottoTicketRepository = AppDataSource.getRepository(LottoTicket);
  private drawResultRepository = AppDataSource.getRepository(DrawResult);

  getJackpots = async (_req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
      // Try to get from cache
      const cached = await redis.get('jackpots');
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Mock data - in production, this should come from lottery API or scraper
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

      // Cache for 1 hour
      await redis.setex('jackpots', 3600, JSON.stringify(jackpots));

      res.json(jackpots);
    } catch (error) {
      throw new AppError('Failed to fetch jackpots', 500);
    }
  };

  getGameRules = async (_req: AuthRequest, res: Response) => {
    try {
      const rules = {
        Powerball: {
          maxMain: 69,
          maxSpecial: 26,
          name: 'Powerball',
          specialName: 'PB',
          ticketPrice: TICKET_PRICE_USD,
          serviceFee: SERVICE_FEE_USD,
          totalPrice: TOTAL_PER_TICKET_USD,
        },
        MegaMillions: {
          maxMain: 70,
          maxSpecial: 25,
          name: 'Mega Millions',
          specialName: 'MM',
          ticketPrice: TICKET_PRICE_USD,
          serviceFee: SERVICE_FEE_USD,
          totalPrice: TOTAL_PER_TICKET_USD,
        },
      };

      res.json(rules);
    } catch (error) {
      throw new AppError('Failed to fetch game rules', 500);
    }
  };

  generateQuickPick = async (req: AuthRequest, res: Response) => {
    try {
      const { gameType } = req.body;

      const maxMain = gameType === 'Powerball' ? 69 : 70;
      const maxSpecial = gameType === 'Powerball' ? 26 : 25;

      // Generate 5 unique random main numbers
      const numbers: number[] = [];
      while (numbers.length < 5) {
        const num = Math.floor(Math.random() * maxMain) + 1;
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }
      numbers.sort((a, b) => a - b);

      // Generate special number
      const special = Math.floor(Math.random() * maxSpecial) + 1;

      res.json({
        numbers,
        special,
        gameType,
      });
    } catch (error) {
      throw new AppError('Failed to generate quick pick', 500);
    }
  };

  createOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { tickets, location } = req.body;
      const userId = req.userId!;

      if (!tickets || tickets.length === 0) {
        throw new AppError('No tickets provided', 400);
      }

      // Validate tickets
      for (const ticket of tickets) {
        this.validateTicket(ticket);
      }

      // Get exchange rate (in production, fetch from API)
      const exchangeRate = parseFloat(process.env.DEFAULT_EXCHANGE_RATE || '35.00');

      // Calculate totals
      const totalTickets = tickets.length;
      const totalAmountUsd = totalTickets * TOTAL_PER_TICKET_USD;
      const totalAmountThb = totalAmountUsd * exchangeRate;

      // Generate order number
      const orderNumber = `LTO-${new Date().getFullYear()}-${Date.now()}`;

      // Create order
      const order = this.lottoOrderRepository.create({
        userId,
        orderNumber,
        status: LottoOrderStatus.PAYMENT_PENDING,
        totalTickets,
        ticketPriceUsd: TICKET_PRICE_USD,
        serviceFeeUsd: SERVICE_FEE_USD,
        totalPerTicketUsd: TOTAL_PER_TICKET_USD,
        totalAmountUsd,
        exchangeRate,
        totalAmountThb,
        orderLocation: location,
        drawDate: this.getNextDrawDate(tickets[0].gameType),
      });

      await this.lottoOrderRepository.save(order);

      // Create tickets
      const ticketEntities = tickets.map((ticket: any, index: number) => {
        return this.lottoTicketRepository.create({
          orderId: order.id,
          ticketNumber: `${orderNumber}-T${index + 1}`,
          gameType: ticket.gameType,
          numbers: ticket.numbers,
          specialNumber: ticket.special,
          hasMultiplier: ticket.multiplier || false,
        });
      });

      await this.lottoTicketRepository.save(ticketEntities);

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalTickets: order.totalTickets,
          totalAmountUsd: order.totalAmountUsd,
          totalAmountThb: order.totalAmountThb,
          status: order.status,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create order', 500);
    }
  };

  getUserOrders = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      const orders = await this.lottoOrderRepository.find({
        where: { userId },
        relations: ['tickets'],
        order: { createdAt: 'DESC' },
      });

      res.json({ orders });
    } catch (error) {
      throw new AppError('Failed to fetch orders', 500);
    }
  };

  getOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const order = await this.lottoOrderRepository.findOne({
        where: { id, userId },
        relations: ['tickets'],
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      res.json({ order });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch order', 500);
    }
  };

  cancelOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const order = await this.lottoOrderRepository.findOne({
        where: { id, userId },
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Can only cancel if not paid or not purchased in USA
      if (order.status !== LottoOrderStatus.PAYMENT_PENDING && 
          order.status !== LottoOrderStatus.PAYMENT_FAILED) {
        throw new AppError('Cannot cancel this order', 400);
      }

      order.status = LottoOrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancellationReason = 'Cancelled by user';

      await this.lottoOrderRepository.save(order);

      res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel order', 500);
    }
  };

  getUserTickets = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      const tickets = await this.lottoTicketRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.order', 'order')
        .where('order.userId = :userId', { userId })
        .orderBy('ticket.createdAt', 'DESC')
        .getMany();

      res.json({ tickets });
    } catch (error) {
      throw new AppError('Failed to fetch tickets', 500);
    }
  };

  getTicket = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const ticket = await this.lottoTicketRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.order', 'order')
        .where('ticket.id = :id', { id })
        .andWhere('order.userId = :userId', { userId })
        .getOne();

      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      res.json({ ticket });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch ticket', 500);
    }
  };

  getDrawHistory = async (req: AuthRequest, res: Response) => {
    try {
      const { gameType, limit = 10 } = req.query;

      const query = this.drawResultRepository
        .createQueryBuilder('draw')
        .orderBy('draw.drawDate', 'DESC')
        .take(Number(limit));

      if (gameType) {
        query.where('draw.gameType = :gameType', { gameType });
      }

      const draws = await query.getMany();

      res.json({ draws });
    } catch (error) {
      throw new AppError('Failed to fetch draw history', 500);
    }
  };

  getDrawResult = async (req: AuthRequest, res: Response) => {
    try {
      const { gameType, date } = req.params;

      const draw = await this.drawResultRepository.findOne({
        where: {
          gameType: gameType as GameType,
          drawDate: new Date(date),
        },
      });

      if (!draw) {
        throw new AppError('Draw result not found', 404);
      }

      res.json({ draw });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch draw result', 500);
    }
  };

  private validateTicket(ticket: any) {
    const { gameType, numbers, special } = ticket;

    if (!gameType || !numbers || !special) {
      throw new AppError('Invalid ticket data', 400);
    }

    if (numbers.length !== 5) {
      throw new AppError('Must select 5 numbers', 400);
    }

    const maxMain = gameType === 'Powerball' ? 69 : 70;
    const maxSpecial = gameType === 'Powerball' ? 26 : 25;

    // Check main numbers
    for (const num of numbers) {
      if (num < 1 || num > maxMain) {
        throw new AppError(`Main numbers must be between 1 and ${maxMain}`, 400);
      }
    }

    // Check special number
    if (special < 1 || special > maxSpecial) {
      throw new AppError(`Special number must be between 1 and ${maxSpecial}`, 400);
    }

    // Check for duplicates
    if (new Set(numbers).size !== numbers.length) {
      throw new AppError('Cannot select duplicate numbers', 400);
    }
  }

  private getNextDrawDate(gameType: string): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Powerball: Monday, Wednesday, Saturday
    // Mega Millions: Tuesday, Friday
    
    let daysToAdd = 1;
    if (gameType === 'Powerball') {
      if (dayOfWeek === 0) daysToAdd = 1; // Sunday -> Monday
      else if (dayOfWeek === 1) daysToAdd = 2; // Monday -> Wednesday
      else if (dayOfWeek === 2) daysToAdd = 1; // Tuesday -> Wednesday
      else if (dayOfWeek === 3) daysToAdd = 3; // Wednesday -> Saturday
      else if (dayOfWeek === 4) daysToAdd = 2; // Thursday -> Saturday
      else if (dayOfWeek === 5) daysToAdd = 1; // Friday -> Saturday
      else if (dayOfWeek === 6) daysToAdd = 2; // Saturday -> Monday
    } else {
      if (dayOfWeek === 0) daysToAdd = 2; // Sunday -> Tuesday
      else if (dayOfWeek === 1) daysToAdd = 1; // Monday -> Tuesday
      else if (dayOfWeek === 2) daysToAdd = 3; // Tuesday -> Friday
      else if (dayOfWeek === 3) daysToAdd = 2; // Wednesday -> Friday
      else if (dayOfWeek === 4) daysToAdd = 1; // Thursday -> Friday
      else if (dayOfWeek === 5) daysToAdd = 4; // Friday -> Tuesday
      else if (dayOfWeek === 6) daysToAdd = 3; // Saturday -> Tuesday
    }

    const nextDraw = new Date(now);
    nextDraw.setDate(nextDraw.getDate() + daysToAdd);
    return nextDraw;
  }
}
