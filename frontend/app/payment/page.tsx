"use client"
import React, { useState, Suspense } from "react";
import PlanSummary from "../components/ui/plan-summary";
import PaymentForm from "../components/ui/payment-form";
import { plans } from "../types/plans";
import { useSearchParams } from "next/navigation";

interface VoucherData {
  id: string;
  code: string;
  tier: 1 | 2 | 3;
  credits: number;
  maxUses: number;
  description?: string;
}

const PaymentPageContent = () => {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "";
  const plan = plans[planId];
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherData | null>(null);
  const [appliedCredits, setAppliedCredits] = useState(0);

  const handleVoucherApplied = (voucher: VoucherData | null, credits: number) => {
    setAppliedVoucher(voucher);
    setAppliedCredits(credits);
  };

  if (!plan) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Invalid plan selected</h2>
          <p className="text-primary-text-faded">Please go back and select a valid plan.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-16 flex justify-center items-start">
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        <PlanSummary 
          plan={plan} 
          appliedVoucher={appliedVoucher}
          appliedCredits={appliedCredits}
        />
        <PaymentForm 
          planPrice={plan.price}
          planTitle={plan.title}
          onVoucherApplied={handleVoucherApplied}
        />
      </div>
    </main>
  );
};

const PaymentPage = () => {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    }>
      <PaymentPageContent />
    </Suspense>
  );
};

export default PaymentPage;
