// Quick Groq API Test Script
import Groq from "groq-sdk";
import 'dotenv/config';

async function testGroqConnection() {
  console.log('🔍 Testing Groq API connection...');
  
  // Check if API key is loaded
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in environment variables');
    console.log('📝 Please create a .env file with: GROQ_API_KEY=your_api_key_here');
    return;
  }
  
  if (process.env.GROQ_API_KEY === 'your_actual_api_key_here') {
    console.error('❌ Please replace "your_actual_api_key_here" with your actual Groq API key');
    return;
  }
  
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    
    console.log('🚀 Sending test request to Groq...');
    const chatCompletion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "user", content: "Say 'Hello from NyayaSetu AI!' in one sentence." }
      ],
    });
    
    const response = chatCompletion.choices[0]?.message?.content;
    
    console.log('✅ Groq API is working!');
    console.log('📤 Response:', response);
    console.log('🎉 Your NyayaSetu AI is ready to analyze legal documents!');
    
  } catch (error) {
    console.error('❌ Groq API Error:', error.message);
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
      console.log('💡 Your API key appears to be invalid. Please check:');
      console.log('   1. Visit https://console.groq.com/keys');
      console.log('   2. Create a new API key');
      console.log('   3. Update your .env file with the correct key');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      console.log('💡 You may have exceeded your API quota. Check your usage at Groq Console.');
    }
  }
}

testGroqConnection();
