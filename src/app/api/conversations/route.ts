import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req : Request) {
  const { model } = await req.json();
  const conversation = await prisma.conversation.create({
    data: {
       model,
    },
  });

  return NextResponse.json(conversation);
}

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(conversations);
}

