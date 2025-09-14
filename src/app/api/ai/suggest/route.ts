import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { extractMessageSuggestions } from '@/lib/aiUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, userId, roomId, context } = body;

    // Validation
    if (!userId || !roomId) {
      return NextResponse.json({ 
        error: 'UserId and roomId are required' 
      }, { status: 400 });
    }

    // Get user and verify room access
    const user = chatStore.getState().users[userId];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const room = chatStore.getRooms().find(r => r.id === roomId);
    if (!room || !room.members.includes(userId)) {
      return NextResponse.json({ error: 'Room access denied' }, { status: 403 });
    }

    // Check if suggestions are enabled for user
    if (!user.aiPreferences.enableSuggestions) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Suggestions disabled for user'
      });
    }

    const inputText = input || '';
    
    // Get conversation context
    const recentMessages = context || chatStore.getMessages(roomId).slice(-10);
    
    // Generate suggestions based on input and context
    let suggestions: string[] = [];

    if (inputText.length >= 2) {
      // Get contextual suggestions
      suggestions = extractMessageSuggestions(recentMessages, inputText);
    } else {
      // Provide general conversation starters based on room type and recent activity
      suggestions = generateConversationStarters(room, recentMessages);
    }

    // Add auto-complete suggestions for common phrases
    if (inputText.length >= 2) {
      const autoCompletes = getAutoCompleteSuggestions(inputText);
      suggestions = [...suggestions, ...autoCompletes];
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

    return NextResponse.json({
      success: true,
      suggestions: uniqueSuggestions,
      input: inputText,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate suggestions' 
    }, { status: 500 });
  }
}

// Smart reply suggestions based on the last message
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');

    if (!roomId || !userId) {
      return NextResponse.json({ 
        error: 'RoomId and userId are required' 
      }, { status: 400 });
    }

    // Verify access
    const user = chatStore.getState().users[userId];
    const room = chatStore.getRooms().find(r => r.id === roomId);
    
    if (!user || !room || !room.members.includes(userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!user.aiPreferences.enableSuggestions) {
      return NextResponse.json({
        success: true,
        smartReplies: [],
        message: 'Smart replies disabled'
      });
    }

    // Get the last few messages
    const messages = chatStore.getMessages(roomId);
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage || lastMessage.userId === userId) {
      return NextResponse.json({
        success: true,
        smartReplies: []
      });
    }

    // Generate smart replies based on the last message
    const smartReplies = generateSmartReplies(lastMessage);

    return NextResponse.json({
      success: true,
      smartReplies,
      basedOn: {
        messageId: lastMessage.id,
        content: lastMessage.content.substring(0, 50) + '...',
        from: lastMessage.username
      }
    });

  } catch (error) {
    console.error('Smart replies API error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate smart replies' 
    }, { status: 500 });
  }
}

function generateConversationStarters(room: { type: string }, recentMessages: unknown[]): string[] {
  const starters: string[] = [];
  
  if (room.type === 'ai-assistant') {
    starters.push(
      "Can you help me with something?",
      "I have a question about...",
      "What do you think about...",
      "Can you explain how...",
      "I'd like to learn more about..."
    );
  } else if (room.type === 'code-help') {
    starters.push(
      "I'm having trouble with this code:",
      "Can you review this function?",
      "What's the best way to implement...",
      "I'm getting an error with...",
      "How do I optimize this algorithm?"
    );
  } else {
    // General room
    if (recentMessages.length === 0) {
      starters.push(
        "Hello everyone!",
        "How's everyone doing?",
        "Good morning!",
        "What's new today?",
        "Hope everyone is having a great day!"
      );
    } else {
      starters.push(
        "That's interesting!",
        "I agree with that.",
        "What do you all think?",
        "Has anyone tried...",
        "Speaking of which..."
      );
    }
  }
  
  return starters;
}

function getAutoCompleteSuggestions(input: string): string[] {
  const lowercaseInput = input.toLowerCase();
  const completions: Record<string, string[]> = {
    'how': [
      'How are you doing?',
      'How does this work?',
      'How can I help?',
      'How do you think we should proceed?'
    ],
    'what': [
      'What do you think about this?',
      'What are your thoughts?',
      'What should we do next?',
      'What time works best?'
    ],
    'i think': [
      'I think that makes sense.',
      'I think we should consider this.',
      'I think you\'re right about that.'
    ],
    'thank': [
      'Thank you so much!',
      'Thanks for your help!',
      'Thank you for explaining that.',
      'Thanks for the information!'
    ],
    'can you': [
      'Can you help me with this?',
      'Can you explain that again?',
      'Can you check if this is correct?',
      'Can you provide more details?'
    ]
  };

  const suggestions: string[] = [];
  
  Object.entries(completions).forEach(([prefix, phrases]) => {
    if (lowercaseInput.startsWith(prefix)) {
      phrases.forEach(phrase => {
        if (phrase.toLowerCase().startsWith(lowercaseInput)) {
          suggestions.push(phrase);
        }
      });
    }
  });

  return suggestions.slice(0, 3);
}

function generateSmartReplies(lastMessage: { content: string }): string[] {
  const content = lastMessage.content.toLowerCase();
  const replies: string[] = [];

  // Question-based replies
  if (content.includes('?')) {
    replies.push(
      "Let me think about that...",
      "Good question! I think...",
      "That's something I've wondered about too."
    );
  }

  // Greeting replies
  if (content.includes('hello') || content.includes('hi ') || content.includes('hey')) {
    replies.push(
      "Hello!",
      "Hi there!",
      "Hey! How's it going?"
    );
  }

  // Gratitude replies
  if (content.includes('thank') || content.includes('appreciate')) {
    replies.push(
      "You're welcome!",
      "Happy to help!",
      "No problem at all!"
    );
  }

  // Problem/help replies
  if (content.includes('problem') || content.includes('help') || content.includes('issue')) {
    replies.push(
      "I can help with that.",
      "What specifically are you struggling with?",
      "Let's work through this together."
    );
  }

  // Positive sentiment replies
  if (content.includes('great') || content.includes('awesome') || content.includes('excellent')) {
    replies.push(
      "That's fantastic!",
      "I'm glad to hear that!",
      "Awesome news!"
    );
  }

  // Default replies if no specific patterns match
  if (replies.length === 0) {
    replies.push(
      "That's interesting!",
      "I see what you mean.",
      "Tell me more about that."
    );
  }

  return replies.slice(0, 3);
}