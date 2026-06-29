import { NextResponse } from "next/server";
import { GEMINI_API_KEY } from "@/lib/models"; 

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    }

    // Google API se Live models fetch kar rahe hain
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    const data = await response.json();

    if (!data.models) {
      throw new Error("Models nahi mile");
    }

    // 🔴 STRICT LANGCHAIN & SPEED FILTER
    const availableModels = data.models
      .filter((model: any) => {
        const name = model.name.toLowerCase();
        
        return (
          name.includes("gemini") && // Sirf Gemini models
          model.supportedGenerationMethods?.includes("generateContent") && // Text support
          name.includes("-flash") && // 🚀 SIRF FLASH MODELS (Kyunki Pro slow/hang ho rahe the)
          !name.includes("-exp") && // ❌ Experimental models hatao (Langchain me crash karte hain)
          !name.includes("vision") // ❌ Old vision models hatao
        );
      })
      .map((model: any) => ({
        // 'models/gemini-1.5-flash' ko 'gemini-1.5-flash' 
        id: model.name.replace("models/", ""), 
        
        // Use displayName if available
        name: model.displayName || model.name.replace("models/", "").toUpperCase(),
      }));

    // 🔴 DEFAULT MODEL
    if (availableModels.length === 0) {
      availableModels.push({
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash (Default)"
      });
    }

    return NextResponse.json(availableModels);
  } catch (error) {
    console.error("Models fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}