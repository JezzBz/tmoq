import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import database configuration
import { initializeDatabase } from './config/database';

// Import routes
import nominalAccountsRoutes from './routes/nominal-accounts';
import beneficiariesRoutes from './routes/beneficiaries';
import dealsRoutes from './routes/deals';
import paymentsRoutes from './routes/payments';
import stepsRoutes from './routes/steps';
import bankDetailsRoutes from './routes/bankDetails';
import balancesRoutes from './routes/balances';
import transfersRoutes from './routes/transfers';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/v1/nominal-accounts', nominalAccountsRoutes);
app.use('/api/v1/beneficiaries', beneficiariesRoutes);
app.use('/api/v1/deals', dealsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/steps', stepsRoutes);
app.use('/api/v1/bank-details', bankDetailsRoutes);
app.use('/api/v1/balances', balancesRoutes);
app.use('/api/v1/transfers', transfersRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api/v1`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 