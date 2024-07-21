const express = require('express');
const router = express.Router();
const verifyToken = require("../../dao/authentication/middleWare")
const { createAccount, updateAccountInfo, createAccountWithRole } = require('../../dao/userFeatures/testManageAccount');

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

router.post('/add-account-with-role', async (req, res) => {
  const accountData = req.body;
  const roleName = accountData.roleName || 'Customer'; // Default to 'Customer' if no roleName is provided
  
  console.log(`Request received at: POST /add-account-with-role - ${new Date().toLocaleString()}`);
  
  try {
    const { token, newRoleId } = await createAccountWithRole(accountData, roleName);
    res.status(200).json({ token, roleID: newRoleId });
  } catch (err) {
    console.error('Failed to create account:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.put('/update', verifyToken, async (req, res) => {
    const accountData = req.body;
    
    console.log(`Request received at: PUT /auth/update - ${new Date().toLocaleString()}`);
    
    try {
      const result = await updateAccountInfo(accountData, req.userId);
      res.status(200).json(result);
    } catch (err) {
      console.error('Failed to update account information:', err);
      res.status(500).json({ error: 'Failed to update account information' });
    }
  });

module.exports = router;
