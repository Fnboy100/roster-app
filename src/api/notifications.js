import client from './client';

/** GET /notifications?unread_only= -> List[NotificationOut] */
export async function listNotifications({ unreadOnly } = {}) {
  const { data } = await client.get('/notifications', { params: { unread_only: unreadOnly } });
  return data;
}

/** POST /notifications/{id}/read -> NotificationOut */
export async function markRead(notificationId) {
  const { data } = await client.post(`/notifications/${notificationId}/read`);
  return data;
}

/** POST /notifications/read-all -> { marked_read: number } */
export async function markAllRead() {
  const { data } = await client.post('/notifications/read-all');
  return data;
}
