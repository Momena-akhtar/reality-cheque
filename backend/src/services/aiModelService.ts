import { Category, AIModel, Feature } from '../models/aimodel';

export class AIModelService {
    
    // Create a new category
    async createCategory(categoryData: {
        name: string;
        description: string;
    }) {
        try {
            const category = new Category(categoryData);
            return await category.save();
        } catch (error) {
            throw new Error(`Failed to create category: ${error}`);
        }
    }

    // Create a new feature
    async createFeature(featureData: {
        name: string;
        description: string;
        prompt: string;
        order: number;
        isOptional?: boolean;
    }) {
        try {
            const feature = new Feature(featureData);
            return await feature.save();
        } catch (error) {
            throw new Error(`Failed to create feature: ${error}`);
        }
    }

    // Create a new AI model with feature references
    async createModel(modelData: {
        name: string;
        description: string;
        categoryId: string;
        masterPrompt: string;
        featureIds: string[];
    }) {
        try {
            const model = new AIModel(modelData);
            return await model.save();
        } catch (error) {
            throw new Error(`Failed to create model: ${error}`);
        }
    }

    // Get all categories with their models
    async getCategoriesWithModels() {
        try {
            const categories = await Category.find({ isActive: true });
            
            // For each category, fetch its models
            const categoriesWithModels = await Promise.all(
                categories.map(async (category) => {
                    const models = await AIModel.find({ 
                        categoryId: category._id, 
                        isActive: true 
                    }).populate('featureIds');
                    
                    return {
                        ...category.toObject(),
                        models: models
                    };
                })
            );

            return categoriesWithModels;
        } catch (error) {
            throw new Error(`Failed to get categories with models: ${error}`);
        }
    }

    // Get categories with models filtered by user tier
    async getCategoriesWithModelsByTier(userTier: "tier1" | "tier2" | "tier3") {
        try {
            // Define tier hierarchy for filtering
            const tierHierarchy = {
                "tier1": ["tier1"],
                "tier2": ["tier1", "tier2"],
                "tier3": ["tier1", "tier2", "tier3"]
            };

            const allowedTiers = tierHierarchy[userTier];
            
            // Get categories that the user's tier can access
            const categories = await Category.find({ 
                isActive: true,
                tierAccess: { $in: allowedTiers }
            }).sort({ name: 1 });
            
            // For each category, fetch its models
            const categoriesWithModels = await Promise.all(
                categories.map(async (category) => {
                    const models = await AIModel.find({ 
                        categoryId: category._id, 
                        isActive: true 
                    }).populate('featureIds');
                    
                    return {
                        ...category.toObject(),
                        models: models
                    };
                })
            );

            return categoriesWithModels;
        } catch (error) {
            throw new Error(`Failed to get categories with models by tier: ${error}`);
        }
    }
    //Get all models
    async getAllModels(){
        try {
            const models = await AIModel.find().
            populate('categoryId').
            populate('featureIds')

            if (models.length === 0){
                throw new Error('No models found')
            }
            return models
        }
        catch (error){
            throw new Error('Failed to get models')
        }
    }
    // Get a specific model with its features
    async getModelById(modelId: string) {
        try {
            const model = await AIModel.findById(modelId)
                .populate('categoryId')
                .populate('featureIds');
            
            if (!model) {
                throw new Error('Model not found');
            }

            return model;
        } catch (error) {
            throw new Error(`Failed to get model: ${error}`);
        }
    }

    // Get models by category
    async getModelsByCategory(categoryId: string) {
        try {
            const models = await AIModel.find({ 
                categoryId, 
                isActive: true 
            })
            .populate('categoryId')
            .populate('featureIds');
            
            return models;
        } catch (error) {
            throw new Error(`Failed to get models by category: ${error}`);
        }
    }

    // Get all features
    async getAllFeatures() {
        try {
            const features = await Feature.find()
                .sort({ order: 1 });
            return features;
        } catch (error) {
            throw new Error(`Failed to get features: ${error}`);
        }
    }

    // Get features by IDs
    async getFeaturesByIds(featureIds: string[]) {
        try {
            const features = await Feature.find({ 
                _id: { $in: featureIds }
            }).sort({ order: 1 });
            return features;
        } catch (error) {
            throw new Error(`Failed to get features by IDs: ${error}`);
        }
    }

    // Generate master prompt from features
    generateMasterPrompt(basePrompt: string, features: Feature[]): string {
        const featurePrompts = features
            .sort((a, b) => a.order - b.order)
            .map(feature => feature.prompt)
            .join('\n\n');
        
        return `${basePrompt}\n\n${featurePrompts}`;
    }

    // Populate database with custom GPT data from the data file
    async populateCustomGPTData() {
        try {
            // Import the data
            const { customGPTData } = await import('../scripts/customGPTData');
            
            // Clear existing data
            await Category.deleteMany({});
            await Feature.deleteMany({});
            await AIModel.deleteMany({});

            console.log('Cleared existing data');

            // Create categories
            const categories = customGPTData.categories.map(cat => ({
                name: cat.name,
                description: cat.description
            }));

            const createdCategories = await Category.insertMany(categories);
            console.log(`Created ${createdCategories.length} categories`);

            const categoryMap = new Map(createdCategories.map(cat => [cat.name, cat._id]));

            // Process each model and its features
            let totalFeaturesCreated = 0;
            let totalModelsCreated = 0;

            for (const modelData of customGPTData.models) {
                // Create features for this model
                const features = modelData.features.map(feature => ({
                    name: feature.name,
                    description: feature.description,
                    prompt: feature.prompt,
                    order: feature.order,
                    isOptional: feature.isOptional || false
                }));

                const createdFeatures = await Feature.insertMany(features);
                totalFeaturesCreated += createdFeatures.length;

                // Create the model
                const categoryId = categoryMap.get(modelData.categoryName);
                if (!categoryId) {
                    console.warn(`Category not found for model: ${modelData.name}`);
                    continue;
                }

                const model = await this.createModel({
                    name: modelData.name,
                    description: modelData.description,
                    categoryId: categoryId.toString(),
                    masterPrompt: modelData.masterPrompt,
                    featureIds: createdFeatures.map(feature => feature._id.toString())
                });

                totalModelsCreated++;
                console.log(`Created model: ${model.name} with ${createdFeatures.length} features`);
            }

            return {
                message: "Database populated successfully",
                categoriesCreated: createdCategories.length,
                featuresCreated: totalFeaturesCreated,
                modelsCreated: totalModelsCreated
            };

        } catch (error) {
            throw new Error(`Failed to populate data: ${error}`);
        }
    }
}

export default new AIModelService(); 