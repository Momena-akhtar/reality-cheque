import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { AIModel, Feature } from "../models/aimodel";
import { IUser } from "../models/user";
import Chat from "../models/chat";
import Message from "../models/message";
import mongoose from "mongoose";
import upworkScraperService from "./upworkScraperService";
import {
  GenerateRequest,
  GenerateResponse,
  FeaturePrompt,
  UserContext,
  GenerateServiceConfig,
  RegenerateFeatureRequest,
  RegenerateFeatureResponse,
  RegenerateFollowUpQuestionsRequest,
  RegenerateFollowUpQuestionsResponse
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

  private isUpworkUrl(input: string): boolean {
    try {
      const url = new URL(input.trim());
      return url.hostname.includes('upwork.com') && 
             url.pathname.includes('/freelancers/');
    } catch {
      return false;
    }
  }

  private buildUserContext(user: IUser): string {
    const userContext: UserContext = {
      username: user.username,
      email: user.email,
      userType: user.userType,
      usageType: user.usageType,
      agencyName: user.agencyName,
      services: user.services,
      website: user.website,
      pricingPackages: user.pricingPackages,
      currentOffers: user.currentOffers,
      caseStudies: user.caseStudies,
      clientsServed: user.clientsServed,
      targetAudience: user.targetAudience,
      idealClientProfile: user.idealClientProfile,
      bigBrands: user.bigBrands,
      stepByStepProcess: user.stepByStepProcess,
      timelineToResults: user.timelineToResults,
      leadSources: user.leadSources,
      monthlyRevenue: user.monthlyRevenue,
      tier: user.tier,
      totalCredits: user.totalCredits || 0
    };

    let context = `User Information:\n`;
    context += `- Username: ${userContext.username}\n`;
    context += `- Email: ${userContext.email}\n`;
    context += `- User Type: ${userContext.userType}\n`;
    context += `- Usage Type: ${userContext.usageType}\n`;
    
    if (userContext.agencyName) {
      context += `- Agency Name: ${userContext.agencyName}\n`;
    }
    
    if (userContext.services && userContext.services.length > 0) {
      context += `- Services: ${userContext.services.map(s => s.name).join(', ')}\n`;
    }
    
    if (userContext.website) {
      context += `- Website: ${userContext.website}\n`;
    }
    
    if (userContext.pricingPackages && userContext.pricingPackages.length > 0) {
      context += `- Pricing Packages: ${userContext.pricingPackages.map(p => `${p.name}: ${p.price}`).join(', ')}\n`;
    }
    
    if (userContext.currentOffers && userContext.currentOffers.length > 0) {
      context += `- Current Offers: ${userContext.currentOffers.map(o => o.name).join(', ')}\n`;
    }
    
    if (userContext.caseStudies) {
      context += `- Case Studies: ${userContext.caseStudies}\n`;
    }
    
    if (userContext.clientsServed) {
      context += `- Clients Served: ${userContext.clientsServed}\n`;
    }
    
    if (userContext.targetAudience) {
      context += `- Target Audience: ${userContext.targetAudience}\n`;
    }
    
    if (userContext.idealClientProfile) {
      context += `- Ideal Client Profile: ${userContext.idealClientProfile}\n`;
    }
    
    if (userContext.bigBrands) {
      context += `- Big Brands & Results: ${userContext.bigBrands}\n`;
    }
    
    if (userContext.stepByStepProcess && userContext.stepByStepProcess.length > 0) {
      context += `- Step-by-Step Process:\n`;
      userContext.stepByStepProcess.forEach(process => {
        context += `  Package ${process.packageId}: ${process.steps.map(s => s.description).join(' → ')}\n`;
      });
    }
    
    if (userContext.timelineToResults && userContext.timelineToResults.length > 0) {
      context += `- Timeline to Results:\n`;
      userContext.timelineToResults.forEach(timeline => {
        context += `  Package ${timeline.packageId}: ${timeline.timeline}\n`;
      });
    }
    
    if (userContext.leadSources && userContext.leadSources.length > 0) {
      context += `- Lead Sources: ${userContext.leadSources.join(', ')}\n`;
    }
    
    if (userContext.monthlyRevenue) {
      context += `- Monthly Revenue: $${userContext.monthlyRevenue}\n`;
    }
    
    context += `- Tier: ${userContext.tier}\n`;
    context += `- Total Credits: ${userContext.totalCredits}\n\n`;
    
    return context;
  }

  private async buildPromptWithFeatures(
    model: any,
    features: Feature[],
    userContext: string,
    userInput: string,
    selectedGigs?: any[]
  ): Promise<string> {
    // Special handling for Gig Builder - return gig object instead of feature-wise response
    if (model.name === "Gig Builder") {
      let prompt = `Model Information:\n`;
      prompt += `- Name: ${model.name}\n`;
      prompt += `- Description: ${model.description}\n\n`;
      
      prompt += `User Context:\n${userContext}\n`;
      
      // Special handling for Upwork Profile Optimizer
      let processedUserInput = userInput;
      if (userInput && userInput.trim() !== '') {
        // Check if input is a URL
        if (this.isUpworkUrl(userInput.trim())) {
          try {
            const scrapedData = await upworkScraperService.scrapeUpworkProfile(userInput.trim());
            if (scrapedData.success) {
              processedUserInput = `Upwork Profile Data (scraped from ${userInput}):\n\n` +
                `Title: ${scrapedData.title}\n` +
                `Summary: ${scrapedData.summary}\n` +
                `Skills: ${scrapedData.skills.join(', ')}\n` +
                `Hourly Rate: ${scrapedData.hourlyRate || 'Not specified'}\n` +
                `Location: ${scrapedData.location || 'Not specified'}\n` +
                `Availability: ${scrapedData.availability || 'Not specified'}\n` +
                `Portfolio Items:\n${scrapedData.portfolio.map(item => `- ${item.title}: ${item.description}`).join('\n')}\n\n` +
                `Please analyze this profile data and provide optimization suggestions.`;
            } else {
              processedUserInput = `I tried to scrape the Upwork profile from ${userInput}, but encountered an error: ${scrapedData.error}\n\nPlease provide your profile content manually for analysis.`;
            }
          } catch (error) {
            processedUserInput = `I tried to scrape the Upwork profile from ${userInput}, but encountered an error. Please provide your profile content manually for analysis.`;
          }
        }
      }
      
      // Handle empty user input
      if (!processedUserInput || processedUserInput.trim() === '') {
        prompt += `\nUser Input: [No specific instructions provided]\n\n`;
        prompt += `Since no specific instructions were provided, please generate a high-quality Fiverr gig based on this model's purpose. `;
        prompt += `Use the user's agency information to personalize the gig appropriately. `;
        prompt += `Create a gig that would be useful and relevant for the user's business context.\n\n`;
      } else {
        prompt += `\nUser Input: ${processedUserInput}\n\n`;
        prompt += `Please generate a Fiverr gig based on the user's specific input. `;
        prompt += `Use the user's agency information to personalize the gig. `;
        prompt += `Create a compelling gig that would attract clients.\n\n`;
      }
      
      prompt += `IMPORTANT: Your response must be a valid JSON object with the following structure for a Fiverr gig:\n`;
      prompt += `{\n`;
      prompt += `  "title": "Compelling gig title with keywords",\n`;
      prompt += `  "description": "Detailed gig description explaining benefits and what customer gets",\n`;
      prompt += `  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],\n`;
      prompt += `  "price": "Starting from $5",\n`;
      prompt += `  "status": "Active",\n`;
      prompt += `  "followUpQuestions": "1. Would you like me to adjust the pricing?\\n2. Should I modify the description?\\n3. Would you like different tags?\\n4. Should I change the title?\\n5. Would you like me to add more details?"\n`;
      prompt += `}\n\n`;
      prompt += `Make sure the gig is professional, compelling, and tailored to the user's business. `;
      prompt += `Do NOT sugarcoat your responses or automatically agree with everything the user says. Provide honest, constructive feedback and suggestions. If something could be improved, say so directly. If the user's request has potential issues or could be better approached differently, provide your honest assessment. Be helpful but truthful.\n\n`;
      prompt += `Response (JSON only):`;

      return prompt;
    }

    // Special handling for Auto-Responder - include selected gigs context
    if (model.name === "Auto-Responder & Delivery Messages" && selectedGigs && selectedGigs.length > 0) {
      let prompt = `Model Information:\n`;
      prompt += `- Name: ${model.name}\n`;
      prompt += `- Description: ${model.description}\n\n`;
      
      prompt += `User Context:\n${userContext}\n`;
      
      // Add selected gigs context
      prompt += `\nSelected Fiverr Gigs Context:\n`;
      selectedGigs.forEach((gig, index) => {
        prompt += `Gig ${index + 1}:\n`;
        prompt += `- Title: ${gig.title}\n`;
        prompt += `- Description: ${gig.description}\n`;
        prompt += `- Tags: ${gig.tags.join(', ')}\n`;
        prompt += `- Price: ${gig.price}\n`;
        prompt += `- Status: ${gig.status}\n\n`;
      });
      
      // Special handling for Upwork Profile Optimizer
      let processedUserInput = userInput;
      if (userInput && userInput.trim() !== '') {
        // Check if input is a URL
        if (this.isUpworkUrl(userInput.trim())) {
          try {
            const scrapedData = await upworkScraperService.scrapeUpworkProfile(userInput.trim());
            if (scrapedData.success) {
              processedUserInput = `Upwork Profile Data (scraped from ${userInput}):\n\n` +
                `Title: ${scrapedData.title}\n` +
                `Summary: ${scrapedData.summary}\n` +
                `Skills: ${scrapedData.skills.join(', ')}\n` +
                `Hourly Rate: ${scrapedData.hourlyRate || 'Not specified'}\n` +
                `Location: ${scrapedData.location || 'Not specified'}\n` +
                `Availability: ${scrapedData.availability || 'Not specified'}\n` +
                `Portfolio Items:\n${scrapedData.portfolio.map(item => `- ${item.title}: ${item.description}`).join('\n')}\n\n` +
                `Please analyze this profile data and provide optimization suggestions.`;
            } else {
              processedUserInput = `I tried to scrape the Upwork profile from ${userInput}, but encountered an error: ${scrapedData.error}\n\nPlease provide your profile content manually for analysis.`;
            }
          } catch (error) {
            processedUserInput = `I tried to scrape the Upwork profile from ${userInput}, but encountered an error. Please provide your profile content manually for analysis.`;
          }
        }
      }
      
      // Handle empty user input
      if (!processedUserInput || processedUserInput.trim() === '') {
        prompt += `\nUser Input: [No specific instructions provided]\n\n`;
        prompt += `Since no specific instructions were provided, please generate auto-responder messages based on the selected gigs above. `;
        prompt += `Use the gig information to create personalized and relevant auto-responder templates. `;
        prompt += `Create messages that would be appropriate for the specific gigs selected.\n\n`;
      } else {
        prompt += `\nUser Input: ${processedUserInput}\n\n`;
        prompt += `Please generate auto-responder messages based on the user's specific input and the selected gigs above. `;
        prompt += `Use the gig information to create personalized and relevant auto-responder templates. `;
        prompt += `Create messages that would be appropriate for the specific gigs selected.\n\n`;
      }
      
      prompt += `IMPORTANT: Your response must be a valid JSON object with the following structure for auto-responder messages:\n`;
      prompt += `{\n`;
      prompt += `  "Project Start": "Welcome message for when an order begins",\n`;
      prompt += `  "Delivery": "Message for when the work is delivered",\n`;
      prompt += `  "Revision Follow-Up": "Message to use after a client asks for a revision",\n`;
      prompt += `  "followUpQuestions": "1. Would you like me to adjust the tone?\\n2. Should I modify the length?\\n3. Would you like different variations?\\n4. Should I add more personalization?\\n5. Would you like me to focus on specific gig aspects?"\n`;
      prompt += `}\n\n`;
      prompt += `Make sure the messages are professional, friendly, and tailored to the selected gigs. `;
      prompt += `Do NOT sugarcoat your responses or automatically agree with everything the user says. Provide honest, constructive feedback and suggestions. If something could be improved, say so directly. If the user's request has potential issues or could be better approached differently, provide your honest assessment. Be helpful but truthful.\n\n`;
      prompt += `Response (JSON only):`;

      return prompt;
    }

    // Regular feature-wise response for other models
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
    
    // Special handling for Upwork Profile Optimizer
    let processedUserInput = userInput;
    if (model.name === "Profile Optimizer" && userInput && userInput.trim() !== '') {
      // Check if input is a URL
      if (this.isUpworkUrl(userInput.trim())) {
        try {
          const scrapedData = await upworkScraperService.scrapeUpworkProfile(userInput.trim());
          if (scrapedData.success) {
            processedUserInput = `Upwork Profile Data (scraped from ${userInput}):\n\n` +
              `Title: ${scrapedData.title}\n` +
              `Summary: ${scrapedData.summary}\n` +
              `Skills: ${scrapedData.skills.join(', ')}\n` +
              `Hourly Rate: ${scrapedData.hourlyRate || 'Not specified'}\n` +
              `Location: ${scrapedData.location || 'Not specified'}\n` +
              `Availability: ${scrapedData.availability || 'Not specified'}\n` +
              `Portfolio Items:\n${scrapedData.portfolio.map(item => `- ${item.title}: ${item.description}`).join('\n')}\n\n` +
              `Please analyze this profile data and provide optimization suggestions.`;
          } else {
            processedUserInput = `I tried to scrape the Upwork profile from ${userInput}, but encountered an error: ${scrapedData.error}\n\nPlease provide your profile content manually for analysis.`;
          }
        } catch (error) {
          processedUserInput = `I tried to scrape the Upwork profile from ${userInput}, but encountered an error. Please provide your profile content manually for analysis.`;
        }
      }
    }
    
    // Handle empty user input
    if (!processedUserInput || processedUserInput.trim() === '') {
      prompt += `\nUser Input: [No specific instructions provided]\n\n`;
      prompt += `Since no specific instructions were provided, please generate a generic but high-quality response based on this model's purpose. `;
      prompt += `Use the user's agency information to personalize the content appropriately. `;
      prompt += `Create content that would be useful and relevant for the user's business context.\n\n`;
    } else {
      prompt += `\nUser Input: ${processedUserInput}\n\n`;
      prompt += `Please generate a response based on the user's specific input and the available features. `;
      prompt += `Use the user's agency information to personalize the response. `;
      prompt += `If the user is asking for specific content generation, use the appropriate feature prompts to guide your response.\n\n`;
    }
    
    prompt += `IMPORTANT: Your response must be a valid JSON object where each key is a feature name and each value is the generated content for that feature. `;
    prompt += `Additionally, include a "Follow-up Questions" feature that contains 5-7 thoughtful questions to help improve the content. `;
    prompt += `For example: {"Primary Headline": "Your headline here", "Subheadline": "Your subheadline here", "Follow-up Questions": "1. Would you like me to make the headline more attention-grabbing?\\n2. Should I adjust the tone?\\n3. Would you like more specific details?"}\n\n`;
    prompt += `Do NOT sugarcoat your responses or automatically agree with everything the user says. Provide honest, constructive feedback and suggestions. If something could be improved, say so directly. If the user's request has potential issues or could be better approached differently, provide your honest assessment. Be helpful but truthful.\n\n`;
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
    prompt += `Do NOT sugarcoat your responses or automatically agree with everything the user says. Provide honest, constructive feedback and suggestions. If something could be improved, say so directly. If the user's request has potential issues or could be better approached differently, provide your honest assessment. Be helpful but truthful.\n\n`;
    prompt += `Response (JSON only):`;

    return prompt;
  }

  private async buildRegenerateFollowUpQuestionsPrompt(
    model: any,
    userAnswers: { [questionIndex: number]: string },
    currentResponse: any,
    userContext: string
  ): Promise<string> {
    let prompt = `Model Information:\n`;
    prompt += `- Name: ${model.name}\n`;
    prompt += `- Description: ${model.description}\n\n`;
    
    prompt += `User Context:\n${userContext}\n`;
    
    prompt += `Current Response:\n${JSON.stringify(currentResponse, null, 2)}\n\n`;
    
    prompt += `User has provided answers to follow-up questions:\n`;
    Object.entries(userAnswers).forEach(([questionIndex, answer]) => {
      prompt += `Question ${parseInt(questionIndex) + 1}: ${answer}\n`;
    });
    prompt += `\n`;
    
    prompt += `Based on these answers, please regenerate the entire response to better address the user's feedback and preferences. `;
    prompt += `Your response must be a valid JSON object with the same structure as the current response, `;
    prompt += `but updated to incorporate the user's answers and improve the content accordingly.\n\n`;
    prompt += `Do NOT sugarcoat your responses or automatically agree with everything the user says. Provide honest, constructive feedback and suggestions. If something could be improved, say so directly. If the user's request has potential issues or could be better approached differently, provide your honest assessment. Be helpful but truthful.\n\n`;
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
    
    // Special handling for Upwork Profile Optimizer
    let processedUserInput = userInput;
    if (model.name === "Profile Optimizer" && userInput && userInput.trim() !== '') {
      // Check if input is a URL
      if (this.isUpworkUrl(userInput.trim())) {
        try {
          const scrapedData = await upworkScraperService.scrapeUpworkProfile(userInput.trim());
          if (scrapedData.success) {
            processedUserInput = `Upwork Profile Data (scraped from ${userInput}):\n\n` +
              `Title: ${scrapedData.title}\n` +
              `Summary: ${scrapedData.summary}\n` +
              `Skills: ${scrapedData.skills.join(', ')}\n` +
              `Hourly Rate: ${scrapedData.hourlyRate || 'Not specified'}\n` +
              `Location: ${scrapedData.location || 'Not specified'}\n` +
              `Availability: ${scrapedData.availability || 'Not specified'}\n` +
              `Portfolio Items:\n${scrapedData.portfolio.map(item => `- ${item.title}: ${item.description}`).join('\n')}\n\n` +
              `Please analyze this profile data and provide optimization suggestions.`;
          } else {
            processedUserInput = `I tried to scrape the Upwork profile from ${userInput}, but encountered an error: ${scrapedData.error}\n\nPlease provide your profile content manually for analysis.`;
          }
        } catch (error) {
          processedUserInput = `I tried to scrape the Upwork profile from ${userInput}, but encountered an error. Please provide your profile content manually for analysis.`;
        }
      }
    }
    
    // Handle empty user input
    if (!processedUserInput || processedUserInput.trim() === '') {
      prompt += `User Input: [No specific instructions provided]\n\n`;
      prompt += `Since no specific instructions were provided, please generate a generic but high-quality response based on this model's purpose and master prompt. `;
      prompt += `Use the user's agency information to personalize the content appropriately. `;
      prompt += `Create content that would be useful and relevant for the user's business context.\n\n`;
    } else {
      prompt += `User Input: ${processedUserInput}\n\n`;
      prompt += `Please generate a response based on the master prompt and user input. `;
      prompt += `Use the user's agency information to personalize the response.\n\n`;
    }
    
    prompt += `After your main response, please add 5-7 follow-up questions that would help improve or refine the content. `;
    prompt += `Format them like this:\n\n`;
    prompt += `---\n\n`;
    prompt += `**Follow-up Questions:**\n`;
    prompt += `1. [Your first question]\n`;
    prompt += `2. [Your second question]\n`;
    prompt += `3. [Your third question]\n\n`;
    prompt += `4. [Your fourth question]\n`;
    prompt += `5. [Your fifth question]\n`;
    prompt += `Do NOT sugarcoat your responses or automatically agree with everything the user says. Provide honest, constructive feedback and suggestions. If something could be improved, say so directly. If the user's request has potential issues or could be better approached differently, provide your honest assessment. Be helpful but truthful.\n\n`;
    prompt += `Response:`;

    return prompt;
  }

  async generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const { modelId, userInput, userId, sessionId, selectedGigs } = request;
      
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
        prompt = await this.buildPromptWithFeatures(model, features, userContext, userInput, selectedGigs);
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
      let followUpQuestions: string[] = [];
      let generatedGigs = undefined;
      
      if (hasFeatures) {
        try {
          // Try to extract JSON from the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            
            // Special handling for Gig Builder - it returns a gig object directly
            if (model.name === "Gig Builder") {
              // Extract follow-up questions if they exist
              if (parsedResponse.followUpQuestions) {
                const questionsText = parsedResponse.followUpQuestions;
                followUpQuestions = questionsText
                  .split('\n')
                  .filter((line: string) => line.trim().match(/^\d+\./))
                  .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
                  .filter((q: string) => q.length > 0);
              }
              
              // Create gig object from the parsed response
              generatedGigs = {
                title: parsedResponse.title || "",
                description: parsedResponse.description || "",
                tags: parsedResponse.tags || [],
                price: parsedResponse.price || "Starting from $5",
                status: parsedResponse.status || "Active"
              };
              
              // Don't set structuredResponse for Gig Builder
              structuredResponse = undefined;
            } else if (model.name === "Auto-Responder & Delivery Messages") {
              // Special handling for Auto-Responder - extract follow-up questions and create structured response
              if (parsedResponse.followUpQuestions) {
                const questionsText = parsedResponse.followUpQuestions;
                followUpQuestions = questionsText
                  .split('\n')
                  .filter((line: string) => line.trim().match(/^\d+\./))
                  .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
                  .filter((q: string) => q.length > 0);
                
                // Remove follow-up questions from the structured response
                const { followUpQuestions: _, ...featuresWithoutQuestions } = parsedResponse;
                structuredResponse = featuresWithoutQuestions;
              } else {
                structuredResponse = parsedResponse;
              }
            } else {
              // Regular feature-wise response for other models
              // Extract follow-up questions if they exist as a feature
              if (parsedResponse["Follow-up Questions"]) {
                const questionsText = parsedResponse["Follow-up Questions"];
                followUpQuestions = questionsText
                  .split('\n')
                  .filter((line: string) => line.trim().match(/^\d+\./))
                  .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
                  .filter((q: string) => q.length > 0);
                
                // Remove follow-up questions from the structured response
                const { "Follow-up Questions": _, ...featuresWithoutQuestions } = parsedResponse;
                structuredResponse = featuresWithoutQuestions;
              } else {
                structuredResponse = parsedResponse;
              }
            }
          } else {
            // Fallback: create a simple structure with the full response
            structuredResponse = { "Complete Response": responseText };
          }
        } catch (error) {
          console.error('Error parsing structured response:', error);
          // Fallback: create a simple structure with the full response
          structuredResponse = { "Complete Response": responseText };
        }
      } else {
        // For non-feature models, extract follow-up questions from the response
        try {
          const followUpMatch = responseText.match(/\*\*Follow-up Questions:\*\*\n([\s\S]*?)(?=\n\n|$)/);
          if (followUpMatch) {
            const questionsText = followUpMatch[1];
            followUpQuestions = questionsText
              .split('\n')
              .filter((line: string) => line.trim().match(/^\d+\./))
              .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
              .filter((q: string) => q.length > 0);
          }
        } catch (error) {
          console.error('Error extracting follow-up questions:', error);
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
        hasFeatures: model.name === "Gig Builder" ? false : (model.name === "Auto-Responder & Delivery Messages" ? true : hasFeatures),
        followUpQuestions,
        generatedGigs,
      };

    } catch (error) {
      console.error('Error in generateResponse:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async regenerateFollowUpQuestions(request: RegenerateFollowUpQuestionsRequest): Promise<RegenerateFollowUpQuestionsResponse> {
    try {
      const { modelId, userAnswers, currentResponse, chatId, userId } = request;

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
      const prompt = await this.buildRegenerateFollowUpQuestionsPrompt(
        model, 
        userAnswers, 
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
      const regenerationMessage = `Regenerated response based on follow-up question answers`;
      await this.saveMessage(chatId, "user", regenerationMessage, inputTokens);
      await this.saveMessage(chatId, "assistant", responseText, outputTokens, updatedResponse, true);

      return {
        updatedResponse,
        cost,
        inputTokens,
        outputTokens,
      };
    }
    catch (error) {
      console.error('Error in regenerateFollowUpQuestions:', error);
      throw new Error(`Follow-up questions regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const currentUsedCredits = user.usedCredits || 0.00;
      const newUsedCredits = currentUsedCredits + costInDollars;

      // Check if user has enough credits
      if (newUsedCredits > user.totalCredits) {
        throw new Error('Insufficient credits');
      }

      await User.findByIdAndUpdate(
        userId,
        { usedCredits: newUsedCredits },
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
      if (!user) {
        return false;
      }

      const totalCredits = user.totalCredits || 0.00;
      const usedCredits = user.usedCredits || 0.00;
      const remainingCredits = totalCredits - usedCredits;

      return remainingCredits > 0.01; // At least $0.01 remaining
    } catch (error) {
      console.error('Error checking user credits:', error);
      return false;
    }
  }

  // Get user's chat sessions
  async getUserChats(userId: string, modelId?: string): Promise<any[]> {
    try {
      const query: any = { userId, isActive: true };
      
      // If modelId is provided, filter by model
      if (modelId) {
        query.modelId = modelId;
      }

      const chats = await Chat.find(query)
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