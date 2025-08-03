import { Sparkles } from "lucide-react";
import { useState, KeyboardEvent } from "react";

interface ChatBarProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function ChatBar({ onSendMessage, disabled = false, placeholder = "Ask me anything..." }: ChatBarProps) {
    const [inputValue, setInputValue] = useState("");

    const handleGenerate = () => {
        if (!disabled) {
            onSendMessage(inputValue.trim());
            setInputValue("");
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !disabled) {
            e.preventDefault();
            handleGenerate();
        }
    };

    return (
        <div className="bg-card border border-border rounded-4xl p-3 mb-4">
            <div className="flex items-center gap-2 relative">
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full p-3 pr-24 bg-card focus:outline-none border-border focus:ring-2 focus:ring-primary/10 transition-all rounded-3xl ${
                        disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                />
                <button 
                    onClick={handleGenerate}
                    disabled={disabled}
                    className={`absolute right-2 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 ${
                        disabled 
                            ? 'text-foreground/30 cursor-not-allowed bg-muted' 
                            : 'text-primary-foreground  border border-green-700'
                    }`}
                    aria-label="Generate content"
                >
                    <Sparkles width={16} height={16} />
                    <span className="text-sm font-medium">Generate</span>
                </button>
            </div>
        </div>
    )
}