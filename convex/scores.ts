import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTopScores = query({
  args: {},
  handler: async (ctx) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("desc")
      .take(10);

    const scoresWithUsers = await Promise.all(
      scores.map(async (score) => {
        const user = await ctx.db.get(score.userId);
        return {
          ...score,
          userName: user?.email?.split("@")[0] || "Anonymous Ninja",
        };
      })
    );

    return scoresWithUsers;
  },
});

export const getUserScores = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("scores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);
  },
});

export const saveScore = mutation({
  args: {
    score: v.number(),
    fruitsSliced: v.number(),
    maxCombo: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Save the score
    await ctx.db.insert("scores", {
      userId,
      score: args.score,
      fruitsSliced: args.fruitsSliced,
      maxCombo: args.maxCombo,
      createdAt: Date.now(),
    });

    // Update game stats
    const existingStats = await ctx.db
      .query("gameStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, {
        totalGamesPlayed: existingStats.totalGamesPlayed + 1,
        totalFruitsSliced: existingStats.totalFruitsSliced + args.fruitsSliced,
        highestScore: Math.max(existingStats.highestScore, args.score),
        highestCombo: Math.max(existingStats.highestCombo, args.maxCombo),
      });
    } else {
      await ctx.db.insert("gameStats", {
        userId,
        totalGamesPlayed: 1,
        totalFruitsSliced: args.fruitsSliced,
        highestScore: args.score,
        highestCombo: args.maxCombo,
      });
    }
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("gameStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});
