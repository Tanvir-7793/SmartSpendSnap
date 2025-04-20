require('dotenv').config();
const https = require('https');
const express = require('express');
const app = express();

// Define the API options
const options = {
    method: 'GET',
    hostname: 'yahoo-finance15.p.rapidapi.com',
    port: null,
    path: '/api/v2/markets/news?tickers=AAPL&type=ALL',
    headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
    }
};

// Define the /news endpoint
app.get('/news', (req, res) => {
    const req = https.request(options, (apiRes) => {
        const chunks = [];
        apiRes.on('data', (chunk) => chunks.push(chunk));
        apiRes.on('end', () => {
            const body = Buffer.concat(chunks);
            try {
                const jsonResponse = JSON.parse(body.toString());
                res.json(jsonResponse); // Send data to the frontend
            } catch (error) {
                res.status(500).send('Error parsing API response');
            }
        });
    });

    req.on('error', (error) => res.status(500).send('API Request Error'));
    req.end();
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`News API server is running on port ${PORT}`);
});