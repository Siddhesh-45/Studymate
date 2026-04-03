require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error('No API key');
      return;
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log("Testing with SDK version...");
    // Hack: getting list of models is not exposed directly sometimes, let's just make a REST call to v1beta/models
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await res.json();
    console.log("Available models:");
    (data.models || []).forEach(m => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
            console.log(m.name);
        }
    });

  } catch (err) {
    console.error(err);
  }
}

test();
