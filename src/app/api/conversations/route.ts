import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { REDIS_KEYS } from "@/lib/redis-keys";
export async function POST(req : Request) {
  const { model } = await req.json();
  const conversation = await prisma.conversation.create({
    data: {
       model,
    },
  });
 await redis.del(REDIS_KEYS.CONVERSATIONS);
  return NextResponse.json(conversation);
}

export async function GET() {
    // STEP 1
  const cached = await redis.get(REDIS_KEYS.CONVERSATIONS);

  // STEP 2
  if (cached) {
    console.log("Conversations from Redis");

    return NextResponse.json(JSON.parse(cached));
  }

  console.log("Conversations from PostgreSQL");

  // STEP 3
  const conversations = await prisma.conversation.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  // STEP 4
  await redis.set(
    REDIS_KEYS.CONVERSATIONS,
    JSON.stringify(conversations)
  );

  return NextResponse.json(conversations);
}

