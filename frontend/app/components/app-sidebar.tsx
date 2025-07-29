"use client"
import { useState } from "react"
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
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react"

const sidebarData = [
  {
    title: "Website Builder",
    children: [
      "Landing page copy generator",
      "VSL Script Writer",
      "SEO Meta Writer"
    ]
  },
  {
    title: "Freelancer Tools",
    children: [
      "Job Feed Filter & Bid Analyzer",
      "Proposal Builder",
      "Profile Optimizer",
      "Reply & Follow-Up Coach",
      "Niche & Rate Analyzer"
    ]
  },
  {
    title: "Fiverr Tools",
    children: [
      "Gig Builder",
      "Pricing & Package Helper",
      "Auto-Responder & Delivery Messages"
    ]
  },
  {
    title: "Offer & Pricing Builder",
    children: [
      "Ideal-Client Avatar Generator",
      "One-Sentence Value Proposition Creator",
      "Outcome-Based Offer Builder",
      "Packaging Your Transformation"
    ]
  },
  {
    title: "Cold Email Outreach",
    children: [
      "Buyer Persona",
      "First-touch email generator",
      "Follow-up sequence builder",
      "Objection handling snippets"
    ]
  },
  {
    title: "Email Marketing",
    children: [
      "Newsletter Draft AI",
      "Promo Campaign Wizard",
      "Subject-Line Tester"
    ]
  },
  {
    title: "Cold DM Outreach",
    children: [
      "LinkedIn Script Builder",
      "Instagram DM Opener",
      "Follow-up Planner"
    ]
  },
  {
    title: "FB Ads",
    children: [
      "Ad Creative Generator",
      "Visual Hook Prompts",
      "Audience Targeting Suggestions"
    ]
  },
  {
    title: "Ad / Landing Creative Vault",
    children: [
      "Swipeable Hook Library",
      "Winning copy examples"
    ]
  },
  {
    title: "High-Ticket Sales",
    children: [
      "Call Prep & Script Builder",
      "Live Objection Role Play",
      "Pitch Deck Generator",
      "Automated Sequence Builder"
    ]
  },
  {
    title: "Client Onboarding",
    children: [
      "Intake Form Creator",
      "Welcome Email/ Packet Builder",
      "Kick-off Checklist & Timeline Template",
      "Client Agreement"
    ]
  },
  {
    title: "Resources & Leaderboard",
    children: [
      "Best-Practice Guides",
      "Community Template Gallery",
      "Performance Leaderboards & Scorecards"
    ]
  }
]

export function AppSidebar() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  return (
    <Sidebar className="border-r border-border scrollbar-hide">
      <SidebarContent className="overflow-y-auto scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupLabel className="mt-1">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            {sidebarData.map((section, index) => (
              <div key={index} className="px-4">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full text-left py-2 font-medium rounded-md transition-all duration-200 hover:translate-x-1 flex items-center justify-between group"
                >
                  <span className="cursor-pointer transition-colors duration-200">
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
                      <li key={i} className="py-1.5 px-2 rounded-md hover:bg-accent/30 transition-all duration-200 flex items-center justify-between group cursor-pointer">
                        <span className="group-hover:text-foreground transition-colors duration-200">
                          {child}
                        </span>
                        <ExternalLink className="h-2 w-2" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2">
          <p className="text-xs text-muted-foreground">Footer content</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
