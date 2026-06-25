"use client";

import { useState } from "react";
import FloatingButton from "./FloatingButton";
import { AnimatePresence } from "framer-motion";
import ChatModal from "./ChatModal";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <FloatingButton
          onClick={() => setOpen(true)}
        />
      )}

      <AnimatePresence>
        {open && (
          <ChatModal
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}