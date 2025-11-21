import { GoogleGenAI } from "@google/genai";
import { getEvents } from "./db";

export const generateChatResponse = async (
  prompt: string, 
  history: { role: string, text: string }[]
): Promise<string> => {
  
  // Use Vite's environment variable access
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "Error: VITE_GEMINI_API_KEY not found. Please configure your environment.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    
    // Fetch current events to give the AI context about the platform
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
      4. If an organizer asks for help, suggest ideas relevant to university SDG goals (Green Campus, Zero Waste, Food Security).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text() || "I'm having trouble connecting to the campus network. Try again?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm currently offline. Please check your connection.";
  }
};
