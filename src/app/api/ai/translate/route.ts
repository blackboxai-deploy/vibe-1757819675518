import { NextRequest, NextResponse } from 'next/server';
import { huggingFaceClient } from '@/lib/huggingface';
import { detectLanguage } from '@/lib/aiUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage, sourceLanguage, userId } = body;

    // Validation
    if (!text || !targetLanguage) {
      return NextResponse.json({ 
        error: 'Text and targetLanguage are required' 
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ 
        error: 'UserId is required' 
      }, { status: 400 });
    }

    // Detect source language if not provided
    const detectedLanguage = sourceLanguage || detectLanguage(text);
    
    // Skip translation if already in target language
    if (detectedLanguage === targetLanguage) {
      return NextResponse.json({
        success: true,
        translation: {
          originalText: text,
          translatedText: text,
          sourceLanguage: detectedLanguage,
          targetLanguage,
          confidence: 1.0,
          model: 'no-translation-needed'
        }
      });
    }

    try {
      // Call Hugging Face translation API
      const translationResult = await huggingFaceClient.translateText({
        text,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        userId
      });

      return NextResponse.json({
        success: true,
        translation: translationResult
      });

    } catch (translationError) {
      console.error('Translation error:', translationError);
      
      // Return fallback (original text)
      return NextResponse.json({
        success: false,
        translation: {
          originalText: text,
          translatedText: text,
          sourceLanguage: detectedLanguage,
          targetLanguage,
          confidence: 0,
          model: 'fallback'
        },
        error: 'Translation service unavailable'
      });
    }

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ 
      error: 'Failed to translate text' 
    }, { status: 500 });
  }
}

// Batch translation for multiple texts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { texts, targetLanguage, sourceLanguage, userId } = body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ 
        error: 'Texts array is required and cannot be empty' 
      }, { status: 400 });
    }

    if (texts.length > 5) {
      return NextResponse.json({ 
        error: 'Maximum 5 texts can be translated at once' 
      }, { status: 400 });
    }

    if (!targetLanguage || !userId) {
      return NextResponse.json({ 
        error: 'TargetLanguage and userId are required' 
      }, { status: 400 });
    }

    const translationPromises = texts.map(async (text, index) => {
      try {
        const detectedLanguage = sourceLanguage || detectLanguage(text);
        
        if (detectedLanguage === targetLanguage) {
          return {
            index,
            originalText: text,
            translatedText: text,
            sourceLanguage: detectedLanguage,
            targetLanguage,
            confidence: 1.0,
            model: 'no-translation-needed'
          };
        }

        const result = await huggingFaceClient.translateText({
          text,
          sourceLanguage: detectedLanguage,
          targetLanguage,
          userId
        });

        return {
          index,
          ...result
        };
      } catch (error) {
        console.error(`Translation failed for text ${index}:`, error);
        return {
          index,
          originalText: text,
          translatedText: text,
          sourceLanguage: sourceLanguage || 'unknown',
          targetLanguage,
          confidence: 0,
          model: 'fallback',
          error: 'Translation failed'
        };
      }
    });

    const translations = await Promise.all(translationPromises);

    return NextResponse.json({
      success: true,
      translations,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Batch translation API error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform batch translation' 
    }, { status: 500 });
  }
}

// Get supported languages
export async function GET() {
  try {
    // In a real implementation, you'd query the translation service for supported languages
    const supportedLanguages = [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'es', name: 'Spanish', native: 'Español' },
      { code: 'fr', name: 'French', native: 'Français' },
      { code: 'de', name: 'German', native: 'Deutsch' },
      { code: 'it', name: 'Italian', native: 'Italiano' },
      { code: 'pt', name: 'Portuguese', native: 'Português' },
      { code: 'ru', name: 'Russian', native: 'Русский' },
      { code: 'zh', name: 'Chinese', native: '中文' },
      { code: 'ja', name: 'Japanese', native: '日本語' },
      { code: 'ko', name: 'Korean', native: '한국어' },
      { code: 'ar', name: 'Arabic', native: 'العربية' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
    ];

    return NextResponse.json({
      success: true,
      languages: supportedLanguages,
      total: supportedLanguages.length
    });

  } catch (error) {
    console.error('Languages API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch supported languages' 
    }, { status: 500 });
  }
}