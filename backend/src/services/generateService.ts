import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { AIModel, Feature } from "../models/aimodel";
import { IUser } from "../models/user";
import Chat from "../models/chat";
import Message from "../models/message";
import mongoose from "mongoose";
import {
  GenerateRequest,
  GenerateResponse,
  FeaturePrompt,
  UserContext,
  GenerateServiceConfig,
  RegenerateFeatureRequest,
  RegenerateFeatureResponse
} from "../types/generate";

class GenerateService {
  private memoryStore: Map<string, BufferMemory> = new Map();
  private openai: ChatOpenAI;
  private lastTokenUsage: { inputTokens: number; outputTokens: number } = { inputTokens: 0, outputTokens: 0 };

  constructor() {
    this.openai = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o", // Using O3 model
      temperature: 0.7,
      callbacks: [
        {
          handleLLMEnd: (output) => {
            if (output.llmOutput?.tokenUsage) {
              this.lastTokenUsage = {
                inputTokens: output.llmOutput.tokenUsage.promptTokens || 0,
                outputTokens: output.llmOutput.tokenUsage.completionTokens || 0
              };
            }
          }
        }
      ]
    });
  }

  // Calculate cost based on token usage
  private calculateCost(inputTokens: number, outputTokens: number, model: any): number {
    const inputCost = (inputTokens / 1000) * (model.inputCostPer1KTokens || 0.005);
    const outputCost = (outputTokens / 1000) * (model.outputCostPer1KTokens || 0.015);
    return inputCost + outputCost;
  }

  // Get or create chat session
  private async getOrCreateChat(userId: string, modelId: string, sessionId?: string): Promise<any> {
    if (sessionId) {
      // Try to find existing chat by sessionId
      const existingChat = await Chat.findOne({ 
        userId, 
        modelId,
        _id: sessionId 
      });
      if (existingChat) {
        return existingChat;
      }
    }

    // Create new chat session
    const newChat = new Chat({
      userId,
      modelId,
      title: "New Conversation", // Will be updated with first message
      isActive: true,
      lastActivity: new Date(),
      totalTokens: 0
    });

    return await newChat.save();
  }

  // Save message to database
  private async saveMessage(
    chatId: string, 
    role: "user" | "assistant", 
    content: string, 
    tokenCount: number,
    structuredResponse?: { [key: string]: string },
    hasFeatures?: boolean
  ): Promise<void> {
    const message = new Message({
      role,
      content,
      chatId,
      timestamp: new Date(),
      tokenCount,
      structuredResponse,
      hasFeatures
    });

    await message.save();

    // Update chat's total tokens and last activity
    await Chat.findByIdAndUpdate(chatId, {
      $inc: { totalTokens: tokenCount },
      lastActivity: new Date()
    });
  }

  // Update chat title with first message preview
  private async updateChatTitle(chatId: string, firstMessage: string): Promise<void> {
    const title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + "..." : firstMessage;
    await Chat.findByIdAndUpdate(chatId, { title });
  }

  private getMemory(sessionId: string): BufferMemory {
    if (!this.memoryStore.has(sessionId)) {
      this.memoryStore.set(sessionId, new BufferMemory({
        returnMessages: true,
        memoryKey: "history",
      }));
    }
    return this.memoryStore.get(sessionId)!;
  }

  private buildUserContext(user: IUser): string {
    const userContext: UserContext = {
      username: user.username,
      email: user.email,
      agencyName: user.agencyName,
      offer: user.offer,
      caseStudies: user.caseStudies,
      servicePricing: user.servicePricing,
      tier: user.tier,
      creditsPerMonth: user.creditsPerMonth || 0
    };

    let context = `User Information:\n`;
    context += `- Username: ${userContext.username}\n`;
    context += `- Email: ${userContext.email}\n`;
    
    if (userContext.agencyName) {
      context += `- Agency Name: ${userContext.agencyName}\n`;
    }
    
    if (userContext.offer) {
      context += `- Offer: ${userContext.offer}\n`;
    }
    
    if (userContext.caseStudies) {
      context += `- Case Studies: ${userContext.caseStudies}\n`;
    }
    
    if (userContext.servicePricing) {
      context += `- Service Pricing: ${userContext.servicePricing}\n`;
    }
    
    context += `- Tier: ${userContext.tier}\n`;
    context += `- Credits per month: ${userContext.creditsPerMonth}\n\n`;
    
    return context;
  }

  private async buildPromptWithFeatures(
    model: any,
    features: Feature[],
    userContext: string,
    userInput: string
  ): Promise<string> {
    // Create feature prompts object
    const featurePrompts: FeaturePrompt = {};
    
    // Sort features by order
    const sortedFeatures = features.sort((a, b) => a.order - b.order);
    
    // Build feature prompts
    sortedFeatures.forEach(feature => {
      featurePrompts[feature.name] = feature.prompt;
    });

    let prompt = `Model Information:\n`;
    prompt += `- Name: ${model.name}\n`;
    prompt += `- Description: ${model.description}\n\n`;
    
    prompt += `User Context:\n${userContext}\n`;
    
    prompt += `Available Features and their prompts:\n`;
    Object.entries(featurePrompts).forEach(([featureName, featurePrompt]) => {
      prompt += `- ${featureName}: ${featurePrompt}\n`;
    });
    
    // Handle empty user input
    if (!userInput || userInput.trim() === '') {
      prompt += `\nUser Input: [No specific instructions provided]\n\n`;
      prompt += `Since no specific instructions were provided, please generate a generic but high-quality response based on this model's purpose. `;
      prompt += `Use the user's agency information to personalize the content appropriately. `;
      prompt += `Create content that would be useful and relevant for the user's business context.\n\n`;
    } else {
      prompt += `\nUser Input: ${userInput}\n\n`;
      prompt += `Please generate a response based on the user's specific input and the available features. `;
      prompt += `Use the user's agency information to personalize the response. `;
      prompt += `If the user is asking for specific content generation, use the appropriate feature prompts to guide your response.\n\n`;
    }
    
    prompt += `IMPORTANT: Your response must be a valid JSON object where each key is a feature name and each value is the generated content for that feature. `;
    prompt += `For example: {"Primary Headline": "Your headline here", "Subheadline": "Your subheadline here"}\n\n`;
    prompt += `Response (JSON only):`;

    return prompt;
  }

  private async buildRegenerateFeaturePrompt(
    model: any,
    featureName: string,
    userFeedback: string,
    currentResponse: any,
    userContext: string
  ): Promise<string> {
    let prompt = `Model Information:\n`;
    prompt += `- Name: ${model.name}\n`;
    prompt += `- Description: ${model.description}\n\n`;
    
    prompt += `User Context:\n${userContext}\n`;
    
    prompt += `Current Response:\n${JSON.stringify(currentResponse, null, 2)}\n\n`;
    
    prompt += `User wants to regenerate ONLY the "${featureName}" section with this feedback: "${userFeedback}"\n\n`;
    prompt += `Please regenerate ONLY the "${featureName}" section while keeping ALL other sections exactly the same. `;
    prompt += `Your response must be a valid JSON object with the same structure as the current response, `;
    prompt += `but with only the "${featureName}" section updated based on the user's feedback.\n\n`;
    prompt += `Response (JSON only):`;

    return prompt;
  }

  private async buildPromptWithoutFeatures(
    model: any,
    userContext: string,
    userInput: string
  ): Promise<string> {
    let prompt = `Model Information:\n`;
    prompt += `- Name: ${model.name}\n`;
    prompt += `- Description: ${model.description}\n`;
    prompt += `- Master Prompt: ${model.masterPrompt}\n\n`;
    
    prompt += `User Context:\n${userContext}\n`;
    
    // Handle empty user input
    if (!userInput || userInput.trim() === '') {
      prompt += `User Input: [No specific instructions provided]\n\n`;
      prompt += `Since no specific instructions were provided, please generate a generic but high-quality response based on this model's purpose and master prompt. `;
      prompt += `Use the user's agency information to personalize the content appropriately. `;
      prompt += `Create content that would be useful and relevant for the user's business context.\n\n`;
    } else {
      prompt += `User Input: ${userInput}\n\n`;
      prompt += `Please generate a response based on the master prompt and user input. `;
      prompt += `Use the user's agency information to personalize the response.\n\n`;
    }
    
    prompt += `Response:`;

    return prompt;
  }

  async generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const { modelId, userInput, userId, sessionId } = request;
      
      // Get or create chat session
      const chat = await this.getOrCreateChat(userId, modelId, sessionId);
      const currentSessionId = chat._id.toString();
      
      // Get memory for this session
      const memory = this.getMemory(currentSessionId);
      
      // Fetch model and user data
      const model = await AIModel.findById(modelId).populate('categoryId');
      if (!model) {
        throw new Error('Model not found');
      }

      // Fetch user data
      const User = mongoose.model('User');
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Build user context
      const userContext = this.buildUserContext(user);
      
      let prompt: string;
      let features: Feature[] = [];
      let hasFeatures = false;

      // Check if model has features
      if (model.featureIds && model.featureIds.length > 0) {
        // Fetch features
        features = await Feature.find({ _id: { $in: model.featureIds } });
        prompt = await this.buildPromptWithFeatures(model, features, userContext, userInput);
        hasFeatures = true;
      } else {
        // Use master prompt
        prompt = await this.buildPromptWithoutFeatures(model, userContext, userInput);
      }

      // Create conversation chain with memory
      const chain = new ConversationChain({
        llm: this.openai,
        memory: memory,
      });

      // Generate response
      const response = await chain.call({
        input: prompt,
      });

      // Get token usage from the callback
      const inputTokens = this.lastTokenUsage.inputTokens;
      const outputTokens = this.lastTokenUsage.outputTokens;
      const cost = this.calculateCost(inputTokens, outputTokens, model);

      const responseText = response.response as string;

      // Parse structured response if model has features
      let structuredResponse = undefined;
      if (hasFeatures) {
        try {
          // Try to extract JSON from the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            structuredResponse = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: create a simple structure with the full response
            structuredResponse = { "Complete Response": responseText };
          }
        } catch (error) {
          console.error('Error parsing structured response:', error);
          // Fallback: create a simple structure with the full response
          structuredResponse = { "Complete Response": responseText };
        }
      }

      // Save user message to database only if userInput is not empty
      if (userInput && userInput.trim() !== '') {
        await this.saveMessage(chat._id, "user", userInput, inputTokens);
      }

      // Save assistant response to database
      await this.saveMessage(chat._id, "assistant", responseText, outputTokens, structuredResponse, hasFeatures);

      // Update chat title with first message if this is a new chat
      if (chat.title === "New Conversation") {
        const titleText = userInput && userInput.trim() !== '' ? userInput : `${model.name} Generation`;
        await this.updateChatTitle(chat._id, titleText);
      }

      return {
        response: responseText,
        sessionId: currentSessionId,
        chatId: chat._id,
        modelName: model.name,
        features: features.map(f => f.name),
        cost: cost,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        structuredResponse,
        hasFeatures,
      };

    } catch (error) {
      console.error('Error in generateResponse:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async regenerateFeature(request: RegenerateFeatureRequest): Promise<RegenerateFeatureResponse> {
    try {
      const { modelId, featureName, userFeedback, currentResponse, chatId, userId } = request;
      
      // Fetch model and user data
      const model = await AIModel.findById(modelId).populate('categoryId');
      if (!model) {
        throw new Error('Model not found');
      }

      const User = mongoose.model('User');
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Build user context
      const userContext = this.buildUserContext(user);
      
      // Build regeneration prompt
      const prompt = await this.buildRegenerateFeaturePrompt(
        model, 
        featureName, 
        userFeedback, 
        currentResponse, 
        userContext
      );

      // Generate response without memory (standalone)
      const response = await this.openai.invoke(prompt);

      // Get token usage
      const inputTokens = this.lastTokenUsage.inputTokens;
      const outputTokens = this.lastTokenUsage.outputTokens;
      const cost = this.calculateCost(inputTokens, outputTokens, model);

      const responseText = response.content as string;

      // Parse the updated response
      let updatedResponse: any;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          updatedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response');
        }
      } catch (error) {
        console.error('Error parsing regeneration response:', error);
        throw new Error('Failed to parse regeneration response');
      }

      // Save the regeneration as a new message
      const regenerationMessage = `Regenerated "${featureName}" with feedback: "${userFeedback}"`;
      await this.saveMessage(chatId, "user", regenerationMessage, inputTokens);
      await this.saveMessage(chatId, "assistant", responseText, outputTokens, updatedResponse, true);

      return {
        updatedResponse,
        cost,
        inputTokens,
        outputTokens,
      };

    } catch (error) {
      console.error('Error in regenerateFeature:', error);
      throw new Error(`Feature regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearSession(sessionId: string): Promise<void> {
    this.memoryStore.delete(sessionId);
  }

  async getSessionHistory(sessionId: string): Promise<any[]> {
    const memory = this.memoryStore.get(sessionId);
    if (!memory) {
      return [];
    }
    
    try {
      const history = await memory.loadMemoryVariables({});
      return history.history || [];
    } catch (error) {
      console.error('Error loading session history:', error);
      return [];
    }
  }

  async updateUserCredits(userId: string, costInDollars: number): Promise<void> {
    try {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(
        userId,
        { $inc: { creditsPerMonth: -costInDollars } },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw new Error('Failed to update user credits');
    }
  }

  async checkUserCredits(userId: string): Promise<boolean> {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(userId);
      return user ? user.creditsPerMonth > 0.01 : false; // At least $0.01 remaining
    } catch (error) {
      console.error('Error checking user credits:', error);
      return false;
    }
  }

  // Get user's chat sessions
  async getUserChats(userId: string): Promise<any[]> {
    try {
      const chats = await Chat.find({ userId, isActive: true })
        .populate('modelId', 'name description')
        .sort({ lastActivity: -1 })
        .lean();

      return chats.map(chat => ({
        id: chat._id,
        title: chat.title,
        modelName: chat.modelId?.name || 'Unknown Model',
        lastActivity: chat.lastActivity,
        totalTokens: chat.totalTokens,
        messageCount: 0 // Will be populated if needed
      }));
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw new Error('Failed to get user chats');
    }
  }

  // Get chat history (messages)
  async getChatHistory(chatId: string, userId: string): Promise<any[]> {
    try {
      // Verify chat belongs to user
      const chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        throw new Error('Chat not found or access denied');
      }

      const messages = await Message.find({ chatId })
        .sort({ timestamp: 1 })
        .lean();

      return messages.map(msg => ({
        id: msg._id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        tokenCount: msg.tokenCount,
        structuredResponse: msg.structuredResponse,
        hasFeatures: msg.hasFeatures
      }));
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw new Error('Failed to get chat history');
    }
  }

  // Clear chat session (mark as inactive)
  async clearChat(chatId: string, userId: string): Promise<void> {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        throw new Error('Chat not found or access denied');
      }

      await Chat.findByIdAndUpdate(chatId, { isActive: false });
      
      // Clear memory for this session
      this.memoryStore.delete(chatId);
    } catch (error) {
      console.error('Error clearing chat:', error);
      throw new Error('Failed to clear chat');
    }
  }

  // Get chat statistics
  async getChatStats(chatId: string, userId: string): Promise<any> {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        throw new Error('Chat not found or access denied');
      }

      const messages = await Message.find({ chatId });
      const userMessages = messages.filter(msg => msg.role === 'user');
      const assistantMessages = messages.filter(msg => msg.role === 'assistant');

      return {
        totalMessages: messages.length,
        userMessages: userMessages.length,
        assistantMessages: assistantMessages.length,
        totalTokens: chat.totalTokens,
        createdAt: chat.createdAt,
        lastActivity: chat.lastActivity
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      throw new Error('Failed to get chat statistics');
    }
  }
}

export default new GenerateService(); 