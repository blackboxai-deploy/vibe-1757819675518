export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: 'huggingface';
  modelId: string; // Hugging Face model ID
  type: 'text-generation' | 'conversational' | 'translation' | 'sentiment' | 'moderation' | 'code';
  capabilities: AICapability[];
  maxTokens: number;
  temperature?: number;
  isAvailable: boolean;
  avatar?: string;
}

export type AICapability = 
  | 'chat'
  | 'text-generation'
  | 'translation'
  | 'sentiment-analysis'
  | 'content-moderation'
  | 'code-assistance'
  | 'question-answering'
  | 'summarization';

export interface AIRequest {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  userId: string;
  roomId: string;
  context?: string[];
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  confidence: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTime: number;
  timestamp: Date;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  userId: string;
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  model: string;
}

export interface SentimentAnalysis {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  model: string;
}

export interface ContentModerationResult {
  isToxic: boolean;
  toxicityScore: number;
  categories: {
    toxic: number;
    severe_toxic: number;
    obscene: number;
    threat: number;
    insult: number;
    identity_hate: number;
  };
  model: string;
}

export interface AISettings {
  defaultModel: string;
  autoModeration: boolean;
  showSentiment: boolean;
  autoTranslate: boolean;
  suggestionsEnabled: boolean;
  maxResponseLength: number;
  temperature: number;
  enabledCapabilities: AICapability[];
}