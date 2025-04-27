import { MainPage } from "./MainPage";

export class PA {

    private _mainPage: MainPage;

    constructor(mainPage: MainPage) {
        this._mainPage = mainPage;
    }



    handlePaVoiceData = async (messageData: { voiceData: string }) => {
        // base64 string
        const { voiceData } = messageData;

        const audioArrayBuffer = this.base64ToArrayBuffer(voiceData);

        // Process and play the audio
        await this.playAudioBuffer(audioArrayBuffer, 16000);


    }

    base64ToBlob = (base64: string, mimeType: string) => {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }


    AUDIO_CONFIG = {
        sampleRate: 16000,  // Common for speech (16kHz)
        channelCount: 1,    // Mono
        echoCancellation: true
    };

    // WebSocket and MediaStream variables
    mediaStream: any;
    audioContext: any;
    processor: any;

    // Initialize the audio capture and WebSocket connection
    startAudioStreaming = async () => {
        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: this.AUDIO_CONFIG,
                video: false
            });

            // Initialize audio context
            this.audioContext = new (window.AudioContext)({
                sampleRate: this.AUDIO_CONFIG.sampleRate
            });

            // Create media stream source
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Create script processor for audio processing
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            // Connect WebSocket
            // websocket = new WebSocket(WS_SERVER_URL);

            // websocket.onopen = () => {
            //     console.log('WebSocket connection established');

            // Set up audio processing
            this.processor.onaudioprocess = (event: any) => {
                // Get audio data and convert to 16-bit PCM
                const audioData = event.inputBuffer.getChannelData(0);
                const pcmData = this.convertFloat32ToInt16(audioData);
                console.log(pcmData)
                this.getMainPage().sendToServer("pa-voice-data", {
                    voiceData: this.arrayBufferToBase64(pcmData),
                    echo: this.getMainPage().testingPa === true? true: false,
                })

                // Send via WebSocket (can also encode as base64 if needed)
                // this.getWs()?.send(pcmData);
            };

            // Connect audio nodes
            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            // };

            // websocket.onerror = (error) => {
            //     console.error('WebSocket error:', error);
            //     stopAudioStreaming();
            // };

        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }

    // Stop audio streaming
    stopAudioStreaming = () => {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track: any) => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }

    // Convert Float32 to Int16 (PCM)
    convertFloat32ToInt16 = (buffer: Buffer) => {
        const length = buffer.length;
        const int16Array = new Int16Array(length);

        for (let i = 0; i < length; i++) {
            // Convert from 32-bit float to 16-bit int
            const sample = Math.max(-1, Math.min(1, buffer[i]));
            int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        return int16Array.buffer;
    }

    arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }


    // Base64 to ArrayBuffer conversion
    base64ToArrayBuffer = (base64: string) => {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes.buffer;
    }

    playbackAudioContext: any;
    audioSource: any;
    // Play the audio buffer
    playAudioBuffer = async (arrayBuffer: ArrayBuffer, sampleRate: number = 44100) => {
        // Initialize audio context if not already done
        if (!this.playbackAudioContext) {
            this.playbackAudioContext = new (window.AudioContext)({
                sampleRate: sampleRate || 44100
            });
        }

        try {
            // For raw PCM data (16-bit)
            const audioBuffer = await this.createAudioBufferFromPCM(arrayBuffer, sampleRate);

            // Stop any currently playing audio
            if (this.audioSource) {
                this.audioSource.stop();
            }

            // Create and start new audio source
            this.audioSource = this.playbackAudioContext.createBufferSource();
            this.audioSource.buffer = audioBuffer;
            this.audioSource.connect(this.playbackAudioContext.destination);
            this.audioSource.start();

        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    // Convert PCM data to Web Audio API buffer
    createAudioBufferFromPCM = async (pcmArrayBuffer: ArrayBuffer, sampleRate: number) => {
        // Assuming 16-bit PCM data
        const pcmData = new Int16Array(pcmArrayBuffer);
        const float32Data = new Float32Array(pcmData.length);

        // Convert to Float32 (Web Audio API format)
        for (let i = 0; i < pcmData.length; i++) {
            float32Data[i] = pcmData[i] / 32768.0; // Normalize to [-1, 1]
        }

        // Create audio buffer
        const audioBuffer = this.playbackAudioContext.createBuffer(
            1, // Number of channels (mono)
            float32Data.length,
            sampleRate
        );

        // Copy data to audio buffer
        audioBuffer.getChannelData(0).set(float32Data);

        return audioBuffer;
    }

    getMainPage = () => {
        return this._mainPage;
    }
}