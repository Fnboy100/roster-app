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
