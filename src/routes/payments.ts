import { Router, Request, Response } from 'express';

const router: Router = Router();

// GET /api/v1/nominal-accounts/payments - Получить список платежей
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Get all payments',
    data: [],
    timestamp: new Date().toISOString()
  });
});

// GET /api/v1/nominal-accounts/payments/:id - Получить платеж по ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Get payment with id: ${id}`,
    data: { id },
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/nominal-accounts/payments - Создать новый платеж
router.post('/', (req: Request, res: Response) => {
  const paymentData = req.body;
  res.status(201).json({
    message: 'Payment created successfully',
    data: paymentData,
    timestamp: new Date().toISOString()
  });
});

// PUT /api/v1/nominal-accounts/payments/:id - Обновить платеж
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  res.json({
    message: `Payment with id ${id} updated successfully`,
    data: { id, ...updateData },
    timestamp: new Date().toISOString()
  });
});

// DELETE /api/v1/nominal-accounts/payments/:id - Удалить платеж
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Payment with id ${id} deleted successfully`,
    timestamp: new Date().toISOString()
  });
});

// PATCH /api/v1/nominal-accounts/payments/:id/status - Обновить статус платежа
router.patch('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  res.json({
    message: `Payment status updated for id ${id}`,
    data: { id, status },
    timestamp: new Date().toISOString()
  });
});

export default router; 