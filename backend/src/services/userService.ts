import User, { IUser } from "../models/user";
import Chat from "../models/chat";
import Message from "../models/message";

interface ActivityItem {
  type: 'chat_started' | 'message_sent';
  title: string;
  description: string;
  timestamp: Date;
  modelName?: string;
  tokens?: number;
}

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUserById(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async updateUserPlan(userId: string, plan: "free" | "pro" | "enterprise"): Promise<IUser | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { plan }, 
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      console.error('Error updating user plan:', error);
      return null;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await User.findByIdAndDelete(userId);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // New methods for usage history
  async getUserUsageStats(userId: string, timeRange: '7d' | '30d' | '90d' = '30d') {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all chats for the user in the time range
      const chats = await Chat.find({
        userId,
        createdAt: { $gte: startDate }
      }).populate('modelId');

      // Get all messages for these chats
      const chatIds = chats.map(chat => chat._id);
      const messages = await Message.find({
        chatId: { $in: chatIds }
      });

      // Calculate daily usage
      const dailyUsage = new Map();
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyUsage.set(dateStr, {
          date: dateStr,
          creditsUsed: 0,
          apiCalls: 0,
          cost: 0
        });
      }

      // Aggregate usage by date
      messages.forEach(message => {
        const messageDate = new Date(message.timestamp).toISOString().split('T')[0];
        if (dailyUsage.has(messageDate)) {
          const dayData = dailyUsage.get(messageDate);
          dayData.creditsUsed += message.tokenCount || 0;
          dayData.apiCalls += 1;
          // Simple cost calculation (you can adjust based on your pricing)
          dayData.cost += (message.tokenCount || 0) * 0.0001; // $0.0001 per token
        }
      });

      const usageData = Array.from(dailyUsage.values()).reverse();

      // Calculate totals
      const totalCreditsUsed = usageData.reduce((sum, day) => sum + day.creditsUsed, 0);
      const totalApiCalls = usageData.reduce((sum, day) => sum + day.apiCalls, 0);
      const totalCost = usageData.reduce((sum, day) => sum + day.cost, 0);
      const averageDailyUsage = totalCreditsUsed / usageData.length;

      // Determine trend
      const firstWeek = usageData.slice(0, 7).reduce((sum, day) => sum + day.creditsUsed, 0);
      const lastWeek = usageData.slice(-7).reduce((sum, day) => sum + day.creditsUsed, 0);
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (lastWeek > firstWeek * 1.1) trend = 'up';
      else if (lastWeek < firstWeek * 0.9) trend = 'down';

      // Get user's remaining credits
      const user = await User.findById(userId);
      const remainingCredits = user?.creditsPerMonth || 0;

      return {
        success: true,
        data: {
          usageData,
          stats: {
            totalCreditsUsed,
            totalApiCalls,
            totalCost,
            averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
            trend,
            remainingCredits
          }
        }
      };
    } catch (error) {
      console.error('Error fetching user usage stats:', error);
      return { success: false, message: 'Failed to fetch usage statistics' };
    }
  }

  async getUserRecentActivity(userId: string) {
    try {
      // Get recent chats
      const recentChats = await Chat.find({ userId })
        .populate('modelId')
        .sort({ lastActivity: -1 })
        .limit(5);

      // Get recent messages
      const recentMessages = await Message.find({ 
        chatId: { $in: recentChats.map(chat => chat._id) }
      })
        .populate('chatId')
        .sort({ timestamp: -1 })
        .limit(10);

      const activities: ActivityItem[] = [];

      // Add chat activities
      recentChats.forEach(chat => {
        activities.push({
          type: 'chat_started',
          title: `Started chat with ${chat.modelId.name}`,
          description: chat.title || 'New conversation',
          timestamp: chat.createdAt,
          modelName: chat.modelId.name
        });
      });

      // Add message activities
      recentMessages.forEach(message => {
        activities.push({
          type: 'message_sent',
          title: message.role === 'user' ? 'Sent message' : 'Received AI response',
          description: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
          timestamp: message.timestamp,
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
      console.error('Error fetching user recent activity:', error);
      return { success: false, message: 'Failed to fetch recent activity' };
    }
  }

  async getUserTokenInfo(userId: string) {
    try {
      // Get user's remaining credits in dollars
      const user = await User.findById(userId);
      const remainingCreditsInDollars = user?.creditsPerMonth || 0;

      // Calculate total tokens allocated ($10 = 1,000,000 tokens based on O3 pricing)
      // Average cost per token: ($0.005 + $0.015) / 2 = $0.01 per 1K tokens = $0.00001 per token
      const totalTokensAllocated = 1000000; // 1M tokens for $10
      const usedTokensInDollars = 10 - remainingCreditsInDollars;
      const usedTokens = Math.round(usedTokensInDollars * 100000); // Convert dollars to tokens
      const remainingTokens = Math.max(0, totalTokensAllocated - usedTokens);

      // Calculate usage percentage
      const usagePercentage = Math.min(100, (usedTokens / totalTokensAllocated) * 100);

      return {
        success: true,
        data: {
          totalTokens: totalTokensAllocated,
          usedTokens: usedTokens,
          remainingTokens: remainingTokens,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          remainingCreditsInDollars: remainingCreditsInDollars,
          usedCreditsInDollars: usedTokensInDollars
        }
      };
    } catch (error) {
      console.error('Error fetching user token info:', error);
      return { success: false, message: 'Failed to fetch token information' };
    }
  }
}