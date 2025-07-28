import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { Transfer } from '../entity/transfer/transfer';
import { Beneficiary } from '../entity/beneficiary/beneficiary';
import { BalanceService } from './balance.service';
import { PaymentStatus } from '../enums/payment';

export class TransferService extends BaseService<Transfer> {
  private beneficiaryRepository: Repository<Beneficiary>;
  private balanceService: BalanceService;

  constructor(
    transferRepository: Repository<Transfer>,
    beneficiaryRepository: Repository<Beneficiary>,
    balanceService: BalanceService
  ) {
    super(transferRepository);
    this.beneficiaryRepository = beneficiaryRepository;
    this.balanceService = balanceService;
  }

  async findById(id: number): Promise<Transfer | null> {
    return await this.repository.findOne({
      where: { transferId: id },
      relations: ['fromBeneficiary', 'toBeneficiary']
    });
  }

  async createTransfer(data: Partial<Transfer>): Promise<Transfer> {
    // Валидация данных
    this.validateTransferData(data);
    
    // Проверяем существование бенефициаров
    if (data.fromBeneficiaryId) {
      const fromBeneficiary = await this.beneficiaryRepository.findOne({
        where: { beneficiaryId: data.fromBeneficiaryId }
      });
      if (!fromBeneficiary) {
        throw new Error('From beneficiary not found');
      }
    }

    if (data.toBeneficiaryId) {
      const toBeneficiary = await this.beneficiaryRepository.findOne({
        where: { beneficiaryId: data.toBeneficiaryId }
      });
      if (!toBeneficiary) {
        throw new Error('To beneficiary not found');
      }
    }

    // Проверяем, что отправитель и получатель разные
    if (data.fromBeneficiaryId === data.toBeneficiaryId) {
      throw new Error('From and to beneficiaries cannot be the same');
    }

    const transfer = this.repository.create({
      ...data,
      status: PaymentStatus.PENDING
    });
    return await this.repository.save(transfer);
  }

  async updateTransfer(id: number, data: Partial<Transfer>): Promise<Transfer | null> {
    // Валидация данных
    this.validateTransferData(data);
    
    await this.repository.update({ transferId: id }, data);
    return await this.findById(id);
  }

