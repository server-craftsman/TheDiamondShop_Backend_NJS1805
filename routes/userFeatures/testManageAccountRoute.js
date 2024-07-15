const express = require('express');
const router = express.Router();
const { createAccount } = require('../../dao/userFeatures/testManageAccount');

router.post('/add-account', async (req, res) => {
  const accountData = req.body;
  const roleName = accountData.roleName || 'Customer'; // Default to 'Customer' if no roleName is provided
  
  console.log(`Request received at: POST /auth/register - ${new Date().toLocaleString()}`);
  
  try {
    const { token, newRoleId } = await createAccount(accountData, roleName);
    res.status(200).json({ token, roleID: newRoleId });
  } catch (err) {
    console.error('Failed to create account:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

module.exports = router;
