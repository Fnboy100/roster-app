import client from './client';

/** GET /daily-closings/summary?closing_date=&department_id= -> ClosingSummaryOut. closing_date is an ISO date string (YYYY-MM-DD). */
export async function getClosingSummary({ closingDate, departmentId }) {
  const { data } = await client.get('/daily-closings/summary', {
    params: { closing_date: closingDate, department_id: departmentId },
  });
  return data;
}

/** POST /daily-closings -> DailyClosingOut. payload: { department_id?, closing_date, notes? } */
export async function createClosing(payload) {
  const { data } = await client.post('/daily-closings', payload);
  return data;
}

/** GET /daily-closings?department_id=&date_from=&date_to= -> List[DailyClosingOut]. dates are ISO date strings. */
export async function listClosings({ departmentId, dateFrom, dateTo } = {}) {
  const { data } = await client.get('/daily-closings', {
    params: { department_id: departmentId, date_from: dateFrom, date_to: dateTo },
  });
  return data;
}

/** GET /daily-closings/{id} -> DailyClosingOut */
export async function getClosing(closingId) {
  const { data } = await client.get(`/daily-closings/${closingId}`);
  return data;
}
