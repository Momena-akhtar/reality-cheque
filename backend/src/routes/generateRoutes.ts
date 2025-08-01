import express from 'express';
import generateService from '../services/generateService';
import { authMiddleware } from '../middleware/authMiddleware';
import Message from '../models/message';

const router = express.Router();

// Middleware to check user credits before processing requests
const checkCredits = async (req: any, res: any, next: any) => {
  try {
    const hasCredits = await generateService.checkUserCredits(req.user.id);
    if (!hasCredits) {
      return res.status(402).json({ 
        message: 'Insufficient credits. Please upgrade your plan.',
        error: 'INSUFFICIENT_CREDITS'
      });
    }
    next();
  } catch (error) {
    console.error('Error checking credits:', error);
    return res.status(500).json({ message: 'Error checking user credits' });
  }
};

// Generate response endpoint
router.post('/generate', authMiddleware, checkCredits, async (req, res): Promise<any> => {
  try {
    const { modelId, userInput, sessionId } = req.body;
    const userId = (req as any).user.id;

    // Validate required fields
    if (!modelId || !userInput) {
      return res.status(400).json({ 
        message: 'Model ID and user input are required' 
      });
    }

    // Generate response
    const result = await generateService.generateResponse({
      modelId,
      userInput,
      userId,
      sessionId
    });

    // Deduct credits based on actual cost
    await generateService.updateUserCredits(userId, result.cost || 0);

    res.json({
      success: true,
      data: result,
      message: 'Response generated successfully'
    });

  } catch (error) {
    console.error('Error in generate endpoint:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error',
      error: 'GENERATION_FAILED'
    });
  }
});



// Get session history
router.get('/session/:sessionId/history', authMiddleware, async (req, res): Promise<any> => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Validate session ownership (basic check - you might want to enhance this)
    if (!sessionId.startsWith(userId)) {  
      return res.status(403).json({ 
        message: 'Access denied to this session' 
      });
    }

    const history = await generateService.getSessionHistory(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        history
      },
      message: 'Session history retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({ 
      message: 'Error retrieving session history',
      error: 'HISTORY_RETRIEVAL_FAILED'
    });
  }
});

// Clear session
router.delete('/session/:sessionId', authMiddleware, async (req, res): Promise<any> => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Validate session ownership
    if (!sessionId.startsWith(userId)) {
      return res.status(403).json({ 
        message: 'Access denied to this session' 
      });
    }

    await generateService.clearSession(sessionId);

    res.json({
      success: true,
      message: 'Session cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ 
      message: 'Error clearing session',
      error: 'SESSION_CLEAR_FAILED'
    });
  }
});

// Get user credits
router.get('/credits', authMiddleware, async (req, res): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const hasCredits = await generateService.checkUserCredits(userId);

    // Get user details for credits info
    const User = require('mongoose').model('User');
    const user = await User.findById(userId).select('creditsPerMonth plan');

    res.json({
      success: true,
      data: {
        hasCredits,
        creditsRemaining: user?.creditsPerMonth || 0,
        plan: user?.plan || 'free',
        creditsInDollars: `$${(user?.creditsPerMonth || 0).toFixed(2)}`
      },
      message: 'Credits information retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting credits:', error);
    res.status(500).json({ 
      message: 'Error retrieving credits information',
      error: 'CREDITS_RETRIEVAL_FAILED'
    });
  }
});

