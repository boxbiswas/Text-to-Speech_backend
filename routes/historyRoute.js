import express from 'express';
import { createHistory, getHistory, getHistoryById, deleteHistory } from '../controllers/historyController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All history routes require authentication
router.use(authenticate);

router.post('/', createHistory);
router.get('/', getHistory);
router.get('/:id', getHistoryById);
router.delete('/:id', deleteHistory);

export default router;
