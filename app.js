const DEFAULT_STORE_NAME = 'XULKAROY PARDALARI';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80';

const refs = {
  authModal: document.getElementById('authModal'),
  dashboard: document.getElementById('dashboard'),
  storeTitleDisplay: document.getElementById('storeTitleDisplay'),
  appStoreName: document.getElementById('appStoreName'),
  currentUserDisplay: document.getElementById('currentUserDisplay'),
  usersCount: document.getElementById('usersCount'),
  employeesCount: document.getElementById('employeesCount'),
  customersCount: document.getElementById('customersCount'),
  currentRole: document.getElementById('currentRole'),
  welcomeMessage: document.getElementById('welcomeMessage'),
  loginPanel: document.getElementById('loginPanel'),
  registerPanel: document.getElementById('registerPanel'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  regRole: document.getElementById('regRole'),
  storeField: document.getElementById('storeField'),
  regStore: document.getElementById('regStore'),
  logoutBtn: document.getElementById('logoutBtn'),
  tabButtons: Array.from(document.querySelectorAll('.tab-btn')),
  saleFormCard: document.getElementById('saleFormCard'),
  saleForm: document.getElementById('saleForm'),
  saleCustomerName: document.getElementById('saleCustomerName'),
  saleCustomerPhone: document.getElementById('saleCustomerPhone'),
  fabricType: document.getElementById('fabricType'),
  saleMeters: document.getElementById('saleMeters'),
  saleUnitPrice: document.getElementById('saleUnitPrice'),
  saleCostWrap: document.getElementById('saleCostWrap'),
  saleCostPerMeter: document.getElementById('saleCostPerMeter'),
  saleStatus: document.getElementById('saleStatus'),
  salesTableBadge: document.getElementById('salesTableBadge'),
  salesTableBody: document.getElementById('salesTableBody'),
  adminFinancePanel: document.getElementById('adminFinancePanel'),
  adminSettingsPanel: document.getElementById('adminSettingsPanel'),
  pendingUsersPanel: document.getElementById('pendingUsersPanel'),
  pendingUsersList: document.getElementById('pendingUsersList'),
  employeePerformancePanel: document.getElementById('employeePerformancePanel'),
  employeePerformanceBody: document.getElementById('employeePerformanceBody'),
  employeePerformanceCards: document.getElementById('employeePerformanceCards'),
  totalRevenue: document.getElementById('totalRevenue'),
  totalCost: document.getElementById('totalCost'),
  totalProfit: document.getElementById('totalProfit'),
  bankruptcyRisk: document.getElementById('bankruptcyRisk'),
  salePanelBadge: document.getElementById('salePanelBadge'),
  customerHeader: document.getElementById('customerHeader'),
  profitHeader: document.getElementById('profitHeader'),
  employeeHeader: document.getElementById('employeeHeader'),
  statusHeader: document.getElementById('statusHeader'),
};

let state = createDefaultState();
let activeTab = 'login';
let realtimeClient = null;

async function apiRequest(path, options = {}) {
  const response = await fetch(`/api/auth${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.message || 'Server bilan aloqa xatosi.');
  return body;
}

function showApiError(error) {
  alert(error.message || 'Server bilan aloqa xatosi.');
}

async function subscribeToCentralUpdates() {
  if (!window.supabase || realtimeClient) return;

  try {
    const config = await apiRequest('/client-config');
    if (!config.url || !config.anonKey) return;

    realtimeClient = window.supabase.createClient(config.url, config.anonKey);
    realtimeClient
      .channel('central-user-approvals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, async () => {
        state = await apiRequest('/state');
        renderDashboard();
      })
      .subscribe();
  } catch (error) {
    console.error('Supabase realtime ulanishi amalga oshmadi:', error);
  }
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').trim();
}

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(number);
}

function createDefaultUsers() {
  return [];
}

function createDefaultEmployees() {
  return [];
}

function createDefaultSales() {
  return [];
}

function createDefaultState() {
  return {
    theme: 'light',
    storeName: DEFAULT_STORE_NAME,
    activeUserId: null,
    approvalRequired: true,
    users: createDefaultUsers(),
    employees: createDefaultEmployees(),
    sales: createDefaultSales(),
  };
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.activeUserId) || null;
}

function toggleStoreField() {
  refs.storeField.classList.add('hidden');
  refs.regStore.value = DEFAULT_STORE_NAME;
}

function switchTab(tab) {
  activeTab = tab;

  refs.tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const showLogin = tab === 'login';
  refs.loginPanel.classList.toggle('hidden', !showLogin);
  refs.registerPanel.classList.toggle('hidden', showLogin);
}

function getVisibleSales() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  if (currentUser.role === 'Admin') {
    return [...state.sales].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  if (currentUser.role === 'Employee') {
    return state.sales
      .filter((sale) => sale.employeeId === currentUser.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return [];
}

function renderFinanceSummary() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'Admin') {
    return;
  }

  const totalRevenue = state.sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const totalCost = state.sales.reduce((sum, sale) => sum + Number((sale.meters || 0) * (sale.costPerMeter || 0)), 0);
  const totalProfit = totalRevenue - totalCost;

  refs.totalRevenue.textContent = formatCurrency(totalRevenue);
  refs.totalCost.textContent = formatCurrency(totalCost);
  refs.totalProfit.textContent = formatCurrency(totalProfit);
  refs.bankruptcyRisk.textContent = totalProfit > 0 ? 'Past' : 'Yuqori';
}

function renderPendingUsers() {
  const currentUser = getCurrentUser();

  if (!currentUser || currentUser.role !== 'Admin') {
    refs.pendingUsersPanel.classList.add('hidden');
    refs.pendingUsersList.innerHTML = '';
    return;
  }

  refs.pendingUsersPanel.classList.remove('hidden');

  const manageableUsers = state.users.filter((user) => user.id !== currentUser.id);

  if (!manageableUsers.length) {
    refs.pendingUsersList.innerHTML = `
      <div class="empty-state">Hozircha boshqa foydalanuvchilar yo'q.</div>
    `;
    return;
  }

  refs.pendingUsersList.innerHTML = manageableUsers.map((user) => `
    <div class="pending-user-item">
      <div class="pending-user-meta">
        <strong>${user.name}</strong>
        <span>${user.phone} · ${getRoleLabel(user.role)} · ${user.status === 'approved' ? 'Ruxsat berilgan' : 'Kutilmoqda'}</span>
      </div>

      <div class="pending-actions">
        <label class="access-toggle">
          <input type="checkbox" data-action="toggle-access" data-user-id="${user.id}" ${user.status === 'approved' ? 'checked' : ''} />
          <span class="slider"></span>
          <span>Tizimga kirishga ruxsat berish</span>
        </label>
        <button type="button" class="reject-btn" data-action="reject" data-user-id="${user.id}">O'chirish</button>
      </div>
    </div>
  `).join('');
}

function renderEmployeePerformance() {
  const currentUser = getCurrentUser();

  if (!currentUser || currentUser.role !== 'Admin') {
    refs.employeePerformancePanel.classList.add('hidden');
    refs.employeePerformanceBody.innerHTML = '';
    refs.employeePerformanceCards.innerHTML = '';
    return;
  }

  refs.employeePerformancePanel.classList.remove('hidden');

  const employees = state.users.filter((user) => user.role === 'Employee');

  if (!employees.length) {
    refs.employeePerformanceBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Hozircha ishchilar mavjud emas.</td>
      </tr>
    `;
    refs.employeePerformanceCards.innerHTML = '<div class="empty-state">Hozircha ishchilar mavjud emas.</div>';
    return;
  }

  const stats = employees.map((employee) => {
    const employeeSales = state.sales.filter((sale) => sale.employeeId === employee.id);
    const totalSales = employeeSales.length;
    const totalMeters = employeeSales.reduce((sum, sale) => sum + Number(sale.meters || 0), 0);
    const totalRevenue = employeeSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    return {
      ...employee,
      totalSales,
      totalMeters,
      totalRevenue,
    };
  });

  const tableRows = stats.map((employee) => {
    const initials = employee.name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return `
      <tr>
        <td>
          <div class="employee-info">
            <div class="employee-avatar">${initials}</div>
            <div>
              <strong class="employee-name">${employee.name}</strong>
            </div>
          </div>
        </td>
        <td>${employee.phone}</td>
        <td>${employee.totalSales} dona</td>
        <td>${employee.totalMeters.toFixed(1)} m</td>
        <td>${formatCurrency(employee.totalRevenue)}</td>
        <td>
          <label class="access-toggle">
            <input type="checkbox" data-action="toggle-access" data-user-id="${employee.id}" ${employee.status === 'approved' ? 'checked' : ''} />
            <span class="slider"></span>
            <span>${employee.status === 'approved' ? 'Ruxsat berilgan' : 'Kutilmoqda'}</span>
          </label>
        </td>
      </tr>
    `;
  }).join('');

  refs.employeePerformanceBody.innerHTML = tableRows;

  const cardMarkup = stats.map((employee) => {
    const initials = employee.name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return `
      <article class="employee-performance-card">
        <div class="employee-card-header">
          <div class="employee-avatar">${initials}</div>
          <div>
            <strong class="employee-name">${employee.name}</strong>
            <span class="employee-role">Ishchi</span>
          </div>
        </div>

        <div class="employee-performance-details">
          <div>
            <span>Telefon</span>
            <strong>${employee.phone}</strong>
          </div>
          <div>
            <span>Jami sotilgan</span>
            <strong>${employee.totalSales} dona</strong>
          </div>
          <div>
            <span>Metraj</span>
            <strong>${employee.totalMeters.toFixed(1)} m</strong>
          </div>
          <div>
            <span>Umumiy tushum</span>
            <strong>${formatCurrency(employee.totalRevenue)}</strong>
          </div>
          <label class="access-toggle">
            <input type="checkbox" data-action="toggle-access" data-user-id="${employee.id}" ${employee.status === 'approved' ? 'checked' : ''} />
            <span class="slider"></span>
            <span>${employee.status === 'approved' ? 'Tizimga kirishga ruxsat berilgan' : 'Tizimga kirish bloklangan'}</span>
          </label>
        </div>
      </article>
    `;
  }).join('');

  refs.employeePerformanceCards.innerHTML = cardMarkup;
}

function renderSalesTable() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    refs.salesTableBody.innerHTML = '';
    return;
  }

  const visibleSales = getVisibleSales();
  const showProfit = currentUser.role === 'Admin';
  const showCustomer = true;
  const showEmployee = true;

  refs.profitHeader.classList.toggle('hidden', !showProfit);
  refs.customerHeader.classList.toggle('hidden', !showCustomer);
  refs.employeeHeader.classList.toggle('hidden', !showEmployee);
  refs.statusHeader.classList.toggle('hidden', false);

  if (!visibleSales.length) {
    refs.salesTableBody.innerHTML = `
      <tr>
        <td colspan="${showProfit ? 8 : 7}" class="empty-state">Hozircha sotuvlar mavjud emas.</td>
      </tr>
    `;
    return;
  }

  const rows = visibleSales.map((sale) => `
    <tr>
      <td>${sale.date}</td>
      <td>${showCustomer ? sale.customerName : ''}</td>
      <td>${sale.fabricType}</td>
      <td>${sale.meters} m</td>
      <td>${formatCurrency(sale.total)}</td>
      ${showProfit ? `<td>${formatCurrency(sale.profit || 0)}</td>` : ''}
      <td>${sale.status}</td>
      <td>${sale.employeeName}</td>
    </tr>
  `).join('');

  refs.salesTableBody.innerHTML = rows;
}

