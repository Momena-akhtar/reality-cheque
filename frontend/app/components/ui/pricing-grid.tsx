"use client";
import React, { useState } from "react";
import PricingCard from "./pricing-card";
import DowngradeConfirmation from "./downgrade-confirmation";
import { plans } from "../../types/plans";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const PricingGrid = () => {
  const router = useRouter();
  const { user, updateUserPlan } = useAuth();
  const [downgradeModal, setDowngradeModal] = useState<{
    isOpen: boolean;
    targetPlan: string;
  }>({ isOpen: false, targetPlan: "" });

  const currentPlanId = user?.plan || "free";

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      // If no user, redirect to payment for any plan
      router.push(`/payment?plan=${planId}`);
      return;
    }

    // If selecting current plan, do nothing
    if (planId === currentPlanId) {
      return;
    }

    // If current plan is free and selecting paid plan, go to payment
    if (currentPlanId === "free" && (planId === "pro" || planId === "enterprise")) {
      router.push(`/payment?plan=${planId}`);
      return;
    }

    // If current plan is paid and selecting free, show downgrade confirmation
    if ((currentPlanId === "pro" || currentPlanId === "enterprise") && planId === "free") {
      setDowngradeModal({ isOpen: true, targetPlan: planId });
      return;
    }

    // If upgrading from pro to enterprise, go to payment
    if (currentPlanId === "pro" && planId === "enterprise") {
      router.push(`/payment?plan=${planId}`);
      return;
    }

    // If downgrading from enterprise to pro, show confirmation
    if (currentPlanId === "enterprise" && planId === "pro") {
      setDowngradeModal({ isOpen: true, targetPlan: planId });
      return;
    }
  };

  const handleDowngradeConfirm = async () => {
    if (!user) return;
    
    const success = await updateUserPlan(user.id, downgradeModal.targetPlan as "free" | "pro" | "enterprise");
    if (success) {
      setDowngradeModal({ isOpen: false, targetPlan: "" });
    }
  };

  const handleDowngradeCancel = () => {
    setDowngradeModal({ isOpen: false, targetPlan: "" });
  };

  return (
    <>
      <section className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-6xl w-full">
          {Object.values(plans).map((plan) => (
            <PricingCard
              key={plan.id}
              id={plan.id}
              title={plan.title}
              price={plan.price}
              billingInfo={plan.billingInfo}
              features={plan.features}
              buttonLabel={plan.id === currentPlanId ? "Your current plan" : `Get ${plan.title}`}
              current={plan.id === currentPlanId}
              highlight={plan.id === "pro"}
              enterprise={plan.id === "enterprise"}
              onSelect={handlePlanSelect}
            />
          ))}
        </div>
      </section>

      <DowngradeConfirmation
        isOpen={downgradeModal.isOpen}
        onClose={handleDowngradeCancel}
        onConfirm={handleDowngradeConfirm}
        currentPlan={plans[currentPlanId]?.title || currentPlanId}
        targetPlan={plans[downgradeModal.targetPlan]?.title || downgradeModal.targetPlan}
      />
    </>
  );
};

export default PricingGrid;
