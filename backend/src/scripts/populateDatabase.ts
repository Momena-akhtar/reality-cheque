import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { customGPTData } from './customGPTData';
import { Category, Feature, AIModel } from '../models/aimodel';

// Load environment variables
const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${nodeEnv}` });

// Database connection function
async function connectToDb() {
    try {
        const mongoUri = "mongodb://localhost:27017/menubot";
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

// Disconnect from database
async function disconnectFromDb() {
    try {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
    }
}

// Main population function
async function populateDatabase() {
    try {
        console.log('🚀 Starting database population...');
        
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Category.deleteMany({});
        await Feature.deleteMany({});
        await AIModel.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create categories
        console.log('📂 Creating categories...');
        const categories = customGPTData.categories.map(cat => ({
            name: cat.name,
            description: cat.description
        }));

        const createdCategories = await Category.insertMany(categories);
        console.log(`✅ Created ${createdCategories.length} categories`);

        // Create a map for quick category lookup
        const categoryMap = new Map(createdCategories.map(cat => [cat.name, cat._id]));

        // Process each model and its features
        let totalFeaturesCreated = 0;
        let totalModelsCreated = 0;

        console.log('🔧 Processing models and features...');
        
        for (const modelData of customGPTData.models) {
            console.log(`\n📝 Processing model: ${modelData.name}`);
            
            // Create features for this model (only if features exist)
            let createdFeatures = [];
            if (modelData.features && modelData.features.length > 0) {
                const features = modelData.features.map(feature => ({
                    name: feature.name,
                    description: feature.description,
                    prompt: feature.prompt,
                    order: feature.order,
                    isOptional: feature.isOptional || false
                }));

                createdFeatures = await Feature.insertMany(features);
                totalFeaturesCreated += createdFeatures.length;
                console.log(`  ✅ Created ${createdFeatures.length} features`);
            } else {
                console.log(`  ℹ️  No features for this model`);
            }

            // Create the model
            const categoryId = categoryMap.get(modelData.categoryName);
            if (!categoryId) {
                console.warn(`⚠️  Category not found for model: ${modelData.name}`);
                continue;
            }

            const model = await AIModel.create({
                name: modelData.name,
                description: modelData.description,
                categoryId: categoryId,
                masterPrompt: modelData.masterPrompt,
                featureIds: createdFeatures.map(feature => feature._id)
            });

            totalModelsCreated++;
            console.log(`  ✅ Created model: ${model.name}`);
        }

        // Summary
        console.log('\n🎉 Database population completed successfully!');
        console.log('📊 Summary:');
        console.log(`  • Categories created: ${createdCategories.length}`);
        console.log(`  • Features created: ${totalFeaturesCreated}`);
        console.log(`  • Models created: ${totalModelsCreated}`);
        
        // Show some sample data
        console.log('\n📋 Sample data:');
        const sampleCategories = await Category.find().limit(3);
        console.log('  Categories:', sampleCategories.map(c => c.name));
        
        const sampleModels = await AIModel.find().populate('categoryId').limit(3);
        console.log('  Models:', sampleModels.map(m => `${m.name} (${m.categoryId.name})`));

    } catch (error) {
        console.error('❌ Error populating database:', error);
        throw error;
    }
}

// Run the script
async function main() {
    try {
        await connectToDb();
        await populateDatabase();
        console.log('\n✅ Database population script completed successfully!');
    } catch (error) {
        console.error('❌ Database population script failed:', error);
        process.exit(1);
    } finally {
        await disconnectFromDb();
        process.exit(0);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

export { populateDatabase }; 