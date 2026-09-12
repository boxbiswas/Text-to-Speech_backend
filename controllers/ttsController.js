import { getProviderVoices } from '../services/ttsService.js';

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