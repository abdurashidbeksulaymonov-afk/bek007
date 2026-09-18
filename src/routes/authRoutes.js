const express = require('express');
const {
  publicUser,
  getState,
  getUserByLogin,
  getUserForSession,
  createSession,
  deleteSession,
  registerUser,
  updateAccess,
  deleteUser,
  createSale,
  clientConfig,
} = require('../services/supabaseStore');

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
  return (request.headers.cookie || '')
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
  const user = await getUserForSession(getSessionToken(request));
  response.json(await getState(user?.id));
});

router.get('/client-config', (request, response) => response.json(clientConfig));

router.post('/register', async (request, response) => {
  const { name, phone, password, role, avatar } = request.body || {};
  const normalizedPhone = String(phone || '').replace(/\s+/g, '').trim();
  const cleanName = String(name || '').trim();

  if (!cleanName || !normalizedPhone || !password) {
    return response.status(400).json({ message: 'Ism, telefon va parolni kiriting.' });
  }

  try {
    const user = await registerUser({ name: cleanName, phone: normalizedPhone, password, role, avatar });
    if (user.status !== 'approved') {
      return response.status(201).json({ user: publicUser(user), pending: true });
    }

    const token = await createSession(user.id);
    setSessionCookie(response, token);
    return response.status(201).json({ user: publicUser(user), state: await getState(user.id) });
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ message: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan.' });
    }
    throw error;
  }
});

router.post('/login', async (request, response) => {
  const { login, password } = request.body || {};
  const value = String(login || '').trim().toLowerCase();
  const user = await getUserByLogin(value, password || '');

  if (!user) return response.status(401).json({ message: 'Ism/telefon yoki parol noto\'g\'ri.' });
  if (user.status !== 'approved') return response.status(403).json({ message: 'Hisobingiz Boshliq tomonidan tasdiqlanishi kutilmoqda.' });

  const token = await createSession(user.id);
  setSessionCookie(response, token);
  response.json({ user: publicUser(user), state: await getState(user.id) });
});

router.post('/logout', async (request, response) => {
  await deleteSession(getSessionToken(request));
  response.clearCookie(sessionCookie);
  response.status(204).end();
});

router.patch('/users/:id/access', requireAdmin, async (request, response) => {
  if (request.params.id === request.currentUser.id) {
    return response.status(400).json({ message: 'Boshliq o\'z kirishini o\'zgartira olmaydi.' });
  }
  response.json({ user: publicUser(await updateAccess(request.params.id, Boolean(request.body.allowed))) });
});

router.delete('/users/:id', requireAdmin, async (request, response) => {
  if (request.params.id === request.currentUser.id) {
    return response.status(400).json({ message: 'Boshliq o\'z akkauntini o\'chira olmaydi.' });
  }
  await deleteUser(request.params.id);
  response.status(204).end();
});

router.post('/sales', async (request, response) => {
  const currentUser = await getUserForSession(getSessionToken(request));
  if (!currentUser || currentUser.status !== 'approved') {
    return response.status(401).json({ message: 'Avval tizimga kiring.' });
  }
  response.status(201).json({ sale: await createSale(currentUser.id, { ...request.body, employeeName: currentUser.name }) });
});

module.exports = router;
