const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  username: DataTypes.STRING,
  password: DataTypes.STRING
}, {
  timestamps: false
});

module.exports = User;
