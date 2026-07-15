import client from './client';

/** GET /items?is_active=&category= -> List[ItemOut] */
export async function listItems({ isActive, category } = {}) {
  const { data } = await client.get('/items', { params: { is_active: isActive, category } });
  return data;
}

/** GET /items/{id} -> ItemOut */
export async function getItem(itemId) {
  const { data } = await client.get(`/items/${itemId}`);
  return data;
}

/** POST /items (admin, storekeeper) -> ItemOut. payload: { name, sku, unit, category? } */
export async function createItem(payload) {
  const { data } = await client.post('/items', payload);
  return data;
}

/** PATCH /items/{id} (admin, storekeeper) -> ItemOut. payload: partial { name, unit, category, is_active } */
export async function updateItem(itemId, payload) {
  const { data } = await client.patch(`/items/${itemId}`, payload);
  return data;
}

/** GET /items/thresholds?department_id=&item_id= -> List[ThresholdOut]. department_id omitted = every department you can see. */
export async function listThresholds({ departmentId, itemId } = {}) {
  const { data } = await client.get('/items/thresholds', { params: { department_id: departmentId, item_id: itemId } });
  return data;
}

/**
 * POST /items/thresholds (admin, manager, outlet_manager, storekeeper) -> ThresholdOut.
 * payload: { item_id, department_id, min_quantity, reorder_quantity } — reorder_quantity must be >= min_quantity.
 */
export async function upsertThreshold(payload) {
  const { data } = await client.post('/items/thresholds', payload);
  return data;
}

/** GET /items/balances?department_id=&item_id= -> List[InventoryBalanceOut] */
export async function listBalances({ departmentId, itemId } = {}) {
  const { data } = await client.get('/items/balances', { params: { department_id: departmentId, item_id: itemId } });
  return data;
}

/** GET /items/low-stock?department_id= -> List[LowStockAlert] */
export async function getLowStockAlerts({ departmentId } = {}) {
  const { data } = await client.get('/items/low-stock', { params: { department_id: departmentId } });
  return data;
}