function getRoleLabel(role) {
  return role === 'Employee' ? 'Ishchi' : 'Boshliq';
}

function renderDashboard() {
  const currentUser = getCurrentUser();

  refs.storeTitleDisplay.textContent = state.storeName;
  refs.appStoreName.textContent = state.storeName;

  if (!currentUser) {
    refs.authModal.classList.remove('hidden');
    refs.dashboard.classList.add('hidden');
    return;
  }

  refs.authModal.classList.add('hidden');
  refs.dashboard.classList.remove('hidden');

  refs.currentUserDisplay.textContent = `${currentUser.name} (${getRoleLabel(currentUser.role)})`;
  refs.currentRole.textContent = getRoleLabel(currentUser.role);

  const employees = state.users.filter((user) => user.role === 'Employee');
  const customers = 0;

  refs.usersCount.textContent = String(state.users.length);
  refs.employeesCount.textContent = String(employees.length);
  refs.customersCount.textContent = String(customers);
  refs.welcomeMessage.textContent = `Xush kelibsiz, ${currentUser.name}! Siz ${getRoleLabel(currentUser.role)} panelidasiz.`;

  const isAdmin = currentUser.role === 'Admin';

  refs.saleFormCard.classList.toggle('hidden', false);
  refs.saleCostWrap.classList.toggle('hidden', !isAdmin);
  refs.salesTableBadge.textContent = isAdmin ? 'Barcha sotuvlar' : 'Sizning sotuvlaringiz';
  refs.salePanelBadge.textContent = getRoleLabel(currentUser.role);
  refs.adminFinancePanel.classList.toggle('hidden', !isAdmin);
  refs.adminSettingsPanel.classList.toggle('hidden', !isAdmin);
  renderFinanceSummary();
  renderPendingUsers();
  renderEmployeePerformance();
  renderSalesTable();
}

