// SAHIFANING BOSHIDA TIZIMNI TEKSHIRISH
document.addEventListener("DOMContentLoaded", function () {
  checkSession();
});

// TABLARNI ALMASHTIRISH
function switchTab(tab) {
  const loginForm = document.getElementById("login-form");
  const regForm = document.getElementById("register-form");
  const loginBtn = document.getElementById("tab-login-btn");
  const regBtn = document.getElementById("tab-reg-btn");

  if (tab === 'login') {
    loginForm.classList.remove("hidden");
    regForm.classList.add("hidden");
    loginBtn.classList.add("active");
    regBtn.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    regForm.classList.remove("hidden");
    loginBtn.classList.remove("active");
    regBtn.classList.add("active");
  }
}

// ROLGA QARAB DO'KON NOMI INPUTINI KO'RSATISH
function toggleStoreNameInput() {
  const role = document.getElementById("reg-role").value;
  const storeGroup = document.getElementById("store-name-group");
  if (role === "boshliq") {
    storeGroup.classList.remove("hidden");
  } else {
    storeGroup.classList.add("hidden");
  }
}

// RO'YXATDAN O'TISH MANTIQLARI
function handleRegister() {
  const role = document.getElementById("reg-role").value;
  const store = document.getElementById("reg-store").value || "Xulkaroy Pardalari";
  const name = document.getElementById("reg-name").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const pass = document.getElementById("reg-pass").value.trim();

  if (!name || !pass) {
    alert("Iltimos, Ism va Parolni kiriting!");
    return;
  }

  let users = JSON.parse(localStorage.getItem("crm_users")) || [];

  // Mavjudligini tekshirish
  const exists = users.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    alert("Ushbu ismli foydalanuvchi allaqachon mavjud!");
    return;
  }

  const newUser = { role, store, name, phone, pass };
  users.push(newUser);
  localStorage.setItem("crm_users", JSON.stringify(users));

  // Tizimga avtomatik kirgizish
  localStorage.setItem("current_user", JSON.stringify(newUser));
  alert("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
  showDashboard(newUser);
}

// KIRISH (LOGIN) MANTIQLARI
function handleLogin() {
  const userInput = document.getElementById("login-user").value.trim();
  const passInput = document.getElementById("login-pass").value.trim();

  if (!userInput || !passInput) {
    alert("Ism/Telefon va Parolni kiriting!");
    return;
  }

  let users = JSON.parse(localStorage.getItem("crm_users")) || [];

  // Izlash
  const user = users.find(u => 
    (u.name.toLowerCase() === userInput.toLowerCase() || u.phone === userInput) && u.pass === passInput
  );

  if (user) {
    localStorage.setItem("current_user", JSON.stringify(user));
    showDashboard(user);
  } else {
    alert("Ism yoki parol xato! Qayta urinib ko'ring yoki Ro'yxatdan o'ting.");
  }
}

// DASHBOARDNI KO'RSATISH
function showDashboard(user) {
  document.getElementById("auth-modal").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  document.getElementById("app-store-name").innerText = user.store || "Parda Do'koni";
  document.getElementById("current-user-display").innerText = `${user.name} (${user.role.toUpperCase()})`;
}

// SESSIYANI TEKSHIRISH (F5 QILINGANDA HAM SAQLANISHI UCHUN)
function checkSession() {
  const currentUser = JSON.parse(localStorage.getItem("current_user"));
  if (currentUser) {
    showDashboard(currentUser);
  }
}

// CHIQISH (LOGOUT)
function handleLogout() {
  localStorage.removeItem("current_user");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("auth-modal").classList.remove("hidden");
}