import Admin from '../models/admin';
import { signToken } from './authService';
import { VoucherService } from './voucherService';
import User from '../models/user';
import Chat from '../models/chat';
import Message from '../models/message';

interface ActivityItem {
  type: 'user_registered' | 'chat_started' | 'message_sent';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    username: string;
    email: string;
  };
  model?: {
    name: string;
  };
  tokens?: number;
}

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

  // New methods for admin dashboard
  async getDashboardStats() {
    try {
      // Get total counts
      const totalUsers = await User.countDocuments();
      const totalChats = await Chat.countDocuments();
      const totalMessages = await Message.countDocuments();

      // Get active users (users with activity in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = await User.countDocuments({
        lastActivity: { $gte: sevenDaysAgo }
      });

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: startOfMonth }
      });

      // Calculate revenue (simple calculation based on user plans)
      const users = await User.find({}, 'plan');
      let revenue = 0;
      users.forEach(user => {
        switch (user.tier) {
          case 'tier2':
            revenue += 2; // $2 one-time
            break;
          case 'tier3':
            revenue += 3; // $3 one-time
            break;
          default:
            revenue += 1; // Tier 1 is $1 one-time
        }
      });

      return {
        success: true,
        data: {
          totalUsers,
          totalChats,
          totalMessages,
          revenue,
          activeUsers,
          newUsersThisMonth
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false, message: 'Failed to fetch dashboard statistics' };
    }
  }

  async getRecentActivity() {
    try {
      const activities: ActivityItem[] = [];

      // Get recent user registrations
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(3);

      recentUsers.forEach(user => {
        activities.push({
          type: 'user_registered',
          title: 'New user registered',
          description: `${user.username} (${user.email})`,
          timestamp: user.createdAt,
          user: {
            username: user.username,
            email: user.email
          }
        });
      });

      // Get recent chat sessions
      const recentChats = await Chat.find()
        .populate('userId', 'username email')
        .populate('modelId', 'name')
        .sort({ createdAt: -1 })
        .limit(3);

      recentChats.forEach(chat => {
        activities.push({
          type: 'chat_started',
          title: 'Chat session started',
          description: `${chat.userId.username} started chat with ${chat.modelId.name}`,
          timestamp: chat.createdAt,
          user: {
            username: chat.userId.username,
            email: chat.userId.email
          },
          model: {
            name: chat.modelId.name
          }
        });
      });

      // Get recent messages
      const recentMessages = await Message.find()
        .populate({
          path: 'chatId',
          populate: [
            { path: 'userId', select: 'username email' },
            { path: 'modelId', select: 'name' }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(3);

      recentMessages.forEach(message => {
        activities.push({
          type: 'message_sent',
          title: message.role === 'user' ? 'User sent message' : 'AI responded',
          description: `${message.chatId.userId.username} in ${message.chatId.modelId.name}`,
          timestamp: message.timestamp,
          user: {
            username: message.chatId.userId.username,
            email: message.chatId.userId.email
          },
          model: {
            name: message.chatId.modelId.name
          },
          tokens: message.tokenCount
        });
      });

      // Sort by timestamp and return top 10
      return {
        success: true,
        data: activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return { success: false, message: 'Failed to fetch recent activity' };
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