function resetForms() {
  refs.loginForm.reset();
  refs.registerForm.reset();
  refs.regRole.value = 'Admin';
  refs.regStore.value = DEFAULT_STORE_NAME;
  refs.saleForm.reset();
  refs.saleStatus.value = 'Kutilmoqda';
  toggleStoreField();
}

async function handleLogin(event) {
  event.preventDefault();

  const loginInput = String(document.getElementById('loginUser').value || '').trim();
  const password = String(document.getElementById('loginPass').value || '').trim();

  if (!loginInput || !password) {
    alert('Ism/telefon va parolni kiriting.');
    return;
  }

  try {
    const result = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginInput, password }),
    });
    state = result.state;
    renderDashboard();
  } catch (error) {
    showApiError(error);
  }
}

function buildEskizService() {
  const eskizConfig = window.__APP_CONFIG__ && window.__APP_CONFIG__.eskiz ? window.__APP_CONFIG__.eskiz : {};

  return new window.EskizService({
    email: eskizConfig.email,
    password: eskizConfig.password,
    from: eskizConfig.from,
  });
}

async function sendWelcomeSmsForRegisteredUser(user) {
  if (!user || !user.phone || !window.EskizService) {
    return;
  }

  try {
    const eskizService = buildEskizService();

    if (!eskizService.isConfigured()) {
      return;
    }

    await eskizService.sendWelcomeSMS(user.phone, user.name);
  } catch (error) {
    console.error('Eskiz SMS yuborishda xatolik yuz berdi:', error);
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const role = refs.regRole.value;
  const name = String(document.getElementById('regName').value || '').trim();
  const phone = normalizePhone(document.getElementById('regPhone').value || '');
  const password = String(document.getElementById('regPass').value || '').trim();
  const avatar = String(document.getElementById('regAvatar').value || '').trim() || DEFAULT_AVATAR;

  if (!name || !phone || !password) {
    alert('Ism, telefon va parolni kiriting.');
    return;
  }

  try {
    const result = await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, role, avatar }),
    });
    resetForms();
    switchTab('login');
    if (result.state) {
      state = result.state;
      renderDashboard();
      alert('Birinchi foydalanuvchi sifatida siz avtomatik Boshliq bo\'ldingiz va tizimga kirdingiz.');
    } else {
      alert('Ro\'yxatdan o\'tish yakunlandi. Boshliq tasdig\'ini kuting.');
    }
  } catch (error) {
    showApiError(error);
  }
}

