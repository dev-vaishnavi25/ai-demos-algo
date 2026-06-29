import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { REDIS_KEYS } from "@/lib/redis-keys";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const conversationId = Number(id);

  // ------------------------
  // 1. Check Redis
  // ------------------------

  const cached = await redis.get(
    REDIS_KEYS.conversation(conversationId)
  );

  if (cached) {
    console.log(
      `✅ Conversation ${conversationId} from Redis`
    );

    return NextResponse.json(JSON.parse(cached));
  }

  console.log(
    `📀 Conversation ${conversationId} from PostgreSQL`
  );

  // ------------------------
  // 2. Load DB
  // ------------------------

  const conversation =
    await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

  if (!conversation) {
    return NextResponse.json(
      {
        error: "Conversation not found",
      },
      {
        status: 404,
      }
    );
  }

  // ------------------------
  // 3. Save Redis
  // ------------------------

  await redis.set(
    REDIS_KEYS.conversation(conversationId),
    JSON.stringify(conversation)
  );

  return NextResponse.json(conversation);
}