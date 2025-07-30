import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

/**
 * POST /api/v1/deals
 * Создание новой сделки
 * 
 * @param {string} req.headers['idempotency-key'] - Ключ идемпотентности (обязательный)
 * @param {Object} req.body - Данные сделки
 * @param {string} req.body.accountNumber - Номер номинального счета (20 или 22 цифры)
 * @param {string} req.body.beneficiaryId - ID бенефициара (для полной сделки)
 * @param {string} req.body.title - Название сделки (для полной сделки)
 * @param {number} req.body.amount - Сумма сделки (для полной сделки)
 * @param {string} req.body.currency - Валюта сделки (для полной сделки)
 * 
 * @returns {Object} 201 - Созданная сделка
 * @returns {Object} 400 - Ошибка валидации
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const dealData = req.body;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    // Создание сделки с номером счета (упрощенный вариант)
    if (dealData.accountNumber) {
      const deal = await services.dealService.createDealWithAccount(dealData.accountNumber);
      return res.status(201).json({
        dealId: deal.dealId,
        accountNumber: deal.accountNumber,
        status: deal.status
      });
    }
    
    // Создание полной сделки с бенефициаром
    if (!dealData.beneficiaryId || !dealData.title || !dealData.amount || !dealData.currency) {
      return res.status(400).json({
        error: 'beneficiaryId, title, amount, and currency are required'
      });
    }
    
    if (dealData.amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than zero'
      });
    }
    
    const deal = await services.dealService.createDeal(dealData);
    
    return res.status(201).json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    return res.status(400).json({
      error: 'Failed to create deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/deals
 * Получение списка сделок с пагинацией
 * 
 * @param {number} req.query.offset - Смещение (по умолчанию: 0)
 * @param {number} req.query.limit - Лимит записей (по умолчанию: 50)
 * 
 * @returns {Object} 200 - Список сделок с метаданными пагинации
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { offset = 0, limit = 50 } = req.query;
    
    const deals = await services.dealService.findAll();
    
    // Применение пагинации на уровне приложения
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedDeals = deals.slice(startIndex, endIndex);
    
    // Форматирование ответа согласно API спецификации
    const formattedDeals = paginatedDeals.map(deal => ({
      dealId: deal.dealId,
      accountNumber: deal.accountNumber,
      status: deal.status
    }));
    
    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: formattedDeals.length,
      total: deals.length,
      results: formattedDeals
    });
  } catch (error) {
    console.error('Error getting deals:', error);
    return res.status(500).json({
      error: 'Failed to get deals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/deals/{dealId}
 * Получение сделки по идентификатору
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * 
 * @returns {Object} 200 - Данные сделки
 * @returns {Object} 404 - Сделка не найдена
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const deal = await services.dealService.findById(dealId);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found'
      });
    }

    // Форматирование ответа согласно API спецификации
    return res.json({
      dealId: deal.dealId,
      accountNumber: deal.accountNumber,
      status: deal.status
    });
  } catch (error) {
    console.error('Error getting deal:', error);
    return res.status(500).json({
      error: 'Failed to get deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/deals/{dealId}
 * Обновление данных сделки
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {Object} req.body - Данные для обновления
 * 
 * @returns {Object} 200 - Обновленная сделка
 * @returns {Object} 404 - Сделка не найдена
 * @returns {Object} 400 - Ошибка валидации
 */
