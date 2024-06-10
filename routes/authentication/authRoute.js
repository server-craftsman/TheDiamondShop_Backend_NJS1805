const express = require('express');
const jwt = require('jsonwebtoken');
const { getUserByEmailAndPassword } = require('../../dao/authentication/loginDAO');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET; // Replace with your own secret key

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token found in request headers');
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.sendStatus(403); // Forbidden
    }
    console.log('Token verified successfully:', user);
    req.user = user;
    next();
  });
}


router.get('/protected', authenticateToken, (req, res) => {
  res.send(`Hello, ${req.user.roleName}`);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const users = await getUserByEmailAndPassword(email, password);

    if (users.length === 0) {
      return res.status(401).send('Invalid email or password');
    }

    const user = users[0];

    const token = jwt.sign(
      { accountId: user.AccountID, roleName: user.RoleName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { httpOnly: true }); // Set token in cookie
    res.json({ message: `Welcome ${user.RoleName}!`, token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

// POST request to log out
router.post('/logout', (req, res) => {
  // Clear the token from the client's cookie
  res.clearCookie('token'); // Clear token cookie

  // Respond with success message
  res.status(200).json({ message: 'Logout successful' });
});

module.exports = router;
