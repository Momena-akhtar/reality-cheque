"use client";

import ChatBar from "../../components/ui/chat-bar";
import ChatHeader from "../../components/ui/chat-header";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { use } from "react";

interface Message {
  id: string;
  text: string;
  type: 'user' | 'bot';
}

interface PageProps {
  params: Promise<{
    botId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default function ChatPage({ params, searchParams }: PageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                <img
                  src={resolvedSearchParams.logo || "/default-icon.png"}
                  alt="logo"
                  className="h-10 w-10 object-cover rounded-md shadow-lg ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300 hover:scale-105"
                />
                <h1 className="text-2xl font-bold">{resolvedSearchParams.title || "Untitled Bot"}</h1>
                <p className="text-md text-foreground/30 text-center">{resolvedSearchParams.description || "No description provided"}</p>
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