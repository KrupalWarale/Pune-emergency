const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const BloodBank = sequelize.define('BloodBank', {
  hospitalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Hospitals',
      key: 'id'
    }
  },
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: false
  },
  availableUnits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = BloodBank;
