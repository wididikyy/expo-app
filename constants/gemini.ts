import { Content, GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.geminiApiKey || '';

if (!API_KEY) {
    console.warn('Gemini API key tidak ditemukan!');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateText = async (prompt: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating text:', error);
        throw error;
    }
};

export const chatWithGemini = async (
    history: Content[],
    message: string
): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: 'You are a helpful English learning assistant.',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });
        const chat = model.startChat({ history: history });
        const result = await chat.sendMessage(message);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('Error in chat:', error);
        throw error;
    }
};

// Generate random debate topic
export const generateDebateTopic = async (): Promise<string> => {
    const prompt = `Generate one random interesting debate topic for English learners. 
    The topic should be:
    - Suitable for intermediate to advanced English learners
    - Engaging and thought-provoking
    - Not too controversial or sensitive
    - Can be discussed in 5-10 minutes
    
    Just give the topic, no explanation. Format: "Topic: [your topic here]"`;
    
    return await generateText(prompt);
};

// Generate pronunciation practice text
export const generatePronunciationText = async (): Promise<string> => {
    const prompt = `Generate a short English text (2-3 sentences) for pronunciation practice.
    The text should:
    - Include common English words that are often mispronounced
    - Be interesting and meaningful
    - Include a mix of different sounds and phonemes
    - Be suitable for intermediate learners
    
    Just give the text, no explanation or title.`;
    
    return await generateText(prompt);
};

// Analyze pronunciation from audio (using multimodal capability)
export const analyzePronunciation = async (
    originalText: string,
    audioBase64: string
): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash"
        });
        
        const prompt = `You are an English pronunciation teacher. 
        
The student was supposed to read this text:
"${originalText}"

Please analyze their pronunciation and provide:
1. Overall pronunciation score (0-100)
2. Specific words that were mispronounced
3. Common pronunciation errors detected
4. Tips for improvement
5. Encouragement and positive feedback

Be constructive and encouraging in your feedback.`;

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: "audio/mp3",
                    data: audioBase64
                }
            }
        ]);
        
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('Error analyzing pronunciation:', error);
        throw error;
    }
};

// Analyze grammar in debate/chat
export const analyzeGrammar = async (
    userMessage: string,
    context: string = ''
): Promise<string> => {
    const prompt = `You are an English grammar teacher. 
    
${context ? `Context: ${context}\n\n` : ''}Student's message: "${userMessage}"

Please analyze the grammar and provide:
1. Grammar score (0-100)
2. Grammatical errors (if any) with corrections
3. Suggestions for better sentence structure
4. Vocabulary usage feedback
5. Brief encouragement

Format your response clearly with sections.`;

    return await generateText(prompt);
};