import { User, Room, Message, ChatState, TypingUser } from '@/types/chat';
import { AIResponse } from '@/types/ai';

// In-memory data store for development
class ChatStore {
  private state: ChatState = {
    currentUser: null,
    currentRoom: null,
    rooms: [],
    messages: {},
    users: {},
    typingUsers: [],
    onlineUsers: []
  };

  private listeners: Set<() => void> = new Set();

  // Initialize with sample data
  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample rooms
    const rooms: Room[] = [
      {
        id: 'general',
        name: 'General Chat',
        description: 'General discussion for everyone',
        type: 'general',
        thumbnail: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/742b169a-0c73-4b22-8384-6d59f374724c.png',
        members: ['user1', 'user2', 'user3'],
        createdAt: new Date('2024-01-01'),
        lastActivity: new Date()
      },
      {
        id: 'ai-assistant',
        name: 'AI Assistant',
        description: 'Chat with AI-powered assistants',
        type: 'ai-assistant',
        thumbnail: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/825746fc-3836-45f2-9250-e2f024396ff0.png',
        members: ['user1', 'ai-bot'],
        aiModel: 'blenderbot',
        createdAt: new Date('2024-01-01'),
        lastActivity: new Date()
      },
      {
        id: 'code-help',
        name: 'Code Help',
        description: 'Programming assistance and code review',
        type: 'ai-assistant',
        thumbnail: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8834e5ba-d4ee-47e6-a7c1-eb72c21dd469.png',
        members: ['user1', 'code-ai'],
        aiModel: 'codet5',
        createdAt: new Date('2024-01-01'),
        lastActivity: new Date()
      }
    ];

    // Sample users
    const users: Record<string, User> = {
      'user1': {
        id: 'user1',
        username: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/3c0a4957-3cf2-48b2-87cf-c761346ea077.png',
        status: 'online',
        lastSeen: new Date(),
        aiPreferences: {
          preferredModel: 'blenderbot',
          autoTranslate: false,
          showSentiment: true,
          enableSuggestions: true
        }
      },
      'user2': {
        id: 'user2',
        username: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/4de5d9f4-3d41-4158-aabb-ba328e33c400.png',
        status: 'online',
        lastSeen: new Date(Date.now() - 300000),
        aiPreferences: {
          preferredModel: 'gpt2-large',
          autoTranslate: true,
          showSentiment: true,
          enableSuggestions: false
        }
      },
      'user3': {
        id: 'user3',
        username: 'Mike Johnson',
        email: 'mike@example.com',
        avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/8e1be8b4-cfaa-4c1b-af98-4db9fdda5047.png',
        status: 'away',
        lastSeen: new Date(Date.now() - 600000),
        aiPreferences: {
          preferredModel: 'codet5',
          autoTranslate: false,
          showSentiment: false,
          enableSuggestions: true
        }
      },
      'ai-bot': {
        id: 'ai-bot',
        username: 'AI Assistant',
        email: 'ai@chatapp.com',
        avatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/0fc6283d-6080-49b1-b037-77fbe0c6d514.png',
        status: 'online',
        lastSeen: new Date(),
        aiPreferences: {
          preferredModel: 'blenderbot',
          autoTranslate: false,
          showSentiment: false,
          enableSuggestions: false
        }
      }
    };

    // Sample messages
    const messages: Record<string, Message[]> = {
      'general': [
        {
          id: 'msg1',
          content: 'Welcome to the chat! How is everyone doing today?',
          userId: 'user1',
          username: 'John Doe',
          userAvatar: users['user1'].avatar,
          roomId: 'general',
          timestamp: new Date(Date.now() - 3600000),
          type: 'text'
        },
        {
          id: 'msg2',
          content: 'Great! Just working on some exciting projects. The AI integration here looks amazing!',
          userId: 'user2',
          username: 'Jane Smith',
          userAvatar: users['user2'].avatar,
          roomId: 'general',
          timestamp: new Date(Date.now() - 3300000),
          type: 'text',
          aiAnalysis: {
            sentiment: 'positive',
            confidence: 0.92,
            toxicity: 0.02,
            topics: ['work', 'projects', 'AI'],
            language: 'en',
            modelUsed: 'sentiment-roberta',
            processedAt: new Date(Date.now() - 3300000)
          }
        }
      ],
      'ai-assistant': [
        {
          id: 'msg3',
          content: 'Hello! I\'m your AI assistant. I can help with various tasks, answer questions, and have conversations. What would you like to talk about?',
          userId: 'ai-bot',
          username: 'AI Assistant',
          userAvatar: users['ai-bot'].avatar,
          roomId: 'ai-assistant',
          timestamp: new Date(Date.now() - 1800000),
          type: 'ai-response'
        }
      ],
      'code-help': [
        {
          id: 'msg4',
          content: 'I can help you with programming questions, code review, debugging, and explaining complex concepts. Just share your code or ask your question!',
          userId: 'code-ai',
          username: 'Code Assistant',
          userAvatar: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/e5af81b7-7582-4d69-9ca9-5846d76cced8.png',
          roomId: 'code-help',
          timestamp: new Date(Date.now() - 1200000),
          type: 'ai-response'
        }
      ]
    };

