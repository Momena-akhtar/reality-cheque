import mongoose, { Schema, Document } from "mongoose";

// Category interface for main categories (1, 2, 3 items)
export interface Category extends Document {
    name: string;
    description: string;
    isActive: boolean;
    tierAccess: "tier1" | "tier2" | "tier3"; // Which tier is required to access this category
    createdAt: Date;
    updatedAt: Date;
}

// Category Schema
const categorySchema = new Schema<Category>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tierAccess: {
        type: String,
        enum: ["tier1", "tier2", "tier3"],
        required: true,
        default: "tier1"
    }
}, {
    timestamps: true
});

// Create indexes for better performance
categorySchema.index({ isActive: 1, tierAccess: 1 });

// Export model
export const Category = mongoose.models.Category || mongoose.model<Category>("Category", categorySchema); 