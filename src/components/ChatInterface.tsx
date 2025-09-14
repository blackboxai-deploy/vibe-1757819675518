'use client';

import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { RoomSidebar } from './RoomSidebar';
import { AIPanel } from './AIPanel';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, Bot, Users, Settings } from 'lucide-react';
import { chatStore } from '@/lib/chatStore';
import { User, Room, Message } from '@/types/chat';
import { useTheme } from 'next-themes';

interface ChatInterfaceProps {
  user: User;
  onLogout: () => void;
}

export function ChatInterface({ user, onLogout }: ChatInterfaceProps) {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Set up chat store listener
  useEffect(() => {
    const updateState = () => {
      const state = chatStore.getState();
      setCurrentRoom(state.currentRoom);
      setRooms(state.rooms);
      if (state.currentRoom) {
        setMessages(chatStore.getMessages(state.currentRoom.id));
      }
    };

    // Set current user and initial state
    chatStore.setCurrentUser(user);
    updateState();

    // Subscribe to changes
    const unsubscribe = chatStore.subscribe(updateState);
    
    return unsubscribe;
  }, [user]);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleRoomSelect = (room: Room) => {
    chatStore.setCurrentRoom(room.id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentRoom || !content.trim()) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          userId: user.id,
          roomId: currentRoom.id,
          type: 'text'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      // For AI rooms, automatically get AI response
      if (currentRoom.type === 'ai-assistant' && result.success) {
        setTimeout(() => {
          handleAIResponse(content);
        }, 500);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show a toast notification here
    }
  };

  const handleAIResponse = async (userMessage: string) => {
    if (!currentRoom) return;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: user.id,
          roomId: currentRoom.id,
          model: currentRoom.aiModel || user.aiPreferences.preferredModel
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('AI response error:', result.error);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  const toggleAIPanel = () => {
    setShowAIPanel(!showAIPanel);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!currentRoom) {
    return (
      <div className="flex h-screen bg-background">
        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <RoomSidebar
                rooms={rooms}
                currentRoom={currentRoom}
                onRoomSelect={handleRoomSelect}
                user={user}
                onLogout={onLogout}
                onToggleTheme={toggleTheme}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-80 border-r border-border">
            <RoomSidebar
              rooms={rooms}
              currentRoom={currentRoom}
              onRoomSelect={handleRoomSelect}
              user={user}
              onLogout={onLogout}
              onToggleTheme={toggleTheme}
            />
          </div>
        )}

        {/* Welcome Screen */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <img
                src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/369b55bf-5267-40f0-b7a5-3ce783cefb78.png"
                alt="Welcome to AI Chat"
                className="mx-auto rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-3xl font-bold mb-4">Welcome to AI Chat!</h1>
            <p className="text-muted-foreground mb-6">
              Select a room from the sidebar to start chatting with AI assistants or other users.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  const aiRoom = rooms.find(r => r.type === 'ai-assistant');
                  if (aiRoom) handleRoomSelect(aiRoom);
                }}
                className="flex items-center gap-2"
              >
                <Bot className="h-4 w-4" />
                Chat with AI
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const generalRoom = rooms.find(r => r.type === 'general');
                  if (generalRoom) handleRoomSelect(generalRoom);
                }}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                General Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <RoomSidebar
              rooms={rooms}
              currentRoom={currentRoom}
              onRoomSelect={handleRoomSelect}
              user={user}
              onLogout={onLogout}
              onToggleTheme={toggleTheme}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-80 border-r border-border">
          <RoomSidebar
            rooms={rooms}
            currentRoom={currentRoom}
            onRoomSelect={handleRoomSelect}
            user={user}
            onLogout={onLogout}
            onToggleTheme={toggleTheme}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentRoom.thumbnail || 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/19a0bf39-d316-4cf4-a1db-860ab7791fd4.png'}
                alt={currentRoom.name}
                className="w-10 h-10 rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h2 className="font-semibold">{currentRoom.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentRoom.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentRoom.type === 'ai-assistant' && (
                <Button
                  variant={showAIPanel ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAIPanel}
                  className="flex items-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  AI Panel
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages and AI Panel Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages Area */}
          <div className={`flex-1 flex flex-col ${showAIPanel ? 'border-r border-border' : ''}`}>
            <MessageList
              messages={messages}
              currentUser={user}
              roomId={currentRoom.id}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              currentRoom={currentRoom}
              user={user}
            />
          </div>

          {/* AI Panel */}
          {showAIPanel && currentRoom.type === 'ai-assistant' && (
            <div className="w-80">
              <AIPanel
                currentRoom={currentRoom}
                user={user}
                onClose={() => setShowAIPanel(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}