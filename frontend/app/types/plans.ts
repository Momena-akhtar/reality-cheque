import { PlanDetails } from "./plan-details";

export const plans: Record<string, PlanDetails> = {
  free: {
    id: "free",
    title: "Free",
    price: "$0",
    billingInfo: "Billed monthly",
    features: ["Basic access to AI models",
            "Limited citations",
            "Community support",
            "Basic file uploads",
            "Access to public tools"],
  },
  pro: {
    id: "pro",
    title: "Pro",
  price: "$20.00",
  billingInfo: "$16.67 when billed annually",
  features: [
    "10x citations in answers",
    "Access to Labs",
    "Unlimited file & photo uploads",
    "Extended research access",
    "Image generation tools",
    "Access to latest AI models",
  ],
  },
  enterprise: {
    id: "enterprise",
    title: "Enterprise",
    price: "$200.00",
    billingInfo: "$166.67 when billed annually",
    features: [
      "Everything in Pro",
      "Early access to new products",
      "Advanced AI models like GPT-4o, Claude 4",
      "Unlimited research tools",
      "Dedicated support"
    ]
  }
}; 