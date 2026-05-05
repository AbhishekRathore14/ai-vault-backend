const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const noteRoutes = require('./routes/noteRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// NEW: API Rate Limiter
// This prevents spamming the AI endpoints (max 50 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, 
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});

// Apply the rate limiter specifically to our notes/AI routes
app.use('/api/notes', apiLimiter, noteRoutes);

app.get("/", (req, res) => {
  res.send("AI Vault Backend is running successfully!");
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));