"use client";

import ChatBar from "../components/ui/chat-bar";
import ChatHeader from "../components/ui/chat-header";
import ChatHistorySidebar from "../components/ui/chat-history-sidebar";
import TypingIndicator from "../components/ui/typing-indicator";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenCount?: number;
}

interface Model {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  masterPrompt: string;
  featureIds: string[];
  isActive: boolean;
  inputCostPer1KTokens?: number;
  outputCostPer1KTokens?: number;
}

interface ChatSession {
  id: string;
  title: string;
  modelName: string;
  lastActivity: Date;
  totalTokens: number;
  messageCount: number;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const botId = searchParams.get('id');
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
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

  // Fetch user credits
  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`${API_BASE}/generate/credits`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserCredits(data.data.creditsRemaining);
          }
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    };

    fetchCredits();
  }, [user, API_BASE]);

  // Load chat history if chatId is provided in URL
  useEffect(() => {
    const loadChatHistory = async () => {
      const chatId = searchParams.get('chatId');
      if (!chatId || !user) return;

      try {
        const response = await fetch(`${API_BASE}/generate/chat/${chatId}/history`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessages(data.data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              tokenCount: msg.tokenCount
            })));
            setCurrentChatId(chatId);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [searchParams, user, API_BASE]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectChat = (chatId: string) => {
    // Navigate to the chat with the selected chatId
    router.push(`/chat?id=${botId}&chatId=${chatId}`);
  };

  const handleClearChat = (chatId: string) => {
    // If the cleared chat is the current one, clear the messages
    if (currentChatId === chatId) {
      setMessages([]);
      setCurrentChatId(null);
      // Navigate back to just the bot without chatId
      router.push(`/chat?id=${botId}`);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !model || sending) return;

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setSending(true);

    try {
      // Prepare request payload
      const payload = {
        modelId: model._id,
        userInput: text,
        userId: user.id,
        ...(currentChatId && { sessionId: currentChatId })
      };

      const response = await fetch(`${API_BASE}/generate/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Set chat ID for future messages
        if (data.data.chatId) {
          setCurrentChatId(data.data.chatId);
        }
        
        // Update user credits
        if (data.data.cost) {
          setUserCredits(prev => Math.max(0, prev - data.data.cost));
        }
      } else {
        throw new Error(data.message || 'Failed to get response');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Remove the user message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setSending(false);
    }
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
        <ChatHeader 
          onShowHistory={handleShowHistory}
          hasHistory={user !== null}
        />
      </div>
      
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectChat={handleSelectChat}
        onClearChat={handleClearChat}
        currentChatId={currentChatId}
      />
      
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
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: message.role === 'assistant' ? 0.1 : 0 
                      }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-4 rounded-3xl border ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground border-primary/30' 
                            : 'bg-muted border-border'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </motion.div>
                  ))}
                  {sending && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted border border-border max-w-[80%] p-4 rounded-3xl">
                        <TypingIndicator />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-none px-4 max-w-4xl mx-auto w-full">
        <ChatBar 
          onSendMessage={handleSendMessage} 
          disabled={sending || userCredits <= 0.01}
          placeholder={userCredits <= 0.01 ? "Insufficient credits" : "Type your message..."}
        />
        {userCredits <= 0.01 && (
          <div className="text-center text-sm text-red-500 mt-2">
            Insufficient credits. Please upgrade your plan.
          </div>
        )}
      </div>
    </div>
  );
} 