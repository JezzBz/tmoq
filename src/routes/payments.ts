import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

// GET /api/v1/payments - Получить список платежей
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, dealId, currency, minAmount, maxAmount } = req.query;
    const options = {
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where: {} as any
    };

    if (status) options.where.status = status;
    if (dealId) options.where.dealId = parseInt(dealId as string);
    if (currency) options.where.currency = currency;

    let payments;
    if (minAmount && maxAmount) {
      payments = await services.paymentService.findByAmountRange(
        Number(minAmount), 
        Number(maxAmount)
      );
    } else {
      payments = await services.paymentService.findAll(options);
    }
    
    res.json({
      message: 'Payments retrieved successfully',
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: payments.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({
      error: 'Failed to get payments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/payments/:id - Получить платеж по ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        error: 'Invalid payment ID',
        message: 'Payment ID must be a number'
      });
    }

    const payment = await services.paymentService.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: `Payment with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Payment retrieved successfully',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting payment:', error);
    return res.status(500).json({
      error: 'Failed to get payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/payments - Создать новый платеж
router.post('/', async (req: Request, res: Response) => {
  try {
    const paymentData = req.body;
    
    const payment = await services.paymentService.createPayment(paymentData);
    
    return res.status(201).json({
      message: 'Payment created successfully',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(400).json({
      error: 'Failed to create payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/v1/payments/:id - Обновить платеж
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);
    const updateData = req.body;
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        error: 'Invalid payment ID',
        message: 'Payment ID must be a number'
      });
    }

    const payment = await services.paymentService.updatePayment(paymentId, updateData);
    
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: `Payment with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Payment updated successfully',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return res.status(400).json({
      error: 'Failed to update payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/payments/:id - Удалить платеж
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        error: 'Invalid payment ID',
        message: 'Payment ID must be a number'
      });
    }

    const deleted = await services.paymentService.deletePayment(paymentId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Payment not found',
        message: `Payment with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Payment deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return res.status(500).json({
      error: 'Failed to delete payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/payments/:id/process - Обработать платеж
router.post('/:id/process', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        error: 'Invalid payment ID',
        message: 'Payment ID must be a number'
      });
    }

    const payment = await services.paymentService.processPayment(paymentId);
    
    return res.json({
      message: 'Payment processed successfully',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(400).json({
      error: 'Failed to process payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/payments/:id/retry - Повторить неуспешный платеж
router.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        error: 'Invalid payment ID',
        message: 'Payment ID must be a number'
      });
    }

    const payment = await services.paymentService.retryPayment(paymentId);
    
    return res.json({
      message: 'Payment retry initiated successfully',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    return res.status(400).json({
      error: 'Failed to retry payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/payments/:id/cancel - Отменить платеж
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        error: 'Invalid payment ID',
        message: 'Payment ID must be a number'
      });
    }

    const payment = await services.paymentService.cancelPayment(paymentId);
    
    return res.json({
      message: 'Payment cancelled successfully',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    return res.status(400).json({
      error: 'Failed to cancel payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/payments/identify-deposit - Идентифицировать пополнение
router.post('/identify-deposit', async (req: Request, res: Response) => {
  try {
    const { amount, currency, description } = req.body;
    
    if (!amount || !currency) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Amount and currency are required'
      });
    }

    const payment = await services.paymentService.identifyDeposit(amount, currency, description);
    
    return res.json({
      message: 'Deposit identification completed',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error identifying deposit:', error);
    return res.status(400).json({
      error: 'Failed to identify deposit',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/payments/execute-to-beneficiary - Выполнить платеж в пользу бенефициара
router.post('/execute-to-beneficiary', async (req: Request, res: Response) => {
  try {
    const { dealId, beneficiaryId, amount, currency, description } = req.body;
    
    if (!dealId || !beneficiaryId || !amount || !currency) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Deal ID, beneficiary ID, amount, and currency are required'
      });
    }

    const payment = await services.paymentService.executePaymentToBeneficiary(
      dealId, 
      beneficiaryId, 
      amount, 
      currency, 
      description
    );
    
    return res.status(201).json({
      message: 'Payment to beneficiary executed successfully',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing payment to beneficiary:', error);
    return res.status(400).json({
      error: 'Failed to execute payment to beneficiary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/payments/statistics - Получить статистику платежей
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.query;
    
    const statistics = await services.paymentService.getPaymentStatistics(
      dealId ? parseInt(dealId as string) : undefined
    );
    
    return res.json({
      message: 'Payment statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting payment statistics:', error);
    return res.status(500).json({
      error: 'Failed to get payment statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 