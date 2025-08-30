import json
import asyncio
import websockets
from openai import AsyncOpenAI
from app.models import Assistant, Conversation
from app.services.memory import load_memory, save_memory_entry
from app.services.utils import generate_prompt, extract_booking_data
from app.services.booking import handle_booking, cancel_booking, reschedule_booking, load_user_bookings
from datetime import datetime
import os
from app.services.rag_search import get_context_chunks 


client = AsyncOpenAI(api_key=os.getenv("OPENAI_KEY"))

class CallHandler:
    def __init__(self, websocket, assistant: Assistant, conversation_id: int):
        self.websocket = websocket
        self.assistant = assistant
        self.conversation_id = conversation_id
        self.stream_sid = None
        self.openai_ws = None

    async def process(self):
        """Main processing loop for a call (multi-turn)."""
        uri = "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17"
        headers = {
            "Authorization": f"Bearer {os.getenv('OPENAI_KEY')}",
            "OpenAI-Beta": "realtime=v1",
        }

        try:
            async with websockets.connect(uri, additional_headers=headers) as ws:
                self.openai_ws = ws

                await self.initialize_session()

                twilio_task = asyncio.create_task(self.receive_from_twilio())

                while True:
                    finished = await self._one_ai_turn()
                    if finished:  # booking confirmed → end the call
                        break

                twilio_task.cancel()

        except Exception as e:
            print(f"WebSocket connection error: {e}")
        finally:
            if self.openai_ws:
                await self.openai_ws.close()

    async def _one_ai_turn(self):
        """Wait for one complete AI response; return True if booking confirmed."""
        assistant_response = ""
        audio_stopped = False  # Flag to track if we've stopped sending audio

        async for raw in self.openai_ws:
            response = json.loads(raw)
            t = response.get("type")

            if t == "conversation.item.input_audio_transcription.completed":
                final = response.get("transcript")
                if final:
                    save_memory_entry(self.conversation_id, "user", final)
                    history = load_memory(self.conversation_id)
                    history_json = json.dumps(history, ensure_ascii=False)

                    
                    # 3. Retrieve relevant RAG chunks
                    rag_chunks = get_context_chunks(
                        user_query=final,
                        assistant_id=self.assistant.id,
                        user_id=self.assistant.user_id
                    )

                    user_bookings = load_user_bookings(
                        assistant_id=self.assistant.id,
                        conversation_id=self.conversation_id
                    )

                    # 4. Generate updated system prompt with RAG
                    new_prompt = generate_prompt(
                        history_json=history_json,
                        assistant=self.assistant,
                        rag_chunks=rag_chunks if rag_chunks else None,
                        user_bookings=user_bookings
                    )


                    # 5. Send session update with new instructions
                    await self.openai_ws.send(json.dumps({
                        "type": "session.update",
                        "session": {
                            "instructions": new_prompt
                        }
                    }))

                continue

            try:
                output = response['response']['output']
                
                for item in output:
                    if 'content' in item:
                        for content_item in item['content']:
                            if 'transcript' in content_item:
                                transcript = content_item['transcript']
                                save_memory_entry(self.conversation_id, "assistant", transcript)
                                clean, booking_data = extract_booking_data(transcript)
                                # save_memory_entry(self.conversation_id, "assistant", clean)

                                if booking_data and "booking_confirmed" in booking_data:
                                    b = booking_data["booking_confirmed"]
                                    # parse date/time
                                    if b.get("date"):
                                        date_obj = datetime.strptime(b["date"], "%Y-%m-%d").date()
                                    else:
                                        date_obj = datetime.now().date()

                                    raw_time = b["time"].strip()
                                    try:
                                        time_obj = datetime.strptime(raw_time, "%I:%M %p").time()
                                    except ValueError:
                                        time_obj = datetime.strptime(raw_time, "%H:%M").time()

                                    # Save the booking to database
                                    handle_booking(
                                        assistant_id=self.assistant.id,
                                        conversation_id=self.conversation_id,
                                        date=date_obj,
                                        time=time_obj,
                                        customer_name=b.get("name", "Unknown"),
                                        details=b.get("details", ""),
                                        # conversation_id=self.conversation_id
                                        )
                                    
                                elif booking_data and "cancellation_confirmed" in booking_data:
                                    c = booking_data["cancellation_confirmed"]
                                    date_obj = datetime.now().date()
                                    raw_time = c["time"].strip()
                                    try:
                                        time_obj = datetime.strptime(raw_time, "%I:%M %p").time()
                                    except ValueError:
                                        time_obj = datetime.strptime(raw_time, "%H:%M").time()
                                    cancel_booking(
                                        assistant_id=self.assistant.id,
                                        date=date_obj,
                                        time=time_obj
                                    )

                                elif booking_data and "reschedule_confirmed" in booking_data:
                                    r = booking_data["reschedule_confirmed"]
                                    date_obj = datetime.now().date()
                                    old_time_raw = r["old_time"].strip()
                                    new_time_raw = r["new_time"].strip()
                                    try:
                                        old_time_obj = datetime.strptime(old_time_raw, "%I:%M %p").time()
                                        new_time_obj = datetime.strptime(new_time_raw, "%I:%M %p").time()
                                    except ValueError:
                                        old_time_obj = datetime.strptime(old_time_raw, "%H:%M").time()
                                        new_time_obj = datetime.strptime(new_time_raw, "%H:%M").time()
                                    reschedule_booking(
                                        assistant_id=self.assistant.id,
                                        old_date=date_obj,
                                        old_time=old_time_obj,
                                        new_date=date_obj,
                                        new_time=new_time_obj
                                    )

            except KeyError as e:
                print(f"")

  
            if t == "session.ready":
                # Now waiting for user to speak
                continue

            if t == "response.audio.delta" and response.get("delta"):
                # Only send audio frames if we haven't stopped audio output
                if not audio_stopped:
                    frame = {
                        "event": "media",
                        "streamSid": self.stream_sid,
                        "media": {"payload": response["delta"]},
                    }
                    await asyncio.to_thread(self.websocket.send, json.dumps(frame))
                continue

            if t == "response.content.delta":
                delta = response.get("delta", "")
                assistant_response += delta
                
                # Check if we're entering potential JSON data during response generation
                if not audio_stopped and ("{" in delta or "}" in delta):
                    # Check if the response now contains JSON-like content
                    if "{\"booking_confirmed\":" in assistant_response or "booking_confirmed" in assistant_response:
                        # Stop audio output to prevent reading JSON aloud
                        audio_stopped = True
                        clear_evt = {"event": "clear", "streamSid": self.stream_sid}
                        await asyncio.to_thread(self.websocket.send, json.dumps(clear_evt))
                
                continue

            if t == "input_audio_buffer.speech_final":
                # Save the final user transcript
                txt = response.get("text")
                if txt:
                    # Store user message in database
                    save_memory_entry(self.conversation_id, "user", txt)
                continue

            if t == "input_audio_buffer.speech_started":
                # User interrupted the AI
                item_id = response.get("item_id")
                audio_start_ms = response.get("audio_start_ms", 0)

                # Tell OpenAI to truncate its current response
                await self.openai_ws.send(json.dumps({
                    "type": "conversation.item.truncate",
                    "item_id": item_id,
                    "content_index": 0,
                    "audio_end_ms": audio_start_ms,
                }))

                # Clear Twilio's playback buffer so the AI audio stops immediately
                clear_evt = {"event": "clear", "streamSid": self.stream_sid}
                await asyncio.to_thread(self.websocket.send, json.dumps(clear_evt))
                continue

        return True

    async def receive_from_twilio(self):
        """Forward incoming Twilio audio frames to OpenAI."""
        try:
            while True:
                raw = await asyncio.to_thread(self.websocket.receive)
                data = json.loads(raw)

                if data["event"] == "media" and self.openai_ws:
                    await self.openai_ws.send(json.dumps({
                        "type": "input_audio_buffer.append",
                        "audio": data["media"]["payload"],
                    }))

                elif data["event"] == "start":
                    self.stream_sid = data["start"]["streamSid"]

                elif data["event"] == "stop":
                    # so here we simply stop reading frames until next turn.
                    return

        except asyncio.CancelledError:
            return
        except Exception as e:
            print(f"Error in receive_from_twilio: {e}")
            if self.openai_ws:
                await self.openai_ws.close()

    async def initialize_session(self):
        """Configure the Realtime API session with server-VAD & interruptions."""
        history = load_memory(self.conversation_id)
        history_json = json.dumps(history, ensure_ascii=False)

        user_bookings = load_user_bookings(
            assistant_id=self.assistant.id,
            conversation_id=self.conversation_id
        )

        instructions = generate_prompt(history_json, self.assistant, None, user_bookings)

       

        voice = "alloy" if self.assistant.voice_type.lower() == "male" else "coral"

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
                "input_audio_format": "g711_ulaw",
                "output_audio_format": "g711_ulaw",
                "input_audio_transcription": {
                                            "model": "whisper-1",
                                            "language": "en"    
                                        },
                "voice": voice,
                "instructions": instructions,
                "modalities": ["text", "audio"],
                "temperature": 0.7,
            },
        }
        await self.openai_ws.send(json.dumps(session_update))
        
        # Add this line to send the initial greeting
        await self.send_initial_greeting()

    async def send_initial_greeting(self):
        """Send initial greeting message from AI."""
        greeting_message = f"Hello there! I'm {self.assistant.name}. How can I help you today?"
        
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
        
        save_memory_entry(self.conversation_id, "assistant", greeting_message)