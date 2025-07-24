"use client"
import React from "react";
import PlanSummary from "../components/ui/plan-summary";
import PaymentForm from "../components/ui/payment-form";
import { plans } from "../types/plans";
import { useSearchParams } from "next/navigation";

const PaymentPage = () => {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "";
  const plan = plans[planId];

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
        <PlanSummary plan={plan} />
        <PaymentForm />
      </div>
    </main>
  );
};

export default PaymentPage;