// Get model information for generation
router.get('/model/:modelId', authMiddleware, async (req, res) : Promise<any> => {
  try {
    const { modelId } = req.params;
    
    const { AIModel, Feature } = require('../models/aimodel');
    const model = await AIModel.findById(modelId)
      .populate('categoryId')
      .populate('featureIds');

    if (!model) {
      return res.status(404).json({ 
        message: 'Model not found' 
      });
    }

    // Prepare response data
    const modelData = {
      id: model._id,
      name: model.name,
      description: model.description,
      category: model.categoryId,
      hasFeatures: model.featureIds && model.featureIds.length > 0,
      features: model.featureIds || [],
      masterPrompt: model.masterPrompt || null,
      isActive: model.isActive
    };

    res.json({
      success: true,
      data: modelData,
      message: 'Model information retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting model info:', error);
    res.status(500).json({ 
      message: 'Error retrieving model information',
      error: 'MODEL_INFO_RETRIEVAL_FAILED'
    });
  }
});

// Batch generate responses (for multiple inputs)
router.post('/batch-generate', authMiddleware, checkCredits, async (req, res) : Promise<any> => {
  try {
    const { modelId, inputs, sessionId } = req.body;
    const userId = (req as any).user.id;

    // Validate required fields
    if (!modelId || !inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({ 
        message: 'Model ID and array of inputs are required' 
      });
    }

    // Check if user has enough credits (we'll check after calculating actual costs)
    const User = require('mongoose').model('User');
    const user = await User.findById(userId);
    
    if (!user || user.creditsPerMonth <= 0.01) {
      return res.status(402).json({ 
        message: `Insufficient credits. Have $${user?.creditsPerMonth || 0}`,
        error: 'INSUFFICIENT_CREDITS'
      });
    }

    // Generate responses for all inputs
    const results = [];
    for (const input of inputs) {
      try {
        const result = await generateService.generateResponse({
          modelId,
          userInput: input,
          userId,
          sessionId: sessionId ? `${sessionId}_${Date.now()}` : undefined
        });
        results.push(result);
      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : 'Generation failed',
          input
        });
      }
    }

    // Deduct credits for successful generations based on actual costs
    const successfulResults = results.filter((r: any) => !r.error);
    const totalCost = successfulResults.reduce((sum: number, r: any) => sum + (r.cost || 0), 0);
    await generateService.updateUserCredits(userId, totalCost);

    res.json({
      success: true,
      data: {
        results,
        totalInputs: inputs.length,
        successfulGenerations: successfulResults.length,
        failedGenerations: results.filter((r: any) => r.error).length
      },
      message: 'Batch generation completed'
    });

  } catch (error) {
    console.error('Error in batch generate endpoint:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error',
      error: 'BATCH_GENERATION_FAILED'
    });
  }
});

export default router; 

// Chat Management Routes

// Get user's chat sessions
router.get('/chats', authMiddleware, async (req, res): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const chats = await generateService.getUserChats(userId);

    // Get message counts for each chat
    const chatsWithMessageCounts = await Promise.all(
      chats.map(async (chat: any) => {
        const messageCount = await Message.countDocuments({ chatId: chat.id });
        return {
          ...chat,
          messageCount
        };
      })
    );

    res.json({
      success: true,
      data: chatsWithMessageCounts,
      message: 'User chats retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({ 
      message: 'Error retrieving user chats',
      error: 'CHATS_RETRIEVAL_FAILED'
    });
  }
});

// Get chat history
router.get('/chat/:chatId/history', authMiddleware, async (req, res): Promise<any> => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.id;

    const history = await generateService.getChatHistory(chatId, userId);

    res.json({
      success: true,
      data: {
        chatId,
        messages: history
      },
      message: 'Chat history retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error retrieving chat history',
      error: 'CHAT_HISTORY_RETRIEVAL_FAILED'
    });
  }
});

// Clear chat session
router.delete('/chat/:chatId', authMiddleware, async (req, res): Promise<any> => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.id;

    await generateService.clearChat(chatId, userId);

    res.json({
      success: true,
      message: 'Chat cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error clearing chat',
      error: 'CHAT_CLEAR_FAILED'
    });
  }
});

// Get chat statistics
router.get('/chat/:chatId/stats', authMiddleware, async (req, res): Promise<any> => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.id;

    const stats = await generateService.getChatStats(chatId, userId);

    res.json({
      success: true,
      data: stats,
      message: 'Chat statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting chat stats:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error retrieving chat statistics',
      error: 'CHAT_STATS_RETRIEVAL_FAILED'
    });
  }
}); 

// Regenerate specific feature
router.post('/regenerate-feature', authMiddleware, checkCredits, async (req, res): Promise<any> => {
  try {
    const { modelId, featureName, userFeedback, currentResponse, chatId } = req.body;
    const userId = (req as any).user.id;

    // Validate required fields
    if (!modelId || !featureName || !userFeedback || !currentResponse || !chatId) {
      return res.status(400).json({ 
        message: 'Model ID, feature name, user feedback, current response, and chat ID are required' 
      });
    }

    // Regenerate feature
    const result = await generateService.regenerateFeature({
      modelId,
      featureName,
      userFeedback,
      currentResponse,
      chatId,
      userId
    });

    // Deduct credits based on actual cost
    await generateService.updateUserCredits(userId, result.cost || 0);

    res.json({
      success: true,
      data: result,
      message: 'Feature regenerated successfully'
    });

  } catch (error) {
    console.error('Error in regenerate feature endpoint:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error',
      error: 'FEATURE_REGENERATION_FAILED'
    });
  }
}); 