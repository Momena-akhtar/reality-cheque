import User, { IUser } from "../models/user";
import Chat from "../models/chat";
import Message from "../models/message";
import { UserContext } from "../types/generate";

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

  async updateUserTier(userId: string, tier: "tier1" | "tier2" | "tier3"): Promise<IUser | null> {
    try {
      // Get current user to calculate credit addition
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return null;
      }

      // Calculate credits based on tier
      const tierCredits = parseInt(tier.replace('tier', ''));
      
      // All tier upgrades now just give the tier amount (no free credits)
      const newTotalCredits = tierCredits;
      // Reset used credits since they're getting new credits
      await User.findByIdAndUpdate(userId, { usedCredits: 0.00 });

      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { 
          tier,
          totalCredits: newTotalCredits
        }, 
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      console.error('Error updating user tier:', error);
      return null;
    }
  }

  // New method to sync tier based on credits (for fixing inconsistencies)
  async syncUserTier(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Determine correct tier based on credits
      let correctTier: "tier1" | "tier2" | "tier3" = "tier1";
      if (user.totalCredits >= 50) {
        correctTier = "tier3";
      } else if (user.totalCredits >= 20) {
        correctTier = "tier2";
      } else if (user.totalCredits >= 10) {
        correctTier = "tier1";
      }

      // Only update if tier is incorrect
      if (user.tier !== correctTier) {
        console.log(`Syncing user ${user.email} tier from ${user.tier} to ${correctTier} (credits: ${user.totalCredits})`);
        
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { tier: correctTier },
          { new: true }
        );
        return updatedUser;
      }

      return user;
    } catch (error) {
      console.error('Error syncing user tier:', error);
      return null;
    }
  }

  async updateUserCredits(userId: string, creditsUsed: number): Promise<IUser | null> {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return null;
      }

      const currentUsedCredits = currentUser.usedCredits || 0.00;
      const newUsedCredits = currentUsedCredits + creditsUsed;

      // Ensure used credits don't exceed total credits
      if (newUsedCredits > currentUser.totalCredits) {
        throw new Error('Insufficient credits');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { usedCredits: newUsedCredits },
        { new: true }
      );
      return updatedUser;
    } catch (error) {
      console.error('Error updating user credits:', error);
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
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Use actual user credit data
      const totalCredits = user.totalCredits || 0.00;
      const usedCredits = user.usedCredits || 0.00;
      const remainingCredits = totalCredits - usedCredits;

      // Convert credits to tokens (1 credit = $1 = 1,000,000 tokens based on O3 pricing)
      // $0.01 per 1K tokens, so $10 = 1M tokens
      const tokensPerCredit = 1000000;
      const totalTokens = Math.round(totalCredits * tokensPerCredit);
      const usedTokens = Math.round(usedCredits * tokensPerCredit);
      const remainingTokens = Math.round(remainingCredits * tokensPerCredit);

      // Calculate usage percentage
      const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

      return {
        success: true,
        data: {
          totalTokens: totalTokens,
          usedTokens: usedTokens,
          remainingTokens: remainingTokens,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          remainingCreditsInDollars: remainingCredits,
          usedCreditsInDollars: usedCredits
        }
      };
    } catch (error) {
      console.error('Error fetching user token info:', error);
      return { success: false, message: 'Failed to fetch token information' };
    }
  }

  // Gig management methods
  async addGig(userId: string, gigData: any) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const newGig = {
        title: gigData.title,
        description: gigData.description || '',
        tags: gigData.tags || [],
        price: gigData.price,
        status: gigData.status || 'Active'
      };

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { fiverrGigs: newGig } },
        { new: true }
      );

      return {
        success: true,
        data: updatedUser?.fiverrGigs
      };
    } catch (error) {
      console.error('Error adding gig:', error);
      return { success: false, message: 'Failed to add gig' };
    }
  }

  async updateGig(userId: string, gigIndex: number, gigData: any) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.fiverrGigs || gigIndex >= user.fiverrGigs.length) {
        return { success: false, message: 'Gig not found' };
      }

      const updatedGig = {
        title: gigData.title,
        description: gigData.description || '',
        tags: gigData.tags || [],
        price: gigData.price,
        status: gigData.status || 'Active'
      };

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { [`fiverrGigs.${gigIndex}`]: updatedGig } },
        { new: true }
      );

      return {
        success: true,
        data: updatedUser?.fiverrGigs
      };
    } catch (error) {
      console.error('Error updating gig:', error);
      return { success: false, message: 'Failed to update gig' };
    }
  }

  async removeGig(userId: string, gigIndex: number) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.fiverrGigs || gigIndex >= user.fiverrGigs.length) {
        return { success: false, message: 'Gig not found' };
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $unset: { [`fiverrGigs.${gigIndex}`]: 1 } },
        { new: true }
      );

      // Clean up null values
      await User.findByIdAndUpdate(
        userId,
        { $pull: { fiverrGigs: null } },
        { new: true }
      );

      const finalUser = await User.findById(userId);
      return {
        success: true,
        data: finalUser?.fiverrGigs || []
      };
    } catch (error) {
      console.error('Error removing gig:', error);
      return { success: false, message: 'Failed to remove gig' };
    }
  }

  async getGigs(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      return {
        success: true,
        data: user.fiverrGigs || []
      };
    } catch (error) {
      console.error('Error fetching gigs:', error);
      return { success: false, message: 'Failed to fetch gigs' };
    }
  }

  private buildUserContext(user: IUser): string {
    const userContext: UserContext = {
      username: user.username,
      email: user.email,
      userType: user.userType,
      usageType: user.usageType,
      agencyName: user.agencyName,
      services: user.services,
      website: user.website,
      pricingPackages: user.pricingPackages,
      currentOffers: user.currentOffers,
      caseStudies: user.caseStudies,
      clientsServed: user.clientsServed,
      targetAudience: user.targetAudience,
      idealClientProfile: user.idealClientProfile,
      bigBrands: user.bigBrands,
      stepByStepProcess: user.stepByStepProcess,
      timelineToResults: user.timelineToResults,
      leadSources: user.leadSources,
      monthlyRevenue: user.monthlyRevenue,
      tier: user.tier,
      totalCredits: user.totalCredits || 0
    };

    let context = `User Information:\n`;
    context += `- Username: ${userContext.username}\n`;
    context += `- Email: ${userContext.email}\n`;
    context += `- User Type: ${userContext.userType}\n`;
    context += `- Usage Type: ${userContext.usageType}\n`;
    
    if (userContext.agencyName) {
      context += `- Agency Name: ${userContext.agencyName}\n`;
    }
    
    if (userContext.services && userContext.services.length > 0) {
      context += `- Services: ${userContext.services.map((s: any) => s.name).join(', ')}\n`;
    }
    
    if (userContext.website) {
      context += `- Website: ${userContext.website}\n`;
    }
    
    if (userContext.pricingPackages && userContext.pricingPackages.length > 0) {
      context += `- Pricing Packages: ${userContext.pricingPackages.map((p: any) => `${p.name}: ${p.price}`).join(', ')}\n`;
    }
    
    if (userContext.currentOffers && userContext.currentOffers.length > 0) {
      context += `- Current Offers: ${userContext.currentOffers.map((o: any) => o.name).join(', ')}\n`;
    }
    
    if (userContext.caseStudies) {
      context += `- Case Studies: ${userContext.caseStudies}\n`;
    }
    
    if (userContext.clientsServed) {
      context += `- Clients Served: ${userContext.clientsServed}\n`;
    }
    
    if (userContext.targetAudience) {
      context += `- Target Audience: ${userContext.targetAudience}\n`;
    }
    
    if (userContext.idealClientProfile) {
      context += `- Ideal Client Profile: ${userContext.idealClientProfile}\n`;
    }
    
    if (userContext.bigBrands) {
      context += `- Big Brands & Results: ${userContext.bigBrands}\n`;
    }
    
    if (userContext.stepByStepProcess && userContext.stepByStepProcess.length > 0) {
      context += `- Step-by-Step Process:\n`;
      userContext.stepByStepProcess.forEach((process: any) => {
        context += `  Package ${process.packageId}: ${process.steps.map((s: any) => s.description).join(' → ')}\n`;
      });
    }
    
    if (userContext.timelineToResults && userContext.timelineToResults.length > 0) {
      context += `- Timeline to Results:\n`;
      userContext.timelineToResults.forEach((timeline: any) => {
        context += `  Package ${timeline.packageId}: ${timeline.timeline}\n`;
      });
    }
    
    if (userContext.leadSources && userContext.leadSources.length > 0) {
      context += `- Lead Sources: ${userContext.leadSources.join(', ')}\n`;
    }
    
    if (userContext.monthlyRevenue) {
      context += `- Monthly Revenue: $${userContext.monthlyRevenue}\n`;
    }
    
    context += `- Tier: ${userContext.tier}\n`;
    context += `- Total Credits: ${userContext.totalCredits}\n\n`;
    
    return context;
  }
}