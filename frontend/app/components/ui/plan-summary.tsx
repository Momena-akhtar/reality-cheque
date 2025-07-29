import React from "react";
import { PlanDetails } from "../../types/plan-details"; 

interface VoucherData {
  id: string;
  code: string;
  voucherType: 'percentage' | 'credits';
  value: number;
  maxUses: number;
  description?: string;
}

interface PlanSummaryProps {
  plan: PlanDetails;
  appliedVoucher?: VoucherData | null;
  discountAmount?: number;
}

const PlanSummary: React.FC<PlanSummaryProps> = ({ 
  plan, 
  appliedVoucher, 
  discountAmount = 0 
}) => {
  // Convert string price to number (remove $ and convert to number)
  const planPriceNumber = parseFloat(plan.price.replace('$', ''));
  const finalAmount = Math.max(0, planPriceNumber - discountAmount);

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
              <span>${plan.price}</span>
            </p>
        </div>
        
        {appliedVoucher && discountAmount > 0 && (
          <div className="text-sm text-green-600 pt-2">
            <p className="flex justify-between">
              <span>Discount ({appliedVoucher.code})</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </p>
            <p className="text-xs text-primary-text-faded">
              {appliedVoucher.voucherType === 'percentage' 
                ? `${appliedVoucher.value}% off` 
                : `$${appliedVoucher.value} credit applied`
              }
            </p>
          </div>
        )}
        
        <p className="flex justify-between pt-4 text-foreground font-semibold">
          <span>Total due today</span>
          <span>{finalAmount === 0 ? 'FREE' : `$${finalAmount.toFixed(2)}`}</span>
        </p>
      </div>
    </div>
  );
};

export default PlanSummary;
