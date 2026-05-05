const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { generateSummary, generateQueryAnswer, generateOnDemandSummary } = require('../services/aiService');

// 1. GET ALL NOTES
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GET SINGLE NOTE (Required for Detail Page)
router.get('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2.5 GET AI SUMMARY
router.get('/:id/summary', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

   const summaryText = await generateOnDemandSummary(note.content);
    res.json({ summary: summaryText });
  } catch (error) {
    console.error("Summary Route Error:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// 3. DELETE NOTE (Required for CRUD)
router.delete('/:id', async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. CREATE NOTE (With upgraded error handling)
router.post('/', async (req, res) => {
    try {
        const { title, content } = req.body;
        const newNote = new Note({ title, content, status: 'processing' });
        await newNote.save();
        
        res.status(201).json(newNote); // Immediate response

        // Async Background Processing
        generateSummary(content).then(async (aiResult) => {
            if (aiResult) {
                await Note.findByIdAndUpdate(newNote._id, { ...aiResult, status: 'ready' });
                console.log(`✅ AI processing complete for: "${title}"`);
            } else {
                // FIXED: Prevents note from being stuck in "processing" if AI fails
                await Note.findByIdAndUpdate(newNote._id, { status: 'failed' });
                console.log(`❌ AI processing failed for: "${title}"`);
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. SMART QUERY (The core assignment feature)
router.post('/:id/query', async (req, res) => {
    try {
        const { question } = req.body;
        const note = await Note.findById(req.params.id);
        
        if (!note) return res.status(404).json({ error: 'Note not found' });
        if (note.status !== 'ready') return res.status(400).json({ error: 'Note is still processing' });

        const aiResponse = await generateQueryAnswer(note, question);
        res.json(aiResponse);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;