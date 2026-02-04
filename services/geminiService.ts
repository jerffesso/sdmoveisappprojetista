
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize the client with an options object containing the apiKey
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDesignFromPrompt = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Você é o sistema de IA da SD Móveis. O usuário pediu: "${prompt}".
      Gere um layout de móveis planejado em JSON seguindo este esquema:
      { "modules": [ { "type": string, "x": number, "y": number, "z": number, "width": number, "height": number, "depth": number, "rotation": number } ] }
      Regras: Use medidas em mm. O ambiente tem 6000x5000mm. Retorne APENAS o JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  z: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  depth: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                },
                required: ["type", "x", "y", "z", "width", "height", "depth", "rotation"]
              }
            }
          },
          required: ["modules"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Design error:", error);
    return null;
  }
};

export const generateRealisticRender = async (dimensions: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Luxurious 8k interior design render of ${dimensions.room}, SD Móveis custom furniture, ${dimensions.finish} finish, cinematic lighting.` }]
      },
      config: { 
        imageConfig: { aspectRatio: "16:9" } 
      }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("AI Render error:", error);
    return null;
  }
};

export const generateProjectVideo = async (projectName: string) => {
  try {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await client.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic drone flythrough of a modern interior design project called ${projectName}, luxury custom furniture by SD Móveis, high-end materials, realistic lighting, 4k.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await client.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};

export const generateAiChatResponse = async (clientMessage: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é a IA de atendimento da SD Móveis Projetados. 
      Contexto do cliente: ${context}.
      O cliente disse: "${clientMessage}".
      Responda de forma profissional, gentil e vendedora. 
      Sempre tente agendar uma visita ou confirmar um detalhe técnico.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Chat error:", error);
    return "Olá! Sou a assistente virtual da SD Móveis. Recebemos sua mensagem e um de nossos projetistas entrará em contato em breve.";
  }
};
