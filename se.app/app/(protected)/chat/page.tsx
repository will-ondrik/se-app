'use client';

import { useState, useRef, useEffect } from "react";
import { Send, Users, MessageSquare, Plus, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isCurrentUser: boolean;
  conversationId: string;
}

interface Conversation {
  id: string;
  name: string;
  participants: string[];
  isGeneral?: boolean;
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "general",
      name: "General",
      participants: ["You", "John Smith", "Sarah Johnson", "Mike Davis"],
      isGeneral: true,
    },
  ]);
  
  const [activeConversationId, setActiveConversationId] = useState("general");
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "John Smith",
      text: "Hey team, I'm heading to the Kelowna site today. Anyone need anything?",
      timestamp: new Date(Date.now() - 3600000),
      isCurrentUser: false,
      conversationId: "general",
    },
    {
      id: "2",
      sender: "You",
      text: "Could you check on the excavator? It was making a weird noise yesterday.",
      timestamp: new Date(Date.now() - 3000000),
      isCurrentUser: true,
      conversationId: "general",
    },
    {
      id: "3",
      sender: "Sarah Johnson",
      text: "I'll be there around 2pm. Can help with that.",
      timestamp: new Date(Date.now() - 1800000),
      isCurrentUser: false,
      conversationId: "general",
    },
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [onlineUsers] = useState(["John Smith", "Sarah Johnson", "Mike Davis"]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const conversationMessages = messages.filter(m => m.conversationId === activeConversationId);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversationMessages]);

  const handleCreateConversation = () => {
    if (!newChatName.trim() || selectedUsers.length === 0) return;
    
    const newConversation: Conversation = {
      id: Date.now().toString(),
      name: newChatName,
      participants: ["You", ...selectedUsers],
    };
    
    setConversations([...conversations, newConversation]);
    setActiveConversationId(newConversation.id);
    setNewChatName("");
    setSelectedUsers([]);
    setUserSearchQuery("");
    setIsNewChatOpen(false);
  };

  const toggleUserSelection = (user: string) => {
    setSelectedUsers(prev =>
      prev.includes(user)
        ? prev.filter(u => u !== user)
        : [...prev, user]
    );
  };

  const removeSelectedUser = (user: string) => {
    setSelectedUsers(prev => prev.filter(u => u !== user));
  };

  const filteredUsers = onlineUsers.filter(user =>
    user.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      text: inputValue,
      timestamp: new Date(),
      isCurrentUser: true,
      conversationId: activeConversationId,
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Team Chat
            <InfoTooltip content="Real-time team communication" className="ml-2" />
          </h1>
          <p className="text-muted-foreground">Communicate with your team in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary">{onlineUsers.length} online</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Conversations Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Conversations</CardTitle>
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                    <DialogDescription>
                      Create a new chat and select team members to include
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="chat-name">Chat Name</Label>
                      <Input
                        id="chat-name"
                        placeholder="e.g., Kelowna Project"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Add Team Members</Label>
                      <Input
                        placeholder="Search users..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-md mb-2">
                          {selectedUsers.map((user) => (
                            <Badge
                              key={user}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              onClick={() => removeSelectedUser(user)}
                            >
                              {user} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                      <ScrollArea className="h-[150px] border rounded-md">
                        <div className="p-2 space-y-1">
                          {filteredUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No users found
                            </p>
                          ) : (
                            filteredUsers.map((user) => (
                              <button
                                key={user}
                                onClick={() => toggleUserSelection(user)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted ${
                                  selectedUsers.includes(user)
                                    ? "bg-primary text-primary-foreground"
                                    : ""
                                }`}
                              >
                                {user}
                              </button>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateConversation}>Create Chat</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-muted ${
                      activeConversationId === conversation.id
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {conversation.isGeneral ? (
                        <Hash className="h-4 w-4 shrink-0" />
                      ) : (
                        <MessageSquare className="h-4 w-4 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conversation.name}</p>
                        <p className="text-xs opacity-70 truncate">
                          {conversation.participants.length} members
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              {activeConversation?.isGeneral ? (
                <Hash className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              {activeConversation?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {conversationMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.isCurrentUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {message.sender.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col gap-1 max-w-[70%] ${
                        message.isCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {!message.isCurrentUser && (
                          <span className="font-medium">{message.sender}</span>
                        )}
                        <span>{formatTime(message.timestamp)}</span>
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Online Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {onlineUsers.map((user) => (
                <div key={user} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-xs">
                        {user.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                  </div>
                  <span className="text-sm">{user}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
