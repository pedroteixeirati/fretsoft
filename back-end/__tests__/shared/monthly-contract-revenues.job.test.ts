import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMonthlyRecurringRevenueJobRunner,
  getMonthlyRecurringRevenueJobKey,
  shouldRunMonthlyRecurringRevenueJob,
} from '../../shared/infra/jobs/monthly-contract-revenues.job.ts';

test('job mensal gera chave por competencia no formato ano-mes', () => {
  assert.equal(getMonthlyRecurringRevenueJobKey(new Date('2026-04-01T10:00:00')), '2026-04');
});

test('job mensal deve rodar no dia 1 quando ainda nao executou a competencia', () => {
  assert.equal(shouldRunMonthlyRecurringRevenueJob(new Date('2026-04-01T08:00:00'), null), true);
  assert.equal(shouldRunMonthlyRecurringRevenueJob(new Date('2026-04-01T08:00:00'), '2026-03'), true);
});

test('job mensal nao deve rodar fora do dia 1 nem repetir a mesma competencia', () => {
  assert.equal(shouldRunMonthlyRecurringRevenueJob(new Date('2026-04-06T08:00:00'), null), false);
  assert.equal(shouldRunMonthlyRecurringRevenueJob(new Date('2026-04-01T08:00:00'), '2026-04'), false);
});

test('runner registra a competencia executada e evita segunda execucao no mesmo mes', async () => {
  const executions: string[] = [];
  const logger = { info: () => undefined, error: () => undefined };
  let scheduledHandler: (() => void) | null = null;
  const runner = createMonthlyRecurringRevenueJobRunner(
    async (referenceDate) => {
      executions.push(referenceDate.toISOString());
      return 1;
    },
    () => new Date('2026-04-01T09:00:00'),
    logger,
    (handler) => {
      scheduledHandler = handler;
      return {
        start: () => undefined,
        stop: () => undefined,
      };
    }
  );

  runner.start();
  assert.equal(typeof scheduledHandler, 'function');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(executions.length, 1);
  assert.equal(runner.getLastRunKey(), '2026-04');
  assert.equal(await runner.tick(), 0);
  assert.equal(executions.length, 1);
});
