const WebSocket = require("ws");

// Replace with your real key
const API_KEY = process.env.OPENAI_API_KEY || "your-actual-openai-key-here";
const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17"; 

console.log("🔌 Testing OpenAI Realtime WebSocket API...");
console.log(`🔑 Using API Key: ${API_KEY.substring(0, 10)}...`);

const ws = new WebSocket(url, {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "OpenAI-Beta": "realtime=v1",
  },
});

ws.on("open", () => {
  console.log("✅ WebSocket connected to OpenAI Realtime API!");
  
  // Send a simple test event
  const testEvent = {
    type: "input_text",
    text: "Hello, test!"
  };
  
  console.log("📤 Sending test event:", JSON.stringify(testEvent, null, 2));
  ws.send(JSON.stringify(testEvent));
});

ws.on("message", (data) => {
  console.log("📨 Received from OpenAI:", data.toString());
});

ws.on("error", (err) => {
  console.error("❌ WebSocket error:", err);
});

ws.on("close", (code, reason) => {
  console.log(`🔒 Connection closed: ${code} - ${reason}`);
});

// Close after 10 seconds
setTimeout(() => {
  console.log("⏰ Closing connection after 10 seconds...");
  ws.close();
}, 10000);
