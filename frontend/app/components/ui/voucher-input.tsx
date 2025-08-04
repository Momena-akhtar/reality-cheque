"use client";
import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { toast } from 'sonner';

interface VoucherInputProps {
  onVoucherApplied: (credits: number) => void;
}

export const VoucherInput: React.FC<VoucherInputProps> = ({ onVoucherApplied }) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!voucherCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }

    setLoading(true);
    
    try {
      // First validate the voucher
      const validateResponse = await fetch('/api/voucher/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: voucherCode.toUpperCase() })
      });

      const validateResult = await validateResponse.json();

      if (!validateResult.valid) {
        toast.error(validateResult.message || 'Invalid voucher code');
        return;
      }

      // If valid, use the voucher
      const useResponse = await fetch('/api/voucher/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: voucherCode.toUpperCase() })
      });

      const useResult = await useResponse.json();

      if (useResponse.ok) {
        toast.success(`Voucher applied! You received $${useResult.credits} credits`);
        onVoucherApplied(useResult.credits);
        setVoucherCode('');
      } else {
        toast.error(useResult.message || 'Failed to apply voucher');
      }
    } catch (error) {
      console.error('Voucher error:', error);
      toast.error('Failed to process voucher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleVoucherSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter voucher code"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          className="flex-1"
          maxLength={8}
        />
        <Button 
          type="submit" 
          disabled={loading || !voucherCode.trim()}
          size="sm"
        >
          {loading ? 'Applying...' : 'Apply'}
        </Button>
      </form>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Enter a voucher code to get credits
      </p>
    </div>
  );
}; 