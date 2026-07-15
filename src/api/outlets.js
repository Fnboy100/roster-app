import client from './client';

/** GET /outlets?is_active= -> List[OutletOut] */
export async function listOutlets({ isActive } = {}) {
  const { data } = await client.get('/outlets', { params: { is_active: isActive } });
  return data;
}

/** POST /outlets (admin only) -> OutletOut. payload: { name, code, address? } */
export async function createOutlet(payload) {
  const { data } = await client.post('/outlets', payload);
  return data;
}
