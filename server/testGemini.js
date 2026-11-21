
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function testGemini() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: "Hello! Reply in one sentence."
        });

        console.log("SUCCESS!");
        console.log(response.text);

    } catch (error) {
        console.log("STATUS:", error.status);
        console.log("ERROR:", error.message);
    }
}

testGemini();
