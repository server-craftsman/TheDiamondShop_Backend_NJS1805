const sql = require('mssql');
require('dotenv').config();

const options = {
  encrypt: true, // Encrypt data sent between the application and SQL Server
  trustServerCertificate: true, // Trust self-signed certificate (for development only)
  connectTimeout: 60000, // Timeout in milliseconds (60 seconds) for establishing a connection
  requestTimeout: 60000 // Timeout in milliseconds (60 seconds) for each request
};

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options
};  