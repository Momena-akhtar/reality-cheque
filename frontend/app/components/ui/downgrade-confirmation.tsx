import React from "react";
import { cn } from "@/lib/utils";

interface DowngradeConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  targetPlan: string;
}

const DowngradeConfirmation: React.FC<DowngradeConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  targetPlan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Confirm Plan Change
        </h3>
        
        <p className="text-primary-text-faded mb-6">
          Are you sure you want to downgrade from {currentPlan} to {targetPlan}? 
          You will lose access to premium features immediately.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={cn(
              "w-1/3 py-2 px-4 rounded-lg cursor-pointer border border-border text-foreground hover:bg-card-hover transition-colors"
            )}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "w-2/3 py-2 px-4 border border-red-600/30 hover:bg-red-600/40 cursor-pointer text-foreground rounded-lg transition-colors"
            )}
          >
            Confirm Downgrade
          </button>
        </div>
      </div>
    </div>
  );
};

export default DowngradeConfirmation; 