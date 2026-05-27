const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Ambulance = sequelize.define('Ambulance', {
  vehicleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('available', 'busy', 'maintenance'),
    defaultValue: 'available'
  },
  driverName: {
    type: DataTypes.STRING
  },
  driverContact: {
    type: DataTypes.STRING
  },
  hospitalId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Hospitals',
      key: 'id'
    }
  },
  latitude: {
    type: DataTypes.FLOAT
  },
  longitude: {
    type: DataTypes.FLOAT
  }
});

module.exports = Ambulance;
