// middleware/verifyToken.js

const jwt = require('jsonwebtoken');
const { dbConfig } = require('../../config/dbconfig');
const sql = require('mssql');

const secret = process.env.JWT_SECRET; // Replace with your actual secret

// const verifyToken = async (req, res, next) => {
//     const token = req.headers.authorization;

//     if (!token || !token.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'Unauthorized: No token provided' });
//     }

//     try {
//         const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
//         req.user = decoded; // Attach user information to request object
//         next();
//     } catch (error) {
//         console.error('Error verifying token:', error.message);
//         return res.status(403).json({ message: 'Forbidden: Invalid token' });
//     }
// };

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(403).json({ success: false, message: 'No token provided.' });
    }
  
    const tokenWithoutBearer = token.replace('Bearer ', '');
    console.log('Token received:', tokenWithoutBearer); // Debugging line
  
    jwt.verify(tokenWithoutBearer, secret, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.message); // Debugging line
        return res.status(500).json({ success: false, message: 'Failed to authenticate token.' });
      }
  
      console.log('Decoded token:', decoded); // Debugging line
  
      // Attach accountId to the request object
      req.AccountID = decoded.accountId;
      req.user = decoded;
      next();
    });
  }

module.exports = verifyToken;
