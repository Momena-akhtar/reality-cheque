// Generate Service Types

export interface GenerateRequest {
  modelId: string;
  userInput: string;
  userId: string;
  sessionId?: string; // Now represents chatId
}

export interface GenerateResponse {
  response: string;
  sessionId: string;
  chatId?: string; // Database chat ID
  modelName: string;
  features?: string[];
  cost?: number; // Cost in dollars
  inputTokens?: number; // Number of input tokens used
  outputTokens?: number; // Number of output tokens used
  // New fields for structured responses
  structuredResponse?: StructuredFeatureResponse;
  hasFeatures?: boolean;
  followUpQuestions?: string[];
}

// New types for structured feature responses
export interface StructuredFeatureResponse {
  [featureName: string]: string; // Feature name -> content
}

export interface RegenerateFeatureRequest {
  modelId: string;
  featureName: string;
  userFeedback: string;
  currentResponse: StructuredFeatureResponse;
  chatId: string;
  userId: string;
}

export interface RegenerateFeatureResponse {
  updatedResponse: StructuredFeatureResponse;
  cost?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface RegenerateFollowUpQuestionsRequest {
  modelId: string;
  userAnswers: { [questionIndex: number]: string };
  currentResponse: StructuredFeatureResponse;
  chatId: string;
  userId: string;
}

export interface RegenerateFollowUpQuestionsResponse {
  updatedResponse: StructuredFeatureResponse;
  cost?: number;
  inputTokens?: number;
  outputTokens?: number;
}

// Chat Management Types
export interface ChatSession {
  id: string;
  title: string;
  modelName: string;
  lastActivity: Date;
  totalTokens: number;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenCount: number;
}

export interface ChatHistory {
  chatId: string;
  messages: ChatMessage[];
}

export interface ChatStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalTokens: number;
  createdAt: Date;
  lastActivity: Date;
}

export interface BatchGenerateRequest {
  modelId: string;
  inputs: string[];
  sessionId?: string;
}

export interface BatchGenerateResponse {
  results: (GenerateResponse | { error: string; input: string })[];
  totalInputs: number;
  successfulGenerations: number;
  failedGenerations: number;
}

export interface SessionHistory {
  sessionId: string;
  history: Array<{
    role: 'human' | 'ai';
    content: string;
  }>;
}

export interface UserCredits {
  hasCredits: boolean;
  creditsRemaining: number; // Dollar amount remaining
  tier: 'tier1' | 'tier2' | 'tier3';
  creditsInDollars?: string; // Formatted dollar amount
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    name: string;
  };
  hasFeatures: boolean;
  features: Array<{
    id: string;
    name: string;
    prompt: string;
    order: number;
    isOptional: boolean;
  }>;
  masterPrompt: string | null;
  isActive: boolean;
}

export interface FeaturePrompt {
  [key: string]: string;
}

export interface UserContext {
  username: string;
  email: string;
  userType: "agency" | "freelancer";
  usageType: "personal" | "clients";
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
  caseStudies?: string;
  clientsServed?: number;
  targetAudience?: string;
  idealClientProfile?: string;
  bigBrands?: string;
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
  leadSources?: Array<string>;
  monthlyRevenue?: number;
  tier: string;
  totalCredits: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface GenerateApiResponse extends ApiResponse<GenerateResponse> {}
export interface BatchGenerateApiResponse extends ApiResponse<BatchGenerateResponse> {}
export interface SessionHistoryApiResponse extends ApiResponse<SessionHistory> {}
export interface UserCreditsApiResponse extends ApiResponse<UserCredits> {}
export interface ModelInfoApiResponse extends ApiResponse<ModelInfo> {}
export interface ChatSessionsApiResponse extends ApiResponse<ChatSession[]> {}
export interface ChatHistoryApiResponse extends ApiResponse<ChatHistory> {}
export interface ChatStatsApiResponse extends ApiResponse<ChatStats> {}

// Error Types
export interface GenerateError {
  message: string;
  error: 'INSUFFICIENT_CREDITS' | 'MODEL_NOT_FOUND' | 'GENERATION_FAILED' | 'HISTORY_RETRIEVAL_FAILED' | 'SESSION_CLEAR_FAILED' | 'CREDITS_RETRIEVAL_FAILED' | 'MODEL_INFO_RETRIEVAL_FAILED' | 'BATCH_GENERATION_FAILED' | 'CHATS_RETRIEVAL_FAILED' | 'CHAT_HISTORY_RETRIEVAL_FAILED' | 'CHAT_CLEAR_FAILED' | 'CHAT_STATS_RETRIEVAL_FAILED';
}

// Memory Types
export interface MemoryMessage {
  role: 'human' | 'ai';
  content: string;
  timestamp?: Date;
}

export interface MemoryStore {
  [sessionId: string]: MemoryMessage[];
}

// Service Configuration
export interface GenerateServiceConfig {
  openaiApiKey: string;
  modelName: string;
  temperature: number;
  maxTokens?: number;
}

// Feature Types
export interface Feature {
  id: string;
  name: string;
  description: string;
  prompt: string;
  order: number;
  isOptional: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  masterPrompt?: string;
  featureIds?: string[];
  isActive: boolean;
}

// Prompt Building Types
export interface PromptContext {
  model: AIModel;
  userContext: UserContext;
  userInput: string;
  features?: Feature[];
}

export interface PromptBuilder {
  buildWithFeatures(context: PromptContext): string;
  buildWithoutFeatures(context: PromptContext): string;
} 