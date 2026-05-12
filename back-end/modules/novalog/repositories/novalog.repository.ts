import { pool } from '../../../shared/infra/database/pool';
import type { NovalogEntriesFilters, NovalogEntryPayload, NovalogEntryMode } from '../dtos/novalog.types';

export type NovalogEntryRow = {
  id: string;
  display_id: number | null;
  tenant_id: string;
  reference_month: string;
  week_number: number;
  operation_date: string;
  origin_name: string;
  destination_name: string;
  weight: string | number;
  company_rate_per_ton: string | number;
  company_gross_amount: string | number;
  aggregated_rate_per_ton: string | number;
  aggregated_gross_amount: string | number;
  ticket_number: string | null;
  fuel_station_name: string | null;
  driver_name: string | null;
  vehicle_label: string | null;
  driver_share_percent: string | number;
  driver_share_amount: string | number;
  driver_net_amount: string | number;
  notes: string | null;
  entry_mode: NovalogEntryMode;
  batch_key: string | null;
};

const novalogReturningColumns = `returning id,
               display_id,
               tenant_id,
               reference_month,
               week_number,
               operation_date,
               origin_name,
               destination_name,
               weight,
               company_rate_per_ton,
               company_gross_amount,
               aggregated_rate_per_ton,
               aggregated_gross_amount,
               ticket_number,
               fuel_station_name,
               driver_name,
               vehicle_label,
               driver_share_percent,
               driver_share_amount,
               driver_net_amount,
               notes,
               entry_mode,
               batch_key`;

export async function listTenantNovalogEntries(tenantId: string, filters: NovalogEntriesFilters = {}) {
  const values: unknown[] = [tenantId];
  const whereClauses = ['tenant_id = $1'];

  if (filters.referenceMonth) {
    values.push(filters.referenceMonth);
    whereClauses.push(`reference_month = $${values.length}`);
  }

  const result = await pool.query<NovalogEntryRow>(
    `select id,
            display_id,
            tenant_id,
            reference_month,
            week_number,
            operation_date,
            origin_name,
            destination_name,
            weight,
            company_rate_per_ton,
            company_gross_amount,
            aggregated_rate_per_ton,
            aggregated_gross_amount,
            ticket_number,
            fuel_station_name,
            driver_name,
            vehicle_label,
            driver_share_percent,
            driver_share_amount,
            driver_net_amount,
            notes,
            entry_mode,
            batch_key
     from novalog_operation_entries
     where ${whereClauses.join(' and ')}
     order by operation_date desc, created_at desc`,
    values,
  );

  return result.rows;
}

export async function listTenantNovalogReferenceMonths(tenantId: string) {
  const result = await pool.query<{ reference_month: string }>(
    `select distinct reference_month
     from novalog_operation_entries
     where tenant_id = $1
     order by reference_month desc`,
    [tenantId],
  );

  return result.rows.map((row) => row.reference_month);
}

export async function insertTenantNovalogEntry(payload: NovalogEntryPayload, tenantId: string, userId?: string) {
  const result = await pool.query<NovalogEntryRow>(
    `insert into novalog_operation_entries (
       tenant_id,
       created_by_user_id,
       updated_by_user_id,
       reference_month,
       week_number,
       operation_date,
       origin_name,
       destination_name,
       weight,
       company_rate_per_ton,
       company_gross_amount,
       aggregated_rate_per_ton,
       aggregated_gross_amount,
       ticket_number,
       fuel_station_name,
       driver_name,
       vehicle_label,
       driver_share_percent,
       driver_share_amount,
       driver_net_amount,
       notes,
       entry_mode,
       batch_key
     )
      values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
     ${novalogReturningColumns}`,
    [
      tenantId,
      userId || null,
      payload.referenceMonth,
      payload.weekNumber,
      payload.operationDate,
      payload.originName,
      payload.destinationName,
      payload.weight,
      payload.companyRatePerTon,
      payload.companyGrossAmount,
      payload.aggregatedRatePerTon,
      payload.aggregatedGrossAmount,
      payload.ticketNumber,
      payload.fuelStationName,
      payload.driverName,
      payload.vehicleLabel,
      payload.driverSharePercent,
      payload.driverShareAmount,
      payload.driverNetAmount,
      payload.notes,
      payload.entryMode,
      payload.batchKey,
    ],
  );

  return result.rows[0] || null;
}

