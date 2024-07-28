const express = require("express");
const router = express.Router();
const axios = require("axios"); // Ensure axios is imported

// Endpoint for fetching countries
router.get('/countries', async (req, res) => {
    try {
        console.log('Fetching countries from API...');
        const response = await axios.get('https://restcountries.com/v3.1/all'); // Example API
        const countries = response.data.map(country => ({ code: country.cca3, name: country.name.common }));
        res.json(countries);
    } catch (error) {
        console.error('Error fetching countries:', error.message);
        if (error.response) {
            // The request was made and the server responded with a status code that falls out of the range of 2xx
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            res.status(error.response.status).send('Error fetching countries');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request data:', error.request);
            res.status(500).send('No response received from the API');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
            res.status(500).send('Error setting up the request');
        }
    }
});

module.exports = router;
