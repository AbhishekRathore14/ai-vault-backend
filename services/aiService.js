const axios = require('axios');

const generateSummary = async (content) => {
    try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-001",
            messages: [
                {
                    role: "system",
                    content: "You are an assistant that summarizes notes. Return ONLY a valid JSON object with: summary (string, maximum 3 sentences), keyPoints (array of 3-5 short strings), and tags (array of 3-5 single-word strings). Do not include any prose, explanations, or markdown fences."
                },
                {
                    role: "user",
                    content: `Analyze this note content: ${content}`
                }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error("AI Service Error:", error.response?.data || error.message);
        return null; // Returning null triggers our failure fallback in the routes
    }
};

// Paste this at Line 31
const generateOnDemandSummary = async (content) => {
  try {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "google/gemini-2.0-flash-001",
      messages: [
        { 
          role: "system", 
          content: "Summarize this technical note in 2-3 concise sentences focusing on core logic." 
        },
        { role: "user", content: content }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("On-Demand Summary Error:", error);
    return "Could not generate summary.";
  }
};

const generateQueryAnswer = async (note, question) => {
    try {
        const systemPrompt = "You are an AI assistant answering questions based strictly on the provided note context. Return a valid JSON object with a single key 'answer' containing your response.";
        
        // Combining content, summary, and keypoints as required by the assignment
        const userContent = `
        Context:
        Title: ${note.title}
        Summary: ${note.summary}
        Key Points: ${note.keyPoints.join(', ')}
        Original Content: ${note.content}

        Question: ${question}
        `;

        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-001",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
        console.error("Smart Query Error:", error);
        return { answer: "Sorry, the AI encountered an error processing your query." };
    }
};

module.exports = { generateSummary, generateQueryAnswer, generateOnDemandSummary };