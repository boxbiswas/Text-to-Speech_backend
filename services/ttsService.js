export const getProviderVoices = async () => {
    // Simulated delay to mimic external API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Realistic TTS provider data structure
    return [
        { id: 'en-US-1', name: 'Alloy', languageCode: 'en-US', languageName: 'English (US)', gender: 'Neutral' },
        { id: 'en-US-2', name: 'Echo', languageCode: 'en-US', languageName: 'English (US)', gender: 'Male' },
        { id: 'en-GB-1', name: 'Onyx', languageCode: 'en-GB', languageName: 'English (UK)', gender: 'Male' },
        { id: 'es-ES-1', name: 'Nova', languageCode: 'es-ES', languageName: 'Spanish (Spain)', gender: 'Female' },
        { id: 'fr-FR-1', name: 'Shimmer', languageCode: 'fr-FR', languageName: 'French', gender: 'Female' },
    ];
};