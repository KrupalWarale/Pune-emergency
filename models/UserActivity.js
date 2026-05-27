const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const UserActivity = sequelize.define('UserActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  activityType: {
    type: DataTypes.ENUM(
      'ambulance_booking',
      'hospital_search',
      'health_id_created',
      'health_id_updated',
      'volunteer_registration',
      'blood_search',
      'login',
      'profile_update'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.TEXT
  }
}, {
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['activityType']
    }
  ]
});

module.exports = UserActivity;