import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboard';
import incomeEnginesRoutes from './routes/incomeEngines';
import assetsRoutes from './routes/assets';
import liabilitiesRoutes from './routes/liabilities';
import simulatorRoutes from './routes/simulator';
import settingsRoutes from './routes/settings';
import expensesRoutes from './routes/expenses';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
import dashboardV2Routes from './routes/dashboard-v2';
app.use('/api/dashboard', dashboardV2Routes); // V2 uses new formulas
app.use('/api/dashboard/v1', dashboardRoutes); // V1 for backward compatibility
app.use('/api/income-engines', incomeEnginesRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/liabilities', liabilitiesRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/expenses', expensesRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Financial Freedom Navigator API running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
});

export default app;
