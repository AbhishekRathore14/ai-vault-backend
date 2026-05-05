const axios = require('axios');
const { tavily } = require("@tavily/core");

// Initialize Tavily with your environment variable
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
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
    // 1. Ask Tavily to find information on the web
    const searchData = await tvly.search(question, {
      searchDepth: "basic",
      maxResults: 3
    });
    
    // 2. Clean up the search results into a string
    const webResults = searchData.results.map(r => `${r.title}: ${r.content}`).join("\n");

    // 3. Send both your Note and the Web Results to Gemini
    const systemPrompt = "You are a research assistant. Use the provided Note Context AND Web Search results to answer. Return a valid JSON object with an 'answer' key.";
    const userContent = `
      NOTE CONTEXT: ${note.content}
      WEB SEARCH RESULTS: ${webResults}
      QUESTION: ${question}
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
    console.error("Agent Search Error:", error);
    return { answer: "I encountered an error while trying to search for that information." };
  }
};

module.exports = { generateSummary, generateQueryAnswer, generateOnDemandSummary };