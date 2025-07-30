import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { BankDetails } from '../entity/bankDetails/bankDetails';
import { Beneficiary } from '../entity/beneficiary/beneficiary';
import { BankDetailsType } from '../enums/bankDetails';

export class BankDetailsService extends BaseService<BankDetails> {
  private beneficiaryRepository: Repository<Beneficiary>;

  constructor(
    bankDetailsRepository: Repository<BankDetails>,
    beneficiaryRepository: Repository<Beneficiary>
  ) {
    super(bankDetailsRepository);
    this.beneficiaryRepository = beneficiaryRepository;
  }

  async findById(id: string): Promise<BankDetails | null> {
    return await this.repository.findOne({
      where: { bankDetailsId: id },
      relations: ['beneficiary']
    });
  }

  async findByIdWithBeneficiary(bankDetailsId: string, beneficiaryId: string): Promise<BankDetails | null> {
    return await this.repository.findOne({
      where: { 
        bankDetailsId: bankDetailsId,
        beneficiary: { beneficiaryId: beneficiaryId }
      },
      relations: ['beneficiary']
    });
  }

  async findByBeneficiaryId(beneficiaryId: string, limit: number, offset: number): Promise<[BankDetails[], number]> {
    return await this.repository.findAndCount({
      where: { beneficiary: { beneficiaryId: beneficiaryId } },
      relations: ['beneficiary'],
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' }
    });
  }

  async createBankDetails(beneficiaryId: string, data: any, idempotencyKey: string): Promise<BankDetails> {
    // Проверяем существование бенефициара
    const beneficiary = await this.beneficiaryRepository.findOne({
      where: { beneficiaryId: beneficiaryId }
    });
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    // Проверяем идемпотентность
    const existingRequest = await this.repository.findOne({
      where: { 
        beneficiary: { beneficiaryId: beneficiaryId },
        // Здесь можно добавить проверку по idempotencyKey если есть соответствующее поле
      }
    });

    if (existingRequest) {
      return existingRequest;
    }

    // Валидация данных
    this.validateBankDetailsData(data);

    const bankDetails = this.repository.create({
      ...data,
      beneficiaryId: beneficiaryId
    });
    const savedBankDetails = await this.repository.save(bankDetails);
    return Array.isArray(savedBankDetails) ? savedBankDetails[0] : savedBankDetails;
  }

  async setDefault(beneficiaryId: string, bankDetailsId: string): Promise<boolean> {
    return await this.setDefaultBankDetails(beneficiaryId, bankDetailsId);
  }

  async createAddCardRequest(beneficiaryId: string, terminalKey: string, idempotencyKey: string): Promise<any> {
    // Проверяем существование бенефициара
    const beneficiary = await this.beneficiaryRepository.findOne({
      where: { beneficiaryId: beneficiaryId }
    });
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    // Генерируем уникальный ID для запроса
    const addCardRequestId = this.generateUUID();
    
    // В реальном приложении здесь была бы интеграция с платежной системой
    const addCardUrl = `https://securepay.tinkoff.ru/e2c/${addCardRequestId}`;

    return {
      beneficiaryId,
      addCardRequestId,
      terminalKey,
      status: 'PENDING',
      addCardUrl
    };
  }

  async updateBankDetailsWithBeneficiary(bankDetailsId: string, beneficiaryId: string, data: any): Promise<BankDetails | null> {
    const bankDetails = await this.repository.findOne({
      where: { 
        bankDetailsId: bankDetailsId,
        beneficiary: { beneficiaryId: beneficiaryId }
      }
    });

    if (!bankDetails) {
      return null;
    }

    // Валидация данных
    this.validateBankDetailsData(data);

    await this.repository.update(bankDetailsId, data);
    return await this.findById(bankDetailsId);
  }

