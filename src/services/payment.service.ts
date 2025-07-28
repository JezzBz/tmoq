import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { Payment } from '../entity/payment/payment';
import { Deal } from '../entity/deal/deal';
import { PaymentStatus } from '../enums/payment';
import { PaymentType } from '../enums/payment';

export class PaymentService extends BaseService<Payment> {
  private dealRepository: Repository<Deal>;

  constructor(
    paymentRepository: Repository<Payment>,
    dealRepository: Repository<Deal>
  ) {
    super(paymentRepository);
    this.dealRepository = dealRepository;
  }

  async findById(id: number): Promise<Payment | null> {
    return await this.repository.findOne({
      where: { paymentId: id },
      relations: ['deal']
    });
  }

  async createPayment(data: Partial<Payment>): Promise<Payment> {
    // Валидация данных
    this.validatePaymentData(data);
    
    // Проверяем существование сделки
    if (data.dealId) {
      const deal = await this.dealRepository.findOne({
        where: { dealId: data.dealId }
      });
      if (!deal) {
        throw new Error('Deal not found');
      }
    }

    const payment = this.repository.create({
      ...data,
      status: PaymentStatus.PENDING
    });
    return await this.repository.save(payment);
  }

  async updatePayment(id: number, data: Partial<Payment>): Promise<Payment | null> {
    // Валидация данных
    this.validatePaymentData(data);
    
    await this.repository.update({ paymentId: id }, data);
    return await this.findById(id);
  }

  async deletePayment(id: number): Promise<boolean> {
    const payment = await this.findById(id);
    if (!payment) {
      return false;
    }

    // Проверяем, можно ли удалить платеж
    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.FAILED) {
      throw new Error('Only pending or failed payments can be deleted');
    }

    const result = await this.repository.delete({ paymentId: id });
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы со статусами платежей
  async processPayment(id: number): Promise<Payment | null> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending payments can be processed');
    }

    // Имитация обработки платежа
    try {
      // Здесь должна быть логика обработки платежа
      await this.repository.update({ paymentId: id }, { 
        status: PaymentStatus.COMPLETED,
        processedAt: new Date()
      });
      return await this.findById(id);
    } catch (error) {
      await this.repository.update({ paymentId: id }, { 
        status: PaymentStatus.FAILED,
        processedAt: new Date()
      });
      throw error;
    }
  }

  async retryPayment(id: number): Promise<Payment | null> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.FAILED) {
      throw new Error('Only failed payments can be retried');
    }

    await this.repository.update({ paymentId: id }, { 
      status: PaymentStatus.PENDING,
      processedAt: undefined
    });
    return await this.findById(id);
  }

  async cancelPayment(id: number): Promise<Payment | null> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new Error('Completed payments cannot be cancelled');
    }

    await this.repository.update({ paymentId: id }, { 
      status: PaymentStatus.CANCELLED,
      processedAt: new Date()
    });
    return await this.findById(id);
  }

  // Методы для работы с платежами в рамках сделки
  async getPaymentsByDeal(dealId: number): Promise<Payment[]> {
    return await this.repository.find({
      where: { deal: { dealId } },
      relations: ['deal']
    });
  }

  async getPaymentsByDealAndStatus(dealId: number, status: PaymentStatus): Promise<Payment[]> {
    return await this.repository.find({
      where: { 
        deal: { dealId },
        status 
      },
      relations: ['deal']
    });
  }

  // Методы для идентификации пополнений
  async identifyDeposit(amount: number, currency: string, description?: string): Promise<Payment | null> {
    // Ищем подходящий платеж по сумме, валюте и описанию
    const payment = await this.repository.findOne({
      where: {
        amount,
        currency,
        status: PaymentStatus.PENDING
      },
      relations: ['deal']
    });

    if (payment && description) {
      // Обновляем описание платежа
      await this.repository.update({ paymentId: payment.paymentId }, { description });
    }

    return payment;
  }

  // Методы для выполнения платежей в пользу бенефициара
  async executePaymentToBeneficiary(
    dealId: number,
    beneficiaryId: number,
    amount: number,
    currency: string,
    description?: string
  ): Promise<Payment> {
    const deal = await this.dealRepository.findOne({
      where: { dealId },
      relations: ['beneficiary']
    });

    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.beneficiary.beneficiaryId !== beneficiaryId) {
      throw new Error('Beneficiary does not match the deal');
    }

    const payment = this.repository.create({
      dealId,
      beneficiaryId,
      amount,
      currency,
      description,
      status: PaymentStatus.PENDING,
      type: PaymentType.BENEFICIARY_PAYMENT
    });

    return await this.repository.save(payment);
  }

  // Поиск и фильтрация
  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return await this.repository.find({
      where: { status },
      relations: ['deal']
    });
  }

  async findByAmountRange(minAmount: number, maxAmount: number): Promise<Payment[]> {
    return await this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.deal', 'deal')
      .where('payment.amount >= :minAmount', { minAmount })
      .andWhere('payment.amount <= :maxAmount', { maxAmount })
      .getMany();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return await this.repository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.deal', 'deal')
      .where('payment.createdAt >= :startDate', { startDate })
      .andWhere('payment.createdAt <= :endDate', { endDate })
      .getMany();
  }

  async findByCurrency(currency: string): Promise<Payment[]> {
    return await this.repository.find({
      where: { currency },
      relations: ['deal']
    });
  }

  // Статистика
  async getPaymentStatistics(dealId?: number): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    cancelled: number;
    totalAmount: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('payment');
    
    if (dealId) {
      queryBuilder.where('payment.dealId = :dealId', { dealId });
    }

    const payments = await queryBuilder.getMany();
    
    const statistics = {
      total: payments.length,
      pending: payments.filter(p => p.status === PaymentStatus.PENDING).length,
      completed: payments.filter(p => p.status === PaymentStatus.COMPLETED).length,
      failed: payments.filter(p => p.status === PaymentStatus.FAILED).length,
      cancelled: payments.filter(p => p.status === PaymentStatus.CANCELLED).length,
      totalAmount: payments
        .filter(p => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + Number(p.amount), 0)
    };

    return statistics;
  }

  // Валидация данных
  private validatePaymentData(data: Partial<Payment>): void {
    if (data.amount && data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (data.currency && data.currency.length !== 3) {
      throw new Error('Currency code must be 3 characters long');
    }

    if (data.dealId && data.dealId <= 0) {
      throw new Error('Invalid deal ID');
    }
  }
} 