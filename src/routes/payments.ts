import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

/**
 * GET /api/v1/payments
 * Получение списка платежей с пагинацией
 * 
 * @param {number} req.query.offset - Смещение (по умолчанию: 0)
 * @param {number} req.query.limit - Лимит записей (по умолчанию: 50)
 * 
 * @returns {Object} 200 - Список платежей с метаданными пагинации
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { offset = 0, limit = 50 } = req.query;
    
    const payments = await services.paymentService.findAll();
    
    // Применение пагинации на уровне приложения
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedPayments = payments.slice(startIndex, endIndex);
    
    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: paginatedPayments.length,
      total: payments.length,
      results: paginatedPayments
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    return res.status(500).json({
      error: 'Failed to get payments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/payments
 * Создание нового платежа
 * 
 * @param {string} req.headers['idempotency-key'] - Ключ идемпотентности (обязательный)
 * @param {Object} req.body - Данные платежа
 * @param {string} req.body.type - Тип платежа
 * @param {number} req.body.amount - Сумма платежа
 * @param {string} req.body.currency - Валюта платежа
 * @param {string} req.body.description - Описание платежа
 * @param {string} req.body.purpose - Назначение платежа
 * @param {string} req.body.accountNumber - Номер счета
 * @param {string} req.body.uin - УИН
 * @param {number} req.body.tax - Налог
 * @param {string} req.body.stepId - Идентификатор этапа
 * @param {string} req.body.recipientId - Идентификатор реципиента
 * @param {string} req.body.beneficiaryId - Идентификатор бенефициара
 * @param {string} req.body.dealId - Идентификатор сделки
 * @param {string} req.body.bankDetailsId - Идентификатор банковских реквизитов
 * 
 * @returns {Object} 201 - Созданный платеж
 * @returns {Object} 400 - Ошибка валидации
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const paymentData = req.body;
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }
    
    if (!paymentData.type || !paymentData.amount || !paymentData.currency) {
      return res.status(400).json({
        error: 'type, amount, and currency are required'
      });
    }
    
    if (paymentData.amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than zero'
      });
    }
    
    const payment = await services.paymentService.createPayment(paymentData);
    
    return res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(400).json({
      error: 'Failed to create payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/payments/{paymentId}
 * Получение платежа по идентификатору
 * 
 * @param {string} req.params.paymentId - Идентификатор платежа
 * 
 * @returns {Object} 200 - Данные платежа
 * @returns {Object} 404 - Платеж не найден
 * @returns {Object} 500 - Ошибка сервера
 */
router.get('/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await services.paymentService.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    return res.json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    return res.status(500).json({
      error: 'Failed to get payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/v1/payments/{paymentId}
 * Обновление данных платежа
 * 
 * @param {string} req.params.paymentId - Идентификатор платежа
 * @param {Object} req.body - Данные для обновления
 * 
 * @returns {Object} 200 - Обновленный платеж
 * @returns {Object} 404 - Платеж не найден
 * @returns {Object} 400 - Ошибка валидации
 */
router.put('/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const updateData = req.body;
    
    const payment = await services.paymentService.updatePayment(paymentId, updateData);
    
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    return res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return res.status(400).json({
      error: 'Failed to update payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/v1/payments/{paymentId}
 * Удаление платежа
 * 
 * @param {string} req.params.paymentId - Идентификатор платежа
 * 
 * @returns {Object} 204 - Платеж успешно удален
 * @returns {Object} 404 - Платеж не найден
 * @returns {Object} 400 - Ошибка бизнес-логики
 */
router.delete('/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    const success = await services.paymentService.deletePayment(paymentId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting payment:', error);
    return res.status(400).json({
      error: 'Failed to delete payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/payments/{paymentId}/execute
 * Выполнение платежа
 * 
 * @param {string} req.params.paymentId - Идентификатор платежа
 * 
 * @returns {Object} 200 - Платеж успешно выполнен
 * @returns {Object} 404 - Платеж не найден
 * @returns {Object} 400 - Ошибка выполнения
 */
router.post('/:paymentId/execute', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await services.paymentService.executePayment(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Error executing payment:', error);
    return res.status(400).json({
      error: 'Failed to execute payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/payments/{paymentId}/cancel
 * Отмена платежа
 * 
 * @param {string} req.params.paymentId - Идентификатор платежа
 * 
 * @returns {Object} 200 - Платеж успешно отменен
 * @returns {Object} 404 - Платеж не найден
 * @returns {Object} 400 - Ошибка отмены
 */
router.post('/:paymentId/cancel', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await services.paymentService.cancelPayment(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Error cancelling payment:', error);
    return res.status(400).json({
      error: 'Failed to cancel payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 