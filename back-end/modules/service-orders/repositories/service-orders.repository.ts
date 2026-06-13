import { pool } from '../../../shared/infra/database/pool';

export type ServiceOrderItemRow = {
  id: string;
  service_order_id: string;
  item_type: 'part' | 'labor';
  description: string;
  quantity: string | number;
  unit_amount: string | number;
  total_amount: string | number;
  supplier_name: string | null;
  notes: string | null;
};

export type ServiceOrderRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  vehicle_id: string;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'canceled';
  opened_on: string;
  closed_on: string | null;
  odometer: string | number | null;
  provider_name: string | null;
  description: string;
  total_amount: string | number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: ServiceOrderItemRow[];
};

const orderColumns = `
  service_orders.id,
  service_orders.display_id,
  service_orders.tenant_id,
  service_orders.vehicle_id,
  vehicles.name as vehicle_name,
  vehicles.plate as vehicle_plate,
  service_orders.status,
  to_char(service_orders.opened_on, 'YYYY-MM-DD') as opened_on,
  to_char(service_orders.closed_on, 'YYYY-MM-DD') as closed_on,
  service_orders.odometer,
  service_orders.provider_name,
  service_orders.description,
  service_orders.total_amount,
  service_orders.notes,
  service_orders.created_at,
  service_orders.updated_at
`;

const itemColumns = `
  id,
  service_order_id,
  item_type,
  description,
  quantity,
  unit_amount,
  total_amount,
  supplier_name,
  notes
`;

type ServiceOrderItemPayload = {
  itemType: 'part' | 'labor';
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  supplierName: string | null;
  notes: string | null;
};

type ServiceOrderPayload = {
  vehicleId: string;
  status: string;
  openedOn: string;
  closedOn: string | null;
  odometer: number | null;
  providerName: string | null;
  description: string;
  totalAmount: number;
  notes: string | null;
  items: ServiceOrderItemPayload[];
};

async function attachItems(orders: ServiceOrderRow[]) {
  if (orders.length === 0) return orders;

  const ids = orders.map((order) => order.id);
  const itemsResult = await pool.query<ServiceOrderItemRow>(
    `select ${itemColumns}
     from service_order_items
     where service_order_id = any($1::uuid[])
     order by created_at asc`,
    [ids],
  );

  const itemsByOrder = new Map<string, ServiceOrderItemRow[]>();
  for (const item of itemsResult.rows) {
    const group = itemsByOrder.get(item.service_order_id) || [];
    group.push(item);
    itemsByOrder.set(item.service_order_id, group);
  }

  return orders.map((order) => ({ ...order, items: itemsByOrder.get(order.id) || [] }));
}

export async function listTenantServiceOrders(tenantId?: string) {
  const result = await pool.query<ServiceOrderRow>(
    `select ${orderColumns}
     from service_orders
     left join vehicles on vehicles.id = service_orders.vehicle_id
     where service_orders.tenant_id = $1
     order by service_orders.opened_on desc, service_orders.created_at desc`,
    [tenantId],
  );

  return attachItems(result.rows);
}

export async function findTenantServiceOrder(id: string, tenantId?: string) {
  const result = await pool.query<ServiceOrderRow>(
    `select ${orderColumns}
     from service_orders
     left join vehicles on vehicles.id = service_orders.vehicle_id
     where service_orders.id = $1
       and service_orders.tenant_id = $2
     limit 1`,
    [id, tenantId],
  );

  if (!result.rows[0]) return null;
  const [withItems] = await attachItems([result.rows[0]]);
  return withItems;
}

export async function findVehicleBelongsToTenant(vehicleId: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `select id from vehicles where id = $1 and tenant_id = $2 limit 1`,
    [vehicleId, tenantId],
  );

  return result.rows[0] || null;
}

async function insertItems(
  client: { query: typeof pool.query },
  tenantId: string,
  serviceOrderId: string,
  items: ServiceOrderItemPayload[],
) {
  for (const item of items) {
    await client.query(
      `insert into service_order_items (
        tenant_id,
        service_order_id,
        item_type,
        description,
        quantity,
        unit_amount,
        total_amount,
        supplier_name,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenantId,
        serviceOrderId,
        item.itemType,
        item.description,
        item.quantity,
        item.unitAmount,
        item.totalAmount,
        item.supplierName,
        item.notes,
      ],
    );
  }
}

export async function insertTenantServiceOrder(payload: ServiceOrderPayload, tenantId?: string, userId?: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const orderResult = await client.query<{ id: string }>(
      `insert into service_orders (
        tenant_id,
        created_by_user_id,
        updated_by_user_id,
        vehicle_id,
        status,
        opened_on,
        closed_on,
        odometer,
        provider_name,
        description,
        total_amount,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      returning id`,
      [
        tenantId,
        userId || null,
        userId || null,
        payload.vehicleId,
        payload.status,
        payload.openedOn,
        payload.closedOn,
        payload.odometer,
        payload.providerName,
        payload.description,
        payload.totalAmount,
        payload.notes,
      ],
    );

    const orderId = orderResult.rows[0]?.id;
    if (orderId) {
      await insertItems(client, tenantId as string, orderId, payload.items);
    }

    await client.query('commit');
    return orderId ? findTenantServiceOrder(orderId, tenantId) : null;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTenantServiceOrder(
  id: string,
  payload: ServiceOrderPayload,
  tenantId?: string,
  userId?: string,
) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const orderResult = await client.query<{ id: string }>(
      `update service_orders
       set vehicle_id = $1,
           status = $2,
           opened_on = $3,
           closed_on = $4,
           odometer = $5,
           provider_name = $6,
           description = $7,
           total_amount = $8,
           notes = $9,
           updated_by_user_id = $10,
           updated_at = now()
       where id = $11
         and tenant_id = $12
       returning id`,
      [
        payload.vehicleId,
        payload.status,
        payload.openedOn,
        payload.closedOn,
        payload.odometer,
        payload.providerName,
        payload.description,
        payload.totalAmount,
        payload.notes,
        userId || null,
        id,
        tenantId,
      ],
    );

    const orderId = orderResult.rows[0]?.id;
    if (!orderId) {
      await client.query('rollback');
      return undefined;
    }

    await client.query(`delete from service_order_items where service_order_id = $1 and tenant_id = $2`, [orderId, tenantId]);
    await insertItems(client, tenantId as string, orderId, payload.items);

    await client.query('commit');
    return findTenantServiceOrder(orderId, tenantId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteTenantServiceOrder(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from service_orders
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}