async function handleSaleSubmit(event) {
  event.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role === 'Customer') {
    return;
  }

  const customerName = String(refs.saleCustomerName.value || '').trim();
  const customerPhone = normalizePhone(refs.saleCustomerPhone.value || '');
  const fabricType = String(refs.fabricType.value || '').trim();
  const meters = Number(refs.saleMeters.value || 0);
  const unitPrice = Number(refs.saleUnitPrice.value || 0);
  const costPerMeter = Number(refs.saleCostPerMeter.value || 0);
  const status = String(refs.saleStatus.value || 'Kutilmoqda').trim();

  if (!customerName || !customerPhone || !fabricType || meters <= 0 || unitPrice <= 0) {
    alert('Barcha maydonlarni to\'g\'ri to\'ldiring.');
    return;
  }

  if (currentUser.role === 'Admin' && costPerMeter <= 0) {
    alert('Boshliq uchun 1 metr tannarxini kiriting.');
    return;
  }

  const total = meters * unitPrice;
  const profit = currentUser.role === 'Admin' ? total - (meters * costPerMeter) : 0;

  const sale = {
    id: `sale-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    customerName,
    customerPhone,
    fabricType,
    meters,
    unitPrice,
    costPerMeter: currentUser.role === 'Admin' ? costPerMeter : 0,
    total,
    profit,
    employeeId: currentUser.id,
    employeeName: currentUser.name,
    status,
  };

  try {
    await apiRequest('/sales', { method: 'POST', body: JSON.stringify(sale) });
    const result = await apiRequest('/state');
    state = result;
    refs.saleForm.reset();
    refs.saleStatus.value = 'Kutilmoqda';
    renderDashboard();
  } catch (error) {
    showApiError(error);
  }
}

async function handleLogout() {
  try {
    await apiRequest('/logout', { method: 'POST' });
  } catch (error) {
    showApiError(error);
  }
  state.activeUserId = null;
  renderDashboard();
}

async function handlePendingUserAction(event) {
  const button = event.target.closest('[data-action]');

  if (!button) {
    return;
  }

  const { action, userId } = button.dataset;
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;

  try {
    if (action === 'toggle-access' || action === 'approve') {
      await apiRequest(`/users/${userId}/access`, {
        method: 'PATCH',
        body: JSON.stringify({ allowed: action === 'approve' || user.status !== 'approved' }),
      });
    } else if (action === 'reject') {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
    }
    state = await apiRequest('/state');
    renderDashboard();
  } catch (error) {
    showApiError(error);
  }
}

refs.tabButtons.forEach((button) => {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
});

refs.regRole.addEventListener('change', toggleStoreField);
refs.loginForm.addEventListener('submit', handleLogin);
refs.registerForm.addEventListener('submit', handleRegister);
refs.saleForm.addEventListener('submit', handleSaleSubmit);
refs.logoutBtn.addEventListener('click', handleLogout);
refs.pendingUsersList.addEventListener('click', handlePendingUserAction);
refs.employeePerformanceBody.addEventListener('click', handlePendingUserAction);
refs.employeePerformanceCards.addEventListener('click', handlePendingUserAction);

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

async function bootstrap() {
  try {
    state = await apiRequest('/state');
  } catch (error) {
    showApiError(error);
  }
  resetForms();
  switchTab('login');
  renderDashboard();
  subscribeToCentralUpdates();
  registerServiceWorker();
}

bootstrap();
