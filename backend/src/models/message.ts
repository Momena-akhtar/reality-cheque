import mongoose, {Schema, Document } from "mongoose";

export interface IMessage extends Document {
    role: "user" | "assistant";
    content: string;
    chatId: mongoose.Types.ObjectId;
    timestamp: Date;
    tokenCount: number;
    structuredResponse?: { [key: string]: string }; // For feature-based responses
    hasFeatures?: boolean;
    followUpQuestions?: string[]; // For follow-up questions
}

const messageSchema = new Schema<IMessage>({
  role: { 
    type: String, 
    required: true, 
    enum: ["user", "assistant", "system"] 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 50000 // Prevent excessively long messages
  },
  chatId: { 
  type: Schema.Types.ObjectId, 
  required: true, 
  ref: 'Chat',
  index: true
},
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true // For sorting messages by time
  },
  tokenCount: { 
    type: Number, 
    default: 0 
  },
  structuredResponse: {
    type: Schema.Types.Mixed, // Store JSON object for feature responses
    default: undefined
  },
  hasFeatures: {
    type: Boolean,
    default: false
  },
  followUpQuestions: {
    type: [String],
    default: undefined
  }
}, {
  timestamps: true,
});

export default mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);