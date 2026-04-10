import cors from 'cors';
import express from 'express';
import authRouter from '../../../modules/auth/controllers/auth.controller';
import contractsRouter from '../../../modules/contracts/controllers/contracts.controller';
import cargasRouter from '../../../modules/cargas/controllers/cargas.controller';
import expensesRouter from '../../../modules/expenses/controllers/expenses.controller';
import freightsRouter from '../../../modules/freights/controllers/freights.controller';
import payablesRouter from '../../../modules/payables/controllers/payables.controller';
import providersRouter from '../../../modules/providers/controllers/providers.controller';
import revenuesRouter from '../../../modules/revenues/controllers/revenues.controller';
import resourcesRouter from '../../../modules/resources/controllers/resources.controller';
import { errorHandler } from '../../http/error-handler';
import tenantsRouter from '../../../modules/tenants/controllers/tenants.controller';
import usersRouter from '../../../modules/users/controllers/users.controller';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api', authRouter);
app.use('/api', tenantsRouter);
app.use('/api', usersRouter);
app.use('/api', contractsRouter);
app.use('/api', cargasRouter);
app.use('/api', freightsRouter);
app.use('/api', expensesRouter);
app.use('/api', payablesRouter);
app.use('/api', providersRouter);
app.use('/api/revenues', revenuesRouter);
app.use('/api', resourcesRouter);

app.use(errorHandler);

export default app;
