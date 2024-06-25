const jwt = require('jsonwebtoken');
const sql = require('mssql');
require('dotenv').config
const secret = 'huyit'; // Replace with your actual secret


function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(403).json({ success: false, message: 'No token provided.' });
    }
  
    const tokenWithoutBearer = token.replace('Bearer ', '');
    console.log('Token received:', tokenWithoutBearer); // Debugging line
  
    jwt.verify(tokenWithoutBearer, secret, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to authenticate token.' });
      }
    
      console.log('Decoded token:', decoded); // Check decoded token
      req.user = decoded;
      next();
    });
    
  }

module.exports = verifyToken;
