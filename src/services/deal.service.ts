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

  async findById(id: number): Promise<Deal | null> {
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

  async updateDeal(id: number, data: Partial<Deal>): Promise<Deal | null> {
    // Валидация данных
    this.validateDealData(data);
    
    await this.repository.update({ dealId: id }, data);
    return await this.findById(id);
  }

  async deleteDeal(id: number): Promise<boolean> {
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
  async confirmDeal(id: number): Promise<Deal | null> {
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

  async moveToDraft(id: number): Promise<Deal | null> {
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

  async cancelDeal(id: number): Promise<Deal | null> {
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

  async completeDeal(id: number): Promise<Deal | null> {
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
  async getSteps(dealId: number): Promise<Step[]> {
    return await this.stepRepository.find({
      where: { deal: { dealId } },
      relations: ['deponents', 'recipients']
    });
  }

  async getStepById(stepId: number): Promise<Step | null> {
    return await this.stepRepository.findOne({
      where: { stepId },
      relations: ['deponents', 'recipients', 'deal']
    });
  }

  async createStep(dealId: number, stepData: Partial<Step>): Promise<Step> {
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

  async updateStep(stepId: number, stepData: Partial<Step>): Promise<Step | null> {
    await this.stepRepository.update(stepId, stepData);
    return await this.getStepById(stepId);
  }

  async deleteStep(stepId: number): Promise<boolean> {
    const result = await this.stepRepository.delete(stepId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с депонентами
  async getDeponents(stepId: number): Promise<Deponent[]> {
    return await this.deponentRepository.find({
      where: { step: { stepId } }
    });
  }

  async getDeponentById(deponentId: number): Promise<Deponent | null> {
    return await this.deponentRepository.findOne({
      where: { deponentId },
      relations: ['step', 'beneficiary']
    });
  }

  async createOrUpdateDeponent(stepId: number, deponentData: Partial<Deponent>): Promise<Deponent> {
    const step = await this.getStepById(stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    const deponent = this.deponentRepository.create({
      ...deponentData,
      step
    });
    return await this.deponentRepository.save(deponent);
  }

  async deleteDeponent(deponentId: number): Promise<boolean> {
    const result = await this.deponentRepository.delete(deponentId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с реципиентами
  async getRecipients(stepId: number): Promise<Recipient[]> {
    return await this.recipientRepository.find({
      where: { step: { stepId } }
    });
  }

  async getRecipientById(recipientId: number): Promise<Recipient | null> {
    return await this.recipientRepository.findOne({
      where: { recipientId },
      relations: ['step', 'beneficiary']
    });
  }

  async createRecipient(stepId: number, recipientData: Partial<Recipient>): Promise<Recipient> {
    const step = await this.getStepById(stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    const recipient = this.recipientRepository.create({
      ...recipientData,
      step
    });
    return await this.recipientRepository.save(recipient);
  }

  async updateRecipient(recipientId: number, recipientData: Partial<Recipient>): Promise<Recipient | null> {
    await this.recipientRepository.update(recipientId, recipientData);
    return await this.getRecipientById(recipientId);
  }

  async deleteRecipient(recipientId: number): Promise<boolean> {
    const result = await this.recipientRepository.delete(recipientId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с платежами
  async getPayments(dealId: number): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { deal: { dealId } }
    });
  }

  async getPaymentById(paymentId: number): Promise<Payment | null> {
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

  async findByBeneficiary(beneficiaryId: number): Promise<Deal[]> {
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