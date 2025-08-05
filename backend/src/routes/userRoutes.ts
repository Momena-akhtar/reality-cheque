import express from 'express';
import { UserService } from '../services/userService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const userService = UserService.getInstance();

// New routes for usage history - MUST be before /:id route
router.get('/usage-stats', authMiddleware, async (req, res): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    const timeRange = req.query.timeRange as '7d' | '30d' | '90d' || '30d';
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const result = await userService.getUserUsageStats(userId, timeRange);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/recent-activity', authMiddleware, async (req, res): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const result = await userService.getUserRecentActivity(userId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user token information
router.get('/token-info', authMiddleware, async (req, res): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const result = await userService.getUserTokenInfo(userId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error fetching token info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get("/:id", authMiddleware, async (req, res): Promise<any> => {
  const userId = req.params.id;
  try {
    const authenticatedUser = (req as any).user;
    if (authenticatedUser._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, _id, ...userData } = user.toObject();
    res.json({ id: _id, ...userData });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.put("/:id", authMiddleware, async (req, res): Promise<any> => {
  const userId = req.params.id;
  const updateData = req.body;
  try {
    const authenticatedUser = (req as any).user;
    if (authenticatedUser._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updatedUser = await userService.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found or update failed" });
    }
    
    const { password, _id, ...userData } = updatedUser.toObject();
    res.json({ id: _id, ...userData });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.delete("/:id", authMiddleware, async (req, res): Promise<any> => {
  const userId = req.params.id;
  try {
    const authenticatedUser = (req as any).user;
    if (authenticatedUser._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const success = await userService.deleteUser(userId);
    if (!success) {
      return res.status(404).json({ message: "User not found or deletion failed" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id/tier", authMiddleware, async (req, res): Promise<any> => {
  const userId = req.params.id;
  const { tier } = req.body;
  
  try {
    const authenticatedUser = (req as any).user;
    if (authenticatedUser._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (!["tier1", "tier2", "tier3"].includes(tier)) {
      return res.status(400).json({ message: "Invalid tier. Must be tier1, tier2, or tier3" });
    }
    
    const updatedUser = await userService.updateUserTier(userId, tier);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found or update failed" });
    }
    
    const { password, _id, ...userData } = updatedUser.toObject();
    res.json({ id: _id, ...userData });
  } catch (error) {
    console.error("Error updating user tier:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



export default router;