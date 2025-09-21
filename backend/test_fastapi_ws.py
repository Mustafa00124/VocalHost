from fastapi import FastAPI, WebSocket
import json
import uvicorn

app = FastAPI()

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if not data:
                break
            
            try:
                message = json.loads(data)
                response = {
                    "type": "echo",
                    "original": message
                }
                await websocket.send_text(json.dumps(response))
            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "error": "Invalid JSON format"
                }
                await websocket.send_text(json.dumps(error_response))
    except Exception:
        pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
