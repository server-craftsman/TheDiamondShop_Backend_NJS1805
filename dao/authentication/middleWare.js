const jwt = require('jsonwebtoken');
const sql = require('mssql');
require('dotenv').config
const secret = 'huyit'; // Replace with your actual secret


// function verifyToken(req, res, next) {
//     const token = req.headers['authorization'];
    
//     if (!token || !token.startsWith('Bearer ')) {
//       return res.status(403).json({ success: false, message: 'No token provided.' });
//     }
  
//     const tokenWithoutBearer = token.replace('Bearer ', '');
//     console.log('Token received:', tokenWithoutBearer); // Debugging line
  
//     jwt.verify(tokenWithoutBearer, secret, (err, decoded) => {
//       if (err) {
//         console.error('Token verification error:', err.message);
//         return res.status(500).json({ success: false, message: 'Failed to authenticate token.' });
//       }
    
//       console.log('Decoded token:', decoded); // Check decoded token
//       req.user = decoded;
//       // req.user = decoded.accountId;
//       next();
//     });
    
//   }

const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Token not provided.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token not provided.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach decoded user information to the request object
    next();
  } catch (error) {
    res.status(401).json({ message: 'Access denied. Invalid token.' });
  }
};

module.exports = verifyToken;
