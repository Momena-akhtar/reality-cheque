"use client";

import ChatHeader from "../components/ui/chat-header";
import ChatHistorySidebar from "../components/ui/chat-history-sidebar";
import TypingIndicator from "../components/ui/typing-indicator";
// FeatureSections removed — feature outputs will appear inside the feature cards
import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Send,  } from "lucide-react";
import { isCategoryAccessible, getUpgradeMessage } from "../utils/tier-access";
import { toast } from "sonner";
import { Button } from "../components/ui/button";

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

// Normalize/format feature output (handles strings, arrays, and objects)
const formatFeatureOutput = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return cleanMarkdown(val);
    if (Array.isArray(val)) return val.map(v => (typeof v === 'string' ? cleanMarkdown(v) : JSON.stringify(v, null, 2))).join('\n\n');
    if (typeof val === 'object') {
        // If object of simple strings, join key: value
        const entries = Object.entries(val);
        const simple = entries.every(([, v]) => typeof v === 'string' || typeof v === 'number' || v === null);
        if (simple) {
            return entries.map(([k, v]) => `${k}: ${cleanMarkdown(String(v ?? ''))}`).join('\n\n');
        }
        // fallback to pretty JSON
        return JSON.stringify(val, null, 2);
    }
    return String(val);
}

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
    const [featureOutputs, setFeatureOutputs] = useState<{ [key: string]: string }>({});
    const [editingGig, setEditingGig] = useState<{ messageId: string; gig: any } | null>(null);
    const [savingGig, setSavingGig] = useState(false);
    const [userGigs, setUserGigs] = useState<any[]>([]);
    const [selectedGigs, setSelectedGigs] = useState<any[]>([]);
    const [showGigSelector, setShowGigSelector] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [upworkLink, setUpworkLink] = useState<string>("");
    // Profile selector state (dropdown placed where Generate button used to be)
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
    // Per-feature input values (featureId -> text)
    const [featureInputs, setFeatureInputs] = useState<{ [key: string]: string }>({});
    // Modal state for feature details
    const [openFeature, setOpenFeature] = useState<Feature | null>(null);
    const [modalInput, setModalInput] = useState<string>("");
    const [postInput, setPostInput] = useState<string>("");

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
                                const featuresData = await featuresResponse.json();
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
                        const lastAssistant = data.data.messages.slice().reverse().find((m: any) => m.role === 'assistant' && m.structuredResponse);
                        if (lastAssistant && lastAssistant.structuredResponse) {
                            const mapped: { [k: string]: string } = {};
                            Object.entries(lastAssistant.structuredResponse).forEach(([k, v]: [string, any]) => {
                                mapped[k] = formatFeatureOutput(v);
                            });
                            setFeatureOutputs(prev => ({ ...prev, ...mapped }));
                        }
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
        if (!user || !model || regeneratingFeature) return;

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
                ...(currentChatId && { chatId: currentChatId }),
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
                if (data.data.updatedResponse && typeof data.data.updatedResponse === 'object') {
                    // If the response is an object with the feature as a key
                    const updatedValue = data.data.updatedResponse[featureName];
                    if (updatedValue) {
                        setFeatureOutputs(prev => ({
                            ...prev,
                            [featureName]: formatFeatureOutput(updatedValue)
                        }));
                    }
                } else if (typeof data.data.updatedResponse === 'string') {
                    // If the response is directly a string
                    setFeatureOutputs(prev => ({
                        ...prev,
                        [featureName]: formatFeatureOutput(data.data.updatedResponse)
                    }));
                }

                toast.success('Feature regenerated successfully');

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
            toast.error(
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
                    if (data.data.structuredResponse) {
                        const mapped: { [k: string]: string } = {};
                        Object.entries(data.data.structuredResponse).forEach(([k, v]: [string, any]) => {
                            mapped[k] = formatFeatureOutput(v);
                        });
                        setFeatureOutputs((prev) => ({ ...prev, ...mapped }));
                    }

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

    // Send text from the post-response input bar
    const handlePostSend = async () => {
        if (!postInput || postInput.trim() === "") return;
        try {
            await handleSendMessage(postInput);
            setPostInput("");
        } catch (err) {
            console.error("Error sending post input:", err);
        }
    };

    // Regenerate by resending the last user message that preceded the last assistant reply
    const handleRegenerate = async () => {
        if (sending) return;

        // find last assistant message index
        const lastAssistantIndex = [...messages].reverse().findIndex(m => m.role === 'assistant');
        if (lastAssistantIndex === -1) {
            // no assistant message found, do nothing
            return;
        }

        // convert reverse index to normal index
        const idx = messages.length - 1 - lastAssistantIndex;
        // find previous user message before that assistant message
        let lastUserMessage: Message | undefined = undefined;
        for (let i = idx - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMessage = messages[i];
                break;
            }
        }

        const textToResend = lastUserMessage ? lastUserMessage.content : postInput;
        await handleSendMessage(textToResend);
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

            <div className="flex-1 overflow-auto">
                <div className="min-h-full flex items-center justify-center py-6">
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center justify-center h-full text-foreground flex-col gap-6 px-4"
                        >
                            {/* Main Container  */}
                            <div className="relative max-w-6xl w-full ">
                                {/* Content Card */}
                                <div className="relative p-10">
                                    {/* Model Name */}
                                        <h1 className="text-3xl font-bold text-center mb-3 relative">
                                                {model.name}
                                        </h1>
                                        {/* Model Description */}
                                        <p className="text-base text-primary-text-faded text-center leading-relaxed mb-8">
                                            {model.description}
                                        </p>
                                        {/* Profile selector*/}
                                        <div className="flex flex-col items-center gap-3 mb-8">
                                            <div className="w-full max-w-lg flex flex-col sm:flex-row items-center gap-3">
                                                <label className="text-sm text-muted-foreground w-full sm:w-auto">Select profile:</label>
                                                <select
                                                    value={selectedProfile ?? ""}
                                                    onChange={(e) => setSelectedProfile(e.target.value || null)}
                                                    className="flex-1 px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Default profile</option>
                                                    {userGigs && userGigs.length > 0 && userGigs.map((g: any, idx: number) => (
                                                        <option key={idx} value={g.id ?? g.title ?? `gig-${idx}`}>
                                                            {g.title || `Gig ${idx + 1}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

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
                                                        <div className="flex flex-wrap justify-center gap-3">
                                                            {modelFeatures.map((feature, index) => (
                                                                <div
                                                                    key={feature._id}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={() => {
                                                                        setOpenFeature(feature);
                                                                        setModalInput(featureInputs[feature._id] || "");
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            setOpenFeature(feature);
                                                                            setModalInput(featureInputs[feature._id] || "");
                                                                        }
                                                                    }}
                                                                    className="bg-muted/30 border border-foreground/20 rounded-lg px-5 py-8 transition-all duration-200 w-full sm:max-w-[350px] lg:max-w-[320px] cursor-pointer"
                                                                >
                                                                    <div className="flex flex-col gap-5">
                                                                        <div className="flex items-start gap-2">
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="text-sm font-medium text-foreground mb-1">
                                                                                    {feature.name}
                                                                                </h4>
                                                                                <p className="text-xs text-primary-text-faded leading-relaxed">
                                                                                    {(() => {
                                                                                        const out = featureOutputs[feature._id] || featureOutputs[feature.name];
                                                                                        return out ? (<span className="whitespace-pre-wrap">{cleanMarkdown(out)}</span>) : feature.description;
                                                                                    })()}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {/* Input bar for each feature*/}
                                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                            <input
                                                                                type="text"
                                                                                placeholder={`Ask about ${feature.name}`}
                                                                                value={featureInputs[feature._id] || ""}
                                                                                onChange={(e) => setFeatureInputs(prev => ({ ...prev, [feature._id]: e.target.value }))}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                            />
                                                                            <Button
                                                                                variant="outline"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleSendMessage(featureInputs[feature._id] || "");
                                                                                }}
                                                                                disabled={sending || userCredits <= 0.01}
                                                                            >
                                                                                <Send className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        {/* Generate button */}
                                        {Object.keys(featureOutputs).length === 0 ? (
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
                                                        <Button
                                                            onClick={() => handleSendMessage(upworkLink || "")}
                                                            disabled={
                                                                sending ||
                                                                userCredits <= 0.01
                                                            }
                                                        >
                                                            {sending ? "Analyzing..." : "Generate"}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleSendMessage("")}
                                                        disabled={
                                                            sending ||
                                                            userCredits <= 0.01 ||
                                                            (model?.name === "Auto-Responder & Delivery Messages" && selectedGigs.length === 0 && userGigs.length > 0)
                                                        }
                                                    >
                                                        {sending ? "Generating..." : "Generate"}
                                                    </Button>
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
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 mb-8">
                                                <div className="w-[60%] flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        type="text"
                                                        value={postInput}
                                                        onChange={(e) => setPostInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handlePostSend();
                                                            }
                                                        }}
                                                        placeholder="Type a follow-up or message..."
                                                        className="flex-1 px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    <Button
                                                        onClick={handleRegenerate}
                                                        disabled={sending || userCredits <= 0.01}
                                                    >
                                                        {sending ? 'Regenerating...' : 'Regenerate'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            {/* Feature Detail Modal*/}
            {openFeature && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setOpenFeature(null);
                    }}
                    tabIndex={-1}
                >
                    {/* Blurred Background */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setOpenFeature(null)}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">{openFeature.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{openFeature.description}</p>
                            </div>
                            <button
                                onClick={() => setOpenFeature(null)}
                                className="p-2 text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 flex flex-col gap-6">
                            {/* Current response if available */}
                            {(featureOutputs[openFeature._id] || featureOutputs[openFeature.name]) && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <label className="block text-sm font-medium text-foreground mb-2">Current Response</label>
                                    <div className="p-4 bg-muted/50 border border-border rounded-lg text-foreground whitespace-pre-wrap overflow-y-auto scrollbar-thin text-sm flex-1">
                                        {featureOutputs[openFeature._id] || featureOutputs[openFeature.name]}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="block text-sm font-medium text-foreground">Feedback or Follow-up</label>
                                <input
                                    type="text"
                                    value={modalInput}
                                    onChange={(e) => setModalInput(e.target.value)}
                                    placeholder={`Add feedback or ask for changes to ${openFeature.name}...`}
                                    className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30 flex-shrink-0">
                            <Button variant="outline" onClick={() => setOpenFeature(null)}>Cancel</Button>
                            {(featureOutputs[openFeature._id] || featureOutputs[openFeature.name]) ? (
                                <Button
                                    onClick={() => {
                                        if (!openFeature) return;
                                        handleRegenerateFeature(openFeature.name, modalInput);
                                        setModalInput("");
                                        setOpenFeature(null);
                                    }}
                                    disabled={sending || regeneratingFeature || userCredits <= 0.01}
                                >
                                    {sending || regeneratingFeature ? 'Regenerating...' : 'Regenerate'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        if (!openFeature) return;
                                        const textToSend = modalInput || featureInputs[openFeature._id] || "";
                                        handleSendMessage(textToSend);
                                        // clear both modal and per-feature input
                                        setFeatureInputs(prev => ({ ...prev, [openFeature._id]: "" }));
                                        setModalInput("");
                                        setOpenFeature(null);
                                    }}
                                    disabled={sending || userCredits <= 0.01}
                                >
                                    {sending ? 'Sending...' : 'Generate'}
                                </Button>
                            )}
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
                            <Button
                                variant="outline"
                                onClick={() => setShowGigSelector(!showGigSelector)}
                            >
                                {showGigSelector ? 'Hide' : 'Select Gigs'}
                            </Button>
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
