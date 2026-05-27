const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Patient = sequelize.define('Patient', {
  healthId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATE
  },
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: false
  },
  allergies: {
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('allergies');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('allergies', JSON.stringify(value));
    }
  },
  currentMedications: {
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('currentMedications');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('currentMedications', JSON.stringify(value));
    }
  },
  chronicConditions: {
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('chronicConditions');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('chronicConditions', JSON.stringify(value));
    }
  },
  emergencyContacts: {
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('emergencyContacts');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('emergencyContacts', JSON.stringify(value));
    }
  },
  preferredHospital: {
    type: DataTypes.STRING
  }
});

module.exports = Patient;
