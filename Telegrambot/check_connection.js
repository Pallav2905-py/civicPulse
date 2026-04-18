
const https = require('https');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
// Use a known public endpoint to check internet first, then telegram
const checkUrl = 'https://api.telegram.org/bot' + token + '/getMe';

console.log('--- CONNECTION CHECK START ---');
console.log('Target:', checkUrl.replace(token, 'HIDDEN_TOKEN'));

const req = https.get(checkUrl, { rejectUnauthorized: false }, (res) => {
    console.log(`HTTP Status: ${res.statusCode}`);
    console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('--- BODY START ---');
        console.log(data.substring(0, 1000));
        console.log('--- BODY END ---');

        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                if (json.ok) {
                    console.log('SUCCESS: Connected to Telegram API and Token is VALID.');
                } else {
                    console.log('FAILURE: Connected to Telegram, but API returned error:', json);
                }
            } catch (e) {
                console.log('FAILURE: Received 200 OK but response is NOT JSON. Probably a login page.');
            }
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
            console.log('FAILURE: Redirect detected. You are likely behind a Captive Portal.');
            if (res.headers.location) {
                console.log('Login URL:', res.headers.location);
            }
        } else {
            console.log(`FAILURE: HTTP ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error('NETWORK ERROR:', e.message);
    if (e.message.includes('ETIMEDOUT')) console.log('Hint: Firewall blocking connection.');
    if (e.message.includes('ECONNREFUSED')) console.log('Hint: Connection refused.');
});

req.end();
