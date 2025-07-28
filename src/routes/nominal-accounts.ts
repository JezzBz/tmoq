import { Router, Request, Response } from 'express';

// Import sub-routes
import beneficiariesRoutes from './beneficiaries';
import paymentsRoutes from './payments';
import dealsRoutes from './deals';
import stepsRoutes from './steps';
import bankDetailsRoutes from './bankDetails';
import transfersRoutes from './transfers';
import balancesRoutes from './balances';

const router: Router = Router();

// Mount sub-routes
router.use('/beneficiaries', beneficiariesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/deals', dealsRoutes);
router.use('/steps', stepsRoutes);
router.use('/bank-details', bankDetailsRoutes);
router.use('/transfers', transfersRoutes);
router.use('/balances', balancesRoutes);

// Root endpoint for nominal-accounts
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Nominal Accounts API',
    version: '1.0.0',
    endpoints: {
      beneficiaries: '/api/v1/nominal-accounts/beneficiaries',
      payments: '/api/v1/nominal-accounts/payments',
      deals: '/api/v1/nominal-accounts/deals',
      steps: '/api/v1/nominal-accounts/steps',
      bankDetails: '/api/v1/nominal-accounts/bank-details',
      transfers: '/api/v1/nominal-accounts/transfers',
      balances: '/api/v1/nominal-accounts/balances'
    }
  });
});

export default router; 