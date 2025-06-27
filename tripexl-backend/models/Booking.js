const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Booking = sequelize.define('Booking', {
  bookingId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  type: DataTypes.STRING,
  status: DataTypes.STRING,
  createdBy: DataTypes.STRING
}, {
  timestamps: true
});

module.exports = Booking;
