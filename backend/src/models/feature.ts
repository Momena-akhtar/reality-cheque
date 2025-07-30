import mongoose, { Schema, Document } from "mongoose";

// Feature interface for specific generation tasks (i, ii, iii items)
export interface Feature extends Document {
    name: string;
    description: string;
    prompt: string;
    order: number;
    isOptional: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Feature Schema
const featureSchema = new Schema<Feature>({
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
    prompt: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    isOptional: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Create indexes for better performance
featureSchema.index({ order: 1 });

// Export model
export const Feature = mongoose.models.Feature || mongoose.model<Feature>("Feature", featureSchema); 