export const getProviderVoices = async () => {
    // --- ELEVENLABS IMPLEMENTATION ---
    const { ELEVENLABS_API_KEY } = process.env;

    if (!ELEVENLABS_API_KEY) {
        throw new Error("ELEVENLABS_API_KEY is missing in .env");
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch voices from ElevenLabs: ${response.statusText}`);
    }

    const data = await response.json();

    // ElevenLabs doesn't strictly categorize by "languageCode" in the same way,
    // so we provide a default English mapping, but you can adjust based on voice.labels
    return data.voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        languageCode: 'en-US', // Defaulting to en-US for simplicity as ElevenLabs v1 voices are primarily English/Multilingual
        languageName: 'English / Multilingual',
        gender: v.labels?.gender || 'Neutral'
    }));

    /* --- AZURE IMPLEMENTATION (COMMENTED OUT) ---
    const { TTS_API_KEY, TTS_REGION, TTS_ENDPOINT } = process.env;

    if (!TTS_API_KEY || !TTS_REGION) {
        throw new Error("TTS credentials (TTS_API_KEY, TTS_REGION) are missing in .env");
    }

    const endpoint = TTS_ENDPOINT || `https://${TTS_REGION}.tts.speech.microsoft.com`;
    const url = `${endpoint.replace(/\/$/, '')}/cognitiveservices/voices/list`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Ocp-Apim-Subscription-Key': TTS_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch voices from TTS provider: ${response.statusText}`);
    }

    const voices = await response.json();
    
    // Map Azure's response to our unified format
    return voices.map(v => ({
        id: v.ShortName, 
        name: v.LocalName || v.ShortName,
        languageCode: v.Locale, 
        languageName: v.LocaleName, 
        gender: v.Gender
    }));
    ------------------------------------------------*/
};

export const generateAudio = async (text, language, voice) => {
    // --- ELEVENLABS IMPLEMENTATION ---
    const { ELEVENLABS_API_KEY } = process.env;

    if (!ELEVENLABS_API_KEY) {
        throw new Error("ELEVENLABS_API_KEY is missing in .env");
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2" // Using the multilingual model for better quality
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs TTS Error:", errorText);
        throw new Error(`Failed to generate audio from ElevenLabs: ${response.statusText}`);
    }

    // Convert binary audio buffer directly to base64 Data URI
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');

    return `data:audio/mp3;base64,${base64Audio}`;

    /* --- AZURE IMPLEMENTATION (COMMENTED OUT) ---
    const { TTS_API_KEY, TTS_REGION, TTS_ENDPOINT } = process.env;

    if (!TTS_API_KEY || !TTS_REGION) {
        throw new Error("TTS credentials (TTS_API_KEY, TTS_REGION) are missing in .env");
    }

    const endpoint = TTS_ENDPOINT || `https://${TTS_REGION}.tts.speech.microsoft.com`;
    const url = `${endpoint.replace(/\/$/, '')}/cognitiveservices/v1`;

    // Azure TTS requires SSML format
    const ssml = `<speak version='1.0' xml:lang='${language}'><voice xml:lang='${language}' xml:gender='Neural' name='${voice}'>${text}</voice></speak>`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': TTS_API_KEY,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            'User-Agent': 'AuraVox'
        },
        body: ssml
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("TTS Provider Error:", errorText);
        throw new Error(`Failed to generate audio from provider: ${response.statusText}`);
    }

    // Convert binary audio buffer directly to base64 Data URI
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    
    return `data:audio/mp3;base64,${base64Audio}`;
    ------------------------------------------------*/
};