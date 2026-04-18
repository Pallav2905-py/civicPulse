
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in environment variables.');
  process.exit(1);
}

// Create a custom fetch that ignores SSL errors (for restricted networks)
const customFetch = (url, options) => {
  return fetch(url, {
    ...options,
    agent: new https.Agent({ rejectUnauthorized: false })
  });
};

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // No need for sessions in a bot backend
  },
  global: {
    fetch: customFetch
  }
});

console.log('✅ Supabase Client Initialized with Network Bypass');

module.exports = supabase;
