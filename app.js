import "dotenv/config";
import express from 'express';

import cookieParser from 'cookie-parser';
import cors from 'cors';

import { prisma } from "./lib/prisma.js";

const app = express();

// Cors configuration
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://text-to-speech-frontend-alpha.vercel.app"
    ],
    credentials: true, // This allows the cookies to be sent back and forth
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie']
}))


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Import routes
import authRoute from './routes/authRoute.js';
import ttsRoute from './routes/ttsRoutes.js';
import historyRoute from './routes/historyRoute.js';

// Use routes
app.use('/auth', authRoute);
app.use('/tts', ttsRoute);
app.use('/history', historyRoute);

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});