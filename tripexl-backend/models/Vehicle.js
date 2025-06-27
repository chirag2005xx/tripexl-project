const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vehicle = sequelize.define('Vehicle', {
  vehicleId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  type: DataTypes.STRING,
  status: DataTypes.STRING
}, {
  timestamps: false
});

module.exports = Vehicle;
