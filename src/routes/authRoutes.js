const express = require('express');
const crypto = require('crypto');
const {
  defaultStoreName,
  getState,
  saveState,
  hashPassword,
  publicUser,
  publicState,
  createSession,
  getUserForSession,
  deleteSession,
} = require('../services/authStore');

const router = express.Router();
const sessionCookie = 'parda_session';

function setSessionCookie(response, token) {
  response.cookie(sessionCookie, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

function getSessionToken(request) {
  const cookies = request.headers.cookie || '';
  return cookies
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === sessionCookie)?.[1];
}

async function requireAdmin(request, response, next) {
  const user = await getUserForSession(getSessionToken(request));
  if (!user || user.role !== 'Admin' || user.status !== 'approved') {
    return response.status(403).json({ message: 'Faqat tasdiqlangan Boshliq bu amalni bajarishi mumkin.' });
  }
  request.currentUser = user;
  next();
}

router.get('/state', async (request, response) => {
  const state = await getState();
  const user = await getUserForSession(getSessionToken(request));
  response.json(publicState(state, user?.id));
});

router.post('/register', async (request, response) => {
  const { name, phone, password, role, avatar } = request.body || {};
  const normalizedPhone = String(phone || '').replace(/\s+/g, '').trim();
  const cleanName = String(name || '').trim();

  if (!cleanName || !normalizedPhone || !password) {
    return response.status(400).json({ message: 'Ism, telefon va parolni kiriting.' });
  }

  const state = await getState();
  if (state.users.some((user) => user.phone === normalizedPhone)) {
    return response.status(409).json({ message: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan.' });
  }

  const firstUser = state.users.length === 0;
  const newUser = {
    id: `user-${Date.now()}-${crypto.randomUUID()}`,
    name: cleanName,
    role: firstUser ? 'Admin' : (role === 'Employee' ? 'Employee' : 'Admin'),
    phone: normalizedPhone,
    passwordHash: hashPassword(password),
    avatar: avatar || '',
    status: firstUser ? 'approved' : 'pending',
    ...(firstUser ? { storeName: defaultStoreName } : {}),
  };

  state.users.push(newUser);
  await saveState(state);

  if (!firstUser) {
    return response.status(201).json({ user: publicUser(newUser), pending: true });
  }

  const token = await createSession(newUser.id);
  setSessionCookie(response, token);
  response.status(201).json({ user: publicUser(newUser), state: publicState(state, newUser.id) });
});

router.post('/login', async (request, response) => {
  const { login, password } = request.body || {};
  const value = String(login || '').trim().toLowerCase();
  const state = await getState();
  const user = state.users.find((item) =>
    (item.phone.toLowerCase() === value || item.name.trim().toLowerCase() === value)
    && item.passwordHash === hashPassword(password || '')
  );

  if (!user) return response.status(401).json({ message: 'Ism/telefon yoki parol noto\'g\'ri.' });
  if (user.status !== 'approved') return response.status(403).json({ message: 'Hisobingiz Boshliq tomonidan tasdiqlanishi kutilmoqda.' });

  const token = await createSession(user.id);
  setSessionCookie(response, token);
  response.json({ user: publicUser(user), state: publicState(state, user.id) });
});

router.post('/logout', async (request, response) => {
  await deleteSession(getSessionToken(request));
  response.clearCookie(sessionCookie);
  response.status(204).end();
});

router.patch('/users/:id/access', requireAdmin, async (request, response) => {
  const state = await getState();
  const user = state.users.find((item) => item.id === request.params.id);
  if (!user || user.id === request.currentUser.id) return response.status(404).json({ message: 'Foydalanuvchi topilmadi.' });

  user.status = request.body.allowed ? 'approved' : 'pending';
  await saveState(state);
  response.json({ user: publicUser(user) });
});

router.delete('/users/:id', requireAdmin, async (request, response) => {
  const state = await getState();
  if (request.params.id === request.currentUser.id) return response.status(400).json({ message: 'Boshliq o\'z akkauntini o\'chira olmaydi.' });
  state.users = state.users.filter((user) => user.id !== request.params.id);
  await saveState(state);
  response.status(204).end();
});

router.post('/sales', async (request, response) => {
  const currentUser = await getUserForSession(getSessionToken(request));
  if (!currentUser || currentUser.status !== 'approved') {
    return response.status(401).json({ message: 'Avval tizimga kiring.' });
  }

  const sale = request.body || {};
  const state = await getState();
  const normalizedSale = {
    ...sale,
    id: `sale-${Date.now()}-${crypto.randomUUID()}`,
    date: new Date().toISOString().slice(0, 10),
    employeeId: currentUser.id,
    employeeName: currentUser.name,
  };
  state.sales.unshift(normalizedSale);
  await saveState(state);
  response.status(201).json({ sale: normalizedSale });
});

module.exports = router;
