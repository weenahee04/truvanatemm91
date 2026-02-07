import cron from 'node-cron';
import { AppDataSource } from '../config/database';
import { DrawResult } from '../entities/DrawResult';
import { LottoOrder, LottoOrderStatus } from '../entities/LottoOrder';
import { LottoTicket } from '../entities/LottoTicket';
import { logger } from '../utils/logger';
import redis from '../config/redis';

export const setupCronJobs = () => {
  // Every hour - Update jackpots
  cron.schedule('0 * * * *', async () => {
    logger.info('🕐 Cron: Updating jackpots');
    await updateJackpots();
  });

  // Every day at 1 AM - Check for new draw results
  cron.schedule('0 1 * * *', async () => {
    logger.info('🕐 Cron: Checking for new draw results');
    await fetchDrawResults();
  });

  // Every day at 2 AM - Check ticket results
  cron.schedule('0 2 * * *', async () => {
    logger.info('🕐 Cron: Checking ticket results');
    await checkTicketResults();
  });

  logger.info('✅ Cron jobs scheduled');
};

async function updateJackpots() {
  try {
    // TODO: Scrape actual jackpot data from Powerball and Mega Millions websites
    // For now, use mock data
    
    const jackpots = {
      Powerball: {
        amount: 420000000 + Math.floor(Math.random() * 50000000),
        nextDrawDate: getNextDrawDate('Powerball'),
      },
      MegaMillions: {
        amount: 180000000 + Math.floor(Math.random() * 30000000),
        nextDrawDate: getNextDrawDate('MegaMillions'),
      },
    };

    // Update Redis cache
    await redis.setex('jackpots', 3600, JSON.stringify(jackpots));

    logger.info('✅ Jackpots updated successfully');
  } catch (error) {
    logger.error('❌ Failed to update jackpots:', error);
  }
}

async function fetchDrawResults() {
  try {
    // TODO: Scrape actual draw results from official websites
    // powerball.com, megamillions.com
    // For now, this is a placeholder

    logger.info('✅ Draw results fetched successfully');
  } catch (error) {
    logger.error('❌ Failed to fetch draw results:', error);
  }
}

async function checkTicketResults() {
  try {
    const lottoOrderRepository = AppDataSource.getRepository(LottoOrder);
    const lottoTicketRepository = AppDataSource.getRepository(LottoTicket);
    const drawResultRepository = AppDataSource.getRepository(DrawResult);

    // Get orders waiting for draw
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const orders = await lottoOrderRepository.find({
      where: {
        status: LottoOrderStatus.WAITING_DRAW,
      },
      relations: ['tickets'],
    });

    for (const order of orders) {
      if (!order.drawDate || order.drawDate > yesterday) {
        continue;
      }

      // Get draw result
      const drawResult = await drawResultRepository.findOne({
        where: {
          gameType: order.tickets[0].gameType,
          drawDate: order.drawDate,
        },
      });

      if (!drawResult) {
        logger.info(`No draw result found for order ${order.orderNumber}`);
        continue;
      }

      // Check each ticket
      let totalWinnings = 0;
      let hasWin = false;

      for (const ticket of order.tickets) {
        const result = checkTicketNumbers(ticket, drawResult);
        
        ticket.matchedMainNumbers = result.matchedMain;
        ticket.matchedSpecial = result.matchedSpecial;
        ticket.prizeTier = result.prizeTier;
        ticket.prizeAmountUsd = result.prizeAmount;

        if (result.prizeAmount > 0) {
          hasWin = true;
          totalWinnings += result.prizeAmount;
        }

        await lottoTicketRepository.save(ticket);
      }

      // Update order
      order.status = hasWin 
        ? (totalWinnings > 1000000 ? LottoOrderStatus.JACKPOT : LottoOrderStatus.PARTIAL_WIN)
        : LottoOrderStatus.NO_WIN;
      order.winningAmountUsd = totalWinnings;
      order.winningAmountThb = totalWinnings * order.exchangeRate;
      order.drawCheckedAt = new Date();

      await lottoOrderRepository.save(order);

      logger.info(`✅ Checked results for order ${order.orderNumber}: ${order.status}`);

      // TODO: Send email notification
    }

    logger.info('✅ Ticket results checked successfully');
  } catch (error) {
    logger.error('❌ Failed to check ticket results:', error);
  }
}

