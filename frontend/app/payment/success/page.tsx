"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCredits } from '../../hooks/useCredits';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirmPurchase, balance } = useCredits();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const paymentIntentId = searchParams.get('payment_intent');
        const tier = searchParams.get('tier');

        if (!paymentIntentId || !tier) {
          toast.error('Missing payment information');
          router.push('/upgrade');
          return;
        }

        // Confirm the purchase with our backend
        const confirmed = await confirmPurchase(paymentIntentId, parseInt(tier));
        
        if (confirmed) {
          setSuccess(true);
          toast.success('Payment successful! Your credits have been added.');
        } else {
          toast.error('Failed to confirm payment');
        }
      } catch (error) {
        console.error('Payment confirmation error:', error);
        toast.error('Failed to process payment');
      } finally {
        setProcessing(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, confirmPurchase, router]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Processing Payment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              There was an issue processing your payment. Please try again.
            </p>
            <Button onClick={() => router.push('/upgrade')}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Your credits have been added to your account successfully.
          </p>
          
          {balance && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-green-600">
                ${balance.credits.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Tier {balance.tier}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => router.push('/chat')}
            >
              Start Using AI Tools
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/upgrade')}
            >
              Buy More Credits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
} 