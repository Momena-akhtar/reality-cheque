import { Schema, Document } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  tier: "tier1" | "tier2" | "tier3";
  totalCredits: number;
  usedCredits: number;
  // User type fields
  userType: "agency" | "freelancer";
  usageType: "personal" | "clients";
  // Agency/Freelancer specific fields
  agencyName?: string;
  services?: Array<{
    name: string;
    description?: string;
  }>;
  website?: string;
  pricingPackages?: Array<{
    name: string;
    price: string;
    description?: string;
  }>;
  currentOffers?: Array<{
    name: string;
    description?: string;
    packageId?: string;
  }>;
  stepByStepProcess?: Array<{
    packageId: string;
    steps: Array<{
      order: number;
      description: string;
    }>;
  }>;
  timelineToResults?: Array<{
    packageId: string;
    timeline: string;
  }>;
  caseStudies?: string;
  clientsServed?: number;
  targetAudience?: string;
  idealClientProfile?: string;
  bigBrands?: string;
  leadSources?: Array<string>;
  monthlyRevenue?: number;
  fiverrGigs: Array<{
    title: string;
    description: string;
    tags: Array<string>;
    price: string;
    status: string;
  }>;
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
  tier: { 
    type: String, 
    enum: ["tier1", "tier2", "tier3"], 
    default: "tier1" 
  },
  totalCredits: {
    type: Number,
    default: 0.00,
  },
  usedCredits: {
    type: Number,
    default: 0.00,
  },
  // New user type fields
  userType: {
    type: String,
    enum: ["agency", "freelancer"],
    required: true
  },
  usageType: {
    type: String,
    enum: ["personal", "clients"],
    required: true
  },
  // Updated agency/freelancer fields
  agencyName: {
    type: String,
    trim: true,
    default: ""
  },
  services: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  website: {
    type: String,
    trim: true,
    default: ""
  },
  pricingPackages: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  currentOffers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    packageId: {
      type: String,
      trim: true
    }
  }],
  stepByStepProcess: [{
    packageId: {
      type: String,
      required: true,
      trim: true
    },
    steps: [{
      order: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        required: true,
        trim: true
      }
    }]
  }],
  timelineToResults: [{
    packageId: {
      type: String,
      required: true,
      trim: true
    },
    timeline: {
      type: String,
      required: true,
      trim: true
    }
  }],
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
  idealClientProfile: {
    type: String,
    trim: true,
    default: ""
  },
  bigBrands: {
    type: String,
    trim: true,
    default: ""
  },
  leadSources: [{
    type: String,
    enum: [
      "Upwork",
      "Fiverr", 
      "Linkedin",
      "Cold Email",
      "B2B/Other Agencies",
      "SEO",
      "Social Media (FB, IG, etc)",
      "Google Ads",
      "Meta Ads",
      "Influencers",
      "Conferences",
      "Others"
    ]
  }],
  monthlyRevenue: {
    type: Number,
    default: 0
  },
  fiverrGigs: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      trim: true
    },
    price: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      required: true,
      trim: true
    }
  }]
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

