const fs = require('fs');
const path = require('path');
const SmsLog = require('../models/SmsLog');
const EskizService = require('../services/eskizService');

const STORAGE_FILE = path.join(__dirname, '../../data/sms_logs.json');

function ensureStorageFile() {
  const dir = path.dirname(STORAGE_FILE);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify([]), 'utf8');
  }
}

function readSmsLogs() {
  ensureStorageFile();

  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (error) {
    return [];
  }
}

function writeSmsLogs(logs) {
  ensureStorageFile();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(logs, null, 2), 'utf8');
}

function findSmsLogById(id) {
  const logs = readSmsLogs();
  return logs.find((item) => item.id === id) || null;
}

function persistSmsLog(smsLog) {
  const logs = readSmsLogs();
  const existingIndex = logs.findIndex((item) => item.id === smsLog.id);

  if (existingIndex >= 0) {
    logs[existingIndex] = { ...logs[existingIndex], ...smsLog, updated_at: new Date().toISOString() };
  } else {
    logs.unshift({ ...smsLog, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }

  writeSmsLogs(logs);
}

async function sendSmsForClient(clientId, phone, message) {
  const smsLog = new SmsLog({
    id: `sms-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    client_id: clientId,
    phone,
    message,
    status: 'PENDING',
  });

  persistSmsLog(smsLog);

  try {
    const eskizService = new EskizService({
      email: process.env.ESKIZ_EMAIL,
      password: process.env.ESKIZ_PASSWORD,
      from: process.env.ESKIZ_FROM,
      callbackUrl: process.env.ESKIZ_CALLBACK_URL,
    });

    const result = await eskizService.sendSMS(clientId, phone, message);

    const updatedLog = {
      ...smsLog,
      eskiz_message_id: result.eskizMessageId,
      status: 'DELIVERED',
      error_reason: null,
      updated_at: new Date().toISOString(),
    };

    persistSmsLog(updatedLog);

    return { success: true, log: updatedLog, data: result };
  } catch (error) {
    const failedLog = {
      ...smsLog,
      status: 'FAILED',
      error_reason: error.message,
      updated_at: new Date().toISOString(),
    };

    persistSmsLog(failedLog);

    return {
      success: false,
      log: failedLog,
      error: error.message,
    };
  }
}

async function handleClientCreate(req, res) {
  try {
    const { name, phone } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'name va phone majburiy.',
      });
    }

    const clientId = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const client = {
      id: clientId,
      name,
      phone,
    };

    const message = `Hush kelibsiz, ${name}! Sizning ma'lumotlaringiz tizimga saqlandi.`;

    const smsResult = await sendSmsForClient(clientId, phone, message);

    return res.status(201).json({
      success: true,
      client,
      sms: smsResult,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function handleSmsCallback(req, res) {
  try {
    const { message_id, status } = req.body || {};

    if (!message_id) {
      return res.status(400).json({
        success: false,
        message: 'message_id majburiy.',
      });
    }

    const logs = readSmsLogs();
    const target = logs.find((item) => item.eskiz_message_id === message_id || item.id === message_id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Bunday SMS logi topilmadi.',
      });
    }

    const normalizedStatus = status === 'delivered' ? 'DELIVERED' : status === 'failed' ? 'FAILED' : 'PENDING';

    const updatedLog = {
      ...target,
      status: normalizedStatus,
      updated_at: new Date().toISOString(),
    };

    persistSmsLog(updatedLog);

    return res.status(200).json({
      success: true,
      message: 'SMS statusi yangilandi.',
      log: updatedLog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  handleClientCreate,
  handleSmsCallback,
  sendSmsForClient,
  readSmsLogs,
  findSmsLogById,
};