export async function insertTenantNovalogEntriesBatch(payloads: NovalogEntryPayload[], tenantId: string, userId?: string) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const inserted: NovalogEntryRow[] = [];

    for (const payload of payloads) {
      const result = await client.query<NovalogEntryRow>(
        `insert into novalog_operation_entries (
           tenant_id,
           created_by_user_id,
           updated_by_user_id,
           reference_month,
           week_number,
           operation_date,
           origin_name,
           destination_name,
           weight,
           company_rate_per_ton,
           company_gross_amount,
           aggregated_rate_per_ton,
           aggregated_gross_amount,
           ticket_number,
           fuel_station_name,
           driver_name,
           vehicle_label,
           driver_share_percent,
           driver_share_amount,
           driver_net_amount,
           notes,
           entry_mode,
           batch_key
         )
          values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ${novalogReturningColumns}`,
        [
          tenantId,
          userId || null,
          payload.referenceMonth,
          payload.weekNumber,
          payload.operationDate,
          payload.originName,
          payload.destinationName,
          payload.weight,
          payload.companyRatePerTon,
          payload.companyGrossAmount,
          payload.aggregatedRatePerTon,
          payload.aggregatedGrossAmount,
          payload.ticketNumber,
          payload.fuelStationName,
          payload.driverName,
          payload.vehicleLabel,
          payload.driverSharePercent,
          payload.driverShareAmount,
          payload.driverNetAmount,
          payload.notes,
          payload.entryMode,
          payload.batchKey,
        ],
      );

      if (result.rows[0]) inserted.push(result.rows[0]);
    }

    await client.query('commit');
    return inserted;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTenantNovalogEntry(id: string, payload: NovalogEntryPayload, tenantId: string, userId?: string) {
  const result = await pool.query<NovalogEntryRow>(
    `update novalog_operation_entries
     set reference_month = $1,
         week_number = $2,
         operation_date = $3,
         origin_name = $4,
         destination_name = $5,
         weight = $6,
         company_rate_per_ton = $7,
         company_gross_amount = $8,
         aggregated_rate_per_ton = $9,
         aggregated_gross_amount = $10,
         ticket_number = $11,
         fuel_station_name = $12,
         driver_name = $13,
         vehicle_label = $14,
         driver_share_percent = $15,
         driver_share_amount = $16,
         driver_net_amount = $17,
         notes = $18,
         entry_mode = $19,
         batch_key = $20,
         updated_by_user_id = $21,
         updated_at = now()
     where id = $22
       and tenant_id = $23
     ${novalogReturningColumns}`,
    [
      payload.referenceMonth,
      payload.weekNumber,
      payload.operationDate,
      payload.originName,
      payload.destinationName,
      payload.weight,
      payload.companyRatePerTon,
      payload.companyGrossAmount,
      payload.aggregatedRatePerTon,
      payload.aggregatedGrossAmount,
      payload.ticketNumber,
      payload.fuelStationName,
      payload.driverName,
      payload.vehicleLabel,
      payload.driverSharePercent,
      payload.driverShareAmount,
      payload.driverNetAmount,
      payload.notes,
      payload.entryMode,
      payload.batchKey,
      userId || null,
      id,
      tenantId,
    ],
  );

  return result.rows[0] || null;
}

export async function deleteTenantNovalogEntry(id: string, tenantId: string) {
  const result = await pool.query<{ id: string }>(
    `delete from novalog_operation_entries
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}
