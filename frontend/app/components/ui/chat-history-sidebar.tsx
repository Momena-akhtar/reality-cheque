"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatSessions from "./chat-sessions";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onClearChat: (chatId: string) => void;
  currentChatId?: string | null;
}

export default function ChatHistorySidebar({
  isOpen,
  onClose,
  onSelectChat,
  onClearChat,
  currentChatId
}: ChatHistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border z-50 shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Chat History</h2>
              <button
                onClick={onClose}
                className="p-2 cursor-pointer text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="h-full overflow-y-auto">
              <ChatSessions
                onSelectChat={(chatId) => {
                  onSelectChat(chatId);
                  onClose();
                }}
                onClearChat={onClearChat}
                currentChatId={currentChatId}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 