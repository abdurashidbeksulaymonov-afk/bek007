(function () {
  const DEFAULT_BASE_URL = 'https://notify.eskiz.uz/api';

  class EskizService {
    constructor(config = {}) {
      this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
      this.email = String(config.email || '').trim();
      this.password = String(config.password || '').trim();
      this.from = String(config.from || '').trim();
      this.token = null;
      this.tokenExpiresAt = 0;
    }

    isConfigured() {
      return Boolean(this.email && this.password);
    }

    normalizePhone(phone) {
      const digits = String(phone || '').replace(/\D+/g, '');

      if (!digits) {
        return '';
      }

      if (digits.startsWith('998')) {
        return digits;
      }

      if (digits.startsWith('0')) {
        return `998${digits.slice(1)}`;
      }

      if (digits.startsWith('9')) {
        return `998${digits}`;
      }

      return digits;
    }

    async getToken() {
      if (this.token && Date.now() < this.tokenExpiresAt) {
        return this.token;
      }

      if (!this.isConfigured()) {
        throw new Error('Eskiz konfiguratsiyasi to\'liq emas. ESKIZ_EMAIL va ESKIZ_PASSWORD ni kiriting.');
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

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData?.message || 'Eskiz auth/login xatosi yuz berdi.');
      }

      const token = responseData?.token || responseData?.data?.token || responseData?.data;

      if (!token) {
        throw new Error('Eskiz tokeni javobdan olinmadi.');
      }

      this.token = token;
      this.tokenExpiresAt = Date.now() + 50 * 60 * 1000;

      return this.token;
    }

    async sendSMS(phone, message) {
      const normalizedPhone = this.normalizePhone(phone);
      const trimmedMessage = String(message || '').trim();

      if (!normalizedPhone) {
        throw new Error('SMS yuborish uchun telefon raqami mavjud emas.');
      }

      if (!trimmedMessage) {
        throw new Error('SMS matni bo\'sh bo\'lishi mumkin emas.');
      }

      const token = await this.getToken();

      const payload = {
        mobile_phone: normalizedPhone,
        message: trimmedMessage,
      };

      if (this.from) {
        payload.from = this.from;
      }

      const response = await fetch(`${this.baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData?.message || responseData?.error || 'Eskiz message/sms/send xatosi yuz berdi.');
      }

      return responseData;
    }

    async sendWelcomeSMS(phone, customerName) {
      const message = `Hush kelibsiz, ${customerName}! Sizning ma'lumotlaringiz tizimga saqlandi.`;
      return this.sendSMS(phone, message);
    }
  }

  const root = typeof window !== 'undefined' ? window : globalThis;
  root.EskizService = EskizService;
}());
