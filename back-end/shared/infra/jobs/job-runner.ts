import { createMonthlyRecurringRevenueJobRunner } from './monthly-contract-revenues.job.ts';

export function startBackgroundJobs() {
  const monthlyRecurringRevenueJob = createMonthlyRecurringRevenueJobRunner();
  const monthlyRecurringRevenueCronTask = monthlyRecurringRevenueJob.start();
  return {
    monthlyRecurringRevenueJob,
    timers: [monthlyRecurringRevenueCronTask],
  };
}
