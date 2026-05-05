const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['processing', 'ready'], 
        default: 'processing' 
    },
    summary: { type: String, default: "" },
    keyPoints: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);