import { createMonthlyRecurringRevenueJobRunner } from './monthly-contract-revenues.job.ts';
import { createMonthlyRecurringPayableJobRunner } from './monthly-recurring-payables.job.ts';

export function startBackgroundJobs() {
  const monthlyRecurringRevenueJob = createMonthlyRecurringRevenueJobRunner();
  const monthlyRecurringRevenueCronTask = monthlyRecurringRevenueJob.start();
  const monthlyRecurringPayableJob = createMonthlyRecurringPayableJobRunner();
  const monthlyRecurringPayableCronTask = monthlyRecurringPayableJob.start();
  return {
    monthlyRecurringRevenueJob,
    monthlyRecurringPayableJob,
    timers: [monthlyRecurringRevenueCronTask, monthlyRecurringPayableCronTask],
  };
}
