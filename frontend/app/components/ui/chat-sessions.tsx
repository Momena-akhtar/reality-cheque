"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSession {
  id: string;
  title: string;
  modelName: string;
  lastActivity: Date;
  totalTokens: number;
  messageCount: number;
}

interface ChatSessionsProps {
  onSelectChat: (chatId: string) => void;
  onClearChat: (chatId: string) => void;
  currentChatId?: string | null;
}

export default function ChatSessions({ onSelectChat, onClearChat, currentChatId }: ChatSessionsProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/generate/chats`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSessions(data.data);
          } else {
            setError(data.message || 'Failed to load chats');
          }
        } else {
          setError('Failed to load chat sessions');
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
        setError('Failed to load chat sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [API_BASE]);

  const handleClearChat = async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE}/generate/chat/${chatId}`, {
        method: 'DELETE',
        credentials: "include",
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.id !== chatId));
        onClearChat(chatId);
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No chat history yet</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <AnimatePresence>
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-2 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
              currentChatId === session.id ? 'bg-muted border border-primary/20' : ''
            }`}
            onClick={() => onSelectChat(session.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{session.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{session.modelName}</p>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(session.lastActivity)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.messageCount} messages
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.totalTokens} tokens
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearChat(session.id);
                }}
                className="ml-2 p-1 text-muted-foreground hover:text-red-500 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 