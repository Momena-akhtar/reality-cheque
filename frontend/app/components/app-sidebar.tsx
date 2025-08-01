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
import { ChevronRight, ChevronDown, ExternalLink, X, Loader2 } from "lucide-react"
import { useSidebar } from "./ui/sidebar"
import { Button } from "./ui/button"
import { useAIModels } from "../hooks/useAIModels"
import { useRouter } from "next/navigation"

export function AppSidebar() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const { isMobile, setOpenMobile } = useSidebar()
  const { sidebarData, loading, error } = useAIModels()
  const router = useRouter()

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
    </Sidebar>
  )
}
