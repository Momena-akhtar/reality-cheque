import { Schema, Document, Model } from "mongoose";
import mongoose from "mongoose";

export interface IVoucher extends Document {
  code: string;
  tier: 1 | 2 | 3; // Which tier this voucher is for
  credits: number; // Credits to give (1, 2, or 3)
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  isActive: boolean;
  description?: string;
  createdBy: string;
  
  // Virtual properties
  remainingUses: number;
  
  // Instance methods
  hasUserUsed(userId: string): boolean;
  validateForUser(userId: string): { valid: boolean; message?: string };
  useVoucher(userId: string): boolean;
}

export interface IVoucherModel extends Model<IVoucher> {
  generateUniqueCode(): Promise<string>;
}

const voucherSchema = new Schema<IVoucher>({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true,
    minlength: 6,
    maxlength: 8,
    match: /^[A-Z0-9]{6,8}$/ // Only uppercase letters and numbers, 6-8 characters
  },
  tier: { 
    type: Number, 
    enum: [1, 2, 3], 
    required: true 
  },
  credits: { 
    type: Number, 
    required: true,
    enum: [1, 2, 3] // Credits match the tier
  },
  maxUses: { 
    type: Number, 
    required: true,
    min: 1,
    default: 100
  },
  usedCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  usedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  description: { 
    type: String,
    maxlength: 500
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
});

// Index for efficient queries
voucherSchema.index({ code: 1 });
voucherSchema.index({ isActive: 1 });
voucherSchema.index({ usedCount: 1, maxUses: 1 });

// Virtual for remaining uses
voucherSchema.virtual('remainingUses').get(function() {
  return Math.max(0, this.maxUses - this.usedCount);
});

// Method to check if a user has already used this voucher
voucherSchema.methods.hasUserUsed = function(userId: string): boolean {
  return this.usedBy.includes(userId);
};

// Method to validate voucher for a specific user
voucherSchema.methods.validateForUser = function(userId: string): { valid: boolean; message?: string } {
  // Check if voucher is active and has uses left
  if (!this.isActive) {
    return { valid: false, message: 'Voucher is not active' };
  }

  if (this.usedCount >= this.maxUses) {
    return { valid: false, message: 'Voucher has been used up' };
  }

  // Check if user has already used this voucher
  if (this.hasUserUsed(userId)) {
    return { valid: false, message: 'You have already used this voucher' };
  }

  return { valid: true };
};

// Method to use voucher
voucherSchema.methods.useVoucher = function(userId: string): boolean {
  if (!this.isActive || this.usedCount >= this.maxUses || this.hasUserUsed(userId)) {
    return false;
  }

  this.usedCount += 1;
  this.usedBy.push(userId);
  return true;
};

// Static method to generate a unique voucher code (6-8 characters)
voucherSchema.statics.generateUniqueCode = async function(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let isUnique = false;

  do {
    code = '';
    // Generate 6-8 character code
    const length = Math.random() > 0.5 ? 6 : 8;
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const existingVoucher = await this.findOne({ code });
    isUnique = !existingVoucher;
  } while (!isUnique);

  return code;
};

export default mongoose.models.Voucher || mongoose.model<IVoucher, IVoucherModel>("Voucher", voucherSchema);
