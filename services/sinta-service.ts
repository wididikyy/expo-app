import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const API_KEY = Constants.expoConfig?.extra?.geminiApiKey || '';

if (!API_KEY) {
    console.warn('Gemini API key tidak ditemukan!');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface SintaAnalysisResult {
  sintaLevel: string;
  publishabilityScore: number;
  completeness: number;
  weaknesses: string[];
  suggestions: string[];
  detailedAnalysis: {
    title: string;
    abstract: string;
    methodology: string;
    results: string;
    references: string;
  };
}

// Analyze Journal from Image (OCR + Analysis)
export const analyzeJournalFromImage = async (
  base64Image: string
): Promise<SintaAnalysisResult> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      }
    });

    const prompt = `You are an expert academic journal reviewer specializing in Indonesian SINTA (Science and Technology Index) evaluation.

Analyze this journal page image and provide a comprehensive assessment:

1. Extract and analyze visible text content
2. Evaluate based on SINTA criteria:
   - Research quality and originality
   - Methodology clarity and rigor
   - Literature review completeness
   - Results presentation
   - Discussion depth
   - Reference quality and recency

3. Predict SINTA level (1-6, where 1 is highest)
4. Calculate scores:
   - Publishability Score (0-100)
   - Completeness Score (0-100)

5. Identify specific weaknesses
6. Provide actionable improvement suggestions

Return your analysis in this JSON format:
{
  "sintaLevel": "SINTA X",
  "publishabilityScore": 0-100,
  "completeness": 0-100,
  "weaknesses": ["weakness1", "weakness2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "detailedAnalysis": {
    "title": "analysis of title quality",
    "abstract": "analysis of abstract",
    "methodology": "analysis of methodology",
    "results": "analysis of results",
    "references": "analysis of references"
  }
}

Be constructive, specific, and actionable in your feedback.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);

    const response = result.response.text();
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    }

    throw new Error('Failed to parse analysis result');
  } catch (error) {
    console.error('Error analyzing journal from image:', error);
    throw error;
  }
};

// Analyze Journal from PDF
export const analyzeJournalFromPDF = async (
  pdfUri: string
): Promise<SintaAnalysisResult> => {
  try {
    // Read PDF file as base64
    const pdfBase64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: 'base64',
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      }
    });

    const prompt = `You are an expert academic journal reviewer specializing in Indonesian SINTA evaluation.

Analyze this complete journal PDF and provide a comprehensive SINTA assessment:

Evaluate ALL sections:
1. Title and Keywords
2. Abstract (structure, clarity, completeness)
3. Introduction (background, problem statement, objectives)
4. Literature Review (comprehensiveness, recency)
5. Methodology (clarity, reproducibility, appropriateness)
6. Results (presentation, clarity, statistical analysis)
7. Discussion (depth, comparison with previous research)
8. Conclusion (alignment with objectives)
9. References (quantity, quality, recency)

SINTA Criteria Checklist:
- Original research contribution
- Methodological rigor
- Results significance
- Discussion quality
- Reference quality (prefer papers from last 5 years)
- Writing quality and structure
- Completeness of all sections

Predict SINTA level (1-6) and provide detailed scores.

Return analysis in this JSON format:
{
  "sintaLevel": "SINTA X",
  "publishabilityScore": 0-100,
  "completeness": 0-100,
  "weaknesses": ["specific weakness 1", "specific weakness 2", ...],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", ...],
  "detailedAnalysis": {
    "title": "detailed title analysis",
    "abstract": "detailed abstract analysis",
    "methodology": "detailed methodology analysis",
    "results": "detailed results analysis",
    "references": "detailed references analysis"
  }
}

Be thorough, specific, and constructive.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      }
    ]);

    const response = result.response.text();
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    }

    throw new Error('Failed to parse analysis result');
  } catch (error) {
    console.error('Error analyzing journal from PDF:', error);
    throw error;
  }
};

// Chat with AI Reviewer
export const chatWithReviewer = async (
  journalContext: string,
  chatHistory: { role: string; content: string }[],
  userMessage: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: `You are an expert academic journal reviewer helping improve a research paper for SINTA publication.

Journal context: ${journalContext}

Provide specific, actionable feedback. You can:
- Explain specific weaknesses in detail
- Suggest improvements for any section
- Provide revised versions of text
- Answer questions about SINTA criteria
- Give writing and structure advice

Be professional, constructive, and helpful. Keep responses concise and focused.`,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });

    // Convert chat history to Gemini format, ensuring it starts with 'user'
    const history = chatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant') // Only valid roles
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Start chat with history
    const chat = model.startChat({ 
      history: history.length > 0 ? history : undefined 
    });
    
    const result = await chat.sendMessage(userMessage);
    
    return result.response.text();
  } catch (error) {
    console.error('Error in reviewer chat:', error);
    throw error;
  }
};

// Generate improvement suggestions for specific section
export const generateSectionImprovement = async (
  section: 'abstract' | 'methodology' | 'results' | 'discussion',
  currentText: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });

    const sectionGuidelines = {
      abstract: 'Background, Problem, Method, Results, Conclusion. Max 250 words.',
      methodology: 'Clear, detailed, reproducible research procedures.',
      results: 'Clear presentation with tables/figures, statistical analysis.',
      discussion: 'Interpretation, comparison with previous research, implications.'
    };

    const prompt = `Improve this journal ${section} to meet SINTA standards.

Current text:
"${currentText}"

Guidelines for ${section}: ${sectionGuidelines[section]}

Provide:
1. Improved version of the text
2. Specific changes made
3. Why these changes improve the quality

Format your response clearly with sections.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating improvement:', error);
    throw error;
  }
};

// Extract text from image (pure OCR)
export const extractTextFromImage = async (
  base64Image: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });

    const prompt = `Extract all visible text from this image. 
Maintain the structure and formatting as much as possible.
Return only the extracted text, no additional commentary.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
};

// Check SINTA requirements checklist
export const checkSintaRequirements = async (
  journalText: string
): Promise<{
  passed: number;
  total: number;
  checklist: {
    item: string;
    status: 'pass' | 'fail' | 'warning';
    details: string;
  }[];
}> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });

    const prompt = `Evaluate this journal against SINTA requirements checklist:

Journal text: "${journalText}"

Check these requirements:
1. Title: Clear, specific, under 20 words
2. Keywords: 3-5 relevant keywords
3. Abstract: Complete structure, 150-250 words
4. Introduction: Clear problem statement and objectives
5. Methodology: Detailed and reproducible
6. Results: Clear presentation with data
7. Discussion: Compares with previous research
8. Conclusion: Aligns with objectives
9. References: At least 15 references, mostly recent (last 5 years)
10. Writing: Academic language, proper grammar

Return JSON:
{
  "passed": number,
  "total": 10,
  "checklist": [
    {
      "item": "requirement name",
      "status": "pass" | "fail" | "warning",
      "details": "specific explanation"
    },
    ...
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse checklist result');
  } catch (error) {
    console.error('Error checking requirements:', error);
    throw error;
  }
};