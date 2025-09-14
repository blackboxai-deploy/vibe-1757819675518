'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { chatStore } from '@/lib/chatStore';
import { User, Room } from '@/types/chat';
import { Send, Bot, Smile, Paperclip } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  currentRoom: Room;
  user: User;
}

export function MessageInput({ onSendMessage, currentRoom, user }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Handle typing indicators
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      chatStore.addTypingUser({
        userId: user.id,
        username: user.username,
        roomId: currentRoom.id,
        timestamp: new Date(),
        isAI: false
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        chatStore.removeTypingUser(user.id, currentRoom.id);
      }
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, currentRoom.id, user.id, user.username, isTyping]);

  // Get AI suggestions as user types
  useEffect(() => {
    if (message.length >= 2 && user.aiPreferences.enableSuggestions) {
      const getSuggestions = async () => {
        try {
          const response = await fetch('/api/ai/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: message,
              userId: user.id,
              roomId: currentRoom.id
            }),
          });

          if (response.ok) {
            const result = await response.json();
            setSuggestions(result.suggestions || []);
            setShowSuggestions(result.suggestions?.length > 0);
          }
        } catch (error) {
          console.error('Error getting suggestions:', error);
        }
      };

      const debounceTimer = setTimeout(getSuggestions, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      return undefined;
    }
  }, [message, user.id, user.aiPreferences.enableSuggestions, currentRoom.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setSuggestions([]);
      setShowSuggestions(false);
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        chatStore.removeTypingUser(user.id, currentRoom.id);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const getPlaceholder = () => {
    if (currentRoom.type === 'ai-assistant') {
      return `Ask ${currentRoom.name} anything...`;
    }
    return `Message ${currentRoom.name}...`;
  };

  return (
    <div className="border-t border-border bg-background p-4">
      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionSelect(suggestion)}
              className="text-xs h-7"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="min-h-[44px] max-h-32 resize-none pr-20"
            rows={1}
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid grid-cols-8 gap-2">
                  {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                    '👍', '👎', '👏', '🙏', '💯', '🔥', '❤️', '💕'
                  ].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg"
                      onClick={() => setMessage(prev => prev + emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          size="sm"
          disabled={!message.trim()}
          className="px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* AI Room Info */}
      {currentRoom.type === 'ai-assistant' && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Bot className="h-3 w-3 mr-1" />
            AI Model: {currentRoom.aiModel || user.aiPreferences.preferredModel}
          </Badge>
          {user.aiPreferences.enableSuggestions && (
            <Badge variant="secondary" className="text-xs">
              Smart Suggestions Enabled
            </Badge>
          )}
        </div>
      )}

      {/* Character Count */}
      <div className="mt-1 text-right">
        <span className={`text-xs ${message.length > 3500 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {message.length}/4000
        </span>
      </div>
    </div>
  );
}