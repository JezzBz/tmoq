import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

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
    
    // Получаем всех депонентов этапа и ищем по beneficiaryId
    const deponents = await services.dealService.getDeponents(stepId);
    const deponent = deponents.find(d => d.beneficiaryId === beneficiaryId);
    
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
    
    // Получаем всех депонентов этапа и ищем по beneficiaryId
    const deponents = await services.dealService.getDeponents(stepId);
    const deponent = deponents.find(d => d.beneficiaryId === beneficiaryId);
    
    if (!deponent) {
      return res.status(404).json({
        error: 'Deponent not found'
      });
    }
    
    const success = await services.dealService.deleteDeponent(deponent.deponentId);
    
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
    
    const recipient = await services.dealService.getRecipientById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }
    
    const updatedRecipient = await services.dealService.updateRecipient(recipientId, { bankDetailsId });
    
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