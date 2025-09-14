import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { generateId } from '@/lib/chatUtils';
import { Room } from '@/types/chat';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as Room['type'] | null;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let rooms = chatStore.getRooms();
    
    // Filter rooms by user membership
    rooms = rooms.filter(room => room.members.includes(userId));
    
    // Filter by type if specified
    if (type) {
      rooms = rooms.filter(room => room.type === type);
    }

    // Sort by last activity
    rooms.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // Add message counts and unread counts
    const roomsWithStats = rooms.map(room => {
      const messages = chatStore.getMessages(room.id);
      const stats = chatStore.getMessageStats(room.id);
      
      return {
        ...room,
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1] || null,
        stats
      };
    });

    return NextResponse.json({ rooms: roomsWithStats });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, userId, aiModel } = body;

    // Validation
    if (!name || !userId) {
      return NextResponse.json({ 
        error: 'Name and userId are required' 
      }, { status: 400 });
    }

    if (name.length < 1 || name.length > 50) {
      return NextResponse.json({ 
        error: 'Room name must be between 1 and 50 characters' 
      }, { status: 400 });
    }

    // Check if user exists
    const user = chatStore.getState().users[userId];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create new room
    const room: Room = {
      id: generateId(),
      name,
      description: description || '',
      type: type || 'group',
      members: [userId],
      aiModel: aiModel || undefined,
      createdAt: new Date(),
      lastActivity: new Date(),
      thumbnail: type === 'ai-assistant' 
        ? 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/09873132-d35d-4adb-b0cd-789d8054eefb.png'
        : 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/0ecfeefc-6db8-4eda-b679-c476b3e785c3.png'
    };

    // Add room to store
    chatStore.addRoom(room);

    // Add welcome message for AI rooms
    if (type === 'ai-assistant') {
      const welcomeMessage = {
        id: generateId(),
        content: `Welcome to ${name}! I'm your AI assistant. How can I help you today?`,
        userId: 'ai-bot',
        username: 'AI Assistant',
        userAvatar: chatStore.getState().users['ai-bot']?.avatar,
        roomId: room.id,
        timestamp: new Date(),
        type: 'ai-response' as const
      };
      
      chatStore.addMessage(welcomeMessage);
    }

    return NextResponse.json({ room, success: true });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, name, description, userId } = body;

    if (!roomId || !userId) {
      return NextResponse.json({ 
        error: 'RoomId and userId are required' 
      }, { status: 400 });
    }

    // Find room
    const rooms = chatStore.getRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room = rooms[roomIndex];
    
    // Check if user is member (in a real app, you'd check for admin permissions)
    if (!room.members.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update room (this would be more sophisticated in a real implementation)
    const updatedRoom = {
      ...room,
      name: name || room.name,
      description: description !== undefined ? description : room.description
    };

    // In a real app, you'd update this in the store
    // For now, we'll just return success
    return NextResponse.json({ room: updatedRoom, success: true });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

// Join/Leave room endpoints
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, action } = body; // action: 'join' | 'leave'

    if (!roomId || !userId || !action) {
      return NextResponse.json({ 
        error: 'RoomId, userId, and action are required' 
      }, { status: 400 });
    }

    if (!['join', 'leave'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be either "join" or "leave"' 
      }, { status: 400 });
    }

    // Find room
    const rooms = chatStore.getRooms();
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check user exists
    const user = chatStore.getState().users[userId];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'join') {
      if (!room.members.includes(userId)) {
        room.members.push(userId);
        
        // Add system message
        const joinMessage = {
          id: generateId(),
          content: `${user.username} joined the room`,
          userId: 'system',
          username: 'System',
          roomId: room.id,
          timestamp: new Date(),
          type: 'system' as const
        };
        
        chatStore.addMessage(joinMessage);
      }
    } else {
      room.members = room.members.filter(id => id !== userId);
      
      // Add system message
      const leaveMessage = {
        id: generateId(),
        content: `${user.username} left the room`,
        userId: 'system',
        username: 'System',
        roomId: room.id,
        timestamp: new Date(),
        type: 'system' as const
      };
      
      chatStore.addMessage(leaveMessage);
    }

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Error joining/leaving room:', error);
    return NextResponse.json({ error: 'Failed to process room action' }, { status: 500 });
  }
}