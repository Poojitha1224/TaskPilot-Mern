
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(message) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await ai.models.generateContentStream({
        model: "gemini-3.1-flash-lite",
        contents: message.trim()
      });
    } catch (error) {
      const isTemporaryError =
        error.status === 503 ||
        error.status === 429 ||
        error.message?.includes("UNAVAILABLE");

      if (!isTemporaryError || attempt === 3) {
        throw error;
      }

      console.log(`Gemini retry attempt ${attempt}...`);
      await delay(attempt * 2000);
    }
  }
}


exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Please enter a message."
            });
        }

        const stream = await generateWithRetry(message);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        for await (const chunk of stream) {
            if (chunk.text) {
                res.write(
                    `data: ${JSON.stringify({
                        delta: chunk.text
                    })}\n\n`
                );
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error("Gemini Error:", error);

        if (res.headersSent) {
            res.write(
                `data: ${JSON.stringify({
                    error: "AI response interrupted."
                })}\n\n`
            );
            return res.end();
        }

        res.status(error.status || 500).json({
            message: error.message
        });
    }
};
