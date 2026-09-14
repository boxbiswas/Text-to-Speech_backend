import express from 'express';
import { getVoices } from '../controllers/ttsController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Based on your preference, mounted without /api prefix
router.get('/voices', authenticate, getVoices); // Add `authenticate` middleware here if this route should be protected

export default router;