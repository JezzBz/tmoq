import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

// 2.1 GET /api/v1/payments - Получить список платежей
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      beneficiaryId, 
      dealId, 
      accountNumber, 
      offset = 0, 
      limit = 50 
    } = req.query;

    // Валидация accountNumber
    if (accountNumber && !/^(\d{20}|\d{22})$/.test(accountNumber as string)) {
      return res.status(400).json({
        error: 'Invalid account number format',
        message: 'Account number must be 20 or 22 digits'
      });
    }

    const [payments, total] = await services.paymentService.findPayments({
      beneficiaryId: beneficiaryId as string,
      dealId: dealId as string,
      accountNumber: accountNumber as string,
      offset: Number(offset),
      limit: Number(limit)
    });

    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: payments.length,
      total,
      results: payments
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    return res.status(500).json({
      error: 'Failed to get payments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.2 POST /api/v1/payments - Создать платеж
router.post('/', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const paymentData = req.body;

    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }

    // Валидация обязательных полей
    if (!paymentData.type || !paymentData.beneficiaryId || !paymentData.accountNumber || 
        !paymentData.amount || !paymentData.purpose) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'type, beneficiaryId, accountNumber, amount, and purpose are required'
      });
    }

    const payment = await services.paymentService.createPayment(paymentData, idempotencyKey);
    
    return res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(400).json({
      error: 'Failed to create payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.3 GET /api/v1/virtual-accounts/holds - Получить список холдов
router.get('/virtual-accounts/holds', async (req: Request, res: Response) => {
  try {
    const { 
      accountNumber, 
      beneficiaryId, 
      offset = 0, 
      limit = 50 
    } = req.query;

    // Валидация accountNumber
    if (!accountNumber || !/^(\d{20}|\d{22})$/.test(accountNumber as string)) {
      return res.status(400).json({
        error: 'Invalid account number format',
        message: 'Account number must be 20 or 22 digits'
      });
    }

    const [holds, total] = await services.balanceService.findHolds({
      accountNumber: accountNumber as string,
      beneficiaryId: beneficiaryId as string,
      offset: Number(offset),
      limit: Number(limit)
    });

    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: holds.length,
      total,
      results: holds
    });
  } catch (error) {
    console.error('Error getting holds:', error);
    return res.status(500).json({
      error: 'Failed to get holds',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.4 GET /api/v1/incoming-transactions - Получить список входящих транзакций
router.get('/incoming-transactions', async (req: Request, res: Response) => {
  try {
    const { 
      accountNumber, 
      offset = 0, 
      limit = 50 
    } = req.query;

    // Валидация accountNumber
    if (!accountNumber || !/^(\d{20}|\d{22})$/.test(accountNumber as string)) {
      return res.status(400).json({
        error: 'Invalid account number format',
        message: 'Account number must be 20 or 22 digits'
      });
    }

    const [transactions, total] = await services.paymentService.findIncomingTransactions({
      accountNumber: accountNumber as string,
      offset: Number(offset),
      limit: Number(limit)
    });

    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: transactions.length,
      total,
      results: transactions
    });
  } catch (error) {
    console.error('Error getting incoming transactions:', error);
    return res.status(500).json({
      error: 'Failed to get incoming transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.5 POST /api/v1/payments/{paymentId}/retry - Повторить неуспешный платеж
router.post('/:paymentId/retry', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const retryPaymentId = await services.paymentService.retryPayment(paymentId);
    
    return res.json({
      retryPaymentId
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    return res.status(400).json({
      error: 'Failed to retry payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.6 POST /api/v1/incoming-transactions/{operationId}/identify - Идентифицировать операцию пополнения
router.post('/incoming-transactions/:operationId/identify', async (req: Request, res: Response) => {
  try {
    const { operationId } = req.params;
    const { amountDistribution } = req.body;

    if (!amountDistribution || !Array.isArray(amountDistribution)) {
      return res.status(400).json({
        error: 'Invalid amount distribution',
        message: 'amountDistribution must be an array'
      });
    }

    const result = await services.paymentService.identifyIncomingTransaction(operationId, amountDistribution);
    
    return res.json(result);
  } catch (error) {
    console.error('Error identifying incoming transaction:', error);
    return res.status(400).json({
      error: 'Failed to identify incoming transaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.7 GET /api/v1/virtual-accounts/transfers/{transferId} - Получить информацию о переводе
router.get('/virtual-accounts/transfers/:transferId', async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;

    const transfer = await services.transferService.findById(transferId);
    
    if (!transfer) {
      return res.status(404).json({
        error: 'Transfer not found'
      });
    }

    return res.json(transfer);
  } catch (error) {
    console.error('Error getting transfer:', error);
    return res.status(500).json({
      error: 'Failed to get transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.8 GET /api/v1/virtual-accounts/transfers - Получить список переводов
router.get('/virtual-accounts/transfers', async (req: Request, res: Response) => {
  try {
    const { 
      accountNumber, 
      dealId, 
      fromBeneficiaryId, 
      toBeneficiaryId, 
      limit = 50, 
      offset = 0 
    } = req.query;

    // Валидация accountNumber
    if (!accountNumber || !/^(\d{20}|\d{22})$/.test(accountNumber as string)) {
      return res.status(400).json({
        error: 'Invalid account number format',
        message: 'Account number must be 20 or 22 digits'
      });
    }

    if (!fromBeneficiaryId) {
      return res.status(400).json({
        error: 'fromBeneficiaryId is required'
      });
    }

    const [transfers, total] = await services.transferService.findTransfers({
      accountNumber: accountNumber as string,
      dealId: dealId as string,
      fromBeneficiaryId: fromBeneficiaryId as string,
      toBeneficiaryId: toBeneficiaryId as string,
      offset: Number(offset),
      limit: Number(limit)
    });

    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: transfers.length,
      total,
      results: transfers
    });
  } catch (error) {
    console.error('Error getting transfers:', error);
    return res.status(500).json({
      error: 'Failed to get transfers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.9 POST /api/v1/virtual-accounts/transfers - Создать перевод
router.post('/virtual-accounts/transfers', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const transferData = req.body;

    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required'
      });
    }

    // Валидация обязательных полей
    if (!transferData.accountNumber || !transferData.from || !transferData.to || 
        !transferData.amount || !transferData.purpose) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'accountNumber, from, to, amount, and purpose are required'
      });
    }

    const transfer = await services.transferService.createTransfer(transferData, idempotencyKey);
    
    return res.status(201).json(transfer);
  } catch (error) {
    console.error('Error creating transfer:', error);
    return res.status(400).json({
      error: 'Failed to create transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 2.10 GET /api/v1/payments/{paymentId} - Получить платеж по ID
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

// 2.11 GET /api/v1/virtual-accounts/balances - Получить балансы виртуальных счетов
router.get('/virtual-accounts/balances', async (req: Request, res: Response) => {
  try {
    const { 
      accountNumber, 
      beneficiaryId, 
      offset = 0, 
      limit = 50 
    } = req.query;

    // Валидация accountNumber
    if (!accountNumber || !/^(\d{20}|\d{22})$/.test(accountNumber as string)) {
      return res.status(400).json({
        error: 'Invalid account number format',
        message: 'Account number must be 20 or 22 digits'
      });
    }

    const [balances, total] = await services.balanceService.findBalances({
      accountNumber: accountNumber as string,
      beneficiaryId: beneficiaryId as string,
      offset: Number(offset),
      limit: Number(limit)
    });

    return res.json({
      offset: Number(offset),
      limit: Number(limit),
      size: balances.length,
      total,
      results: balances
    });
  } catch (error) {
    console.error('Error getting balances:', error);
    return res.status(500).json({
      error: 'Failed to get balances',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 