"use client";
import React from "react";
import PricingCard from "./pricing-card";
import { plans } from "../../types/plans";
import { useRouter } from "next/navigation";

const PricingGrid = () => {
  const router = useRouter();
  const currentPlanId = "free";

  return (
    <section className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-6xl w-full">
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
            onSelect={(id) => router.push(`/payment?plan=${id}`)}
          />
        ))}
      </div>
    </section>
  );
};

export default PricingGrid;
