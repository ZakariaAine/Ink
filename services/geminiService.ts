
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { VoiceName } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateStoryFromImage = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const modelName = 'gemini-3-pro-preview';

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1],
    },
  };

  const promptPart = {
    text: `You are a world-class novelist. Analyze the mood, setting, lighting, and implied conflict in this image. 
    Write a single, atmospheric, and gripping opening paragraph (about 100-150 words) for a story set in this world. 
    Focus on sensory details and establishing a unique voice. Do not include any meta-commentary or titles.`
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [imagePart, promptPart] },
  });

  return response.text || "The story remains untold...";
};

export const generateSpeech = async (text: string, voice: VoiceName = VoiceName.Kore): Promise<Uint8Array> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const modelName = 'gemini-2.5-flash-preview-tts';

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: [{ parts: [{ text: `Narrate this story with deep emotion and atmosphere: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data received");

  return decodeBase64(base64Audio);
};

export const chatWithGemini = async (message: string, history: { role: 'user' | 'model', text: string }[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are an insightful writing companion. Help the user develop their story, characters, and world-building based on their ideas. Be encouraging, creative, and specific."
    }
  });

  // Re-build history format for the API if needed, but the current SDK `chat.sendMessage` handles context.
  // Note: Standard chat expects a specific history structure if manually passed, but for simplicity:
  const response = await chat.sendMessage({ message });
  return response.text || "I'm listening...";
};

// Utils
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
