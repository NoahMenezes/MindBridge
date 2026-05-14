import { memoryEngine } from "./lib/memory-engine";

async function runTest() {
  console.log("-----------------------------------------");
  console.log("🧪 MINDBRIDGE: TESTING NEURAL EXTRACTION");
  console.log("-----------------------------------------");

  
  const sampleConversation = `
    User: I'm starting a new project called 'VisionPlay'.
    AI: That sounds interesting! What's the goal?
    User: We want to build a tactical telemetry dashboard for soccer. 
    User: We're using React, Supabase, and Python for the computer vision part.
    AI: Any blockers so far?
    User: Yeah, we're having trouble with the JWT authentication between the Python backend and Supabase.
    User: We decided to use a custom middleware to handle the tokens.
  `;

  console.log("Processing conversation...");
  
  try {
    const jsonResponse = await memoryEngine.extract(sampleConversation);
    
    console.log("\n✅ SUCCESS! RECEIVED STRUCTURED JSON:\n");
    console.log(JSON.stringify(jsonResponse, null, 2));
    console.log("\n-----------------------------------------");
  } catch (error) {
    console.error("❌ ERROR DURING EXTRACTION:", error);
  }
}

runTest();
