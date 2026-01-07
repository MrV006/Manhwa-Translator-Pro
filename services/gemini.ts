import { GoogleGenAI, Type } from "@google/genai";
import { GlossaryItem, Genre, TranslationResult, TranslationBlock, NewTerm } from "../types";

const cleanJson = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const translateImage = async (
  base64Image: string, 
  genre: Genre, 
  glossary: GlossaryItem[],
  projectContext: string,
  userApiKey: string,
  previousContext: string = "" 
): Promise<TranslationResult> => {
    // Priority: User API Key > Environment Variable
    const apiKey = userApiKey || process.env.API_KEY || '';
    
    if (!apiKey) {
        throw new Error("API Key یافت نشد. لطفا کلید را در تنظیمات وارد کنید.");
    }

    const ai = new GoogleGenAI({ apiKey });
    // Switch to Gemini 3 Flash Preview which supports Multimodal Input + JSON Output
    const modelId = 'gemini-3-flash-preview'; 

    const relevantGlossary = glossary.filter(g => g.project === projectContext || g.project === 'Global');
    
    const glossaryText = relevantGlossary.length > 0 
      ? `\n### واژه‌نامه الزامی (Strict Glossary):\nاصطلاحات زیر را دقیقاً به همین صورت استفاده کن و تغییر نده:\n${relevantGlossary.map(g => `- ${g.term} -> ${g.translation}`).join('\n')}`
      : '';

    const contextInstruction = previousContext 
      ? `\n### کانتکست صفحه قبل:\nآخرین جمله صفحه قبل این بود: "${previousContext}"\nاگر متن بالای این تصویر ادامه جمله قبلی است، آن را کامل کن و به صورت یک جمله پیوسته و صحیح ترجمه کن. از تکرار ناقص پرهیز کن.`
      : '';

    const genreInstruction = {
      'wuxia': 'لحن حماسی، باستانی (فارسی سره) و رزمی.',
      'system': 'لحن خشک سیستمی برای باکس‌ها، و محاوره‌ای امروزی برای دیالوگ‌ها.',
      'romance': 'لحن احساسی و لطیف.',
      'school': 'لحن نوجوانانه و عامیانه.',
      'fantasy': 'لحن داستانی و ماجراجویانه.',
      'general': 'لحن روان فارسی.'
    }[genre];

    const prompt = `
      تو دستیار هوشمند تیم ترجمه مانهوا هستی.
      
      وظایف:
      1. تمام متن‌های تصویر را استخراج و به فارسی ترجمه کن.
      2. ${genreInstruction}
      3. ${glossaryText}
      4. ${contextInstruction}
      5. **کلمات جدید:** اگر اسم شخص (Names)، اسم مکان (Places) یا اسم فن/مهارت (Skills) جدیدی دیدی که در واژه‌نامه بالا نبود، آن را استخراج کن.
      
      فرمت خروجی باید JSON باشد شامل دو بخش:
      - blocks: متن‌های ترجمه شده به ترتیب خواندن.
      - newTerms: کلمات جدید شناسایی شده (شامل original, translation, category). دسته‌ها باید یکی از این‌ها باشند: #Names, #Places, #Skills.
    `;

    // Retry Logic variables
    let retries = 0;
    const maxRetries = 3;

    while (true) {
      try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                blocks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, enum: ['dialogue', 'thought', 'narration', 'sfx'] },
                      text: { type: Type.STRING }
                    },
                    required: ['type', 'text']
                  }
                },
                newTerms: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      translation: { type: Type.STRING },
                      category: { type: Type.STRING, enum: ['#Names', '#Places', '#Skills', '#Other'] }
                    },
                    required: ['original', 'translation', 'category']
                  }
                }
              },
              required: ['blocks', 'newTerms']
            }
          }
        });

        const jsonText = response.text ? cleanJson(response.text) : '{}';
        
        // Internal type to match the specific JSON output of this prompt
        interface GeminiResponse {
            blocks: TranslationBlock[];
            newTerms: NewTerm[];
        }
        
        let parsed: GeminiResponse;
        try {
             parsed = JSON.parse(jsonText) as GeminiResponse;
        } catch (parseError) {
             console.error("JSON Parse Error:", jsonText);
             throw new Error("فرمت خروجی هوش مصنوعی نامعتبر بود.");
        }

        return {
            blocks: parsed.blocks || [],
            detectedTerms: parsed.newTerms || []
        };

      } catch (error: any) {
        // Handle Rate Limit (429)
        if (error.message?.includes('429') || error.status === 429 || error.code === 429 || error.status === 'RESOURCE_EXHAUSTED') {
            retries++;
            if (retries > maxRetries) {
                throw new Error("تعداد درخواست‌ها بیش از حد مجاز است. لطفا چند دقیقه دیگر تلاش کنید.");
            }
            const delay = Math.pow(2, retries) * 2000 + Math.random() * 1000; // Exponential backoff + jitter
            console.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms...`);
            await wait(delay);
            continue;
        }

        // Handle JSON Mode Error (400)
        if (error.message?.includes('JSON mode is not enabled') || error.status === 400 || error.code === 400) {
             console.error("Model does not support JSON mode.");
             throw new Error("مدل هوش مصنوعی از حالت JSON پشتیبانی نمی‌کند. لطفا مدل را بررسی کنید.");
        }

        console.error("Gemini Translation Error:", error);
        throw new Error(error.message || "خطا در ارتباط با هوش مصنوعی");
      }
    }
};