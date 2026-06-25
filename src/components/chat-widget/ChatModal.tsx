"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatScreenProps {
  onClose: () => void;
}

export default function ChatScreen({ onClose }: ChatScreenProps) {
  const [closing, setClosing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  
  // 1. Naya State Typing indicator ke liye
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]); // isTyping add kiya taaki 3 dots pe bhi scroll ho

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(data);
  }

  async function loadConversation(id: number) {
    setSelectedConversationId(id);
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  async function createConversation() {
    const res = await fetch("/api/conversations", {
      method: "POST",
    });
    const conversation = await res.json();
    await loadConversations();
    await loadConversation(conversation.id);
  }

  async function sendMessage() {
    if (!input.trim()) return;

    if (!selectedConversationId) {
      alert("Create a conversation first");
      return;
    }

    const currentInput = input;
    setInput("");

    const userMsgId = Date.now();
    const assistantMsgId = Date.now() + 1;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: currentInput },
      { id: assistantMsgId, role: "assistant", content: "" }, // Placeholder for stream
    ]);

    // 2. Jaise hi message send ho, typing true kar do
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          message: currentInput,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantText = "";
      
      // 3. Jaise hi pehla chunk aane lage, typing false kar do
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (isFirstChunk) {
          setIsTyping(false);
          isFirstChunk = false;
        }

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: assistantText,
          };
          return updated;
        });
      }

      loadConversations();
    } catch (error) {
      console.error("Error during streaming:", error);
      setIsTyping(false); // Error aaye tab bhi hide kar do
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
      animate={{ height: "100vh", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
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
        <aside className="w-72 border-r border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <h2 className="font-semibold">Conversations</h2>
            <button onClick={handleClose} className="text-zinc-400 hover:text-white">✕</button>
          </div>

          <div className="p-4">
            <button onClick={createConversation} className="btn-primary w-full">+ New Chat</button>
            <div className="mt-4 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => loadConversation(conversation.id)}
                  className={`cursor-pointer rounded-lg p-3 hover:bg-zinc-800 ${
                    selectedConversationId === conversation.id ? "bg-zinc-800" : ""
                  }`}
                >
                  {conversation.title || "New Chat"}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat */}
        <main className="flex flex-1 flex-col">
          <header className="border-b border-zinc-800 p-4">
            <h1 className="font-semibold">AI Assistant</h1>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.role === "user"
                      ? `ml-auto max-w-[80%] rounded-xl bg-zinc-800 p-4`
                      : `max-w-[80%] rounded-xl border border-zinc-800 bg-zinc-900 p-4 prose prose-zinc prose-invert max-w-none`
                  }
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : msg.content === "" && isTyping ? (
                    
                    // 4. CSS Bouncing Dots Animation jab AI 'thinking' kar raha ho
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

          <footer className="border-t border-zinc-800 p-4">
            <div className="mx-auto flex max-w-3xl gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // Zaroori hai warna page reload ho jayega
                    sendMessage();
                  }
                }}
                className="field flex-1 rounded bg-zinc-800 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask anything..."
              />
              <button onClick={sendMessage} className="btn-primary">Send</button>
            </div>
          </footer>
        </main>
      </div>
    </motion.div>
  );
}