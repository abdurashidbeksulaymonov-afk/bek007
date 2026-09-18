require('dotenv').config();

const express = require('express');
const path = require('path');
const smsRoutes = require('./src/routes/smsRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik fayllarni (CSS, JS, SVG va h.k.) birinchi bo'lib tarqatish
app.use(express.static(__dirname));

// API marshrutlari
app.use('/api', smsRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Faqat HTML sahifalarga mo'ljallangan catch-all route
app.get('*', (req, res) => {
  // Agar so'rov CSS, JS yoki rasm fayllariga kelgan bo'lsa, uni tushirib yubormaslik
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = app;

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`Smart Parda server ${port}-portda ishga tushdi.`);
  });
}