import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { Deal } from '../entity/deal/deal';
import { Step } from '../entity/deal/step';
import { Deponent } from '../entity/deal/deponent';
import { Recipient } from '../entity/deal/recipient';
import { Payment } from '../entity/payment/payment';
import { Beneficiary } from '../entity/beneficiary/beneficiary';
import { DealStatus, StepStatus } from '../enums/deal';

export class DealService extends BaseService<Deal> {
  private stepRepository: Repository<Step>;
  private deponentRepository: Repository<Deponent>;
  private recipientRepository: Repository<Recipient>;
  private paymentRepository: Repository<Payment>;
  private beneficiaryRepository: Repository<Beneficiary>;

  constructor(
    dealRepository: Repository<Deal>,
    stepRepository: Repository<Step>,
    deponentRepository: Repository<Deponent>,
    recipientRepository: Repository<Recipient>,
    paymentRepository: Repository<Payment>,
    beneficiaryRepository: Repository<Beneficiary>
  ) {
    super(dealRepository);
    this.stepRepository = stepRepository;
    this.deponentRepository = deponentRepository;
    this.recipientRepository = recipientRepository;
    this.paymentRepository = paymentRepository;
    this.beneficiaryRepository = beneficiaryRepository;
  }

  async findById(id: string): Promise<Deal | null> {
    return await this.repository.findOne({
      where: { dealId: id },
      relations: ['beneficiary', 'steps', 'payments']
    });
  }

  async createDeal(data: Partial<Deal>): Promise<Deal> {
    // Валидация данных
    this.validateDealData(data);
    
    // Проверяем существование бенефициара
    if (data.beneficiaryId) {
      const beneficiary = await this.beneficiaryRepository.findOne({
        where: { beneficiaryId: data.beneficiaryId }
      });
      if (!beneficiary) {
        throw new Error('Beneficiary not found');
      }
    }

    const deal = this.repository.create({
      ...data,
      status: DealStatus.DRAFT
    });
    return await this.repository.save(deal);
  }

  async updateDeal(id: string, data: Partial<Deal>): Promise<Deal | null> {
    // Валидация данных
    this.validateDealData(data);
    
    await this.repository.update({ dealId: id }, data);
    return await this.findById(id);
  }

  // Методы управления сделками

  async cancelDeal(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.status === DealStatus.COMPLETED) {
      throw new Error('Completed deals cannot be cancelled');
    }

