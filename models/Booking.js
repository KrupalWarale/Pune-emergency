const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Booking = sequelize.define('Booking', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for guest bookings
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  patientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  patientPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  emergencyType: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT
  },
  longitude: {
    type: DataTypes.FLOAT
  },
  ambulanceId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Ambulances',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'in-progress', 'acknowledged', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('normal', 'high', 'critical'),
    defaultValue: 'normal'
  },
  notes: {
    type: DataTypes.TEXT
  },
  patientCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  incidentDescription: {
    type: DataTypes.TEXT
  },
  preparationNeeded: {
    type: DataTypes.TEXT
  },
  estimatedArrival: {
    type: DataTypes.DATE
  },
  completedAt: {
    type: DataTypes.DATE
  }
});

module.exports = Booking;