    this.state.rooms = rooms;
    this.state.users = users;
    this.state.messages = messages;
    this.state.onlineUsers = ['user1', 'user2', 'ai-bot'];
  }

  // State management methods
  getState(): ChatState {
    return { ...this.state };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // User methods
  setCurrentUser(user: User | null) {
    this.state.currentUser = user;
    if (user) {
      this.state.users[user.id] = user;
      if (!this.state.onlineUsers.includes(user.id)) {
        this.state.onlineUsers.push(user.id);
      }
    }
    this.notify();
  }

  getCurrentUser(): User | null {
    return this.state.currentUser;
  }

  updateUser(userId: string, updates: Partial<User>) {
    if (this.state.users[userId]) {
      this.state.users[userId] = { ...this.state.users[userId], ...updates };
      if (this.state.currentUser?.id === userId) {
        this.state.currentUser = this.state.users[userId];
      }
      this.notify();
    }
  }

  // Room methods
  getRooms(): Room[] {
    return [...this.state.rooms];
  }

  setCurrentRoom(roomId: string) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (room) {
      this.state.currentRoom = room;
      this.notify();
    }
  }

  getCurrentRoom(): Room | null {
    return this.state.currentRoom;
  }

  addRoom(room: Room) {
    this.state.rooms.push(room);
    this.state.messages[room.id] = [];
    this.notify();
  }

  // Message methods
  getMessages(roomId: string): Message[] {
    return this.state.messages[roomId] || [];
  }

  addMessage(message: Message) {
    if (!this.state.messages[message.roomId]) {
      this.state.messages[message.roomId] = [];
    }
    this.state.messages[message.roomId].push(message);
    
    // Update room's last activity
    const room = this.state.rooms.find(r => r.id === message.roomId);
    if (room) {
      room.lastActivity = message.timestamp;
    }
    
    this.notify();
  }

  updateMessage(messageId: string, roomId: string, updates: Partial<Message>) {
    const messages = this.state.messages[roomId];
    if (messages) {
      const index = messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages[index] = { ...messages[index], ...updates };
        this.notify();
      }
    }
  }

  addAIResponse(roomId: string, aiResponse: AIResponse) {
    const message: Message = {
      id: aiResponse.id,
      content: aiResponse.content,
      userId: 'ai-bot',
      username: 'AI Assistant',
      userAvatar: this.state.users['ai-bot']?.avatar,
      roomId,
      timestamp: aiResponse.timestamp,
      type: 'ai-response',
      aiAnalysis: {
        sentiment: 'neutral',
        confidence: aiResponse.confidence,
        toxicity: 0.01,
        topics: ['AI', 'assistance'],
        language: 'en',
        modelUsed: aiResponse.model,
        processedAt: aiResponse.timestamp
      }
    };
    this.addMessage(message);
  }

  // Typing indicator methods
  addTypingUser(typingUser: TypingUser) {
    // Remove existing typing indicator for this user in this room
    this.state.typingUsers = this.state.typingUsers.filter(
      t => !(t.userId === typingUser.userId && t.roomId === typingUser.roomId)
    );
    
    // Add new typing indicator
    this.state.typingUsers.push(typingUser);
    this.notify();

    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.removeTypingUser(typingUser.userId, typingUser.roomId);
    }, 3000);
  }

  removeTypingUser(userId: string, roomId: string) {
    this.state.typingUsers = this.state.typingUsers.filter(
      t => !(t.userId === userId && t.roomId === roomId)
    );
    this.notify();
  }

  getTypingUsers(roomId: string): TypingUser[] {
    return this.state.typingUsers.filter(t => t.roomId === roomId);
  }

  // Analytics and search
  searchMessages(query: string, roomId?: string): Message[] {
    const allMessages = roomId 
      ? this.getMessages(roomId)
      : Object.values(this.state.messages).reduce((acc, messages) => acc.concat(messages), [] as Message[]);
    
    return allMessages.filter(message =>
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      message.username.toLowerCase().includes(query.toLowerCase())
    );
  }

  getMessageStats(roomId: string) {
    const messages = this.getMessages(roomId);
    const totalMessages = messages.length;
    const aiMessages = messages.filter(m => m.type === 'ai-response').length;
    const userMessages = totalMessages - aiMessages;
    
    const sentiments = messages
      .filter(m => m.aiAnalysis?.sentiment)
      .reduce((acc, m) => {
        acc[m.aiAnalysis!.sentiment]++;
        return acc;
      }, { positive: 0, negative: 0, neutral: 0 });

    return {
      totalMessages,
      userMessages,
      aiMessages,
      sentiments,
      lastActivity: Math.max(...messages.map(m => m.timestamp.getTime()))
    };
  }
}

// Export singleton instance
export const chatStore = new ChatStore();