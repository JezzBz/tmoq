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

  async findById(id: string): Promise<Transfer | null> {
    return await this.repository.findOne({
      where: { transferId: id },
      relations: ['fromBeneficiary', 'toBeneficiary']
    });
  }

  async findTransfers(options: {
    accountNumber: string;
    dealId?: string;
    fromBeneficiaryId: string;
    toBeneficiaryId?: string;
    offset: number;
    limit: number;
  }): Promise<[any[], number]> {
    // В реальном приложении здесь была бы логика получения переводов
    // Пока возвращаем заглушку
    const mockTransfers = [
      {
        type: "DIRECT",
        transferId: this.generateUUID(),
        accountNumber: options.accountNumber,
        from: { beneficiaryId: options.fromBeneficiaryId },
        to: { beneficiaryId: options.toBeneficiaryId || "49e46893-9a7e-409b-8c79-647aecaae555" },
        purpose: "Назначение платежа",
        amount: 322
      },
      {
        type: "TO_DEAL",
        transferId: this.generateUUID(),
        accountNumber: options.accountNumber,
        from: { beneficiaryId: options.fromBeneficiaryId },
        to: { 
          dealId: options.dealId || "dd6c3237-9958-47d9-9ba0-f6faeaa0e788",
          stepId: "c87d3297-f4ae-4f88-add9-6722c1fc0b8c"
        },
        amount: 322
      },
      {
        type: "FROM_DEAL",
        transferId: this.generateUUID(),
        accountNumber: options.accountNumber,
        from: { 
          dealId: options.dealId || "dd6c3237-9958-47d9-9ba0-f6faeaa0e788",
          stepId: "c87d3297-f4ae-4f88-add9-6722c1fc0b8c"
        },
        to: { beneficiaryId: options.toBeneficiaryId || "49e46893-9a7e-409b-8c79-647aecaae555" },
        purpose: "Назначение платежа",
        amount: 322
      }
    ];

    return [mockTransfers, 3];
  }

  async createTransfer(data: any, idempotencyKey: string): Promise<any> {
    // Проверяем идемпотентность
    const existingTransfer = await this.repository.findOne({
      where: { 
        accountNumber: data.accountNumber,
        fromBeneficiaryId: data.from.beneficiaryId,
        toBeneficiaryId: data.to.beneficiaryId,
        amount: data.amount,
      
      }
    });

    if (existingTransfer) {
      return existingTransfer;
    }

    // Валидация данных
    this.validateTransferData(data);

    const transfer = this.repository.create({
      ...data,
      fromBeneficiaryId: data.from.beneficiaryId,
      toBeneficiaryId: data.to.beneficiaryId,
      status: PaymentStatus.PENDING
    });

    const savedTransfer = await this.repository.save(transfer);
    return Array.isArray(savedTransfer) ? savedTransfer[0] : savedTransfer;
  }

  async updateTransfer(id: string, data: Partial<Transfer>): Promise<Transfer | null> {
    // Валидация данных
    this.validateTransferData(data);
    
    await this.repository.update({ transferId: id }, data);
    return await this.findById(id);
  }

  async deleteTransfer(id: string): Promise<boolean> {
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
  async executeTransfer(id: string): Promise<Transfer | null> {
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

  async retryTransfer(id: string): Promise<Transfer | null> {
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

  async cancelTransfer(id: string): Promise<Transfer | null> {
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
  async getTransfersByBeneficiary(beneficiaryId: string): Promise<Transfer[]> {
    return await this.repository.find({
      where: [
        { fromBeneficiaryId: beneficiaryId },
        { toBeneficiaryId: beneficiaryId }
      ]
    });
  }

  async getOutgoingTransfers(beneficiaryId: string): Promise<Transfer[]> {
    return await this.repository.find({
      where: { fromBeneficiaryId: beneficiaryId }
    });
  }

  async getIncomingTransfers(beneficiaryId: string): Promise<Transfer[]> {
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
  async getTransferInfo(transferId: string): Promise<{
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
  async getTransferStatistics(beneficiaryId?: string): Promise<{
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
    fromBeneficiaryId: string,
    toBeneficiaryId: string,
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

    if (data.fromBeneficiaryId && data.fromBeneficiaryId.length === 0) {
      throw new Error('Invalid from beneficiary ID');
    }

    if (data.toBeneficiaryId && data.toBeneficiaryId.length === 0) {
      throw new Error('Invalid to beneficiary ID');
    }

    if (data.fromBeneficiaryId === data.toBeneficiaryId) {
      throw new Error('From and to beneficiaries cannot be the same');
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
} 