import { prisma } from '../lib/prisma.js';

export const createHistory = async (req, res) => {
    try {
        const { text, language, voice, audioUrl, audioFormat } = req.body;
        // Extract userId injected by the authMiddleware
        const userId = req.user.id; 

        // Validate that all required fields are present
        if (!text || !language || !voice || !audioUrl || !audioFormat) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Save the generated speech metadata to the database
        const history = await prisma.speechHistory.create({
            data: {
                userId,
                text,
                language,
                voice,
                audioUrl,
                audioFormat
            }
        });

        // Return the newly created history record
        return res.status(201).json(history);
    } catch (error) {
        console.error("Create History Error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all history records for this specific user, ordered by newest first
        const history = await prisma.speechHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        // Return the user's history list
        return res.status(200).json(history);
    } catch (error) {
        console.error("Get History Error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getHistoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Find the specific history record by its ID
        const history = await prisma.speechHistory.findUnique({
            where: { id }
        });

        // Check if the record actually exists
        if (!history) {
            return res.status(404).json({ message: 'History not found' });
        }

        // Ensure the logged-in user actually owns this record
        if (history.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this history' });
        }

        // Return the specific history item
        return res.status(200).json(history);
    } catch (error) {
        console.error("Get History By Id Error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // First, locate the record to verify ownership
        const history = await prisma.speechHistory.findUnique({
            where: { id }
        });

        // Check if the record actually exists before trying to delete
        if (!history) {
            return res.status(404).json({ message: 'History not found' });
        }

        // Ensure the logged-in user actually owns this record before deleting
        if (history.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this history' });
        }

        // Permanently delete the record from the database
        await prisma.speechHistory.delete({
            where: { id }
        });

        // Confirm successful deletion
        return res.status(200).json({ message: 'History deleted successfully' });
    } catch (error) {
        console.error("Delete History Error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
