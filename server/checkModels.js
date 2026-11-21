
require("dotenv").config();

async function checkModels() {
    try {
        console.log("Checking available Gemini models...\n");

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models",
            {
                headers: {
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                }
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        const data = await response.json();

        const models = data.models || [];

        const availableModels = models.filter(model =>
            model.supportedGenerationMethods?.includes(
                "generateContent"
            )
        );

        availableModels.forEach(model => {
            console.log("Model:", model.name);
            console.log("Display name:", model.displayName);
            console.log("--------------------------");
        });

        console.log(
            "\nTotal available models:",
            availableModels.length
        );

    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkModels();
