"use client"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/app/components/ui/sidebar"
import Logo from "./ui/logo"
import { ChevronRight, ChevronDown, ExternalLink, X, Loader2, Activity } from "lucide-react"
import { useSidebar } from "./ui/sidebar"
import { Button } from "./ui/button"
import { useAIModels } from "../hooks/useAIModels"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/AuthContext"

interface TokenInfo {
  totalTokens: number;
  usedTokens: number;
  remainingTokens: number;
  usagePercentage: number;
  remainingCreditsInDollars: number;
  usedCreditsInDollars: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export function AppSidebar() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    totalTokens: 1000000,
    usedTokens: 0,
    remainingTokens: 1000000,
    usagePercentage: 0,
    remainingCreditsInDollars: 10,
    usedCreditsInDollars: 0
  })
  const { isMobile, setOpenMobile } = useSidebar()
  const { sidebarData, loading, error } = useAIModels()
  const { user } = useAuth()
  const router = useRouter()

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const CircularProgress = ({ percentage, size = 24, strokeWidth = 2 }: { percentage: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={percentage > 80 ? "#ef4444" : percentage > 60 ? "#f59e0b" : "#10b981"}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
      </div>
    );
  };

  const fetchTokenInfo = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE}/user/token-info`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTokenInfo(data);
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTokenInfo();
    }
  }, [user]);

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const handleModelClick = (modelId: string) => {
    router.push(`/chat?id=${modelId}`);
  }

  if (loading) {
    return (
      <Sidebar className="border-r border-border scrollbar-hide">
        <SidebarContent className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading tools...</span>
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  if (error) {
    return (
      <Sidebar className="border-r border-border scrollbar-hide">
        <SidebarContent className="flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Failed to load tools</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="border-r border-border scrollbar-hide">
      {isMobile && (
        <SidebarHeader>
          <div className="flex items-center justify-between px-4 py-2">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setOpenMobile(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
        </SidebarHeader>
      )}
      <SidebarContent className="overflow-y-auto scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupLabel className="mt-1">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            {sidebarData.map((section, index) => (
              <div key={section._id || index} className="px-4">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full text-left py-2 cursor-pointer font-medium rounded-md transition-all duration-200 hover:translate-x-1 flex items-center justify-between group"
                >
                  <span className="transition-colors duration-200">
                    {section.title}
                  </span>
                  {openSections[section.title] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {openSections[section.title] && (
                  <ul className="ml-4 text-sm text-muted-foreground space-y-1 mt-1">
                    {section.children.map((child, i) => (
                      <button
                        key={i}
                        onClick={() => handleModelClick(child._id)}
                        className="w-full text-left py-1.5 px-2 text-sm rounded-md transition-all duration-200 hover:translate-x-1 flex items-center justify-between group cursor-pointer hover:bg-muted/50"
                      >
                        <span className="group-hover:text-foreground transition-colors duration-200">
                          {child.name}
                        </span>
                        <ChevronRight className="h-3 w-3 transition-colors duration-200" />
                      </button>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter className="border-t border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-text-faded" />
              <span className="text-primary-text-faded">Tokens Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium">{formatNumber(tokenInfo.remainingTokens)}</div>
                <div className="text-xs text-primary-text-faded">
                  of {formatNumber(tokenInfo.totalTokens)}
                </div>
              </div>
              <CircularProgress percentage={tokenInfo.usagePercentage} />
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
