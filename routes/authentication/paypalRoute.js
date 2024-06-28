const express = require('express');
const axios = require('axios');
const router = express.Router();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Use 'https://api-m.paypal.com' for live

router.post('/create-paypal-order', async (req, res) => {
    const { totalPrice } = req.body;

    try {
        const accessToken = await generateAccessToken();

        const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: totalPrice,
                    },
                },
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        res.json({ id: response.data.id });
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        res.status(500).json({ error: 'An error occurred while creating PayPal order.' });
    }
});

router.post('/capture-paypal-order', async (req, res) => {
    const { orderId } = req.body;

    try {
        const accessToken = await generateAccessToken();

        const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error capturing PayPal order:', error);
        res.status(500).json({ error: 'An error occurred while capturing PayPal order.' });
    }
});

async function generateAccessToken() {
    const response = await axios({
        url: `${PAYPAL_API}/v1/oauth2/token`,
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
            username: PAYPAL_CLIENT_ID,
            password: PAYPAL_SECRET,
        },
        data: 'grant_type=client_credentials',
    });

    return response.data.access_token;
}

module.exports = router;
