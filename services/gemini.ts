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
    
    // Using the stable model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const events = await getEvents();
    const eventContext = events.map(e => 
      `- ${e.title} (${e.date}) @ ${e.location}. Organized by ${e.organizerName}. ID: ${e.id}`
    ).join('\n');

    const systemInstructionText = `
      You are "UMission AI", a campus assistant specifically for Universiti Malaya (UM) students.
      Your goal is to help students find volunteer opportunities on campus (Kolej Kediaman, Faculties, Rimba Ilmu, Tasik Varsiti, etc.).
      
      Here is the live list of events currently happening at UM:
      ${eventContext}

      Rules:
      1. Only recommend events from the list above if asked about "current" opportunities.
      2. If asked about locations, assume they are within the UM Campus (e.g., "DTC" = Dewan Tunku Canselor).
      3. Be encouraging and student-friendly. Use terms like "Siswa/Siswi" or "Campus Community".
    `;

    // Prepare history:
    // 1. Remove the last item (current prompt) because chat.sendMessage(prompt) handles it.
    // 2. Remove the first item if it is a 'model' message (the UI greeting).
    const historyForSdk = history
      .slice(0, -1) 
      .filter((msg, index) => {
         if (index === 0 && msg.role === 'model') return false;
         return true;
      })
      .map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));

    const chat = model.startChat({
      history: historyForSdk,
      // FIX: Explicitly format systemInstruction as a Content object
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstructionText }]
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the campus network right now.";
  }
};
