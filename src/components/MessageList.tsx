'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MessageAnalysis } from './MessageAnalysis';
import { TypingIndicator } from './TypingIndicator';
import { formatTime, shouldShowAvatar, shouldShowTimestamp, getMessageGroupStyle } from '@/lib/chatUtils';
import { chatStore } from '@/lib/chatStore';
import { Message, User, TypingUser } from '@/types/chat';
import { Bot, Copy, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  roomId: string;
}

export function MessageList({ messages, currentUser, roomId }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for typing indicators
  useEffect(() => {
    const updateTypingUsers = () => {
      const typing = chatStore.getTypingUsers(roomId);
      setTypingUsers(typing.filter(t => t.userId !== currentUser.id));
    };

    const unsubscribe = chatStore.subscribe(updateTypingUsers);
    updateTypingUsers();
    
    return unsubscribe;
  }, [roomId, currentUser.id]);

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleEditMessage = (messageId: string) => {
    // This would trigger edit mode in the message input
    console.log('Edit message:', messageId);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages?messageId=${messageId}&roomId=${roomId}&userId=${currentUser.id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const previousMessage = messages[index - 1] || null;
    const nextMessage = messages[index + 1] || null;
    const isOwnMessage = message.userId === currentUser.id;
    const showAvatar = shouldShowAvatar(message, previousMessage, nextMessage);
    const showTimestamp = shouldShowTimestamp(message, previousMessage);
    const messageStyle = getMessageGroupStyle(message, previousMessage, nextMessage, isOwnMessage);

    return (
      <div key={message.id} className="group">
        {showTimestamp && (
          <div className="flex justify-center py-4">
            <Badge variant="secondary" className="text-xs">
              {formatTime(message.timestamp)}
            </Badge>
          </div>
        )}
        
        <div
          className={`flex gap-3 px-4 py-1 hover:bg-muted/50 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
          onMouseEnter={() => setHoveredMessage(message.id)}
          onMouseLeave={() => setHoveredMessage(null)}
        >
          {/* Avatar */}
          <div className={`flex flex-col items-center ${showAvatar ? '' : 'invisible'}`}>
            <Avatar className="w-8 h-8">
              <AvatarImage 
                src={message.userAvatar} 
                alt={message.username}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback>
                {message.type === 'ai-response' ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  message.username.slice(0, 2).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Message Content */}
          <div className={`flex-1 min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
            {showAvatar && (
              <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium">
                  {message.username}
                </span>
                {message.type === 'ai-response' && (
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            )}

            <div className={`relative ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
              <div
                className={`px-4 py-2 max-w-prose break-words ${messageStyle}`}
              >
                {message.content}
                {message.edited && (
                  <span className="text-xs text-muted-foreground ml-2 opacity-70">
                    (edited)
                  </span>
                )}
              </div>

              {/* Message Actions */}
              {hoveredMessage === message.id && isOwnMessage && (
                <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center gap-1 bg-background border rounded-lg shadow-md p-1`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMessage(message.content)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {message.type !== 'ai-response' && message.type !== 'system' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMessage(message.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* AI Analysis */}
            {message.aiAnalysis && currentUser.aiPreferences.showSentiment && (
              <MessageAnalysis 
                analysis={message.aiAnalysis}
                compact={!showAvatar}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <img
            src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/2445ea8d-65f1-4bbe-9330-6d760faa0a36.png"
            alt="No messages yet"
            className="mx-auto mb-4 rounded-full opacity-50"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-sm text-muted-foreground">
            Start the conversation by sending your first message!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="py-4">
          {messages.map((message, index) => renderMessage(message, index))}
          
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-2">
              {typingUsers.map((typing) => (
                <TypingIndicator key={`${typing.userId}-${typing.roomId}`} user={typing} />
              ))}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}