import Groq from "groq-sdk";
import 'dotenv/config';

console.log('Testing Groq API connection...');
console.log('API Key present:', !!process.env.GROQ_API_KEY);

if (!process.env.GROQ_API_KEY) {
  console.error('❌ No API key found');
  process.exit(1);
}

try {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  
  console.log('Sending test request...');
  const chatCompletion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      { role: "user", content: "Say hello in one word" }
    ],
  });
  
  const response = chatCompletion.choices[0]?.message?.content;
  console.log('✅ SUCCESS! Groq responded:', response);
} catch (error) {
  console.error('❌ ERROR:', error.message);
  if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
    console.log('Your API key is invalid. Please check it at https://console.groq.com/keys');
  }
}
