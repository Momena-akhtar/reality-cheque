import mongoose, {Schema, Document } from "mongoose";

export interface AIModel extends Document {
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

const modelSchema = new Schema<AIModel>({
    name: { 
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true, 
        trim: true },
}, {
    timestamps: true,
});
export default mongoose.models.Model || mongoose.model<AIModel>("AIModel", modelSchema);