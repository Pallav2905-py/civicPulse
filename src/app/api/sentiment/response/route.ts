import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, sentimentLabel, empathyNote, department } = body;

        const RESPONSE_PROMPT = `You are a senior municipal officer writing an official but empathetic response to a citizen complaint.

Context:
- Complaint: "${title}"
- Details: "${description}"
- Citizen's emotional tone: ${sentimentLabel}
- Empathy guidance: ${empathyNote}
- Handling Department: ${department}

Write a professional, warm, and empathetic response (3-4 sentences max) that:
1. Acknowledges the citizen's concern and validates their feelings
2. States the specific action being taken
3. Gives a realistic timeline
4. Closes with reassurance

Tone rules:
- ANGRY/DISTRESSED: Extra warm, immediately acknowledge frustration, promise escalated attention
- FRUSTRATED: Apologize for the wait, give concrete next steps
- NEUTRAL: Professional and clear
- POSITIVE: Match their positivity, thank them for reporting

Write ONLY the response text. No labels, no headers. Address citizen as "Dear Citizen".`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: RESPONSE_PROMPT }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 200,
        });

        const response = completion.choices[0]?.message?.content?.trim() || "Thank you for bringing this to our attention. We are actively working on resolving your concern.";

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Empathy response generation failed:", error);
        return NextResponse.json({
            response: "Dear Citizen, thank you for your complaint. We have noted your concern and our team will address it promptly. You will receive updates on the progress. We apologize for any inconvenience caused."
        });
    }
}
