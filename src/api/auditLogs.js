import client from './client';

/**
 * GET /audit-logs -> List[AuditLogOut]. admin/manager only — the backend
 * returns 403 for anyone else, this just mirrors the available filters.
 */
export async function listAuditLogs({ action, entityType, entityId, userId, dateFrom, dateTo, limit } = {}) {
  const { data } = await client.get('/audit-logs', {
    params: {
      action,
      entity_type: entityType,
      entity_id: entityId,
      user_id: userId,
      date_from: dateFrom,
      date_to: dateTo,
      limit,
    },
  });
  return data;
}
