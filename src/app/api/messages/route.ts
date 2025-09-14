import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { generateId, validateMessage, sanitizeMessage } from '@/lib/chatUtils';
import { Message } from '@/types/chat';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const messages = chatStore.getMessages(roomId);
    const paginatedMessages = messages.slice(offset, offset + limit);

    return NextResponse.json({
      messages: paginatedMessages,
      total: messages.length,
      hasMore: offset + limit < messages.length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, userId, roomId, type = 'text' } = body;

    // Validation
    if (!content || !userId || !roomId) {
      return NextResponse.json({ 
        error: 'Content, userId, and roomId are required' 
      }, { status: 400 });
    }

    const validation = validateMessage(content);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get user info
    const user = chatStore.getState().users[userId];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create message
    const message: Message = {
      id: generateId(),
      content: sanitizeMessage(content),
      userId,
      username: user.username,
      userAvatar: user.avatar,
      roomId,
      timestamp: new Date(),
      type: type as 'text' | 'ai-response' | 'system'
    };

    // Add to store
    chatStore.addMessage(message);

    // Remove typing indicator for this user
    chatStore.removeTypingUser(userId, roomId);

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, content, roomId, userId } = body;

    if (!messageId || !content || !roomId || !userId) {
      return NextResponse.json({ 
        error: 'MessageId, content, roomId, and userId are required' 
      }, { status: 400 });
    }

    const validation = validateMessage(content);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if user owns the message
    const messages = chatStore.getMessages(roomId);
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update message
    chatStore.updateMessage(messageId, roomId, {
      content: sanitizeMessage(content),
      edited: true,
      editedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');

    if (!messageId || !roomId || !userId) {
      return NextResponse.json({ 
        error: 'MessageId, roomId, and userId are required' 
      }, { status: 400 });
    }

    // Check if user owns the message
    const messages = chatStore.getMessages(roomId);
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // In a real app, you might soft-delete or actually remove
    // For now, we'll update the content to show it's deleted
    chatStore.updateMessage(messageId, roomId, {
      content: '[This message has been deleted]',
      type: 'system'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}