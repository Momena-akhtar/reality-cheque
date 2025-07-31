import mongoose, { Schema, Document } from "mongoose";
import { Category } from "./category";
import { Feature } from "./feature";

// Model interface for actual GPT models (a, b, c items)
export interface AIModel extends Document {
    name: string;
    description: string;
    categoryId: mongoose.Types.ObjectId;
    masterPrompt: string;
    featureIds: mongoose.Types.ObjectId[]; // References to features
    isActive: boolean;
    inputCostPer1KTokens?: number; // Cost per 1K input tokens in dollars
    outputCostPer1KTokens?: number; // Cost per 1K output tokens in dollars
    createdAt: Date;
    updatedAt: Date;
}

// Model Schema
const modelSchema = new Schema<AIModel>({
    name: { 
        type: String,
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true, 
        trim: true
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    masterPrompt: {
        type: String,
        required: true,
        trim: true
    },
    featureIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Feature'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    inputCostPer1KTokens: {
        type: Number,
        default: 0.005, // Default O3 input cost: $0.005 per 1K tokens
    },
    outputCostPer1KTokens: {
        type: Number,
        default: 0.015, // Default O3 output cost: $0.015 per 1K tokens
    }
}, {
    timestamps: true
});

// Create indexes for better performance
modelSchema.index({ categoryId: 1, isActive: 1 });

// Export model
export const AIModel = mongoose.models.AIModel || mongoose.model<AIModel>("AIModel", modelSchema);

// Re-export Category and Feature for convenience
export { Category, Feature };

// Default export for backward compatibility
export default AIModel;