// Audio Worklet for real-time audio processing for OpenAI Realtime API
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Use larger buffer size to reduce flooding
    this.bufferSize = 6144; // 256ms at 24kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.sampleRate = 24000; // Realtime API expects 24kHz
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];
      
      // Copy input to output (pass-through for monitoring)
      for (let i = 0; i < inputChannel.length; i++) {
        output[0][i] = inputChannel[i];
      }

      // Collect audio data for sending to Realtime API
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;

        // When buffer is full, send it to the main thread
        if (this.bufferIndex >= this.bufferSize) {
          // Convert float32 to int16 PCM for Realtime API
          const pcm16 = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            // Convert from [-1, 1] to [-32768, 32767]
            const sample = Math.max(-1, Math.min(1, this.buffer[j]));
            pcm16[j] = Math.round(sample * 32767);
          }

          // Send audio data to main thread for WebSocket transmission
          this.port.postMessage({
            audioData: pcm16.buffer,
            sampleRate: this.sampleRate,
            format: 'pcm16'
          });

          // Reset buffer
          this.bufferIndex = 0;
        }
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
