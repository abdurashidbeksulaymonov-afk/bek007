# Smart Parda SMS Tracking Setup

This project now includes a lightweight server-side SMS tracking flow using Eskiz.uz.

## Environment variables

Create a `.env` file in the project root with values like:

```env
PORT=3000
ESKIZ_EMAIL=sizning_email@eskiz.uz
ESKIZ_PASSWORD=sizning_parol
ESKIZ_FROM=4546
ESKIZ_CALLBACK_URL=http://localhost:3000/api/sms/callback
```

## Run

```bash
npm install
npm start
```

## API examples

### Create client and trigger SMS

```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Ali Valiyev","phone":"+998901234567"}'
```

### Callback endpoint for Eskiz status updates

```bash
curl -X POST http://localhost:3000/api/sms/callback \
  -H "Content-Type: application/json" \
  -d '{"message_id":"12345","status":"delivered"}'
```

## Notes

- SMS sending errors do not block client creation.
- SMS status is stored in the local `data/sms_logs.json` file for demonstrative tracking.
- In a real production system, replace this file-based storage with a database such as PostgreSQL or MySQL.
