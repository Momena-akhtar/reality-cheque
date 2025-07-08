"use client";

import ChatBar from "../../components/ui/chat-bar";
import ChatHeader from "../../components/ui/chat-header";
import { useState } from "react";
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

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      type: 'user'
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ChatHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl p-4 pb-24">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center h-[70vh] text-foreground flex-col gap-4"
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
            <div className="space-y-4 mt-15">
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
            </div>
          )}
        </AnimatePresence>
      </main>
      <ChatBar onSendMessage={handleSendMessage} />
    </div>
  );
}