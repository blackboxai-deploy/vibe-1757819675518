import { AIRequest, AIResponse, TranslationRequest, TranslationResponse, SentimentAnalysis, ContentModerationResult } from '@/types/ai';
import { getModelById } from './aiModels';

const HF_API_URL = 'https://api-inference.huggingface.co/models';

export class HuggingFaceClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env.HUGGINGFACE_API_KEY : '') || '';
  }

  private async makeRequest(modelId: string, payload: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${HF_API_URL}/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const model = getModelById(request.model);
    
    if (!model) {
      throw new Error(`Model ${request.model} not found`);
    }

    try {
      const payload = {
        inputs: request.prompt,
        parameters: {
          max_new_tokens: request.maxTokens || model.maxTokens,
          temperature: request.temperature || model.temperature || 0.7,
          return_full_text: false,
        },
      };

      const result = await this.makeRequest(model.modelId, payload);
      const processingTime = Date.now() - startTime;

      // Handle different response formats
      let generatedText = '';
      if (Array.isArray(result)) {
        generatedText = (result[0] as any)?.generated_text || (result[0] as any)?.text || '';
      } else {
        generatedText = (result as any).generated_text || (result as any).text || '';
      }

      return {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: generatedText.trim(),
        model: request.model,
        confidence: 0.8, // Placeholder - HF doesn't always provide confidence
        usage: {
          promptTokens: Math.ceil(request.prompt.length / 4),
          completionTokens: Math.ceil(generatedText.length / 4),
          totalTokens: Math.ceil((request.prompt.length + generatedText.length) / 4),
        },
        processingTime,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Text generation error:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      // Use a general translation model - in production you'd select based on language pair
      const modelId = 'Helsinki-NLP/opus-mt-en-ROMANCE';
      
      const payload = {
        inputs: request.text,
      };

      const result = await this.makeRequest(modelId, payload);
      
      let translatedText = '';
      if (Array.isArray(result)) {
        translatedText = (result[0] as any)?.translation_text || (result[0] as any)?.text || request.text;
      } else {
        translatedText = (result as any).translation_text || (result as any).text || request.text;
      }

      return {
        originalText: request.text,
        translatedText,
        sourceLanguage: request.sourceLanguage || 'auto',
        targetLanguage: request.targetLanguage,
        confidence: 0.85,
        model: modelId,
      };
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to original text
      return {
        originalText: request.text,
        translatedText: request.text,
        sourceLanguage: request.sourceLanguage || 'unknown',
        targetLanguage: request.targetLanguage,
        confidence: 0,
        model: 'fallback',
      };
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const modelId = 'cardiffnlp/twitter-roberta-base-sentiment-latest';
      
      const payload = {
        inputs: text,
      };

      const result = await this.makeRequest(modelId, payload);
      
      // Handle sentiment analysis response
      if (Array.isArray(result) && result.length > 0) {
        const topResult = result[0] as any;
        if (Array.isArray(topResult)) {
          // Find the highest scoring sentiment
          const maxSentiment = topResult.reduce((prev: any, current: any) => 
            (prev.score > current.score) ? prev : current
          );
          
          return {
            label: this.mapSentimentLabel(maxSentiment.label),
            score: maxSentiment.score,
            model: modelId,
          };
        }
      }

      // Fallback neutral sentiment
      return {
        label: 'NEUTRAL',
        score: 0.5,
        model: modelId,
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        label: 'NEUTRAL',
        score: 0.5,
        model: 'fallback',
      };
    }
  }

  async moderateContent(text: string): Promise<ContentModerationResult> {
    try {
      const modelId = 'martin-ha/toxic-comment-model';
      
      const payload = {
        inputs: text,
      };

      const result = await this.makeRequest(modelId, payload);
      
      // Process moderation results
      let toxicityScore = 0;
      let isToxic = false;

      if (Array.isArray(result) && result.length > 0) {
        const scores = result[0];
        if (Array.isArray(scores)) {
          const typedScores = scores as { label: string; score: number }[];
          const toxicResult = typedScores.find(item => item.label === 'TOXIC');
          if (toxicResult) {
            toxicityScore = toxicResult.score;
            isToxic = toxicityScore > 0.7; // Threshold for toxicity
          }
        }
      }

      return {
        isToxic,
        toxicityScore,
        categories: {
          toxic: toxicityScore,
          severe_toxic: toxicityScore * 0.8,
          obscene: toxicityScore * 0.6,
          threat: toxicityScore * 0.4,
          insult: toxicityScore * 0.7,
          identity_hate: toxicityScore * 0.5,
        },
        model: modelId,
      };
    } catch (error) {
      console.error('Content moderation error:', error);
      return {
        isToxic: false,
        toxicityScore: 0,
        categories: {
          toxic: 0,
          severe_toxic: 0,
          obscene: 0,
          threat: 0,
          insult: 0,
          identity_hate: 0,
        },
        model: 'fallback',
      };
    }
  }

  private mapSentimentLabel(label: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
    const normalizedLabel = label.toLowerCase();
    if (normalizedLabel.includes('pos')) return 'POSITIVE';
    if (normalizedLabel.includes('neg')) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      const testModel = 'gpt2';
      const result = await this.makeRequest(testModel, {
        inputs: 'Hello',
        parameters: { max_new_tokens: 1 }
      });
      return !!result;
    } catch (error) {
      console.error('HF API connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const huggingFaceClient = new HuggingFaceClient();