'use client';

import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { AVAILABLE_AI_MODELS } from '@/lib/aiModels';
import { Check, Bot, Code, MessageSquare } from 'lucide-react';

interface AIModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  showCapabilities?: boolean;
  compact?: boolean;
}

export function AIModelSelector({ 
  selectedModel, 
  onModelSelect, 
  showCapabilities = false,
  compact = false 
}: AIModelSelectorProps) {
  const getModelIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'conversational':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getCapabilityColor = (capability: string) => {
    switch (capability) {
      case 'chat':
      case 'conversational':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'code-assistance':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'text-generation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'question-answering':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'summarization':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {AVAILABLE_AI_MODELS.map((model) => (
          <Button
            key={model.id}
            variant={selectedModel === model.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModelSelect(model.id)}
            className="w-full justify-start h-auto p-2"
          >
            <div className="flex items-center gap-2 w-full">
              <img
                src={model.avatar}
                alt={model.name}
                className="w-6 h-6 rounded-full"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.style.display = 'none';
                  const icon = e.currentTarget.nextElementSibling as HTMLElement;
                  if (icon) icon.style.display = 'block';
                }}
              />
              <span style={{ display: 'none' }}>
                {getModelIcon(model.type)}
              </span>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{model.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {model.description}
                </div>
              </div>
              {selectedModel === model.id && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-3">
        {AVAILABLE_AI_MODELS.map((model) => (
          <div
            key={model.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedModel === model.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onModelSelect(model.id)}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={model.avatar}
                  alt={model.name}
                  className="w-12 h-12 rounded-full"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none';
                    const icon = e.currentTarget.nextElementSibling as HTMLElement;
                    if (icon) icon.style.display = 'flex';
                  }}
                />
                <div 
                  className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
                  style={{ display: 'none' }}
                >
                  {getModelIcon(model.type)}
                </div>
                {selectedModel === model.id && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{model.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {model.type}
                  </Badge>
                  {!model.isAvailable && (
                    <Badge variant="destructive" className="text-xs">
                      Offline
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {model.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span>Max: {model.maxTokens} tokens</span>
                  {model.temperature && (
                    <span>Temp: {model.temperature}</span>
                  )}
                </div>

                {showCapabilities && model.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.map((capability) => (
                      <Badge
                        key={capability}
                        className={`text-xs ${getCapabilityColor(capability)}`}
                        variant="secondary"
                      >
                        {capability}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}