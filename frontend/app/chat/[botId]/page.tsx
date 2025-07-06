import ChatBar from "../../components/ui/chat-bar";
import ChatHeader from "../../components/ui/chat-header";

interface PageProps {
  params: Promise<{
    botId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const title = resolvedSearchParams?.title || "Untitled Bot";
  const description = resolvedSearchParams?.description || "No description provided";
  const logo = resolvedSearchParams?.logo || "/default-icon.png";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ChatHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl p-4 pb-24">
        <div className="space-y-4">
          <div className="flex items-center justify-center h-[70vh] text-foreground flex-col gap-4">
            <img
              src={logo}
              alt="logo"
              className="h-10 w-10 object-cover rounded-md shadow-lg ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300 hover:scale-105"
            />
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-md text-foreground/30">{description}</p>
          </div>
        </div>
      </main>
      <ChatBar />
    </div>
  );
}