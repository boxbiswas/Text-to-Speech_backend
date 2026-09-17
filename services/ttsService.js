import { PollyClient, DescribeVoicesCommand, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const getPollyClient = () => {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
        throw new Error("AWS credentials are missing in .env");
    }

    return new PollyClient({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY
        }
    });
};

export const getProviderVoices = async () => {
    // --- AMAZON POLLY IMPLEMENTATION ---
    const client = getPollyClient();
    let allVoices = [];
    let nextToken = undefined;
    
    try {
        do {
            const command = new DescribeVoicesCommand({ NextToken: nextToken });
            const response = await client.send(command);
            allVoices = allVoices.concat(response.Voices);
            nextToken = response.NextToken;
        } while (nextToken);
        
        return allVoices.map(v => ({
            id: v.Id,
            name: v.Name,
            languageCode: v.LanguageCode,
            languageName: v.LanguageName,
            gender: v.Gender,
            additionalLanguageCodes: v.AdditionalLanguageCodes || [],
            supportedEngines: v.SupportedEngines || []
        }));
    } catch (error) {
        console.error("Polly DescribeVoices Error:", error);
        throw new Error(`Failed to fetch voices from Amazon Polly: ${error.message}`);
    }

    /* --- ELEVENLABS IMPLEMENTATION (COMMENTED OUT) ---
    const { ELEVENLABS_API_KEY } = process.env;
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is missing in .env");
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });
    if (!response.ok) throw new Error(`Failed to fetch voices from ElevenLabs: ${response.statusText}`);
    const data = await response.json();
    return data.voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        languageCode: 'multilingual', 
        languageName: 'Multilingual',
        gender: v.labels?.gender || 'Neutral'
    }));
    ---------------------------------------------------*/

    /* --- AZURE IMPLEMENTATION (COMMENTED OUT) ---
    const { TTS_API_KEY, TTS_REGION, TTS_ENDPOINT } = process.env;
    if (!TTS_API_KEY || !TTS_REGION) throw new Error("TTS credentials (TTS_API_KEY, TTS_REGION) are missing in .env");
    const endpoint = TTS_ENDPOINT || `https://${TTS_REGION}.tts.speech.microsoft.com`;
    const url = `${endpoint.replace(/\/$/, '')}/cognitiveservices/voices/list`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Ocp-Apim-Subscription-Key': TTS_API_KEY }
    });
    if (!response.ok) throw new Error(`Failed to fetch voices from TTS provider: ${response.statusText}`);
    const voices = await response.json();
    return voices.map(v => ({
        id: v.ShortName, name: v.LocalName || v.ShortName,
        languageCode: v.Locale, languageName: v.LocaleName, gender: v.Gender
    }));
    ------------------------------------------------*/
};

export const generateAudio = async (text, language, voice, format = 'mp3') => {
    // --- AMAZON POLLY IMPLEMENTATION ---
    const client = getPollyClient();
    
    // Map our internal format to Polly's OutputFormat
    const pollyOutputFormat = format === 'ogg' ? 'ogg_vorbis' : 'mp3';
    const mimeType = format === 'ogg' ? 'audio/ogg' : 'audio/mp3';

    const command = new SynthesizeSpeechCommand({
        OutputFormat: pollyOutputFormat,
        Text: text,
        VoiceId: voice,
        Engine: 'neural' // Default to neural, the fallback below will handle standard
    });

    try {
        const response = await client.send(command);
        const byteArray = await response.AudioStream.transformToByteArray();
        const buffer = Buffer.from(byteArray);
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error("Polly SynthesizeSpeech Error:", error);
        if (error.message.includes('engine is not supported') || error.message.includes('does not support the selected engine')) {
            console.log(`Falling back to standard engine for voice: ${voice}`);
            const standardCommand = new SynthesizeSpeechCommand({
                OutputFormat: pollyOutputFormat, Text: text, VoiceId: voice, Engine: 'standard'
            });
            const standardResponse = await client.send(standardCommand);
            const byteArray = await standardResponse.AudioStream.transformToByteArray();
            const buffer = Buffer.from(byteArray);
            return `data:${mimeType};base64,${buffer.toString('base64')}`;
        }
        throw new Error(`Failed to generate audio from Amazon Polly: ${error.message}`);
    }

    /* --- ELEVENLABS IMPLEMENTATION (COMMENTED OUT) ---
    const { ELEVENLABS_API_KEY } = process.env;
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is missing in .env");
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({ text: text, model_id: "eleven_multilingual_v2" })
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs TTS Error:", errorText);
        throw new Error(`Failed to generate audio from ElevenLabs: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:audio/mp3;base64,${buffer.toString('base64')}`;
    ---------------------------------------------------*/

    /* --- AZURE IMPLEMENTATION (COMMENTED OUT) ---
    const { TTS_API_KEY, TTS_REGION, TTS_ENDPOINT } = process.env;
    if (!TTS_API_KEY || !TTS_REGION) throw new Error("TTS credentials (TTS_API_KEY, TTS_REGION) are missing in .env");
    const endpoint = TTS_ENDPOINT || `https://${TTS_REGION}.tts.speech.microsoft.com`;
    const url = `${endpoint.replace(/\/$/, '')}/cognitiveservices/v1`;
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
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:audio/mp3;base64,${buffer.toString('base64')}`;
    ------------------------------------------------*/
};