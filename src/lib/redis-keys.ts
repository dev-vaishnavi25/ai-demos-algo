export const REDIS_KEYS = {
  CONVERSATIONS: "conversations",
   conversation: (id: number) => `conversation:${id}`,
};