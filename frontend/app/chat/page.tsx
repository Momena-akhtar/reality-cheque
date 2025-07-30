"use client";

import ChatBar from "../components/ui/chat-bar";
import ChatHeader from "../components/ui/chat-header";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

interface Message {
  id: string;
  text: string;
  type: 'user' | 'bot';
}

interface Model {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  masterPrompt: string;
  featureIds: string[];
  isActive: boolean;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const botId = searchParams.get('id');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Fetch model data when botId changes
  useEffect(() => {
    const fetchModel = async () => {
      if (!botId) {
        setError('No bot ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/ai-models/models/${botId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setModel(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch model');
        }
      } catch (err) {
        console.error('Error fetching model:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bot');
      } finally {
        setLoading(false);
      }
    };

    fetchModel();
  }, [botId, API_BASE]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user'
    };
    setMessages(prev => [...prev, newMessage]);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-none">
          <ChatHeader />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading bot...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-none">
          <ChatHeader />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error</p>
            <p className="text-muted-foreground">{error || 'Bot not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-none">
        <ChatHeader />
      </div>
      
      <div className="flex-1 overflow-hidden pt-15">
        <div className="h-full relative">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center h-full text-foreground flex-col gap-4 px-4"
              >
                <div className="h-10 w-10 bg-primary rounded-md shadow-lg ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300 hover:scale-105 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">AI</span>
                </div>
                <h1 className="text-2xl font-bold">{model.name}</h1>
                <p className="text-md text-foreground/30 text-center">{model.description}</p>
              </motion.div>
            ) : (
              <div className="h-full overflow-y-auto scrollbar-hide px-4">
                <div className="max-w-4xl mx-auto space-y-4 py-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-2 rounded-3xl ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        {message.text}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-none px-4 max-w-4xl mx-auto w-full">
        <ChatBar onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
} 