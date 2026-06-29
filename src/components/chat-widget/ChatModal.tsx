"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Models from "../ai-models/Models";

interface ChatScreenProps {
  onClose: () => void;
}

export default function ChatScreen({ onClose }: ChatScreenProps) {
  const [closing, setClosing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  }

  async function loadConversation(id: number) {
    setSelectedConversationId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();

      // Load real messages from DB
      setMessages(data.messages || []);

      // ✅ Model Persistence:(if old chat exist then load its model)
      if (data.model) {
        setSelectedModel(data.model);
      }
    } catch (error) {
      console.error("Failed to load conversation details", error);
    }
  }

  async function createConversation() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel, // ✅ with new chat model will be saved in DB
        }),
      });
      const conversation = await res.json();

      await loadConversations();
      await loadConversation(conversation.id);
    } catch (error) {
      console.error("Failed to create conversation", error);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;

    if (!selectedConversationId) {
      alert("Please create or select a conversation first.");
      return;
    }

    const currentInput = input;
    setInput(""); // Clear input box immediately

    // Temp IDs for local optimistic UI
    const tempUserMsgId = Date.now();
    const tempAssistantMsgId = Date.now() + 1;

    setMessages((prev) => [
      ...prev,
      { id: tempUserMsgId, role: "user", content: currentInput },
      { id: tempAssistantMsgId, role: "assistant", content: "" },
    ]);

    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          message: currentInput,
          model: selectedModel,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantText = "";
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();

        // when stream complete
        if (done) {
          // ⭐ FINAL PRODUCTION DB SYNC ⭐
          // Jaise hi stream complete hoti hai, hum DB se fresh data mangwayenge
          // is-se Local state aur Database state 100% sync ho jayenge
          await loadConversations(); // Sidebar refresh (Title auto-update ke liye)
          await loadConversation(selectedConversationId); // Final DB sync for real IDs & Text
          break;
        }

        if (isFirstChunk) {
          setIsTyping(false);
          isFirstChunk = false;
        }

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        // Local state update karte raho jab tak stream chal rahi hai
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: assistantText,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Error during streaming:", error);
      setIsTyping(false);
    }
  }

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <motion.div
      initial={{ height: 0, borderTopLeftRadius: 40, borderTopRightRadius: 40 }}
      animate={{
        height: "100vh",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="fixed bottom-0 left-0 right-0 z-[999] bg-zinc-950 overflow-hidden"
    >
      {closing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 z-[1000] flex items-center justify-center bg-zinc-950"
        >
          <div className="text-center">
            <h1 className="text-5xl">✨</h1>
            <p className="mt-4 text-2xl font-semibold">Hope you enjoyed it</p>
            <p className="mt-2 text-zinc-500">See you again 👋</p>
          </div>
        </motion.div>
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-72 border-r border-zinc-800 bg-zinc-900 flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <h2 className="font-semibold text-white">Conversations</h2>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <button
              onClick={createConversation}
              className="btn-primary w-full mb-4"
            >
              + New Chat
            </button>

            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => loadConversation(conversation.id)}
                  className={`cursor-pointer rounded-lg p-3 truncate transition-colors hover:bg-zinc-800 ${
                    selectedConversationId === conversation.id
                      ? "bg-zinc-800 text-white font-medium"
                      : "text-zinc-400"
                  }`}
                >
                  {conversation.title || "New Chat"}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat */}
        <main className="flex flex-1 flex-col relative">
          <header className="border-b border-zinc-800 p-4 flex items-center justify-between">
            <h1 className="font-semibold text-white">AI Assistant</h1>

            {/* Top Bar me Dropdown rakhna ek achhi UI practice hai */}
            <div className="w-48">
              <Models
                selectedModel={selectedModel}
                onModelChange={(newModel) => setSelectedModel(newModel)}
              />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.role === "user"
                      ? `ml-auto max-w-[80%] rounded-2xl bg-zinc-800 px-5 py-4 text-white shadow-sm`
                      : `max-w-[80%] rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 prose prose-zinc prose-invert max-w-none shadow-sm`
                  }
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : msg.content === "" && isTyping ? (
                    <div className="flex h-6 items-center space-x-1.5 px-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              ))}
              <div ref={bottomRef} className="h-4" />
            </div>
          </div>

          <footer className="border-t border-zinc-800 bg-zinc-950 p-4">
            <div className="mx-auto flex max-w-3xl gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="field flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Message AI..."
              />
              <button
                onClick={sendMessage}
                disabled={isTyping} // Disable when AI is typing
                className={`rounded-lg px-6 font-medium transition-all ${
                  isTyping
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                Send
              </button>
            </div>
          </footer>
        </main>
      </div>
    </motion.div>
  );
}
