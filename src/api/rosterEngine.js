import client from './client';

// --- Shift templates -----------------------------------------------------------

/** GET /roster/engine/shift-templates?department_id=&include_inactive= -> List[ShiftTemplateOut] */
export async function listShiftTemplates({ departmentId, includeInactive } = {}) {
  const { data } = await client.get('/roster/engine/shift-templates', {
    params: { department_id: departmentId, include_inactive: includeInactive },
  });
  return data;
}

/**
 * POST /roster/engine/shift-templates?department_id= (admin/manager) -> ShiftTemplateOut.
 * payload: { code, label, start_time?, end_time?, nominal_hours, is_split?, is_closing?, counts_as_off?, color?, sort_order? }
 */
export async function createShiftTemplate(departmentId, payload) {
  const { data } = await client.post('/roster/engine/shift-templates', payload, { params: { department_id: departmentId } });
  return data;
}

/** PATCH /roster/engine/shift-templates/{id} -> ShiftTemplateOut */
export async function updateShiftTemplate(templateId, payload) {
  const { data } = await client.patch(`/roster/engine/shift-templates/${templateId}`, payload);
  return data;
}

// --- Coverage rules -----------------------------------------------------------

/** GET /roster/engine/coverage-rules?department_id= -> List[CoverageRuleOut] */
export async function listCoverageRules(departmentId) {
  const { data } = await client.get('/roster/engine/coverage-rules', { params: { department_id: departmentId } });
  return data;
}

/**
 * PUT /roster/engine/coverage-rules?department_id= (admin/manager) -> CoverageRuleOut. Upserts one role's rule.
 * payload: { role, min_staff_per_day?, off_days_per_week?, target_weekly_hours?, max_weekly_hours?,
 *            max_consecutive_closing?, allow_split?, is_senior_rotation?, is_active? }
 */
export async function upsertCoverageRule(departmentId, payload) {
  const { data } = await client.put('/roster/engine/coverage-rules', payload, { params: { department_id: departmentId } });
  return data;
}

// --- Catalog seeding -----------------------------------------------------------

/** POST /roster/engine/ensure-default-catalog?department_id= (admin/manager) -> 204. Idempotent. */
export async function ensureDefaultCatalog(departmentId) {
  await client.post('/roster/engine/ensure-default-catalog', null, { params: { department_id: departmentId } });
}

// --- Generation -----------------------------------------------------------

/**
 * POST /roster/engine/generate -> { period: RosterPeriodOut, validation: ValidationReportOut }.
 * payload: { department_id?, week_start, week_end, week_label, seed? }
 * Regenerating the same department+week without an explicit seed reproduces
 * the same schedule; pass a seed to force a reshuffle.
 */
export async function generateFloorRoster(payload) {
  const { data } = await client.post('/roster/engine/generate', payload);
  return data;
}

/** POST /roster/engine/periods/{id}/submit-for-approval -> RosterPeriodOut */
export async function submitDraftForApproval(periodId) {
  const { data } = await client.post(`/roster/engine/periods/${periodId}/submit-for-approval`);
  return data;
}

/**
 * PATCH /roster/engine/periods/{periodId}/entries/{entryId}/override -> the updated entry (only while status is 'draft').
 * payload: { shift_code }
 */
export async function overrideEntry(periodId, entryId, shiftCode) {
  const { data } = await client.patch(`/roster/engine/periods/${periodId}/entries/${entryId}/override`, { shift_code: shiftCode });
  return data;
}

/** GET /roster/engine/periods/{id}/validation -> ValidationReportOut. Safe to call any time, including after manual overrides. */
export async function getValidationReport(periodId) {
  const { data } = await client.get(`/roster/engine/periods/${periodId}/validation`);
  return data;
}
