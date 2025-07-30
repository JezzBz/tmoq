import { Router, Request, Response } from 'express';

// Import sub-routes
import beneficiariesRoutes from './beneficiaries';
import paymentsRoutes from './payments';
import dealsRoutes from './deals';

const router: Router = Router();

// Mount sub-routes
router.use('/beneficiaries', beneficiariesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/deals', dealsRoutes);

// Root endpoint for nominal-accounts
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Nominal Accounts API',
    version: '1.0.0',
    endpoints: {
      beneficiaries: '/api/v1/nominal-accounts/beneficiaries',
      payments: '/api/v1/nominal-accounts/payments',
      deals: '/api/v1/nominal-accounts/deals'
    }
  });
});

export default router; 