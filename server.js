const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sequelize = require('./models/index');
const Hospital = require('./models/Hospital');
const Ambulance = require('./models/Ambulance');
const Booking = require('./models/Booking');
const BloodBank = require('./models/BloodBank');
const Patient = require('./models/Patient');
const User = require('./models/User');
const UserActivity = require('./models/UserActivity');
const { ensureEmergencyInventory } = require('./utils/bootstrapInventory');
const { ensureBookingSchema } = require('./utils/ensureSchema');

const app = express();

// Production-ready middleware
app.use(cors());
app.use(express.json());

// Dynamic serving of HTML to inject API key from .env
app.get(['/', '/index.html'], (req, res, next) => {
  const urlPath = req.path === '/' ? '/index.html' : req.path;
  const filePath = path.join(__dirname, 'public', urlPath);
  
  if (fs.existsSync(filePath) && filePath.endsWith('.html')) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/%GOOGLE_MAPS_API_KEY%/g, process.env.GOOGLE_MAPS_API_KEY || 'MISSING_API_KEY');
      res.send(content);
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Serve remaining static files
app.use(express.static(path.join(__dirname, 'public')));

// Define associations
Hospital.hasMany(Ambulance, { foreignKey: 'hospitalId', as: 'ambulances' });
Ambulance.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Hospital.hasMany(BloodBank, { foreignKey: 'hospitalId', as: 'bloodBanks' });
BloodBank.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Ambulance.hasMany(Booking, { foreignKey: 'ambulanceId', as: 'bookings' });
Booking.belongsTo(Ambulance, { foreignKey: 'ambulanceId', as: 'ambulance' });

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserActivity, { foreignKey: 'userId', as: 'activities' });
UserActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// API Routes
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/ambulance', require('./routes/ambulances'));
app.use('/api/blood', require('./routes/blood'));
app.use('/api/patient', require('./routes/patients'));
app.use('/api/sos', require('./routes/sos'));

// Authentication and dashboard routes
const { router: authRouter } = require('./routes/auth');
app.use('/api/auth', authRouter);
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/hospital-dashboard', require('./routes/hospital_dashboard'));

// Basic 404 handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync()
  .then(async () => {
    await ensureBookingSchema(sequelize);
    await ensureEmergencyInventory();
    console.log('✅ Supabase database connected and synced');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🌐 Open in browser: \x1b]8;;http://localhost:${PORT}\x1b\\http://localhost:${PORT}\x1b]8;;\x1b\\`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });
