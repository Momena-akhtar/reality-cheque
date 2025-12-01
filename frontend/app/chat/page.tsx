"use client";

import ChatHeader from "../components/ui/chat-header";
import ChatHistorySidebar from "../components/ui/chat-history-sidebar";
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

// Parse markdown response for Profile Optimizer
const parseMarkdownResponse = (markdown: string): React.ReactNode => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let listItems: string[] = [];

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Flush pending list items
        if (listItems.length > 0 && !trimmed.match(/^[-*+\d+.]\s/)) {
            elements.push(
                <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 ml-2">
                    {listItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-foreground">{item}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }

        // Headings
        if (trimmed.startsWith('######')) {
            elements.push(<h6 key={`h6-${elements.length}`} className="text-sm font-semibold text-foreground mt-4 mb-2">{trimmed.replace(/^#+\s/, '')}</h6>);
        } else if (trimmed.startsWith('#####')) {
            elements.push(<h5 key={`h5-${elements.length}`} className="text-base font-semibold text-foreground mt-4 mb-2">{trimmed.replace(/^#+\s/, '')}</h5>);
        } else if (trimmed.startsWith('####')) {
            elements.push(<h4 key={`h4-${elements.length}`} className="text-lg font-semibold text-foreground mt-4 mb-2">{trimmed.replace(/^#+\s/, '')}</h4>);
        } else if (trimmed.startsWith('###')) {
            elements.push(<h3 key={`h3-${elements.length}`} className="text-xl font-bold text-foreground mt-5 mb-3">{trimmed.replace(/^#+\s/, '')}</h3>);
        } else if (trimmed.startsWith('##')) {
            elements.push(<h2 key={`h2-${elements.length}`} className="text-2xl font-bold text-foreground mt-6 mb-3">{trimmed.replace(/^#+\s/, '')}</h2>);
        } else if (trimmed.startsWith('#')) {
            elements.push(<h1 key={`h1-${elements.length}`} className="text-3xl font-bold text-foreground mt-6 mb-4">{trimmed.replace(/^#+\s/, '')}</h1>);
        }
        // Horizontal rule
        else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            elements.push(<hr key={`hr-${elements.length}`} className="my-6 border-border" />);
        }
        // Lists
        else if (trimmed.match(/^[-*+]\s/)) {
            listItems.push(trimmed.replace(/^[-*+]\s/, ''));
        } else if (trimmed.match(/^\d+\.\s/)) {
            listItems.push(trimmed.replace(/^\d+\.\s/, ''));
        }
        // Bold text (inline)
        else if (trimmed) {
            const processedLine = trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>');
            elements.push(
                <p key={`p-${elements.length}`} className="text-sm text-foreground leading-relaxed mb-3">
                    <span dangerouslySetInnerHTML={{ __html: processedLine }} />
                </p>
            );
        }

        i++;
    }

    // Flush remaining list items
    if (listItems.length > 0) {
        elements.push(
            <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 ml-2">
                {listItems.map((item, idx) => (
                    <li key={idx} className="text-sm text-foreground">{item}</li>
                ))}
            </ul>
        );
    }

    return <div className="space-y-0">{elements}</div>;
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
    const [generatingFeatureId, setGeneratingFeatureId] = useState<string | null>(null);
    const [featureOutputs, setFeatureOutputs] = useState<{ [key: string]: string }>({});
    const [editingGig, setEditingGig] = useState<{ messageId: string; gig: any } | null>(null);
    const [savingGig, setSavingGig] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [budget, setBudget] = useState(50);
    // Profile selector state (dropdown placed where Generate button used to be)
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
    // Per-feature input values (featureId -> text)
    const [featureInputs, setFeatureInputs] = useState<{ [key: string]: string }>({});
    // Modal state for feature details
    const [openFeature, setOpenFeature] = useState<Feature | null>(null);
    const [modalInput, setModalInput] = useState<string>("");
    const [postInput, setPostInput] = useState<string>("");    
    // Profile Optimizer form state
    const [profileOptimzerFormData, setProfileOptimizerFormData] = useState({
        profileType: "general",
        area: "",
        title: "",
        hourlyRate: "",
        description: ""
    });
    const [proposalResponse, setProposalResponse] = useState<string>("");
    // Proposal Builder form state
    const [proposalBuilderFormData, setProposalBuilderFormData] = useState({
        jobDescription: "",
        budgetType: "fixed",
        budget: 0
    });
    const [generatedProposal, setGeneratedProposal] = useState<{ [key: string]: string } | string | null>(null);
    const [isProposalUnsaved, setIsProposalUnsaved] = useState(false);
    const [savedProposals, setSavedProposals] = useState<Array<{ id: string; title: string; content: string; savedAt: string }>>([]);
    const [selectedSavedProposal, setSelectedSavedProposal] = useState<{ id: string; title: string; content: string; savedAt: string } | null>(null);
    const [showProposalsDropdown, setShowProposalsDropdown] = useState(false);
    const [gigBuilderTiers, setGigBuilderTiers] = useState<{
        tier1: { title: string; pricing: string; description: string; deliverables: string[] };
        tier2: { title: string; pricing: string; description: string; deliverables: string[] };
        tier3: { title: string; pricing: string; description: string; deliverables: string[] };
        faqs: string;
    } | null>(null);

    // Fiverr Response Generator state
    const [selectedClient, setSelectedClient] = useState<string>("Client 1");
    const [clientsList] = useState<string[]>(["Client 1", "Client 2", "Client 3"]);
    const [clientMessages, setClientMessages] = useState<{ [key: string]: Array<{ role: "client" | "you"; message: string; timestamp: Date }> }>({
        "Client 1": [],
        "Client 2": [],
        "Client 3": []
    });
    const [clientMessageInput, setClientMessageInput] = useState<string>("");
    const [generatedResponse, setGeneratedResponse] = useState<string>("");
    const [showClientHistory, setShowClientHistory] = useState(false);
    const [selectedHistoryClient, setSelectedHistoryClient] = useState<string | null>(null);

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
        // Find the feature ID by name
        const featureWithName = modelFeatures.find(f => f.name === featureName);
        if (featureWithName) {
            setGeneratingFeatureId(featureWithName._id);
        }
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
            setGeneratingFeatureId(null);
        }
    };

    const handleSendMessage = async (text: string, featureIdForGeneration?: string) => {
        if (!user || !model || sending) return;

        // Track which feature is being generated
        if (featureIdForGeneration) {
            setGeneratingFeatureId(featureIdForGeneration);
        }

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
                ...(model.name === "Profile Optimizer" && { 
                    profileData: profileOptimzerFormData 
                }),
                ...(model.name === "Proposal Builder" && { 
                    proposalData: proposalBuilderFormData 
                }),
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

                // Handle response based on model type
                if (model.name === "Fiverr Response Generator") {
                    // For Fiverr Response Generator, add to client history and populate response field
                    const clientMsg = {
                        role: "client" as const,
                        message: text,
                        timestamp: new Date()
                    };
                    const responseMsg = {
                        role: "you" as const,
                        message: data.data.response,
                        timestamp: new Date()
                    };
                    
                    setClientMessages(prev => ({
                        ...prev,
                        [selectedClient]: [
                            ...prev[selectedClient],
                            clientMsg,
                            responseMsg
                        ]
                    }));
                    
                    setGeneratedResponse(data.data.response);
                    setClientMessageInput("");
                } else if (model.name === "Profile Optimizer") {
                    // For Profile Optimizer, set the proposal response
                    setProposalResponse(data.data.response);
                } else if (model.name === "Proposal Builder") {
                    // For Proposal Builder, set the generated proposal from response field
                    setGeneratedProposal(data.data.response || "");
                    setIsProposalUnsaved(true);
                } else if (model.name === "Gig Builder") {
                    // For Gig Builder, set the tier data from structured response
                    if (data.data.structuredResponse) {
                        setGigBuilderTiers(data.data.structuredResponse);
                    }
                } else if (data.data.structuredResponse) {
                    // For models with features, populate feature outputs
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
            setGeneratingFeatureId(null);
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
             {/* Saved Proposals Dropdown -(Only for Proposal Builder) */}
            {model?.name === "Proposal Builder" && (
                <div className="absolute top-20 right-4 z-50">
                    <div className="relative">
                        <button
                            onClick={() => setShowProposalsDropdown(!showProposalsDropdown)}
                            className="px-4 py-2 text-sm rounded-md cursor-pointer border-2 border-border bg-background text-foreground hover:bg-background/80 transition-colors"
                        >
                            {user?.agencyName || "Agency"} - Proposals {savedProposals.length > 0 && `(${savedProposals.length})`}
                        </button>
                        {showProposalsDropdown && (
                            <div className="absolute right-0 mt-2 w-full bg-background border border-border rounded-lg shadow-lg">
                                <div className="max-h-96 overflow-y-auto">
                                    {savedProposals.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-foreground/80">
                                            No Proposals Yet
                                        </div>
                                    ) : (
                                        savedProposals.map((proposal) => (
                                            <button
                                                key={proposal.id}
                                                onClick={() => {
                                                    setSelectedSavedProposal(proposal);
                                                    setShowProposalsDropdown(false);
                                                }}
                                                className="w-full text-left cursor-pointer px-4 py-3 hover:bg-muted/50 border-b border-border/30 transition-colors"
                                            >
                                                <div className="text-sm font-medium text-foreground truncate">{proposal.title}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{proposal.savedAt}</div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Message History Dropdown - (Only for Fiverr Response Generator) */}
            {model?.name === "Fiverr Response Generator" && (
                <div className="absolute top-20 right-4 z-50">
                    <div className="relative">
                        <button
                            onClick={() => setShowClientHistory(!showClientHistory)}
                            className="px-4 py-2 text-sm rounded-md cursor-pointer border-2 border-border bg-background text-foreground hover:bg-background/80 transition-colors"
                        >
                            Message history
                        </button>
                        {showClientHistory && (
                            <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg">
                                <div className="max-h-96 overflow-y-auto">
                                    {clientsList.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-foreground/80">
                                            No clients yet
                                        </div>
                                    ) : (
                                        clientsList.map((client) => (
                                            <button
                                                key={client}
                                                onClick={() => {
                                                    setSelectedHistoryClient(client);
                                                    setShowClientHistory(false);
                                                }}
                                                className="w-full text-left cursor-pointer px-4 py-3 hover:bg-muted/50 border-b border-border/30 transition-colors"
                                            >
                                                <div className="text-sm font-medium text-foreground bg-background">{client}</div>
                                                <div className="text-xs text-muted-foreground mt-1 bg-background">
                                                    {clientMessages[client]?.length || 0} messages
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                                            {model?.name === "Fiverr Response Generator" ? (
                                                <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-3">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <label className="text-sm text-muted-foreground whitespace-nowrap">Profile:</label>
                                                        <select
                                                            value={selectedProfile ?? ""}
                                                            onChange={(e) => setSelectedProfile(e.target.value || null)}
                                                            className="flex-1 px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            <option value="">{user?.agencyName || "Default profile"}</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <label className="text-sm text-muted-foreground whitespace-nowrap">Client:</label>
                                                        <select
                                                            value={selectedClient}
                                                            onChange={(e) => setSelectedClient(e.target.value)}
                                                            className="flex-1 px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            {clientsList.map((client) => (
                                                                <option key={client} value={client}>{client}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full max-w-lg flex flex-col sm:flex-row items-center gap-3">
                                                    <label className="text-sm text-muted-foreground w-full sm:w-auto">Select profile:</label>
                                                    <select
                                                        value={selectedProfile ?? ""}
                                                        onChange={(e) => setSelectedProfile(e.target.value || null)}
                                                        className="flex-1 px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                    >
                                                        <option value="">{user?.agencyName || "Default profile"}</option>
                                                    </select>
                                                </div>
                                            )}

                                            {userCredits <= 0.01 && (
                                                <div className="text-center text-xs text-red-500">
                                                    Insufficient credits. Please upgrade your plan.
                                                </div>
                                            )}

                                        </div>

                                        {/* Fiverr Response Generator Form */}
                                        {model?.name === "Fiverr Response Generator" && (
                                            <div className="mb-8 w-full max-w-2xl mx-auto">
                                                <div className="space-y-4">
                                                    {/* Client's Message Input */}
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-sm font-medium text-foreground">Client's message:</label>
                                                        <textarea
                                                            value={clientMessageInput}
                                                            onChange={(e) => setClientMessageInput(e.target.value)}
                                                            placeholder="Enter the message from your client..."
                                                            className="w-full px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                                            rows={3}
                                                        />
                                                    </div>

                                                    {/* Generated Response */}
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-sm font-medium text-foreground">Message to respond with:</label>
                                                        {generatedResponse ? (
                                                            <div className="w-full px-4 py-2.5 text-sm rounded-md border border-border bg-muted/30 text-foreground focus:outline-none resize-none">
                                                                {parseMarkdownResponse(generatedResponse)}
                                                            </div>
                                                        ) : (
                                                            <div className="w-full px-4 py-2.5 text-sm rounded-md border border-border bg-muted/30 text-foreground/50">
                                                                AI will populate this...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Features Cards - Special handling for Gig Builder */}
                                        {modelFeatures.length > 0 && (
                                            model?.name === "Gig Builder" ? (
                                                <div className="mb-8 w-full">
                                                    {/* Gig Builder Layout */}
                                                    <div className="space-y-6">
                                                        {/* Row 1: Title and Description */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                            {/* Title Feature Card */}
                                                            <div
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={() => {
                                                                    const titleFeature = modelFeatures.find(f => f.name === "Title");
                                                                    if (titleFeature) {
                                                                        setOpenFeature(titleFeature);
                                                                        setModalInput(featureInputs[titleFeature._id] || "");
                                                                    }
                                                                }}
                                                                className="bg-muted/30 border border-foreground/20 rounded-lg px-5 py-8 transition-all duration-200 cursor-pointer hover:border-foreground/40"
                                                            >
                                                                <div className="flex flex-col gap-5">
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-foreground mb-1">Title</h4>
                                                                        <p className="text-xs text-primary-text-faded leading-relaxed whitespace-pre-wrap">{gigBuilderTiers?.tier1?.title || "Generate a gig title..."}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Ask about the title..."
                                                                            value={featureInputs["title"] || ""}
                                                                            onChange={(e) => setFeatureInputs(prev => ({ ...prev, ["title"]: e.target.value }))}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRegenerateFeature("Title", featureInputs["title"] || "");
                                                                            }}
                                                                            disabled={sending || regeneratingFeature || userCredits <= 0.01}
                                                                        >
                                                                            <Send className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Description Feature Card */}
                                                            <div
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={() => {
                                                                    const descFeature = modelFeatures.find(f => f.name === "Description");
                                                                    if (descFeature) {
                                                                        setOpenFeature(descFeature);
                                                                        setModalInput(featureInputs[descFeature._id] || "");
                                                                    }
                                                                }}
                                                                className="bg-muted/30 border border-foreground/20 rounded-lg px-5 py-8 transition-all duration-200 cursor-pointer hover:border-foreground/40"
                                                            >
                                                                <div className="flex flex-col gap-5">
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-foreground mb-1">Description</h4>
                                                                        <p className="text-xs text-primary-text-faded leading-relaxed whitespace-pre-wrap">{gigBuilderTiers?.tier2?.description || "Generate a gig description..."}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Ask about the description..."
                                                                            value={featureInputs["description"] || ""}
                                                                            onChange={(e) => setFeatureInputs(prev => ({ ...prev, ["description"]: e.target.value }))}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRegenerateFeature("Description", featureInputs["description"] || "");
                                                                            }}
                                                                            disabled={sending || regeneratingFeature || userCredits <= 0.01}
                                                                        >
                                                                            <Send className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Three Tier Cards */}
                                                        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                            {["tier1", "tier2", "tier3"].map((tierKey, tierIndex) => {
                                                                const tierName = tierKey as "tier1" | "tier2" | "tier3";
                                                                const tierData = gigBuilderTiers?.[tierName];
                                                                const tierLabels = { tier1: "Basic", tier2: "Standard", tier3: "Premium" };
                                                                const tierLabel = tierLabels[tierName];
                                                                const tabs = ["Basic", "Standard", "Premium"];

                                                                return (
                                                                    <div key={tierKey} className="bg-muted/30 border border-foreground/20 rounded-lg overflow-hidden">
                                                                        {/* Tabs */}
                                                                        <div className="flex border-b border-foreground/20">
                                                                            {tabs.map((tab) => (
                                                                                <div key={tab} className={`flex-1 px-3 py-2 text-xs font-medium text-center cursor-default ${tab === tierLabel ? "bg-primary/15 text-primary border-b-2 border-primary" : "bg-background/50 text-muted-foreground"}`}>
                                                                                    {tab}
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {/* Tier Content */}
                                                                        <div className="p-4 space-y-3">
                                                                            {/* Title and Pricing */}
                                                                            <div>
                                                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                                                    <h5 className="text-sm font-medium text-foreground truncate flex-1">{tierData?.title || `${tierLabel} Gig`}</h5>
                                                                                    <span className="text-sm font-semibold text-primary whitespace-nowrap">${tierData?.pricing || (tierIndex === 0 ? "29" : tierIndex === 1 ? "59" : "99")}</span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Description (1 line) */}
                                                                            <div>
                                                                                <p className="text-xs text-primary-text-faded line-clamp-1">{tierData?.description || "Description here..."}</p>
                                                                            </div>

                                                                            {/* Deliverables */}
                                                                            <div>
                                                                                <p className="text-xs font-medium text-foreground mb-2">Deliverables:</p>
                                                                                <ul className="space-y-1">
                                                                                    {(tierData?.deliverables || ["Deliverable 1", "Deliverable 2", "Deliverable 3"]).map((deliverable, idx) => (
                                                                                        <li key={idx} className="text-xs text-primary-text-faded flex items-start gap-2">
                                                                                            <span className="text-primary mt-1">•</span>
                                                                                            <span>{deliverable}</span>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Row 3: FAQs */}
                                                        <div className="flex justify-center">
                                                            <div
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={() => {
                                                                    const faqsFeature = modelFeatures.find(f => f.name === "FAQ & Requirements");
                                                                    if (faqsFeature) {
                                                                        setOpenFeature(faqsFeature);
                                                                        setModalInput(featureInputs[faqsFeature._id] || "");
                                                                    }
                                                                }}
                                                                className="w-1/2 bg-muted/30 border border-foreground/20 rounded-lg px-5 py-8 transition-all duration-200 cursor-pointer hover:border-foreground/40"
                                                            >
                                                            <div className="flex flex-col gap-5">
                                                                <div>
                                                                    <h4 className="text-sm font-medium text-foreground mb-1">FAQs</h4>
                                                                    <p className="text-xs text-primary-text-faded leading-relaxed whitespace-pre-wrap">{gigBuilderTiers?.faqs || "Generate FAQs..."}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Ask about FAQs..."
                                                                        value={featureInputs["faqs"] || ""}
                                                                        onChange={(e) => setFeatureInputs(prev => ({ ...prev, ["faqs"]: e.target.value }))}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                    />
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRegenerateFeature("FAQ & Requirements", featureInputs["faqs"] || "");
                                                                        }}
                                                                        disabled={sending || regeneratingFeature || userCredits <= 0.01}
                                                                    >
                                                                        <Send className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mb-4 relative">
                                                    {/* Loading overlay for global regeneration */}
                                                    {sending && !generatingFeatureId && (
                                                        <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center z-10">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                                <span className="text-sm text-foreground">Working on it...</span>
                                                            </div>
                                                        </div>
                                                    )}
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
                                                                                    {generatingFeatureId === feature._id ? (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                                                                            <span>Working on it...</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        (() => {
                                                                                            const out = featureOutputs[feature._id] || featureOutputs[feature.name];
                                                                                            return out ? (<span className="whitespace-pre-wrap">{cleanMarkdown(out)}</span>) : feature.description;
                                                                                        })()
                                                                                    )}
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
                                                                                    const hasOutput = featureOutputs[feature._id] || featureOutputs[feature.name];
                                                                                    if (hasOutput) {
                                                                                        handleRegenerateFeature(feature.name, featureInputs[feature._id] || "");
                                                                                    } else {
                                                                                        handleSendMessage(featureInputs[feature._id] || "", feature._id);
                                                                                    }
                                                                                }}
                                                                                disabled={sending || regeneratingFeature || userCredits <= 0.01 || generatingFeatureId === feature._id}
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
                                            )
                                        )}
                                        {/* Generate button */}
                                        {Object.keys(featureOutputs).length === 0 && !gigBuilderTiers ? (
                                            <div className="flex flex-col items-center gap-3 mb-8 ">
                                                {model?.name === "Gig Builder" ? (
                                                    <Button
                                                        onClick={() => handleSendMessage("")}
                                                        disabled={
                                                            sending ||
                                                            userCredits <= 0.01
                                                        }
                                                    >
                                                        {sending ? "Generating..." : "Generate"}
                                                    </Button>
                                                ) : model?.name === "Proposal Builder" ? (
                                                    <div className="w-full mx-auto">
                                                       {!generatedProposal ? (
                                                            <>
                                                                {/* Proposal Builder Form */}
                                                                <div className="flex gap-4 mb-6">
                                                                    {/* Job Description */}
                                                                    <div className="flex flex-col">
                                                                        <label className="text-sm font-medium text-foreground mb-2">Job Description</label>
                                                                        <textarea
                                                                            value={proposalBuilderFormData.jobDescription}
                                                                            onChange={(e) => {
                                                                                setProposalBuilderFormData({...proposalBuilderFormData, jobDescription: e.target.value});
                                                                                e.target.style.height = 'auto';
                                                                                e.target.style.height = Math.min(e.target.scrollHeight, 400) + 'px';
                                                                            }}
                                                                            placeholder="Paste job description..."
                                                                            rows={3}
                                                                            className="px-4 py-4 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-hidden"
                                                                        />
                                                                    </div>

                                                                    {/* Budget Section */}
                                                                    <div className="flex-2 flex flex-col gap-3">
                                                                        <label className="text-sm font-medium text-foreground">Budget</label>
                                                                            <div className="flex justify-between items-center gap-4">
                                                                                <label className="text-xs text-foreground/80 mb-1.5 block">Select your pricing</label>
                                                                                <select
                                                                                    value={proposalBuilderFormData.budgetType}
                                                                                    onChange={(e) => setProposalBuilderFormData({...proposalBuilderFormData, budgetType: e.target.value})}
                                                                                    className=" px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                                >
                                                                                    <option value="fixed">Fixed</option>
                                                                                    <option value="variable">Variable</option>
                                                                                </select>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm ">$</span>
                                                                                <div className="flex-1 flex items-center border border-border rounded-md bg-background focus-within:ring-2 focus-within:ring-blue-500">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setBudget(Math.max(0, budget - 1))}
                                                                                    className="px-3 py-2.5 text-sm  transition-colors"
                                                                                >
                                                                                    &lt;
                                                                                </button>
                                                                                <input
                                                                                    type="number"
                                                                                    value={budget}
                                                                                    onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                                                                                    className="flex-1 px-3 py-2.5 text-sm text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setBudget(budget + 1)}
                                                                                    className="px-3 py-2.5 text-sm transition-colors"
                                                                                >
                                                                                    &gt;
                                                                                </button>
                                                                                </div>
                                                                            </div>                                                                    
                                                                        </div>
                                                                </div>
                                                                {/* Generate Button */}
                                                                <div className="flex justify-center mb-6">
                                                                    <Button
                                                                        onClick={() => handleSendMessage(JSON.stringify(proposalBuilderFormData))}
                                                                        disabled={
                                                                            sending ||
                                                                            userCredits <= 0.01 ||
                                                                            !proposalBuilderFormData.jobDescription
                                                                        }
                                                                    >
                                                                        {sending ? "Generating..." : "Generate"}
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="w-full flex flex-col items-center gap-4">
                                                                {/* Generated Proposal Section */}
                                                                <div className="w-full max-w-4xl mx-auto">
                                                                    <div className="bg-muted/30 border border-foreground/20 rounded-lg p-6">
                                                                        <h3 className="text-lg font-semibold text-foreground mb-4">Proposal</h3>
                                                                        <div className="max-w-none text-foreground">
                                                                            {typeof generatedProposal === 'string' ? (
                                                                                parseMarkdownResponse(generatedProposal)
                                                                            ) : (
                                                                                <div className="space-y-3">
                                                                                    {generatedProposal && Object.entries(generatedProposal).map(([key, value]) => (
                                                                                        <div key={key} className="flex flex-col">
                                                                                            <label className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                                                            <div className="text-sm text-foreground mt-1 p-3 bg-background/50 rounded border border-border/50 whitespace-pre-wrap">
                                                                                                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-4 flex gap-2 justify-end">
                                                                            {isProposalUnsaved && (
                                                                                <Button
                                                                                    variant="outline"
                                                                                    onClick={() => {
                                                                                        const proposalTitle = `Proposal - ${new Date().toLocaleDateString()}`;
                                                                                        const newProposal = {
                                                                                            id: Date.now().toString(),
                                                                                            title: proposalTitle,
                                                                                            content: typeof generatedProposal === 'string' ? generatedProposal : JSON.stringify(generatedProposal),
                                                                                            savedAt: new Date().toLocaleString()
                                                                                        };
                                                                                        setSavedProposals(prev => [...prev, newProposal]);
                                                                                        setIsProposalUnsaved(false);
                                                                                        toast.success('Proposal saved');
                                                                                    }}
                                                                                    disabled={savingGig}
                                                                                >
                                                                                    {savingGig ? 'Saving...' : 'Save Proposal'}
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="w-[80%] flex flex-col sm:flex-row gap-2">
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
                                                                        onClick={() => {
                                                                            setGeneratedProposal(null);
                                                                            setIsProposalUnsaved(false);
                                                                            setProposalBuilderFormData({
                                                                                jobDescription: "",
                                                                                budgetType: "fixed",
                                                                                budget: 0
                                                                            });
                                                                        }}
                                                                        disabled={sending || userCredits <= 0.01}
                                                                    >
                                                                        {sending ? 'Regenerating...' : 'Regenerate'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : model?.name === "Profile Optimizer" ? (
                                                    <div className="w-full">
                                                        {/* Show form only when no proposal response */}
                                                        {!proposalResponse ? (
                                                            <>
                                                                {/* Profile Optimizer Form - 2 columns, 3 rows */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 w-full max-w-2xl mx-auto">
                                                            {/* Row 1, Col 1: Profile Type */}
                                                            <div className="flex flex-col">
                                                                <label className="text-sm font-medium text-foreground mb-2">Profile Type</label>
                                                                <select
                                                                    value={profileOptimzerFormData.profileType}
                                                                    onChange={(e) => setProfileOptimizerFormData({...profileOptimzerFormData, profileType: e.target.value})}
                                                                    className="px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                >
                                                                    <option value="general">General</option>
                                                                    <option value="specialized">Specialized</option>
                                                                </select>
                                                            </div>

                                                            {/* Row 1, Col 2: Area (conditional, only for Specialized) */}
                                                            {profileOptimzerFormData.profileType === "specialized" && (
                                                                <div className="flex flex-col">
                                                                    <label className="text-sm font-medium text-foreground mb-2">Area of Specialization</label>
                                                                    <input
                                                                        type="text"
                                                                        value={profileOptimzerFormData.area}
                                                                        onChange={(e) => setProfileOptimizerFormData({...profileOptimzerFormData, area: e.target.value})}
                                                                        placeholder="e.g., Web Development"
                                                                        className="px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Row 2, Col 1: Title */}
                                                            <div className="flex flex-col">
                                                                <label className="text-sm font-medium text-foreground mb-2">Profile Title</label>
                                                                <input
                                                                    type="text"
                                                                    value={profileOptimzerFormData.title}
                                                                    onChange={(e) => setProfileOptimizerFormData({...profileOptimzerFormData, title: e.target.value})}
                                                                    placeholder="Your professional title"
                                                                    className="px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                />
                                                            </div>
                                                            {/* Row 3, Col 1: Hourly Rate */}
                                                            <div className="flex flex-col">
                                                                <label className="text-sm font-medium text-foreground mb-2">Hourly Rate ($)</label>
                                                                <input
                                                                    type="text"
                                                                    value={profileOptimzerFormData.hourlyRate}
                                                                    onChange={(e) => setProfileOptimizerFormData({...profileOptimzerFormData, hourlyRate: e.target.value})}
                                                                    placeholder="e.g., 50"
                                                                    className="px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                                />
                                                            </div>

                                                            {/* Row 3, Col 2: Description */}
                                                            <div className="flex flex-col sm:col-span-2">
                                                                <label className="text-sm font-medium text-foreground mb-2">Description</label>
                                                                <textarea
                                                                    value={profileOptimzerFormData.description}
                                                                    onChange={(e) => setProfileOptimizerFormData({...profileOptimzerFormData, description: e.target.value})}
                                                                    placeholder="Brief description of your services"
                                                                    rows={5}
                                                                    className="px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Generate Button */}
                                                        <div className="flex justify-center">
                                                            <Button
                                                                onClick={() => handleSendMessage(JSON.stringify(profileOptimzerFormData))}
                                                                disabled={
                                                                    sending ||
                                                                    userCredits <= 0.01 ||
                                                                    !profileOptimzerFormData.title                                                                }
                                                            >
                                                                {sending ? "Analyzing..." : "Generate"}
                                                            </Button>
                                                        </div>
                                                            </>
                                                        ) : (
                                                            <div className="w-full flex flex-col items-center gap-4">
                                                                <div className="w-full max-w-4xl mx-auto">
                                                                    <div className="bg-muted/30 border border-foreground/20 rounded-lg p-6">
                                                                        <div className="max-w-none text-foreground">
                                                                            {parseMarkdownResponse(proposalResponse)}
                                                                        </div>
                                                                    </div>
                                                                </div>
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
                                                                        onClick={() => {
                                                                            setProposalResponse("");
                                                                            setProfileOptimizerFormData({
                                                                                profileType: "general",
                                                                                area: "",
                                                                                title: "",
                                                                                hourlyRate: "",
                                                                                description: ""
                                                                            });
                                                                        }}
                                                                        disabled={sending || userCredits <= 0.01}
                                                                    >
                                                                        {sending ? 'Regenerating...' : 'Regenerate'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleSendMessage(clientMessageInput)}
                                                        disabled={
                                                            sending ||
                                                            userCredits <= 0.01 ||
                                                            (model?.name === "Fiverr Response Generator" && !clientMessageInput.trim())
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
                        className="absolute inset-0 bg-background/80"
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

            {/* Saved Proposal Modal */}
            {selectedSavedProposal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setSelectedSavedProposal(null);
                    }}
                    tabIndex={-1}
                >
                    {/* Blurred Background */}
                    <div
                        className="absolute inset-0 bg-background/80"
                        onClick={() => setSelectedSavedProposal(null)}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-background border border-border rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">{selectedSavedProposal.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">Saved: {selectedSavedProposal.savedAt}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSavedProposal(null)}
                                className="p-2 text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                            <div className="max-w-none text-foreground">
                                {parseMarkdownResponse(selectedSavedProposal.content)}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30 flex-shrink-0">
                            <Button variant="outline" onClick={() => setSelectedSavedProposal(null)}>Close</Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Client Message History Modal */}
            {selectedHistoryClient && clientMessages[selectedHistoryClient] && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setSelectedHistoryClient(null);
                    }}
                    tabIndex={-1}
                >
                    {/* Blurred Background */}
                    <div
                        className="absolute inset-0 bg-background/80"
                        onClick={() => setSelectedHistoryClient(null)}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30 flex-shrink-0">
                            <h3 className="text-xl font-semibold text-foreground">Messages with {selectedHistoryClient}</h3>
                            <button
                                onClick={() => setSelectedHistoryClient(null)}
                                className="p-2 text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages Thread */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
                            {clientMessages[selectedHistoryClient].length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    No messages yet
                                </div>
                            ) : (
                                clientMessages[selectedHistoryClient].map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "client" ? "justify-start" : "justify-end"}`}
                                    >
                                        <div
                                            className={`max-w-xs px-4 py-2 rounded-lg ${
                                                msg.role === "client"
                                                    ? "bg-background/50 border border-border text-foreground"
                                                    : "bg-background/80 border border-border text-primary-foreground"
                                            }`}
                                        >
                                            <p className="text-sm">{msg.message}</p>
                                            <p className="text-xs mt-1 opacity-70">
                                                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Footer */}
                        <div className="border-t border-border bg-muted/30 p-4 flex-shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={`Enter ${selectedHistoryClient}'s message...`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.value.trim()) {
                                            const newMessage = e.currentTarget.value;
                                            setClientMessages(prev => ({
                                                ...prev,
                                                [selectedHistoryClient]: [
                                                    ...prev[selectedHistoryClient],
                                                    { role: "client", message: newMessage, timestamp: new Date() }
                                                ]
                                            }));
                                            e.currentTarget.value = "";
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
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
