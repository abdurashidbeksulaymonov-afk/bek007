const STORAGE_KEY = 'smartPardaMultiTenantERP';
const RESET_KEY = 'smartPardaMultiTenantERP_reset_v3_done';
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

let state = initializeAppState();
let activeTab = 'login';

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

function hasLegacySeedData(input) {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const legacyNames = ['Sardor Tursunov', 'Nodir Fayziyev', 'Muhammad Aliyev'];
  const users = Array.isArray(input.users) ? input.users : [];
  const sales = Array.isArray(input.sales) ? input.sales : [];

  const hasLegacyUser = users.some((user) => legacyNames.includes(String(user.name || '').trim()));
  const hasLegacySales = sales.some((sale) => {
    const hasLegacyCustomer = legacyNames.includes(String(sale.customerName || '').trim());
    const hasLegacyEmployee = legacyNames.includes(String(sale.employeeName || '').trim());
    return hasLegacyCustomer || hasLegacyEmployee;
  });

  return hasLegacyUser || hasLegacySales;
}

function resetPersistentState() {
  if (window.sessionStorage) {
    window.sessionStorage.clear();
  }

  window.localStorage.clear();

  const emptyState = createDefaultState();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
  window.localStorage.setItem(RESET_KEY, 'done');

  return emptyState;
}

function initializeAppState() {
  const resetAlreadyDone = localStorage.getItem(RESET_KEY);
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!resetAlreadyDone || !saved) {
    return resetPersistentState();
  }

  try {
    const parsed = JSON.parse(saved);

    if (hasLegacySeedData(parsed)) {
      return resetPersistentState();
    }
  } catch (error) {
    return resetPersistentState();
  }

  return loadState();
}

function normalizeState(input) {
  const fallback = createDefaultState();

  if (!input || typeof input !== 'object') {
    return fallback;
  }

  const users = Array.isArray(input.users) && input.users.length
    ? input.users.map((user) => ({
        id: user.id || `user-${Date.now()}-${Math.random()}`,
        name: String(user.name || '').trim() || 'Unknown User',
        role: user.role || 'Customer',
        phone: normalizePhone(user.phone),
        password: String(user.password || '').trim() || '123456',
        avatar: user.avatar || DEFAULT_AVATAR,
        status: user.status === 'pending' ? 'pending' : 'approved',
        ...(user.storeName ? { storeName: String(user.storeName).trim() } : {}),
      }))
    : fallback.users;

  const sales = Array.isArray(input.sales) && input.sales.length
    ? input.sales.map((sale) => ({
        id: sale.id || `sale-${Date.now()}-${Math.random()}`,
        date: sale.date || new Date().toISOString().slice(0, 10),
        customerName: String(sale.customerName || '').trim() || 'Noma' + 'lum',
        customerPhone: normalizePhone(sale.customerPhone),
        fabricType: String(sale.fabricType || '').trim() || 'Boshqa',
        meters: Number(sale.meters || 0),
        unitPrice: Number(sale.unitPrice || 0),
        costPerMeter: Number(sale.costPerMeter || 0),
        total: Number(sale.total || 0),
        profit: Number(sale.profit || 0),
        employeeId: sale.employeeId || 'emp-1',
        employeeName: String(sale.employeeName || '').trim() || 'Unknown',
        status: sale.status || 'Kutilmoqda',
      }))
    : fallback.sales;

  return {
    theme: input.theme === 'dark' ? 'dark' : 'light',
    storeName: DEFAULT_STORE_NAME,
    activeUserId: input.activeUserId || null,
    approvalRequired: input.approvalRequired !== false,
    users,
    sales,
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      const initial = createDefaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(saved);
    const normalized = normalizeState(parsed);

    if (JSON.stringify(normalized) !== saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch (error) {
    const fallback = createDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function handleLogin(event) {
  event.preventDefault();

  const loginInput = String(document.getElementById('loginUser').value || '').trim();
  const password = String(document.getElementById('loginPass').value || '').trim();

  if (!loginInput || !password) {
    alert('Ism/telefon va parolni kiriting.');
    return;
  }

  const user = state.users.find((item) => {
    const passwordMatches = item.password === password;
    if (!passwordMatches) return false;

    const phoneMatches = normalizePhone(item.phone) === normalizePhone(loginInput);
    const nameMatches = normalizeName(item.name) === normalizeName(loginInput);
    return phoneMatches || nameMatches;
  });

  if (!user) {
    alert('Bunday foydalanuvchi topilmadi yoki parol noto\'g\'ri.');
    return;
  }

  if (user.status === 'pending') {
    alert('Hisobingiz admin tomonidan tasdiqlanishi kutilmoqda.');
    return;
  }

  state.activeUserId = user.id;
  saveState();
  renderDashboard();
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

function handleRegister(event) {
  event.preventDefault();

  const isFirstUser = state.users.length === 0;
  const role = isFirstUser ? 'Admin' : refs.regRole.value;
  const storeName = DEFAULT_STORE_NAME;
  const name = String(document.getElementById('regName').value || '').trim();
  const phone = normalizePhone(document.getElementById('regPhone').value || '');
  const password = String(document.getElementById('regPass').value || '').trim();
  const avatar = String(document.getElementById('regAvatar').value || '').trim() || DEFAULT_AVATAR;

  if (!name || !phone || !password) {
    alert('Ism, telefon va parolni kiriting.');
    return;
  }

  const existingUser = state.users.find((user) => normalizePhone(user.phone) === phone);

  if (existingUser) {
    alert('Bu telefon raqami allaqachon ro\'yxatdan o\'tgan. Iltimos, kirish qismidan davom eting.');
    return;
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    role,
    phone,
    password,
    avatar,
    status: isFirstUser ? 'approved' : 'pending',
    ...(role === 'Admin' ? { storeName } : {}),
  };

  state.users.push(newUser);
  state.storeName = DEFAULT_STORE_NAME;

  if (isFirstUser) {
    state.activeUserId = newUser.id;
  } else {
    state.activeUserId = null;
  }

  saveState();
  resetForms();
  switchTab('login');
  renderDashboard();

  sendWelcomeSmsForRegisteredUser(newUser);

  if (isFirstUser) {
    alert('Birinchi foydalanuvchi sifatida siz avtomatik Admin rolini oldingiz va tizimga kirdingiz.');
    return;
  }

  alert('Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi. Boshliq sizga tizimga kirish ruxsatini yoqishi kutilmoqda.');
}

function handleSaleSubmit(event) {
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

  state.sales.unshift(sale);
  saveState();
  refs.saleForm.reset();
  refs.saleStatus.value = 'Kutilmoqda';
  renderDashboard();
}

function handleLogout() {
  state.activeUserId = null;
  saveState();
  renderDashboard();
}

function handlePendingUserAction(event) {
  const button = event.target.closest('[data-action]');

  if (!button) {
    return;
  }

  const { action, userId } = button.dataset;
  const userIndex = state.users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return;
  }

  if (action === 'approve') {
    state.users[userIndex].status = 'approved';
  }

  if (action === 'toggle-access') {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'Admin' || state.users[userIndex].id === currentUser.id) {
      return;
    }

    state.users[userIndex].status = state.users[userIndex].status === 'approved' ? 'pending' : 'approved';
  }

  if (action === 'reject') {
    state.users.splice(userIndex, 1);
  }

  saveState();
  renderDashboard();
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

resetForms();
switchTab('login');
renderDashboard();
registerServiceWorker();
