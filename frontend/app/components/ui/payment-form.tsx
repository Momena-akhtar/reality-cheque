"use client";
import React, { useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

interface VoucherData {
  id: string;
  code: string;
  tier: 1 | 2 | 3;
  credits: number;
  maxUses: number;
  description?: string;
}

interface PaymentFormContentProps {
  planPrice: string;
  planTitle: string;
  planId: string;
  onVoucherApplied?: (voucher: VoucherData | null, credits: number) => void;
}

const PaymentFormContent: React.FC<PaymentFormContentProps> = ({ 
  planPrice, 
  planTitle, 
  planId,
  onVoucherApplied 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherData | null>(null);
  const [appliedCredits, setAppliedCredits] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [wasFreeUpgrade, setWasFreeUpgrade] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "Pakistan",
    address: "",
  });
  const { refreshUser } = useAuth();

  // Convert string price to number (remove $ and convert to number)
  const planPriceNumber = parseFloat(planPrice.replace('$', ''));

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }

    setApplyingPromo(true);
    try {
      // Determine target tier from plan title
      let targetTier = 'tier1';
      if (planTitle.toLowerCase().includes('tier 2') || planTitle.toLowerCase().includes('2')) {
        targetTier = 'tier2';
      } else if (planTitle.toLowerCase().includes('tier 3') || planTitle.toLowerCase().includes('3')) {
        targetTier = 'tier3';
      }

      const res = await fetch(`${API_BASE}/voucher/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          targetTier
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedVoucher(data.voucher);
        setAppliedCredits(data.credits);
        onVoucherApplied?.(data.voucher, data.credits);
        toast.success(`Voucher applied! You received $${data.credits} credits`);
        refreshUser(); // Refresh user data after successful voucher application
      } else {
        toast.error(data.message || 'Invalid voucher code');
        setAppliedVoucher(null);
        setAppliedCredits(0);
        onVoucherApplied?.(null, 0);
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
      toast.error('Failed to apply voucher');
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedVoucher(null);
    setAppliedCredits(0);
    onVoucherApplied?.(null, 0);
    toast.success('Voucher removed');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // If voucher is applied, use it first to add credits to user account
      if (appliedVoucher) {
        const useVoucherRes = await fetch(`${API_BASE}/voucher/use`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            code: appliedVoucher.code
          }),
        });

        if (!useVoucherRes.ok) {
          const errorData = await useVoucherRes.json();
          throw new Error(errorData.message || 'Failed to use voucher');
        }

        const voucherResult = await useVoucherRes.json();
        toast.success(`Successfully added $${voucherResult.credits} credits to your account!`);
        
        // Refresh user data to update credits in sidebar and usage history
        await refreshUser();
        
        // Voucher already updates the tier, so we're done
        setWasFreeUpgrade(true);
        setSuccess(true);
        return;
      }

      // Only update tier if no voucher was applied
      const userRes = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });

      if (!userRes.ok) {
        throw new Error('Failed to get user information');
      }

      const userData = await userRes.json();
      
      // Determine tier based on plan ID (more reliable than parsing title)
      let tier = 'tier1';
      if (planId === 'tier2') {
        tier = 'tier2';
      } else if (planId === 'tier3') {
        tier = 'tier3';
      }
      
      // Update user's tier
      const updateTierRes = await fetch(`${API_BASE}/user/${userData.id}/tier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tier: tier
        }),
      });

      if (!updateTierRes.ok) {
        throw new Error('Failed to update tier');
      }

      // If no voucher was applied, process Stripe payment
      if (!appliedVoucher) {
        if (!stripe || !elements) {
          throw new Error('Stripe not initialized');
        }

        const response = await fetch(`${API_BASE}/stripe/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(planPriceNumber * 100), // Convert to cents
            currency: 'usd',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();

        // Confirm the payment with Stripe
        const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        });

        if (paymentError) {
          setError(paymentError.message || 'Payment failed');
          return;
        } else if (paymentIntent.status === 'succeeded') {
          console.log('Payment successful:', paymentIntent);
        }
      }

      setWasFreeUpgrade(true);
      setSuccess(true);
      console.log('Tier updated successfully');
    } catch (err) {
      setError('Subscription failed. Please try again.');
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  // Handle redirect after successful payment
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (success) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
        <div className="text-center">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold mb-2 text-foreground">
            {wasFreeUpgrade ? 'Subscription Activated!' : 'Payment Successful!'}
          </h2>
          <p className="text-primary-text-faded">
            {wasFreeUpgrade
              ? `Your ${planTitle} has been activated successfully.${appliedCredits > 0 ? ` You now have $${appliedCredits} credits in your account.` : ''}` 
              : 'Your subscription has been activated.'
            }
          </p>
          <p className="text-xs text-primary-text-faded mt-2">
            Redirecting to home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Payment method</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Stripe payment fields - only show when no voucher is applied */}
        {!appliedVoucher && (
          <>
            <input
              type="text"
              placeholder="Full name"
              className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              required={!appliedVoucher}
            />
            <select 
              className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
              value={form.country}
              onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
              required={!appliedVoucher}
            >
              <option>Pakistan</option>
            </select>
            <input
              type="text"
              placeholder="Address line"
              className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
              value={form.address}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              required={!appliedVoucher}
            />
            
            {/* Stripe Card Element */}
            <div className="border border-border p-3 rounded-lg">
              <CardElement options={cardElementOptions} />
            </div>
          </>
        )}

        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
             
        {/* Promo section */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold mb-4 text-foreground">Voucher Code</h2>
          
          {appliedCredits > 0 && (
            <div className="mb-3 p-2 border border-green-700 rounded-lg">
              <p className="text-sm text-foreground font-medium">
                Voucher applied successfully! You'll receive ${appliedCredits} credits.
              </p>
            </div>
          )}
          
          {!appliedVoucher ? (
            <div className="flex flex-row gap-2">
              <input
                type="text"
                placeholder="Enter voucher code"
                className="flex-1 border border-border p-2 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                disabled={applyingPromo}
              />
              <button
                type="button"
                onClick={applyPromoCode}
                disabled={applyingPromo || !promoCode.trim()}
                className="py-2 px-4 rounded-xl bg-green-700/30 border border-green-700 cursor-pointer hover:bg-green-800 text-foreground font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyingPromo ? 'Applying...' : 'Apply'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-700/20 border border-green-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{appliedVoucher.code}</p>
                <p className="text-xs text-primary-text-faded">
                  Tier {appliedVoucher.tier} - ${appliedVoucher.credits} credits
                </p>
              </div>
              <button
                type="button"
                onClick={removePromoCode}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-xl bg-green-700/30 border border-green-700 cursor-pointer hover:bg-green-800 text-foreground font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Subscribe'}
        </button>
 
        <p className="text-xs text-primary-text-faded mt-2">
          {appliedVoucher ? (
            `By clicking Subscribe, you agree to activate your ${planTitle} subscription. You will receive $${appliedCredits} credits in your account.`
          ) : (
            `By providing your payment information, you allow us to charge your card in the amount above and monthly until you cancel in accordance with our terms. You can cancel at any time.`
          )}
        </p>
      </form>
    </div>
  );
};

interface PaymentFormProps {
  planPrice: string;
  planTitle: string;
  planId: string;
  onVoucherApplied?: (voucher: VoucherData | null, credits: number) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ planPrice, planTitle, planId, onVoucherApplied }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent 
        planPrice={planPrice} 
        planTitle={planTitle} 
        planId={planId}
        onVoucherApplied={onVoucherApplied}
      />
    </Elements>
  );
};

export default PaymentForm;
