import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  username: string;
  password: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
const adminSchema = new Schema<IAdmin>({
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
    trim: true }
}, {
  timestamps: true,
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
    const admin = this as IAdmin;
    if (!admin.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
        next();
    } catch (err) {
        next(err as Error);
    }
    });
    
// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
}
export default mongoose.models.Admin || mongoose.model<IAdmin>("Admin", adminSchema);