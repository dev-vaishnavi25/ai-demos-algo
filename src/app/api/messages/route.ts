import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { conversationId, role, content } = await req.json();

  const message = await prisma.message.create({
    data: {
      conversationId: Number(conversationId),
      role,
      content,
    },
  });

  return NextResponse.json(message);
}