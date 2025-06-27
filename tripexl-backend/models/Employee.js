const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Employee = sequelize.define('Employee', {
  empId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: DataTypes.STRING,
  department: DataTypes.STRING
}, {
  tableName: 'EmployeeMaster',
  timestamps: false
});

module.exports = Employee;
