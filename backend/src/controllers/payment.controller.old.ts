import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AppDataSource } from '../config/database';
import { Payment, PaymentStatus } from '../entities/Payment';
import { LottoOrder, LottoOrderStatus } from '../entities/LottoOrder';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class PaymentController {
  private paymentRepository = AppDataSource.getRepository(Payment);
  private lottoOrderRepository = AppDataSource.getRepository(LottoOrder);

  createPaymentIntent = async (req: AuthRequest, res: Response) => {
    try {
      const { orderId, orderType, paymentMethod } = req.body;
      const userId = req.userId!;

      // Fetch order
      let order;
      if (orderType === 'lotto') {
        order = await this.lottoOrderRepository.findOne({
          where: { id: orderId, userId },
        });
      }

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalAmountThb * 100), // Convert to smallest currency unit
        currency: 'thb',
        metadata: {
          orderId: order.id,
          orderType,
          userId,
        },
      });

      // Create payment record
      const payment = this.paymentRepository.create({
        orderType,
        orderId: order.id,
        userId,
        paymentMethod,
        paymentProvider: 'stripe',
        paymentReference: paymentIntent.id,
        amountUsd: order.totalAmountUsd,
        amountThb: order.totalAmountThb,
        exchangeRate: order.exchangeRate,
        feeUsd: 0,
        feeThb: 0,
        netAmountUsd: order.totalAmountUsd,
        netAmountThb: order.totalAmountThb,
        status: PaymentStatus.PENDING,
      });

      await this.paymentRepository.save(payment);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create payment intent', 500);
    }
  };

  confirmPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { paymentId, paymentIntentId } = req.body;
      const userId = req.userId!;

      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId, userId },
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Verify with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = new Date();
        payment.providerTransactionId = paymentIntent.id;
        payment.providerResponse = paymentIntent;

        await this.paymentRepository.save(payment);

        // Update order
        if (payment.orderType === 'lotto') {
          const order = await this.lottoOrderRepository.findOne({
            where: { id: payment.orderId },
          });
          if (order) {
            order.status = LottoOrderStatus.CONFIRMED;
            order.paymentStatus = 'completed';
            order.paymentReference = payment.paymentReference;
            order.paidAt = new Date();
            await this.lottoOrderRepository.save(order);
          }
        }

        res.json({
          message: 'Payment confirmed successfully',
          payment,
        });
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.failedAt = new Date();
        payment.failureReason = `Payment intent status: ${paymentIntent.status}`;
        await this.paymentRepository.save(payment);

        throw new AppError('Payment not completed', 400);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to confirm payment', 500);
    }
  };

  generatePromptPayQR = async (_req: AuthRequest, res: Response) => {
    try {
      // TODO: Implement PromptPay QR generation with Omise
      // This requires Omise integration
      res.json({
        message: 'PromptPay QR generation not implemented yet',
      });
    } catch (error) {
      throw new AppError('Failed to generate PromptPay QR', 500);
    }
  };

  getPaymentStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const payment = await this.paymentRepository.findOne({
        where: { id, userId },
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      res.json({ payment });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch payment status', 500);
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          webhookSecret
        );
      } catch (err: any) {
        throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          await this.handlePaymentSuccess(paymentIntent);
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          await this.handlePaymentFailure(failedPayment);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Webhook handling failed', 500);
    }
  };

  private async handlePaymentSuccess(paymentIntent: any) {
    const payment = await this.paymentRepository.findOne({
      where: { paymentReference: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();
      await this.paymentRepository.save(payment);

      // Update order
      if (payment.orderType === 'lotto') {
        const order = await this.lottoOrderRepository.findOne({
          where: { id: payment.orderId },
        });
        if (order) {
          order.status = LottoOrderStatus.CONFIRMED;
          order.paymentStatus = 'completed';
          order.paidAt = new Date();
          await this.lottoOrderRepository.save(order);
        }
      }

      // TODO: Send confirmation email
    }
  }

  private async handlePaymentFailure(paymentIntent: any) {
    const payment = await this.paymentRepository.findOne({
      where: { paymentReference: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await this.paymentRepository.save(payment);

      // Update order
      if (payment.orderType === 'lotto') {
        const order = await this.lottoOrderRepository.findOne({
          where: { id: payment.orderId },
        });
        if (order) {
          order.status = LottoOrderStatus.PAYMENT_FAILED;
          await this.lottoOrderRepository.save(order);
        }
      }
    }
  }
}
