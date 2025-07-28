"use client";
import React, { useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const PaymentFormContent: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "Pakistan",
    address: "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 2000, // $20.00 in cents - adjust based on your pricing
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
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Payment Successful!</h2>
          <p className="text-primary-text-faded">Your subscription has been activated.</p>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Payment method</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        {/* Stripe Card Element */}
        <div className="border border-border p-3 rounded-lg">
          <CardElement options={cardElementOptions} />
        </div>

        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full py-2 px-4 rounded-xl bg-green-700/30 border border-green-700 cursor-pointer hover:bg-green-800 text-foreground font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Subscribe'}
        </button>
        
        <p className="text-xs text-primary-text-faded mt-2">
          By providing your payment information, you allow us to charge your card in the amount above and monthly until you cancel in accordance with our terms. You can cancel at any time.
        </p>
      </form>
    </div>
  );
};

const PaymentForm: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent />
    </Elements>
  );
};

export default PaymentForm;
