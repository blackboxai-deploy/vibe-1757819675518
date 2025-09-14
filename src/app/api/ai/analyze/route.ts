import { NextRequest, NextResponse } from 'next/server';
import { huggingFaceClient } from '@/lib/huggingface';
import { chatStore } from '@/lib/chatStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, content, roomId, analysisType } = body;

    // Validation
    if (!content || !analysisType) {
      return NextResponse.json({ 
        error: 'Content and analysisType are required' 
      }, { status: 400 });
    }

    if (!['sentiment', 'moderation', 'all'].includes(analysisType)) {
      return NextResponse.json({ 
        error: 'Invalid analysis type. Must be: sentiment, moderation, or all' 
      }, { status: 400 });
    }

    const results: Record<string, unknown> = {};

    try {
      // Sentiment Analysis
      if (analysisType === 'sentiment' || analysisType === 'all') {
        const sentimentResult = await huggingFaceClient.analyzeSentiment(content);
        results.sentiment = {
          label: sentimentResult.label,
          score: sentimentResult.score,
          confidence: sentimentResult.score,
          model: sentimentResult.model
        };
      }

      // Content Moderation
      if (analysisType === 'moderation' || analysisType === 'all') {
        const moderationResult = await huggingFaceClient.moderateContent(content);
        results.moderation = {
          isToxic: moderationResult.isToxic,
          toxicityScore: moderationResult.toxicityScore,
          categories: moderationResult.categories,
          model: moderationResult.model
        };
      }

      // Update message with analysis if messageId provided
      if (messageId && roomId) {
        const analysisData = {
          sentiment: (results.sentiment as any)?.label?.toLowerCase() || 'neutral',
          confidence: (results.sentiment as any)?.confidence || 0.5,
          toxicity: (results.moderation as any)?.toxicityScore || 0,
          topics: extractTopics(content),
          language: 'en', // In production, you'd use language detection
          modelUsed: (results.sentiment as any)?.model || (results.moderation as any)?.model || 'analysis-api',
          processedAt: new Date()
        };

        chatStore.updateMessage(messageId, roomId, {
          aiAnalysis: analysisData
        });
      }

      return NextResponse.json({
        success: true,
        analysis: results,
        timestamp: new Date()
      });

    } catch (aiError) {
      console.error('AI Analysis error:', aiError);
      
      // Return fallback analysis
      const fallbackAnalysis = {
        sentiment: {
          label: 'NEUTRAL',
          score: 0.5,
          confidence: 0.1,
          model: 'fallback'
        },
        moderation: {
          isToxic: false,
          toxicityScore: 0,
          categories: {
            toxic: 0,
            severe_toxic: 0,
            obscene: 0,
            threat: 0,
            insult: 0,
            identity_hate: 0
          },
          model: 'fallback'
        }
      };

      return NextResponse.json({
        success: false,
        analysis: fallbackAnalysis,
        error: 'AI analysis service unavailable, using fallback',
        timestamp: new Date()
      });
    }

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze content' 
    }, { status: 500 });
  }
}

// Batch analysis for multiple messages
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, analysisType = 'all' } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        error: 'Messages array is required and cannot be empty' 
      }, { status: 400 });
    }

    if (messages.length > 10) {
      return NextResponse.json({ 
        error: 'Maximum 10 messages can be analyzed at once' 
      }, { status: 400 });
    }

    const analysisPromises = messages.map(async (msg: { id: string; content: string }) => {
      try {
        const results: Record<string, unknown> = { messageId: msg.id };

        if (analysisType === 'sentiment' || analysisType === 'all') {
          const sentiment = await huggingFaceClient.analyzeSentiment(msg.content);
          results.sentiment = sentiment;
        }

        if (analysisType === 'moderation' || analysisType === 'all') {
          const moderation = await huggingFaceClient.moderateContent(msg.content);
          results.moderation = moderation;
        }

        return results;
      } catch (error) {
        console.error(`Analysis failed for message ${msg.id}:`, error);
        return {
          messageId: msg.id,
          error: 'Analysis failed',
          sentiment: { label: 'NEUTRAL', score: 0.5, model: 'fallback' },
          moderation: { isToxic: false, toxicityScore: 0, model: 'fallback' }
        };
      }
    });

    const analysisResults = await Promise.all(analysisPromises);

    return NextResponse.json({
      success: true,
      results: analysisResults,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Batch analysis API error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform batch analysis' 
    }, { status: 500 });
  }
}

// Helper function to extract topics from text
function extractTopics(text: string): string[] {
  const commonTopics = {
    technology: ['tech', 'computer', 'software', 'app', 'website', 'code', 'programming'],
    work: ['work', 'job', 'career', 'office', 'meeting', 'project', 'business'],
    personal: ['family', 'friend', 'personal', 'life', 'home', 'health'],
    education: ['school', 'learn', 'study', 'education', 'student', 'teacher'],
    entertainment: ['movie', 'music', 'game', 'fun', 'entertainment', 'sport'],
    food: ['food', 'eat', 'restaurant', 'cook', 'recipe', 'meal'],
    travel: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'visit']
  };

  const lowercaseText = text.toLowerCase();
  const detectedTopics: string[] = [];

  Object.entries(commonTopics).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => lowercaseText.includes(keyword))) {
      detectedTopics.push(topic);
    }
  });

  // If no topics detected, add a general one
  if (detectedTopics.length === 0) {
    if (lowercaseText.includes('?')) {
      detectedTopics.push('question');
    } else {
      detectedTopics.push('general');
    }
  }

  return detectedTopics;
}