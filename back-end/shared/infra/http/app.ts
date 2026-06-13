import cors from 'cors';
import express from 'express';
import authRouter from '../../../modules/auth/controllers/auth.controller';
import cargoInsurancePoliciesRouter from '../../../modules/cargo-insurance-policies/controllers/cargo-insurance-policies.controller';
import companiesRouter from '../../../modules/companies/controllers/companies.controller';
import contractsRouter from '../../../modules/contracts/controllers/contracts.controller';
import cargasRouter from '../../../modules/cargas/controllers/cargas.controller';
import expensesRouter from '../../../modules/expenses/controllers/expenses.controller';
import fiscalRouter from '../../../modules/fiscal/controllers/fiscal.controller';
import nfseRouter from '../../../modules/fiscal/controllers/nfse.controller';
import freightsRouter from '../../../modules/freights/controllers/freights.controller';
import novalogRouter from '../../../modules/novalog/controllers/novalog.controller';
import payablesRouter from '../../../modules/payables/controllers/payables.controller';
import recurringPayablesRouter from '../../../modules/recurring-payables/controllers/recurring-payables.controller';
import providersRouter from '../../../modules/providers/controllers/providers.controller';
import revenuesRouter from '../../../modules/revenues/controllers/revenues.controller';
import resourcesRouter from '../../../modules/resources/controllers/resources.controller';
import { errorHandler } from '../../http/error-handler';
import tenantsRouter from '../../../modules/tenants/controllers/tenants.controller';
import tenantFeaturesRouter from '../../../modules/tenant-features/controllers/tenant-features.controller';
import transportPartnersRouter from '../../../modules/transport-partners/controllers/transport-partners.controller';
import usersRouter from '../../../modules/users/controllers/users.controller';
import vehiclesRouter from '../../../modules/vehicles/controllers/vehicles.controller';
import vehicleDocumentsRouter from '../../../modules/vehicle-documents/controllers/vehicle-documents.controller';
import serviceOrdersRouter from '../../../modules/service-orders/controllers/service-orders.controller';
import inventoryRouter from '../../../modules/inventory/controllers/inventory.controller';
import maintenanceInspectionsRouter from '../../../modules/maintenance-inspections/controllers/maintenance-inspections.controller';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api', authRouter);
app.use('/api', cargoInsurancePoliciesRouter);
app.use('/api', tenantsRouter);
app.use('/api', usersRouter);
app.use('/api', vehiclesRouter);
app.use('/api', vehicleDocumentsRouter);
app.use('/api', serviceOrdersRouter);
app.use('/api', inventoryRouter);
app.use('/api', maintenanceInspectionsRouter);
app.use('/api', companiesRouter);
app.use('/api', contractsRouter);
app.use('/api', cargasRouter);
app.use('/api', freightsRouter);
app.use('/api', novalogRouter);
app.use('/api', expensesRouter);
app.use('/api', fiscalRouter);
app.use('/api', nfseRouter);
app.use('/api', tenantFeaturesRouter);
app.use('/api', transportPartnersRouter);
app.use('/api', payablesRouter);
app.use('/api', recurringPayablesRouter);
app.use('/api', providersRouter);
app.use('/api/revenues', revenuesRouter);
app.use('/api', resourcesRouter);

app.use(errorHandler);

export default app;
