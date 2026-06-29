import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GEMINI_API_KEY, MODEL_ID, MISSING_KEY_MESSAGE } from "@/lib/models";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { redis } from "@/lib/redis";
import { REDIS_KEYS } from "@/lib/redis-keys";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: MISSING_KEY_MESSAGE }, { status: 400 });
    }

    const { conversationId, message, model } = await req.json();

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: Number(conversationId),
        role: "user",
        content: message,
      },
    });

    // Invalidate conversation cache
    await prisma.conversation.update({
      where: {
        id: Number(conversationId),
      },
      data: {
        updatedAt: new Date(),
      },
    });

    await Promise.all([
      redis.del(REDIS_KEYS.conversation(Number(conversationId))),
      redis.del(REDIS_KEYS.CONVERSATIONS),
    ]);

    // Load conversation history
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: Number(conversationId),
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    console.log(conversation?.messages.length);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    if (!conversation.title) {
      await prisma.conversation.update({
        where: {
          id: Number(conversationId),
        },
        data: {
          title: message.substring(0, 50),
        },
      });
      await redis.del(REDIS_KEYS.CONVERSATIONS);
    }

    // Build prompt from history
    // const history = conversation.messages
    //   .map((msg) => `${msg.role}: ${msg.content}`)
    //   .join("\n");

    const chatHistory = [
      new SystemMessage("You are a helpful AI assistant."),

      ...conversation.messages.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
    ];

    // const model = new ChatGoogleGenerativeAI({
    //   model: MODEL_ID,
    //   apiKey: GEMINI_API_KEY,
    //   temperature: 0.7,
    // });

    const modelInstance = new ChatGoogleGenerativeAI({
      model,
      apiKey: GEMINI_API_KEY,
      temperature: 0.7,
    });

    //     const result = await model.invoke(`
    // You are a helpful AI assistant.

    // Conversation History:
    // ${history}

    // Respond to the latest user message.
    // `);
    // const result = await model.invoke(chatHistory);    // this is for direct resposne moel waot nd think for 5 sec then send next response
    // const aiResponse =
    //   typeof result.content === "string"
    //     ? result.content
    //     : JSON.stringify(result.content);

    const stream = await modelInstance.stream(chatHistory);

    // let aiResponse = "";

    // for await (const chunk of stream) {
    //   aiResponse += chunk.content;
    // }

    const encoder = new TextEncoder();

    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = String(chunk.content);

            fullResponse += text;

            controller.enqueue(encoder.encode(text));
          }
          // Save assistant response
          await prisma.message.create({
            data: {
              conversationId: Number(conversationId),
              role: "assistant",
              content: fullResponse,
            },
          });

          await prisma.conversation.update({
            where: {
              id: Number(conversationId),
            },
            data: {
              updatedAt: new Date(),
            },
          });
          // Chat history changed again
          await Promise.all([
            redis.del(REDIS_KEYS.conversation(Number(conversationId))),
            redis.del(REDIS_KEYS.CONVERSATIONS),
          ]);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}
