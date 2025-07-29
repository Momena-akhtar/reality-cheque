import express from 'express';
import { AdminService } from '../services/adminService';
import { authMiddleware } from '../middleware/authMiddleware';
import User from '../models/user';
import Chat from '../models/chat';
import Message from '../models/message';

const adminRouter: express.Router = express.Router();

const adminLoginHandler: express.RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }
  
  const result = await AdminService.getInstance().authenticateAdmin(email, password);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json({ message: result.message });
  }
};

const adminLogoutHandler: express.RequestHandler = async (req, res) => {
  // For session-based auth, we just return success
  // The frontend will clear the token
  res.json({ message: 'Admin logout successful' });
};

const adminRefreshHandler: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  
  const result = await AdminService.getInstance().refreshAdminToken(admin._id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json({ message: result.message });
  }
};

const getAdminInfo: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  
  const adminData = await AdminService.getInstance().getAdminById(admin._id);
  
  if (adminData) {
    res.json(adminData);
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
};

const getAdminStats: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const totalUsers = await User.countDocuments();
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();
    
    // Calculate revenue (this would need to be implemented based on your payment system)
    const revenue = 0; // Placeholder
    
    // Get active users (users who have chatted in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      updatedAt: { $gte: thirtyDaysAgo }
    });
    
    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    res.json({
      totalUsers,
      totalChats,
      totalMessages,
      revenue,
      activeUsers,
      newUsersThisMonth
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// Placeholder handlers for prompts (you'll need to implement these based on your prompt model)
const getPrompts: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    // This is a placeholder - you'll need to implement based on your prompt model
    res.json([]);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ message: 'Failed to fetch prompts' });
  }
};

const createPrompt: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    // This is a placeholder - you'll need to implement based on your prompt model
    res.status(201).json({ message: 'Prompt created' });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ message: 'Failed to create prompt' });
  }
};

const updatePrompt: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    // This is a placeholder - you'll need to implement based on your prompt model
    res.json({ message: 'Prompt updated' });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ message: 'Failed to update prompt' });
  }
};

const deletePrompt: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    // This is a placeholder - you'll need to implement based on your prompt model
    res.json({ message: 'Prompt deleted' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ message: 'Failed to delete prompt' });
  }
};

// Voucher Management Handlers
const createVoucher: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const voucherData = {
      ...req.body,
      createdBy: admin.id
    };

    const result = await AdminService.getInstance().createVoucher(voucherData);
    
    if (result.success) {
      res.status(201).json(result.voucher);
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllVouchers: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const result = await AdminService.getInstance().getAllVouchers();
    
    if (result.success) {
      res.json(result.vouchers);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getVoucherById: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { id } = req.params;
    const result = await AdminService.getInstance().getVoucherById(id);
    
    if (result.success) {
      res.json(result.voucher);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error fetching voucher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateVoucher: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { id } = req.params;
    const result = await AdminService.getInstance().updateVoucher(id, req.body);
    
    if (result.success) {
      res.json(result.voucher);
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error updating voucher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteVoucher: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { id } = req.params;
    const result = await AdminService.getInstance().deleteVoucher(id);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getVoucherStats: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const result = await AdminService.getInstance().getVoucherStats();
    
    if (result.success) {
      res.json(result.stats);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error fetching voucher stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const generateVoucherCode: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const result = await AdminService.getInstance().generateVoucherCode();
    
    if (result.success) {
      res.json({ code: result.code });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error generating voucher code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin routes (protected by global auth middleware)
adminRouter.post('/login', adminLoginHandler);
adminRouter.post('/logout', adminLogoutHandler);
adminRouter.post('/refresh', authMiddleware, adminRefreshHandler);
adminRouter.get('/me', authMiddleware, getAdminInfo);

// Stats and management routes
adminRouter.get('/stats', authMiddleware, getAdminStats);

// Prompt management routes (placeholders)
adminRouter.get('/prompts', authMiddleware, getPrompts);
adminRouter.post('/prompts', authMiddleware, createPrompt);
adminRouter.put('/prompts/:id', authMiddleware, updatePrompt);
adminRouter.delete('/prompts/:id', authMiddleware, deletePrompt);

// Voucher management routes
adminRouter.post('/vouchers', authMiddleware, createVoucher);
adminRouter.get('/vouchers', authMiddleware, getAllVouchers);
adminRouter.get('/vouchers/:id', authMiddleware, getVoucherById);
adminRouter.put('/vouchers/:id', authMiddleware, updateVoucher);
adminRouter.delete('/vouchers/:id', authMiddleware, deleteVoucher);
adminRouter.get('/vouchers/stats', authMiddleware, getVoucherStats);
adminRouter.get('/vouchers/generate-code', authMiddleware, generateVoucherCode);

export default adminRouter; 