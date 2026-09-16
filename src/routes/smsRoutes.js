const express = require('express');
const { handleClientCreate, handleSmsCallback } = require('../controllers/smsController');

const router = express.Router();

router.post('/api/clients', handleClientCreate);
router.post('/api/sms/callback', handleSmsCallback);

module.exports = router;
