import React from "react";
import { PlanDetails } from "../../types/plan-details"; 

interface PlanSummaryProps {
  plan: PlanDetails;
}

const PlanSummary: React.FC<PlanSummaryProps> = ({ plan }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4 text-foreground">{plan.title} Plan</h2>
      <div className="text-3xl font-bold text-foreground mb-1">{plan.price}/mo</div>
      {plan.billingInfo && (
        <p className="text-sm text-primary-text-faded mb-4">{plan.billingInfo}</p>
      )}
      <ul className="space-y-2 text-sm text-primary-text-faded mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2">✔</span> {feature}
          </li>
        ))}
      </ul>
      <div className="border-y border-border py-4">
        <h1>Order Details</h1>
        <div className="text-sm text-primary-text-faded pt-4">
            <p className="flex justify-between">
              <span>{plan.title} Plan </span>
              <span>{plan.price}</span></p>
        </div>
        <div className="text-sm text-primary-text-faded pt-4">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{plan.price}</span></p>
        </div>
        <p className="flex justify-between pt-4 text-foreground"><span>Total due today</span><span>{plan.price}</span></p>
      </div>
    </div>
  );
};

export default PlanSummary;
