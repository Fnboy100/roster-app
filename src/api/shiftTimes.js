import client from './client';

/**
 * GET /roster/shift-times?department_id= -> DepartmentShiftTimesOut
 *   { department_id, am: {start_time, end_time, label, is_overnight}, pm: {...}, is_default, updated_at }
 * Returns the built-in defaults (is_default: true) until a manager/admin saves their own.
 */
export async function getShiftTimes({ departmentId } = {}) {
  const { data } = await client.get('/roster/shift-times', { params: { department_id: departmentId } });
  return data;
}

/**
 * PUT /roster/shift-times?department_id= (admin/manager only) -> DepartmentShiftTimesOut.
 * payload: { am: { start_time: "HH:MM", end_time: "HH:MM" },
 *            pm: { start_time: "HH:MM", end_time: "HH:MM" or null } }   (PM end_time null = until close)
 * 422 { detail: string } on invalid times.
 */
export async function saveShiftTimes(departmentId, payload) {
  const { data } = await client.put('/roster/shift-times', payload, { params: { department_id: departmentId } });
  return data;
}