  async deleteTransfer(id: number): Promise<boolean> {
    const transfer = await this.findById(id);
    if (!transfer) {
      return false;
    }

    // Проверяем, можно ли удалить перевод
    if (transfer.status !== PaymentStatus.PENDING && transfer.status !== PaymentStatus.FAILED) {
      throw new Error('Only pending or failed transfers can be deleted');
    }

    const result = await this.repository.delete({ transferId: id });
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для выполнения переводов
  async executeTransfer(id: number): Promise<Transfer | null> {
    const transfer = await this.findById(id);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending transfers can be executed');
    }

    try {
      // Проверяем баланс отправителя
      if (!transfer.fromBeneficiaryId) {
        throw new Error('From beneficiary ID is required');
      }
      const fromBalance = await this.balanceService.getBalanceByBeneficiary(transfer.fromBeneficiaryId);
      if (!fromBalance || Number(fromBalance.amount) < transfer.amount) {
        throw new Error('Insufficient funds in sender account');
      }

      // Списываем средства с отправителя
      await this.balanceService.withdrawFunds(
        transfer.fromBeneficiaryId,
        transfer.amount,
        transfer.currency,
        `Transfer to beneficiary ${transfer.toBeneficiaryId}: ${transfer.description || 'Transfer'}`
      );

      // Зачисляем средства получателю
      if (!transfer.toBeneficiaryId) {
        throw new Error('To beneficiary ID is required');
      }
      await this.balanceService.addFunds(
        transfer.toBeneficiaryId,
        transfer.amount,
        transfer.currency,
        `Transfer from beneficiary ${transfer.fromBeneficiaryId}: ${transfer.description || 'Transfer'}`
      );

      // Обновляем статус перевода
      await this.repository.update({ transferId: id }, { 
        status: PaymentStatus.COMPLETED,
        executedAt: new Date()
      });

      return await this.findById(id);
    } catch (error) {
      // В случае ошибки помечаем перевод как неуспешный
      await this.repository.update({ transferId: id }, { 
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async retryTransfer(id: number): Promise<Transfer | null> {
    const transfer = await this.findById(id);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== PaymentStatus.FAILED) {
      throw new Error('Only failed transfers can be retried');
    }

    await this.repository.update({ transferId: id }, { 
      status: PaymentStatus.PENDING,
      failedAt: undefined,
      failureReason: undefined
    });

    return await this.findById(id);
  }

  async cancelTransfer(id: number): Promise<Transfer | null> {
    const transfer = await this.findById(id);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status === PaymentStatus.COMPLETED) {
      throw new Error('Completed transfers cannot be cancelled');
    }

    await this.repository.update({ transferId: id }, { 
      status: PaymentStatus.CANCELLED,
      cancelledAt: new Date()
    });

    return await this.findById(id);
  }

  // Методы для получения переводов по бенефициару
  async getTransfersByBeneficiary(beneficiaryId: number): Promise<Transfer[]> {
    return await this.repository.find({
      where: [
        { fromBeneficiaryId: beneficiaryId },
        { toBeneficiaryId: beneficiaryId }
      ]
    });
  }

  async getOutgoingTransfers(beneficiaryId: number): Promise<Transfer[]> {
    return await this.repository.find({
      where: { fromBeneficiaryId: beneficiaryId }
    });
  }

  async getIncomingTransfers(beneficiaryId: number): Promise<Transfer[]> {
    return await this.repository.find({
      where: { toBeneficiaryId: beneficiaryId }
    });
  }

  // Методы для получения переводов по статусу
  async getTransfersByStatus(status: PaymentStatus): Promise<Transfer[]> {
    return await this.repository.find({
      where: { status }
    });
  }

  // Методы для получения переводов по дате
  async getTransfersByDateRange(startDate: Date, endDate: Date): Promise<Transfer[]> {
    return await this.repository
      .createQueryBuilder('transfer')
      .where('transfer.createdAt >= :startDate', { startDate })
      .andWhere('transfer.createdAt <= :endDate', { endDate })
      .getMany();
  }

  // Методы для получения переводов по сумме
  async getTransfersByAmountRange(minAmount: number, maxAmount: number): Promise<Transfer[]> {
    return await this.repository
      .createQueryBuilder('transfer')
      .where('transfer.amount >= :minAmount', { minAmount })
      .andWhere('transfer.amount <= :maxAmount', { maxAmount })
      .getMany();
  }

  // Методы для получения переводов по валюте
  async getTransfersByCurrency(currency: string): Promise<Transfer[]> {
    return await this.repository.find({
      where: { currency }
    });
  }

  // Методы для получения информации о переводе
  async getTransferInfo(transferId: number): Promise<{
    transfer: Transfer | null;
    fromBalance: any;
    toBalance: any;
  }> {
    const transfer = await this.findById(transferId);
    if (!transfer) {
      return {
        transfer: null,
        fromBalance: null,
        toBalance: null
      };
    }

    const fromBalance = transfer.fromBeneficiaryId 
      ? await this.balanceService.getBalanceByBeneficiary(transfer.fromBeneficiaryId)
      : null;
    const toBalance = transfer.toBeneficiaryId 
      ? await this.balanceService.getBalanceByBeneficiary(transfer.toBeneficiaryId)
      : null;

    return {
      transfer,
      fromBalance,
      toBalance
    };
  }

  // Статистика по переводам
  async getTransferStatistics(beneficiaryId?: number): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    cancelled: number;
    totalAmount: number;
    averageAmount: number;
    currencies: string[];
  }> {
    const queryBuilder = this.repository.createQueryBuilder('transfer');
    
    if (beneficiaryId) {
      queryBuilder.where('transfer.fromBeneficiaryId = :beneficiaryId OR transfer.toBeneficiaryId = :beneficiaryId', { beneficiaryId });
    }

    const transfers = await queryBuilder.getMany();
    
    const completedTransfers = transfers.filter(t => t.status === PaymentStatus.COMPLETED);
    const totalAmount = completedTransfers.reduce((sum, transfer) => sum + Number(transfer.amount), 0);
    const averageAmount = completedTransfers.length > 0 ? totalAmount / completedTransfers.length : 0;
    const currencies = [...new Set(transfers.map(transfer => transfer.currency))];

    return {
      total: transfers.length,
      pending: transfers.filter(t => t.status === PaymentStatus.PENDING).length,
      completed: completedTransfers.length,
      failed: transfers.filter(t => t.status === PaymentStatus.FAILED).length,
      cancelled: transfers.filter(t => t.status === PaymentStatus.CANCELLED).length,
      totalAmount,
      averageAmount,
      currencies
    };
  }

  // Методы для проверки возможности перевода
  async checkTransferPossibility(
    fromBeneficiaryId: number,
    toBeneficiaryId: number,
    amount: number,
    currency: string
  ): Promise<{
    canTransfer: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Проверяем существование бенефициаров
    const fromBeneficiary = await this.beneficiaryRepository.findOne({
      where: { beneficiaryId: fromBeneficiaryId }
    });
    if (!fromBeneficiary) {
      reasons.push('From beneficiary not found');
    }

    const toBeneficiary = await this.beneficiaryRepository.findOne({
      where: { beneficiaryId: toBeneficiaryId }
    });
    if (!toBeneficiary) {
      reasons.push('To beneficiary not found');
    }

    // Проверяем, что отправитель и получатель разные
    if (fromBeneficiaryId === toBeneficiaryId) {
      reasons.push('From and to beneficiaries cannot be the same');
    }

    // Проверяем баланс отправителя
    if (fromBeneficiary) {
      const balance = await this.balanceService.getBalanceByBeneficiary(fromBeneficiaryId);
      if (!balance) {
        reasons.push('Sender has no balance');
      } else if (Number(balance.amount) < amount) {
        reasons.push('Insufficient funds in sender account');
      }
    }

    // Проверяем сумму перевода
    if (amount <= 0) {
      reasons.push('Transfer amount must be greater than zero');
    }

    // Проверяем валюту
    if (currency && currency.length !== 3) {
      reasons.push('Invalid currency code');
    }

    return {
      canTransfer: reasons.length === 0,
      reasons
    };
  }

  // Валидация данных
  private validateTransferData(data: Partial<Transfer>): void {
    if (data.amount && data.amount <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }

    if (data.currency && data.currency.length !== 3) {
      throw new Error('Currency code must be 3 characters long');
    }

    if (data.fromBeneficiaryId && data.fromBeneficiaryId <= 0) {
      throw new Error('Invalid from beneficiary ID');
    }

    if (data.toBeneficiaryId && data.toBeneficiaryId <= 0) {
      throw new Error('Invalid to beneficiary ID');
    }

    if (data.fromBeneficiaryId === data.toBeneficiaryId) {
      throw new Error('From and to beneficiaries cannot be the same');
    }
  }
} 