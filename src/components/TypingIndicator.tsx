'use client';

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { TypingUser } from '@/types/chat';
import { Bot, Cpu, Globe, Brain } from 'lucide-react';

interface TypingIndicatorProps {
  user: TypingUser;
}

export function TypingIndicator({ user }: TypingIndicatorProps) {
  const getProcessingIcon = (type?: string) => {
    switch (type) {
      case 'generating':
        return <Brain className="h-3 w-3" />;
      case 'analyzing':
        return <Cpu className="h-3 w-3" />;
      case 'translating':
        return <Globe className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getProcessingText = (type?: string) => {
    switch (type) {
      case 'generating':
        return 'generating response';
      case 'analyzing':
        return 'analyzing content';
      case 'translating':
        return 'translating message';
      default:
        return 'typing';
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 animate-pulse">
      <Avatar className="w-8 h-8">
        <AvatarImage src={user.isAI ? undefined : ''} alt={user.username} />
        <AvatarFallback>
          {user.isAI ? (
            <Bot className="h-4 w-4" />
          ) : (
            user.username.slice(0, 2).toUpperCase()
          )}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {user.username} is {getProcessingText(user.processingType)}
        </span>
        
        {user.processingType && (
          <Badge variant="outline" className="text-xs animate-pulse">
            {getProcessingIcon(user.processingType)}
            <span className="ml-1">{user.processingType}</span>
          </Badge>
        )}

        {/* Typing Animation */}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}