import React from "react";
import { cn } from "@/lib/utils"; // optional: className merge helper

interface PricingCardProps {
  title: string;
  price: string;
  billingInfo?: string;
  features: string[];
  buttonLabel: string;
  highlight?: boolean;
  current?: boolean;
  enterprise?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  billingInfo,
  features,
  buttonLabel,
  highlight,
  current,
  enterprise,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border  p-6 transition-colors duration-200 hover:bg-card-hover w-full max-w-sm",
        highlight && "bg-card scale-105 z-10 border-blue-500/30 shadow-lg",
        current && "border-border",
        enterprise && "border-border"
      )}
    >
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {current && (
            <span className="text-xs px-2 py-1 border border-border text-white rounded-lg">
              Your current plan
            </span>
          )}
          {highlight && (
            <span className="text-xs px-2 py-1 bg-blue-700/30 border border-blue-700 text-white rounded-lg">
              Popular
            </span>
          )}
        </div>

        <div className="text-3xl font-bold text-foreground mb-1">{price}</div>
        {billingInfo && (
          <div className="text-sm text-primary-text-faded mb-4">{billingInfo}</div>
        )}

        <ul className="space-y-2 text-sm text-primary-text-faded mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">✔</span> {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        className={cn(
          "w-full py-2 px-4 rounded-lg cursor-pointer font-semibold text-sm transition-colors",
          highlight
            ? "bg-blue-700 hover:bg-blue-700 text-white"
            : "bg-primary hover:bg-primary-hover text-white"
        )}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default PricingCard;
