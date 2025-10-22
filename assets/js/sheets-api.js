// assets/js/sheets-api.js
// Google Sheets Web App API 封裝

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxoSJH_AqW5wqeuAJ2XBlUVO_g4deKyUEIstgMdKVyulMSktkyRyNoUizvJwBALz4O_/exec';

export async function fetchCharts() {
  const url = `${SHEETS_API_URL}?action=getCharts`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.success) {
    return data.charts;
  } else {
    throw new Error(data.error || '取得資料失敗');
  }
}

export async function addChartToSheets(chart) {
  const res = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addChart', ...chart })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '新增失敗');
  return data;
}

export async function updateChartInSheets(chart) {
  const res = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateChart', ...chart })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '更新失敗');
  return data;
}

export async function deleteChartFromSheets(id) {
  const res = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteChart', id })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '刪除失敗');
  return data;
}

export async function importChartsToSheets(charts) {
  const res = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'importCharts', charts })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '匯入失敗');
  return data;
}
