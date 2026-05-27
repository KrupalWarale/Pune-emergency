const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATE
  },
  address: {
    type: DataTypes.TEXT
  },
  emergencyContact: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  profilePicture: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  // Health-related fields
  bloodGroup: {
    type: DataTypes.STRING
  },
  allergies: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  medications: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  medicalConditions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  healthId: {
    type: DataTypes.STRING,
    unique: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance method to check password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to get full name
User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Instance method to get initials
User.prototype.getInitials = function() {
  return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase();
};

module.exports = User;