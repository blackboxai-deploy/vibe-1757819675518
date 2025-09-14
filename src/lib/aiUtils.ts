import { AIRequest } from '@/types/ai';
import { Message, User } from '@/types/chat';

export function createChatPrompt(
  userMessage: string,
  context: Message[] = [],
  aiPersonality?: string
): string {
  const systemPrompt = aiPersonality || 
    "You are a helpful, friendly AI assistant in a chat application. " +
    "Provide concise, engaging responses. Be conversational and helpful.";
  
  let prompt = systemPrompt + "\n\n";
  
  // Add recent context (last 5 messages)
  const recentContext = context.slice(-5);
  if (recentContext.length > 0) {
    prompt += "Recent conversation:\n";
    recentContext.forEach(msg => {
      const role = msg.type === 'ai-response' ? 'Assistant' : 'User';
      prompt += `${role}: ${msg.content}\n`;
    });
    prompt += "\n";
  }
  
  prompt += `User: ${userMessage}\nAssistant:`;
  
  return prompt;
}

export function createCodeAssistantPrompt(
  userMessage: string,
  context: Message[] = []
): string {
  const systemPrompt = 
    "You are a programming assistant specializing in helping with code, " +
    "debugging, explaining concepts, and providing technical guidance. " +
    "Provide clear, accurate, and practical programming advice.";
    
  return createChatPrompt(userMessage, context, systemPrompt);
}

export function sanitizeAIResponse(response: string): string {
  // Remove potential harmful content and clean up response
  return response
    .trim()
    .replace(/^\s*Assistant:\s*/i, '') // Remove "Assistant:" prefix if present
    .replace(/^\s*AI:\s*/i, '') // Remove "AI:" prefix if present
    .slice(0, 1000) // Limit response length
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function generateContextualPrompt(
  message: string,
  user: User,
  roomType: string,
  previousMessages: Message[] = []
): AIRequest {
  let prompt: string;
  let model: string;
  
  switch (roomType) {
    case 'ai-assistant':
      model = user.aiPreferences.preferredModel || 'blenderbot';
      prompt = createChatPrompt(message, previousMessages);
      break;
      
    case 'code-help':
      model = 'codet5';
      prompt = createCodeAssistantPrompt(message, previousMessages);
      break;
      
    default:
      model = user.aiPreferences.preferredModel || 'gpt2-large';
      prompt = createChatPrompt(message, previousMessages);
  }
  
  return {
    model,
    prompt,
    maxTokens: 500,
    temperature: 0.7,
    userId: user.id,
    roomId: '',
    context: previousMessages.map(m => m.content).slice(-3)
  };
}

export function extractMessageSuggestions(
  context: Message[],
  currentInput: string
): string[] {
  if (currentInput.length < 2) return [];
  
  // Simple suggestion algorithm - in production, you'd use more sophisticated NLP
  const suggestions: string[] = [];
  const lowercaseInput = currentInput.toLowerCase();
  
  // Common conversation starters and responses
  const commonPhrases = [
    "That's really interesting!",
    "Can you tell me more about that?",
    "I understand what you mean.",
    "That makes perfect sense.",
    "I'd like to learn more about this.",
    "Thanks for explaining that!",
    "Could you provide an example?",
    "What do you think about this?",
    "That's a great point.",
    "I appreciate your help!"
  ];
  
  // Filter suggestions based on input
  commonPhrases.forEach(phrase => {
    if (phrase.toLowerCase().includes(lowercaseInput) || 
        phrase.toLowerCase().startsWith(lowercaseInput)) {
      suggestions.push(phrase);
    }
  });
  
  // Context-aware suggestions based on recent messages
  const recentMessages = context.slice(-3);
  recentMessages.forEach(msg => {
    if (msg.content.toLowerCase().includes('question') && 
        !lowercaseInput.includes('answer')) {
      suggestions.push("Let me answer that for you.");
    }
    if (msg.content.toLowerCase().includes('help') && 
        !lowercaseInput.includes('thank')) {
      suggestions.push("Thank you for your help!");
    }
  });
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
}

export function detectLanguage(text: string): string {
  // Simple language detection - in production, use a proper library
  const commonWords = {
    en: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
    es: ['el', 'la', 'y', 'o', 'pero', 'en', 'con', 'para', 'de', 'por', 'que'],
    fr: ['le', 'la', 'et', 'ou', 'mais', 'dans', 'sur', 'pour', 'de', 'avec', 'que'],
    de: ['der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'auf', 'für', 'von', 'mit'],
  };
  
  const words = text.toLowerCase().split(/\s+/);
  const languageScores: Record<string, number> = {};
  
  Object.entries(commonWords).forEach(([lang, langWords]) => {
    languageScores[lang] = 0;
    langWords.forEach(word => {
      if (words.includes(word)) {
        languageScores[lang]++;
      }
    });
  });
  
  const detectedLang = Object.entries(languageScores)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
    
  return detectedLang || 'en';
}

export function shouldTranslate(
  message: string,
  userLanguage: string = 'en',
  autoTranslate: boolean = false
): boolean {
  if (!autoTranslate) return false;
  
  const detectedLang = detectLanguage(message);
  return detectedLang !== userLanguage;
}

export function formatAIError(error: Error): string {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return "AI service is busy. Please try again in a moment.";
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return "Network connection issue. Please check your internet connection.";
  }
  
  if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
    return "AI service authentication issue. Please contact support.";
  }
  
  if (errorMessage.includes('model') || errorMessage.includes('not found')) {
    return "The selected AI model is not available. Please try a different model.";
  }
  
  return "AI service is temporarily unavailable. Please try again later.";
}

export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return text;
  
  const maxChars = maxTokens * 4;
  return text.substring(0, maxChars - 3) + '...';
}