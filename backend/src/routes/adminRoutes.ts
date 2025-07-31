import express from 'express';
import { AdminService } from '../services/adminService';
import { authMiddleware } from '../middleware/authMiddleware';
import User from '../models/user';
import Chat from '../models/chat';
import Message from '../models/message';
import { AIModel, Feature } from '../models/aimodel';
import { Category } from '../models/category';

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

// AI Models and Features Management Handlers
const getModels: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const models = await AIModel.find()
      .populate('categoryId', 'name')
      .populate('featureIds', 'name description prompt order isOptional')
      .sort({ createdAt: -1 });

    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ message: 'Failed to fetch models' });
  }
};

const getFeatures: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const features = await Feature.find().sort({ order: 1 });
    res.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ message: 'Failed to fetch features' });
  }
};

const updateModelPrompt: express.RequestHandler = async (req, res): Promise<any> => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { modelId, masterPrompt } = req.body;
    
    if (!modelId || !masterPrompt) {
      return res.status(400).json({ message: 'Model ID and master prompt are required' });
    }

    const model = await AIModel.findByIdAndUpdate(
      modelId,
      { masterPrompt },
      { new: true }
    ).populate('categoryId', 'name');

    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    res.json({ success: true, data: model });
  } catch (error) {
    console.error('Error updating model prompt:', error);
    res.status(500).json({ message: 'Failed to update model prompt' });
  }
};

const updateFeaturePrompt: express.RequestHandler = async (req, res): Promise<any> => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { featureId, prompt } = req.body;
    
    if (!featureId || !prompt) {
      return res.status(400).json({ message: 'Feature ID and prompt are required' });
    }

    const feature = await Feature.findByIdAndUpdate(
      featureId,
      { prompt },
      { new: true }
    );

    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    res.json({ success: true, data: feature });
  } catch (error) {
    console.error('Error updating feature prompt:', error);
    res.status(500).json({ message: 'Failed to update feature prompt' });
  }
};

const createFeature: express.RequestHandler = async (req, res): Promise<any> => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { name, description, prompt, order, isOptional } = req.body;
    
    if (!name || !description || !prompt) {
      return res.status(400).json({ message: 'Name, description, and prompt are required' });
    }

    const feature = new Feature({
      name,
      description,
      prompt,
      order: order || 0,
      isOptional: isOptional || false
    });

    await feature.save();
    res.status(201).json({ success: true, data: feature });
  } catch (error) {
    console.error('Error creating feature:', error);
    res.status(500).json({ message: 'Failed to create feature' });
  }
};

const updateFeature: express.RequestHandler = async (req, res): Promise<any> => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { featureId } = req.params;
    const { name, description, prompt, order, isOptional } = req.body;

    const feature = await Feature.findByIdAndUpdate(
      featureId,
      { name, description, prompt, order, isOptional },
      { new: true }
    );

    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    res.json({ success: true, data: feature });
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({ message: 'Failed to update feature' });
  }
};

const deleteFeature: express.RequestHandler = async (req, res) : Promise<any> => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { featureId } = req.params;

    // Check if feature is being used by any models
    const modelsUsingFeature = await AIModel.find({ featureIds: featureId });
    if (modelsUsingFeature.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete feature. It is being used by models.',
        models: modelsUsingFeature.map(m => ({ id: m._id, name: m.name }))
      });
    }

    const feature = await Feature.findByIdAndDelete(featureId);
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    res.json({ success: true, message: 'Feature deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature:', error);
    res.status(500).json({ message: 'Failed to delete feature' });
  }
};

// Chat Management Handlers
const getAllChats: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { page = 1, limit = 20, userId, modelId, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (modelId) {
      query.modelId = modelId;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'user.username': { $regex: search, $options: 'i' } },
        { 'model.name': { $regex: search, $options: 'i' } }
      ];
    }

    const chats = await Chat.find(query)
      .populate('userId', 'username email')
      .populate('modelId', 'name description')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Chat.countDocuments(query);

    res.json({
      chats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
};

const getChatDetails: express.RequestHandler = async (req, res): Promise<any> => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('userId', 'username email plan')
      .populate('modelId', 'name description categoryId')
      .populate('modelId.categoryId', 'name');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({ chatId })
      .sort({ timestamp: 1 });

    res.json({
      chat,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat details:', error);
    res.status(500).json({ message: 'Failed to fetch chat details' });
  }
};

const getChatStats: express.RequestHandler = async (req, res) => {
  const admin = (req as any).admin;
  if (!admin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  try {
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();
    
    // Chats by model
    const chatsByModel = await Chat.aggregate([
      {
        $group: {
          _id: '$modelId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'aimodels',
          localField: '_id',
          foreignField: '_id',
          as: 'model'
        }
      },
      {
        $unwind: '$model'
      },
      {
        $project: {
          modelName: '$model.name',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Recent activity
    const recentChats = await Chat.find()
      .populate('userId', 'username')
      .populate('modelId', 'name')
      .sort({ lastActivity: -1 })
      .limit(10);

    res.json({
      totalChats,
      totalMessages,
      chatsByModel,
      recentChats
    });
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ message: 'Failed to fetch chat stats' });
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

// AI Models and Features management routes
adminRouter.get('/models', authMiddleware, getModels);
adminRouter.get('/features', authMiddleware, getFeatures);
adminRouter.put('/models/prompt', authMiddleware, updateModelPrompt);
adminRouter.put('/features/prompt', authMiddleware, updateFeaturePrompt);
adminRouter.post('/features', authMiddleware, createFeature);
adminRouter.put('/features/:featureId', authMiddleware, updateFeature);
adminRouter.delete('/features/:featureId', authMiddleware, deleteFeature);

// Chat management routes
adminRouter.get('/chats', authMiddleware, getAllChats);
adminRouter.get('/chats/:chatId', authMiddleware, getChatDetails);
adminRouter.get('/chats/stats', authMiddleware, getChatStats);

// Voucher management routes
adminRouter.post('/vouchers', authMiddleware, createVoucher);
adminRouter.get('/vouchers', authMiddleware, getAllVouchers);
adminRouter.get('/vouchers/:id', authMiddleware, getVoucherById);
adminRouter.put('/vouchers/:id', authMiddleware, updateVoucher);
adminRouter.delete('/vouchers/:id', authMiddleware, deleteVoucher);
adminRouter.get('/vouchers/stats', authMiddleware, getVoucherStats);
adminRouter.get('/vouchers/generate-code', authMiddleware, generateVoucherCode);

export default adminRouter; 