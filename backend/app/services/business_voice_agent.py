# app/services/business_voice_agent.py

import json
import asyncio
import websockets
from openai import AsyncOpenAI
from datetime import datetime
import os
import base64

client = AsyncOpenAI(api_key=os.getenv("OPENAI_KEY"))

class BusinessVoiceTestAgent:
    """
    Specialized voice agent for testing VocalHost's capabilities.
    This agent provides information about VocalHost's business and services.
    """
    
    def __init__(self, websocket):
        self.websocket = websocket
        self.openai_ws = None
        self.stream_sid = None

    async def process(self):
        """Main processing loop for the business voice test agent."""
        print("🎯 BusinessVoiceTestAgent.process() started")
        
        # Check if OpenAI key is available
        openai_key = os.getenv('OPENAI_KEY')
        if not openai_key:
            print("❌ OPENAI_KEY not found in environment variables")
            try:
                await self.websocket.send(json.dumps({
                    "event": "error",
                    "message": "OpenAI API key not configured"
                }))
            except Exception as e:
                print(f"❌ Failed to send error message: {e}")
            return
        
        print(f"✅ OpenAI key found: {openai_key[:10]}...")
        
        uri = "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17"
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "OpenAI-Beta": "realtime=v1",
        }
        
        print(f"🔗 Connecting to OpenAI: {uri}")
        print(f"🔑 Headers: {headers}")

        try:
            async with websockets.connect(uri, additional_headers=headers) as ws:
                self.openai_ws = ws
                print("✅ Connected to OpenAI Realtime API")
                
                await self.initialize_session()
                print("✅ Session initialized")
                
                # Start receiving audio from the frontend
                print("🎧 Starting audio receive task...")
                audio_task = asyncio.create_task(self.receive_audio())
                
                # Process AI responses
                print("🔄 Starting AI response processing loop...")
                while True:
                    try:
                        finished = await self._process_ai_response()
                        if finished:
                            print("✅ AI response processing finished")
                            break
                    except Exception as e:
                        print(f"❌ Error processing AI response: {e}")
                        import traceback
                        print(f"❌ Traceback: {traceback.format_exc()}")
                        break
                
                print("🛑 Cancelling audio task...")
                audio_task.cancel()

        except Exception as e:
            print(f"❌ Business voice agent error: {e}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            
            # Send error message to frontend
            try:
                await self.websocket.send(json.dumps({
                    "event": "error",
                    "message": f"Connection error: {str(e)}"
                }))
                print("✅ Error message sent to frontend")
            except Exception as send_error:
                print(f"❌ Failed to send error message: {send_error}")
        finally:
            if self.openai_ws:
                print("🔌 Closing OpenAI WebSocket...")
                await self.openai_ws.close()
                print("✅ OpenAI WebSocket closed")

    async def _process_ai_response(self):
        """Process one complete AI response cycle."""
        async for raw in self.openai_ws:
            response = json.loads(raw)
            t = response.get("type")

            if t == "response.audio.delta" and response.get("delta"):
                # Validate and send audio to frontend
                try:
                    delta = response["delta"]
                    print(f"🎵 Received audio delta, length: {len(delta)}")
                    
                    # Validate that it's proper base64
                    if isinstance(delta, str) and len(delta) > 0:
                        # Test if it's valid base64
                        try:
                            # Try to decode to validate
                            import base64
                            base64.b64decode(delta, validate=True)
                            print(f"✅ Valid base64 audio delta")
                            
                            frame = {
                                "event": "media",
                                "streamSid": self.stream_sid,
                                "media": {"payload": delta},
                            }
                            await asyncio.to_thread(self.websocket.send, json.dumps(frame))
                            
                        except Exception as b64_error:
                            print(f"❌ Invalid base64 audio delta: {b64_error}")
                            print(f"❌ Delta preview: {delta[:100] if len(delta) > 100 else delta}")
                    else:
                        print(f"❌ Invalid delta format: {type(delta)}, length: {len(delta) if delta else 0}")
                        
                except Exception as audio_error:
                    print(f"❌ Error processing audio delta: {audio_error}")
                    import traceback
                    print(f"❌ Audio delta traceback: {traceback.format_exc()}")
                continue

            if t == "response.content.delta":
                # Log the response content for debugging
                delta = response.get("delta", "")
                print(f"AI Response: {delta}")
                continue

            if t == "conversation.item.input_audio_transcription.completed":
                # Process user input
                transcript = response.get("transcript")
                if transcript:
                    print(f"User said: {transcript}")
                    # Update session with new context if needed
                    await self._handle_user_input(transcript)
                continue

            if t == "input_audio_buffer.speech_started":
                # User interrupted the AI
                item_id = response.get("item_id")
                audio_start_ms = response.get("audio_start_ms", 0)

                await self.openai_ws.send(json.dumps({
                    "type": "conversation.item.truncate",
                    "item_id": item_id,
                    "content_index": 0,
                    "audio_end_ms": audio_start_ms,
                }))

                # Clear frontend audio buffer
                clear_evt = {"event": "clear", "streamSid": self.stream_sid}
                await asyncio.to_thread(self.websocket.send, json.dumps(clear_evt))
                continue

        return False

    async def receive_audio(self):
        """Receive audio from frontend and send to OpenAI."""
        print("🎧 Audio receive task started")
        try:
            while True:
                print("⏳ Waiting for message from frontend...")
                raw = await asyncio.to_thread(self.websocket.receive)
                print(f"📨 Raw message received: {raw[:100]}...")
                
                data = json.loads(raw)
                print(f"📦 Parsed message: {data}")

                if data["event"] == "media" and self.openai_ws and data.get("media", {}).get("payload"):
                    print("🎵 Processing audio media...")
                    # Convert base64 audio to bytes
                    try:
                        audio_bytes = base64.b64decode(data["media"]["payload"])
                        print(f"🔊 Audio bytes decoded: {len(audio_bytes)} bytes")
                        
                        await self.openai_ws.send(json.dumps({
                            "type": "input_audio_buffer.append",
                            "audio": base64.b64encode(audio_bytes).decode('utf-8'),
                        }))
                        print("✅ Audio sent to OpenAI")
                    except Exception as e:
                        print(f"❌ Error processing audio: {e}")
                        import traceback
                        print(f"❌ Traceback: {traceback.format_exc()}")

                elif data["event"] == "start":
                    self.stream_sid = data["start"]["streamSid"]
                    print(f"🎬 Stream started: {self.stream_sid}")

                elif data["event"] == "stop":
                    print("🛑 Audio stream stopped")
                    return
                    
                elif data["event"] == "error":
                    print(f"❌ Frontend error: {data.get('message', 'Unknown error')}")
                    
                else:
                    print(f"❓ Unknown event type: {data.get('event', 'No event')}")

        except asyncio.CancelledError:
            print("🛑 Audio receive task cancelled")
            return
        except Exception as e:
            print(f"❌ Error receiving audio: {e}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")

    async def _handle_user_input(self, transcript):
        """Handle user input and update context if needed."""
        # For now, we'll let the AI handle everything based on the system prompt
        # In the future, we could add specific handling for certain queries
        pass

    async def initialize_session(self):
        """Initialize the OpenAI Realtime API session with VocalHost business context."""
        
        # Get current time for context
        now = datetime.now()
        current_time = now.strftime("%I:%M %p").lstrip("0")
        current_date = now.strftime("%A, %B %d, %Y")

        # Create comprehensive business context for VocalHost
        business_context = f"""
        You are the official voice assistant for VocalHost, an AI-powered voice assistant platform for businesses.

        COMPANY INFORMATION:
        - Company Name: VocalHost
        - Tagline: "Create Your Business Voice Assistant"
        - Industry: AI Voice Technology / SaaS
        - Founded: 2024
        - Headquarters: Global (Remote-first company)

        WHAT WE DO:
        VocalHost helps businesses create AI-powered voice assistants that can:
        - Handle phone calls and customer inquiries
        - Schedule and manage appointments automatically
        - Process payments through Stripe integration
        - Provide 24/7 customer service
        - Integrate with existing business systems
        - Support multiple languages and voice types

        OUR SERVICES:
        1. AI Voice Assistant Creation
           - Custom voice assistants tailored to your business
           - Natural conversation capabilities
           - Multi-language support
           - Customizable personality and tone

        2. Appointment Scheduling
           - Automated booking system
           - Calendar integration
           - Reminder notifications
           - Rescheduling and cancellation handling

        3. Payment Processing
           - Stripe integration
           - Subscription management
           - Secure payment handling
           - Automated billing

        4. Business Integration
           - CRM integration
           - Analytics and reporting
           - Custom workflows
           - API access

        PRICING PLANS:
        - Basic Plan: $29/month - 1 voice assistant, basic features
        - Pro Plan: $79/month - 3 voice assistants, advanced features, analytics
        - Enterprise: Custom pricing for large organizations

        TARGET CUSTOMERS:
        - Medical practices and clinics
        - Law firms and legal services
        - Salons and beauty services
        - Consulting firms
        - Service-based businesses
        - Any business that needs appointment scheduling

        COMPETITIVE ADVANTAGES:
        - Easy setup and configuration
        - No technical knowledge required
        - Affordable pricing
        - 24/7 availability
        - Human-like conversations
        - Customizable to business needs
        - Real-time analytics

        CURRENT TIME: {current_time} on {current_date}

        CONVERSATION GUIDELINES:
        - Be enthusiastic and knowledgeable about VocalHost
        - Use a friendly, professional tone
        - Keep responses conversational and engaging
        - Ask follow-up questions to understand their business needs
        - Provide specific examples of how VocalHost can help their business
        - Mention the free trial or demo options
        - Be helpful and informative, not pushy
        - If they ask about technical details, explain in simple terms
        - Always end with a clear next step or call-to-action

        RESPONSE STYLE:
        - Keep responses brief (30-60 words when possible)
        - Use simple, clear language
        - Be conversational and engaging
        - Add personality and enthusiasm
        - Ask questions to keep the conversation flowing
        - Provide value in every response

        If someone asks about pricing, features, or how to get started, provide helpful information and guide them toward scheduling a demo or signing up for a free trial.
        """

        session_update = {
            "type": "session.update",
            "session": {
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 100,
                    "silence_duration_ms": 200,
                    "create_response": True,
                    "interrupt_response": True
                },
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1",
                    "language": "en"    
                },
                "voice": "coral",  # Friendly female voice
                "instructions": business_context,
                "modalities": ["text", "audio"],
                "temperature": 0.7,
            },
        }
        
        await self.openai_ws.send(json.dumps(session_update))
        
        # Send initial greeting
        await self.send_initial_greeting()

    async def send_initial_greeting(self):
        """Send the initial greeting message."""
        greeting_message = "Hi there! I'm VocalHost's voice assistant. I'm here to tell you all about how VocalHost can transform your business with AI-powered voice technology. What would you like to know about our services?"
        
        initial_message = {
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": f"Greet the user with exactly: '{greeting_message}'"
                    }
                ]
            }
        }
        
        await self.openai_ws.send(json.dumps(initial_message))
        await self.openai_ws.send(json.dumps({"type": "response.create"}))
