"use client";

import ChatHeader from "../components/ui/chat-header";
import ChatHistorySidebar from "../components/ui/chat-history-sidebar";
import TypingIndicator from "../components/ui/typing-indicator";
import FeatureSections from "../components/ui/feature-sections";
import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { MessageSquare, Lock, Crown, Sparkles } from "lucide-react";
import { isCategoryAccessible, getUpgradeMessage } from "../utils/tier-access";
import { toast } from "sonner";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    tokenCount?: number;
    structuredResponse?: { [key: string]: string };
    hasFeatures?: boolean;
    followUpQuestions?: string[];
    generatedGigs?: {
        title: string;
        description: string;
        tags: string[];
        price: string;
        status: string;
        saved?: boolean;
    };
}

interface Model {
    _id: string;
    name: string;
    description: string;
    categoryId: {
        _id: string;
        name: string;
        description: string;
        tierAccess: "tier1" | "tier2" | "tier3";
    };
    masterPrompt: string;
    featureIds: string[];
    isActive: boolean;
    inputCostPer1KTokens?: number;
    outputCostPer1KTokens?: number;
}

interface Feature {
    _id: string;
    name: string;
    description: string;
    prompt: string;
    order: number;
    isOptional: boolean;
}

// Function to clean up markdown formatting
const cleanMarkdown = (text: string): string => {
    return (
        text
            // Remove bold markdown (**text** -> text)
            .replace(/\*\*(.*?)\*\*/g, "$1")
            // Remove italic markdown (*text* -> text)
            .replace(/\*(.*?)\*/g, "$1")
            // Remove code markdown (`text` -> text)
            .replace(/`(.*?)`/g, "$1")
            // Remove heading markdown (# Heading -> Heading)
            .replace(/^#{1,6}\s+/gm, "")
            // Remove list markdown (- item -> item)
            .replace(/^[-*+]\s+/gm, "")
            // Remove numbered list markdown (1. item -> item)
            .replace(/^\d+\.\s+/gm, "")
            // Clean up extra whitespace
            .replace(/\n\s*\n\s*\n/g, "\n\n")
            .trim()
    );
};

function ChatPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const botId = searchParams.get("id");
    const { user, loading: authLoading, addGig } = useAuth();

    // All hooks must be called before any conditional returns
    const [messages, setMessages] = useState<Message[]>([]);
    const [model, setModel] = useState<Model | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [userCredits, setUserCredits] = useState<number>(0);
    const [showHistory, setShowHistory] = useState(false);
    const [modelFeatures, setModelFeatures] = useState<Feature[]>([]);
    const [regeneratingFeature, setRegeneratingFeature] = useState(false);
    const [showAllFeatures, setShowAllFeatures] = useState(false);
    const [followUpAnswers, setFollowUpAnswers] = useState<{ [messageId: string]: { [questionIndex: number]: string } }>({});
    const [showFollowUpForm, setShowFollowUpForm] = useState<string | null>(null);
    const [editingGig, setEditingGig] = useState<{ messageId: string; gig: any } | null>(null);
    const [savingGig, setSavingGig] = useState(false);
    const [userGigs, setUserGigs] = useState<any[]>([]);
    const [selectedGigs, setSelectedGigs] = useState<any[]>([]);
    const [showGigSelector, setShowGigSelector] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [upworkLink, setUpworkLink] = useState<string>("");

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/signin");
        }
    }, [user, authLoading, router]);

    // Fetch model data when botId changes
    useEffect(() => {
        const fetchModel = async () => {
            if (!botId) {
                setError("No bot ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(
                    `${API_BASE}/ai-models/models/${botId}`,
                    {
                        credentials: 'include'
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    const modelData = data.data;
                    
                    // Check if user has access to this model's category
                    if (user && modelData.categoryId && modelData.categoryId.tierAccess) {
                        const hasAccess = isCategoryAccessible(user.tier || "tier1", modelData.categoryId.tierAccess);
                        if (!hasAccess) {
                            const upgradeMessage = getUpgradeMessage(modelData.categoryId.tierAccess);
                            setError(`Access Denied: ${upgradeMessage}\n\nCurrent tier: ${user.tier}\nRequired tier: ${modelData.categoryId.tierAccess}`);
                            setLoading(false);
                            return;
                        }
                    }
                    
                    setModel(modelData);

                    // Fetch model features if the model has featureIds
                    if (
                        modelData.featureIds &&
                        modelData.featureIds.length > 0
                    ) {
                        try {
                            const featuresResponse = await fetch(
                                `${API_BASE}/ai-models/features`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    credentials: "include",
                                    body: JSON.stringify({
                                        featureIds: modelData.featureIds,
                                    }),
                                }
                            );

                            if (featuresResponse.ok) {
                                const featuresData =
                                    await featuresResponse.json();
                                if (featuresData.success) {
                                    setModelFeatures(featuresData.data);
                                }
                            }
                        } catch (error) {
                            console.error(
                                "Error fetching model features:",
                                error
                            );
                        }
                    }
                } else {
                    throw new Error(data.error || "Failed to fetch model");
                }
            } catch (err) {
                console.error("Error fetching model:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to load bot"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchModel();
    }, [botId, API_BASE, user]);

    useEffect(() => {
        const fetchCredits = async () => {
            if (!user) return;

            try {
                const response = await fetch(`${API_BASE}/generate/credits`, {
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setUserCredits(data.data.creditsRemaining);
                    }
                }
            } catch (error) {
                console.error("Error fetching credits:", error);
            }
        };

        fetchCredits();
    }, [user, API_BASE]);

    // for Auto-Responder model
    useEffect(() => {
        const fetchUserGigs = async () => {
            if (!user || !model || model.name !== "Auto-Responder & Delivery Messages") return;

            try {
                const response = await fetch(`${API_BASE}/user/${user.id}/gigs`, {
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched user gigs:', data);
                    setUserGigs(data || []);
                } else {
                    console.error('Failed to fetch gigs:', response.status, response.statusText);
                }
            } catch (error) {
                console.error("Error fetching user gigs:", error);
            }
        };

        fetchUserGigs();
    }, [user, model, API_BASE]);

    // Load chat history if chatId is provided in URL
    useEffect(() => {
        const loadChatHistory = async () => {
            const chatId = searchParams.get("chatId");
            if (!chatId || !user) return;

            try {
                const response = await fetch(
                    `${API_BASE}/generate/chat/${chatId}/history`,
                    {
                        credentials: "include",
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setMessages(
                            data.data.messages.map(
                                (msg: {
                                    id: string;
                                    role: "user" | "assistant";
                                    content: string;
                                    timestamp: string;
                                    tokenCount: number;
                                    structuredResponse?: {
                                        [key: string]: string;
                                    };
                                    hasFeatures?: boolean;
                                    followUpQuestions?: string[];
                                }) => ({
                                    id: msg.id,
                                    role: msg.role,
                                    content: msg.content,
                                    timestamp: new Date(msg.timestamp),
                                    tokenCount: msg.tokenCount,
                                    structuredResponse: msg.structuredResponse,
                                    hasFeatures: msg.hasFeatures,
                                    followUpQuestions: msg.followUpQuestions,
                                })
                            )
                        );
                        setCurrentChatId(chatId);
                    }
                }
            } catch (error) {
                console.error("Error loading chat history:", error);
            }
        };

        loadChatHistory();
    }, [searchParams, user, API_BASE]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <div className="flex-none">
                    <ChatHeader />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSelectChat = (chatId: string) => {
        router.push(`/chat?id=${botId}&chatId=${chatId}`);
    };

    const handleClearChat = (chatId: string) => {
        // If the cleared chat is the current one, clear the messages
        if (currentChatId === chatId) {
            setMessages([]);
            setCurrentChatId(null);
            // Navigate back to just the bot without chatId
            router.push(`/chat?id=${botId}`);
        }
    };

    const handleShowHistory = () => {
        setShowHistory(true);
    };

    const handleSaveGig = async (gig: any) => {
        if (!user || savingGig) return;

        setSavingGig(true);
        try {
            const success = await addGig(user.id, gig);
            if (success) {
                // Keep the gig in the message but mark it as saved
                setMessages(prev => prev.map(msg => 
                    msg.id === editingGig?.messageId && msg.generatedGigs
                        ? { ...msg, generatedGigs: { ...msg.generatedGigs, saved: true } }
                        : msg
                ));
                toast.success('Gig saved successfully');
                setEditingGig(null);
            } else {
                toast.error('Failed to save gig');
            }
        } catch (error) {
            console.error('Error saving gig:', error);
            toast.error('Failed to save gig');
        } finally {
            setSavingGig(false);
        }
    };

    const handleRegenerateFeature = async (
        featureName: string,
        feedback: string
    ) => {
        if (!user || !model || !currentChatId || regeneratingFeature) return;

        setRegeneratingFeature(true);
        try {
            // Find the last assistant message with structured response
            const lastAssistantMessage = messages
                .filter(
                    (msg) => msg.role === "assistant" && msg.structuredResponse
                )
                .pop();

            if (
                !lastAssistantMessage ||
                !lastAssistantMessage.structuredResponse
            ) {
                throw new Error("No structured response found to regenerate");
            }

            const payload = {
                modelId: model._id,
                featureName,
                userFeedback: feedback,
                currentResponse: lastAssistantMessage.structuredResponse,
                chatId: currentChatId,
            };

            const response = await fetch(
                `${API_BASE}/generate/regenerate-feature`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || "Failed to regenerate feature"
                );
            }

            const data = await response.json();

            if (data.success) {
                // Update the last assistant message with the new structured response
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === lastAssistantMessage.id
                            ? {
                                  ...msg,
                                  structuredResponse: data.data.updatedResponse,
                              }
                            : msg
                    )
                );

                // Update user credits
                if (data.data.cost) {
                    setUserCredits((prev) =>
                        Math.max(0, prev - data.data.cost)
                    );
                }
            } else {
                throw new Error(data.message || "Failed to regenerate feature");
            }
        } catch (error) {
            console.error("Error regenerating feature:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to regenerate feature"
            );
        } finally {
            setRegeneratingFeature(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!user || !model || sending) return;

        // Only add user message to UI if there's actual content
        let userMessage: Message | null = null;
        if (text && text.trim() !== "") {
            userMessage = {
                id: Date.now().toString(),
                role: "user",
                content: text,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMessage!]);
        }

        setSending(true);

        // Auto-hide gig selector when generate button is clicked
        if (model?.name === "Auto-Responder & Delivery Messages") {
            setShowGigSelector(false);
        }

        try {
            // Prepare request payload
            const payload = {
                modelId: model._id,
                userInput: text,
                userId: user.id,
                ...(currentChatId && { sessionId: currentChatId }),
                ...(model.name === "Auto-Responder & Delivery Messages" && selectedGigs.length > 0 && { selectedGigs }),
                ...(model.name === "Profile Optimizer" && upworkLink && { upworkLink }),
            };

            const response = await fetch(`${API_BASE}/generate/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to send message");
            }

            const data = await response.json();

            if (data.success) {
                // Add AI response
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.data.response,
                    timestamp: new Date(),
                    structuredResponse: data.data.structuredResponse,
                    hasFeatures: data.data.hasFeatures,
                    followUpQuestions: data.data.followUpQuestions,
                    generatedGigs: data.data.generatedGigs,
                };

                setMessages((prev) => [...prev, aiMessage]);

                // Set chat ID for future messages
                if (data.data.chatId) {
                    setCurrentChatId(data.data.chatId);
                }

                // Update user credits
                if (data.data.cost) {
                    setUserCredits((prev) =>
                        Math.max(0, prev - data.data.cost)
                    );
                }
            } else {
                throw new Error(data.message || "Failed to get response");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to send message"
            );

            // Remove the user message if there was an error and userMessage exists
            if (userMessage) {
                setMessages((prev) =>
                    prev.filter((msg) => msg.id !== userMessage.id)
                );
            }
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <div className="flex-none">
                    <ChatHeader />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading bot...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !model) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <div className="flex-none">
                    <ChatHeader />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-2">Error</p>
                        <p className="text-muted-foreground">
                            {error || "Bot not found"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <div className="flex-none">
                <ChatHeader
                    onShowHistory={handleShowHistory}
                    hasHistory={user !== null}
                    modelFeatures={modelFeatures}
                />
            </div>

            {/* Chat History Sidebar */}
            <ChatHistorySidebar
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onSelectChat={handleSelectChat}
                onClearChat={handleClearChat}
                currentChatId={currentChatId}
                modelId={botId}
            />

            <div className="flex-1 overflow-hidden pt-15">
                <div className="h-full relative">
                    <AnimatePresence>
                        {messages.length === 0 && currentChatId === null ? (
                            <motion.div
                                initial={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex items-center justify-center h-full text-foreground flex-col gap-6 px-4"
                            >
                                {/* Main Container with Gradient Background */}
                                <div className="relative max-w-2xl w-full">
                                    {/* Gradient Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl blur-xl"></div>

                                    {/* Content Card */}
                                    <div className="relative bg-background/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-10 shadow-2xl">
                                        {/* Model Name */}
                                        <h1 className="text-3xl font-bold text-center mb-3 relative">
                                            <span className="text-transparent bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 bg-clip-text">
                                                {model.name}
                                            </span>
                                        </h1>

                                        {/* Model Description */}
                                        <p className="text-base text-muted-foreground text-center leading-relaxed mb-8">
                                            {model.description}
                                        </p>

                                        {/* Generate Button */}
                                        <div className="flex flex-col items-center gap-3 mb-8">
                                            {model?.name === "Profile Optimizer" ? (
                                                <div className="w-full flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        type="url"
                                                        value={upworkLink}
                                                        onChange={(e) => setUpworkLink(e.target.value)}
                                                        placeholder="Paste your Upwork profile link"
                                                        className="flex-1 px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    <button
                                                        onClick={() => handleSendMessage(upworkLink || "")}
                                                        disabled={
                                                            sending ||
                                                            userCredits <= 0.01
                                                        }
                                                        className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                                                bg-gradient-to-r from-green-600  to-green-700 text-white cursor-pointer hover:translate-y-[-1px]"
                                                    >
                                                        <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-6" />
                                                        {sending ? "Analyzing..." : "Generate"}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleSendMessage("")}
                                                    disabled={
                                                        sending ||
                                                        userCredits <= 0.01 ||
                                                        (model?.name === "Auto-Responder & Delivery Messages" && selectedGigs.length === 0 && userGigs.length > 0)
                                                    }
                                                    className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                                                bg-gradient-to-r from-green-600  to-green-700 text-white cursor-pointer hover:translate-y-[-1px]"
                                                >
                                                    <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-6" />
                                                    {sending ? "Generating..." : "Generate"}
                                                </button>
                                            )}
                                            {userCredits <= 0.01 && (
                                                <div className="text-center text-xs text-red-500">
                                                    Insufficient credits. Please upgrade your plan.
                                                </div>
                                            )}
                                            {model?.name === "Auto-Responder & Delivery Messages" && selectedGigs.length === 0 && userGigs.length > 0 && (
                                                <div className="text-center text-xs text-amber-500">
                                                    Please select at least one gig to provide context for auto-responder generation.
                                                </div>
                                            )}
                                            {model?.name === "Auto-Responder & Delivery Messages" && userGigs.length === 0 && (
                                                <div className="text-center text-xs text-amber-500">
                                                    No gigs found. Please add some Fiverr gigs to your profile first.
                                                </div>
                                            )}
                                        </div>

                                        {/* Features Cards if model has features */}
                                        {modelFeatures.length > 0 && (
                                            <div className="mb-4">
                                                <div className="relative">
                                                    <div className={`grid gap-3 ${showAllFeatures ? 'grid-cols-1 max-h-80 overflow-y-auto scrollbar-hide' : 'grid-cols-1 max-h-48 overflow-hidden'}`}>
                                                        {modelFeatures.map((feature, index) => (
                                                            <div
                                                                key={feature._id}
                                                                className={`bg-muted/30 border border-foreground/20 rounded-lg p-3 transition-all duration-200 ${
                                                                    !showAllFeatures && index >= 3 ? 'opacity-60' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-medium text-foreground mb-1">
                                                                            {feature.name}
                                                                        </h4>
                                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                                            {feature.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Gradient overlay and expand button for overflow */}
                                                    {modelFeatures.length > 3 && !showAllFeatures && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent pointer-events-none"></div>
                                                    )}
                                                    
                                                    {modelFeatures.length > 3 && (
                                                        <div className="flex justify-center mt-3">
                                                            <button
                                                                onClick={() => setShowAllFeatures(!showAllFeatures)}
                                                                className="text-xs cursor-pointer border border-border rounded-lg px-2 py-1 transition-colors font-medium"
                                                            >
                                                                {showAllFeatures ? 'Show Less' : 'Expand'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full overflow-y-auto scrollbar-hide px-4">
                                {/* Small Model Info Card - only when chat has messages AND it's not a history conversation */}
                                {currentChatId === null && (
                                    <div className="max-w-5xl mx-auto pt-2 pb-1">
                                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border/30 w-fit">
                                            <div className="h-5 w-5 bg-primary rounded-sm flex items-center justify-center">
                                                <span className="text-primary-foreground font-bold text-xs">
                                                    AI
                                                </span>
                                            </div>
                                            <span className="text-xs font-medium text-foreground">
                                                {model.name}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="max-w-5xl mx-auto space-y-4 py-2">
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{
                                                duration: 0.3,
                                                delay:
                                                    message.role === "assistant"
                                                        ? 0.1
                                                        : 0,
                                            }}
                                            className={`flex ${
                                                message.role === "user"
                                                    ? "justify-end"
                                                    : "justify-start"
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[85%] p-4 rounded-3xl border ${
                                                    message.role === "user"
                                                        ? "bg-primary text-primary-foreground border-primary/30"
                                                        : "bg-muted border-border"
                                                }`}
                                            >
                                                {message.role === "assistant" &&
                                                message.hasFeatures &&
                                                message.structuredResponse ? (
                                                    <>
                                                        <FeatureSections
                                                            features={
                                                                modelFeatures
                                                            }
                                                            structuredResponse={
                                                                message.structuredResponse
                                                            }
                                                            onRegenerateFeature={
                                                                handleRegenerateFeature
                                                            }
                                                            isRegenerating={
                                                                regeneratingFeature
                                                            }
                                                        />

                                                        {/* Follow-up Questions for Featured Responses */}
                                                        {message.followUpQuestions &&
                                                            message
                                                                .followUpQuestions
                                                                .length > 0 && (
                                                                <div className="mt-6 pt-4 border-t border-border/30">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="text-sm font-medium text-muted-foreground">
                                                                            Follow-up Questions:
                                                                        </div>
                                                                        <button
                                                                            onClick={() => setShowFollowUpForm(
                                                                                showFollowUpForm === message.id ? null : message.id
                                                                            )}
                                                                            className="text-xs px-3 py-1 cursor-pointer bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                                                        >
                                                                            {showFollowUpForm === message.id ? 'Hide Form' : 'Answer Questions'}
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {message.followUpQuestions.map(
                                                                            (
                                                                                question,
                                                                                index
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    className="text-sm text-foreground"
                                                                                >
                                                                                    {index +
                                                                                        1}
                                                                                    .{" "}
                                                                                    {question
                                                                                        .replace(
                                                                                            /\\n/g,
                                                                                            "\n"
                                                                                        )
                                                                                        .trim()}
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                        
                                                    </>
                                                ) : message.role === "assistant" && 
                                                  model?.name === "Auto-Responder & Delivery Messages" && 
                                                  message.structuredResponse ? (
                                                    <>
                                                        {/* Auto-Responder Messages Card */}
                                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                                    <span className="text-white text-xs font-bold">AR</span>
                                                                </div>
                                                                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                                                                    Auto-Responder Messages
                                                                </h4>
                                                            </div>
                                                            
                                                            <div className="space-y-4">
                                                                {Object.entries(message.structuredResponse).map(([key, value]) => (
                                                                    <div key={key} className="space-y-2">
                                                                        <label className="block text-sm font-medium text-blue-700 dark:text-blue-300">
                                                                            {key}
                                                                        </label>
                                                                        <div className="p-4 bg-background/50 border border-blue-200 dark:border-blue-700 rounded-lg">
                                                                            <div className="whitespace-pre-wrap text-sm text-foreground">
                                                                                {value}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Follow-up Questions for Auto-Responder */}
                                                        {message.followUpQuestions &&
                                                            message.followUpQuestions.length > 0 && (
                                                                <div className="mt-6 pt-4 border-t border-border/30">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="text-sm font-medium text-muted-foreground">
                                                                            Follow-up Questions:
                                                                        </div>
                                                                        <button
                                                                            onClick={() => setShowFollowUpForm(
                                                                                showFollowUpForm === message.id ? null : message.id
                                                                            )}
                                                                            className="text-xs px-3 py-1 cursor-pointer bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                                                        >
                                                                            {showFollowUpForm === message.id ? 'Hide Form' : 'Answer Questions'}
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {message.followUpQuestions.map(
                                                                            (question, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="text-sm text-foreground"
                                                                                >
                                                                                    {index + 1}. {question
                                                                                        .replace(/\\n/g, "\n")
                                                                                        .trim()}
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </>
                                                ) : message.role === "assistant" && 
                                                  model?.name === "Gig Builder" && 
                                                  message.generatedGigs ? (
                                                    <>
                                                        {/* AI Generated Gig Card for Gig Builder */}
                                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                                                        <span className="text-white text-xs font-bold">AI</span>
                                                                    </div>
                                                                    <h4 className="text-lg font-semibold text-green-800 dark:text-green-200">
                                                                        Generated Fiverr Gig
                                                                    </h4>
                                                                </div>
                                                                {message.generatedGigs?.saved && (
                                                                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                        Saved
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">Title</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editingGig?.messageId === message.id ? editingGig.gig.title : message.generatedGigs.title}
                                                                        onChange={(e) => {
                                                                            if (editingGig?.messageId === message.id) {
                                                                                setEditingGig(prev => prev ? { ...prev, gig: { ...prev.gig, title: e.target.value } } : null);
                                                                            } else {
                                                                                setEditingGig({ messageId: message.id, gig: { ...message.generatedGigs, title: e.target.value } });
                                                                            }
                                                                        }}
                                                                        disabled={message.generatedGigs?.saved}
                                                                        className={`w-full bg-background px-4 py-3 text-sm border border-green-300 dark:border-green-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${message.generatedGigs?.saved ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                    />
                                                                </div>
                                                                
                                                                <div>
                                                                    <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">Description</label>
                                                                    <textarea
                                                                        value={editingGig?.messageId === message.id ? editingGig.gig.description : message.generatedGigs.description}
                                                                        onChange={(e) => {
                                                                            if (editingGig?.messageId === message.id) {
                                                                                setEditingGig(prev => prev ? { ...prev, gig: { ...prev.gig, description: e.target.value } } : null);
                                                                            } else {
                                                                                setEditingGig({ messageId: message.id, gig: { ...message.generatedGigs, description: e.target.value } });
                                                                            }
                                                                        }}
                                                                        rows={4}
                                                                        disabled={message.generatedGigs?.saved}
                                                                        className={`w-full px-4 py-3 text-sm border border-green-300 dark:border-green-700 rounded-lg bg-background text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${message.generatedGigs?.saved ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                    />
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">Price</label>
                                                                        <input
                                                                            type="text"
                                                                            value={editingGig?.messageId === message.id ? editingGig.gig.price : message.generatedGigs.price}
                                                                            onChange={(e) => {
                                                                                if (editingGig?.messageId === message.id) {
                                                                                    setEditingGig(prev => prev ? { ...prev, gig: { ...prev.gig, price: e.target.value } } : null);
                                                                                } else {
                                                                                    setEditingGig({ messageId: message.id, gig: { ...message.generatedGigs, price: e.target.value } });
                                                                                }
                                                                            }}
                                                                            disabled={message.generatedGigs?.saved}
                                                                            className={`w-full px-4 py-3 text-sm border border-green-300 dark:border-green-700 rounded-lg bg-background text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${message.generatedGigs?.saved ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                        />
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">Status</label>
                                                                        <select
                                                                            value={editingGig?.messageId === message.id ? editingGig.gig.status : message.generatedGigs.status}
                                                                            onChange={(e) => {
                                                                                if (editingGig?.messageId === message.id) {
                                                                                    setEditingGig(prev => prev ? { ...prev, gig: { ...prev.gig, status: e.target.value } } : null);
                                                                                } else {
                                                                                    setEditingGig({ messageId: message.id, gig: { ...message.generatedGigs, status: e.target.value } });
                                                                                }
                                                                            }}
                                                                            disabled={message.generatedGigs?.saved}
                                                                            className={`w-full px-4 py-3 text-sm border border-green-300 dark:border-green-700 rounded-lg bg-background text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${message.generatedGigs?.saved ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                        >
                                                                            <option value="Active">Active</option>
                                                                            <option value="Paused">Paused</option>
                                                                            <option value="Inactive">Inactive</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div>
                                                                    <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">Tags</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editingGig?.messageId === message.id ? editingGig.gig.tags.join(', ') : message.generatedGigs.tags.join(', ')}
                                                                        onChange={(e) => {
                                                                            const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                                                                            if (editingGig?.messageId === message.id) {
                                                                                setEditingGig(prev => prev ? { ...prev, gig: { ...prev.gig, tags: tagsArray } } : null);
                                                                            } else {
                                                                                setEditingGig({ messageId: message.id, gig: { ...message.generatedGigs, tags: tagsArray } });
                                                                            }
                                                                        }}
                                                                        placeholder="tag1, tag2, tag3"
                                                                        disabled={message.generatedGigs?.saved}
                                                                        className={`w-full px-4 py-3 text-sm border border-green-300 dark:border-green-700 rounded-lg bg-background text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${message.generatedGigs?.saved ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                    />
                                                                </div>
                                                                
                                                                {!message.generatedGigs?.saved && (
                                                                    <div className="flex gap-3 pt-4">
                                                                        <button
                                                                            onClick={() => handleSaveGig(editingGig?.messageId === message.id ? editingGig.gig : message.generatedGigs)}
                                                                            disabled={savingGig}
                                                                            className="px-6 py-3 text-sm cursor-pointer font-medium bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                        >
                                                                            {savingGig ? 'Saving...' : 'Save to Profile'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingGig(null)}
                                                                            className="px-6 py-3 text-sm font-medium border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-full cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Follow-up Questions for Gig Builder */}
                                                        {message.followUpQuestions &&
                                                            message.followUpQuestions.length > 0 && (
                                                                <div className="mt-6 pt-4 border-t border-border/30">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="text-sm font-medium text-muted-foreground">
                                                                            Follow-up Questions:
                                                                        </div>
                                                                        <button
                                                                            onClick={() => setShowFollowUpForm(
                                                                                showFollowUpForm === message.id ? null : message.id
                                                                            )}
                                                                            className="text-xs px-3 py-1 cursor-pointer bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                                                        >
                                                                            {showFollowUpForm === message.id ? 'Hide Form' : 'Answer Questions'}
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {message.followUpQuestions.map(
                                                                            (question, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="text-sm text-foreground"
                                                                                >
                                                                                    {index + 1}. {question
                                                                                        .replace(/\\n/g, "\n")
                                                                                        .trim()}
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="whitespace-pre-wrap">
                                                            {message.role ===
                                                            "assistant"
                                                                ? cleanMarkdown(
                                                                      message.content
                                                                  )
                                                                : message.content}
                                                        </div>


                                                        {/* Follow-up Questions for Non-Featured Responses */}
                                                        {message.followUpQuestions &&
                                                            message.followUpQuestions.length > 0 && (
                                                                <div className="mt-6 pt-4 border-t border-border/30">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="text-sm font-medium text-muted-foreground">
                                                                            Follow-up Questions:
                                                                        </div>
                                                                        <button
                                                                            onClick={() => setShowFollowUpForm(
                                                                                showFollowUpForm === message.id ? null : message.id
                                                                            )}
                                                                            className="text-xs px-3 py-1 cursor-pointer bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                                                        >
                                                                            {showFollowUpForm === message.id ? 'Hide Form' : 'Answer Questions'}
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {message.followUpQuestions.map(
                                                                            (question, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="text-sm text-foreground"
                                                                                >
                                                                                    {index + 1}. {question
                                                                                        .replace(/\\n/g, "\n")
                                                                                        .trim()}
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {sending && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-start"
                                        >
                                            <div className="bg-muted border border-border max-w-[80%] p-4 rounded-3xl">
                                                <TypingIndicator />
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Follow-up Questions Modal Overlay */}
            {showFollowUpForm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Blurred Background */}
                    <div 
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowFollowUpForm(null)}
                    />
                    
                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl h-[80vh] bg-background border border-border rounded-xl shadow-2xl flex flex-col"
                    >

                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30 flex-shrink-0">
                            <h3 className="text-xl font-semibold text-foreground">
                                Answer Follow-up Questions
                            </h3>
                            <button
                                onClick={() => setShowFollowUpForm(null)}
                                className="p-2 text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                            {(() => {
                                const message = messages.find(m => m.id === showFollowUpForm);
                                if (!message?.followUpQuestions) return null;
                                
                                return (
                                    <div className="space-y-6">
                                        {message.followUpQuestions.map((question, index) => (
                                            <div key={index} className="space-y-3">
                                                <label className="block text-sm font-medium text-foreground">
                                                    {index + 1}. {question.replace(/\\n/g, "\n").trim()}
                                                </label>
                                                <textarea
                                                    value={followUpAnswers[message.id]?.[index] || ""}
                                                    onChange={(e) => {
                                                        setFollowUpAnswers(prev => ({
                                                            ...prev,
                                                            [message.id]: {
                                                                ...prev[message.id],
                                                                [index]: e.target.value
                                                            }
                                                        }));
                                                    }}
                                                    placeholder="Type your answer here..."
                                                    className="w-full p-4 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                                                    rows={3}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                        
                        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30 flex-shrink-0">
                            <button
                                onClick={() => setShowFollowUpForm(null)}
                                className="px-6 py-2 text-sm font-medium cursor-pointer border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const message = messages.find(m => m.id === showFollowUpForm);
                                    if (!message || !user || !model || !currentChatId) return;

                                    try {
                                        // Prepare the payload
                                        const payload = {
                                            modelId: model._id,
                                            userAnswers: followUpAnswers[message.id] || {},
                                            currentResponse: message.structuredResponse,
                                            chatId: currentChatId,
                                        };

                                        const response = await fetch(
                                            `${API_BASE}/generate/regenerate-from-answers`,
                                            {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                },
                                                credentials: "include",
                                                body: JSON.stringify(payload),
                                            }
                                        );

                                        if (!response.ok) {
                                            const errorData = await response.json();
                                            throw new Error(
                                                errorData.message || "Failed to regenerate response"
                                            );
                                        }

                                        const data = await response.json();

                                        if (data.success) {
                                            // Update the message with the new structured response
                                            setMessages((prev) =>
                                                prev.map((msg) =>
                                                    msg.id === message.id
                                                        ? {
                                                              ...msg,
                                                              structuredResponse: data.data.updatedResponse,
                                                          }
                                                        : msg
                                                )
                                            );

                                            // Update user credits
                                            if (data.data.cost) {
                                                setUserCredits((prev) =>
                                                    Math.max(0, prev - data.data.cost)
                                                );
                                            }

                                            // Clear the form answers
                                            setFollowUpAnswers(prev => ({
                                                ...prev,
                                                [message.id]: {}
                                            }));
                                        } else {
                                            throw new Error(data.message || "Failed to regenerate response");
                                        }
                                    } catch (error) {
                                        console.error("Error regenerating response:", error);
                                        setError(
                                            error instanceof Error
                                                ? error.message
                                                : "Failed to regenerate response"
                                        );
                                    } finally {
                                        setShowFollowUpForm(null);
                                    }
                                }}
                                className="px-6 py-2 text-sm font-medium cursor-pointer bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Submit Answers
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Gig Selector for Auto-Responder Model */}
            {model?.name === "Auto-Responder & Delivery Messages" && (
                <div className="flex-none px-4 max-w-4xl mx-auto w-full mb-4">
                    <div className="bg-muted/30 border border-border/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <h3 className="text-sm font-medium text-foreground">Select Gigs for Context</h3>
                            </div>
                            <button
                                onClick={() => setShowGigSelector(!showGigSelector)}
                                className="text-xs px-3 py-1 cursor-pointer bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                                {showGigSelector ? 'Hide' : 'Select Gigs'}
                            </button>
                        </div>
                        
                        {showGigSelector && (
                            <div className="space-y-3">
                                <div className="text-xs text-muted-foreground">
                                    Select the gigs you want to use as context for generating auto-responder messages:
                                </div>
                                {userGigs.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <div className="text-sm mb-2">No gigs found</div>
                                        <div className="text-xs">You need to create some Fiverr gigs first to use this feature.</div>
                                        <div className="text-xs mt-1">Go to your profile settings to add gigs.</div>
                                    </div>
                                ) : (
                                    <div className="grid gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                                        {userGigs.map((gig, index) => (
                                        <label key={index} className="flex items-start gap-3 p-3 bg-background/50 border border-border/20 rounded-lg cursor-pointer hover:bg-background/80 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedGigs.some(selected => selected.title === gig.title)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedGigs(prev => [...prev, gig]);
                                                    } else {
                                                        setSelectedGigs(prev => prev.filter(selected => selected.title !== gig.title));
                                                    }
                                                }}
                                                className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">
                                                    {gig.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {gig.description}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                                        {gig.price}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                                        {gig.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                        ))}
                                    </div>
                                )}
                                
                                {selectedGigs.length > 0 && (
                                    <div className="pt-3 border-t border-border/30">
                                        <div className="text-xs text-muted-foreground mb-2">
                                            Selected {selectedGigs.length} gig{selectedGigs.length !== 1 ? 's' : ''}:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedGigs.map((gig, index) => (
                                                <div key={index} className="flex border border-border items-center gap-2 px-3 py-1 bg-primary/10 text-foreground rounded-full text-xs">
                                                    <span className="truncate max-w-32">{gig.title}</span>
                                                    <button
                                                        onClick={() => setSelectedGigs(prev => prev.filter((_, i) => i !== index))}
                                                        className="text-foreground cursor-pointer hover:text-primary/70 transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Input bar removed as per requirements */}
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col h-screen overflow-hidden">
                    <div className="flex-none">
                        <ChatHeader />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading...</p>
                        </div>
                    </div>
                </div>
            }
        >
            <ChatPageContent />
        </Suspense>
    );
}
