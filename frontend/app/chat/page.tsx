import ChatBar from "../components/ui/chat-bar";
import ChatHeader from "../components/ui/chat-header";
export default function ChatPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <ChatHeader />
            <main className="flex-1 mx-auto w-full max-w-4xl p-4 pb-24">
                <div className="space-y-4">
                    {/* Chat messages will be rendered here */}
                    <div className="flex items-center justify-center h-[70vh] text-foreground/40">
                        Hello, How can I help you today?
                    </div>
                </div>
            </main>
            <ChatBar />
        </div>
    )
}