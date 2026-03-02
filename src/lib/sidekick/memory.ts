import { db } from "@/lib/db";
import { memory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * Persistent memory for Sidekick.
 * Key-value store that Sidekick can read/write to remember user info.
 */
export const sidekickMemory = {
  async get(key: string): Promise<string | null> {
    const results = await db
      .select()
      .from(memory)
      .where(eq(memory.key, key));
    return results[0]?.value ?? null;
  },

  async set(key: string, value: string, category = "general"): Promise<void> {
    const existing = await db
      .select()
      .from(memory)
      .where(eq(memory.key, key));

    if (existing.length > 0) {
      await db
        .update(memory)
        .set({ value, category, updatedAt: new Date().toISOString() })
        .where(eq(memory.key, key));
    } else {
      await db.insert(memory).values({
        id: uuidv4(),
        key,
        value,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },

  async delete(key: string): Promise<void> {
    await db.delete(memory).where(eq(memory.key, key));
  },

  async listAll(): Promise<{ key: string; value: string; category: string }[]> {
    return db
      .select({
        key: memory.key,
        value: memory.value,
        category: memory.category,
      })
      .from(memory)
      .all();
  },

  async getByCategory(
    category: string
  ): Promise<{ key: string; value: string }[]> {
    return db
      .select({ key: memory.key, value: memory.value })
      .from(memory)
      .where(eq(memory.category, category))
      .all();
  },

  /**
   * Build a text summary of all memories for the system prompt.
   */
  async buildContext(): Promise<string> {
    const entries = await this.listAll();
    if (entries.length === 0) return "";

    const grouped = entries.reduce(
      (acc, entry) => {
        if (!acc[entry.category]) acc[entry.category] = [];
        acc[entry.category].push(`- ${entry.key}: ${entry.value}`);
        return acc;
      },
      {} as Record<string, string[]>
    );

    return Object.entries(grouped)
      .map(([category, items]) => `### ${category}\n${items.join("\n")}`)
      .join("\n\n");
  },
};
