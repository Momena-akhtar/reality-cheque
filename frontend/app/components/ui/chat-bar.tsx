import { Mic, Plus, Send, Voicemail } from "lucide-react";
import { useState, KeyboardEvent } from "react";

interface ChatBarProps {
    onSendMessage: (message: string) => void;
}

export default function ChatBar({ onSendMessage }: ChatBarProps) {
    const [inputValue, setInputValue] = useState("");

    const handleSendMessage = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue("");
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border border-border mb-4 sm:mb-6 md:mb-10 rounded-4xl border-border p-3 sm:p-3 md:p-4 mx-2 sm:mx-4 md:mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mt-0 relative">
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="w-full p-3 pr-12 bg-card focus:outline-none border-border focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button 
                    onClick={handleSendMessage}
                    className="absolute right-0 p-2 text-foreground/80 hover:text-foreground rounded-xl transition-colors cursor-pointer"
                    aria-label="Send message"
                >
                    <Send width={18} height={18} />
                </button>
            </div>
            <div className="flex justify-start gap-2 relative mt-2">
                <Plus className="text-foreground/80 hover:text-foreground rounded-xl transition-colors cursor-pointer" width={18} height={18}/>
                <Mic className="text-foreground/80 hover:text-foreground rounded-xl transition-colors cursor-pointer" width={18} height={18}/>
            </div>
        </div>
    )
}