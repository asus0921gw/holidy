// 配置
const DATA_URL = 'holidays.json';
let holidays = [];

// 1. 取得休診日資料
async function fetchHolidays() {
  try {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');

    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('無法載入資料');
    return await response.json();
  } catch (error) {
    document.getElementById('error').textContent = `錯誤：${error.message}`;
    document.getElementById('error').classList.remove('hidden');
    return [];
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}

// 2. 過濾未來一個月的休診日
function filterUpcomingHolidays(holidays) {
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);

  return holidays.filter(holiday => {
    const date = new Date(holiday.日期);
    return date >= today && date <= thirtyDaysLater;
  });
}

// 3. 渲染表格
function renderHolidays(holidays) {
  const tbody = document.getElementById('holiday-table-body');
  tbody.innerHTML = '';

  if (holidays.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">目前沒有未來一個月的休診日。</td></tr>';
    return;
  }

  holidays.forEach(holiday => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${holiday.日期}</td>
      <td>${holiday.類型}</td>
      <td>${holiday.存診}</td>
      <td>${holiday.狀態}</td>
      <td>${holiday.修正存診 || '-'}</td>
      <td>${holiday.最後修改者 || '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

// 4. 智能篩選（支援所有欄位）
function applyFilters() {
  const keyword = document.getElementById('search-keyword').value.toLowerCase();
  if (!keyword) {
    renderHolidays(holidays);
    return;
  }

  const filtered = holidays.filter(holiday => {
    return Object.values(holiday).some(value =>
      String(value).toLowerCase().includes(keyword)
    );
  });
  renderHolidays(filtered);
}

// 5. 重新整理資料
async function refreshData() {
  holidays = await fetchHolidays();
  renderHolidays(holidays);
}

// 6. 初始化
async function init() {
  holidays = await fetchHolidays();
  renderHolidays(holidays);
}

// 7. 事件監聽
document.getElementById('apply-filter').addEventListener('click', applyFilters);
document.getElementById('search-keyword').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') applyFilters();
});
document.getElementById('refresh').addEventListener('click', refreshData);

// 8. 起始
init();
