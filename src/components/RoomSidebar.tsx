'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { User, Room } from '@/types/chat';
import { formatTimestamp, getUserStatus } from '@/lib/chatUtils';
import { 
  Bot, 
  Users, 
  Hash, 
  Plus, 
  Search, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  MessageCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { AVAILABLE_AI_MODELS } from '@/lib/aiModels';

interface RoomSidebarProps {
  rooms: Room[];
  currentRoom: Room | null;
  onRoomSelect: (room: Room) => void;
  user: User;
  onLogout: () => void;
  onToggleTheme: () => void;
}

export function RoomSidebar({ 
  rooms, 
  currentRoom, 
  onRoomSelect, 
  user, 
  onLogout,
  onToggleTheme 
}: RoomSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomType, setNewRoomType] = useState<Room['type']>('general');
  const [selectedAIModel, setSelectedAIModel] = useState('blenderbot');

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: newRoomDescription.trim(),
          type: newRoomType,
          userId: user.id,
          aiModel: newRoomType === 'ai-assistant' ? selectedAIModel : undefined
        }),
      });

      if (response.ok) {
        setShowCreateRoom(false);
        setNewRoomName('');
        setNewRoomDescription('');
        setNewRoomType('general');
        setSelectedAIModel('blenderbot');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const getRoomIcon = (room: Room) => {
    switch (room.type) {
      case 'ai-assistant':
        return <Bot className="h-4 w-4" />;
      case 'general':
        return <Hash className="h-4 w-4" />;
      case 'private':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoomBadge = (room: Room) => {
    if (room.type === 'ai-assistant') {
      return (
        <Badge variant="outline" className="text-xs">
          <Bot className="h-2 w-2 mr-1" />
          AI
        </Badge>
      );
    }
    return null;
  };

  const userStatus = getUserStatus(user);

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback>
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold truncate">{user.username}</h2>
              <div className={`w-2 h-2 rounded-full ${userStatus.color}`} />
            </div>
            <p className="text-sm text-muted-foreground">
              {userStatus.text}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleTheme}
              className="h-8 w-8 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">
            {/* Create Room Button */}
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start mb-2 h-10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                  <DialogDescription>
                    Create a new chat room to start conversations with others or AI assistants.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Enter room name..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="room-description">Description (Optional)</Label>
                    <Input
                      id="room-description"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      placeholder="Describe your room..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="room-type">Room Type</Label>
                    <Select value={newRoomType} onValueChange={(value: Room['type']) => setNewRoomType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Chat</SelectItem>
                        <SelectItem value="ai-assistant">AI Assistant</SelectItem>
                        <SelectItem value="group">Group Chat</SelectItem>
                        <SelectItem value="private">Private Chat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newRoomType === 'ai-assistant' && (
                    <div className="grid gap-2">
                      <Label htmlFor="ai-model">AI Model</Label>
                      <Select value={selectedAIModel} onValueChange={setSelectedAIModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_AI_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateRoom(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()}>
                    Create Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Separator className="my-2" />

            {/* Rooms */}
            {filteredRooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No rooms found' : 'No rooms available'}
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <Button
                  key={room.id}
                  variant={currentRoom?.id === room.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start mb-1 h-auto p-3"
                  onClick={() => onRoomSelect(room)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                      <img
                        src={room.thumbnail}
                        alt={room.name}
                        className="w-8 h-8 rounded-md"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const icon = target.nextElementSibling as HTMLElement;
                          if (icon) icon.style.display = 'block';
                        }}
                      />
                      <span style={{ display: 'none' }}>
                        {getRoomIcon(room)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{room.name}</span>
                        {getRoomBadge(room)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {room.description || `${room.members.length} member${room.members.length !== 1 ? 's' : ''}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(room.lastActivity)}
                      </p>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* AI Preferences Footer */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground mb-2">AI Preferences</div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {AVAILABLE_AI_MODELS.find(m => m.id === user.aiPreferences.preferredModel)?.name || 'Default'}
          </Badge>
          {user.aiPreferences.showSentiment && (
            <Badge variant="outline" className="text-xs">Sentiment</Badge>
          )}
          {user.aiPreferences.enableSuggestions && (
            <Badge variant="outline" className="text-xs">Suggestions</Badge>
          )}
        </div>
      </div>
    </div>
  );
}