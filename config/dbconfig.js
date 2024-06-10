require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

module.exports = config;


// const pool = mysql.createPool({
//   server: process.env.DB_SERVER,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
// });

// module.exports = pool;