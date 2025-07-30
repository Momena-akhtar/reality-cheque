import express from 'express';
import aiModelService from '../services/aiModelService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Get all categories with their models
router.get('/categories', async (req, res) => {
    try {
        const categories = await aiModelService.getCategoriesWithModels();
        res.json({ success: true, data: categories });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

// Get models by category
router.get('/categories/:categoryId/models', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const models = await aiModelService.getModelsByCategory(categoryId);
        res.json({ success: true, data: models });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});
//Get all models
router.get('/models', async (req, res) => {
    try {
        const models = await aiModelService.getAllModels();
        res.json({ success: true, data: models})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message }); 
    }
} )
// Get specific model with features
router.get('/models/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;
        const model = await aiModelService.getModelById(modelId);
        res.json({ success: true, data: model });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

// Get all features
router.get('/features', async (req, res) => {
    try {
        const features = await aiModelService.getAllFeatures();
        res.json({ success: true, data: features });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

// Create new category (admin only)
router.post('/categories', authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await aiModelService.createCategory({
            name,
            description
        });
        res.json({ success: true, data: category });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

// Create new feature (admin only)
router.post('/features', authMiddleware, async (req, res) => {
    try {
        const { name, description, prompt, order, isOptional } = req.body;
        const feature = await aiModelService.createFeature({
            name,
            description,
            prompt,
            order,
            isOptional
        });
        res.json({ success: true, data: feature });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

// Create new model (admin only)
router.post('/models', authMiddleware, async (req, res) => {
    try {
        const { name, description, categoryId, masterPrompt, featureIds } = req.body;
        const model = await aiModelService.createModel({
            name,
            description,
            categoryId,
            masterPrompt,
            featureIds
        });
        res.json({ success: true, data: model });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

// Populate database with custom GPT data (admin only)
router.post('/populate', authMiddleware, async (req, res) => {
    try {
        const result = await aiModelService.populateCustomGPTData();
        res.json({ success: true, data: result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, error: message });
    }
});

export default router; 