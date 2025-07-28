import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

// GET /api/v1/transfers - Получить список переводов
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, currency, minAmount, maxAmount, startDate, endDate } = req.query;
    const options = {
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where: {} as any
    };

    if (status) options.where.status = status;
    if (currency) options.where.currency = currency;

    let transfers;
    if (minAmount && maxAmount) {
      transfers = await services.transferService.getTransfersByAmountRange(
        Number(minAmount), 
        Number(maxAmount)
      );
    } else if (startDate && endDate) {
      transfers = await services.transferService.getTransfersByDateRange(
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else {
      transfers = await services.transferService.findAll(options);
    }
    
    res.json({
      message: 'Transfers retrieved successfully',
      data: transfers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: transfers.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting transfers:', error);
    res.status(500).json({
      error: 'Failed to get transfers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/transfers/:id - Получить перевод по ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id);
    
    if (isNaN(transferId)) {
      return res.status(400).json({
        error: 'Invalid transfer ID',
        message: 'Transfer ID must be a number'
      });
    }

    const transfer = await services.transferService.findById(transferId);
    
    if (!transfer) {
      return res.status(404).json({
        error: 'Transfer not found',
        message: `Transfer with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Transfer retrieved successfully',
      data: transfer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting transfer:', error);
    return res.status(500).json({
      error: 'Failed to get transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/transfers - Создать новый перевод
router.post('/', async (req: Request, res: Response) => {
  try {
    const transferData = req.body;
    
    const transfer = await services.transferService.createTransfer(transferData);
    
    return res.status(201).json({
      message: 'Transfer created successfully',
      data: transfer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return res.status(400).json({
      error: 'Failed to create transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/v1/transfers/:id - Обновить перевод
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id);
    const updateData = req.body;
    
    if (isNaN(transferId)) {
      return res.status(400).json({
        error: 'Invalid transfer ID',
        message: 'Transfer ID must be a number'
      });
    }

    const transfer = await services.transferService.updateTransfer(transferId, updateData);
    
    if (!transfer) {
      return res.status(404).json({
        error: 'Transfer not found',
        message: `Transfer with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Transfer updated successfully',
      data: transfer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating transfer:', error);
    return res.status(400).json({
      error: 'Failed to update transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/transfers/:id - Удалить перевод
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id);
    
    if (isNaN(transferId)) {
      return res.status(400).json({
        error: 'Invalid transfer ID',
        message: 'Transfer ID must be a number'
      });
    }

    const deleted = await services.transferService.deleteTransfer(transferId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Transfer not found',
        message: `Transfer with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Transfer deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    return res.status(500).json({
      error: 'Failed to delete transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/transfers/:id/execute - Выполнить перевод
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id);
    
    if (isNaN(transferId)) {
      return res.status(400).json({
        error: 'Invalid transfer ID',
        message: 'Transfer ID must be a number'
      });
    }

    const transfer = await services.transferService.executeTransfer(transferId);
    
    return res.json({
      message: 'Transfer executed successfully',
      data: transfer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing transfer:', error);
    return res.status(400).json({
      error: 'Failed to execute transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/transfers/:id/retry - Повторить неуспешный перевод
router.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id);
    
    if (isNaN(transferId)) {
      return res.status(400).json({
        error: 'Invalid transfer ID',
        message: 'Transfer ID must be a number'
      });
    }

    const transfer = await services.transferService.retryTransfer(transferId);
    
    return res.json({
      message: 'Transfer retry initiated successfully',
      data: transfer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrying transfer:', error);
    return res.status(400).json({
      error: 'Failed to retry transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/transfers/:id/cancel - Отменить перевод
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id);
    
    if (isNaN(transferId)) {
      return res.status(400).json({
        error: 'Invalid transfer ID',
        message: 'Transfer ID must be a number'
      });
    }

    const transfer = await services.transferService.cancelTransfer(transferId);
    
    return res.json({
      message: 'Transfer cancelled successfully',
      data: transfer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    return res.status(400).json({
      error: 'Failed to cancel transfer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/transfers/beneficiary/:beneficiaryId - Получить переводы бенефициара
router.get('/beneficiary/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.params;
    const beneficiaryIdNum = parseInt(beneficiaryId);
    
    if (isNaN(beneficiaryIdNum)) {
      return res.status(400).json({
        error: 'Invalid beneficiary ID',
        message: 'Beneficiary ID must be a number'
      });
    }

    const transfers = await services.transferService.getTransfersByBeneficiary(beneficiaryIdNum);
    
    return res.json({
      message: 'Beneficiary transfers retrieved successfully',
      data: transfers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting beneficiary transfers:', error);
    return res.status(500).json({
      error: 'Failed to get beneficiary transfers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/transfers/:id/info - Получить информацию о переводе
router.get('/:id/info', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transferId = parseInt(id);
    
    if (isNaN(transferId)) {
      return res.status(400).json({
        error: 'Invalid transfer ID',
        message: 'Transfer ID must be a number'
      });
    }

    const transferInfo = await services.transferService.getTransferInfo(transferId);
    
    return res.json({
      message: 'Transfer info retrieved successfully',
      data: transferInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting transfer info:', error);
    return res.status(500).json({
      error: 'Failed to get transfer info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/transfers/check-possibility - Проверить возможность перевода
router.post('/check-possibility', async (req: Request, res: Response) => {
  try {
    const { fromBeneficiaryId, toBeneficiaryId, amount, currency } = req.body;
    
    if (!fromBeneficiaryId || !toBeneficiaryId || !amount || !currency) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'From beneficiary ID, to beneficiary ID, amount, and currency are required'
      });
    }

    const possibility = await services.transferService.checkTransferPossibility(
      fromBeneficiaryId, 
      toBeneficiaryId, 
      amount, 
      currency
    );
    
    return res.json({
      message: 'Transfer possibility checked successfully',
      data: possibility,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking transfer possibility:', error);
    return res.status(400).json({
      error: 'Failed to check transfer possibility',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/transfers/statistics - Получить статистику переводов
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const { beneficiaryId } = req.query;
    
    const statistics = await services.transferService.getTransferStatistics(
      beneficiaryId ? parseInt(beneficiaryId as string) : undefined
    );
    
    return res.json({
      message: 'Transfer statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting transfer statistics:', error);
    return res.status(500).json({
      error: 'Failed to get transfer statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 