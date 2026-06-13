import cron from 'node-cron';

const MONTHLY_RECURRING_PAYABLE_CRON = '10 0 1 * *';
const JOB_TIMEZONE = 'America/Sao_Paulo';

type CronTask = {
  start: () => void;
  stop: () => void;
};

async function defaultRunJob(referenceDate: Date) {
  const { generateRecurringPayablesForMonth } = await import('../../../modules/recurring-payables/services/recurring-payables.service.ts');
  return generateRecurringPayablesForMonth(referenceDate);
}

export function getMonthlyRecurringPayableJobKey(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function shouldRunMonthlyRecurringPayableJob(referenceDate: Date, lastRunKey?: string | null) {
  if (referenceDate.getDate() !== 1) {
    return false;
  }

  return getMonthlyRecurringPayableJobKey(referenceDate) !== lastRunKey;
}

export function createMonthlyRecurringPayableJobRunner(
  runJob: (referenceDate: Date) => Promise<number> = defaultRunJob,
  nowFactory: () => Date = () => new Date(),
  logger: Pick<Console, 'info' | 'error'> = console,
  scheduleCron: (handler: () => void) => CronTask = (handler) =>
    cron.schedule(MONTHLY_RECURRING_PAYABLE_CRON, handler, {
      timezone: JOB_TIMEZONE,
    })
) {
  let lastRunKey: string | null = null;

  const tick = async () => {
    const now = nowFactory();
    if (!shouldRunMonthlyRecurringPayableJob(now, lastRunKey)) {
      return 0;
    }

    const runKey = getMonthlyRecurringPayableJobKey(now);

    try {
      const created = await runJob(now);
      lastRunKey = runKey;
      logger.info(`[jobs] Despesas recorrentes mensais executadas para ${runKey}: ${created} conta(s) a pagar criada(s).`);
      return created;
    } catch (error) {
      logger.error('[jobs] Falha ao executar job de despesas recorrentes mensais:', error);
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
