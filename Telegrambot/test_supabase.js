
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fetch = require('node-fetch'); // Ensure node-fetch is used if available, or we wrap native fetch
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Custom fetch with insecure agent
const agent = new https.Agent({ rejectUnauthorized: false });

const customFetch = (url, options) => {
    return fetch(url, { ...options, agent });
};

console.log('--- SUPABASE CONNECTIVITY TEST ---');
console.log('URL:', supabaseUrl);

async function testConnection() {
    try {
        // 1. Try standard client first (might fail)
        console.log('\nAttempting Standard Connection...');
        const client1 = createClient(supabaseUrl, supabaseKey);
        const { data: d1, error: e1 } = await client1.from('complaints').select('count', { count: 'exact', head: true });

        if (e1) {
            console.error('Standard Connection Failed:', e1.message);
        } else {
            console.log('Standard Connection SUCCESS!');
            return;
        }
    } catch (err) {
        console.error('Standard Connection Exception:', err.message);
    }

    try {
        // 2. Try with custom fetch (fix)
        console.log('\nAttempting Insecure Connection (Fix)...');

        // Polyfill fetch if needed for the custom wrapper to work depending on node version
        // But supabase-js might perform its own fetch.
        // Let's pass the customFetch to the client options.

        const client2 = createClient(supabaseUrl, supabaseKey, {
            global: {
                fetch: customFetch
            }
        });

        const { data: d2, error: e2 } = await client2.from('complaints').select('count', { count: 'exact', head: true });

        if (e2) {
            console.error('Insecure Connection Failed:', e2.message);
        } else {
            console.log('Insecure Connection SUCCESS!');
            console.log('Data:', d2);
        }

    } catch (err) {
        console.error('Insecure Connection Exception:', err.message);
    }
}

testConnection();
