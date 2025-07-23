import mongoose, {Schema, Document } from "mongoose";

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  modelId: mongoose.Types.ObjectId;
  title: string;  //first message preview
  isActive: boolean;
  lastActivity: Date;
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
  recalculateTotalTokens(): Promise<void>;
  getMessages(): Promise<mongoose.Document[]>;
}

const chatSchema = new Schema<IChat>({
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    ref: 'User',
    index: true // Index for efficient user queries
  },
  modelId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    ref: 'AIModel' 
  },
  title: { 
    type: String, 
    required: true,
    minlength: 1,
    maxlength: 200,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now,
    index: true // For sorting by recent activity
  },
  totalTokens: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

chatSchema.index({ userId: 1, lastActivity: -1 });
chatSchema.index({ userId: 1, isActive: 1 });

chatSchema.methods.recalculateTotalTokens = async function () {
  const Message = mongoose.model('Message');
  const messages = await Message.find({ chatId: this._id }, 'tokenCount').lean();
  this.totalTokens = messages.reduce((sum: number, msg: any) => sum + (msg.tokenCount || 0), 0);
};

chatSchema.methods.getMessages = async function () {
  const Message = mongoose.model('Message');
  return Message.find({ chatId: this._id }).sort({ timestamp: 1 });
};

export default mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);
