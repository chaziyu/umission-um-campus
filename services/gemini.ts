{
type: uploaded file
fileName: services/gemini.ts
fullContent:
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEvents } from "./db";

export const generateChatResponse = async (
  prompt: string, 
  history: { role: string, text: string }[]
): Promise<string> => {
  
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "Error: VITE_GEMINI_API_KEY not found. Please check your .env.local file.";
  }

  try {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    
    // Using the model you confirmed exists in the documentation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const events = await getEvents();
    const eventContext = events.map(e => 
      `- ${e.title} (${e.date}) @ ${e.location}. Organized by ${e.organizerName}. ID: ${e.id}`
    ).join('\n');

    const systemInstruction = `
      You are "UMission AI", a campus assistant specifically for Universiti Malaya (UM) students.
      Your goal is to help students find volunteer opportunities on campus (Kolej Kediaman, Faculties, Rimba Ilmu, Tasik Varsiti, etc.).
      
      Here is the live list of events currently happening at UM:
      ${eventContext}

      Rules:
      1. Only recommend events from the list above if asked about "current" opportunities.
      2. If asked about locations, assume they are within the UM Campus (e.g., "DTC" = Dewan Tunku Canselor).
      3. Be encouraging and student-friendly. Use terms like "Siswa/Siswi" or "Campus Community".
    `;

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      systemInstruction: systemInstruction,
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm currently offline. Please check your connection.";
  }
};
}
