import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { generateId, isValidEmail, isValidUsername } from '@/lib/chatUtils';
import { User } from '@/types/chat';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roomId = searchParams.get('roomId');

    if (userId) {
      // Get specific user
      const user = chatStore.getState().users[userId];
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        user: {
          ...user,
          // Don't expose email to other users
          email: undefined
        }
      });
    }

    if (roomId) {
      // Get users in a specific room
      const room = chatStore.getRooms().find(r => r.id === roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

       const users = room.members.map(memberId => {
        const user = chatStore.getState().users[memberId];
        return user ? {
          ...user,
          email: undefined // Don't expose emails
        } : null;
      }).filter((user): user is NonNullable<typeof user> => user !== null);

      return NextResponse.json({ users });
    }

    // Get online users
    const onlineUserIds = chatStore.getState().onlineUsers;
    const onlineUsers = onlineUserIds.map(id => {
      const user = chatStore.getState().users[id];
      return user ? {
        ...user,
        email: undefined
      } : null;
    }).filter((user): user is NonNullable<typeof user> => user !== null);

    return NextResponse.json({ users: onlineUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// Create new user (registration)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, avatar } = body;

    // Validation
    if (!username || !email) {
      return NextResponse.json({ 
        error: 'Username and email are required' 
      }, { status: 400 });
    }

    if (!isValidUsername(username)) {
      return NextResponse.json({ 
        error: 'Username must be 3-20 characters and contain only letters, numbers, _ or -' 
      }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Check if username already exists
    const existingUsers = Object.values(chatStore.getState().users);
    const usernameExists = existingUsers.some(user => 
      user.username.toLowerCase() === username.toLowerCase()
    );
    
    if (usernameExists) {
      return NextResponse.json({ 
        error: 'Username already exists' 
      }, { status: 409 });
    }

    // Check if email already exists
    const emailExists = existingUsers.some(user => 
      user.email.toLowerCase() === email.toLowerCase()
    );
    
    if (emailExists) {
      return NextResponse.json({ 
        error: 'Email already registered' 
      }, { status: 409 });
    }

    // Create new user
    const newUser: User = {
      id: generateId(),
      username,
      email,
      avatar: avatar || `https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/c81d2721-85e2-45f1-af75-3c0c7996d72c.png}+user+profile+avatar+friendly`,
      status: 'online',
      lastSeen: new Date(),
      aiPreferences: {
        preferredModel: 'blenderbot',
        autoTranslate: false,
        showSentiment: true,
        enableSuggestions: true
      }
    };

    // Add user to store
    chatStore.setCurrentUser(newUser);

    return NextResponse.json({ 
      success: true, 
      user: newUser 
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'UserId is required' 
      }, { status: 400 });
    }

    // Get existing user
    const user = chatStore.getState().users[userId];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate updates
    const allowedUpdates = [
      'username', 
      'avatar', 
      'status', 
      'aiPreferences'
    ];
    
    const updateKeys = Object.keys(updates);
    const invalidUpdates = updateKeys.filter(key => !allowedUpdates.includes(key));
    
    if (invalidUpdates.length > 0) {
      return NextResponse.json({ 
        error: `Invalid update fields: ${invalidUpdates.join(', ')}` 
      }, { status: 400 });
    }

    // Validate username if being updated
    if (updates.username && updates.username !== user.username) {
      if (!isValidUsername(updates.username)) {
        return NextResponse.json({ 
          error: 'Invalid username format' 
        }, { status: 400 });
      }

      // Check if new username already exists
      const existingUsers = Object.values(chatStore.getState().users);
      const usernameExists = existingUsers.some((u: User) => 
        u.id !== userId && u.username.toLowerCase() === updates.username.toLowerCase()
      );
      
      if (usernameExists) {
        return NextResponse.json({ 
          error: 'Username already exists' 
        }, { status: 409 });
      }
    }

    // Update user
    chatStore.updateUser(userId, {
      ...updates,
      lastSeen: new Date()
    });

    const updatedUser = chatStore.getState().users[userId];

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// User authentication/login
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username } = body;

    if (!email && !username) {
      return NextResponse.json({ 
        error: 'Email or username is required' 
      }, { status: 400 });
    }

    // Find user by email or username
    const existingUsers = Object.values(chatStore.getState().users);
    const user = existingUsers.find((u: User) => 
      (email && u.email.toLowerCase() === email.toLowerCase()) ||
      (username && u.username.toLowerCase() === username.toLowerCase())
    );

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Update user status to online
    chatStore.updateUser(user.id, {
      status: 'online',
      lastSeen: new Date()
    });

    // Set as current user
    if (user) {
      chatStore.setCurrentUser(user);
    }

    return NextResponse.json({ 
      success: true, 
      user,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

// Update user status and typing indicators
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action'); // 'logout' | 'typing-stop'
    const roomId = searchParams.get('roomId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'UserId is required' 
      }, { status: 400 });
    }

    if (action === 'logout') {
      // Update user status to offline
      chatStore.updateUser(userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      // Remove from online users
      const state = chatStore.getState();
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);

      return NextResponse.json({ 
        success: true, 
        message: 'User logged out'
      });
    }

    if (action === 'typing-stop' && roomId) {
      // Remove typing indicator
      chatStore.removeTypingUser(userId, roomId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Typing indicator removed'
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action or missing parameters' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error in user action:', error);
    return NextResponse.json({ error: 'Failed to process user action' }, { status: 500 });
  }
}