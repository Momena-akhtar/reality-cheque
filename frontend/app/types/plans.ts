import { PlanDetails } from "./plan-details";

export const plans: Record<string, PlanDetails> = {
  tier1: {
    id: "tier1",
    title: "Tier 1",
    price: "$1.00",
    billingInfo: "One-time purchase",
    features: ["Basic AI models",
            "Limited citations",
            "Community support",
            "Basic file uploads",
            "Access to public tools"],
  },
  tier2: {
    id: "tier2",
    title: "Tier 2",
    price: "$2.00",
    billingInfo: "One-time purchase",
    features: [
      "Advanced AI models",
      "10x citations in answers",
      "Unlimited file & photo uploads",
      "Extended research access",
      "Image generation tools",
      "Access to latest AI models",
    ],
  },
  tier3: {
    id: "tier3",
    title: "Tier 3",
    price: "$3.00",
    billingInfo: "One-time purchase",
    features: [
      "All AI models",
      "Unlimited citations",
      "All tools and features",
      "Priority support",
      "Early access to new products",
      "Advanced AI models like GPT-4o, Claude 4"
    ]
  }
}; 