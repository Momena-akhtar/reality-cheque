import { Schema, Document } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  picture: string;
  tier: "tier1" | "tier2" | "tier3";
  totalCredits: number;
  usedCredits: number;
  agencyName?: string;
  services?: string;
  website?: string;
  pricingPackages?: string;
  caseStudies?: string;
  clientsServed?: number;
  targetAudience?: string;
  offer?: string;
  bigBrands?: string;
  stepByStepProcess?: string;
  timelineToResults?: string;
  leadSources?: string;
  monthlyRevenue?: number;
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
  tier: { 
    type: String, 
    enum: ["tier1", "tier2", "tier3"], 
    default: "tier1" 
  },

  totalCredits: {
    type: Number,
    default: 0.00, // No free credits on signup
  },
  usedCredits: {
    type: Number,
    default: 0.00, // No credits used initially
  },
  agencyName: {
    type: String,
    trim: true,
    default: ""
  },
  services: {
    type: String,
    trim: true,
    default: ""
  },
  website: {
    type: String,
    trim: true,
    default: ""
  },
  pricingPackages: {
    type: String,
    trim: true,
    default: ""
  },
  caseStudies: {
    type: String,
    trim: true,
    default: ""
  },
  clientsServed: {
    type: Number,
    default: 0
  },
  targetAudience: {
    type: String,
    trim: true,
    default: ""
  },
  offer: {
    type: String,
    trim: true,
    default: ""
  },
  bigBrands: {
    type: String,
    trim: true,
    default: ""
  },
  stepByStepProcess: {
    type: String,
    trim: true,
    default: ""
  },
  timelineToResults: {
    type: String,
    trim: true,
    default: ""
  },
  leadSources: {
    type: String,
    trim: true,
    default: ""
  },
  monthlyRevenue: {
    type: Number,
    default: 0
  }
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

