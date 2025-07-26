import Admin from '../models/admin';
import { signToken } from './authService';

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
} 