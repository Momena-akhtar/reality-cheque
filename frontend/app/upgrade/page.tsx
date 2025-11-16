"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import PricingGrid from "../components/ui/pricing-grid";
import { toast } from "sonner";
import { Button } from "../components/ui/button";

export default function Upgrade() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showVoucherInput, setShowVoucherInput] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Redirect to signin if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) {
      toast.error("Please enter a voucher code");
      return;
    }

    setVoucherLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voucher/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          code: voucherCode,
          targetTier: 'tier1' // Default tier for upgrade page
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.valid) {
          // Now use the voucher to actually apply the credits
          const useResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voucher/use`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ code: voucherCode }),
          });

          if (useResponse.ok) {
            const useData = await useResponse.json();
            toast.success(`Voucher applied successfully! You received ${useData.credits} credits.`);
            setVoucherCode("");
            setShowVoucherInput(false);
            // Refresh user data to show updated credits
            window.location.reload();
          } else {
            const errorData = await useResponse.json();
            toast.error(errorData.message || "Failed to apply voucher");
          }
        } else {
          toast.error(data.message || "Invalid voucher code");
        }
      } else {
        toast.error(data.message || "Invalid voucher code");
      }
    } catch (error) {
      toast.error("Failed to apply voucher. Please try again.");
    } finally {
      setVoucherLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Choose Your Tier</h1>
          <p className="text-muted-foreground mb-6">
            Select a tier to unlock more features and credits
          </p>
          
          {/* Voucher Section */}
          <div className="max-w-md mx-auto mb-8">            
            {showVoucherInput && (
              <form onSubmit={handleVoucherSubmit} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Enter voucher code"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                />
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={voucherLoading}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {voucherLoading ? "Applying..." : "Apply Voucher"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVoucherInput(false);
                      setVoucherCode("");
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <PricingGrid />
      </div>
    </main>
  );
}