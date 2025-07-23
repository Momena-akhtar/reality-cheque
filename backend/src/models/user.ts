import { Schema, Document } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  picture: string;
  plan: "free" | "pro" | "enterprise";
  creditsPerMonth?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
const userSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
 },
  password: { 
    type: String, 
    required: true
 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
 },
  picture: { 
    type: String, 
    default: "" 
 },
  plan: { 
    type: String, 
    enum: ["free", "pro", "enterprise"], 
    default: "free" 
},
  creditsPerMonth: {
    type: Number,
    default: 0,
},
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (!user.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);

