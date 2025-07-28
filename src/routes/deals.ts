import { Router, Request, Response } from 'express';
import { services } from '../config/services';

const router: Router = Router();

// GET /api/v1/deals - Получить список сделок
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, beneficiaryId, minAmount, maxAmount } = req.query;
    const options = {
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where: {} as any
    };

    if (status) options.where.status = status;
    if (beneficiaryId) options.where.beneficiaryId = parseInt(beneficiaryId as string);

    let deals;
    if (minAmount && maxAmount) {
      deals = await services.dealService.findByAmountRange(
        Number(minAmount), 
        Number(maxAmount)
      );
    } else {
      deals = await services.dealService.findAll(options);
    }
    
    res.json({
      message: 'Deals retrieved successfully',
      data: deals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: deals.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting deals:', error);
    res.status(500).json({
      error: 'Failed to get deals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/deals/:id - Получить сделку по ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        message: 'Deal ID must be a number'
      });
    }

    const deal = await services.dealService.findById(dealId);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found',
        message: `Deal with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Deal retrieved successfully',
      data: deal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting deal:', error);
    return res.status(500).json({
      error: 'Failed to get deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/deals - Создать новую сделку
router.post('/', async (req: Request, res: Response) => {
  try {
    const dealData = req.body;
    
    const deal = await services.dealService.createDeal(dealData);
    
    return res.status(201).json({
      message: 'Deal created successfully',
      data: deal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    return res.status(400).json({
      error: 'Failed to create deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/v1/deals/:id - Обновить сделку
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealId = parseInt(id);
    const updateData = req.body;
    
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        message: 'Deal ID must be a number'
      });
    }

    const deal = await services.dealService.updateDeal(dealId, updateData);
    
    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found',
        message: `Deal with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Deal updated successfully',
      data: deal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating deal:', error);
    return res.status(400).json({
      error: 'Failed to update deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/deals/:id - Удалить сделку
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        message: 'Deal ID must be a number'
      });
    }

    const deleted = await services.dealService.deleteDeal(dealId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Deal not found',
        message: `Deal with ID ${id} not found`
      });
    }

    return res.json({
      message: 'Deal deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return res.status(500).json({
      error: 'Failed to delete deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/deals/:id/confirm - Подтвердить сделку
router.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        message: 'Deal ID must be a number'
      });
    }

    const deal = await services.dealService.confirmDeal(dealId);
    
    return res.json({
      message: 'Deal confirmed successfully',
      data: deal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error confirming deal:', error);
    return res.status(400).json({
      error: 'Failed to confirm deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/deals/:id/complete - Завершить сделку
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        message: 'Deal ID must be a number'
      });
    }

    const deal = await services.dealService.completeDeal(dealId);
    
    return res.json({
      message: 'Deal completed successfully',
      data: deal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing deal:', error);
    return res.status(400).json({
      error: 'Failed to complete deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/deals/:id/cancel - Отменить сделку
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        message: 'Deal ID must be a number'
      });
    }

    const deal = await services.dealService.cancelDeal(dealId);
    
    return res.json({
      message: 'Deal cancelled successfully',
      data: deal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error cancelling deal:', error);
    return res.status(400).json({
      error: 'Failed to cancel deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/deals/:id/steps - Получить этапы сделки
router.get('/:id/steps', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        message: 'Deal ID must be a number'
      });
    }

    const steps = await services.dealService.getSteps(dealId);
    
    return res.json({
      message: 'Steps retrieved successfully',
      data: steps,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting steps:', error);
    return res.status(500).json({
      error: 'Failed to get steps',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/deals/:id/payments - Получить платежи сделки
router.get('/:id/payments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dealId = parseInt(id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Invalid deal ID',
        message: 'Deal ID must be a number'
      });
    }

    const payments = await services.dealService.getPayments(dealId);
    
    return res.json({
      message: 'Payments retrieved successfully',
      data: payments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    return res.status(500).json({
      error: 'Failed to get payments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 