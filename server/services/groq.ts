import Groq from "groq-sdk";

type SupportedLanguage = "en" | "hi" | "gu" | "mr" | "ta" | "bn";

function normalizeLanguage(input?: string): SupportedLanguage {
  if (!input) return "en";

  // Accept values like "hi-IN,hi;q=0.9,en;q=0.8" or "en-US".
  const primary = input.split(",")[0]?.trim().toLowerCase() || "en";
  const base = primary.split("-")[0] || "en";

  const supported: SupportedLanguage[] = ["en", "hi", "gu", "mr", "ta", "bn"];
  return supported.includes(base as SupportedLanguage) ? (base as SupportedLanguage) : "en";
}

// Debug API key loading
console.log('🔍 Groq API Key Status:', {
  present: !!process.env.GROQ_API_KEY,
  length: process.env.GROQ_API_KEY?.length || 0,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export interface DocumentSummary {
  summary: string;
  keyTerms: {
    employer?: string;
    employee?: string;
    salary?: string;
    startDate?: string;
    probation?: string;
  };
  documentType: string;
}

export interface RiskItem {
  level: "high" | "medium" | "low";
  title: string;
  description: string;
  section?: string;
}

export interface Clause {
  title: string;
  originalText: string;
  simplifiedText: string;
  section?: string;
}

export interface Recommendation {
  priority: number;
  title: string;
  description: string;
  actionType: "review" | "negotiate" | "legal" | "clarify";
}

export interface FullAnalysis {
  summary: DocumentSummary;
  riskItems: RiskItem[];
  clauses: Clause[];
  recommendations: Recommendation[];
  wordCount: number;
  riskLevel: "high" | "medium" | "low";
}

async function localizeAnalysis(
  analysis: FullAnalysis,
  language: SupportedLanguage,
  model: string,
): Promise<FullAnalysis> {
  if (language === "en") return analysis;

  const languageNames: Record<SupportedLanguage, string> = {
    en: "English",
    hi: "Hindi",
    gu: "Gujarati",
    mr: "Marathi",
    ta: "Tamil",
    bn: "Bengali",
  };

  const textMap: Record<string, string> = {};

  if (analysis.summary?.summary) textMap["summary.summary"] = analysis.summary.summary;
  if (analysis.summary?.documentType) textMap["summary.documentType"] = analysis.summary.documentType;

  Object.entries(analysis.summary?.keyTerms || {}).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      textMap[`summary.keyTerms.${key}`] = value;
    }
  });

  analysis.riskItems?.forEach((item, index) => {
    if (item.title) textMap[`riskItems.${index}.title`] = item.title;
    if (item.description) textMap[`riskItems.${index}.description`] = item.description;
    if (item.section) textMap[`riskItems.${index}.section`] = item.section;
  });

  analysis.clauses?.forEach((item, index) => {
    if (item.title) textMap[`clauses.${index}.title`] = item.title;
    if (item.originalText) textMap[`clauses.${index}.originalText`] = item.originalText;
    if (item.simplifiedText) textMap[`clauses.${index}.simplifiedText`] = item.simplifiedText;
    if (item.section) textMap[`clauses.${index}.section`] = item.section;
  });

  analysis.recommendations?.forEach((item, index) => {
    if (item.title) textMap[`recommendations.${index}.title`] = item.title;
    if (item.description) textMap[`recommendations.${index}.description`] = item.description;
  });

  if (Object.keys(textMap).length === 0) {
    return analysis;
  }

  const translationPrompt = `You are a precise translator for legal content.

Translate all values to ${languageNames[language]}.
Rules:
- Keep keys exactly unchanged.
- Return only valid JSON object with the same keys.
- Translate only values.
- Do not add, remove, or rename keys.`;

  try {
    const translationResponse = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: translationPrompt },
        {
          role: "user",
          content: `Translate this key-value JSON:\n\n${JSON.stringify(textMap)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const translatedText = translationResponse.choices[0]?.message?.content;
    if (!translatedText) return analysis;

    const translatedMap = JSON.parse(translatedText) as Record<string, string>;

    const localized: FullAnalysis = JSON.parse(JSON.stringify(analysis));

    const safeGet = (k: string) => {
      const v = translatedMap[k];
      return typeof v === "string" && v.trim() ? v : textMap[k];
    };

    if (localized.summary?.summary) localized.summary.summary = safeGet("summary.summary");
    if (localized.summary?.documentType) localized.summary.documentType = safeGet("summary.documentType");

    Object.keys(localized.summary?.keyTerms || {}).forEach((key) => {
      const mapKey = `summary.keyTerms.${key}`;
      const current = localized.summary.keyTerms[key as keyof typeof localized.summary.keyTerms];
      if (typeof current === "string" && textMap[mapKey]) {
        localized.summary.keyTerms[key as keyof typeof localized.summary.keyTerms] = safeGet(mapKey);
      }
    });

    localized.riskItems?.forEach((item, index) => {
      if (item.title) item.title = safeGet(`riskItems.${index}.title`);
      if (item.description) item.description = safeGet(`riskItems.${index}.description`);
      if (item.section) item.section = safeGet(`riskItems.${index}.section`);
    });

    localized.clauses?.forEach((item, index) => {
      if (item.title) item.title = safeGet(`clauses.${index}.title`);
      if (item.originalText) item.originalText = safeGet(`clauses.${index}.originalText`);
      if (item.simplifiedText) item.simplifiedText = safeGet(`clauses.${index}.simplifiedText`);
      if (item.section) item.section = safeGet(`clauses.${index}.section`);
    });

    localized.recommendations?.forEach((item, index) => {
      if (item.title) item.title = safeGet(`recommendations.${index}.title`);
      if (item.description) item.description = safeGet(`recommendations.${index}.description`);
    });

    return localized;
  } catch (error) {
    console.warn("⚠️ Localization pass failed, returning original analysis", error);
    return analysis;
  }
}

export async function analyzeDocument(content: string, documentType?: string, language: string = 'en'): Promise<FullAnalysis> {
  // Using Meta Llama 4 Scout model for document analysis
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";
  
  const normalizedLanguage = normalizeLanguage(language);

  const languageInstructions = {
    'en': 'Respond in English with clear, jargon-free explanations.',
    'hi': 'हिंदी में जवाब दें और कानूनी शब्दजाल को सरल भाषा में समझाएं।',
    'gu': 'ગુજરાતીમાં જવાબ આપો અને કાનૂની શબ્દજાળને સરળ ભાષામાં સમજાવો।',
    'mr': 'मराठीत उत्तर द्या आणि कायदेशीर शब्दजाल सोप्या भाषेत समजावून सांगा।',
    'ta': 'தமிழில் பதிலளிக்கவும் மற்றும் சட்ட வார்த்தைகளை எளிய மொழியில் விளக்கவும்.',
    'bn': 'বাংলায় উত্তর দিন এবং আইনি পরিভাষাগুলি সহজ ভাষায় ব্যাখ্যা করুন।'
  };
  
  const systemPrompt = `You are a legal document analysis expert. Analyze the provided legal document and provide a comprehensive breakdown in JSON format.

Your analysis should include:
1. A plain-language summary with key terms extracted
2. Risk assessment with specific items flagged by severity
3. Key clauses broken down with original and simplified text
4. Actionable recommendations prioritized by importance

Focus on:
- Clear, jargon-free explanations
- Identifying unusual or potentially problematic terms
- Providing practical, actionable advice
- Risk assessment using "high", "medium", "low" levels

Language Instructions: ${languageInstructions[normalizedLanguage]}

IMPORTANT:
- Write all user-facing text fields (summary, risk item titles/descriptions, clause titles/simplified text, recommendations) in the requested language.
- Keep enum values like riskLevel and riskItems.level strictly as: high, medium, low.

Document type context: ${documentType || "auto-detect"}

Respond with valid JSON matching this structure:
{
  "summary": {
    "summary": "string",
    "keyTerms": {
      "employer": "string",
      "employee": "string", 
      "salary": "string",
      "startDate": "string",
      "probation": "string"
    },
    "documentType": "string"
  },
  "riskItems": [
    {
      "level": "high|medium|low",
      "title": "string",
      "description": "string",
      "section": "string"
    }
  ],
  "clauses": [
    {
      "title": "string",
      "originalText": "string",
      "simplifiedText": "string",
      "section": "string"
    }
  ],
  "recommendations": [
    {
      "priority": number,
      "title": "string", 
      "description": "string",
      "actionType": "review|negotiate|legal|clarify"
    }
  ],
  "wordCount": number,
  "riskLevel": "high|medium|low"
}`;

  try {
    console.log('🚀 Starting Groq analysis...');
    console.log('📄 Content length:', content.length);
    console.log('🌍 Language:', normalizedLanguage, `(raw: ${language})`);
    
    // Retry logic for API overload
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📞 Groq API attempt ${attempt}/${maxRetries}`);
        
        const chatCompletion = await groq.chat.completions.create({
          model: model,
          messages: [
            { 
              role: "system", 
              content: systemPrompt 
            },
            { 
              role: "user", 
              content: `Document to analyze:\n\n${content}` 
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        console.log('✅ Groq API call successful');
        const analysisText = chatCompletion.choices[0]?.message?.content;
        
        console.log('📝 Response length:', analysisText?.length || 0);
        
        if (!analysisText) {
          throw new Error("Empty response from Groq API");
        }

        console.log('🔍 Parsing JSON response...');
        const analysis: FullAnalysis = JSON.parse(analysisText);
        
        // Validate and ensure required fields
        if (!analysis.summary || !analysis.riskItems || !analysis.clauses || !analysis.recommendations) {
          console.error('❌ Invalid analysis structure:', {
            hasSummary: !!analysis.summary,
            hasRiskItems: !!analysis.riskItems,
            hasClauses: !!analysis.clauses,
            hasRecommendations: !!analysis.recommendations
          });
          throw new Error("Invalid analysis structure from Groq API");
        }

        const localizedAnalysis = await localizeAnalysis(analysis, normalizedLanguage, model);

        console.log('✅ Analysis completed successfully');
        return localizedAnalysis;
        
      } catch (apiError: any) {
        lastError = apiError;
        
        // Check if it's an overload error (503 Service Unavailable)
        if (apiError.message?.includes('overloaded') || apiError.message?.includes('503') || apiError.status === 503) {
          console.warn(`⚠️ API overloaded on attempt ${attempt}/${maxRetries}`);
          
          if (attempt < maxRetries) {
            // Exponential backoff: 2s, 4s, 8s
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else {
          // For non-overload errors, don't retry
          throw apiError;
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error("Failed to analyze document after multiple attempts");
    
  } catch (error) {
    console.error("❌ Groq analysis error:", error);
    if (error instanceof SyntaxError) {
      console.error("📝 JSON Parse Error - Raw response:", error.message);
    }
    throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function answerQuestion(documentContent: string, question: string, previousContext?: string, language: string = 'en'): Promise<string> {
  // Using Meta Llama 4 Scout model for Q&A
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";
  
  const normalizedLanguage = normalizeLanguage(language);

  const languageInstructions = {
    'en': 'Respond in English with clear, accessible language.',
    'hi': 'हिंदी में जवाब दें और स्पष्ट, सुलभ भाषा का उपयोग करें।',
    'gu': 'ગુજરાતીમાં જવાબ આપો અને સ્પષ્ટ, સુલભ ભાષાનો ઉપયોગ કરો।',
    'mr': 'मराठीत उत्तर द्या आणि स्पष्ट, सुलभ भाषेचा वापर करा।',
    'ta': 'தமிழில் பதிலளிக்கவும் மற்றும் தெளிவான, அணுகக்கூடிய மொழியைப் பயன்படுத்தவும்.',
    'bn': 'বাংলায় উত্তর দিন এবং স্পষ্ট, সুলভ ভাষা ব্যবহার করুন।'
  };
  
  const systemPrompt = `You are a legal document assistant. Answer questions about the provided legal document using only the information contained within it.

Rules:
- Base your answers solely on the document content
- If information isn't in the document, clearly state that
- Provide specific references to sections or clauses when possible
- Use clear, accessible language
- Keep responses concise but comprehensive

Language Instructions: ${languageInstructions[normalizedLanguage]}`;

  const userMessage = `${previousContext ? `Previous conversation context:\n${previousContext}\n\n` : ''}Document content:\n${documentContent}\n\nQuestion: ${question}`;

  try {
    // Retry logic for API overload
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📞 QA API attempt ${attempt}/${maxRetries}`);
        
        const chatCompletion = await groq.chat.completions.create({
          model: model,
          messages: [
            { 
              role: "system", 
              content: systemPrompt 
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
        });
        
        const answer = chatCompletion.choices[0]?.message?.content;
        
        if (!answer) {
          throw new Error("Empty response from Groq API");
        }

        console.log('✅ QA response received successfully');
        return answer;
        
      } catch (apiError: any) {
        lastError = apiError;
        
        // Check if it's an overload error (503 Service Unavailable)
        if (apiError.message?.includes('overloaded') || apiError.message?.includes('503') || apiError.status === 503) {
          console.warn(`⚠️ QA API overloaded on attempt ${attempt}/${maxRetries}`);
          
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s (shorter for QA)
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ Waiting ${delay}ms before QA retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else {
          // For non-overload errors, don't retry
          throw apiError;
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error("Failed to answer question after multiple attempts");
    
  } catch (error) {
    console.error("Groq Q&A error:", error);
    throw new Error(`Failed to answer question: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
