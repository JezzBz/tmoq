import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { Step } from '../entity/deal/step';
import { Deal } from '../entity/deal/deal';
import { Deponent } from '../entity/deal/deponent';
import { Recipient } from '../entity/deal/recipient';
import { Beneficiary } from '../entity/beneficiary/beneficiary';
import { StepStatus } from '../enums/deal';

export class StepService extends BaseService<Step> {
  private dealRepository: Repository<Deal>;
  private deponentRepository: Repository<Deponent>;
  private recipientRepository: Repository<Recipient>;
  private beneficiaryRepository: Repository<Beneficiary>;

  constructor(
    stepRepository: Repository<Step>,
    dealRepository: Repository<Deal>,
    deponentRepository: Repository<Deponent>,
    recipientRepository: Repository<Recipient>,
    beneficiaryRepository: Repository<Beneficiary>
  ) {
    super(stepRepository);
    this.dealRepository = dealRepository;
    this.deponentRepository = deponentRepository;
    this.recipientRepository = recipientRepository;
    this.beneficiaryRepository = beneficiaryRepository;
  }

  async findById(id: number): Promise<Step | null> {
    return await this.repository.findOne({
      where: { stepId: id },
      relations: ['deal', 'deponents', 'recipients']
    });
  }

  async createStep(data: Partial<Step>): Promise<Step> {
    // Валидация данных
    this.validateStepData(data);
    
    // Проверяем существование сделки
    if (data.dealId) {
      const deal = await this.dealRepository.findOne({
        where: { dealId: data.dealId }
      });
      if (!deal) {
        throw new Error('Deal not found');
      }
    }

    const step = this.repository.create({
      ...data,
      status: StepStatus.DRAFT
    });
    return await this.repository.save(step);
  }

  async updateStep(id: number, data: Partial<Step>): Promise<Step | null> {
    // Валидация данных
    this.validateStepData(data);
    
    await this.repository.update({ stepId: id }, data);
    return await this.findById(id);
  }

