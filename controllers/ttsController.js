import { getProviderVoices, generateAudio } from '../services/ttsService.js';

export const getVoices = async (req, res) => {
    try {
        const voices = await getProviderVoices();

        // Extract all supported languages (primary and additional) for the frontend
        const languageMap = new Map();
        
        voices.forEach(voice => {
            // Add primary language
            if (!languageMap.has(voice.languageCode)) {
                languageMap.set(voice.languageCode, voice.languageName);
            }
            
            // Add additional languages (crucial for bilingual voices like Aditi who supports hi-IN)
            if (voice.additionalLanguageCodes) {
                voice.additionalLanguageCodes.forEach(code => {
                    if (!languageMap.has(code)) {
                        // Polly doesn't return the display name for additional languages in the voice object, 
                        // so we map common ones manually, or just use the code if unknown
                        let name = code;
                        if (code === 'hi-IN') name = 'Hindi';
                        if (code === 'en-IN') name = 'Indian English';
                        languageMap.set(code, name);
                    }
                });
            }
        });

        const uniqueLanguages = Array.from(languageMap.entries()).map(([code, name]) => ({ code, name }));

        // Sort alphabetically by name
        uniqueLanguages.sort((a, b) => a.name.localeCompare(b.name));

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
        const { text, language, voice, format = 'mp3' } = req.body;

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
        if (selectedVoice.languageCode !== language && (!selectedVoice.additionalLanguageCodes || !selectedVoice.additionalLanguageCodes.includes(language))) {
            return res.status(400).json({ message: 'Voice does not match the selected language' });
        }

        // 4 & 5. TTS Service - Generate audio
        const audioUrl = await generateAudio(text, language, voice, format);

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