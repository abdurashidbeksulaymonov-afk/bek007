const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dataDirectory = path.join(__dirname, '..', '..', 'data');
const stateFile = path.join(dataDirectory, 'app_state.json');
const sessionsFile = path.join(dataDirectory, 'sessions.json');
const defaultStoreName = 'XULKAROY PARDALARI';

const emptyState = () => ({
  storeName: defaultStoreName,
  approvalRequired: true,
  users: [],
  sales: [],
});

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${file}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(temporaryFile, file);
}

async function getState() {
  const state = await readJson(stateFile, emptyState());
  return {
    ...emptyState(),
    ...state,
    users: Array.isArray(state.users) ? state.users : [],
    sales: Array.isArray(state.sales) ? state.sales : [],
  };
}

async function saveState(state) {
  await writeJson(stateFile, state);
}

async function getSessions() {
  return readJson(sessionsFile, {});
}

async function saveSessions(sessions) {
  await writeJson(sessionsFile, sessions);
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function publicState(state, activeUserId) {
  return {
    storeName: state.storeName,
    approvalRequired: state.approvalRequired,
    users: state.users.map(publicUser),
    sales: state.sales,
    activeUserId: activeUserId || null,
  };
}

async function createSession(userId) {
  const sessions = await getSessions();
  const token = crypto.randomBytes(32).toString('hex');
  sessions[token] = { userId, createdAt: new Date().toISOString() };
  await saveSessions(sessions);
  return token;
}

async function getUserForSession(token) {
  if (!token) return null;
  const sessions = await getSessions();
  const session = sessions[token];
  if (!session) return null;
  const state = await getState();
  return state.users.find((user) => user.id === session.userId) || null;
}

async function deleteSession(token) {
  if (!token) return;
  const sessions = await getSessions();
  delete sessions[token];
  await saveSessions(sessions);
}

module.exports = {
  defaultStoreName,
  getState,
  saveState,
  hashPassword,
  publicUser,
  publicState,
  createSession,
  getUserForSession,
  deleteSession,
};
