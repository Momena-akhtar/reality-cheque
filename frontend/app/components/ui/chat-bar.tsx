import { Send } from "lucide-react";
import { useState, KeyboardEvent } from "react";

interface ChatBarProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function ChatBar({ onSendMessage, disabled = false, placeholder = "Ask me anything..." }: ChatBarProps) {
    const [inputValue, setInputValue] = useState("");

    const handleSendMessage = () => {
        if (inputValue.trim() && !disabled) {
            onSendMessage(inputValue);
            setInputValue("");
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !disabled) {
            e.preventDefault();
            handleSendMessage();
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
                    className={`w-full p-3 pr-12 bg-card focus:outline-none border-border focus:ring-2 focus:ring-primary/10 transition-all rounded-3xl ${
                        disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={disabled || !inputValue.trim()}
                    className={`absolute right-2 p-2 rounded-xl transition-colors cursor-pointer ${
                        disabled || !inputValue.trim() 
                            ? 'text-foreground/30 cursor-not-allowed' 
                            : 'text-foreground/80 hover:text-foreground'
                    }`}
                    aria-label="Send message"
                >
                    <Send width={18} height={18} />
                </button>
            </div>
        </div>
    )
}