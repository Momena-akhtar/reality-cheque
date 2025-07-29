import Admin from '../models/admin';
import { signToken } from './authService';
import { VoucherService } from './voucherService';

export class AdminService {
  private static instance: AdminService;

  private constructor() {}

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  async authenticateAdmin(email: string, password: string) {
    try {
      const admin = await Admin.findOne({ email });
      if (!admin || !(await admin.comparePassword(password))) {
        return { success: false, message: 'Invalid admin credentials' };
      }
      
      // Create session token with 30-minute expiration
      const token = signToken({ id: admin._id, role: 'admin' }, '30m');
      
      return {
        success: true,
        message: 'Admin login successful',
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          username: admin.username
        }
      };
    } catch (error) {
      console.error('Error authenticating admin:', error);
      return { success: false, message: 'Admin login failed' };
    }
  }

  async refreshAdminToken(adminId: string) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return { success: false, message: 'Admin not found' };
      }
      
      // Create new token with 30-minute expiration
      const newToken = signToken({ id: admin._id, role: 'admin' }, '30m');
      
      return {
        success: true,
        message: 'Token refreshed successfully',
        token: newToken,
        admin: {
          id: admin._id,
          email: admin.email,
          username: admin.username
        }
      };
    } catch (error) {
      console.error('Error refreshing admin token:', error);
      return { success: false, message: 'Token refresh failed' };
    }
  }

  async getAdminById(adminId: string) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return null;
      }
      
      return {
        id: admin._id,
        email: admin.email,
        username: admin.username
      };
    } catch (error) {
      console.error('Error fetching admin by ID:', error);
      return null;
    }
  }

  // Voucher Management Methods
  async createVoucher(voucherData: any) {
    try {
      const result = await VoucherService.getInstance().createVoucher(voucherData);
      return result;
    } catch (error) {
      console.error('Error creating voucher:', error);
      return { success: false, message: 'Failed to create voucher' };
    }
  }

  async getAllVouchers() {
    try {
      const result = await VoucherService.getInstance().getAllVouchers();
      return result;
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return { success: false, message: 'Failed to fetch vouchers' };
    }
  }

  async getVoucherById(id: string) {
    try {
      const result = await VoucherService.getInstance().getVoucherById(id);
      return result;
    } catch (error) {
      console.error('Error fetching voucher:', error);
      return { success: false, message: 'Failed to fetch voucher' };
    }
  }

  async updateVoucher(id: string, updateData: any) {
    try {
      const result = await VoucherService.getInstance().updateVoucher(id, updateData);
      return result;
    } catch (error) {
      console.error('Error updating voucher:', error);
      return { success: false, message: 'Failed to update voucher' };
    }
  }

  async deleteVoucher(id: string) {
    try {
      const result = await VoucherService.getInstance().deleteVoucher(id);
      return result;
    } catch (error) {
      console.error('Error deleting voucher:', error);
      return { success: false, message: 'Failed to delete voucher' };
    }
  }

  async getVoucherStats() {
    try {
      const result = await VoucherService.getInstance().getVoucherStats();
      return result;
    } catch (error) {
      console.error('Error fetching voucher stats:', error);
      return { success: false, message: 'Failed to fetch voucher stats' };
    }
  }

  async generateVoucherCode() {
    try {
      const code = await VoucherService.getInstance().generateUniqueCode();
      return { success: true, code };
    } catch (error) {
      console.error('Error generating voucher code:', error);
      return { success: false, message: 'Failed to generate voucher code' };
    }
  }
} 