import { ExternalLink, Lock, Crown } from "lucide-react";
import CategoryTag from "./category-tag";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { isCategoryAccessible, getTierColor, getUpgradeMessage } from "@/app/utils/tier-access";
import UpgradePrompt from "./upgrade-prompt";
import { useState } from "react";

interface BotCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryTierAccess?: "tier1" | "tier2" | "tier3";
}

export default function BotCard({
  id,
  name,
  description,
  category,
  categoryTierAccess = "tier1",
}: BotCardProps) {
    const {user} = useAuth();
    const router = useRouter();
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    
    const isAccessible = user ? isCategoryAccessible(user.tier || "tier1", categoryTierAccess) : false;
    const isLocked = !isAccessible;
    
    const handleCardClick = () => {
      if (!user) {
        router.push('/signin');
        return;
      }
      
      if (isLocked) {
        setShowUpgradePrompt(true);
        return;
      }
      
      router.push(`/chat?id=${id}`);
    };
    
    return (
      <>
        <div 
          className={`rounded-2xl border border-border text-foreground shadow-sm bg-card transition-all duration-300 hover:scale-[1.02] hover:bg-card-hover cursor-pointer ${
            isLocked ? 'opacity-60 hover:opacity-80' : ''
          }`}
          onClick={handleCardClick}
        >
          <div className="flex flex-col space-y-3 p-6">
            <div className="flex items-start justify-between">
              <div role="heading" aria-level={3} className="font-semibold leading-none tracking-tight text-lg">
                {name}
              </div>
              {isLocked && (
                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              )}
            </div>
            <p className="text-sm text-primary-text-faded line-clamp-2 h-10">
              {description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CategoryTag category={category} />
                {categoryTierAccess && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getTierColor(categoryTierAccess)}`}>
                    {categoryTierAccess.replace('tier', 'Tier ')}
                  </span>
                )}
              </div>
              <ExternalLink size={18} className="text-foreground hover:text-primary-text-hover transition-colors duration-150" />
            </div>
          </div>
        </div>

        {/* Upgrade Prompt */}
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          currentTier={user?.tier || "tier1"}
          requiredTier={categoryTierAccess}
          title="Upgrade Required"
        />
      </>
    );
}
