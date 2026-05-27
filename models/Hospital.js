const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Hospital = sequelize.define('Hospital', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING
  },
  availableBeds: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  specialties: {
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('specialties');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('specialties', JSON.stringify(value));
    }
  },
  contactNumber: {
    type: DataTypes.STRING
  },
  ambulanceCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Hospital;
