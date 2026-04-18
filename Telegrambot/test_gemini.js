require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        console.log("Listing models...");
        // This is a quick fetch using node-fetch directly to the API, since listModels might not exist on older SDKs
        const fetch = require('node-fetch');
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        console.log(data.models.map(m => m.name).join('\n'));
    } catch(e) { console.error(e) }
}
test();
