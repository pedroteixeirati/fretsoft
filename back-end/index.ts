import app from './shared/infra/http/app';
import { config } from './shared/config/env';
import { pool } from './shared/infra/database/pool';
import { startBackgroundJobs } from './shared/infra/jobs/job-runner';

async function start() {
  await pool.query('select 1');
  startBackgroundJobs();
  app.listen(config.port, () => {
    console.log(`API Nova Log escutando na porta ${config.port}`);
  });
}

start().catch((error) => {
  console.error('Falha ao iniciar API:', error);
  process.exit(1);
});
