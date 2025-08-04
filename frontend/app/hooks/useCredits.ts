import { useState } from 'react';

export const useCredits = () => {
  const [balance, setBalance] = useState({ credits: 0, tier: 1 });

  const confirmPurchase = async (paymentIntentId: string, tier: number) => {
    // Minimal implementation - just return success
    console.log('Confirming purchase:', paymentIntentId, tier);
    return true;
  };

  return {
    balance,
    confirmPurchase,
  };
}; 