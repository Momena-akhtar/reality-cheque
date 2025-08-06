"use client";

import { useState } from "react";
import { Crown, Lock, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  requiredTier: string;
  title?: string;
}

export default function UpgradePrompt({
  isOpen,
  onClose,
  currentTier,
  requiredTier,
  title = "Upgrade Required"
}: UpgradePromptProps) {
  const router = useRouter();

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "tier1":
        return { name: "Tier 1", price: "$10", color: "text-blue-600" };
      case "tier2":
        return { name: "Tier 2", price: "$20", color: "text-green-600" };
      case "tier3":
        return { name: "Tier 3", price: "$50", color: "text-purple-600" };
      default:
        return { name: tier, price: "", color: "text-gray-600" };
    }
  };

  const currentTierInfo = getTierInfo(currentTier);
  const requiredTierInfo = getTierInfo(requiredTier);

  const handleUpgrade = () => {
    router.push('/payment?plan=' + requiredTier);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
      <div className="bg-background text-foreground border border-border rounded-lg p-6 max-w-md w-full shadow-lg relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute cursor-pointer top-3 right-3 text-foreground hover:text-primary-hover text-xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                This feature requires {requiredTierInfo.name}
              </p>
              <p className="text-xs text-muted-foreground">
                You currently have {currentTierInfo.name}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <span className="text-sm font-medium">Current Plan</span>
              <span className={`text-sm font-semibold ${currentTierInfo.color}`}>
                {currentTierInfo.name} {currentTierInfo.price}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <span className="text-sm font-medium">Required Plan</span>
              <span className={`text-sm font-semibold ${requiredTierInfo.color}`}>
                {requiredTierInfo.name} {requiredTierInfo.price}
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Upgrade to {requiredTierInfo.name} to unlock:</p>
            <ul className="mt-2 space-y-1">
              {requiredTier === "tier2" && (
                <>
                  <li>• Offer & Pricing Builder tools</li>
                  <li>• Cold Email Outreach tools</li>
                  <li>• Cold DM Outreach tools</li>
                  <li>• FB Ads tools</li>
                </>
              )}
              {requiredTier === "tier3" && (
                <>
                  <li>• High-Ticket Sales tools</li>
                  <li>• Client Onboarding tools</li>
                  <li>• Email Marketing tools</li>
                  <li>• Creative Vault & Resources</li>
                  <li>• All premium features</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-border hover:bg-primary-hover cursor-pointer text-foreground rounded-lg"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-primary-hover cursor-pointer text-primary-foreground rounded-lg"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 