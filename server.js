require('dotenv').config();

const express = require('express');
const path = require('path');
const smsRoutes = require('./src/routes/smsRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Asosiy papkadagi HTML, JS, CSS statik fayllarni ulash
app.use(express.static(__dirname));

// 2. API route'lar
app.use('/', smsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 3. Har qanday web so'rov kelganda index.html faylini ko'rsatish
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Vercel serverless muhitida ishlay olishi uchun app ni eksport qilamiz
module.exports = app;