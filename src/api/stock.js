import client from './client';

/** POST /stock/restock (admin, storekeeper) -> StockMovementOut. payload: { item_id, department_id, quantity, reason? } */
export async function restock(payload) {
  const { data } = await client.post('/stock/restock', payload);
  return data;
}

/** POST /stock/wastage -> StockMovementOut. payload: { item_id, department_id, quantity, reason } (reason required) */
export async function recordWastage(payload) {
  const { data } = await client.post('/stock/wastage', payload);
  return data;
}

/** POST /stock/return -> [StockMovementOut, StockMovementOut] (outgoing dept leg, incoming store leg). payload: { item_id, department_id, quantity, reason } */
export async function recordReturn(payload) {
  const { data } = await client.post('/stock/return', payload);
  return data;
}

/**
 * POST /stock/adjustment (admin, manager, outlet_manager, storekeeper) -> StockMovementOut.
 * payload: { item_id, department_id, quantity_delta, reason } — quantity_delta is signed (+/-), reason required.
 */
export async function recordAdjustment(payload) {
  const { data } = await client.post('/stock/adjustment', payload);
  return data;
}

/**
 * GET /stock/movements -> List[StockMovementOut].
 * filters: departmentId, itemId, movementType ('issue'|'restock'|'return'|'wastage'|'adjustment'|'transfer'), performedById, dateFrom, dateTo.
 */
export async function listMovements({ departmentId, itemId, movementType, performedById, dateFrom, dateTo } = {}) {
  const { data } = await client.get('/stock/movements', {
    params: {
      department_id: departmentId,
      item_id: itemId,
      movement_type: movementType,
      performed_by_id: performedById,
      date_from: dateFrom,
      date_to: dateTo,
    },
  });
  return data;
}

// Mirrors app/models/stock_movement.py's MovementType enum exactly.
export const MOVEMENT_TYPE = {
  ISSUE: 'issue',
  RESTOCK: 'restock',
  RETURN: 'return',
  WASTAGE: 'wastage',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
};
