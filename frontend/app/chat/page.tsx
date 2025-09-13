"use client";

import ChatBar from "../components/ui/chat-bar";
import ChatHeader from "../components/ui/chat-header";
import ChatHistorySidebar from "../components/ui/chat-history-sidebar";
import TypingIndicator from "../components/ui/typing-indicator";
import FeatureSections from "../components/ui/feature-sections";
import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { MessageSquare, Lock, Crown } from "lucide-react";
import { isCategoryAccessible, getUpgradeMessage } from "../utils/tier-access";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    tokenCount?: number;
    structuredResponse?: { [key: string]: string };
    hasFeatures?: boolean;
    followUpQuestions?: string[];
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
    const { user, loading: authLoading } = useAuth();

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Fetch user credits
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

    // Don't render anything if user is not authenticated (will redirect)
    if (!user) {
        return null;
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSelectChat = (chatId: string) => {
        // Navigate to the chat with the selected chatId
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

        try {
            // Prepare request payload
            const payload = {
                modelId: model._id,
                userInput: text,
                userId: user.id,
                ...(currentChatId && { sessionId: currentChatId }),
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
                                <div className="relative max-w-md w-full">
                                    {/* Gradient Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl blur-xl"></div>

                                    {/* Content Card */}
                                    <div className="relative bg-background/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-8 shadow-xl">
                                        {/* Model Name */}
                                        <h1 className="text-3xl font-bold text-center mb-3 relative">
                                            <span className="text-transparent bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 bg-clip-text">
                                                {model.name}
                                            </span>
                                        </h1>

                                        {/* Model Description */}
                                        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
                                            {model.description}
                                        </p>

                                        {/* Features Cards if model has features */}
                                        {modelFeatures.length > 0 && (
                                            <div className="mb-4">
                                                <div className="relative">
                                                    <div className={`grid gap-3 ${showAllFeatures ? 'grid-cols-1 max-h-80 overflow-y-auto scrollbar-hide' : 'grid-cols-1 max-h-48 overflow-hidden'}`}>
                                                        {modelFeatures.map((feature, index) => (
                                                            <div
                                                                key={feature._id}
                                                                className={`bg-muted/30 border border-border/20 rounded-lg p-3 transition-all duration-200 ${
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
                                    <div className="max-w-4xl mx-auto pt-2 pb-1">
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

                                <div className="max-w-4xl mx-auto space-y-4 py-2">
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
                                                className={`max-w-[80%] p-4 rounded-3xl border ${
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
                                                                            className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
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

                                                        {/* Instructions */}
                                                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                            <div className="flex items-start gap-3">
                                                                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-foreground mb-1">
                                                                        How to
                                                                        use this
                                                                        interface
                                                                    </h4>
                                                                    <p className="text-sm text-foreground">
                                                                        Hover
                                                                        over any
                                                                        section
                                                                        to see
                                                                        the edit
                                                                        button.
                                                                        Click it
                                                                        to
                                                                        provide
                                                                        feedback
                                                                        and
                                                                        regenerate
                                                                        just
                                                                        that
                                                                        specific
                                                                        section
                                                                        while
                                                                        keeping
                                                                        everything
                                                                        else
                                                                        unchanged.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
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
                        className="relative w-full max-w-2xl max-h-[80vh] bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                            <h3 className="text-xl font-semibold text-foreground">
                                Answer Follow-up Questions
                            </h3>
                            <button
                                onClick={() => setShowFollowUpForm(null)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Scrollable Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6">
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
                        
                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30">
                            <button
                                onClick={() => setShowFollowUpForm(null)}
                                className="px-6 py-2 text-sm font-medium cursor-pointer border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Here you can handle the submission of answers
                                    const message = messages.find(m => m.id === showFollowUpForm);
                                    if (message) {
                                        console.log('Follow-up answers:', followUpAnswers[message.id]);
                                    }
                                    setShowFollowUpForm(null);
                                }}
                                className="px-6 py-2 text-sm font-medium cursor-pointer bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Submit Answers
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            <div className="flex-none px-4 max-w-4xl mx-auto w-full">
                <ChatBar
                    onSendMessage={handleSendMessage}
                    disabled={sending || userCredits <= 0.01}
                    placeholder={
                        userCredits <= 0.01
                            ? "Insufficient credits"
                            : "Add anything or click Generate..."
                    }
                />
                {userCredits <= 0.01 && (
                    <div className="text-center text-sm text-red-500 mt-2">
                        Insufficient credits. Please upgrade your plan.
                    </div>
                )}
            </div>
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