    await this.repository.update({ dealId: id }, { status: DealStatus.CANCELLED });
    return await this.findById(id);
  }

  async moveToDraft(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.status === DealStatus.COMPLETED) {
      throw new Error('Completed deals cannot be moved to draft');
    }

    await this.repository.update({ dealId: id }, { status: DealStatus.DRAFT });
    return await this.findById(id);
  }

  async acceptDeal(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be accepted');
    }

    await this.repository.update({ dealId: id }, { status: DealStatus.ACCEPTED });
    return await this.findById(id);
  }

  async isDealValid(id: string): Promise<{ isValid: boolean; reasons: Array<{ code: string; description: string; details?: any }> }> {
    const deal = await this.findById(id);
    if (!deal) {
      return {
        isValid: false,
        reasons: [{ code: 'DEAL_NOT_FOUND', description: 'Deal not found' }]
      };
    }

    const reasons: Array<{ code: string; description: string; details?: any }> = [];

    // Проверяем наличие этапов
    const steps = await this.stepRepository.find({
      where: { deal: { dealId: id } }
    });

    if (steps.length === 0) {
      reasons.push({
        code: 'NO_STEPS_IN_DEAL',
        description: 'Deal contains no steps.',
        details: { dealId: id }
      });
    }

    // Проверяем каждый этап
    for (const step of steps) {
      const deponents = await this.deponentRepository.find({
        where: { step: { stepId: step.stepId } }
      });

      const recipients = await this.recipientRepository.find({
        where: { step: { stepId: step.stepId } }
      });

      // Проверяем сумму депонирования
      const totalDeposited = deponents.reduce((sum, deponent) => sum + Number(deponent.amount), 0);
      const totalRequired = recipients.reduce((sum, recipient) => sum + Number(recipient.amount), 0);

      if (totalDeposited < totalRequired) {
        reasons.push({
          code: 'INSUFFICIENT_DEPOSITS',
          description: `Insufficient deposits for step ${step.stepId}. Required: ${totalRequired}, Deposited: ${totalDeposited}`,
          details: { stepId: step.stepId, required: totalRequired, deposited: totalDeposited }
        });
      }

      // Проверяем наличие депонентов
      if (deponents.length === 0) {
        reasons.push({
          code: 'NO_DEPONENTS_IN_STEP',
          description: `Step ${step.stepId} has no deponents.`,
          details: { stepId: step.stepId }
        });
      }

      // Проверяем наличие реципиентов
      if (recipients.length === 0) {
        reasons.push({
          code: 'NO_RECIPIENTS_IN_STEP',
          description: `Step ${step.stepId} has no recipients.`,
          details: { stepId: step.stepId }
        });
      }
    }

    return {
      isValid: reasons.length === 0,
      reasons
    };
  }

  async createDealWithAccount(accountNumber: string): Promise<Deal> {
    // Валидация номера счета
    if (!accountNumber || !/^\d{20}|\d{22}$/.test(accountNumber)) {
      throw new Error('Invalid account number format. Must be 20 or 22 digits.');
    }

    const deal = this.repository.create({
      accountNumber,
      status: DealStatus.DRAFT,
      title: `Deal for account ${accountNumber}`,
      description: `Deal created for account ${accountNumber}`,
      amount: 0,
      currency: 'RUB'
    });

    return await this.repository.save(deal);
  }

  async deleteDeal(id: string): Promise<boolean> {
    const deal = await this.findById(id);
    if (!deal) {
      return false;
    }

    // Проверяем, можно ли удалить сделку
    if (deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be deleted');
    }

    const result = await this.repository.delete({ dealId: id });
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы со статусами сделок
  async confirmDeal(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be confirmed');
    }

    await this.repository.update({ dealId: id }, { status: DealStatus.CONFIRMED });
    return await this.findById(id);
  }

  async completeDeal(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      throw new Error('Deal not found');
    }

    // Проверяем, что все этапы завершены
    const steps = await this.stepRepository.find({
      where: { deal: { dealId: id } }
    });

    const hasUncompletedSteps = steps.some(step => step.status !== StepStatus.COMPLETED);
    if (hasUncompletedSteps) {
      throw new Error('All steps must be completed before completing the deal');
    }

    await this.repository.update({ dealId: id }, { status: DealStatus.COMPLETED });
    return await this.findById(id);
  }

  // Методы для работы с этапами
  async getSteps(dealId: string): Promise<Step[]> {
    return await this.stepRepository.find({
      where: { deal: { dealId } },
      relations: ['deponents', 'recipients']
    });
  }

  async getStepById(stepId: string): Promise<Step | null> {
    return await this.stepRepository.findOne({
      where: { stepId },
      relations: ['deponents', 'recipients', 'deal']
    });
  }

  async createStep(dealId: string, stepData: Partial<Step>): Promise<Step> {
    const deal = await this.findById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const step = this.stepRepository.create({
      ...stepData,
      deal
    });
    return await this.stepRepository.save(step);
  }

  async updateStep(stepId: string, stepData: Partial<Step>): Promise<Step | null> {
    await this.stepRepository.update(stepId, stepData);
    return await this.getStepById(stepId);
  }

  async deleteStep(stepId: string): Promise<boolean> {
    const result = await this.stepRepository.delete(stepId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с депонентами
  async getDeponents(stepId: string): Promise<Deponent[]> {
    return await this.deponentRepository.find({
      where: { step: { stepId } },
      relations: ['step', 'beneficiary']
    });
  }

  async getDeponentById(deponentId: string): Promise<Deponent | null> {
    return await this.deponentRepository.findOne({
      where: { deponentId },
      relations: ['step', 'beneficiary']
    });
  }

  async getDeponentByBeneficiaryId(stepId: string, beneficiaryId: string): Promise<Deponent | null> {
    return await this.deponentRepository.findOne({
      where: { 
        step: { stepId },
        beneficiary: { beneficiaryId }
      },
      relations: ['step', 'beneficiary']
    });
  }

  async createOrUpdateDeponent(stepId: string, deponentData: Partial<Deponent>): Promise<Deponent> {
    const step = await this.getStepById(stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    // Проверяем статус сделки - только DRAFT сделки можно редактировать
    if (step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    // Проверяем существование бенефициара
    if (deponentData.beneficiaryId) {
      const beneficiary = await this.beneficiaryRepository.findOne({
        where: { beneficiaryId: deponentData.beneficiaryId }
      });
      if (!beneficiary) {
        throw new Error('Beneficiary not found');
      }
    }

    // Ищем существующего депонента
    const existingDeponent = await this.getDeponentByBeneficiaryId(stepId, deponentData.beneficiaryId!);
    
    if (existingDeponent) {
      // Обновляем существующего депонента
      await this.deponentRepository.update(existingDeponent.deponentId, {
        amount: deponentData.amount
      });
      const updatedDeponent = await this.getDeponentById(existingDeponent.deponentId);
      if (!updatedDeponent) {
        throw new Error('Failed to update deponent');
      }
      return updatedDeponent;
    } else {
      // Создаем нового депонента
      const deponent = this.deponentRepository.create({
        ...deponentData,
        step
      });
      return await this.deponentRepository.save(deponent);
    }
  }

  async deleteDeponent(deponentId: string): Promise<boolean> {
    const deponent = await this.getDeponentById(deponentId);
    if (!deponent) {
      return false;
    }

    // Проверяем статус сделки - только DRAFT сделки можно редактировать
    if (deponent.step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    const result = await this.deponentRepository.delete(deponentId);
    return result.affected ? result.affected > 0 : false;
  }

  async deleteDeponentByBeneficiaryId(stepId: string, beneficiaryId: string): Promise<boolean> {
    const deponent = await this.getDeponentByBeneficiaryId(stepId, beneficiaryId);
    if (!deponent) {
      return false;
    }

    return await this.deleteDeponent(deponent.deponentId);
  }

  // Методы для работы с реципиентами
  async getRecipients(stepId: string): Promise<Recipient[]> {
    return await this.recipientRepository.find({
      where: { step: { stepId } },
      relations: ['step', 'beneficiary', 'bankDetails']
    });
  }

  async getRecipientById(recipientId: string): Promise<Recipient | null> {
    return await this.recipientRepository.findOne({
      where: { recipientId },
      relations: ['step', 'beneficiary', 'bankDetails']
    });
  }

  async createRecipient(stepId: string, recipientData: Partial<Recipient>): Promise<Recipient> {
    const step = await this.getStepById(stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    // Проверяем статус сделки - только DRAFT сделки можно редактировать
    if (step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    // Проверяем существование бенефициара
    if (recipientData.beneficiaryId) {
      const beneficiary = await this.beneficiaryRepository.findOne({
        where: { beneficiaryId: recipientData.beneficiaryId }
      });
      if (!beneficiary) {
        throw new Error('Beneficiary not found');
      }
    }

    // Проверяем существование банковских реквизитов
    if (recipientData.bankDetailsId) {
      // Здесь нужно добавить проверку банковских реквизитов
      // const bankDetails = await this.bankDetailsRepository.findOne({
      //   where: { bankDetailsId: recipientData.bankDetailsId }
      // });
      // if (!bankDetails) {
      //   throw new Error('Bank details not found');
      // }
    }

    const recipient = this.recipientRepository.create({
      ...recipientData,
      step
    });
    return await this.recipientRepository.save(recipient);
  }

  async updateRecipient(recipientId: string, recipientData: Partial<Recipient>): Promise<Recipient | null> {
    const recipient = await this.getRecipientById(recipientId);
    if (!recipient) {
      return null;
    }

    // Проверяем статус сделки
    const step = await this.getStepById(recipient.stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    // Для обновлений разрешаем только DRAFT сделки
    if (step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    await this.recipientRepository.update(recipientId, recipientData);
    return await this.getRecipientById(recipientId);
  }

  async updateRecipientBankDetails(recipientId: string, bankDetailsId: string): Promise<Recipient | null> {
    const recipient = await this.getRecipientById(recipientId);
    if (!recipient) {
      return null;
    }

    // Проверяем статус сделки
    const step = await this.getStepById(recipient.stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    // Для обновления банковских реквизитов разрешаем только сделки в статусе PAYMENT_FAILED
    if (step.deal.status !== DealStatus.PAYMENT_FAILED) {
      throw new Error('Bank details can only be updated for deals in PAYMENT_FAILED status');
    }

    await this.recipientRepository.update(recipientId, { bankDetailsId });
    return await this.getRecipientById(recipientId);
  }

  async deleteRecipient(recipientId: string): Promise<boolean> {
    const recipient = await this.getRecipientById(recipientId);
    if (!recipient) {
      return false;
    }

    // Проверяем статус сделки - только DRAFT сделки можно редактировать
    const step = await this.getStepById(recipient.stepId);
    if (!step || step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    const result = await this.recipientRepository.delete(recipientId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с платежами
  async getPayments(dealId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { deal: { dealId } }
    });
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['deal']
    });
  }

  // Поиск и фильтрация
  async findByStatus(status: DealStatus): Promise<Deal[]> {
    return await this.repository.find({
      where: { status },
      relations: ['beneficiary', 'steps']
    });
  }

  async findByBeneficiary(beneficiaryId: string): Promise<Deal[]> {
    return await this.repository.find({
      where: { beneficiary: { beneficiaryId } },
      relations: ['beneficiary', 'steps']
    });
  }

  async findByAmountRange(minAmount: number, maxAmount: number): Promise<Deal[]> {
    return await this.repository
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.beneficiary', 'beneficiary')
      .leftJoinAndSelect('deal.steps', 'steps')
      .where('deal.amount >= :minAmount', { minAmount })
      .andWhere('deal.amount <= :maxAmount', { maxAmount })
      .getMany();
  }

  // Валидация данных
  private validateDealData(data: Partial<Deal>): void {
    if (data.amount && data.amount <= 0) {
      throw new Error('Deal amount must be greater than zero');
    }

    if (data.currency && data.currency.length !== 3) {
      throw new Error('Currency code must be 3 characters long');
    }

    if (data.title && data.title.trim().length === 0) {
      throw new Error('Deal title cannot be empty');
    }
  }
} 