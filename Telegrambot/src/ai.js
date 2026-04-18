const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `
You are an intelligent assistant for the "CivicPulse" grievance redressal system. 
Your goal is to help citizens report civic issues (potholes, garbage, water leaks, etc.) by gathering necessary details to fill a database schema.

The Database Schema requires:
- title (Short summary)
- description (Detailed explanation)
- category (e.g., Roads, Sanitation, Water, Electricity)
- priority (LOW, MEDIUM, HIGH, CRITICAL)
- department (e.g., Public Works, Health, Water Board)
- estimated_resolution (e.g., "24 hours", "3 days")

Your Task:
1. Analyze the user's input.
2. Extract the details to fill the Database Schema making realistic best-guesses for missing information based on the input context.
3. ALWAYS output the special JSON string ONLY. Do not ask follow-up questions or converse. Keep it strictly to the JSON output format.

Output Format:
- If gathering info: Just the text of your next question.
- If ready to submit: JSON structure like this:
{
  "COMPLETE": true,
  "title": "...",
  "description": "...",
  "category": "...",
  "priority": "...",
  "department": "...",
  "priority_score": 5.0,
  "estimated_resolution": "YYYY-MM-DDTHH:MM:SSZ" (Calculate based on current time + priority)
}
`;

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function processUserMessage(history, userText) {
    try {
        // Construct the chat history for Gemini
        // History format: [{ role: "user" | "model", parts: [{ text: "..." }] }]
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT + "\n\nCurrent Date: " + new Date().toISOString() }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to assist citizens with their grievances. Please connect me to the user." }]
                },
                ...history
            ],
        });

        const result = await chat.sendMessage(userText);
        const response = result.response.text();

        // Check if the AI returned the JSON block indicating completion
        const jsonMatch = response.match(/\{[\s\S]*"COMPLETE":\s*true[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[0]);
                return {
                    status: 'COMPLETE',
                    data: data,
                    reply: "Thanks! I have captured all the details." // AI usually doesn't say this if it outputs JSON, so we add a fallback
                };
            } catch (e) {
                console.error("Error parsing JSON from AI:", e);
                return { status: 'CONTINUE', reply: response };
            }
        } else {
            return { status: 'CONTINUE', reply: response };
        }

    } catch (error) {
        console.error("AI functionality failed:", error);
        // Fallback if AI fails
        return {
            status: 'ERROR',
            reply: "I'm having trouble retrieving my brain. Let's try that again. Please describe your issue."
        };
    }
}

module.exports = { processUserMessage };
