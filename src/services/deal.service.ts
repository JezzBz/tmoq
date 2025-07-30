import { Repository } from 'typeorm';
import { BaseService } from './base.service';
import { Deal } from '../entity/deal/deal';
import { Step } from '../entity/deal/step';
import { Deponent } from '../entity/deal/deponent';
import { Recipient } from '../entity/deal/recipient';
import { Payment } from '../entity/payment/payment';
import { Beneficiary } from '../entity/beneficiary/beneficiary';
import { DealStatus, StepStatus } from '../enums/deal';

/**
 * Сервис для работы со сделками и связанными сущностями
 * Обеспечивает бизнес-логику для управления сделками, этапами, депонентами и реципиентами
 */
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

  /**
   * Поиск сделки по идентификатору
   * @param id - Идентификатор сделки
   * @returns Сделка или null если не найдена
   */
  async findById(id: string): Promise<Deal | null> {
    return await this.repository.findOne({
      where: { dealId: id },
      relations: ['beneficiary', 'steps', 'payments']
    });
  }

  /**
   * Создание новой сделки с полными данными
   * @param data - Данные для создания сделки
   * @returns Созданная сделка
   */
  async createDeal(data: Partial<Deal>): Promise<Deal> {
    this.validateDealData(data);

    const deal = this.repository.create({
      ...data,
      dealId: this.generateUUID(),
      status: DealStatus.DRAFT
    });

    return await this.repository.save(deal);
  }

  /**
   * Обновление данных сделки
   * @param id - Идентификатор сделки
   * @param data - Данные для обновления
   * @returns Обновленная сделка или null если не найдена
   */
  async updateDeal(id: string, data: Partial<Deal>): Promise<Deal | null> {
    this.validateDealData(data);
    
    await this.repository.update({ dealId: id }, data);
    return await this.findById(id);
  }

  /**
   * Отмена сделки (перевод в статус CANCELLED)
   * @param id - Идентификатор сделки
   * @returns Обновленная сделка или null если не найдена
   * @throws Error если сделка завершена
   */
  async cancelDeal(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      return null;
    }

    if (deal.status === DealStatus.COMPLETED) {
      throw new Error('Completed deals cannot be cancelled');
    }

    await this.repository.update({ dealId: id }, { 
      status: DealStatus.CANCELLED,
      updatedAt: new Date()
    });

    return await this.findById(id);
  }

  /**
   * Перевод сделки в статус DRAFT
   * @param id - Идентификатор сделки
   * @returns Обновленная сделка или null если не найдена
   * @throws Error если сделка завершена
   */
  async moveToDraft(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      return null;
    }

    if (deal.status === DealStatus.COMPLETED) {
      throw new Error('Completed deals cannot be moved to draft');
    }

    await this.repository.update({ dealId: id }, { 
      status: DealStatus.DRAFT,
      updatedAt: new Date()
    });

    return await this.findById(id);
  }

  /**
   * Принятие сделки (перевод в статус ACCEPTED)
   * @param id - Идентификатор сделки
   * @returns Обновленная сделка или null если не найдена
   * @throws Error если сделка не в статусе DRAFT
   */
  async acceptDeal(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      return null;
    }

    if (deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be accepted');
    }

    await this.repository.update({ dealId: id }, { 
      status: DealStatus.ACCEPTED,
      updatedAt: new Date()
    });

    return await this.findById(id);
  }

  /**
   * Проверка валидности сделки для совершения платежей
   * @param id - Идентификатор сделки
   * @returns Объект с результатом валидации и списком причин
   */
  async isDealValid(id: string): Promise<{ isValid: boolean; reasons: Array<{ code: string; description: string; details?: any }> }> {
    const deal = await this.findById(id);
    if (!deal) {
      return {
        isValid: false,
        reasons: [{ code: 'DEAL_NOT_FOUND', description: 'Deal not found' }]
      };
    }

    const reasons: Array<{ code: string; description: string; details?: any }> = [];

    // Проверка наличия этапов
    if (!deal.steps || deal.steps.length === 0) {
      reasons.push({ 
        code: 'NO_STEPS_IN_DEAL', 
        description: 'Deal contains no steps.' 
      });
    } else {
      // Проверка каждого этапа
      for (const step of deal.steps) {
        // Проверка наличия депонентов
        if (!step.deponents || step.deponents.length === 0) {
          reasons.push({ 
            code: 'NO_DEPONENTS_IN_STEP', 
            description: 'Step has no deponents.',
            details: { stepId: step.stepId }
          });
        }

        // Проверка наличия реципиентов
        if (!step.recipients || step.recipients.length === 0) {
          reasons.push({ 
            code: 'NO_RECIPIENTS_IN_STEP', 
            description: 'Step has no recipients.',
            details: { stepId: step.stepId }
          });
        }

        // Проверка достаточности депонированных средств
        if (step.deponents && step.recipients) {
          const totalDeposited = step.deponents.reduce((sum, deponent) => sum + Number(deponent.amount), 0);
          const totalRequired = step.recipients.reduce((sum, recipient) => sum + Number(recipient.amount), 0);

          if (totalDeposited < totalRequired) {
            reasons.push({ 
              code: 'INSUFFICIENT_DEPOSITS', 
              description: 'Total deposited amount is less than total required by recipients.',
              details: { 
                stepId: step.stepId,
                totalDeposited,
                totalRequired
              }
            });
          }
        }
      }
    }

    return {
      isValid: reasons.length === 0,
      reasons
    };
  }

  /**
   * Создание сделки с номером счета (упрощенный вариант)
   * @param accountNumber - Номер номинального счета
   * @returns Созданная сделка
   * @throws Error если номер счета неверного формата
   */
  async createDealWithAccount(accountNumber: string): Promise<Deal> {
    // Валидация формата номера счета (20 или 22 цифры)
    if (!/^\d{20}$|^\d{22}$/.test(accountNumber)) {
      throw new Error('Account number must be 20 or 22 digits');
    }

    const deal = this.repository.create({
      dealId: this.generateUUID(),
      accountNumber,
      title: `Deal for account ${accountNumber}`,
      amount: 0,
      currency: 'RUB',
      status: DealStatus.DRAFT,
      beneficiaryId: undefined
    });

    return await this.repository.save(deal);
  }

  /**
   * Удаление сделки
   * @param id - Идентификатор сделки
   * @returns true если удалена, false если не найдена
   * @throws Error если сделка не в статусе DRAFT
   */
  async deleteDeal(id: string): Promise<boolean> {
    const deal = await this.findById(id);
    if (!deal) {
      return false;
    }

    if (deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be deleted');
    }

    const result = await this.repository.delete({ dealId: id });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Подтверждение сделки (перевод в статус CONFIRMED)
   * @param id - Идентификатор сделки
   * @returns Обновленная сделка или null если не найдена
   */
  async confirmDeal(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      return null;
    }

    await this.repository.update({ dealId: id }, { 
      status: DealStatus.CONFIRMED,
      updatedAt: new Date()
    });

    return await this.findById(id);
  }

  /**
   * Завершение сделки (перевод в статус COMPLETED)
   * @param id - Идентификатор сделки
   * @returns Обновленная сделка или null если не найдена
   */
  async completeDeal(id: string): Promise<Deal | null> {
    const deal = await this.findById(id);
    if (!deal) {
      return null;
    }

    await this.repository.update({ dealId: id }, { 
      status: DealStatus.COMPLETED,
      updatedAt: new Date()
    });

    return await this.findById(id);
  }

  // Методы управления этапами сделок

  /**
   * Получение списка этапов сделки с пагинацией
   * @param dealId - Идентификатор сделки
   * @param offset - Смещение
   * @param limit - Лимит записей
   * @returns Объект с этапами и метаданными пагинации
   */
  async getSteps(dealId: string, offset: number = 0, limit: number = 50): Promise<{ offset: number; limit: number; size: number; total: number; results: any[] }> {
    const [steps, total] = await this.stepRepository.findAndCount({
      where: { deal: { dealId } },
      order: { stepNumber: 'ASC' },
      skip: offset,
      take: limit
    });

    const formattedSteps = steps.map(step => ({
      dealId: step.dealId,
      stepId: step.stepId,
      stepNumber: step.stepNumber,
      description: step.description,
      status: step.status
    }));

    return {
      offset,
      limit,
      size: formattedSteps.length,
      total,
      results: formattedSteps
    };
  }

  /**
   * Создание нового этапа сделки
   * @param dealId - Идентификатор сделки
   * @param stepData - Данные этапа
   * @returns Созданный этап
   */
  async createStep(dealId: string, stepData: Partial<Step>): Promise<Step> {
    // Проверка существования сделки
    const deal = await this.findById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    // Получение следующего номера этапа
    const existingSteps = await this.stepRepository.find({
      where: { deal: { dealId } },
      order: { stepNumber: 'DESC' },
      take: 1
    });

    const nextStepNumber = existingSteps.length > 0 ? existingSteps[0].stepNumber + 1 : 1;

    const step = this.stepRepository.create({
      ...stepData,
      dealId,
      stepNumber: nextStepNumber,
      status: StepStatus.NEW,
      title: stepData.title || `Этап ${nextStepNumber}`,
      amount: stepData.amount || 0,
      currency: stepData.currency || 'RUB'
    });

    return await this.stepRepository.save(step);
  }

  /**
   * Получение этапа по идентификатору
   * @param dealId - Идентификатор сделки
   * @param stepId - Идентификатор этапа
   * @returns Этап или null если не найден
   */
  async getStepById(dealId: string, stepId: string): Promise<Step | null> {
    return await this.stepRepository.findOne({
      where: { stepId, deal: { dealId } }
    });
  }

  /**
   * Обновление этапа сделки
   * @param dealId - Идентификатор сделки
   * @param stepId - Идентификатор этапа
   * @param stepData - Данные для обновления
   * @returns Обновленный этап или null если не найден
   * @throws Error если сделка не в статусе DRAFT
   */
  async updateStep(dealId: string, stepId: string, stepData: Partial<Step>): Promise<Step | null> {
    // Проверка существования сделки и этапа
    const deal = await this.findById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    if (deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    const step = await this.getStepById(dealId, stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    await this.stepRepository.update({ stepId }, stepData);
    return await this.getStepById(dealId, stepId);
  }

  /**
   * Удаление этапа сделки
   * @param dealId - Идентификатор сделки
   * @param stepId - Идентификатор этапа
   * @returns true если удален, false если не найден
   * @throws Error если сделка не в статусе DRAFT
   */
  async deleteStep(dealId: string, stepId: string): Promise<boolean> {
    // Проверка существования сделки
    const deal = await this.findById(dealId);
    if (!deal) {
      return false;
    }

    if (deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    const step = await this.getStepById(dealId, stepId);
    if (!step) {
      return false;
    }

    const result = await this.stepRepository.delete({ stepId });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Завершение этапа сделки
   * @param dealId - Идентификатор сделки
   * @param stepId - Идентификатор этапа
   * @returns Завершенный этап или null если не найден
   * @throws Error если этап уже завершен или отменен
   */
  async completeStep(dealId: string, stepId: string): Promise<Step | null> {
    // Проверка существования сделки и этапа
    const deal = await this.findById(dealId);
    if (!deal) {
      throw new Error('Deal not found');
    }

    const step = await this.getStepById(dealId, stepId);
    if (!step) {
      throw new Error('Step not found');
    }

    // Проверка, что этап можно завершить
    if (step.status === StepStatus.COMPLETED) {
      throw new Error('Step is already completed');
    }

    if (step.status === StepStatus.CANCELLED) {
      throw new Error('Cancelled steps cannot be completed');
    }

    await this.stepRepository.update({ stepId }, { 
      status: StepStatus.COMPLETED,
      completedAt: new Date()
    });

    return await this.getStepById(dealId, stepId);
  }

  // Методы для работы с депонентами

  /**
   * Получение списка депонентов этапа
   * @param stepId - Идентификатор этапа
   * @returns Список депонентов
   */
  async getDeponents(stepId: string): Promise<Deponent[]> {
    return await this.deponentRepository.find({
      where: { step: { stepId } },
      relations: ['step', 'beneficiary']
    });
  }

  /**
   * Получение депонента по идентификатору
   * @param deponentId - Идентификатор депонента
   * @returns Депонент или null если не найден
   */
  async getDeponentById(deponentId: string): Promise<Deponent | null> {
    return await this.deponentRepository.findOne({
      where: { deponentId },
      relations: ['step', 'beneficiary']
    });
  }

  /**
   * Получение депонента по идентификатору бенефициара
   * @param stepId - Идентификатор этапа
   * @param beneficiaryId - Идентификатор бенефициара
   * @returns Депонент или null если не найден
   */
  async getDeponentByBeneficiaryId(stepId: string, beneficiaryId: string): Promise<Deponent | null> {
    return await this.deponentRepository.findOne({
      where: { step: { stepId }, beneficiary: { beneficiaryId } },
      relations: ['step', 'beneficiary']
    });
  }

  /**
   * Создание или обновление депонента
   * @param stepId - Идентификатор этапа
   * @param deponentData - Данные депонента
   * @returns Созданный или обновленный депонент
   * @throws Error если сделка не в статусе DRAFT
   */
  async createOrUpdateDeponent(stepId: string, deponentData: Partial<Deponent>): Promise<Deponent> {
    const step = await this.stepRepository.findOne({
      where: { stepId },
      relations: ['deal']
    });
    if (!step) {
      throw new Error('Step not found');
    }

    // Проверка статуса сделки - только DRAFT сделки можно редактировать
    if (step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    // Проверка существования бенефициара
    if (deponentData.beneficiaryId) {
      const beneficiary = await this.beneficiaryRepository.findOne({
        where: { beneficiaryId: deponentData.beneficiaryId }
      });
      if (!beneficiary) {
        throw new Error('Beneficiary not found');
      }
    }

    // Поиск существующего депонента
    const existingDeponent = await this.getDeponentByBeneficiaryId(stepId, deponentData.beneficiaryId!);
    
    if (existingDeponent) {
      // Обновление существующего депонента
      await this.deponentRepository.update(existingDeponent.deponentId, {
        amount: deponentData.amount
      });
      const updatedDeponent = await this.getDeponentById(existingDeponent.deponentId);
      if (!updatedDeponent) {
        throw new Error('Failed to update deponent');
      }
      return updatedDeponent;
    } else {
      // Создание нового депонента
      const deponent = this.deponentRepository.create({
        ...deponentData,
        step
      });
      return await this.deponentRepository.save(deponent);
    }
  }

  /**
   * Удаление депонента
   * @param deponentId - Идентификатор депонента
   * @returns true если удален, false если не найден
   * @throws Error если сделка не в статусе DRAFT
   */
  async deleteDeponent(deponentId: string): Promise<boolean> {
    const deponent = await this.getDeponentById(deponentId);
    if (!deponent) {
      return false;
    }

    // Проверка статуса сделки - только DRAFT сделки можно редактировать
    if (deponent.step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    const result = await this.deponentRepository.delete(deponentId);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Удаление депонента по идентификатору бенефициара
   * @param stepId - Идентификатор этапа
   * @param beneficiaryId - Идентификатор бенефициара
   * @returns true если удален, false если не найден
   */
  async deleteDeponentByBeneficiaryId(stepId: string, beneficiaryId: string): Promise<boolean> {
    const deponent = await this.getDeponentByBeneficiaryId(stepId, beneficiaryId);
    if (!deponent) {
      return false;
    }

    return await this.deleteDeponent(deponent.deponentId);
  }

  // Методы для работы с реципиентами

  /**
   * Получение списка реципиентов этапа
   * @param stepId - Идентификатор этапа
   * @returns Список реципиентов
   */
  async getRecipients(stepId: string): Promise<Recipient[]> {
    return await this.recipientRepository.find({
      where: { step: { stepId } },
      relations: ['step', 'beneficiary', 'bankDetails']
    });
  }

  /**
   * Получение реципиента по идентификатору
   * @param recipientId - Идентификатор реципиента
   * @returns Реципиент или null если не найден
   */
  async getRecipientById(recipientId: string): Promise<Recipient | null> {
    return await this.recipientRepository.findOne({
      where: { recipientId },
      relations: ['step', 'beneficiary', 'bankDetails']
    });
  }

  /**
   * Создание нового реципиента
   * @param stepId - Идентификатор этапа
   * @param recipientData - Данные реципиента
   * @returns Созданный реципиент
   * @throws Error если сделка не в статусе DRAFT
   */
  async createRecipient(stepId: string, recipientData: Partial<Recipient>): Promise<Recipient> {
    const step = await this.stepRepository.findOne({
      where: { stepId },
      relations: ['deal']
    });
    if (!step) {
      throw new Error('Step not found');
    }

    // Проверка статуса сделки - только DRAFT сделки можно редактировать
    if (step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    // Проверка существования бенефициара
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

  /**
   * Обновление реципиента
   * @param recipientId - Идентификатор реципиента
   * @param recipientData - Данные для обновления
   * @returns Обновленный реципиент или null если не найден
   * @throws Error если сделка не в статусе DRAFT
   */
  async updateRecipient(recipientId: string, recipientData: Partial<Recipient>): Promise<Recipient | null> {
    const recipient = await this.getRecipientById(recipientId);
    if (!recipient) {
      return null;
    }

    // Проверка статуса сделки
    const step = await this.stepRepository.findOne({
      where: { stepId: recipient.stepId },
      relations: ['deal']
    });
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

  /**
   * Обновление банковских реквизитов реципиента
   * @param recipientId - Идентификатор реципиента
   * @param bankDetailsId - Идентификатор банковских реквизитов
   * @returns Обновленный реципиент или null если не найден
   * @throws Error если сделка не в статусе PAYMENT_FAILED
   */
  async updateRecipientBankDetails(recipientId: string, bankDetailsId: string): Promise<Recipient | null> {
    const recipient = await this.getRecipientById(recipientId);
    if (!recipient) {
      return null;
    }

    // Проверка статуса сделки
    const step = await this.stepRepository.findOne({
      where: { stepId: recipient.stepId },
      relations: ['deal']
    });
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

  /**
   * Удаление реципиента
   * @param recipientId - Идентификатор реципиента
   * @returns true если удален, false если не найден
   * @throws Error если сделка не в статусе DRAFT
   */
  async deleteRecipient(recipientId: string): Promise<boolean> {
    const recipient = await this.getRecipientById(recipientId);
    if (!recipient) {
      return false;
    }

    // Проверка статуса сделки - только DRAFT сделки можно редактировать
    const step = await this.stepRepository.findOne({
      where: { stepId: recipient.stepId },
      relations: ['deal']
    });
    if (!step || step.deal.status !== DealStatus.DRAFT) {
      throw new Error('Only draft deals can be modified');
    }

    const result = await this.recipientRepository.delete(recipientId);
    return result.affected ? result.affected > 0 : false;
  }

  // Методы для работы с платежами

  /**
   * Получение списка платежей сделки
   * @param dealId - Идентификатор сделки
   * @returns Список платежей
   */
  async getPayments(dealId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { deal: { dealId } }
    });
  }

  /**
   * Получение платежа по идентификатору
   * @param paymentId - Идентификатор платежа
   * @returns Платеж или null если не найден
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['deal']
    });
  }

  // Поиск и фильтрация

  /**
   * Поиск сделок по статусу
   * @param status - Статус сделки
   * @returns Список сделок
   */
  async findByStatus(status: DealStatus): Promise<Deal[]> {
    return await this.repository.find({
      where: { status },
      relations: ['beneficiary', 'steps']
    });
  }

  /**
   * Поиск сделок по бенефициару
   * @param beneficiaryId - Идентификатор бенефициара
   * @returns Список сделок
   */
  async findByBeneficiary(beneficiaryId: string): Promise<Deal[]> {
    return await this.repository.find({
      where: { beneficiary: { beneficiaryId } },
      relations: ['beneficiary', 'steps']
    });
  }

  /**
   * Поиск сделок по диапазону сумм
   * @param minAmount - Минимальная сумма
   * @param maxAmount - Максимальная сумма
   * @returns Список сделок
   */
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

  /**
   * Валидация данных сделки
   * @param data - Данные для валидации
   * @throws Error если данные невалидны
   */
  private validateDealData(data: Partial<Deal>): void {
    if (data.amount && data.amount <= 0) {
      throw new Error('Deal amount must be greater than zero');
    }

    if (data.currency && data.currency.length !== 3) {
      throw new Error('Currency code must be 3 characters long');
    }

    if (data.dealId && data.dealId.length === 0) {
      throw new Error('Invalid deal ID');
    }
  }

  /**
   * Генерация UUID
   * @returns Строка UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
} 