import express from 'express';
import { register, login, logout } from '../Controllers/authController.js';
import { authenticate } from '../Middlewares/authMiddleware.js'; // Your provided middleware

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

export default router;