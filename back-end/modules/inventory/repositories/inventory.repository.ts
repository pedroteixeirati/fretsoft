import { pool } from '../../../shared/infra/database/pool';

export type InventoryItemRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  code: string | null;
  name: string;
  category: string | null;
  unit_cost: string | number;
  quantity: string | number;
  min_quantity: string | number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryMovementRow = {
  id: string;
  inventory_item_id: string;
  item_name: string | null;
  movement_type: 'in' | 'out';
  quantity: string | number;
  unit_cost: string | number | null;
  occurred_on: string;
  reason: string | null;
  service_order_id: string | null;
  notes: string | null;
  created_at: string;
};

const itemColumns = `
  id,
  display_id,
  tenant_id,
  code,
  name,
  category,
  unit_cost,
  quantity,
  min_quantity,
  notes,
  created_at,
  updated_at
`;

const movementColumns = `
  inventory_movements.id,
  inventory_movements.inventory_item_id,
  inventory_items.name as item_name,
  inventory_movements.movement_type,
  inventory_movements.quantity,
  inventory_movements.unit_cost,
  to_char(inventory_movements.occurred_on, 'YYYY-MM-DD') as occurred_on,
  inventory_movements.reason,
  inventory_movements.service_order_id,
  inventory_movements.notes,
  inventory_movements.created_at
`;

export async function listTenantInventoryItems(tenantId?: string) {
  const result = await pool.query<InventoryItemRow>(
    `select ${itemColumns}
     from inventory_items
     where tenant_id = $1
     order by name asc`,
    [tenantId],
  );

  return result.rows;
}

export async function findTenantInventoryItem(id: string, tenantId?: string) {
  const result = await pool.query<InventoryItemRow>(
    `select ${itemColumns}
     from inventory_items
     where id = $1
       and tenant_id = $2
     limit 1`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}

export async function listInventoryMovements(itemId: string, tenantId?: string) {
  const result = await pool.query<InventoryMovementRow>(
    `select ${movementColumns}
     from inventory_movements
     left join inventory_items on inventory_items.id = inventory_movements.inventory_item_id
     where inventory_movements.tenant_id = $1
       and inventory_movements.inventory_item_id = $2
     order by inventory_movements.occurred_on desc, inventory_movements.created_at desc`,
    [tenantId, itemId],
  );

  return result.rows;
}

export async function insertTenantInventoryItem(
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const initialQuantity = Number(payload.quantity) || 0;
    const result = await client.query<{ id: string }>(
      `insert into inventory_items (
        tenant_id,
        created_by_user_id,
        updated_by_user_id,
        code,
        name,
        category,
        unit_cost,
        quantity,
        min_quantity,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning id`,
      [
        tenantId,
        userId || null,
        userId || null,
        payload.code,
        payload.name,
        payload.category,
        payload.unitCost,
        initialQuantity,
        payload.minQuantity,
        payload.notes,
      ],
    );

    const itemId = result.rows[0]?.id;
    if (itemId && initialQuantity > 0) {
      await client.query(
        `insert into inventory_movements (
          tenant_id, inventory_item_id, movement_type, quantity, unit_cost, occurred_on, reason, created_by_user_id
        )
        values ($1, $2, 'in', $3, $4, current_date, 'Saldo inicial', $5)`,
        [tenantId, itemId, initialQuantity, payload.unitCost, userId || null],
      );
    }

    await client.query('commit');
    return itemId ? findTenantInventoryItem(itemId, tenantId) : null;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTenantInventoryItem(
  id: string,
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const result = await pool.query<{ id: string }>(
    `update inventory_items
     set code = $1,
         name = $2,
         category = $3,
         unit_cost = $4,
         min_quantity = $5,
         notes = $6,
         updated_by_user_id = $7,
         updated_at = now()
     where id = $8
       and tenant_id = $9
     returning id`,
    [
      payload.code,
      payload.name,
      payload.category,
      payload.unitCost,
      payload.minQuantity,
      payload.notes,
      userId || null,
      id,
      tenantId,
    ],
  );

  const itemId = result.rows[0]?.id;
  return itemId ? findTenantInventoryItem(itemId, tenantId) : null;
}

export async function deleteTenantInventoryItem(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from inventory_items
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}

export async function registerInventoryMovement(
  payload: {
    inventoryItemId: string;
    movementType: 'in' | 'out';
    quantity: number;
    unitCost: number | null;
    occurredOn: string;
    reason: string | null;
    serviceOrderId: string | null;
    notes: string | null;
  },
  tenantId?: string,
  userId?: string,
) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const itemResult = await client.query<{ id: string; quantity: string | number }>(
      `select id, quantity
       from inventory_items
       where id = $1
         and tenant_id = $2
       for update`,
      [payload.inventoryItemId, tenantId],
    );

    const item = itemResult.rows[0];
    if (!item) {
      await client.query('rollback');
      return { status: 'not_found' as const };
    }

    const currentQuantity = Number(item.quantity) || 0;
    const delta = payload.movementType === 'in' ? payload.quantity : -payload.quantity;
    const nextQuantity = currentQuantity + delta;

    if (nextQuantity < 0) {
      await client.query('rollback');
      return { status: 'insufficient' as const, available: currentQuantity };
    }

    await client.query(
      `insert into inventory_movements (
        tenant_id, inventory_item_id, movement_type, quantity, unit_cost, occurred_on, reason, service_order_id, notes, created_by_user_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tenantId,
        payload.inventoryItemId,
        payload.movementType,
        payload.quantity,
        payload.unitCost,
        payload.occurredOn,
        payload.reason,
        payload.serviceOrderId,
        payload.notes,
        userId || null,
      ],
    );

    await client.query(
      `update inventory_items
       set quantity = $1,
           updated_by_user_id = $2,
           updated_at = now()
       where id = $3
         and tenant_id = $4`,
      [nextQuantity, userId || null, payload.inventoryItemId, tenantId],
    );

    await client.query('commit');
    const updated = await findTenantInventoryItem(payload.inventoryItemId, tenantId);
    return { status: 'ok' as const, item: updated };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
