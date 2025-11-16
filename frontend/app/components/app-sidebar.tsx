"use client"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/app/components/ui/sidebar"
import Logo from "./ui/logo"
import { ChevronRight, ChevronDown, ExternalLink, X, Loader2, Lock, Crown, Plus } from "lucide-react"
import { useSidebar } from "./ui/sidebar"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/AuthContext"
import { isCategoryAccessible, getTierColor } from "../utils/tier-access"
import UpgradePrompt from "./ui/upgrade-prompt"

// Custom hook to get all categories (unfiltered)
function useAllCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
       
        const response = await fetch(`${API_BASE}/ai-models/categories/all`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();        
        if (data.success) {
          setCategories(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [API_BASE]);

  return {
    categories,
    loading,
    error
  };
}

export function AppSidebar() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradePromptData, setUpgradePromptData] = useState<{
    currentTier: string;
    requiredTier: string;
  } | null>(null)
  const { isMobile, setOpenMobile } = useSidebar()
  const { categories, loading, error } = useAllCategories()
  const { user } = useAuth()
  const router = useRouter()

  // Transform categories data for sidebar
  const sidebarData = categories.map((category: any) => ({
    _id: category._id,
    title: category.name,
    tierAccess: category.tierAccess,
    children: category.models || []
  }));

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const handleModelClick = (modelId: string) => {
    router.push(`/chat?id=${modelId}`);
  }

  const handleCategoryClick = (section: any) => {
    // Check if category is locked for current user
    if (!user) {
      router.push('/signin');
      return;
    }

    if (isCategoryLocked(section.tierAccess)) {
      // Show upgrade prompt
      setUpgradePromptData({
        currentTier: user.tier || "tier1",
        requiredTier: section.tierAccess
      });
      setShowUpgradePrompt(true);
      return;
    }

    // If accessible, toggle the section
    toggleSection(section.title);
  }

  // Helper function to check if category is locked for current user
  const isCategoryLocked = (categoryTierAccess: string) => {
    if (!user) return true;
    return !isCategoryAccessible(user.tier || "tier1", categoryTierAccess);
  }

  // Show sign-in prompt for unauthenticated users
  if (!user && !loading) {
    return (
      <Sidebar className="border-r border-border scrollbar-hide">
        <SidebarContent className="flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm mb-2">Sign in to access tools</p>
            <button
              onClick={() => router.push('/signin')}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Sign In
            </button>
          </div>
        </SidebarContent>
      </Sidebar>
    )
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
    <>
      <Sidebar className="border-r border-border scrollbar-hide">
        {isMobile && (
          <SidebarHeader>
            <div className="flex items-center justify-between px-4 py-2">
              <Logo />
              <Button
                variant="outline"
                size="sm"
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

          {/* Profiles section */}
          <SidebarGroup>
            <SidebarGroupLabel className="mt-1">Profiles</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 py-2">
                <div>
                  <div className="text-sm font-bold">
                    {user?.username || user?.email || 'Profile'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/signin')}
                    className="mt-2 w-full justify-start gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    <span className="text-sm">Add profile</span>
                  </Button>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="mt-1">Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              {sidebarData.map((section, index) => (
                <div key={section._id || index} className="px-4">
                  <button
                    onClick={() => handleCategoryClick(section)}
                    className={`w-full text-left py-2 cursor-pointer font-medium rounded-md transition-all duration-200 hover:translate-x-1 flex items-center justify-between group ${
                      isCategoryLocked(section.tierAccess) ? 'opacity-60 hover:opacity-80' : ''
                    }`}
                  >
                    <span className="transition-colors duration-200">
                      {section.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {section.tierAccess && (
                        <span className={`text-xs px-1 py-0.5 rounded-lg font-medium ${getTierColor(section.tierAccess)}`}>
                          {section.tierAccess.replace('tier', 'T')}
                        </span>
                      )}
                      {isCategoryLocked(section.tierAccess) && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                      {openSections[section.title] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                  {openSections[section.title] && (
                    <ul className="ml-4 text-sm text-muted-foreground space-y-1 mt-1">
                      {section.children.map((child: any, i: number) => (
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
      </Sidebar>

      {/* Upgrade Prompt */}
      {upgradePromptData && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => {
            setShowUpgradePrompt(false);
            setUpgradePromptData(null);
          }}
          currentTier={upgradePromptData.currentTier}
          requiredTier={upgradePromptData.requiredTier}
          title="Upgrade Required"
        />
      )}
    </>
  )
}
