import express from 'express';
import { getVoices, generateSpeech } from '../controllers/ttsController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /tts/voices
router.get('/voices', authenticate, getVoices);

// POST /tts (matches the requested /api/tts flow)
router.post('/', authenticate, generateSpeech);

export default router;