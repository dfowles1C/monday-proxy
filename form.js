<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>1Concier — New Monday Item</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f3; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 2rem 1rem; }
  .card { background: #fff; border-radius: 12px; border: 1px solid #e5e5e5; padding: 2rem; width: 100%; max-width: 600px; margin-top: 1rem; }
  .board-label { font-size: 12px; color: #888; margin-bottom: 4px; }
  .board-title { font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 1.75rem; }
  .field { margin-bottom: 1.25rem; }
  label { display: block; font-size: 13px; font-weight: 500; color: #555; margin-bottom: 6px; }
  input[type=text], input[type=email], input[type=url], input[type=number], input[type=date], select, textarea {
    width: 100%; padding: 8px 12px; font-size: 14px; border: 1px solid #ddd; border-radius: 8px;
    color: #1a1a1a; background: #fff; outline: none; transition: border-color 0.15s;
  }
  input:focus, select:focus, textarea:focus { border-color: #888; }
  textarea { resize: vertical; min-height: 80px; }
  .checkbox-row { display: flex; align-items: center; gap: 8px; }
  .checkbox-row input { width: 18px; height: 18px; cursor: pointer; }
  .actions { display: flex; gap: 10px; align-items: center; margin-top: 1.75rem; }
  .btn-primary { padding: 9px 22px; font-size: 14px; font-weight: 500; background: #1a1a1a; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
  .btn-primary:hover { background: #333; }
  .btn-primary:disabled { background: #999; cursor: not-allowed; }
  .btn-secondary { padding: 9px 16px; font-size: 14px; background: transparent; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; color: #555; }
  .result { margin-top: 1rem; padding: 10px 14px; border-radius: 8px; font-size: 14px; display: none; }
  .result.success { background: #f0faf4; border: 1px solid #a3d9b5; color: #1a6b3a; }
  .result.error { background: #fff0f0; border: 1px solid #f5a5a5; color: #b91c1c; }
  #loading { text-align: center; padding: 2rem 0; color: #888; font-size: 14px; }
  #form-body { display: none; }
</style>
</head>
<body>
<div class="card">
  <div id="loading">Loading board columns...</div>
  <div id="form-body">
    <p class="board-label" id="board-label"></p>
    <p class="board-title">New item</p>
    <div id="fields"></div>
    <div class="actions">
      <button class="btn-primary" id="submit-btn" onclick="submitItem()">Create item</button>
      <button class="btn-secondary" onclick="resetForm()">Clear</button>
    </div>
    <div class="result" id="result"></div>
  </div>
</div>
<script>
const PROXY = window.location.origin + '/monday';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU3NDQzODA0OSwiYWFpIjoxMSwidWlkIjo2NjIwMDk0MiwiYWFkIjoiMjAyNS0xMC0xNVQxNzoyNDo0NS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTE5OTgxMzgsInJnbiI6InVzZTEifQ.FFQXrpkk9vKnBUvz_OWfFmm7LETNyla5w9HDCt11zpc';
const BOARD_ID = '18202835498';
const SUPPORTED = ['text','long_text','numbers','status','date','email','phone','link','dropdown','checkbox'];
let columns = [];

async function mondayQuery(query) {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': TOKEN },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Status ' + res.status + ': ' + text);
  }
  return res.json();
}

async function loadBoard() {
  try {
    const data = await mondayQuery('{ boards(ids: [' + BOARD_ID + ']) { name columns { id title type settings_str } } }');
    if (data.errors) throw new Error(data.errors[0].message);
    const board = data.data.boards[0];
    if (!board) throw new Error('Board not found.');
    document.getElementById('board-label').textContent = board.name;
    columns = board.columns.filter(c => SUPPORTED.includes(c.type));
    renderFields();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('form-body').style.display = 'block';
  } catch(err) {
    document.getElementById('loading').textContent = 'Error: ' + err.message;
  }
}

function renderFields() {
  const container = document.getElementById('fields');
  container.innerHTML = '';
  columns.forEach(col => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const label = document.createElement('label');
    label.textContent = col.title;
    label.setAttribute('for', 'f-' + col.id);
    wrap.appendChild(label);
    let input;
    if (col.type === 'status' || col.type === 'dropdown') {
      input = document.createElement('select');
      const blank = document.createElement('option');
      blank.value = ''; blank.textContent = '-- select --';
      input.appendChild(blank);
      try {
        const s = JSON.parse(col.settings_str || '{}');
        const lbls = s.labels || s.labels_colors || {};
        Object.entries(lbls).forEach(([idx, val]) => {
          const o = document.createElement('option');
          o.value = idx;
          o.textContent = typeof val === 'object' ? (val.name || val) : val;
          input.appendChild(o);
        });
      } catch(e) {}
    } else if (col.type === 'long_text') {
      input = document.createElement('textarea');
    } else if (col.type === 'checkbox') {
      const row = document.createElement('div');
      row.className = 'checkbox-row';
      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = 'f-' + col.id;
      input.dataset.colId = col.id;
      input.dataset.colType = col.type;
      row.appendChild(input);
      wrap.appendChild(row);
      container.appendChild(wrap);
      return;
    } else if (col.type === 'date') {
      input = document.createElement('input'); input.type = 'date';
    } else if (col.type === 'numbers') {
      input = document.createElement('input'); input.type = 'number'; input.step = 'any';
    } else {
      input = document.createElement('input');
      input.type = col.type === 'email' ? 'email' : col.type === 'link' ? 'url' : 'text';
    }
    input.id = 'f-' + col.id;
    input.dataset.colId = col.id;
    input.dataset.colType = col.type;
    if (col.id === 'name') input.placeholder = 'Required';
    wrap.appendChild(input);
    container.appendChild(wrap);
  });
}

function buildColumnValues() {
  const vals = {};
  columns.forEach(col => {
    if (col.id === 'name') return;
    const el = document.getElementById('f-' + col.id);
    if (!el) return;
    const t = col.type;
    let v = null;
    if (t === 'checkbox') v = JSON.stringify({ checked: el.checked ? 'true' : 'false' });
    else if (t === 'date' && el.value) v = JSON.stringify({ date: el.value });
    else if (t === 'numbers' && el.value !== '') v = el.value;
    else if (t === 'status' && el.value !== '') v = JSON.stringify({ index: parseInt(el.value) });
    else if (t === 'dropdown' && el.value !== '') v = JSON.stringify({ ids: [parseInt(el.value)] });
    else if (t === 'email' && el.value) v = JSON.stringify({ email: el.value, text: el.value });
    else if (t === 'phone' && el.value) v = JSON.stringify({ phone: el.value, countryShortName: 'US' });
    else if (t === 'link' && el.value) v = JSON.stringify({ url: el.value, text: el.value });
    else if (t === 'long_text' && el.value) v = JSON.stringify({ text: el.value });
    else if (el.value) v = el.value;
    if (v !== null) vals[col.id] = v;
  });
  return vals;
}

async function submitItem() {
  const nameEl = document.getElementById('f-name');
  const itemName = nameEl ? nameEl.value.trim() : '';
  if (!itemName) { showResult('error', 'Item name is required.'); return; }
  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Creating...'; btn.disabled = true;
  const colVals = buildColumnValues();
  const mutation = 'mutation { create_item(board_id: ' + BOARD_ID + ', item_name: ' + JSON.stringify(itemName) + ', column_values: ' + JSON.stringify(JSON.stringify(colVals)) + ') { id name } }';
  try {
    const data = await mondayQuery(mutation);
    if (data.errors) throw new Error(data.errors[0].message);
    const item = data.data.create_item;
    showResult('success', 'Created "' + item.name + '" (ID: ' + item.id + ')');
    resetForm();
  } catch(err) {
    showResult('error', 'Failed: ' + err.message);
  } finally {
    btn.textContent = 'Create item'; btn.disabled = false;
  }
}

function showResult(type, msg) {
  const el = document.getElementById('result');
  el.className = 'result ' + type;
  el.style.display = 'block';
  el.textContent = msg;
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function resetForm() {
  columns.forEach(col => {
    const el = document.getElementById('f-' + col.id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
  });
}

loadBoard();
</script>
</body>
</html>
