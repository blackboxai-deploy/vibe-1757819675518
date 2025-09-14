import { Message, User, Room } from '@/types/chat';

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  // Show actual date
  return date.toLocaleDateString();
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

export function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  return messages.reduce((groups, message) => {
    let dateKey: string;
    
    if (isToday(message.timestamp)) {
      dateKey = 'Today';
    } else if (isYesterday(message.timestamp)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = message.timestamp.toLocaleDateString();
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    
    return groups;
  }, {} as Record<string, Message[]>);
}

export function shouldShowAvatar(
  currentMessage: Message,
  previousMessage: Message | null,
  nextMessage: Message | null
): boolean {
  // Always show avatar for AI responses
  if (currentMessage.type === 'ai-response') {
    return true;
  }
  
  // Always show if it's the first message
  if (!previousMessage) {
    return true;
  }
  
  // Show if different user than previous message
  if (previousMessage.userId !== currentMessage.userId) {
    return true;
  }
  
  // Show if more than 5 minutes gap
  const timeDiff = currentMessage.timestamp.getTime() - previousMessage.timestamp.getTime();
  if (timeDiff > 300000) { // 5 minutes
    return true;
  }
  
  // Show if it's the last message from this user
  if (!nextMessage || nextMessage.userId !== currentMessage.userId) {
    return true;
  }
  
  return false;
}

export function shouldShowTimestamp(
  currentMessage: Message,
  previousMessage: Message | null
): boolean {
  if (!previousMessage) return true;
  
  // Show if different day
  if (!isToday(currentMessage.timestamp) && isToday(previousMessage.timestamp)) {
    return true;
  }
  
  // Show if more than 1 hour gap
  const timeDiff = currentMessage.timestamp.getTime() - previousMessage.timestamp.getTime();
  return timeDiff > 3600000; // 1 hour
}

export function getMessageGroupStyle(
  currentMessage: Message,
  previousMessage: Message | null,
  nextMessage: Message | null,
  isOwnMessage: boolean
): string {
  const baseClasses = isOwnMessage
    ? 'ml-auto bg-blue-500 text-white'
    : 'mr-auto bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100';
  
  const isFirstInGroup = !previousMessage || previousMessage.userId !== currentMessage.userId;
  const isLastInGroup = !nextMessage || nextMessage.userId !== currentMessage.userId;
  const isOnlyInGroup = isFirstInGroup && isLastInGroup;
  
  let roundingClasses = '';
  
  if (isOnlyInGroup) {
    roundingClasses = 'rounded-2xl';
  } else if (isFirstInGroup) {
    roundingClasses = isOwnMessage 
      ? 'rounded-2xl rounded-br-md' 
      : 'rounded-2xl rounded-bl-md';
  } else if (isLastInGroup) {
    roundingClasses = isOwnMessage 
      ? 'rounded-2xl rounded-tr-md' 
      : 'rounded-2xl rounded-tl-md';
  } else {
    roundingClasses = isOwnMessage 
      ? 'rounded-2xl rounded-r-md' 
      : 'rounded-2xl rounded-l-md';
  }
  
  return `${baseClasses} ${roundingClasses}`;
}

export function validateMessage(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 4000) {
    return { isValid: false, error: 'Message is too long (max 4000 characters)' };
  }
  
  // Check for spam-like patterns
  const repeatedPattern = /(.)\1{20,}/;
  if (repeatedPattern.test(content)) {
    return { isValid: false, error: 'Message contains too much repetition' };
  }
  
  return { isValid: true };
}

export function sanitizeMessage(content: string): string {
  // Basic sanitization
  return content
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 4000); // Enforce length limit
}

export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}

export function highlightMentions(content: string, currentUserId: string): string {
  return content.replace(/@(\w+)/g, (match, username) => {
    const isSelf = username.toLowerCase() === currentUserId.toLowerCase();
    const className = isSelf ? 'mention-self' : 'mention';
    return `<span class="${className}">${match}</span>`;
  });
}

export function getUnreadCount(messages: Message[], lastReadTimestamp: Date): number {
  return messages.filter(message => message.timestamp > lastReadTimestamp).length;
}

export function createSystemMessage(content: string, roomId: string): Message {
  return {
    id: generateId(),
    content,
    userId: 'system',
    username: 'System',
    roomId,
    timestamp: new Date(),
    type: 'system'
  };
}

export function getUserStatus(user: User): { color: string; text: string } {
  const now = Date.now();
  const lastSeen = user.lastSeen.getTime();
  const timeDiff = now - lastSeen;
  
  switch (user.status) {
    case 'online':
      if (timeDiff < 300000) { // 5 minutes
        return { color: 'bg-green-500', text: 'Online' };
      } else {
        return { color: 'bg-yellow-500', text: 'Away' };
      }
    case 'away':
      return { color: 'bg-yellow-500', text: 'Away' };
    case 'offline':
      if (timeDiff < 3600000) { // 1 hour
        return { color: 'bg-gray-400', text: 'Recently active' };
      } else {
        return { color: 'bg-gray-400', text: 'Offline' };
      }
    default:
      return { color: 'bg-gray-400', text: 'Unknown' };
  }
}

export function sortRoomsByActivity(rooms: Room[]): Room[] {
  return rooms.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
}

export function filterRoomsByType(rooms: Room[], type: Room['type'] | null): Room[] {
  if (!type) return rooms;
  return rooms.filter(room => room.type === type);
}

export function searchInMessages(messages: Message[], query: string): Message[] {
  const lowercaseQuery = query.toLowerCase();
  return messages.filter(message =>
    message.content.toLowerCase().includes(lowercaseQuery) ||
    message.username.toLowerCase().includes(lowercaseQuery)
  );
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}