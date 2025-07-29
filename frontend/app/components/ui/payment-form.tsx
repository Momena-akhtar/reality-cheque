"use client";
import React, { useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

interface VoucherData {
  id: string;
  code: string;
  voucherType: 'percentage' | 'credits';
  value: number;
  maxUses: number;
  description?: string;
}

interface PaymentFormContentProps {
  planPrice: string;
  planTitle: string;
  onVoucherApplied?: (voucher: VoucherData | null, discount: number) => void;
}

const PaymentFormContent: React.FC<PaymentFormContentProps> = ({ 
  planPrice, 
  planTitle, 
  onVoucherApplied 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherData | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [wasFreeUpgrade, setWasFreeUpgrade] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "Pakistan",
    address: "",
  });

  // Convert string price to number (remove $ and convert to number)
  const planPriceNumber = parseFloat(planPrice.replace('$', ''));
  
  // Calculate final amount after discount
  const finalAmount = Math.max(0, planPriceNumber - discountAmount);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setApplyingPromo(true);
    try {
      const res = await fetch(`${API_BASE}/voucher/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          orderValue: planPriceNumber,
          plan: planTitle.toLowerCase()
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedVoucher(data.voucher);
        setDiscountAmount(data.discount);
        onVoucherApplied?.(data.voucher, data.discount);
        toast.success(`Promo code applied! ${data.voucher.voucherType === 'percentage' ? `${data.voucher.value}% discount` : `$${data.voucher.value} off`}`);
      } else {
        toast.error(data.message || 'Invalid promo code');
        setAppliedVoucher(null);
        setDiscountAmount(0);
        onVoucherApplied?.(null, 0);
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error('Failed to apply promo code');
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedVoucher(null);
    setDiscountAmount(0);
    onVoucherApplied?.(null, 0);
    toast.success('Promo code removed');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // If voucher is applied, use it first
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
      }

      // If final amount is $0, directly upgrade the user's plan
      if (finalAmount === 0) {
        // Get current user info to update their plan
        const userRes = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        });

        if (!userRes.ok) {
          throw new Error('Failed to get user information');
        }

        const userData = await userRes.json();
        
        // Update user's plan to pro
        const updatePlanRes = await fetch(`${API_BASE}/user/${userData.id}/plan`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            plan: planTitle.toLowerCase()
          }),
        });

        if (!updatePlanRes.ok) {
          throw new Error('Failed to upgrade plan');
        }

        setWasFreeUpgrade(true);
        setSuccess(true);
        console.log('Plan upgraded successfully');
        return;
      }

      // For payments greater than $0, use Stripe
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const response = await fetch(`${API_BASE}/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(finalAmount * 100), // Convert to cents
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
      } else if (paymentIntent.status === 'succeeded') {
        setSuccess(true);
        // Handle successful payment (e.g., update user subscription, redirect, etc.)
        console.log('Payment successful:', paymentIntent);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error('Payment error:', err);
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
              ? 'Your plan has been upgraded successfully.' 
              : 'Your subscription has been activated.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Payment method</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {finalAmount > 0 && (
          <>
            <input
              type="text"
              placeholder="Full name"
              className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <select 
              className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
              value={form.country}
              onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
            >
              <option>Pakistan</option>
            </select>
            <input
              type="text"
              placeholder="Address line"
              className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
              value={form.address}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </>
        )}
        
        {/* Stripe Card Element - only show when payment is required */}
        {finalAmount > 0 && (
          <div className="border border-border p-3 rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
             
        {/* Promo section */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold mb-4 text-foreground">Promo code</h2>
          
          {finalAmount === 0 && appliedVoucher && (
            <div className="mb-3 p-2 border border-green-700 rounded-lg">
              <p className="text-sm text-foreground font-medium">
                Promo code applied successfully. No payment required. Click Subscribe to continue.
              </p>
            </div>
          )}
          
          {!appliedVoucher ? (
            <div className="flex flex-row gap-2">
              <input
                type="text"
                placeholder="Enter promo code"
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
                  {appliedVoucher.voucherType === 'percentage' 
                    ? `${appliedVoucher.value}% discount applied` 
                    : `$${appliedVoucher.value} off applied`
                  }
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
          {loading ? 'Processing...' : finalAmount === 0 ? 'Subscribe' : `Pay $${finalAmount.toFixed(2)}`}
        </button>
 
        <p className="text-xs text-primary-text-faded mt-2">
          By providing your payment information, you allow us to charge your card in the amount above and monthly until you cancel in accordance with our terms. You can cancel at any time.
        </p>
      </form>
    </div>
  );
};

interface PaymentFormProps {
  planPrice: string;
  planTitle: string;
  onVoucherApplied?: (voucher: VoucherData | null, discount: number) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ planPrice, planTitle, onVoucherApplied }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent 
        planPrice={planPrice} 
        planTitle={planTitle} 
        onVoucherApplied={onVoucherApplied}
      />
    </Elements>
  );
};

export default PaymentForm;
