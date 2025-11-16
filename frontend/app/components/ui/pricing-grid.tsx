"use client";
import React from "react";
import PricingCard from "./pricing-card";
import { plans } from "../../types/plans";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const PricingGrid = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      router.push('/signin');
      return;
    }

    router.push(`/payment?plan=${planId}`);
  };

  return (
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
            buttonLabel={`Buy ${plan.title}`}
            current={false}
            highlight={plan.id === "tier2"}
            enterprise={plan.id === "tier3"}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>
    </section>
  );
};

export default PricingGrid;
