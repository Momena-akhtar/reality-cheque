// Example usage of the Generate Service
// This file demonstrates how to use the generate service with different scenarios

import generateService from '../services/generateService';

// Example 1: Generate response with a feature-based model
async function exampleFeatureBasedModel() {
  try {
    const request = {
      modelId: 'feature_model_id', // Replace with actual model ID
      userInput: 'Create a social media post for my digital marketing agency',
      userId: 'user_id', // Replace with actual user ID
      sessionId: 'session_123'
    };

    const response = await generateService.generateResponse(request);
    console.log('Feature-based model response:', response);
  } catch (error) {
    console.error('Error in feature-based model example:', error);
  }
}

// Example 2: Generate response with a master prompt model
async function exampleMasterPromptModel() {
  try {
    const request = {
      modelId: 'master_prompt_model_id', // Replace with actual model ID
      userInput: 'What are the best practices for email marketing?',
      userId: 'user_id', // Replace with actual user ID
      sessionId: 'session_456'
    };

    const response = await generateService.generateResponse(request);
    console.log('Master prompt model response:', response);
  } catch (error) {
    console.error('Error in master prompt model example:', error);
  }
}

// Example 3: Check user credits
async function exampleCheckCredits() {
  try {
    const userId = 'user_id'; // Replace with actual user ID
    const hasCredits = await generateService.checkUserCredits(userId);
    console.log('User has credits:', hasCredits);
  } catch (error) {
    console.error('Error checking credits:', error);
  }
}

// Example 4: Get session history
async function exampleGetSessionHistory() {
  try {
    const sessionId = 'session_123';
    const history = await generateService.getSessionHistory(sessionId);
    console.log('Session history:', history);
  } catch (error) {
    console.error('Error getting session history:', error);
  }
}

// Example 5: Clear session
async function exampleClearSession() {
  try {
    const sessionId = 'session_123';
    await generateService.clearSession(sessionId);
    console.log('Session cleared successfully');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

// Example 6: Update user credits
async function exampleUpdateCredits() {
  try {
    const userId = 'user_id'; // Replace with actual user ID
    const creditsUsed = 1;
    await generateService.updateUserCredits(userId, creditsUsed);
    console.log('Credits updated successfully');
  } catch (error) {
    console.error('Error updating credits:', error);
  }
}

// Example 7: Complete workflow
async function completeWorkflowExample() {
  try {
    const userId = 'user_id'; // Replace with actual user ID
    const modelId = 'model_id'; // Replace with actual model ID
    const sessionId = `${userId}_${Date.now()}`;

    // Step 1: Check if user has credits
    const hasCredits = await generateService.checkUserCredits(userId);
    if (!hasCredits) {
      console.log('User needs to upgrade their plan');
      return;
    }

    // Step 2: Generate first response
    const response1 = await generateService.generateResponse({
      modelId,
      userInput: 'Create a compelling headline for my marketing campaign',
      userId,
      sessionId
    });
    console.log('First response:', response1);

    // Step 3: Generate follow-up response (uses memory)
    const response2 = await generateService.generateResponse({
      modelId,
      userInput: 'Now create a call-to-action for the same campaign',
      userId,
      sessionId
    });
    console.log('Second response:', response2);

    // Step 4: Get session history
    const history = await generateService.getSessionHistory(sessionId);
    console.log('Conversation history:', history);

    // Step 5: Clear session when done
    await generateService.clearSession(sessionId);
    console.log('Workflow completed successfully');

  } catch (error) {
    console.error('Error in complete workflow:', error);
  }
}

// Example 8: API endpoint simulation
async function simulateApiEndpoint() {
  try {
    // Simulate request body
    const requestBody = {
      modelId: 'model_id',
      userInput: 'Generate a blog post about digital marketing trends',
      sessionId: 'session_789'
    };

    // Simulate user from JWT token
    const user = { id: 'user_id' };

    // Validate request
    if (!requestBody.modelId || !requestBody.userInput) {
      console.log('Missing required fields');
      return;
    }

    // Check credits
    const hasCredits = await generateService.checkUserCredits(user.id);
    if (!hasCredits) {
      console.log('Insufficient credits');
      return;
    }

    // Generate response
    const result = await generateService.generateResponse({
      modelId: requestBody.modelId,
      userInput: requestBody.userInput,
      userId: user.id,
      sessionId: requestBody.sessionId
    });

    // Update credits
    await generateService.updateUserCredits(user.id, 1);

    // Simulate API response
    const apiResponse = {
      success: true,
      data: result,
      message: 'Response generated successfully'
    };

    console.log('API Response:', apiResponse);

  } catch (error) {
    console.error('Error in API simulation:', error);
  }
}

// Export examples for use in other files
export {
  exampleFeatureBasedModel,
  exampleMasterPromptModel,
  exampleCheckCredits,
  exampleGetSessionHistory,
  exampleClearSession,
  exampleUpdateCredits,
  completeWorkflowExample,
  simulateApiEndpoint
};

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running Generate Service Examples...\n');
  
  // Uncomment the examples you want to run
  // exampleFeatureBasedModel();
  // exampleMasterPromptModel();
  // exampleCheckCredits();
  // exampleGetSessionHistory();
  // exampleClearSession();
  // exampleUpdateCredits();
  // completeWorkflowExample();
  // simulateApiEndpoint();
} 