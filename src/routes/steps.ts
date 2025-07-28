import { Router, Request, Response } from 'express';

const router: Router = Router();

// GET /api/v1/nominal-accounts/steps - Получить список этапов
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Get all steps',
    data: [],
    timestamp: new Date().toISOString()
  });
});

// GET /api/v1/nominal-accounts/steps/:id - Получить этап по ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Get step with id: ${id}`,
    data: { id },
    timestamp: new Date().toISOString()
  });
});

// PUT /api/v1/nominal-accounts/steps/:id - Обновить этап
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  res.json({
    message: `Step with id ${id} updated successfully`,
    data: { id, ...updateData },
    timestamp: new Date().toISOString()
  });
});

// DELETE /api/v1/nominal-accounts/steps/:id - Удалить этап
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Step with id ${id} deleted successfully`,
    timestamp: new Date().toISOString()
  });
});

// PATCH /api/v1/nominal-accounts/steps/:id/status - Обновить статус этапа
router.patch('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  res.json({
    message: `Step status updated for id ${id}`,
    data: { id, status },
    timestamp: new Date().toISOString()
  });
});

// GET /api/v1/nominal-accounts/steps/:id/deponents - Получить депонентов этапа
router.get('/:id/deponents', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Get deponents for step ${id}`,
    data: [],
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/nominal-accounts/steps/:id/deponents - Добавить депонента к этапу
router.post('/:id/deponents', (req: Request, res: Response) => {
  const { id } = req.params;
  const deponentData = req.body;
  res.status(201).json({
    message: `Deponent added to step ${id}`,
    data: deponentData,
    timestamp: new Date().toISOString()
  });
});

// GET /api/v1/nominal-accounts/steps/:id/recipients - Получить реципиентов этапа
router.get('/:id/recipients', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    message: `Get recipients for step ${id}`,
    data: [],
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/nominal-accounts/steps/:id/recipients - Добавить реципиента к этапу
router.post('/:id/recipients', (req: Request, res: Response) => {
  const { id } = req.params;
  const recipientData = req.body;
  res.status(201).json({
    message: `Recipient added to step ${id}`,
    data: recipientData,
    timestamp: new Date().toISOString()
  });
});

export default router; 