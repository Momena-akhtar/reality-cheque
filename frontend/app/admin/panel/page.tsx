"use client";

import { useState, useEffect, useRef } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import {
    BarChart3,
    Users,
    MessageSquare,
    CreditCard,
    Settings,
    Plus,
    Edit,
    Trash2,
    Activity,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertCircle,
    Info,
    Bot,
    History,
    Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

interface AIModel {
    _id: string;
    name: string;
    description: string;
    categoryId: {
        _id: string;
        name: string;
    };
    masterPrompt: string;
    featureIds: Feature[];
    isActive: boolean;
    inputCostPer1KTokens: number;
    outputCostPer1KTokens: number;
    createdAt: string;
    updatedAt: string;
}

interface Feature {
    _id: string;
    name: string;
    description: string;
    prompt: string;
    order: number;
    isOptional: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ChatSession {
    _id: string;
    userId?: {
        _id: string;
        username: string;
        email: string;
    } | null;
    modelId?: {
        _id: string;
        name: string;
        description: string;
    } | null;
    title: string;
    totalTokens: number;
    messageCount: number;
    lastActivity: string;
    createdAt: string;
}

interface ChatMessage {
    _id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    tokenCount: number;
}

interface ChatDetails {
    chat: ChatSession & {
        userId?: {
            _id: string;
            username: string;
            email: string;
        } | null;
    };
    messages: ChatMessage[];
}

interface Voucher {
    _id: string;
    code: string;
    tier: 1 | 2 | 3;
    credits: number;
    maxUses: number;
    usedCount: number;
    usedBy: string[];
    isActive: boolean;
    description?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: {
        _id: string;
        username: string;
        email: string;
    };
}

interface Stats {
    totalUsers: number;
    totalChats: number;
    totalMessages: number;
    revenue: number;
    activeUsers: number;
    newUsersThisMonth: number;
}

interface RecentActivity {
    type: "user_registered" | "chat_started" | "message_sent";
    title: string;
    description: string;
    timestamp: string;
    user?: {
        username: string;
        email: string;
    };
    model?: {
        name: string;
    };
    tokens?: number;
}

// Helper function to format message content
const formatMessageContent = (content: string, role: "user" | "assistant") => {
    if (role === "user") {
        return content;
    }

    console.log(content);

    // Check if content starts with ```json and ends with ```
    if (content.startsWith("```json") && content.endsWith("```")) {
        try {
            // Remove the ```json and ``` markers
            const jsonContent = content.slice(7, -3).trim();

            // Parse the JSON
            const parsedContent = JSON.parse(jsonContent);

            // Generate HTML based on the JSON structure
            let html = '<div class="formatted-content">';

            // Get all keys and sort them for consistent ordering, then reverse to put important fields first
            const keys = Object.keys(parsedContent).sort().reverse();

            keys.forEach((key) => {
                const value = parsedContent[key];

                if (value) {
                    let processedValue = value;

                    // Handle both string and array cases
                    if (Array.isArray(processedValue)) {
                        processedValue = processedValue.join("<br>");
                    } else if (typeof processedValue === "string") {
                        // Format numbered lists
                        processedValue = processedValue.replace(
                            /(\d+\.\s*[^,]+)(?:,(\d+\.\s*[^,]+))+/g,
                            function (match: string) {
                                return match.split(/,(?=\d+\.)/).join("<br>");
                            }
                        );
                    }

                    // Determine styling based on key name or content length
                    if (
                        key.toLowerCase().includes("headline") ||
                        key.toLowerCase().includes("title")
                    ) {
                        html += `<h1 class="text-2xl font-bold mb-4">${processedValue}</h1>`;
                    } else if (
                        key.toLowerCase().includes("subheadline") ||
                        key.toLowerCase().includes("preview")
                    ) {
                        html += `<h2 class="text-lg font-semibold mb-6">${processedValue}</h2>`;
                    } else if (
                        key.toLowerCase().includes("cta") ||
                        key.toLowerCase().includes("button")
                    ) {
                        html += `<div class="pounded-lg inline-block font-semibold mb-6">${processedValue}</div>`;
                    } else if (
                        key.toLowerCase().includes("follow") ||
                        key.toLowerCase().includes("question")
                    ) {
                        html += `<div class="mb-6"><h3 class="text-xl font-semibold mb-3">${key}</h3><p class="leading-relaxed whitespace-pre-line">${processedValue}</p></div>`;
                    } else {
                        // Default styling for other fields
                        html += `<div class="mb-6"><h3 class="text-xl font-semibold mb-3">${key}</h3><p class="leading-relaxed whitespace-pre-line">${processedValue}</p></div>`;
                    }
                }
            });

            html += "</div>";
            return html;
        } catch (error) {
            console.error("Error parsing JSON content:", error);
            return content;
        }
    }

    // Handle regular text with markdown-style formatting
    let formattedContent = content;

    // Replace **text** with <strong>text</strong> for bold formatting
    formattedContent = formattedContent.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Replace --- with <br> for line breaks
    formattedContent = formattedContent.replace(/---/g, "<br>");

    // Format numbered lists - detect patterns like "1. text,2. text,3. text"
    formattedContent = formattedContent.replace(
        /(\d+\.\s*[^,]+)(?:,(\d+\.\s*[^,]+))+/g,
        function (match: string) {
            // Split by comma and number pattern
            return match.split(/,(?=\d+\.)/).join("<br>");
        }
    );

    // Add line breaks before numbered items and after regular sentences
    formattedContent = formattedContent.replace(/\s(\d+)\.\s/g, "<br>$1. ");
    formattedContent = formattedContent.replace(/([^0-9])\.\s/g, "$1.<br>");

    // Wrap in a div for consistent styling
    return `<div class="formatted-content">${formattedContent}</div>`;
};

export default function AdminPanel() {
    const { admin, adminLogout, adminLoading } = useAdminAuth();
    const [sessionWarning, setSessionWarning] = useState(false);
    const [showSessionTooltip, setShowSessionTooltip] = useState(false);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [activeTab, setActiveTab] = useState<
        "stats" | "prompts" | "chats" | "vouchers"
    >("stats");
    const [stats, setStats] = useState<Stats | null>(null);
    const [models, setModels] = useState<AIModel[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const router = useRouter();

    const [modelForm, setModelForm] = useState({
        masterPrompt: "",
    });

    const [featureForm, setFeatureForm] = useState({
        name: "",
        description: "",
        prompt: "",
        order: 0,
        isOptional: false,
    });

    const [voucherForm, setVoucherForm] = useState({
        code: "",
        tier: 1 as 1 | 2 | 3,
        credits: 10, // Default to Tier 1 credits ($10)
        maxUses: 100,
        description: "",
        isActive: true,
    });

    useEffect(() => {
        if (admin) {
            fetchData();

            const adminToken = localStorage.getItem("adminToken");
            if (adminToken) {
                try {
                    const tokenData = JSON.parse(
                        atob(adminToken.split(".")[1])
                    );
                    const currentTime = Math.floor(Date.now() / 1000);
                    const timeUntilExpiry = tokenData.exp - currentTime;
                    const warningTime = timeUntilExpiry - 300; // 5 minutes before expiry

                    if (warningTime > 0) {
                        warningTimeoutRef.current = setTimeout(() => {
                            setSessionWarning(true);
                            toast.warning(
                                "Admin session will expire in 5 minutes. Please save your work."
                            );
                        }, warningTime * 1000);
                    }
                } catch (_error) {
                    console.error("Error parsing admin token:", _error);
                }
            }
        }

        return () => {
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
        };
    }, [admin]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                toast.error("Admin token not found");
                return;
            }

            const headers = {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            };

            const [
                statsRes,
                modelsRes,
                featuresRes,
                chatsRes,
                vouchersRes,
                dashboardStatsRes,
                recentActivityRes,
            ] = await Promise.all([
                fetch(`${API_BASE}/admin/stats`, { headers }),
                fetch(`${API_BASE}/admin/models`, { headers }),
                fetch(`${API_BASE}/admin/features`, { headers }),
                fetch(`${API_BASE}/admin/chats`, { headers }),
                fetch(`${API_BASE}/admin/vouchers`, { headers }),
                fetch(`${API_BASE}/admin/dashboard-stats`, { headers }),
                fetch(`${API_BASE}/admin/recent-activity`, { headers }),
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (modelsRes.ok) {
                const modelsData = await modelsRes.json();
                setModels(modelsData);
            }

            if (featuresRes.ok) {
                const featuresData = await featuresRes.json();
                setFeatures(featuresData);
            }

            if (chatsRes.ok) {
                const chatsData = await chatsRes.json();
                setChats(chatsData.chats || []);
            }

            if (vouchersRes.ok) {
                const vouchersData = await vouchersRes.json();
                setVouchers(vouchersData);
            }

            if (dashboardStatsRes.ok) {
                const dashboardStatsData = await dashboardStatsRes.json();
                setStats(dashboardStatsData);
            }

            // Store recent activity for later use
            if (recentActivityRes.ok) {
                const recentActivityData = await recentActivityRes.json();
                setRecentActivity(recentActivityData);
            }
        } catch (_error) {
            console.error("Error fetching data:", _error);
            toast.error("Failed to load admin data");
        } finally {
            setLoading(false);
        }
    };

    const handleModelPromptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                toast.error("Admin token not found");
                return;
            }

            const res = await fetch(`${API_BASE}/admin/models/prompt`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify({
                    modelId: editingModel?._id,
                    masterPrompt: modelForm.masterPrompt,
                }),
            });

            if (res.ok) {
                toast.success("Model prompt updated!");
                setShowPromptModal(false);
                setEditingModel(null);
                setModelForm({ masterPrompt: "" });
                fetchData();
            } else {
                toast.error("Failed to update model prompt");
            }
        } catch (_error) {
            toast.error("Network error");
        }
    };

    const handleFeatureSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                toast.error("Admin token not found");
                return;
            }

            const url = editingFeature
                ? `${API_BASE}/admin/features/${editingFeature._id}`
                : `${API_BASE}/admin/features`;

            const method = editingFeature ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(featureForm),
            });

            if (res.ok) {
                toast.success(
                    editingFeature ? "Feature updated!" : "Feature created!"
                );
                setShowPromptModal(false);
                setEditingFeature(null);
                setFeatureForm({
                    name: "",
                    description: "",
                    prompt: "",
                    order: 0,
                    isOptional: false,
                });
                fetchData();
            } else {
                toast.error("Failed to save feature");
            }
        } catch (_error) {
            toast.error("Network error");
        }
    };

    const deleteFeature = async (featureId: string) => {
        if (!confirm("Are you sure you want to delete this feature?")) return;

        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                toast.error("Admin token not found");
                return;
            }

            const res = await fetch(`${API_BASE}/admin/features/${featureId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            if (res.ok) {
                toast.success("Feature deleted!");
                fetchData();
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Failed to delete feature");
            }
        } catch (_error) {
            toast.error("Network error");
        }
    };

    const viewChatDetails = async (chatId: string) => {
        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                toast.error("Admin token not found");
                return;
            }

            const res = await fetch(`${API_BASE}/admin/chats/${chatId}`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setChatDetails(data);
                setShowChatModal(true);
            } else {
                toast.error("Failed to fetch chat details");
            }
        } catch (_error) {
            toast.error("Network error");
        }
    };

    const handleVoucherSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                toast.error("Admin token not found");
                return;
            }

            const url = editingVoucher
                ? `${API_BASE}/admin/vouchers/${editingVoucher._id}`
                : `${API_BASE}/admin/vouchers`;

            const method = editingVoucher ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(voucherForm),
            });

            if (res.ok) {
                toast.success(
                    editingVoucher
                        ? "Voucher updated Successfully!"
                        : "Voucher created Successfully!"
                );
                setShowVoucherModal(false);
                setEditingVoucher(null);
                setVoucherForm({
                    code: "",
                    tier: 1,
                    credits: 10,
                    maxUses: 100,
                    description: "",
                    isActive: true,
                });
                fetchData();
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Failed to save voucher");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const [showDeleteVoucherModal, setShowDeleteVoucherModal] = useState(false);
    const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(
        null
    );

    const deleteVoucher = async (id: string) => {
        const voucher = vouchers.find((v) => v._id === id);
        if (voucher) {
            setVoucherToDelete(voucher);
            setShowDeleteVoucherModal(true);
        }
    };

    const confirmDeleteVoucher = async () => {
        if (!voucherToDelete) return;

        try {
            const adminToken = localStorage.getItem("adminToken");
            if (!adminToken) {
                toast.error("Admin token not found");
                return;
            }

            const res = await fetch(
                `${API_BASE}/admin/vouchers/${voucherToDelete._id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                    },
                }
            );

            if (res.ok) {
                toast.success("Voucher deleted!");
                fetchData();
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Failed to delete voucher");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setShowDeleteVoucherModal(false);
            setVoucherToDelete(null);
        }
    };

    const cancelDeleteVoucher = () => {
        setShowDeleteVoucherModal(false);
        setVoucherToDelete(null);
    };

    const editVoucher = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        setVoucherForm({
            code: voucher.code,
            tier: voucher.tier,
            credits: voucher.credits,
            maxUses: voucher.maxUses,
            description: voucher.description || "",
            isActive: voucher.isActive,
        });
        setShowVoucherModal(true);
    };

    useEffect(() => {
        if (!adminLoading && !admin) {
            router.push("/admin");
        }
    }, [admin, adminLoading, router]);

    if (adminLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
                    <p className="text-primary-text-faded">
                        Loading admin panel...
                    </p>
                </div>
            </div>
        );
    }
    if (!admin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Session Warning Banner */}
            {sessionWarning && (
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                                Admin session will expire in 5 minutes. Please
                                save your work.
                            </span>
                        </div>
                        <button
                            onClick={() => setSessionWarning(false)}
                            className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-foreground mr-2 sm:mr-3" />
                            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                                Admin Panel
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <span className="hidden sm:block text-sm text-primary-text-faded">
                                Welcome, {admin?.email}
                            </span>
                            <div className="hidden sm:flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-primary-text-faded">
                                    Session Active
                                </span>
                                <div
                                    className="relative"
                                    onMouseEnter={() =>
                                        setShowSessionTooltip(true)
                                    }
                                    onMouseLeave={() =>
                                        setShowSessionTooltip(false)
                                    }
                                >
                                    <Info className="w-3 h-3 cursor-pointer text-primary-text-faded hover:text-foreground transition-colors" />
                                    {showSessionTooltip && (
                                        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg text-xs text-primary-text-faded whitespace-nowrap z-10">
                                            Admin session expires in 30 minutes
                                            for security. Token will
                                            auto-refresh when needed.
                                            <div className="absolute bottom-full right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-border"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={adminLogout}
                                className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-border rounded-lg text-foreground hover:bg-primary-hover transition-colors"
                            >
                                <span className="hidden sm:inline">Logout</span>
                                <span className="sm:hidden">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex justify-center sm:justify-start space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
                        {[
                            {
                                id: "stats",
                                label: "Dashboard",
                                icon: BarChart3,
                            },
                            {
                                id: "prompts",
                                label: "AI Models & Features",
                                icon: Bot,
                            },
                            {
                                id: "chats",
                                label: "Chat History",
                                icon: History,
                            },
                            {
                                id: "vouchers",
                                label: "Vouchers",
                                icon: CreditCard,
                            },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors min-w-[60px] sm:min-w-0 ${
                                        activeTab === tab.id
                                            ? "border-foreground text-foreground"
                                            : "border-transparent text-primary-text-faded hover:text-foreground hover:border-border"
                                    }`}
                                >
                                    <Icon className="w-4 h-4 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden text-center">{tab.label.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {activeTab === "stats" && (
                    <div className="space-y-4 sm:space-y-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">
                            Dashboard Overview
                        </h2>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:bg-card-hover transition-colors">
                                <div className="flex items-center justify-center sm:justify-start">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                                    </div>
                                    <div className="ml-3 sm:ml-4 text-center sm:text-left">
                                        <p className="text-xs sm:text-sm font-medium text-primary-text-faded">
                                            Total Users
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold text-foreground">
                                            {stats?.totalUsers || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:bg-card-hover transition-colors">
                                <div className="flex items-center justify-center sm:justify-start">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                    </div>
                                    <div className="ml-3 sm:ml-4 text-center sm:text-left">
                                        <p className="text-xs sm:text-sm font-medium text-primary-text-faded">
                                            Total Chats
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold text-foreground">
                                            {stats?.totalChats || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:bg-card-hover transition-colors">
                                <div className="flex items-center justify-center sm:justify-start">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                                    </div>
                                    <div className="ml-3 sm:ml-4 text-center sm:text-left">
                                        <p className="text-xs sm:text-sm font-medium text-primary-text-faded">
                                            Active Users
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold text-foreground">
                                            {stats?.activeUsers || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:bg-card-hover transition-colors">
                                <div className="flex items-center justify-center sm:justify-start">
                                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                                    </div>
                                    <div className="ml-3 sm:ml-4 text-center sm:text-left">
                                        <p className="text-xs sm:text-sm font-medium text-primary-text-faded">
                                            Revenue
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold text-foreground">
                                            ${stats?.revenue || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                                    Recent Activity
                                </h3>
                                <div className="space-y-3 sm:space-y-4">
                                    {recentActivity.length > 0 ? (
                                        recentActivity
                                            .slice(0, 5)
                                            .map((activity, index) => {
                                                const getActivityIcon = () => {
                                                    switch (activity.type) {
                                                        case "user_registered":
                                                            return (
                                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            );
                                                        case "chat_started":
                                                            return (
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            );
                                                        case "message_sent":
                                                            return (
                                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                            );
                                                        default:
                                                            return (
                                                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                            );
                                                    }
                                                };

                                                const formatTimeAgo = (
                                                    timestamp: string
                                                ) => {
                                                    const now = new Date();
                                                    const time = new Date(
                                                        timestamp
                                                    );
                                                    const diffInMinutes =
                                                        Math.floor(
                                                            (now.getTime() -
                                                                time.getTime()) /
                                                                (1000 * 60)
                                                        );

                                                    if (diffInMinutes < 1)
                                                        return "Just now";
                                                    if (diffInMinutes < 60)
                                                        return `${diffInMinutes}m ago`;
                                                    if (diffInMinutes < 1440)
                                                        return `${Math.floor(
                                                            diffInMinutes / 60
                                                        )}h ago`;
                                                    return `${Math.floor(
                                                        diffInMinutes / 1440
                                                    )}d ago`;
                                                };

                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center space-x-3"
                                                    >
                                                        {getActivityIcon()}
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs sm:text-sm text-foreground block truncate">
                                                                {activity.title}
                                                            </span>
                                                            {activity.description && (
                                                                <p className="text-xs text-primary-text-faded truncate">
                                                                    {
                                                                        activity.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-primary-text-faded ml-2 flex-shrink-0">
                                                            {formatTimeAgo(
                                                                activity.timestamp
                                                            )}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="text-center py-4 text-primary-text-faded">
                                            <p className="text-sm">
                                                No recent activity
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                                    Quick Actions
                                </h3>
                                <div className="space-y-2 sm:space-y-3">
                                    <button
                                        onClick={() => setActiveTab("prompts")}
                                        className="w-full cursor-pointer text-left p-2 sm:p-3 border border-border rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                                            <span className="text-sm sm:text-base text-foreground">
                                                Manage Prompts
                                            </span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("vouchers")}
                                        className="w-full cursor-pointer text-left p-2 sm:p-3 border border-border rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                                            <span className="text-sm sm:text-base text-foreground">
                                                Create Voucher
                                            </span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("chats")}
                                        className="w-full cursor-pointer text-left p-2 sm:p-3 border border-border rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                                            <History className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                                            <span className="text-sm sm:text-base text-foreground">
                                                View Chat History
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "prompts" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">
                                AI Models & Features
                            </h2>
                            <button
                                onClick={() => {
                                    setEditingFeature(null);
                                    setFeatureForm({
                                        name: "",
                                        description: "",
                                        prompt: "",
                                        order: 0,
                                        isOptional: false,
                                    });
                                    setShowPromptModal(true);
                                }}
                                className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-border text-foreground cursor-pointer rounded-lg hover:bg-primary-hover transition-colors w-full sm:w-auto justify-center"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm sm:text-base">Add Feature</span>
                            </button>
                        </div>

                        {/* Models Section */}
                        <div className="space-y-4">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground text-center sm:text-left">
                                AI Models
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {models.map((model) => (
                                    <div
                                        key={model._id}
                                        className="bg-card border border-border rounded-lg p-4 hover:bg-card-hover transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-foreground text-sm sm:text-base">
                                                    {model.name}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-primary-text-faded">
                                                    {model.categoryId.name}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                                                    model.isActive
                                                        ? "bg-green-700/20 border border-green-700 text-foreground"
                                                        : "bg-red-700/20 border border-red-700 text-foreground"
                                                }`}
                                            >
                                                {model.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-foreground mb-3 line-clamp-2">
                                            {model.description}
                                        </p>
                                        <div className="space-y-2">
                                            <div className="text-xs text-primary-text-faded">
                                                <strong>Master Prompt:</strong>
                                                <div className="mt-1 p-2 bg-muted rounded text-xs font-mono line-clamp-3">
                                                    {model.masterPrompt}
                                                </div>
                                            </div>
                                            <div className="text-xs text-primary-text-faded">
                                                <strong>Features:</strong>{" "}
                                                {model.featureIds.length}
                                            </div>
                                            <div className="text-xs text-primary-text-faded">
                                                <strong>Cost:</strong> $
                                                {model.inputCostPer1KTokens}/1K
                                                input, $
                                                {model.outputCostPer1KTokens}/1K
                                                output
                                            </div>
                                        </div>
                                        <div className="mt-3 flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setEditingModel(model);
                                                    setModelForm({
                                                        masterPrompt:
                                                            model.masterPrompt,
                                                    });
                                                    setShowPromptModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 cursor-pointer text-sm"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Features Section */}
                        <div className="space-y-4">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground text-center sm:text-left">
                                Features
                            </h3>
                            <div className="bg-card border border-border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-primary border-b border-border">
                                            <tr>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                    Order
                                                </th>
                                                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                    Optional
                                                </th>
                                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {features.map((feature) => (
                                                <tr
                                                    key={feature._id}
                                                    className="hover:bg-primary-hover transition-colors"
                                                >
                                                    <td className="px-3 sm:px-6 py-4">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {feature.name}
                                                        </div>
                                                        <div className="sm:hidden text-xs text-primary-text-faded mt-1">
                                                            {feature.description}
                                                        </div>
                                                        <div className="sm:hidden flex items-center space-x-2 mt-1">
                                                            <span className="text-xs text-primary-text-faded">
                                                                Order: {feature.order}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                feature.isOptional
                                                                    ? "bg-blue-700/20 text-foreground border border-blue-700"
                                                                    : "bg-red-700/20 border border-red-700 text-foreground"
                                                            }`}>
                                                                {feature.isOptional ? "Optional" : "Required"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="hidden sm:table-cell px-6 py-4">
                                                        <div className="text-sm text-primary-text-faded max-w-xs truncate">
                                                            {feature.description}
                                                        </div>
                                                    </td>
                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                        {feature.order}
                                                    </td>
                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                        {feature.isOptional ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-700/20 text-foreground border border-blue-700">
                                                                Yes
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-700/20 border border-red-700 text-foreground">
                                                                No
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingFeature(
                                                                        feature
                                                                    );
                                                                    setFeatureForm(
                                                                        {
                                                                            name: feature.name,
                                                                            description:
                                                                                feature.description,
                                                                            prompt: feature.prompt,
                                                                            order: feature.order,
                                                                            isOptional:
                                                                                feature.isOptional,
                                                                        }
                                                                    );
                                                                    setShowPromptModal(
                                                                        true
                                                                    );
                                                                }}
                                                                className="p-2 text-blue-600 cursor-pointer hover:text-blue-900"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    deleteFeature(
                                                                        feature._id
                                                                    )
                                                                }
                                                                className="p-2 text-red-600 cursor-pointer hover:text-red-900"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "chats" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">
                                Chat History
                            </h2>
                        </div>

                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-primary border-b border-border">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Model
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Messages
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Tokens
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Last Activity
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {chats.map((chat) => (
                                            <tr
                                                key={chat._id}
                                                className="hover:bg-primary-hover transition-colors"
                                            >
                                                <td className="px-3 sm:px-6 py-4">
                                                    {chat.userId ? (
                                                        <>
                                                            <div className="text-sm font-medium text-foreground">
                                                                {chat.userId.username}
                                                            </div>
                                                            <div className="text-xs text-primary-text-faded">
                                                                {chat.userId.email}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-primary-text-faded italic">
                                                            Anonymous User
                                                        </div>
                                                    )}
                                                    <div className="sm:hidden text-xs text-primary-text-faded mt-1">
                                                        {chat.title}
                                                    </div>
                                                    <div className="sm:hidden flex items-center space-x-2 mt-1">
                                                        <span className="text-xs text-primary-text-faded">
                                                            Messages: {chat.messageCount}
                                                        </span>
                                                        <span className="text-xs text-primary-text-faded">
                                                            Tokens: {chat.totalTokens}
                                                        </span>
                                                    </div>
                                                    <div className="sm:hidden text-xs text-primary-text-faded mt-1">
                                                        {new Date(chat.lastActivity).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4">
                                                    <div className="text-sm text-foreground max-w-xs truncate">
                                                        {chat.title}
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                    {chat.messageCount}
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                    {chat.totalTokens}
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-primary-text-faded">
                                                    {new Date(chat.lastActivity).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            viewChatDetails(chat._id)
                                                        }
                                                        className="text-blue-600 cursor-pointer hover:text-blue-900"
                                                        title="View Chat Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "vouchers" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">
                                Manage Vouchers
                            </h2>
                            <button
                                onClick={() => {
                                    setEditingVoucher(null);
                                    setVoucherForm({
                                        code: "",
                                        tier: 1,
                                        credits: 10,
                                        maxUses: 100,
                                        description: "",
                                        isActive: true,
                                    });
                                    setShowVoucherModal(true);
                                }}
                                className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-border text-foreground cursor-pointer rounded-lg hover:bg-primary-hover transition-colors w-full sm:w-auto justify-center"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm sm:text-base">Add Voucher</span>
                            </button>
                        </div>

                        <div className="bg-card border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-primary border-b border-border">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Value
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Usage
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Expiry
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Tier
                                            </th>
                                            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-primary-text-faded uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {vouchers.map((voucher) => (
                                            <tr
                                                key={voucher._id}
                                                className="hover:bg-primary-hover transition-colors"
                                            >
                                                <td className="px-3 sm:px-6 py-4">
                                                    <div className="text-sm font-medium text-foreground">
                                                        {voucher.code}
                                                    </div>
                                                    {voucher.description && (
                                                        <div className="text-xs text-primary-text-faded truncate max-w-xs">
                                                            {voucher.description}
                                                        </div>
                                                    )}
                                                    <div className="sm:hidden flex items-center space-x-2 mt-1">
                                                        <span className="text-xs text-primary-text-faded">
                                                            Tier {voucher.tier} - ${voucher.credits} credits
                                                        </span>
                                                    </div>
                                                    <div className="sm:hidden flex items-center space-x-2 mt-1">
                                                        <span className="text-xs text-primary-text-faded">
                                                            Usage: {voucher.usedCount} / {voucher.maxUses}
                                                        </span>
                                                    </div>
                                                    <div className="sm:hidden flex items-center space-x-2 mt-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            voucher.isActive
                                                                ? "bg-green-700/20 border border-green-700 text-foreground"
                                                                : "bg-red-700/20 border border-red-700 text-foreground"
                                                        }`}>
                                                            {voucher.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                    <div>
                                                        Tier {voucher.tier} - ${voucher.credits} credits
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                    {voucher.usedCount} / {voucher.maxUses}
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-primary-text-faded">
                                                    -
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                    <div className="flex flex-wrap gap-1">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-700/20 text-foreground border border-green-700">
                                                            Tier {voucher.tier}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                                                    {voucher.isActive ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-700/20 border border-green-700 text-foreground">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-700/20 border border-red-700 text-foreground">
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                editVoucher(voucher)
                                                            }
                                                            className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                deleteVoucher(voucher._id)
                                                            }
                                                            className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Model/Feature Modal */}
            {showPromptModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
                    <div className="bg-background border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-foreground">
                                {editingModel
                                    ? "Edit Model Prompt"
                                    : editingFeature
                                    ? editingFeature._id
                                        ? "Edit Feature"
                                        : "Add New Feature"
                                    : "Add New Feature"}
                            </h3>
                            <button
                                onClick={() => setShowPromptModal(false)}
                                className="text-primary-text-faded hover:text-foreground cursor-pointer"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {editingModel ? (
                            <form
                                onSubmit={handleModelPromptSubmit}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Model: {editingModel.name}
                                    </label>
                                    <div className="text-sm text-primary-text-faded mb-4">
                                        {editingModel.description}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Master Prompt
                                    </label>
                                    <textarea
                                        value={modelForm.masterPrompt}
                                        onChange={(e) =>
                                            setModelForm({
                                                ...modelForm,
                                                masterPrompt: e.target.value,
                                            })
                                        }
                                        rows={8}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover font-mono text-sm"
                                        required
                                        placeholder="Enter the master prompt for this AI model..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPromptModal(false)
                                        }
                                        className="px-4 py-2 border border-border cursor-pointer rounded-lg text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-foreground border border-border cursor-pointer rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        Update Model Prompt
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form
                                onSubmit={handleFeatureSubmit}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Feature Name
                                        </label>
                                        <input
                                            type="text"
                                            value={featureForm.name}
                                            onChange={(e) =>
                                                setFeatureForm({
                                                    ...featureForm,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                            required
                                            placeholder="e.g., Code Generation, Text Analysis"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Order
                                        </label>
                                        <input
                                            type="number"
                                            value={featureForm.order}
                                            onChange={(e) =>
                                                setFeatureForm({
                                                    ...featureForm,
                                                    order: Number(
                                                        e.target.value
                                                    ),
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={featureForm.description}
                                        onChange={(e) =>
                                            setFeatureForm({
                                                ...featureForm,
                                                description: e.target.value,
                                            })
                                        }
                                        rows={3}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                        required
                                        placeholder="Describe what this feature does..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Feature Prompt
                                    </label>
                                    <textarea
                                        value={featureForm.prompt}
                                        onChange={(e) =>
                                            setFeatureForm({
                                                ...featureForm,
                                                prompt: e.target.value,
                                            })
                                        }
                                        rows={6}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary-hover focus:ring-1 focus:ring-primary-hover font-mono text-sm"
                                        required
                                        placeholder="Enter the prompt for this feature..."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isOptional"
                                        checked={featureForm.isOptional}
                                        onChange={(e) =>
                                            setFeatureForm({
                                                ...featureForm,
                                                isOptional: e.target.checked,
                                            })
                                        }
                                        className="mr-2"
                                    />
                                    <label
                                        htmlFor="isOptional"
                                        className="text-sm text-foreground"
                                    >
                                        Optional Feature
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPromptModal(false)
                                        }
                                        className="px-4 py-2 border border-border cursor-pointer rounded-lg text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-foreground border border-border cursor-pointer rounded-lg hover:bg-primary-hover transition-colors"
                                    >
                                        {editingFeature
                                            ? editingFeature._id
                                                ? "Update Feature"
                                                : "Create Feature"
                                            : "Create Feature"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Voucher Modal */}
            {showVoucherModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100] p-4">
                    <div className="bg-background border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-foreground">
                                {editingVoucher
                                    ? "Edit Voucher"
                                    : "Add New Voucher"}
                            </h3>
                            <button
                                onClick={() => setShowVoucherModal(false)}
                                className="text-primary-text-faded hover:text-foreground cursor-pointer"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleVoucherSubmit}
                            className="space-y-6"
                        >
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Code (6-8 characters, letters & numbers)
                                    </label>
                                    <input
                                        type="text"
                                        value={voucherForm.code}
                                        onChange={(e) =>
                                            setVoucherForm({
                                                ...voucherForm,
                                                code: e.target.value.toUpperCase(),
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                                        placeholder="e.g., SAVE20 or WELCOME50"
                                        maxLength={8}
                                        pattern="[A-Z0-9]*"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={voucherForm.description}
                                        onChange={(e) =>
                                            setVoucherForm({
                                                ...voucherForm,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                                        placeholder="Optional description"
                                    />
                                </div>
                            </div>

                            {/* Voucher Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Tier
                                    </label>
                                    <select
                                        value={voucherForm.tier}
                                        onChange={(e) => {
                                            const tier = Number(
                                                e.target.value
                                            ) as 1 | 2 | 3;
                                            const credits = tier === 1 ? 10 : tier === 2 ? 20 : 50;
                                            setVoucherForm({
                                                ...voucherForm,
                                                tier,
                                                credits,
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                                    >
                                        <option value={1}>
                                            Tier 1 - $10 credits
                                        </option>
                                        <option value={2}>
                                            Tier 2 - $20 credits
                                        </option>
                                        <option value={3}>
                                            Tier 3 - $50 credits
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Credits
                                    </label>
                                    <input
                                        type="number"
                                        value={voucherForm.credits}
                                        disabled
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                                        required
                                        min="10"
                                        max="50"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Credits automatically match the tier ($10/$20/$50)
                                    </p>
                                </div>
                            </div>

                            {/* Usage Limits */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Max Uses
                                </label>
                                <input
                                    type="number"
                                    value={
                                        voucherForm.maxUses === 0
                                            ? ""
                                            : voucherForm.maxUses
                                    }
                                    onChange={(e) => {
                                        const inputValue = e.target.value;
                                        const numValue =
                                            inputValue === ""
                                                ? 0
                                                : Number(inputValue);
                                        setVoucherForm({
                                            ...voucherForm,
                                            maxUses: numValue,
                                        });
                                    }}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-hover"
                                    required
                                    min="1"
                                    placeholder="e.g., 100"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="voucherActive"
                                        checked={voucherForm.isActive}
                                        onChange={(e) =>
                                            setVoucherForm({
                                                ...voucherForm,
                                                isActive: e.target.checked,
                                            })
                                        }
                                        className="mr-2"
                                    />
                                    <label
                                        htmlFor="voucherActive"
                                        className="text-sm text-foreground"
                                    >
                                        Active
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowVoucherModal(false)}
                                    className="px-4 py-2 border border-border cursor-pointer rounded-lg text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-border cursor-pointer rounded-lg text-foreground hover:bg-primary-hover transition-colors"
                                >
                                    {editingVoucher ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Voucher Confirmation Modal */}
            {showDeleteVoucherModal && voucherToDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
                    <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    Delete Voucher
                                </h3>
                                <p className="text-sm text-primary-text-faded">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-foreground mb-2">
                                Are you sure you want to delete the voucher{" "}
                                <span className="font-semibold">
                                    {voucherToDelete.code}
                                </span>
                                ?
                            </p>
                            <div className="bg-card border border-border rounded-lg p-3">
                                <div className="text-xs text-primary-text-faded space-y-1">
                                    <p>
                                        <span className="font-medium">
                                            Type:
                                        </span>{" "}
                                        Tier {voucherToDelete.tier} - $
                                        {voucherToDelete.credits} credits
                                    </p>
                                    <p>
                                        <span className="font-medium">
                                            Usage:
                                        </span>{" "}
                                        {voucherToDelete.usedCount} /{" "}
                                        {voucherToDelete.maxUses}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={cancelDeleteVoucher}
                                className="flex-1 py-2 px-4 rounded-lg cursor-pointer border border-border text-foreground hover:bg-card-hover transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteVoucher}
                                className="flex-1 py-2 px-4 border border-red-600/30 hover:bg-red-600/40 cursor-pointer text-foreground rounded-lg transition-colors"
                            >
                                Delete Voucher
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Details Modal */}
            {showChatModal && chatDetails && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100] p-4">
                    <div className="bg-background border border-border rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    Chat Details
                                </h3>
                                <p className="text-sm text-primary-text-faded">
                                    {chatDetails.chat.userId
                                        ? chatDetails.chat.userId.username
                                        : "Anonymous User"}{" "}
                                    • {chatDetails.chat.modelId ? chatDetails.chat.modelId.name : "Model Deleted"}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="text-primary-text-faded hover:text-foreground cursor-pointer"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-lg">
                            <div>
                                <h4 className="font-medium text-foreground">
                                    User
                                </h4>
                                {chatDetails.chat.userId ? (
                                    <>
                                        <p className="text-sm text-primary-text-faded">
                                            {chatDetails.chat.userId.username}
                                        </p>
                                        <p className="text-xs text-primary-text-faded">
                                            {chatDetails.chat.userId.email}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-primary-text-faded italic">
                                        Anonymous User
                                    </p>
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">
                                    Model
                                </h4>
                                {chatDetails.chat.modelId ? (
                                    <>
                                        <p className="text-sm text-primary-text-faded">
                                            {chatDetails.chat.modelId.name}
                                        </p>
                                        <p className="text-xs text-primary-text-faded">
                                            {chatDetails.chat.modelId.description}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-primary-text-faded italic">
                                        Model Deleted
                                    </p>
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">
                                    Stats
                                </h4>
                                <p className="text-sm text-primary-text-faded">
                                    {chatDetails.chat.messageCount} messages
                                </p>
                                <p className="text-xs text-primary-text-faded">
                                    {chatDetails.chat.totalTokens} tokens
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-foreground">
                                Conversation
                            </h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {chatDetails.messages.map((message, index) => (
                                    <div
                                        key={message._id}
                                        className={`p-3 rounded-lg border ${
                                            message.role === "user"
                                                ? "bg-primary text-primary-foreground border-primary/30 ml-8"
                                                : "bg-muted border-border mr-8"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-medium">
                                                {message.role === "user"
                                                    ? "User"
                                                    : "AI Assistant"}
                                            </span>
                                            <span className="text-xs text-primary-text-faded">
                                                {new Date(
                                                    message.timestamp
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            {message.role === "user" ? (
                                                message.content
                                            ) : (
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: formatMessageContent(
                                                            message.content,
                                                            message.role
                                                        ),
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="text-xs text-primary-text-faded mt-2">
                                            Tokens: {message.tokenCount}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="px-4 py-2 border border-border cursor-pointer rounded-lg text-foreground hover:bg-primary-hover transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
