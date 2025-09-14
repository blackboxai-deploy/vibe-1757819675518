export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  aiPreferences: {
    preferredModel: string;
    autoTranslate: boolean;
    showSentiment: boolean;
    enableSuggestions: boolean;
  };
}

export interface Room {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'ai-assistant' | 'private' | 'group';
  thumbnail?: string;
  members: string[]; // user IDs
  aiModel?: string; // for AI assistant rooms
  createdAt: Date;
  lastActivity: Date;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  userAvatar?: string;
  roomId: string;
  timestamp: Date;
  type: 'text' | 'ai-response' | 'system';
  aiAnalysis?: MessageAnalysis;
  translations?: Record<string, string>;
  replyTo?: string; // message ID
  edited?: boolean;
  editedAt?: Date;
}

export interface MessageAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  toxicity: number;
  topics: string[];
  language: string;
  modelUsed: string;
  processedAt: Date;
}

export interface TypingUser {
  userId: string;
  username: string;
  roomId: string;
  timestamp: Date;
  isAI?: boolean;
  processingType?: 'generating' | 'analyzing' | 'translating';
}

export interface ChatState {
  currentUser: User | null;
  currentRoom: Room | null;
  rooms: Room[];
  messages: Record<string, Message[]>; // roomId -> messages
  users: Record<string, User>; // userId -> user
  typingUsers: TypingUser[];
  onlineUsers: string[];
}