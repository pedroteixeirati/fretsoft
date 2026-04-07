import cron from 'node-cron';

const MONTHLY_RECURRING_REVENUE_CRON = '5 0 1 * *';
const JOB_TIMEZONE = 'America/Sao_Paulo';

type CronTask = {
  start: () => void;
  stop: () => void;
};

async function defaultRunJob(referenceDate: Date) {
  const { createScheduledRecurringRevenues } = await import('../../../modules/revenues/services/revenues.service.ts');
  return createScheduledRecurringRevenues(referenceDate);
}

export function getMonthlyRecurringRevenueJobKey(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function shouldRunMonthlyRecurringRevenueJob(referenceDate: Date, lastRunKey?: string | null) {
  if (referenceDate.getDate() !== 1) {
    return false;
  }

  return getMonthlyRecurringRevenueJobKey(referenceDate) !== lastRunKey;
}

export function createMonthlyRecurringRevenueJobRunner(
  runJob: (referenceDate: Date) => Promise<number> = defaultRunJob,
  nowFactory: () => Date = () => new Date(),
  logger: Pick<Console, 'info' | 'error'> = console,
  scheduleCron: (handler: () => void) => CronTask = (handler) =>
    cron.schedule(MONTHLY_RECURRING_REVENUE_CRON, handler, {
      timezone: JOB_TIMEZONE,
    })
) {
  let lastRunKey: string | null = null;

  const tick = async () => {
    const now = nowFactory();
    if (!shouldRunMonthlyRecurringRevenueJob(now, lastRunKey)) {
      return 0;
    }

    const runKey = getMonthlyRecurringRevenueJobKey(now);

    try {
      const created = await runJob(now);
      lastRunKey = runKey;
      logger.info(`[jobs] Receitas recorrentes mensais executadas para ${runKey}: ${created} criada(s).`);
      return created;
    } catch (error) {
      logger.error('[jobs] Falha ao executar job de receitas recorrentes mensais:', error);
      return 0;
    }
  };

  const start = () => {
    void tick();
    const task = scheduleCron(() => {
      void tick();
    });
    return task;
  };

  return {
    start,
    tick,
    getLastRunKey: () => lastRunKey,
  };
}
