"use client"
import Theme from "./theme";
import Logo from "./logo";
import Customize from "./customize";
import { MessageSquare } from "lucide-react";

interface ChatHeaderProps {
  onShowHistory?: () => void;
  hasHistory?: boolean;
}

export default function ChatHeader({ onShowHistory, hasHistory = false }: ChatHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-2 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <Logo />
      <div className="flex justify-end gap-2">
        {hasHistory && onShowHistory && (
          <button
            onClick={onShowHistory}
            className="p-2 text-foreground/80 border border-border rounded-xl cursor-pointer hover:text-foreground transition-colors"
            title="Chat History"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
        <Theme />
      </div>
    </div>
  );
}