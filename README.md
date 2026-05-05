# AI Knowledge Vault

Live Application:https://ai-vault-frontend-ouezcg9l5-abhishek-rathores-projects-bcfced08.vercel.app/
Backend API: https://ai-vault-backend-2hx1.onrender.com

A full-stack AI-powered knowledge management system built with Next.js, Node.js, MongoDB, and OpenRouter (Gemini 2.0 Flash).

## Setup Instructions

### Backend
1. Navigate to `ai-vault-backend`
2. Run `npm install`
3. Create a `.env` file based on `.env.example` and add your MongoDB URI and OpenRouter API Key.
4. Run `npm start` (Runs on port 5000)

### Frontend
1. Navigate to `ai-vault-frontend`
2. Run `npm install`
3. Run `npm run dev` (Runs on port 3000)

## Architecture & Strategy

### Async Processing
To ensure the HTTP response isn't blocked during note creation, the system saves the initial document to MongoDB with a `processing` status and immediately returns a 201 response to the client. The AI processing (OpenRouter call) is triggered asynchronously in the background. Once the promise resolves, the document is updated with the generated payload and marked as `ready`. If the AI call fails, it gracefully falls back to a `failed` status to prevent infinite loading states.

### Prompt Strategy
The system uses strict system prompts instructing the Gemini model to return outputs exclusively as valid JSON objects. By using OpenRouter's `response_format: { type: "json_object" }`, we guarantee predictable parsing on the backend. For the Smart Query feature, the original content is concatenated with the generated summary and key points to provide the LLM with maximum context for highly accurate answers.

### Trade-offs
* **Styling:** Opted for simple Tailwind utility classes over a complex component library (like shadcn/ui) to prioritize core backend functionality and async logic within the time constraint.
* **Database:** Used MongoDB directly via Mongoose for rapid schema iteration, prioritizing speed of development over the rigid structure of a SQL database.

### Optional Extensions Implemented
1. **Tag-based search / filtering:** Added a live search bar on the frontend to instantly filter notes by title or generated tags.
2. **Rate limiting on AI endpoints:** Implemented `express-rate-limit` on the backend to protect the OpenRouter API from spam and control potential API costs in a production environment.
