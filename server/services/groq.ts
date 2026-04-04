import Groq from "groq-sdk";

type SupportedLanguage = "en" | "hi" | "gu" | "mr" | "ta" | "bn";
type SummaryLength = "brief" | "standard" | "detailed";

function normalizeLanguage(input?: string): SupportedLanguage {
  if (!input) return "en";

  // Accept values like "hi-IN,hi;q=0.9,en;q=0.8" or "en-US".
  const primary = input.split(",")[0]?.trim().toLowerCase() || "en";
  const base = primary.split("-")[0] || "en";

  const supported: SupportedLanguage[] = ["en", "hi", "gu", "mr", "ta", "bn"];
  return supported.includes(base as SupportedLanguage) ? (base as SupportedLanguage) : "en";
}

function normalizeSummaryLength(input?: string): SummaryLength {
  if (!input) return "standard";
  const value = input.toLowerCase();
  if (value === "brief" || value === "standard" || value === "detailed") {
    return value;
  }
  return "standard";
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
  keyTerms: Record<string, string | undefined>;
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

async function enforceSummaryLength(
  content: string,
  currentSummary: string,
  language: SupportedLanguage,
  summaryLength: SummaryLength,
  model: string,
): Promise<string> {
  const targets: Record<SummaryLength, { min: number; max: number }> = {
    brief: { min: 70, max: 130 },
    standard: { min: 140, max: 230 },
    detailed: { min: 260, max: 420 },
  };

  const langInstruction: Record<SupportedLanguage, string> = {
    en: "Write in English.",
    hi: "हिंदी में लिखें।",
    gu: "ગુજરાતીમાં લખો।",
    mr: "मराठीत लिहा।",
    ta: "தமிழில் எழுதவும்.",
    bn: "বাংলায় লিখুন।",
  };

  const target = targets[summaryLength];
  const existingWordCount = currentSummary.trim().split(/\s+/).filter(Boolean).length;

  // If the summary already fits target range closely, keep it.
  if (existingWordCount >= target.min && existingWordCount <= target.max) {
    return currentSummary;
  }

  try {
    const systemPrompt = `You are a legal summarizer.
${langInstruction[language]}

Task:
- Rewrite the summary to match target length: ${summaryLength}.
- Target word count must be between ${target.min} and ${target.max} words.
- Keep factual consistency with the source document.
- Keep plain-language clarity.

Return only the rewritten summary text (no JSON, no markdown).`;

    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Current summary:\n${currentSummary}\n\nSource document:\n${content}`,
        },
      ],
      temperature: 0.2,
    });

    const rewritten = response.choices[0]?.message?.content?.trim();
    if (!rewritten) return currentSummary;

    return rewritten;
  } catch (error) {
    console.warn("⚠️ Summary length enforcement failed, using original summary", error);
    return currentSummary;
  }
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

/**
 * Validates whether the document is a legal document
 * Returns { isLegal: boolean, reason?: string }
 */
export async function validateLegalDocument(
  content: string,
): Promise<{ isLegal: boolean; reason?: string; documentType?: string }> {
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";

  const systemPrompt = `You are a document classification expert. Analyze the provided document and determine if it is a legal document.

Legal documents include:
- Contracts (employment, service, rental, purchase, etc.)
- Agreements (NDAs, partnership, licensing, etc.)
- Leases and rental agreements
- Terms of Service & Privacy Policies
- Loan agreements and financing documents
- Will and trust documents
- Mortgage and real estate documents
- Service agreements
- License agreements
- Joint venture agreements
- Settlement agreements
- Confidentiality agreements
- Other legally binding contracts

Non-legal documents include:
- Articles, blog posts, news
- Marketing materials
- Emails, messages
- Social media content
- Books, novels, stories
- Resumes, CVs
- Purchase orders (unless formal contracts)
- General text documents

Respond with JSON in this format:
{
  "isLegal": true/false,
  "documentType": "type if legal, or null",
  "confidence": 0-1,
  "reason": "brief explanation"
}`;

  try {
    console.log('[VALIDATION] Starting legal document validation...');
    
    const chatCompletion = await groq.chat.completions.create({
      model: model,
      messages: [
        { 
          role: "system", 
          content: systemPrompt 
        },
        { 
          role: "user", 
          content: `Document to validate:\n\n${content.substring(0, 3000)}` // First 3000 chars for validation
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error("Empty response from validation API");
    }

    const response = JSON.parse(responseText) as {
      isLegal: boolean;
      documentType?: string;
      confidence?: number;
      reason?: string;
    };

    console.log(`[VALIDATION] Result: ${response.isLegal ? 'LEGAL' : 'NOT LEGAL'}`, {
      documentType: response.documentType,
      confidence: response.confidence,
      reason: response.reason,
    });

    return {
      isLegal: response.isLegal,
      reason: response.reason,
      documentType: response.documentType,
    };
  } catch (error) {
    console.error("[VALIDATION] Legal document validation error:", error);
    throw new Error(
      `Failed to validate legal document: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function analyzeDocument(
  content: string,
  documentType?: string,
  language: string = "en",
  summaryLength: string = "standard",
): Promise<FullAnalysis> {
  // Using Meta Llama 4 Scout model for document analysis
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";
  
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedSummaryLength = normalizeSummaryLength(summaryLength);

  const summaryLengthInstructions: Record<SummaryLength, string> = {
    brief:
      "Keep summary concise (about 3-5 bullet points or 80-140 words). Focus only on core obligations, biggest risks, and immediate action.",
    standard:
      "Provide a balanced summary (about 140-240 words) covering parties, obligations, key timelines, risks, and practical next steps.",
    detailed:
      "Provide an in-depth summary (about 260-420 words) with richer context, key clauses, risk rationale, negotiation points, and concrete recommendations.",
  };

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

Summary Length Preference: ${normalizedSummaryLength}
Length Guidance: ${summaryLengthInstructions[normalizedSummaryLength]}

IMPORTANT:
- Write all user-facing text fields (summary, risk item titles/descriptions, clause titles/simplified text, recommendations) in the requested language.
- Keep enum values like riskLevel and riskItems.level strictly as: high, medium, low.

Document type context: ${documentType || "auto-detect"}

Document Type Rules:
- If document type context is "auto-detect", infer the most accurate type from document content.
- Do NOT default to employment unless the text clearly indicates employment terms (employee, employer, salary, probation, etc.).
- Choose the most accurate label such as: Rental Agreement, Employment Contract, Service Agreement, NDA, Purchase Agreement, Loan Agreement, Partnership Agreement, Lease Agreement, or Other Legal Document.
- Set summary.documentType to the inferred label.

Respond with valid JSON matching this structure:
{
  "summary": {
    "summary": "string",
    "keyTerms": {
      "partyA": "string",
      "partyB": "string",
      "effectiveDate": "string",
      "term": "string",
      "payment": "string"
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
    console.log('🧾 Summary length:', normalizedSummaryLength, `(raw: ${summaryLength})`);
    
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

        analysis.summary.summary = await enforceSummaryLength(
          content,
          analysis.summary.summary,
          normalizedLanguage,
          normalizedSummaryLength,
          model,
        );

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
