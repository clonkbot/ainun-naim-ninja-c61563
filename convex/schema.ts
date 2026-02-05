import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  scores: defineTable({
    userId: v.id("users"),
    score: v.number(),
    fruitsSliced: v.number(),
    maxCombo: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_score", ["score"]),

  gameStats: defineTable({
    userId: v.id("users"),
    totalGamesPlayed: v.number(),
    totalFruitsSliced: v.number(),
    highestScore: v.number(),
    highestCombo: v.number(),
  }).index("by_user", ["userId"]),
});
