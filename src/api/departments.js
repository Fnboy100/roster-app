import client from './client';

/** GET /departments?outlet_id=&is_active= -> List[DepartmentOut]. Backend defaults is_active to true. */
export async function listDepartments({ outletId, isActive } = {}) {
  const { data } = await client.get('/departments', { params: { outlet_id: outletId, is_active: isActive } });
  return data;
}

/** POST /departments (admin only) -> DepartmentOut. payload: { outlet_id, name, code } */
export async function createDepartment(payload) {
  const { data } = await client.post('/departments', payload);
  return data;
}
