"use client";

interface Props {
  onClick: () => void;
}

export default function FloatingButton({
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="
      fixed
      bottom-6
      right-6
      z-40
      h-16
      w-16
      rounded-full
      bg-white
      text-black
      text-2xl
      shadow-xl
      hover:scale-110
      transition-all
      duration-300
      "
    >
      💬
    </button>
  );
}