  async deleteStep(id: number): Promise<boolean> {
    const step = await this.findById(id);
    if (!step) {
      return false;
    }

    // Проверяем, можно ли удалить этап
    if (step.status === StepStatus.COMPLETED) {
      throw new Error('Completed steps cannot be deleted');
    }

    const result = await this.repository.delete({ stepId: id });
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы со статусами этапов
  async startStep(id: number): Promise<Step | null> {
    const step = await this.findById(id);
    if (!step) {
      throw new Error('Step not found');
    }

    if (step.status !== StepStatus.DRAFT) {
      throw new Error('Only draft steps can be started');
    }

    await this.repository.update({ stepId: id }, { 
      status: StepStatus.ACTIVE,
      startedAt: new Date()
    });
    return await this.findById(id);
  }

  async completeStep(id: number): Promise<Step | null> {
    const step = await this.findById(id);
    if (!step) {
      throw new Error('Step not found');
    }

    if (step.status !== StepStatus.ACTIVE) {
      throw new Error('Only active steps can be completed');
    }

    // Проверяем, что все депоненты и реципиенты добавлены
    const deponents = await this.getDeponents(id);
    const recipients = await this.getRecipients(id);

    if (deponents.length === 0) {
      throw new Error('At least one deponent must be added before completing the step');
    }

    if (recipients.length === 0) {
      throw new Error('At least one recipient must be added before completing the step');
    }

    await this.repository.update({ stepId: id }, { 
      status: StepStatus.COMPLETED,
      completedAt: new Date()
    });
    return await this.findById(id);
  }

  async cancelStep(id: number): Promise<Step | null> {
    const step = await this.findById(id);
    if (!step) {
      throw new Error('Step not found');
    }

    if (step.status === StepStatus.COMPLETED) {
      throw new Error('Completed steps cannot be cancelled');
    }

    await this.repository.update({ stepId: id }, { 
      status: StepStatus.CANCELLED,
      cancelledAt: new Date()
    });
    return await this.findById(id);
  }

  // Методы для работы с депонентами
  async getDeponents(stepId: number): Promise<Deponent[]> {
    return await this.deponentRepository.find({
      where: { step: { stepId } },
      relations: ['beneficiary']
    });
  }

  async getDeponentById(deponentId: number): Promise<Deponent | null> {
    return await this.deponentRepository.findOne({
      where: { deponentId },
      relations: ['step', 'beneficiary']
    });
  }

  async createOrUpdateDeponent(stepId: number, deponentData: Partial<Deponent>): Promise<Deponent> {
    const step = await this.findById(stepId);
    if (!step) {
      throw new Error('Step not found');
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

    const deponent = this.deponentRepository.create({
      ...deponentData,
      step
    });
    return await this.deponentRepository.save(deponent);
  }

  async updateDeponent(deponentId: number, deponentData: Partial<Deponent>): Promise<Deponent | null> {
    await this.deponentRepository.update(deponentId, deponentData);
    return await this.getDeponentById(deponentId);
  }

  async deleteDeponent(deponentId: number): Promise<boolean> {
    const result = await this.deponentRepository.delete(deponentId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с реципиентами
  async getRecipients(stepId: number): Promise<Recipient[]> {
    return await this.recipientRepository.find({
      where: { step: { stepId } },
      relations: ['beneficiary']
    });
  }

  async getRecipientById(recipientId: number): Promise<Recipient | null> {
    return await this.recipientRepository.findOne({
      where: { recipientId },
      relations: ['step', 'beneficiary']
    });
  }

  async createRecipient(stepId: number, recipientData: Partial<Recipient>): Promise<Recipient> {
    const step = await this.findById(stepId);
    if (!step) {
      throw new Error('Step not found');
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

  // Методы для изменения реципиента на этапе сделки
  async changeRecipient(stepId: number, oldRecipientId: number, newRecipientData: Partial<Recipient>): Promise<Recipient> {
    // Удаляем старого реципиента
    await this.deleteRecipient(oldRecipientId);
    
    // Создаем нового реципиента
    return await this.createRecipient(stepId, newRecipientData);
  }

  // Методы для обновления банковских реквизитов реципиента
  async updateRecipientBankDetails(recipientId: number, bankDetails: any): Promise<Recipient | null> {
    const recipient = await this.getRecipientById(recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    await this.recipientRepository.update(recipientId, { bankDetails });
    return await this.getRecipientById(recipientId);
  }

  // Поиск и фильтрация
  async findByDeal(dealId: number): Promise<Step[]> {
    return await this.repository.find({
      where: { deal: { dealId } },
      relations: ['deal', 'deponents', 'recipients']
    });
  }

  async findByStatus(status: StepStatus): Promise<Step[]> {
    return await this.repository.find({
      where: { status },
      relations: ['deal', 'deponents', 'recipients']
    });
  }

  async findByDealAndStatus(dealId: number, status: StepStatus): Promise<Step[]> {
    return await this.repository.find({
      where: { 
        deal: { dealId },
        status 
      },
      relations: ['deal', 'deponents', 'recipients']
    });
  }

  // Методы для проверки возможности проведения платежей
  async checkPaymentPossibility(stepId: number): Promise<{
    canProcess: boolean;
    reasons: string[];
  }> {
    const step = await this.findById(stepId);
    if (!step) {
      return {
        canProcess: false,
        reasons: ['Step not found']
      };
    }

    const reasons: string[] = [];

    // Проверяем статус этапа
    if (step.status !== StepStatus.IN_PROGRESS) {
      reasons.push('Step must be in progress');
    }

    // Проверяем наличие депонентов
    const deponents = await this.getDeponents(stepId);
    if (deponents.length === 0) {
      reasons.push('No deponents found');
    }

    // Проверяем наличие реципиентов
    const recipients = await this.getRecipients(stepId);
    if (recipients.length === 0) {
      reasons.push('No recipients found');
    }

    // Проверяем балансы депонентов (если есть логика проверки балансов)
    // Здесь можно добавить проверку балансов

    return {
      canProcess: reasons.length === 0,
      reasons
    };
  }

  // Статистика по этапам
  async getStepStatistics(dealId?: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('step');
    
    if (dealId) {
      queryBuilder.where('step.dealId = :dealId', { dealId });
    }

    const steps = await queryBuilder.getMany();
    
    const statistics = {
      total: steps.length,
      pending: steps.filter(s => s.status === StepStatus.PENDING).length,
      inProgress: steps.filter(s => s.status === StepStatus.IN_PROGRESS).length,
      completed: steps.filter(s => s.status === StepStatus.COMPLETED).length,
      cancelled: steps.filter(s => s.status === StepStatus.CANCELLED).length
    };

    return statistics;
  }

  // Валидация данных
  private validateStepData(data: Partial<Step>): void {
    if (data.title && data.title.trim().length === 0) {
      throw new Error('Step title cannot be empty');
    }

    if (data.amount && data.amount <= 0) {
      throw new Error('Step amount must be greater than zero');
    }

    if (data.dealId && data.dealId <= 0) {
      throw new Error('Invalid deal ID');
    }
  }
} 