"use client"
import Theme from "./theme";
import Logo from "./logo";
import Customize from "./customize";
import { MessageSquare, Star, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Feature {
  _id: string;
  name: string;
  description: string;
  prompt: string;
  order: number;
  isOptional: boolean;
}

interface ChatHeaderProps {
  onShowHistory?: () => void;
  hasHistory?: boolean;
  modelFeatures?: Feature[];
}

export default function ChatHeader({ onShowHistory, hasHistory = false, modelFeatures = [] }: ChatHeaderProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFeatures(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasFeatures = modelFeatures && modelFeatures.length > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-2 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <Logo />
      <div className="flex justify-end gap-2">
        {hasFeatures && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="px-2 py-2 text-sm border cursor-pointer border-border text-foreground rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-1"
              title="Model Features"
            >
              <Star className="h-4 w-4 text-yellow-500" />
              <ChevronDown className={`h-3 w-3 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
            </button>
            
            {showFeatures && (
              <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-4 w-80 z-50">
                <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Model Features
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {modelFeatures.map((feature) => (
                    <div key={feature._id} className="border-b border-border/30 pb-3 last:border-b-0">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {feature.name}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
          {hasHistory && onShowHistory && (
          <button
            onClick={onShowHistory}
            className="px-2 py-2 text-sm border cursor-pointer border-border text-foreground rounded-xl hover:bg-primary-hover transition-colors"
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