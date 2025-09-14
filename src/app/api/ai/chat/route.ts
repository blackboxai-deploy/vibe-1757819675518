import { NextRequest, NextResponse } from 'next/server';
import { huggingFaceClient } from '@/lib/huggingface';
import { chatStore } from '@/lib/chatStore';
import { generateContextualPrompt, sanitizeAIResponse, formatAIError } from '@/lib/aiUtils';
import { generateId } from '@/lib/chatUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, roomId, model } = body;

    // Validation
    if (!message || !userId || !roomId) {
      return NextResponse.json({ 
        error: 'Message, userId, and roomId are required' 
      }, { status: 400 });
    }

    // Get user and room info
    const user = chatStore.getState().users[userId];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const room = chatStore.getRooms().find(r => r.id === roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if user is member of the room
    if (!room.members.includes(userId)) {
      return NextResponse.json({ error: 'User not authorized for this room' }, { status: 403 });
    }

    // Add typing indicator for AI
    chatStore.addTypingUser({
      userId: 'ai-bot',
      username: 'AI Assistant',
      roomId,
      timestamp: new Date(),
      isAI: true,
      processingType: 'generating'
    });

    // Get conversation context
    const recentMessages = chatStore.getMessages(roomId).slice(-10);
    
    // Generate AI request
    const aiRequest = generateContextualPrompt(
      message,
      user,
      room.type,
      recentMessages
    );

    // Override model if specified
    if (model) {
      aiRequest.model = model;
    } else if (room.aiModel) {
      aiRequest.model = room.aiModel;
    }

    aiRequest.roomId = roomId;

    try {
      // Generate AI response
      const aiResponse = await huggingFaceClient.generateText(aiRequest);
      
      // Remove typing indicator
      chatStore.removeTypingUser('ai-bot', roomId);
      
      // Sanitize response
      aiResponse.content = sanitizeAIResponse(aiResponse.content);
      
      // Add AI message to chat store
      chatStore.addAIResponse(roomId, aiResponse);

      return NextResponse.json({
        success: true,
        response: aiResponse,
        message: {
          id: aiResponse.id,
          content: aiResponse.content,
          userId: 'ai-bot',
          username: 'AI Assistant',
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
        }
      });

    } catch (aiError) {
      // Remove typing indicator on error
      chatStore.removeTypingUser('ai-bot', roomId);
      
      const errorMessage = formatAIError(aiError as Error);
      
      // Add error message to chat
      const errorResponse = {
        id: generateId(),
        content: `I'm sorry, I encountered an error: ${errorMessage}`,
        userId: 'ai-bot',
        username: 'AI Assistant',
        roomId,
        timestamp: new Date(),
        type: 'ai-response' as const
      };
      
      chatStore.addMessage(errorResponse);

      return NextResponse.json({
        success: false,
        error: errorMessage,
        fallbackMessage: errorResponse
      }, { status: 200 }); // Return 200 so UI can show fallback message
    }

  } catch (error) {
    console.error('AI Chat API error:', error);
    
    // Remove typing indicator on error
    const body = await request.json().catch(() => ({}));
    if (body.roomId) {
      chatStore.removeTypingUser('ai-bot', body.roomId);
    }
    
    return NextResponse.json({ 
      error: 'Failed to process AI request' 
    }, { status: 500 });
  }
}

// Get AI model status and capabilities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');

    if (model) {
      // Test specific model
      const testResult = await huggingFaceClient.testConnection();
      return NextResponse.json({
        model,
        available: testResult,
        tested: new Date()
      });
    }

    // Return general AI service status
    const isAvailable = await huggingFaceClient.testConnection();
    
    return NextResponse.json({
      status: isAvailable ? 'online' : 'offline',
      models: {
        'blenderbot': { available: isAvailable, type: 'conversational' },
        'gpt2-large': { available: isAvailable, type: 'text-generation' },
        'codet5': { available: isAvailable, type: 'code-assistance' },
        'flan-t5': { available: isAvailable, type: 'instruction-following' }
      },
      lastChecked: new Date()
    });

  } catch (error) {
    console.error('AI status check error:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Failed to check AI service status'
    }, { status: 500 });
  }
}