  async deleteBankDetailsWithBeneficiary(bankDetailsId: string, beneficiaryId: string): Promise<boolean> {
    const bankDetails = await this.repository.findOne({
      where: { 
        bankDetailsId: bankDetailsId,
        beneficiary: { beneficiaryId: beneficiaryId }
      }
    });

    if (!bankDetails) {
      return false;
    }

    const result = await this.repository.delete(bankDetailsId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с реквизитами бенефициара
  async getBankDetailsByBeneficiary(beneficiaryId: string): Promise<BankDetails[]> {
    return await this.repository.find({
      where: { beneficiary: { beneficiaryId } },
      relations: ['beneficiary']
    });
  }

  async getDefaultBankDetails(beneficiaryId: string): Promise<BankDetails | null> {
    return await this.repository.findOne({
      where: { 
        beneficiary: { beneficiaryId },
        isDefault: true
      },
      relations: ['beneficiary']
    });
  }

  async setDefaultBankDetails(beneficiaryId: string, bankDetailsId: string): Promise<boolean> {
    // Сначала сбрасываем все реквизиты как не по умолчанию
    await this.repository.update(
      { beneficiary: { beneficiaryId } },
      { isDefault: false }
    );

    // Устанавливаем выбранные реквизиты как по умолчанию
    const result = await this.repository.update(
      { bankDetailsId, beneficiary: { beneficiaryId } },
      { isDefault: true }
    );

    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с реквизитами типа CARD
  async createCardRequest(beneficiaryId: string, cardData: Partial<BankDetails>): Promise<BankDetails> {
    const beneficiary = await this.beneficiaryRepository.findOne({
      where: { beneficiaryId }
    });
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }

    const cardRequest = this.repository.create({
      ...cardData,
      type: BankDetailsType.CARD,
      beneficiaryId,
      status: 'PENDING'
    });

    return await this.repository.save(cardRequest);
  }

  async getCardRequest(beneficiaryId: string): Promise<BankDetails | null> {
    return await this.repository.findOne({
      where: { 
        beneficiary: { beneficiaryId },
        type: BankDetailsType.CARD,
        status: 'PENDING'
      },
      relations: ['beneficiary']
    });
  }

  async approveCardRequest(bankDetailsId: string): Promise<BankDetails | null> {
    await this.repository.update(bankDetailsId, { 
      status: 'APPROVED',
      approvedAt: new Date()
    });
    return await this.findById(bankDetailsId);
  }

  async rejectCardRequest(bankDetailsId: string, reason?: string): Promise<BankDetails | null> {
    await this.repository.update(bankDetailsId, { 
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: reason
    });
    return await this.findById(bankDetailsId);
  }

  // Методы для работы с банковскими реквизитами
  async updateBeneficiaryBankDetails(beneficiaryId: string, bankDetailsId: string, data: Partial<BankDetails>): Promise<BankDetails | null> {
    // Проверяем, что реквизиты принадлежат бенефициару
    const bankDetails = await this.repository.findOne({
      where: { 
        bankDetailsId,
        beneficiary: { beneficiaryId }
      }
    });

    if (!bankDetails) {
      throw new Error('Bank details not found or do not belong to the beneficiary');
    }

    await this.repository.update(bankDetailsId, data);
    return await this.findById(bankDetailsId);
  }

  // Поиск и фильтрация
  async findByType(type: BankDetailsType): Promise<BankDetails[]> {
    return await this.repository.find({
      where: { type },
      relations: ['beneficiary']
    });
  }

  async findByStatus(status: string): Promise<BankDetails[]> {
    return await this.repository.find({
      where: { status },
      relations: ['beneficiary']
    });
  }

  async findByBankName(bankName: string): Promise<BankDetails[]> {
    return await this.repository.find({
      where: { bankName },
      relations: ['beneficiary']
    });
  }

  async findByAccountNumber(accountNumber: string): Promise<BankDetails | null> {
    return await this.repository.findOne({
      where: { accountNumber },
      relations: ['beneficiary']
    });
  }

  async findByCardNumber(cardNumber: string): Promise<BankDetails | null> {
    return await this.repository.findOne({
      where: { cardNumber },
      relations: ['beneficiary']
    });
  }

  // Методы для валидации банковских реквизитов
  async validateBankDetails(bankDetailsId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const bankDetails = await this.findById(bankDetailsId);
    if (!bankDetails) {
      return {
        isValid: false,
        errors: ['Bank details not found']
      };
    }

    const errors: string[] = [];

    // Валидация в зависимости от типа реквизитов
    if (bankDetails.type === BankDetailsType.ACCOUNT) {
      if (!bankDetails.accountNumber || bankDetails.accountNumber.length < 10) {
        errors.push('Invalid account number');
      }
      if (!bankDetails.bankName) {
        errors.push('Bank name is required');
      }
      if (!bankDetails.bic) {
        errors.push('BIC is required');
      }
    } else if (bankDetails.type === BankDetailsType.CARD) {
      if (!bankDetails.cardNumber || bankDetails.cardNumber.length !== 16) {
        errors.push('Invalid card number');
      }
      if (!bankDetails.cardHolderName) {
        errors.push('Card holder name is required');
      }
      if (!bankDetails.expiryDate) {
        errors.push('Expiry date is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Методы для работы с реквизитами по умолчанию
  async getDefaultBankDetailsByType(beneficiaryId: string, type: BankDetailsType): Promise<BankDetails | null> {
    return await this.repository.findOne({
      where: { 
        beneficiary: { beneficiaryId },
        type,
        isDefault: true
      },
      relations: ['beneficiary']
    });
  }

  async setDefaultBankDetailsByType(beneficiaryId: string, type: BankDetailsType, bankDetailsId: string): Promise<boolean> {
    // Сбрасываем все реквизиты данного типа как не по умолчанию
    await this.repository.update(
      { 
        beneficiary: { beneficiaryId },
        type
      },
      { isDefault: false }
    );

    // Устанавливаем выбранные реквизиты как по умолчанию
    const result = await this.repository.update(
      { 
        bankDetailsId, 
        beneficiary: { beneficiaryId },
        type
      },
      { isDefault: true }
    );

    return result.affected ? result.affected > 0 : false;
  }

  // Статистика по банковским реквизитам
  async getBankDetailsStatistics(beneficiaryId?: string): Promise<{
    total: number;
    accounts: number;
    cards: number;
    default: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('bankDetails');
    
    if (beneficiaryId) {
      queryBuilder.where('bankDetails.beneficiaryId = :beneficiaryId', { beneficiaryId });
    }

    const bankDetails = await queryBuilder.getMany();
    
    const statistics = {
      total: bankDetails.length,
      accounts: bankDetails.filter(bd => bd.type === BankDetailsType.ACCOUNT).length,
      cards: bankDetails.filter(bd => bd.type === BankDetailsType.CARD).length,
      default: bankDetails.filter(bd => bd.isDefault).length,
      pending: bankDetails.filter(bd => bd.status === 'PENDING').length,
      approved: bankDetails.filter(bd => bd.status === 'APPROVED').length,
      rejected: bankDetails.filter(bd => bd.status === 'REJECTED').length
    };

    return statistics;
  }

  // Валидация данных
  private validateBankDetailsData(data: Partial<BankDetails>): void {
    if (data.type === BankDetailsType.ACCOUNT) {
      if (!data.accountNumber || data.accountNumber.trim().length === 0) {
        throw new Error('Account number is required for account type');
      }
      if (!data.bankName || data.bankName.trim().length === 0) {
        throw new Error('Bank name is required for account type');
      }
      if (!data.bic || data.bic.trim().length === 0) {
        throw new Error('BIC is required for account type');
      }
    } else if (data.type === BankDetailsType.CARD) {
      if (!data.cardNumber || data.cardNumber.trim().length !== 16) {
        throw new Error('Card number must be 16 digits for card type');
      }
      if (!data.cardHolderName || data.cardHolderName.trim().length === 0) {
        throw new Error('Card holder name is required for card type');
      }
      if (!data.expiryDate) {
        throw new Error('Expiry date is required for card type');
      }
    }

    if (data.beneficiaryId && data.beneficiaryId.length === 0) {
      throw new Error('Invalid beneficiary ID');
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