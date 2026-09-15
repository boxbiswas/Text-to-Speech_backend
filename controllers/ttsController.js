import { getProviderVoices, generateAudio } from '../services/ttsService.js';

export const getVoices = async (req, res) => {
    try {
        const voices = await getProviderVoices();

        // Extract unique languages for the frontend
        const uniqueLanguages = Array.from(new Set(voices.map(v => v.languageCode)))
            .map(code => {
                const voice = voices.find(v => v.languageCode === code);
                return { code: voice.languageCode, name: voice.languageName };
            });

        return res.status(200).json({
            languages: uniqueLanguages,
            voices: voices
        });
    } catch (error) {
        console.error("Error fetching voices:", error);
        return res.status(500).json({ message: 'Failed to fetch voices from provider' });
    }
};

export const generateSpeech = async (req, res) => {
    try {
        const { text, language, voice } = req.body;

        // 1. Validate body
        if (!text || !language || !voice) {
            return res.status(400).json({ message: 'Text, language, and voice are required' });
        }
        if (text.length > 1000) {
            return res.status(400).json({ message: 'Text exceeds maximum limit of 1000 characters' });
        }

        // 2 & 3. Validate language and voice against provider list
        const voices = await getProviderVoices();
        const selectedVoice = voices.find(v => v.id === voice);
        
        if (!selectedVoice) {
            return res.status(400).json({ message: 'Invalid voice selected' });
        }
        if (selectedVoice.languageCode !== language) {
            return res.status(400).json({ message: 'Voice does not match the selected language' });
        }

        // 4 & 5. TTS Service - Generate audio
        const audioUrl = await generateAudio(text, language, voice);

        // 6. Return Audio URL
        return res.status(200).json({
            message: 'Audio generated successfully',
            audioUrl
        });

    } catch (error) {
        console.error("Error generating speech:", error);
        return res.status(500).json({ message: 'Failed to generate speech' });
    }
};