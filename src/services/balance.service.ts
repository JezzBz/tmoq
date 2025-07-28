import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { Balance } from '../entity/balance/balance';
import { Hold } from '../entity/balance/hold';
import { Beneficiary } from '../entity/beneficiary/beneficiary';

export class BalanceService extends BaseService<Balance> {
  private holdRepository: Repository<Hold>;
  private beneficiaryRepository: Repository<Beneficiary>;

  constructor(
    balanceRepository: Repository<Balance>,
    holdRepository: Repository<Hold>,
    beneficiaryRepository: Repository<Beneficiary>
  ) {
    super(balanceRepository);
    this.holdRepository = holdRepository;
    this.beneficiaryRepository = beneficiaryRepository;
  }

  async findById(id: number): Promise<Balance | null> {
    return await this.repository.findOne({
      where: { balanceId: id },
      relations: ['beneficiary']
    });
  }

  async createBalance(data: Partial<Balance>): Promise<Balance> {
    // Валидация данных
    this.validateBalanceData(data);
    
    // Проверяем существование бенефициара
    if (data.beneficiaryId) {
      const beneficiary = await this.beneficiaryRepository.findOne({
        where: { beneficiaryId: data.beneficiaryId }
      });
      if (!beneficiary) {
        throw new Error('Beneficiary not found');
      }
    }

    const balance = this.repository.create({
      ...data,
      amount: data.amount || 0
    });
    return await this.repository.save(balance);
  }

  async updateBalance(id: number, data: Partial<Balance>): Promise<Balance | null> {
    // Валидация данных
    this.validateBalanceData(data);
    
    await this.repository.update({ balanceId: id }, data);
    return await this.findById(id);
  }

