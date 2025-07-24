"use client";
import React, { useState } from "react";

const PaymentForm: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    country: "Pakistan",
    address: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  // Format card number with spaces after every 4 digits
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const limited = digits.slice(0, 16);
    return limited.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setForm((prev) => ({ ...prev, cardNumber: formatted }));
  };

  // Format MM/YY and validate
  const formatExpiry = (value: string) => {
    // Remove non-digits
    let digits = value.replace(/\D/g, "");
    if (digits.length > 4) digits = digits.slice(0, 4);

    // Add slash after 2 digits
    if (digits.length > 2) {
      digits = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    return digits;
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let formatted = formatExpiry(e.target.value);

    // Extract month and year
    let [mm, yy] = formatted.split("/");
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // last two digits
    const currentMonth = now.getMonth() + 1;

    // Only allow valid month
    if (mm) {
      if (mm.length === 1 && parseInt(mm) > 1) {
        // If user types "3", auto-correct to "03"
        mm = "0" + mm;
        formatted = mm + (yy ? "/" + yy : "");
      }
      if (mm.length === 2) {
        let monthNum = parseInt(mm);
        if (monthNum < 1) {
          mm = "01";
        } else if (monthNum > 12) {
          mm = "12";
        }
        formatted = mm + (yy ? "/" + yy : "");
      }
    }

    // Only allow valid year
    if (yy && yy.length === 2) {
      let yearNum = parseInt(yy);
      if (yearNum < currentYear) {
        yy = currentYear.toString().padStart(2, "0");
        formatted = mm + "/" + yy;
      }
      // If year is current, month must be >= current month
      if (parseInt(yy) === currentYear && mm && parseInt(mm) < currentMonth) {
        mm = currentMonth.toString().padStart(2, "0");
        formatted = mm + "/" + yy;
      }
    }

    setForm((prev) => ({
      ...prev,
      expiry: formatted,
    }));
  };

  // Only allow 3 digits for CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
    setForm((prev) => ({ ...prev, cvc: digits }));
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Payment method</h2>
      <form className="space-y-4">
        <input
          type="text"
          placeholder="Full name"
          className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
        />
        <select className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover">
          <option>Pakistan</option>
        </select>
        <input
          type="text"
          placeholder="Address line"
          className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
        />
        <div className="relative">
          <input
            type="text"
            placeholder="1122 3344 5566 7788"
            className="w-full border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover pr-20"
            value={form.cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19} // 16 digits + 3 spaces
            inputMode="numeric"
            autoComplete="cc-number"
          />
          <div className="absolute inset-y-0 right-3 flex items-center space-x-2 pointer-events-none">
            <img src="/visa.webp" alt="Visa" className="h-3 w-auto" />
            <img src="/mastercard.svg" alt="Mastercard" className="h-3 w-auto" />
          </div>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="MM/YY"
            className="w-1/2 border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
            value={form.expiry}
            onChange={handleExpiryChange}
            maxLength={5}
            inputMode="numeric"
            autoComplete="cc-exp"
          />
          <input
            type="text"
            placeholder="CVC"
            className="w-1/2 border border-border p-3 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-hover"
            value={form.cvc}
            onChange={handleCvcChange}
            maxLength={3}
            inputMode="numeric"
            autoComplete="cc-csc"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 rounded-xl bg-green-700/30 border border-green-700 cursor-pointer hover:bg-green-800 text-foreground font-semibold transition-colors"
        >
          Subscribe
        </button>
        <p className="text-xs text-primary-text-faded mt-2">
          By providing your payment information, you allow us to charge your card in the amount above and monthly until you cancel in accordance with our terms. You can cancel at any time.
        </p>
      </form>
    </div>
  );
};

export default PaymentForm;
