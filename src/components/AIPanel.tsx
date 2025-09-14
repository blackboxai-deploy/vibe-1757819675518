'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { AIModelSelector } from './AIModelSelector';
import { Room, User } from '@/types/chat';
import { getModelById } from '@/lib/aiModels';
import { 
  Bot, 
  Brain, 
  Activity, 
  Settings, 
  X,
  Cpu,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';

interface AIPanelProps {
  currentRoom: Room;
  user: User;
  onClose: () => void;
}

interface AIStatus {
  status: 'online' | 'offline' | 'error';
  models: Record<string, { available: boolean; type: string }>;
  lastChecked: string;
}

export function AIPanel({ currentRoom, user, onClose }: AIPanelProps) {
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState(currentRoom.aiModel || user.aiPreferences.preferredModel);
  const [isChangingModel, setIsChangingModel] = useState(false);

  const currentModel = getModelById(selectedModel);

  // Check AI service status
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const response = await fetch('/api/ai/chat');
        if (response.ok) {
          const status = await response.json();
          setAIStatus(status);
        }
      } catch (error) {
        console.error('Error checking AI status:', error);
        setAIStatus({
          status: 'error',
          models: {},
          lastChecked: new Date().toISOString()
        });
      }
    };

    checkAIStatus();
    const interval = setInterval(checkAIStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleModelChange = async (modelId: string) => {
    setIsChangingModel(true);
    setSelectedModel(modelId);
    
    // In a real app, you'd update the room's AI model
    // For now, we'll just simulate the change
    setTimeout(() => {
      setIsChangingModel(false);
    }, 1000);
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge variant="default" className="bg-green-500">Online</Badge>;
      case 'offline': return <Badge variant="destructive">Offline</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold">AI Assistant Panel</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage AI models and view analytics
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* AI Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Service</span>
                    {getStatusBadge(aiStatus.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last checked: {new Date(aiStatus.lastChecked).toLocaleTimeString()}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                       <span>{Object.values(aiStatus.models).filter((m: { available: boolean }) => m.available).length} Online</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>{Object.values(aiStatus.models).filter((m: { available: boolean }) => !m.available).length} Offline</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  <span className="text-sm">Checking status...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Model */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-4 w-4" />
                Current Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentModel ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentModel.avatar}
                      alt={currentModel.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div>
                      <div className="font-medium">{currentModel.name}</div>
                      <div className="text-xs text-muted-foreground">{currentModel.description}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Max Tokens</span>
                      <span>{currentModel.maxTokens}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Temperature</span>
                      <span>{currentModel.temperature}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentModel.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {isChangingModel && (
                    <Progress value={60} className="h-1" />
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Model not found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="models" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="models" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-4 w-4" />
                    Switch Model
                  </CardTitle>
                  <CardDescription>
                    Choose a different AI model for this conversation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AIModelSelector
                    selectedModel={selectedModel}
                    onModelSelect={handleModelChange}
                    showCapabilities={true}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    AI Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Sentiment</span>
                      <Badge variant={user.aiPreferences.showSentiment ? "default" : "secondary"}>
                        {user.aiPreferences.showSentiment ? "On" : "Off"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Smart Suggestions</span>
                      <Badge variant={user.aiPreferences.enableSuggestions ? "default" : "secondary"}>
                        {user.aiPreferences.enableSuggestions ? "On" : "Off"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto Translate</span>
                      <Badge variant={user.aiPreferences.autoTranslate ? "default" : "secondary"}>
                        {user.aiPreferences.autoTranslate ? "On" : "Off"}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    <Settings className="h-3 w-3 mr-2" />
                    Customize Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" />
                    Conversation Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Messages</span>
                      <span className="font-medium">42</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">AI Responses</span>
                      <span className="font-medium">18</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="font-medium">1.2s</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Sentiment Analysis</div>
                      <div className="flex justify-between text-xs">
                        <span>Positive</span>
                        <span className="text-green-600">60%</span>
                      </div>
                      <Progress value={60} className="h-1" />
                      <div className="flex justify-between text-xs">
                        <span>Neutral</span>
                        <span className="text-gray-600">35%</span>
                      </div>
                      <Progress value={35} className="h-1" />
                      <div className="flex justify-between text-xs">
                        <span>Negative</span>
                        <span className="text-red-600">5%</span>
                      </div>
                      <Progress value={5} className="h-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• AI response generated (2 min ago)</div>
                    <div>• Sentiment analyzed (5 min ago)</div>
                    <div>• Smart suggestion provided (8 min ago)</div>
                    <div>• Model switched to {currentModel?.name} (15 min ago)</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}