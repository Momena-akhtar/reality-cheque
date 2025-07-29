import Voucher, { IVoucher, IVoucherModel } from '../models/voucher';
import { Types } from 'mongoose';

export interface CreateVoucherData {
  code?: string;
  voucherType: 'percentage' | 'credits';
  value: number; // percentage (1-100) or dollar amount
  maxUses: number;
  validFrom?: Date;
  validUntil: Date;
  description?: string;
  applicablePlans: string[];
  createdBy: string;
}

export interface UpdateVoucherData {
  code?: string;
  voucherType?: 'percentage' | 'credits';
  value?: number;
  maxUses?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  description?: string;
  applicablePlans?: string[];
}

export interface VoucherValidationResult {
  valid: boolean;
  message?: string;
  voucher?: IVoucher;
  discount?: number;
}

export class VoucherService {
  private static instance: VoucherService;

  private constructor() {}

  public static getInstance(): VoucherService {
    if (!VoucherService.instance) {
      VoucherService.instance = new VoucherService();
    }
    return VoucherService.instance;
  }

  async createVoucher(data: CreateVoucherData): Promise<{ success: boolean; voucher?: IVoucher; message?: string }> {
    try {
      // Generate code if not provided
      if (!data.code) {
        data.code = await (Voucher as IVoucherModel).generateUniqueCode();
      } else {
        // Validate code format
        if (!/^[A-Z0-9]{6,8}$/.test(data.code.toUpperCase())) {
          return { success: false, message: 'Voucher code must be 6-8 characters (letters and numbers only)' };
        }
        
        // Check if code already exists
        const existingVoucher = await Voucher.findOne({ code: data.code.toUpperCase() });
        if (existingVoucher) {
          return { success: false, message: 'Voucher code already exists' };
        }
      }

      // Validate value based on type
      if (data.voucherType === 'percentage') {
        if (data.value <= 0 || data.value > 100) {
          return { success: false, message: 'Percentage must be between 1 and 100' };
        }
      } else if (data.voucherType === 'credits') {
        if (data.value <= 0) {
          return { success: false, message: 'Credit amount must be greater than 0' };
        }
      }

      // Set default validFrom if not provided
      if (!data.validFrom) {
        data.validFrom = new Date();
      }

      // Validate dates
      if (data.validUntil <= data.validFrom) {
        return { success: false, message: 'Valid until date must be after valid from date' };
      }

      const voucher = new Voucher({
        ...data,
        code: data.code!.toUpperCase(), // We know code exists at this point
        usedCount: 0,
        usedBy: [],
        isActive: true
      });

      await voucher.save();
      return { success: true, voucher };
    } catch (error) {
      console.error('Error creating voucher:', error);
      return { success: false, message: 'Failed to create voucher' };
    }
  }

  async getAllVouchers(): Promise<{ success: boolean; vouchers?: IVoucher[]; message?: string }> {
    try {
      const vouchers = await Voucher.find()
        .sort({ createdAt: -1 })
        .populate('createdBy', 'username email');
      
      return { success: true, vouchers };
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return { success: false, message: 'Failed to fetch vouchers' };
    }
  }

  async getVoucherById(id: string): Promise<{ success: boolean; voucher?: IVoucher; message?: string }> {
    try {
      const voucher = await Voucher.findById(id)
        .populate('createdBy', 'username email')
        .populate('usedBy', 'username email');
      
      if (!voucher) {
        return { success: false, message: 'Voucher not found' };
      }

      return { success: true, voucher };
    } catch (error) {
      console.error('Error fetching voucher:', error);
      return { success: false, message: 'Failed to fetch voucher' };
    }
  }

  async getVoucherByCode(code: string): Promise<{ success: boolean; voucher?: IVoucher; message?: string }> {
    try {
      const voucher = await Voucher.findOne({ code: code.toUpperCase() })
        .populate('createdBy', 'username email');
      
      if (!voucher) {
        return { success: false, message: 'Voucher not found' };
      }

      return { success: true, voucher };
    } catch (error) {
      console.error('Error fetching voucher by code:', error);
      return { success: false, message: 'Failed to fetch voucher' };
    }
  }

