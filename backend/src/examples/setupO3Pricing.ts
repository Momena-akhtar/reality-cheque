import mongoose from 'mongoose';
import { AIModel } from '../models/aimodel';

// O3 Model Pricing (as of 2024)
const O3_PRICING = {
  inputCostPer1KTokens: 0.005,  // $0.005 per 1K input tokens
  outputCostPer1KTokens: 0.015  // $0.015 per 1K output tokens
};

async function setupO3Pricing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/menubot');
    console.log('Connected to MongoDB');

    // Find all AI models and update them with O3 pricing
    const models = await AIModel.find({});
    
    for (const model of models) {
      await AIModel.findByIdAndUpdate(model._id, {
        inputCostPer1KTokens: O3_PRICING.inputCostPer1KTokens,
        outputCostPer1KTokens: O3_PRICING.outputCostPer1KTokens
      });
      console.log(`Updated pricing for model: ${model.name}`);
    }

    console.log('O3 pricing setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up O3 pricing:', error);
    process.exit(1);
  }
}

// Run the setup
setupO3Pricing(); 