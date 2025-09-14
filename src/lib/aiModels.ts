import { AIModel } from '@/types/ai';

export const AVAILABLE_AI_MODELS: AIModel[] = [
  {
    id: 'gpt2-large',
    name: 'GPT-2 Large',
    description: 'Creative text generation and conversation',
    provider: 'huggingface',
    modelId: 'gpt2-large',
    type: 'text-generation',
    capabilities: ['chat', 'text-generation'],
    maxTokens: 1024,
    temperature: 0.7,
    isAvailable: true,
    avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/402f95cd-aea1-4d1a-87af-0cae39374ab6.png'
  },
  {
    id: 'blenderbot',
    name: 'BlenderBot',
    description: 'Conversational AI with personality',
    provider: 'huggingface',
    modelId: 'facebook/blenderbot-400M-distill',
    type: 'conversational',
    capabilities: ['chat', 'question-answering'],
    maxTokens: 512,
    temperature: 0.8,
    isAvailable: true,
    avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/3a9c3224-c579-4f00-b927-5b583d86935f.png'
  },
  {
    id: 'dialogpt',
    name: 'DialoGPT',
    description: 'Microsoft conversational model',
    provider: 'huggingface',
    modelId: 'microsoft/DialoGPT-large',
    type: 'conversational',
    capabilities: ['chat', 'text-generation'],
    maxTokens: 1000,
    temperature: 0.7,
    isAvailable: true,
    avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/313f6aec-7538-4d72-9c9f-6f3aa660cf96.png'
  },
  {
    id: 'codet5',
    name: 'CodeT5',
    description: 'Code generation and explanation',
    provider: 'huggingface',
    modelId: 'Salesforce/codet5-large',
    type: 'code',
    capabilities: ['code-assistance', 'text-generation'],
    maxTokens: 512,
    temperature: 0.2,
    isAvailable: true,
    avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/cba63cef-3ba4-44fe-9f5d-97ad8acc7183.png'
  },
  {
    id: 'flan-t5',
    name: 'FLAN-T5',
    description: 'Instruction-following AI assistant',
    provider: 'huggingface',
    modelId: 'google/flan-t5-large',
    type: 'text-generation',
    capabilities: ['question-answering', 'summarization', 'chat'],
    maxTokens: 512,
    temperature: 0.3,
    isAvailable: true,
    avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/cf657abb-6666-4ce9-81f2-5059017c64ea.png'
  }
];

export const TRANSLATION_MODELS: AIModel[] = [
  {
    id: 'helsinki-opus',
    name: 'OPUS-MT',
    description: 'Multi-language translation',
    provider: 'huggingface',
    modelId: 'Helsinki-NLP/opus-mt-en-ROMANCE',
    type: 'translation',
    capabilities: ['translation'],
    maxTokens: 512,
    isAvailable: true,
    avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/4702a965-f704-4a06-aa11-1d99cac42eea.png'
  }
];

export const ANALYSIS_MODELS: AIModel[] = [
  {
    id: 'sentiment-roberta',
    name: 'RoBERTa Sentiment',
    description: 'Sentiment analysis and emotion detection',
    provider: 'huggingface',
    modelId: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    type: 'sentiment',
    capabilities: ['sentiment-analysis'],
    maxTokens: 512,
    isAvailable: true,
    avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/a4050af6-798b-4acb-8918-4775106d90dd.png'
  },
  {
    id: 'toxicity-detector',
    name: 'Toxicity Detector',
    description: 'Content moderation and safety',
    provider: 'huggingface',
    modelId: 'martin-ha/toxic-comment-model',
    type: 'moderation',
    capabilities: ['content-moderation'],
    maxTokens: 512,
    isAvailable: true,
    avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8d527229-5a29-4b27-a600-f08f93a9bddf.png'
  }
];

export const getAllModels = (): AIModel[] => [
  ...AVAILABLE_AI_MODELS,
  ...TRANSLATION_MODELS,
  ...ANALYSIS_MODELS
];

export const getModelById = (id: string): AIModel | undefined => {
  return getAllModels().find(model => model.id === id);
};

export const getModelsByCapability = (capability: string): AIModel[] => {
  return getAllModels().filter(model => 
    model.capabilities.some(cap => cap === capability)
  );
};

export const DEFAULT_AI_SETTINGS = {
  defaultModel: 'blenderbot',
  autoModeration: true,
  showSentiment: true,
  autoTranslate: false,
  suggestionsEnabled: true,
  maxResponseLength: 500,
  temperature: 0.7,
  enabledCapabilities: ['chat', 'sentiment-analysis', 'content-moderation']
};