"use client"
import { useState, useEffect } from "react"
import { Activity, RefreshCw } from "lucide-react"
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

export function TokenUsageWidget() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    totalTokens: 1000000,
    usedTokens: 0,
    remainingTokens: 1000000,
    usagePercentage: 0,
    remainingCreditsInDollars: 10,
    usedCreditsInDollars: 0
  })
  const { user, loading: authLoading } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Convert tokens to simplified credits (1K tokens = 1 credit for display)
  const tokensToCredits = (tokens: number) => {
    return Math.floor(tokens / 1000);
  };

  const formatCredits = (credits: number) => {
    return credits.toLocaleString();
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
      setIsRefreshing(true);
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
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTokenInfo();
    }
  }, [user, user?.totalCredits, user?.usedCredits]);

  if (authLoading || !user) return null;

  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname !== '/') {
      return null;
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-text-faded" />
            <span className="text-primary-text-faded font-medium">Credits</span>
            <button
              onClick={fetchTokenInfo}
              disabled={isRefreshing}
              className="p-1 hover:bg-muted/50 cursor-pointer rounded transition-colors"
              title="Refresh credit info"
            >
              <RefreshCw className={`w-3 h-3 text-primary-text-faded ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-semibold text-foreground">{formatCredits(tokensToCredits(tokenInfo.remainingTokens))}</div>
              <div className="text-xs text-primary-text-faded">
                of {formatCredits(tokensToCredits(tokenInfo.totalTokens))}
              </div>
            </div>
            <CircularProgress percentage={tokenInfo.usagePercentage} />
          </div>
        </div>
      </div>
    </div>
  )
} 