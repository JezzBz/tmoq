import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

// Базовые CRUD операции для сделок

// POST /api/v1/deals - Создать сделку (4.5)
router.post('/', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const dealData = req.body;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    // Если передан accountNumber, создаем сделку с номером счета
    if (dealData.accountNumber) {
      const deal = await services.dealService.createDealWithAccount(dealData.accountNumber);
      return res.status(201).json({
        dealId: deal.dealId,
        accountNumber: deal.accountNumber,
        status: deal.status
      });
    }
    
    // Иначе создаем обычную сделку
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

// GET /api/v1/deals - Получить все сделки (4.4)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { offset = 0, limit = 50 } = req.query;
    
    const deals = await services.dealService.findAll();
    
    // Применяем пагинацию
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedDeals = deals.slice(startIndex, endIndex);
    
    // Форматируем ответ согласно спецификации
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

// GET /api/v1/deals/{dealId} - Получить сделку по ID (4.6)
router.get('/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const deal = await services.dealService.findById(dealId);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found'
      });
    }

    // Форматируем ответ согласно спецификации
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

// PUT /api/v1/deals/{dealId} - Обновить сделку
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

// DELETE /api/v1/deals/{dealId} - Удалить сделку (4.7)
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
    return res.status(500).json({
      error: 'Failed to delete deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Маршруты для этапов сделок

// POST /api/v1/deals/{dealId}/steps - Создать этап сделки
router.post('/:dealId/steps', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const stepData = req.body;
    
    // Валидация обязательных полей
    if (!stepData.title || !stepData.amount || !stepData.currency) {
      return res.status(400).json({
        error: 'title, amount, and currency are required'
      });
    }
    
    if (stepData.amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than zero'
      });
    }
    
    const step = await services.dealService.createStep(dealId, stepData);
    
    return res.status(201).json(step);
  } catch (error) {
    console.error('Error creating step:', error);
    return res.status(400).json({
      error: 'Failed to create step',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/deals/{dealId}/steps - Получить все этапы сделки
router.get('/:dealId/steps', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const steps = await services.dealService.getSteps(dealId);
    
    return res.json(steps);
  } catch (error) {
    console.error('Error getting steps:', error);
    return res.status(500).json({
      error: 'Failed to get steps',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.1 GET /api/v1/deals/{dealId}/steps/{stepId}/recipients/{recipientId} - Получить реципиента по ID
router.get('/:dealId/steps/:stepId/recipients/:recipientId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId, recipientId } = req.params;
    
    const recipient = await services.dealService.getRecipientById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    return res.json(recipient);
  } catch (error) {
    console.error('Error getting recipient:', error);
    return res.status(500).json({
      error: 'Failed to get recipient',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.2 PUT /api/v1/deals/{dealId}/steps/{stepId}/recipients/{recipientId} - Обновить реципиента
router.put('/:dealId/steps/:stepId/recipients/:recipientId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId, recipientId } = req.params;
    const updateData = req.body;
    
    // Валидация обязательных полей
    if (!updateData.beneficiaryId || !updateData.amount || !updateData.purpose || !updateData.bankDetailsId) {
      return res.status(400).json({
        error: 'beneficiaryId, amount, purpose, and bankDetailsId are required'
      });
    }
    
    if (updateData.amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than zero'
      });
    }
    
    const recipient = await services.dealService.updateRecipient(recipientId, updateData);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    return res.json(recipient);
  } catch (error) {
    console.error('Error updating recipient:', error);
    return res.status(400).json({
      error: 'Failed to update recipient',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.3 DELETE /api/v1/deals/{dealId}/steps/{stepId}/recipients/{recipientId} - Удалить реципиента
router.delete('/:dealId/steps/:stepId/recipients/:recipientId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId, recipientId } = req.params;
    
    const success = await services.dealService.deleteRecipient(recipientId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting recipient:', error);
    return res.status(500).json({
      error: 'Failed to delete recipient',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.4 GET /api/v1/deals/{dealId}/steps/{stepId}/deponents/{beneficiaryId} - Получить депонента
router.get('/:dealId/steps/:stepId/deponents/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId, beneficiaryId } = req.params;
    
    const deponent = await services.dealService.getDeponentByBeneficiaryId(stepId, beneficiaryId);
    
    if (!deponent) {
      return res.status(404).json({
        error: 'Deponent not found'
      });
    }

    return res.json(deponent);
  } catch (error) {
    console.error('Error getting deponent:', error);
    return res.status(500).json({
      error: 'Failed to get deponent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.5 PUT /api/v1/deals/{dealId}/steps/{stepId}/deponents/{beneficiaryId} - Создать или обновить депонента
router.put('/:dealId/steps/:stepId/deponents/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId, beneficiaryId } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Amount is required and must be greater than zero'
      });
    }
    
    const deponentData = {
      stepId,
      beneficiaryId,
      amount
    };
    
    const deponent = await services.dealService.createOrUpdateDeponent(stepId, deponentData);
    
    return res.json(deponent);
  } catch (error) {
    console.error('Error creating/updating deponent:', error);
    return res.status(400).json({
      error: 'Failed to create/update deponent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.6 DELETE /api/v1/deals/{dealId}/steps/{stepId}/deponents/{beneficiaryId} - Удалить депонента
router.delete('/:dealId/steps/:stepId/deponents/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId, beneficiaryId } = req.params;
    
    const success = await services.dealService.deleteDeponentByBeneficiaryId(stepId, beneficiaryId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Deponent not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting deponent:', error);
    return res.status(500).json({
      error: 'Failed to delete deponent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.7 GET /api/v1/deals/{dealId}/steps/{stepId}/deponents - Получить всех депонентов этапа
router.get('/:dealId/steps/:stepId/deponents', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId } = req.params;
    const { offset = 0, limit = 50 } = req.query;
    
    const deponents = await services.dealService.getDeponents(stepId);
    
    // Применяем пагинацию
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedDeponents = deponents.slice(startIndex, endIndex);
    
    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: paginatedDeponents.length,
      total: deponents.length,
      results: paginatedDeponents
    });
  } catch (error) {
    console.error('Error getting deponents:', error);
    return res.status(500).json({
      error: 'Failed to get deponents',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.8 POST /api/v1/deals/{dealId}/steps/{stepId}/recipients/{recipientId}/update-bank-details - Обновить банковские реквизиты реципиента
router.post('/:dealId/steps/:stepId/recipients/:recipientId/update-bank-details', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId, recipientId } = req.params;
    const { bankDetailsId } = req.body;
    
    if (!bankDetailsId) {
      return res.status(400).json({
        error: 'bankDetailsId is required'
      });
    }
    
    const updatedRecipient = await services.dealService.updateRecipientBankDetails(recipientId, bankDetailsId);
    
    if (!updatedRecipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Error updating recipient bank details:', error);
    return res.status(400).json({
      error: 'Failed to update recipient bank details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.9 GET /api/v1/deals/{dealId}/steps/{stepId}/recipients - Получить всех реципиентов этапа
router.get('/:dealId/steps/:stepId/recipients', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId } = req.params;
    const { offset = 0, limit = 50 } = req.query;
    
    const recipients = await services.dealService.getRecipients(stepId);
    
    // Применяем пагинацию
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedRecipients = recipients.slice(startIndex, endIndex);
    
    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: paginatedRecipients.length,
      total: recipients.length,
      results: paginatedRecipients
    });
  } catch (error) {
    console.error('Error getting recipients:', error);
    return res.status(500).json({
      error: 'Failed to get recipients',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 3.10 POST /api/v1/deals/{dealId}/steps/{stepId}/recipients - Создать реципиента
router.post('/:dealId/steps/:stepId/recipients', async (req: Request, res: Response) => {
  try {
    const { dealId, stepId } = req.params;
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const recipientData = req.body;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    // Валидация обязательных полей
    if (!recipientData.beneficiaryId || !recipientData.amount || !recipientData.purpose || !recipientData.bankDetailsId) {
      return res.status(400).json({
        error: 'beneficiaryId, amount, purpose, and bankDetailsId are required'
      });
    }
    
    if (recipientData.amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than zero'
      });
    }
    
    const recipient = await services.dealService.createRecipient(stepId, recipientData);
    
    return res.status(201).json(recipient);
  } catch (error) {
    console.error('Error creating recipient:', error);
    return res.status(400).json({
      error: 'Failed to create recipient',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

// Маршруты управления сделками

// 4.1 POST /api/v1/deals/{dealId}/cancel - Отменить сделку
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

// 4.2 GET /api/v1/deals/{dealId}/is-valid - Проверить валидность сделки
router.get('/:dealId/is-valid', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    const validationResult = await services.dealService.isDealValid(dealId);
    
    return res.json(validationResult);
  } catch (error) {
    console.error('Error validating deal:', error);
    return res.status(500).json({
      error: 'Failed to validate deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 4.3 POST /api/v1/deals/{dealId}/draft - Перевести сделку в статус DRAFT
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

// 4.8 POST /api/v1/deals/{dealId}/accept - Принять сделку
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