  async deleteBalance(id: number): Promise<boolean> {
    const balance = await this.findById(id);
    if (!balance) {
      return false;
    }

    // Проверяем, можно ли удалить баланс
    if (balance.amount > 0) {
      throw new Error('Cannot delete balance with positive amount');
    }

    const result = await this.repository.delete({ balanceId: id });
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с балансами бенефициаров
  async getBalanceByBeneficiary(beneficiaryId: number): Promise<Balance | null> {
    return await this.repository.findOne({
      where: { beneficiary: { beneficiaryId } },
      relations: ['beneficiary']
    });
  }

  async getBalancesByBeneficiary(beneficiaryId: number): Promise<Balance[]> {
    return await this.repository.find({
      where: { beneficiary: { beneficiaryId } },
      relations: ['beneficiary']
    });
  }

  // Методы для пополнения и списания средств
  async addFunds(beneficiaryId: number, amount: number, currency: string, description?: string): Promise<Balance> {
    const balance = await this.getBalanceByBeneficiary(beneficiaryId);
    
    if (!balance) {
      // Создаем новый баланс
      return await this.createBalance({
        beneficiaryId,
        amount,
        currency,
        description
      });
    }

    // Обновляем существующий баланс
    const newAmount = Number(balance.amount) + amount;
    await this.repository.update({ balanceId: balance.balanceId }, { 
      amount: newAmount,
      lastUpdated: new Date()
    });

    return await this.findById(balance.balanceId) as Balance;
  }

  async withdrawFunds(beneficiaryId: number, amount: number, currency: string, description?: string): Promise<Balance> {
    const balance = await this.getBalanceByBeneficiary(beneficiaryId);
    
    if (!balance) {
      throw new Error('Balance not found for beneficiary');
    }

    if (Number(balance.amount) < amount) {
      throw new Error('Insufficient funds');
    }

    const newAmount = Number(balance.amount) - amount;
    await this.repository.update({ balanceId: balance.balanceId }, { 
      amount: newAmount,
      lastUpdated: new Date()
    });

    return await this.findById(balance.balanceId) as Balance;
  }

  // Методы для работы с холдами
  async createHold(beneficiaryId: number, amount: number, currency: string, reason: string): Promise<Hold> {
    const balance = await this.getBalanceByBeneficiary(beneficiaryId);
    
    if (!balance) {
      throw new Error('Balance not found for beneficiary');
    }

    if (Number(balance.amount) < amount) {
      throw new Error('Insufficient funds for hold');
    }

    const hold = this.holdRepository.create({
      beneficiaryId,
      amount,
      currency,
      reason,
      status: 'ACTIVE',
      createdAt: new Date()
    });

    return await this.holdRepository.save(hold);
  }

  async getHoldsByBeneficiary(beneficiaryId: number): Promise<Hold[]> {
    return await this.holdRepository.find({
      where: { beneficiary: { beneficiaryId } },
      relations: ['beneficiary']
    });
  }

  async getActiveHoldsByBeneficiary(beneficiaryId: number): Promise<Hold[]> {
    return await this.holdRepository.find({
      where: { 
        beneficiary: { beneficiaryId },
        status: 'ACTIVE'
      },
      relations: ['beneficiary']
    });
  }

  async releaseHold(holdId: number): Promise<Hold | null> {
    const hold = await this.holdRepository.findOne({
      where: { holdId }
    });

    if (!hold) {
      throw new Error('Hold not found');
    }

    if (hold.status !== 'ACTIVE') {
      throw new Error('Only active holds can be released');
    }

    await this.holdRepository.update(holdId, { 
      status: 'RELEASED',
      releasedAt: new Date()
    });

    return await this.holdRepository.findOne({ where: { holdId } });
  }

  async executeHold(holdId: number): Promise<Hold | null> {
    const hold = await this.holdRepository.findOne({
      where: { holdId }
    });

    if (!hold) {
      throw new Error('Hold not found');
    }

    if (hold.status !== 'ACTIVE') {
      throw new Error('Only active holds can be executed');
    }

    // Списываем средства с баланса
    await this.withdrawFunds(hold.beneficiaryId, hold.amount, hold.currency, `Hold execution: ${hold.reason}`);

    await this.holdRepository.update(holdId, { 
      status: 'EXECUTED',
      executedAt: new Date()
    });

    return await this.holdRepository.findOne({ where: { holdId } });
  }

  // Методы для получения информации по остаткам
  async getBalanceInfo(beneficiaryId: number): Promise<{
    balance: Balance | null;
    availableAmount: number;
    heldAmount: number;
    totalHolds: number;
    activeHolds: number;
  }> {
    const balance = await this.getBalanceByBeneficiary(beneficiaryId);
    const activeHolds = await this.getActiveHoldsByBeneficiary(beneficiaryId);
    const allHolds = await this.getHoldsByBeneficiary(beneficiaryId);

    const heldAmount = activeHolds.reduce((sum, hold) => sum + Number(hold.amount), 0);
    const availableAmount = balance ? Number(balance.amount) - heldAmount : 0;

    return {
      balance,
      availableAmount,
      heldAmount,
      totalHolds: allHolds.length,
      activeHolds: activeHolds.length
    };
  }

  // Методы для получения информации по холдам
  async getHoldInfo(beneficiaryId: number): Promise<{
    totalHolds: number;
    activeHolds: number;
    releasedHolds: number;
    executedHolds: number;
    totalHeldAmount: number;
    activeHeldAmount: number;
  }> {
    const holds = await this.getHoldsByBeneficiary(beneficiaryId);
    const activeHolds = holds.filter(hold => hold.status === 'ACTIVE');
    const releasedHolds = holds.filter(hold => hold.status === 'RELEASED');
    const executedHolds = holds.filter(hold => hold.status === 'EXECUTED');

    const totalHeldAmount = holds.reduce((sum, hold) => sum + Number(hold.amount), 0);
    const activeHeldAmount = activeHolds.reduce((sum, hold) => sum + Number(hold.amount), 0);

    return {
      totalHolds: holds.length,
      activeHolds: activeHolds.length,
      releasedHolds: releasedHolds.length,
      executedHolds: executedHolds.length,
      totalHeldAmount,
      activeHeldAmount
    };
  }

  // Поиск и фильтрация
  async findByCurrency(currency: string): Promise<Balance[]> {
    return await this.repository.find({
      where: { currency },
      relations: ['beneficiary']
    });
  }

  async findByAmountRange(minAmount: number, maxAmount: number): Promise<Balance[]> {
    return await this.repository
      .createQueryBuilder('balance')
      .leftJoinAndSelect('balance.beneficiary', 'beneficiary')
      .where('balance.amount >= :minAmount', { minAmount })
      .andWhere('balance.amount <= :maxAmount', { maxAmount })
      .getMany();
  }

  async findHoldsByStatus(status: string): Promise<Hold[]> {
    return await this.holdRepository.find({
      where: { status },
      relations: ['beneficiary']
    });
  }

  async findHoldsByAmountRange(minAmount: number, maxAmount: number): Promise<Hold[]> {
    return await this.holdRepository
      .createQueryBuilder('hold')
      .leftJoinAndSelect('hold.beneficiary', 'beneficiary')
      .where('hold.amount >= :minAmount', { minAmount })
      .andWhere('hold.amount <= :maxAmount', { maxAmount })
      .getMany();
  }

  // Статистика
  async getBalanceStatistics(): Promise<{
    totalBalances: number;
    totalAmount: number;
    averageAmount: number;
    currencies: string[];
    beneficiariesWithBalance: number;
  }> {
    const balances = await this.repository.find({
      relations: ['beneficiary']
    });

    const totalAmount = balances.reduce((sum, balance) => sum + Number(balance.amount), 0);
    const averageAmount = balances.length > 0 ? totalAmount / balances.length : 0;
    const currencies = [...new Set(balances.map(balance => balance.currency))];
    const beneficiariesWithBalance = new Set(balances.map(balance => balance.beneficiaryId)).size;

    return {
      totalBalances: balances.length,
      totalAmount,
      averageAmount,
      currencies,
      beneficiariesWithBalance
    };
  }

  async getHoldStatistics(): Promise<{
    totalHolds: number;
    activeHolds: number;
    releasedHolds: number;
    executedHolds: number;
    totalHeldAmount: number;
    averageHoldAmount: number;
  }> {
    const holds = await this.holdRepository.find({
      relations: ['beneficiary']
    });

    const activeHolds = holds.filter(hold => hold.status === 'ACTIVE');
    const releasedHolds = holds.filter(hold => hold.status === 'RELEASED');
    const executedHolds = holds.filter(hold => hold.status === 'EXECUTED');

    const totalHeldAmount = holds.reduce((sum, hold) => sum + Number(hold.amount), 0);
    const averageHoldAmount = holds.length > 0 ? totalHeldAmount / holds.length : 0;

    return {
      totalHolds: holds.length,
      activeHolds: activeHolds.length,
      releasedHolds: releasedHolds.length,
      executedHolds: executedHolds.length,
      totalHeldAmount,
      averageHoldAmount
    };
  }

  // Валидация данных
  private validateBalanceData(data: Partial<Balance>): void {
    if (data.amount && data.amount < 0) {
      throw new Error('Balance amount cannot be negative');
    }

    if (data.currency && data.currency.length !== 3) {
      throw new Error('Currency code must be 3 characters long');
    }

    if (data.beneficiaryId && data.beneficiaryId <= 0) {
      throw new Error('Invalid beneficiary ID');
    }
  }
} 