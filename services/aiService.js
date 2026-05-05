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
    // 1. Search the web for fresh info
    const searchData = await tvly.search(question, {
      searchDepth: "basic",
      maxResults: 3
    });
    
    const webContext = searchData.results.map(r => `${r.title}: ${r.content}`).join("\n");

    // 2. Updated prompt using both Note + Web data
    const systemPrompt = "You are an AI research assistant. Use the provided Note Context AND Web Search results to answer. Return a valid JSON object with a key 'answer'.";
    
    const userContent = `
      NOTE CONTEXT: ${note.content}
      WEB SEARCH RESULTS: ${webContext}
      USER QUESTION: ${question}
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
    console.error("Search/Query Error:", error);
    return { answer: "I encountered an error while searching for the answer." };
  }
};

module.exports = { generateSummary, generateQueryAnswer, generateOnDemandSummary };