router.put('/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const updateData = req.body;
    
    const deal = await services.dealService.updateDeal(dealId, updateData);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found'
      });
    }

    return res.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    return res.status(400).json({
      error: 'Failed to update deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/deals/{dealId}
 * Удаление сделки
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * 
 * @returns {Object} 204 - Сделка успешно удалена
 * @returns {Object} 404 - Сделка не найдена
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.delete('/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const success = await services.dealService.deleteDeal(dealId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Deal not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting deal:', error);
    return res.status(400).json({
      error: 'Failed to delete deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Маршруты для этапов сделок

/**
 * POST /api/v1/deals/{dealId}/steps
 * Создание нового этапа сделки
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.headers['idempotency-key'] - Ключ идемпотентности (обязательный)
 * @param {Object} req.body - Данные этапа
 * @param {string} req.body.description - Описание этапа
 * 
 * @returns {Object} 201 - Созданный этап
 * @returns {Object} 400 - Ошибка валидации
 */
router.post('/:dealId/steps', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const stepData = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    const step = await services.dealService.createStep(dealId, stepData);
    
    // Форматирование ответа согласно API спецификации
    return res.status(201).json({
      dealId: step.dealId,
      stepId: step.stepId,
      stepNumber: step.stepNumber,
      description: step.description,
      status: step.status
    });
  } catch (error) {
    console.error('Error creating step:', error);
    return res.status(400).json({
      error: 'Failed to create step',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/deals/{dealId}/steps
 * Получение списка этапов сделки с пагинацией
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {number} req.query.offset - Смещение (по умолчанию: 0)
 * @param {number} req.query.limit - Лимит записей (по умолчанию: 50)
 * 
 * @returns {Object} 200 - Список этапов с метаданными пагинации
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:dealId/steps', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const { offset = 0, limit = 50 } = req.query;
    
    const steps = await services.dealService.getSteps(dealId, Number(offset), Number(limit));
    
    return res.json(steps);
  } catch (error) {
    console.error('Error getting steps:', error);
    return res.status(500).json({
      error: 'Failed to get steps',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Маршруты для реципиентов

/**
 * GET /api/v1/deals/{dealId}/steps/{stepId}/recipients/{recipientId}
 * Получение реципиента по идентификатору
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {string} req.params.recipientId - Идентификатор реципиента
 * 
 * @returns {Object} 200 - Данные реципиента
 * @returns {Object} 404 - Реципиент не найден
 */
router.get('/:dealId/steps/:stepId/recipients/:recipientId', async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params;
    
    const recipient = await services.dealService.getRecipientById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    // Форматирование ответа согласно API спецификации
    return res.json({
      dealId: recipient.step.dealId,
      stepId: recipient.stepId,
      beneficiaryId: recipient.beneficiaryId,
      recipientId: recipient.recipientId,
      amount: recipient.amount,
      tax: recipient.tax,
      purpose: recipient.purpose,
      bankDetailsId: recipient.bankDetailsId,
      keepOnVirtualAccount: recipient.keepOnVirtualAccount
    });
  } catch (error) {
    console.error('Error getting recipient:', error);
    return res.status(500).json({
      error: 'Failed to get recipient',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/deals/{dealId}/steps/{stepId}/recipients/{recipientId}
 * Обновление данных реципиента
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {string} req.params.recipientId - Идентификатор реципиента
 * @param {Object} req.body - Данные для обновления
 * 
 * @returns {Object} 200 - Обновленный реципиент
 * @returns {Object} 404 - Реципиент не найден
 * @returns {Object} 400 - Ошибка валидации
 */
router.put('/:dealId/steps/:stepId/recipients/:recipientId', async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params;
    const recipientData = req.body;
    
    const recipient = await services.dealService.updateRecipient(recipientId, recipientData);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    // Форматирование ответа согласно API спецификации
    return res.json({
      dealId: recipient.step.dealId,
      stepId: recipient.stepId,
      beneficiaryId: recipient.beneficiaryId,
      recipientId: recipient.recipientId,
      amount: recipient.amount,
      tax: recipient.tax,
      purpose: recipient.purpose,
      bankDetailsId: recipient.bankDetailsId,
      keepOnVirtualAccount: recipient.keepOnVirtualAccount
    });
  } catch (error) {
    console.error('Error updating recipient:', error);
    return res.status(400).json({
      error: 'Failed to update recipient',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/deals/{dealId}/steps/{stepId}/recipients/{recipientId}
 * Удаление реципиента
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {string} req.params.recipientId - Идентификатор реципиента
 * 
 * @returns {Object} 204 - Реципиент успешно удален
 * @returns {Object} 404 - Реципиент не найден
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.delete('/:dealId/steps/:stepId/recipients/:recipientId', async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params;
    
    const success = await services.dealService.deleteRecipient(recipientId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting recipient:', error);
    return res.status(400).json({
      error: 'Failed to delete recipient',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Маршруты для депонентов

/**
 * GET /api/v1/deals/{dealId}/steps/{stepId}/deponents/{beneficiaryId}
 * Получение депонента по идентификатору бенефициара
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * 
 * @returns {Object} 200 - Данные депонента
 * @returns {Object} 404 - Депонент не найден
 */
router.get('/:dealId/steps/:stepId/deponents/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { stepId, beneficiaryId } = req.params;
    
    const deponent = await services.dealService.getDeponentByBeneficiaryId(stepId, beneficiaryId);
    
    if (!deponent) {
      return res.status(404).json({
        error: 'Deponent not found'
      });
    }

    // Форматирование ответа согласно API спецификации
    return res.json({
      dealId: deponent.step.dealId,
      stepId: deponent.stepId,
      beneficiaryId: deponent.beneficiaryId,
      amount: deponent.amount
    });
  } catch (error) {
    console.error('Error getting deponent:', error);
    return res.status(500).json({
      error: 'Failed to get deponent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/deals/{dealId}/steps/{stepId}/deponents/{beneficiaryId}
 * Создание или обновление депонента
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * @param {Object} req.body - Данные депонента
 * @param {number} req.body.amount - Сумма депонирования
 * 
 * @returns {Object} 200 - Созданный/обновленный депонент
 * @returns {Object} 400 - Ошибка валидации
 */
router.put('/:dealId/steps/:stepId/deponents/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { stepId, beneficiaryId } = req.params;
    const deponentData = req.body;
    
    const deponent = await services.dealService.createOrUpdateDeponent(stepId, {
      ...deponentData,
      beneficiaryId
    });

    // Форматирование ответа согласно API спецификации
    return res.json({
      dealId: deponent.step.dealId,
      stepId: deponent.stepId,
      beneficiaryId: deponent.beneficiaryId,
      amount: deponent.amount
    });
  } catch (error) {
    console.error('Error creating/updating deponent:', error);
    return res.status(400).json({
      error: 'Failed to create/update deponent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/deals/{dealId}/steps/{stepId}/deponents/{beneficiaryId}
 * Удаление депонента
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {string} req.params.beneficiaryId - Идентификатор бенефициара
 * 
 * @returns {Object} 204 - Депонент успешно удален
 * @returns {Object} 404 - Депонент не найден
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.delete('/:dealId/steps/:stepId/deponents/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { stepId, beneficiaryId } = req.params;
    
    const success = await services.dealService.deleteDeponentByBeneficiaryId(stepId, beneficiaryId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Deponent not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting deponent:', error);
    return res.status(400).json({
      error: 'Failed to delete deponent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/deals/{dealId}/steps/{stepId}/deponents
 * Получение списка депонентов этапа с пагинацией
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {number} req.query.offset - Смещение (по умолчанию: 0)
 * @param {number} req.query.limit - Лимит записей (по умолчанию: 50)
 * 
 * @returns {Object} 200 - Список депонентов с метаданными пагинации
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:dealId/steps/:stepId/deponents', async (req: Request, res: Response) => {
  try {
    const { stepId } = req.params;
    const { offset = 0, limit = 50 } = req.query;
    
    const deponents = await services.dealService.getDeponents(stepId);
    
    // Применение пагинации на уровне приложения
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedDeponents = deponents.slice(startIndex, endIndex);
    
    // Форматирование ответа согласно API спецификации
    const formattedDeponents = paginatedDeponents.map(deponent => ({
      dealId: deponent.step.dealId,
      stepId: deponent.stepId,
      beneficiaryId: deponent.beneficiaryId,
      amount: deponent.amount
    }));
    
    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: formattedDeponents.length,
      total: deponents.length,
      results: formattedDeponents
    });
  } catch (error) {
    console.error('Error getting deponents:', error);
    return res.status(500).json({
      error: 'Failed to get deponents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/deals/{dealId}/steps/{stepId}/recipients/{recipientId}/update-bank-details
 * Обновление банковских реквизитов реципиента при неуспешности платежа
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {string} req.params.recipientId - Идентификатор реципиента
 * @param {Object} req.body - Данные банковских реквизитов
 * @param {string} req.body.bankDetailsId - Идентификатор банковских реквизитов
 * 
 * @returns {Object} 200 - Обновленный реципиент
 * @returns {Object} 404 - Реципиент не найден
 * @returns {Object} 400 - Ошибка валидации
 */
router.post('/:dealId/steps/:stepId/recipients/:recipientId/update-bank-details', async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params;
    const { bankDetailsId } = req.body;
    
    const recipient = await services.dealService.updateRecipientBankDetails(recipientId, bankDetailsId);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    return res.json(recipient);
  } catch (error) {
    console.error('Error updating recipient bank details:', error);
    return res.status(400).json({
      error: 'Failed to update recipient bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/deals/{dealId}/steps/{stepId}/recipients
 * Получение списка реципиентов этапа с пагинацией
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {number} req.query.offset - Смещение (по умолчанию: 0)
 * @param {number} req.query.limit - Лимит записей (по умолчанию: 50)
 * 
 * @returns {Object} 200 - Список реципиентов с метаданными пагинации
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:dealId/steps/:stepId/recipients', async (req: Request, res: Response) => {
  try {
    const { stepId } = req.params;
    const { offset = 0, limit = 50 } = req.query;
    
    const recipients = await services.dealService.getRecipients(stepId);
    
    // Применение пагинации на уровне приложения
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedRecipients = recipients.slice(startIndex, endIndex);
    
    // Форматирование ответа согласно API спецификации
    const formattedRecipients = paginatedRecipients.map(recipient => ({
      dealId: recipient.step.dealId,
      stepId: recipient.stepId,
      beneficiaryId: recipient.beneficiaryId,
      recipientId: recipient.recipientId,
      amount: recipient.amount,
      tax: recipient.tax,
      purpose: recipient.purpose,
      bankDetailsId: recipient.bankDetailsId,
      keepOnVirtualAccount: recipient.keepOnVirtualAccount
    }));
    
    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: formattedRecipients.length,
      total: recipients.length,
      results: formattedRecipients
    });
  } catch (error) {
    console.error('Error getting recipients:', error);
    return res.status(500).json({
      error: 'Failed to get recipients',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/deals/{dealId}/steps/{stepId}/recipients
 * Создание нового реципиента на этапе сделки
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {string} req.headers['idempotency-key'] - Ключ идемпотентности (обязательный)
 * @param {Object} req.body - Данные реципиента
 * @param {string} req.body.beneficiaryId - Идентификатор бенефициара
 * @param {number} req.body.amount - Сумма
 * @param {number} req.body.tax - Налог
 * @param {string} req.body.purpose - Назначение платежа
 * @param {string} req.body.bankDetailsId - Идентификатор банковских реквизитов
 * @param {boolean} req.body.keepOnVirtualAccount - Оставить на виртуальном счете
 * 
 * @returns {Object} 201 - Созданный реципиент
 * @returns {Object} 400 - Ошибка валидации
 */
router.post('/:dealId/steps/:stepId/recipients', async (req: Request, res: Response) => {
  try {
    const { stepId } = req.params;
    const recipientData = req.body;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    const recipient = await services.dealService.createRecipient(stepId, recipientData);

    // Форматирование ответа согласно API спецификации
    return res.status(201).json({
      dealId: recipient.step.dealId,
      stepId: recipient.stepId,
      beneficiaryId: recipient.beneficiaryId,
      recipientId: recipient.recipientId,
      amount: recipient.amount,
      tax: recipient.tax,
      purpose: recipient.purpose,
      bankDetailsId: recipient.bankDetailsId,
      keepOnVirtualAccount: recipient.keepOnVirtualAccount
    });
  } catch (error) {
    console.error('Error creating recipient:', error);
    return res.status(400).json({
      error: 'Failed to create recipient',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Маршруты управления сделками

/**
 * POST /api/v1/deals/{dealId}/cancel
 * Отмена сделки (перевод в статус CANCELLED)
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * 
 * @returns {Object} 200 - Сделка успешно отменена
 * @returns {Object} 404 - Сделка не найдена
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.post('/:dealId/cancel', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const deal = await services.dealService.cancelDeal(dealId);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found'
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Error cancelling deal:', error);
    return res.status(400).json({
      error: 'Failed to cancel deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/deals/{dealId}/is-valid
 * Проверка валидности сделки для совершения платежей
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * 
 * @returns {Object} 200 - Результат валидации с причинами
 * @returns {Object} 404 - Сделка не найдена
 */
router.get('/:dealId/is-valid', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const validation = await services.dealService.isDealValid(dealId);
    
    return res.json(validation);
  } catch (error) {
    console.error('Error validating deal:', error);
    return res.status(404).json({
      error: 'Deal not found',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/deals/{dealId}/draft
 * Перевод сделки в статус DRAFT
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * 
 * @returns {Object} 200 - Сделка успешно переведена в DRAFT
 * @returns {Object} 404 - Сделка не найдена
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.post('/:dealId/draft', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const deal = await services.dealService.moveToDraft(dealId);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found'
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Error moving deal to draft:', error);
    return res.status(400).json({
      error: 'Failed to move deal to draft',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/deals/{dealId}/accept
 * Принятие сделки (перевод в статус ACCEPTED)
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * 
 * @returns {Object} 200 - Сделка успешно принята
 * @returns {Object} 404 - Сделка не найдена
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.post('/:dealId/accept', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const deal = await services.dealService.acceptDeal(dealId);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found'
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Error accepting deal:', error);
    return res.status(400).json({
      error: 'Failed to accept deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Маршруты управления этапами сделок

/**
 * POST /api/v1/deals/{dealId}/steps/{stepId}/complete
 * Завершение этапа сделки
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * 
 * @returns {Object} 200 - Этап успешно завершен
 * @returns {Object} 404 - Этап не найден
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.post('/:dealId/steps/:stepId/complete', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId } = req.params;
    
    const step = await services.dealService.completeStep(dealId, stepId);
    
    if (!step) {
      return res.status(404).json({
        error: 'Step not found'
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Error completing step:', error);
    return res.status(400).json({
      error: 'Failed to complete step',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/deals/{dealId}/steps/{stepId}
 * Получение этапа по идентификатору
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * 
 * @returns {Object} 200 - Данные этапа
 * @returns {Object} 404 - Этап не найден
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:dealId/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId } = req.params;
    
    const step = await services.dealService.getStepById(dealId, stepId);
    
    if (!step) {
      return res.status(404).json({
        error: 'Step not found'
      });
    }

    // Форматирование ответа согласно API спецификации
    return res.json({
      dealId: step.dealId,
      stepId: step.stepId,
      stepNumber: step.stepNumber,
      description: step.description,
      status: step.status
    });
  } catch (error) {
    console.error('Error getting step:', error);
    return res.status(500).json({
      error: 'Failed to get step',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/deals/{dealId}/steps/{stepId}
 * Обновление этапа сделки
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * @param {Object} req.body - Данные для обновления
 * @param {string} req.body.description - Описание этапа
 * 
 * @returns {Object} 200 - Обновленный этап
 * @returns {Object} 404 - Этап не найден
 * @returns {Object} 400 - Ошибка валидации
 */
router.put('/:dealId/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId } = req.params;
    const stepData = req.body;
    
    const step = await services.dealService.updateStep(dealId, stepId, stepData);
    
    if (!step) {
      return res.status(404).json({
        error: 'Step not found'
      });
    }

    // Форматирование ответа согласно API спецификации
    return res.json({
      dealId: step.dealId,
      stepId: step.stepId,
      stepNumber: step.stepNumber,
      description: step.description,
      status: step.status
    });
  } catch (error) {
    console.error('Error updating step:', error);
    return res.status(400).json({
      error: 'Failed to update step',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/deals/{dealId}/steps/{stepId}
 * Удаление этапа сделки
 * 
 * @param {string} req.params.dealId - Идентификатор сделки
 * @param {string} req.params.stepId - Идентификатор этапа
 * 
 * @returns {Object} 204 - Этап успешно удален
 * @returns {Object} 404 - Этап не найден
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.delete('/:dealId/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId } = req.params;
    
    const success = await services.dealService.deleteStep(dealId, stepId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Step not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting step:', error);
    return res.status(400).json({
      error: 'Failed to delete step',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 