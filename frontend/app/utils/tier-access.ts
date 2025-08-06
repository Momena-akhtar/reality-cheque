export interface User {
  id: string;
  email: string;
  username: string;
  tier?: "tier1" | "tier2" | "tier3";
  totalCredits?: number;
  usedCredits?: number;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  tierAccess: "tier1" | "tier2" | "tier3";
}

// Helper function to check if category is accessible to user tier
export const isCategoryAccessible = (userTier: string, categoryTierAccess: string): boolean => {
  const tierHierarchy = {
    "tier1": 1,
    "tier2": 2, 
    "tier3": 3
  };
  
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
  const categoryTierLevel = tierHierarchy[categoryTierAccess as keyof typeof tierHierarchy] || 0;
  
  return categoryTierLevel <= userTierLevel;
};

// Helper function to get tier color for UI
export const getTierColor = (tier: string) => {
  switch (tier) {
    case "tier1": return "bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400";
    case "tier2": return "bg-green-50 text-green-600 dark:bg-green-900/10 dark:text-green-400";
    case "tier3": return "bg-purple-50 text-purple-600 dark:bg-purple-900/10 dark:text-purple-400";
    default: return "bg-gray-50 text-gray-600 dark:bg-gray-900/10 dark:text-gray-400";
  }
};

// Helper function to get upgrade message
export const getUpgradeMessage = (requiredTier: string) => {
  switch (requiredTier) {
    case "tier2": return "Upgrade to Tier 2 to access this tool";
    case "tier3": return "Upgrade to Tier 3 to access this tool";
    default: return "Upgrade your plan to access this tool";
  }
}; 