import React from "react";
import PricingCard from "./pricing-card";

const PricingGrid = () => {
  return (
    <section className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-6xl w-full">
        {/* Free Plan */}
        <PricingCard
          title="Free"
          price="$0"
          features={[
            "Basic access to AI models",
            "Limited citations",
            "Community support",
            "Basic file uploads",
            "Access to public tools"
          ]}
          buttonLabel="Your current plan"
          current
        />

        {/* Pro Plan */}
        <PricingCard
          title="Pro"
          price="$20.00 / month"
          billingInfo="$16.67 when billed annually"
          features={[
            "10x citations in answers",
            "Access to Labs",
            "Unlimited file & photo uploads",
            "Extended research access",
            "Image generation tools",
            "Access to latest AI models"
          ]}
          buttonLabel="Get Pro"
          highlight
        />

        {/* Enterprise Plan */}
        <PricingCard
          title="Enterprise"
          price="$200.00 / month"
          features={[
            "Everything in Pro",
            "Early access to new products",
            "Advanced AI models like GPT-4o, Claude 4",
            "Unlimited research tools",
            "Dedicated support"
          ]}
          buttonLabel="Get Enterprise"
          enterprise
        />
      </div>
    </section>
  );
};

export default PricingGrid;
