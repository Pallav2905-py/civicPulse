
const https = require('https');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const url = `https://api.telegram.org/bot${token}/getMe`;

// Ignore SSL
const agent = new https.Agent({
    rejectUnauthorized: false
});

console.log(`Fetching: ${url}`);

const req = https.get(url, { agent }, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY START:');
        console.log(data.substring(0, 500)); // Log first 500 chars
        console.log('BODY END');
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});
