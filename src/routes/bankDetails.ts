import { Router, Request, Response } from 'express';

const router: Router = Router();

// GET /api/v1/nominal-accounts/bank-details - Получить список банковских реквизитов
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Get all bank details',
    data: [],
    timestamp: new Date().toISOString()
  });
});

// GET /api/v1/nominal-accounts/bank-details/:id - Получить банковские реквизиты по ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Get bank details with id: ${id}`,
    data: { id },
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/nominal-accounts/bank-details - Создать новые банковские реквизиты
router.post('/', (req: Request, res: Response) => {
  const bankDetailsData = req.body;
  res.status(201).json({
    message: 'Bank details created successfully',
    data: bankDetailsData,
    timestamp: new Date().toISOString()
  });
});

// PUT /api/v1/nominal-accounts/bank-details/:id - Обновить банковские реквизиты
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  res.json({
    message: `Bank details with id ${id} updated successfully`,
    data: { id, ...updateData },
    timestamp: new Date().toISOString()
  });
});

// DELETE /api/v1/nominal-accounts/bank-details/:id - Удалить банковские реквизиты
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Bank details with id ${id} deleted successfully`,
    timestamp: new Date().toISOString()
  });
});

// PATCH /api/v1/nominal-accounts/bank-details/:id/default - Установить как дефолтные
router.patch('/:id/default', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Bank details ${id} set as default`,
    data: { id, isDefault: true },
    timestamp: new Date().toISOString()
  });
});

export default router; 