import { Schema, Document, Model } from "mongoose";
import mongoose from "mongoose";

export interface IVoucher extends Document {
  code: string;
  voucherType: 'percentage' | 'credits';
  value: number; // percentage (1-100) or dollar amount
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  description?: string;
  applicablePlans: string[];
  createdBy: string;
  
  // Virtual properties
  isExpired: boolean;
  isValid: boolean;
  remainingUses: number;
  
  // Instance methods
  hasUserUsed(userId: string): boolean;
  calculateDiscount(orderValue: number): number;
  validateForUser(userId: string, orderValue: number, plan: string): { valid: boolean; message?: string };
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
  voucherType: { 
    type: String, 
    enum: ['percentage', 'credits'], 
    required: true 
  },
  value: { 
    type: Number, 
    required: true,
    min: 0
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
  validFrom: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  validUntil: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  description: { 
    type: String,
    maxlength: 500
  },
  applicablePlans: [{
    type: String,
    enum: ['pro', 'enterprise'],
    default: ['pro']
  }],
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
});

// Index for efficient queries
voucherSchema.index({ code: 1 });
voucherSchema.index({ isActive: 1, validUntil: 1 });
voucherSchema.index({ usedCount: 1, maxUses: 1 });

// Virtual for checking if voucher is expired
voucherSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual for checking if voucher is valid (not expired, active, and has uses left)
voucherSchema.virtual('isValid').get(function() {
  return this.isActive && 
         new Date() <= this.validUntil && 
         this.usedCount < this.maxUses &&
         new Date() >= this.validFrom;
});

// Virtual for remaining uses
voucherSchema.virtual('remainingUses').get(function() {
  return Math.max(0, this.maxUses - this.usedCount);
});

// Method to check if a user has already used this voucher
voucherSchema.methods.hasUserUsed = function(userId: string): boolean {
  return this.usedBy.includes(userId);
};

// Method to apply voucher and calculate discount/credits
voucherSchema.methods.calculateDiscount = function(orderValue: number): number {
  if (this.voucherType === 'percentage') {
    return (orderValue * this.value) / 100;
  } else {
    // For credits, return the dollar amount directly
    return this.value;
  }
};

// Method to validate voucher for a specific user and order
voucherSchema.methods.validateForUser = function(userId: string, orderValue: number, plan: string): { valid: boolean; message?: string } {
  // Check if voucher is active and not expired
  if (!this.isValid) {
    return { valid: false, message: 'Voucher is not valid or has expired' };
  }

  // Check if user has already used this voucher
  if (this.hasUserUsed(userId)) {
    return { valid: false, message: 'You have already used this voucher' };
  }

  // Check if voucher applies to the selected plan
  if (!this.applicablePlans.includes(plan)) {
    return { valid: false, message: 'Voucher does not apply to this plan' };
  }

  // For percentage vouchers, check if order value is sufficient
  if (this.voucherType === 'percentage' && orderValue <= 0) {
    return { valid: false, message: 'Order value must be greater than 0 for percentage vouchers' };
  }

  return { valid: true };
};

// Method to use voucher
voucherSchema.methods.useVoucher = function(userId: string): boolean {
  if (!this.isValid || this.hasUserUsed(userId)) {
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