  async updateVoucher(id: string, data: UpdateVoucherData): Promise<{ success: boolean; voucher?: IVoucher; message?: string }> {
    try {
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        return { success: false, message: 'Voucher not found' };
      }

      // Check if code is being updated and if it already exists
      if (data.code && data.code !== voucher.code) {
        // Validate code format
        if (!/^[A-Z0-9]{6,8}$/.test(data.code.toUpperCase())) {
          return { success: false, message: 'Voucher code must be 6-8 characters (letters and numbers only)' };
        }
        
        const existingVoucher = await Voucher.findOne({ code: data.code.toUpperCase() });
        if (existingVoucher) {
          return { success: false, message: 'Voucher code already exists' };
        }
        data.code = data.code.toUpperCase();
      }

      // Validate value if being updated
      if (data.voucherType === 'percentage' && data.value !== undefined) {
        if (data.value <= 0 || data.value > 100) {
          return { success: false, message: 'Percentage must be between 1 and 100' };
        }
      }

      if (data.voucherType === 'credits' && data.value !== undefined) {
        if (data.value <= 0) {
          return { success: false, message: 'Credit amount must be greater than 0' };
        }
      }

      // Validate dates if being updated
      if (data.validUntil && data.validFrom) {
        if (data.validUntil <= data.validFrom) {
          return { success: false, message: 'Valid until date must be after valid from date' };
        }
      }

      const updatedVoucher = await Voucher.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).populate('createdBy', 'username email');

      return { success: true, voucher: updatedVoucher };
    } catch (error) {
      console.error('Error updating voucher:', error);
      return { success: false, message: 'Failed to update voucher' };
    }
  }

  async deleteVoucher(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        return { success: false, message: 'Voucher not found' };
      }

      // Check if voucher has been used
      if (voucher.usedCount > 0) {
        return { success: false, message: 'Cannot delete voucher that has been used' };
      }

      await Voucher.findByIdAndDelete(id);
      return { success: true, message: 'Voucher deleted successfully' };
    } catch (error) {
      console.error('Error deleting voucher:', error);
      return { success: false, message: 'Failed to delete voucher' };
    }
  }

  async validateVoucher(code: string, userId: string, orderValue: number, plan: string): Promise<VoucherValidationResult> {
    try {
      const result = await this.getVoucherByCode(code);
      if (!result.success || !result.voucher) {
        return { valid: false, message: 'Invalid voucher code' };
      }

      const voucher = result.voucher;
      const validation = voucher.validateForUser(userId, orderValue, plan);
      
      if (!validation.valid) {
        return { valid: false, message: validation.message };
      }

      const discount = voucher.calculateDiscount(orderValue);
      return { valid: true, voucher, discount };
    } catch (error) {
      console.error('Error validating voucher:', error);
      return { valid: false, message: 'Error validating voucher' };
    }
  }

  async useVoucher(code: string, userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.getVoucherByCode(code);
      if (!result.success || !result.voucher) {
        return { success: false, message: 'Invalid voucher code' };
      }

      const voucher = result.voucher;
      const success = voucher.useVoucher(userId);
      
      if (!success) {
        return { success: false, message: 'Voucher cannot be used' };
      }

      await voucher.save();
      return { success: true, message: 'Voucher used successfully' };
    } catch (error) {
      console.error('Error using voucher:', error);
      return { success: false, message: 'Failed to use voucher' };
    }
  }

  async getVoucherStats(): Promise<{ success: boolean; stats?: any; message?: string }> {
    try {
      const totalVouchers = await Voucher.countDocuments();
      const activeVouchers = await Voucher.countDocuments({ isActive: true });
      const expiredVouchers = await Voucher.countDocuments({ validUntil: { $lt: new Date() } });
      const usedVouchers = await Voucher.countDocuments({ usedCount: { $gt: 0 } });

      const totalUses = await Voucher.aggregate([
        { $group: { _id: null, totalUses: { $sum: '$usedCount' } } }
      ]);

      const stats = {
        totalVouchers,
        activeVouchers,
        expiredVouchers,
        usedVouchers,
        totalUses: totalUses[0]?.totalUses || 0
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error fetching voucher stats:', error);
      return { success: false, message: 'Failed to fetch voucher stats' };
    }
  }

  async generateUniqueCode(): Promise<string> {
    return await (Voucher as IVoucherModel).generateUniqueCode();
  }
} 