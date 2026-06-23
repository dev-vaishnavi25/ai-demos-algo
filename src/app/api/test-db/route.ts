import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const conversation = await prisma.conversation.create({
    data: {
      title: "My First Chat",
    },
  });

  return NextResponse.json(conversation);
}