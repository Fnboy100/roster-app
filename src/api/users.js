import client from './client';

/** GET /users?department_id=&is_active= -> List[UserOut]. admin/manager only. */
export async function listUsers({ departmentId, isActive } = {}) {
  const { data } = await client.get('/users', { params: { department_id: departmentId, is_active: isActive } });
  return data;
}

/** GET /users/{id} -> UserOut. admin/manager only. */
export async function getUser(userId) {
  const { data } = await client.get(`/users/${userId}`);
  return data;
}

/** PATCH /users/{id} -> UserOut. admin/manager only. payload: { department_id?, outlet_id? } */
export async function updateUser(userId, payload) {
  const { data } = await client.patch(`/users/${userId}`, payload);
  return data;
}

/** DELETE /users/{id} -> UserOut. admin/manager only. Deactivates (soft-delete), not a permanent removal. */
export async function deactivateUser(userId) {
  const { data } = await client.delete(`/users/${userId}`);
  return data;
}

/** POST /users/{id}/reactivate -> UserOut. admin/manager only. */
export async function reactivateUser(userId) {
  const { data } = await client.post(`/users/${userId}/reactivate`);
  return data;
}
