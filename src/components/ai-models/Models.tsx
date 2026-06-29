"use client";

import { useEffect, useState } from "react";

// Props define 
interface ModelsProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function Models({ selectedModel, onModelChange }: ModelsProps) {
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLiveModels() {
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        if (data.length > 0) {
          setModels(data);
          const exists = data.find((m: any) => m.id === selectedModel);
          if (!exists) {
            onModelChange(data[0].id);
          }
        }
      } catch (error) {
        console.error("Live models load nahi huye", error);
        setModels([
          { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fallback)" }
        ]);
      }
    }

    fetchLiveModels();
  }, []);

  return (
    <select 
      className="rounded bg-zinc-800 px-3 py-2 text-sm text-white outline-none border border-zinc-700"
      value={selectedModel}
      onChange={(e) => onModelChange(e.target.value)}
    >
      
      {models.length === 0 && (
        <option value={selectedModel}>Loading models...</option>
      )}
      
      {models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  );
}