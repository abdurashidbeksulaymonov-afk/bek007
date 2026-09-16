class SmsLog {
  constructor({
    id,
    client_id,
    phone,
    message,
    eskiz_message_id = null,
    status = 'PENDING',
    error_reason = null,
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString(),
  }) {
    this.id = id;
    this.client_id = client_id;
    this.phone = phone;
    this.message = message;
    this.eskiz_message_id = eskiz_message_id;
    this.status = status;
    this.error_reason = error_reason;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = SmsLog;
