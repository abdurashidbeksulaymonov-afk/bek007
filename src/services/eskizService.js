const { readFile, writeFile, existsSync, mkdirSync } = require('fs');
const path = require('path');

class EskizService {
  constructor({ email, password, from, callbackUrl, baseUrl = 'https://notify.eskiz.uz/api' } = {}) {
    this.email = String(email || '').trim();
    this.password = String(password || '').trim();
    this.from = String(from || '').trim();
    this.callbackUrl = String(callbackUrl || '').trim();
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = null;
    this.tokenExpiry = 0;
  }

  isConfigured() {
    return Boolean(this.email && this.password);
  }

  normalizePhone(phone) {
    if (!phone) {
      return '';
    }

    const digits = String(phone).replace(/\D+/g, '');

    if (!digits) {
      return '';
    }

    if (digits.startsWith('998')) {
      return digits;
    }

    if (digits.startsWith('0')) {
      return `998${digits.slice(1)}`;
    }

    if (/^9\d{8}$/.test(digits)) {
      return `998${digits}`;
    }

    return digits;
  }

  async getToken() {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    if (!this.isConfigured()) {
      throw new Error('Eskiz konfiguratsiyasi to\'liq emas. ESKIZ_EMAIL va ESKIZ_PASSWORD ni tekshiring.');
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: this.email,
        password: this.password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || 'Eskiz auth/login xatosi yuz berdi.');
    }

    const token = data?.token || data?.data?.token || data?.data;

    if (!token) {
      throw new Error('Eskiz tokeni javobdan olinmadi.');
    }

    this.token = token;
    this.tokenExpiry = Date.now() + 50 * 60 * 1000;

    return this.token;
  }

  async sendSMS(clientId, phone, message) {
    const normalizedPhone = this.normalizePhone(phone);
    const trimmedMessage = String(message || '').trim();

    if (!normalizedPhone) {
      throw new Error('SMS yuborish uchun telefon raqami noto\'g\'ri yoki bo\'sh kiritilgan.');
    }

    if (!trimmedMessage) {
      throw new Error('SMS matni bo\'sh bo\'lishi mumkin emas.');
    }

    const token = await this.getToken();

    const payload = {
      mobile_phone: normalizedPhone,
      message: trimmedMessage,
      from: this.from || undefined,
      callback_url: this.callbackUrl || undefined,
    };

    const response = await fetch(`${this.baseUrl}/message/sms/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Eskiz message/sms/send xatosi yuz berdi.');
    }

    const eskizMessageId = data?.data?.message_id || data?.message_id || data?.id || null;

    return {
      clientId,
      phone: normalizedPhone,
      message: trimmedMessage,
      eskizMessageId,
      response: data,
    };
  }
}

module.exports = EskizService;
