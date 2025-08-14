import { PlanDetails } from "./plan-details";

export const plans: Record<string, PlanDetails> = {
  tier1: {
    id: "tier1",
    title: "Tier 1",
    price: "$10.00",
    billingInfo: "One-time purchase",
    features: [
      "Website Builder Tools",
      "Upwork Tools", 
      "Fiverr Tools",
      "Basic AI models",
    ],
  },
  tier2: {
    id: "tier2",
    title: "Tier 2",
    price: "$20.00",
    billingInfo: "One-time purchase",
    features: [
      "Everything in Tier 1",
      "Offer & Pricing Builder",
      "Cold Email Outreach",
      "Cold DM Outreach", 
      "FB Ads Tools",
    ],
  },
  tier3: {
    id: "tier3",
    title: "Tier 3",
    price: "$50.00",
    billingInfo: "One-time purchase",
    features: [
      "Everything in Tier 2",
      "High-Ticket Sales Tools",
      "Client Onboarding Tools",
      "All AI models"
    ]
  }
}; 