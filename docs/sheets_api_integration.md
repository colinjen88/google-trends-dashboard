# Google Sheets Web App API 串接教學

本文件說明如何將 Trends Dashboard 前端（dashboard.js）串接 Google Apps Script Web App API。

API Endpoint 範例：
https://script.google.com/macros/s/AKfycbxoSJH_AqW5wqeuAJ2XBlUVO_g4deKyUEIstgMdKVyulMSktkyRyNoUizvJwBALz4O_/exec

---

## 1. 取得所有圖表

```js
async function fetchCharts() {
  const url = 'https://script.google.com/macros/s/AKfycbxoSJH_AqW5wqeuAJ2XBlUVO_g4deKyUEIstgMdKVyulMSktkyRyNoUizvJwBALz4O_/exec?action=getCharts';
  const res = await fetch(url);
  const data = await res.json();
  if (data.success) {
    return data.charts;
  } else {
    throw new Error(data.error || '取得資料失敗');
  }
}
```

---

## 2. 新增圖表

```js
async function addChartToSheets(chart) {
  const url = 'https://script.google.com/macros/s/AKfycbxoSJH_AqW5wqeuAJ2XBlUVO_g4deKyUEIstgMdKVyulMSktkyRyNoUizvJwBALz4O_/exec';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addChart',
      ...chart
    })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '新增失敗');
  return data;
}
```

---

## 3. 更新圖表

```js
async function updateChartInSheets(chart) {
  const url = 'https://script.google.com/macros/s/AKfycbxoSJH_AqW5wqeuAJ2XBlUVO_g4deKyUEIstgMdKVyulMSktkyRyNoUizvJwBALz4O_/exec';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateChart',
      ...chart
    })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '更新失敗');
  return data;
}
```

---

## 4. 刪除圖表

```js
async function deleteChartFromSheets(id) {
  const url = 'https://script.google.com/macros/s/AKfycbxoSJH_AqW5wqeuAJ2XBlUVO_g4deKyUEIstgMdKVyulMSktkyRyNoUizvJwBALz4O_/exec';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deleteChart',
      id
    })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '刪除失敗');
  return data;
}
```

---

## 5. 匯入多筆圖表

```js
async function importChartsToSheets(charts) {
  const url = 'https://script.google.com/macros/s/AKfycbxoSJH_AqW5wqeuAJ2XBlUVO_g4deKyUEIstgMdKVyulMSktkyRyNoUizvJwBALz4O_/exec';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'importCharts',
      charts
    })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '匯入失敗');
  return data;
}
```

---

## 6. 前端整合建議

- 建議將上述函式集中於 `assets/js/sheets-api.js`，主程式 `dashboard.js` 只需呼叫這些 API 函式。
- 可依需求擴充錯誤處理、載入動畫、UI 通知等。

---

如需進一步整合 dashboard.js，請告知！