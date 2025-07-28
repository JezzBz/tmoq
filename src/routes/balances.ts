import { Router, Request, Response } from 'express';

const router: Router = Router();

// GET /api/v1/nominal-accounts/balances - Получить список балансов
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Get all balances',
    data: [],
    timestamp: new Date().toISOString()
  });
});

// GET /api/v1/nominal-accounts/balances/:accountId - Получить баланс по ID счета
router.get('/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  res.json({
    message: `Get balance for account: ${accountId}`,
    data: { accountId },
    timestamp: new Date().toISOString()
  });
});

// GET /api/v1/nominal-accounts/balances/:accountId/holds - Получить холды по счету
router.get('/:accountId/holds', (req: Request, res: Response) => {
  const { accountId } = req.params;
  res.json({
    message: `Get holds for account: ${accountId}`,
    data: [],
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/nominal-accounts/balances/:accountId/holds - Создать холд на счете
router.post('/:accountId/holds', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const holdData = req.body;
  res.status(201).json({
    message: `Hold created for account ${accountId}`,
    data: holdData,
    timestamp: new Date().toISOString()
  });
});

// DELETE /api/v1/nominal-accounts/balances/:accountId/holds/:holdId - Удалить холд
router.delete('/:accountId/holds/:holdId', (req: Request, res: Response) => {
  const { accountId, holdId } = req.params;
  res.json({
    message: `Hold ${holdId} removed from account ${accountId}`,
    timestamp: new Date().toISOString()
  });
});

export default router; 