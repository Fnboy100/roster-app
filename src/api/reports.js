import client from './client';

/** GET /reports/dashboard?department_id= -> DashboardSummaryOut */
export async function getDashboardSummary({ departmentId } = {}) {
  const { data } = await client.get('/reports/dashboard', { params: { department_id: departmentId } });
  return data;
}

/** GET /reports/movements-summary?department_id=&date_from=&date_to= -> List[MovementSummaryOut] */
export async function getMovementSummary({ departmentId, dateFrom, dateTo } = {}) {
  const { data } = await client.get('/reports/movements-summary', {
    params: { department_id: departmentId, date_from: dateFrom, date_to: dateTo },
  });
  return data;
}

/** GET /reports/requisitions-summary?department_id=&date_from=&date_to= -> List[RequisitionStatusSummaryOut] */
export async function getRequisitionStatusSummary({ departmentId, dateFrom, dateTo } = {}) {
  const { data } = await client.get('/reports/requisitions-summary', {
    params: { department_id: departmentId, date_from: dateFrom, date_to: dateTo },
  });
  return data;
}

/** GET /reports/wastage?department_id=&date_from=&date_to= -> List[WastageReportRow] */
export async function getWastageReport({ departmentId, dateFrom, dateTo } = {}) {
  const { data } = await client.get('/reports/wastage', {
    params: { department_id: departmentId, date_from: dateFrom, date_to: dateTo },
  });
  return data;
}

const CSV_ENDPOINTS = {
  movements: '/reports/movements-summary',
  requisitions: '/reports/requisitions-summary',
  wastage: '/reports/wastage',
};

/**
 * Downloads one of the three CSV-capable reports. A plain `<a href>` can't
 * carry the Authorization header, so this fetches as a blob through the
 * authenticated axios client and triggers the browser download manually.
 */
export async function downloadReportCsv(reportKey, { departmentId, dateFrom, dateTo, filename } = {}) {
  const path = CSV_ENDPOINTS[reportKey];
  if (!path) throw new Error(`Unknown CSV report key: ${reportKey}`);

  const response = await client.get(path, {
    params: { department_id: departmentId, date_from: dateFrom, date_to: dateTo, format: 'csv' },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `${reportKey}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