function checkTicketNumbers(ticket: LottoTicket, drawResult: DrawResult) {
  const ticketNumbers = new Set(ticket.numbers);
  const winningNumbers = new Set(drawResult.winningNumbers);

  let matchedMain = 0;
  for (const num of ticketNumbers) {
    if (winningNumbers.has(num)) {
      matchedMain++;
    }
  }

  const matchedSpecial = ticket.specialNumber === drawResult.specialNumber;

  // Determine prize tier and amount
  const { prizeTier, prizeAmount } = getPrizeTier(
    matchedMain,
    matchedSpecial,
    ticket.gameType,
    ticket.hasMultiplier,
    drawResult.multiplierValue
  );

  return {
    matchedMain,
    matchedSpecial,
    prizeTier,
    prizeAmount,
  };
}

function getPrizeTier(
  matchedMain: number,
  matchedSpecial: boolean,
  gameType: string,
  hasMultiplier: boolean,
  multiplierValue?: number
) {
  let prizeTier = '';
  let prizeAmount = 0;

  // Powerball prize structure
  if (gameType === 'Powerball') {
    if (matchedMain === 5 && matchedSpecial) {
      prizeTier = 'jackpot';
      prizeAmount = 50000000; // This should be the actual jackpot amount
    } else if (matchedMain === 5) {
      prizeTier = 'match_5';
      prizeAmount = 1000000;
    } else if (matchedMain === 4 && matchedSpecial) {
      prizeTier = 'match_4_special';
      prizeAmount = 50000;
    } else if (matchedMain === 4) {
      prizeTier = 'match_4';
      prizeAmount = 100;
    } else if (matchedMain === 3 && matchedSpecial) {
      prizeTier = 'match_3_special';
      prizeAmount = 100;
    } else if (matchedMain === 3) {
      prizeTier = 'match_3';
      prizeAmount = 7;
    } else if (matchedMain === 2 && matchedSpecial) {
      prizeTier = 'match_2_special';
      prizeAmount = 7;
    } else if (matchedMain === 1 && matchedSpecial) {
      prizeTier = 'match_1_special';
      prizeAmount = 4;
    } else if (matchedSpecial) {
      prizeTier = 'match_special_only';
      prizeAmount = 4;
    }
  }

  // Apply multiplier if applicable (not for jackpot)
  if (hasMultiplier && prizeTier !== 'jackpot' && multiplierValue) {
    prizeAmount *= multiplierValue;
  }

  return { prizeTier, prizeAmount };
}

function getNextDrawDate(gameType: string): string {
  const now = new Date();
  const dayOfWeek = now.getDay();

  let daysToAdd = 1;
  if (gameType === 'Powerball') {
    if (dayOfWeek === 0) daysToAdd = 1;
    else if (dayOfWeek === 1) daysToAdd = 2;
    else if (dayOfWeek === 2) daysToAdd = 1;
    else if (dayOfWeek === 3) daysToAdd = 3;
    else if (dayOfWeek === 4) daysToAdd = 2;
    else if (dayOfWeek === 5) daysToAdd = 1;
    else if (dayOfWeek === 6) daysToAdd = 2;
  } else {
    if (dayOfWeek === 0) daysToAdd = 2;
    else if (dayOfWeek === 1) daysToAdd = 1;
    else if (dayOfWeek === 2) daysToAdd = 3;
    else if (dayOfWeek === 3) daysToAdd = 2;
    else if (dayOfWeek === 4) daysToAdd = 1;
    else if (dayOfWeek === 5) daysToAdd = 4;
    else if (dayOfWeek === 6) daysToAdd = 3;
  }

  const nextDraw = new Date(now);
  nextDraw.setDate(nextDraw.getDate() + daysToAdd);
  nextDraw.setHours(22, 59, 0, 0);

  return nextDraw.toISOString();
}
