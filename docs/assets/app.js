"use strict";
(() => {
  const data = window.AIOS_DEMO_DATA;
  const $ = id => document.getElementById(id);
  const main = document.querySelector('main');
  const panel = document.querySelector('.panel');
  const pageSize = 5;
  const eligibleStatuses = new Set(['paid', 'processing', 'shipped', 'delivered']);
  const columns = ['order_id', 'total_usd', 'status', 'created_raw'];
  let page = Number(main.dataset.initialPage) || 1;
  let filtered = [];
  let loading = false;
  const money = cents => `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
  const escapeCsv = value => /[",\r\n]/.test(String(value)) ? '"' + String(value).replaceAll('"', '""') + '"' : String(value);
  const csv = rows => [columns, ...rows.map(row => [row.order_id, money(row.amount_cents), row.status, row.created_raw])].map(row => row.map(escapeCsv).join(',')).join('\r\n') + '\r\n';
  function setLoading(active) {
    loading = active;
    panel.setAttribute('aria-busy', String(active));
    for (const id of ['status-filter', 'date-filter', 'reset', 'download', 'previous', 'next']) $(id).disabled = active;
    if (active) {
      $('load-state').textContent = '正在加载演示订单，请稍候…';
      $('order-rows').replaceChildren();
      $('page-summary').textContent = '正在加载…';
      $('page-number').textContent = '—';
    }
  }
  function render() {
    const status = $('status-filter').value;
    const date = $('date-filter').value;
    filtered = data.rows.filter(row => (status === 'all' || (status === 'eligible' ? eligibleStatuses.has(row.status) : row.status === status)) && (date === 'all' || row.created_raw.startsWith(date + ' ')));
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(Math.max(1, page), pages);
    const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
    $('order-rows').replaceChildren();
    for (const row of visible) {
      const tr = document.createElement('tr');
      [row.order_id, money(row.amount_cents), row.status, row.created_raw].forEach((value, index) => {
        const td = document.createElement('td');
        td.dataset.field = columns[index];
        td.className = ['order-id', 'money', '', 'date'][index];
        if (index === 2) {
          const tag = document.createElement('span'); tag.className = `status ${row.status}`; tag.textContent = value; td.append(tag);
        } else { td.textContent = value; }
        tr.append(td);
      });
      $('order-rows').append(tr);
    }
    if (!visible.length) {
      const tr = document.createElement('tr'); const td = document.createElement('td');
      td.colSpan = 4; td.className = 'empty'; td.textContent = '当前筛选没有订单'; tr.append(td); $('order-rows').append(tr);
    }
    $('filtered-count').textContent = String(filtered.length);
    $('filtered-total').textContent = money(filtered.reduce((sum, row) => sum + row.amount_cents, 0));
    $('page-number').textContent = `${page} / ${pages}`;
    $('page-summary').textContent = filtered.length ? `第 ${page} / ${pages} 页 · 显示第 ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} 笔，共 ${filtered.length} 笔` : '第 1 / 1 页 · 共 0 笔';
    main.dataset.pageNumber = String(page);
    main.dataset.filteredRows = String(filtered.length);
    panel.setAttribute('aria-label', `虚构订单列表，第 ${page} 页，共 ${pages} 页`);
    setLoading(false);
    $('previous').disabled = page <= 1;
    $('next').disabled = page >= pages;
    $('load-state').textContent = `加载完成 · ${$('status-filter').selectedOptions[0].textContent} · ${$('date-filter').selectedOptions[0].textContent}`;
  }
  function refresh(resetPage = true, delay = 550) {
    if (loading) return;
    if (resetPage) page = 1;
    setLoading(true);
    window.setTimeout(render, delay);
  }
  $('filters').addEventListener('submit', event => event.preventDefault());
  $('status-filter').addEventListener('change', () => refresh());
  $('date-filter').addEventListener('change', () => refresh());
  $('reset').addEventListener('click', () => {
    $('status-filter').value = 'all'; $('date-filter').value = 'all'; refresh();
  });
  $('previous').addEventListener('click', () => { if (!loading && page > 1) { page -= 1; refresh(false); } });
  $('next').addEventListener('click', () => { if (!loading && page < Math.ceil(filtered.length / pageSize)) { page += 1; refresh(false); } });
  $('download').addEventListener('click', () => {
    if (loading) return;
    const status = $('status-filter').value;
    const date = $('date-filter').value;
    const filename = `AIOS-DEMO-20261003-E-${status}-${date}.csv`;
    const blob = new Blob([csv(filtered)], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.append(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('download-state').textContent = `已生成下载：${filename}，共 ${filtered.length} 笔，筛选金额 USD ${money(filtered.reduce((sum, row) => sum + row.amount_cents, 0))}。请在浏览器下载列表确认文件已保存。`;
  });
  if (!data || data.snapshot !== main.dataset.snapshotId || data.rows.length !== 10) throw new Error('Fixture metadata mismatch');
  refresh(false, 750);
})();
