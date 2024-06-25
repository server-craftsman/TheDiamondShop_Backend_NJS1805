const sql = require('mssql');
require('dotenv').config();

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    trustServerCertificate: true,
    encrypt: true, // If you're using Azure
    enableArithAbort: true // For handling arithmetic overflows
  },
  secret: process.env.JWT_SECRET || 'huyit'
};