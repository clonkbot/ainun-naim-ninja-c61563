import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ScoreEntry {
  _id: string;
  score: number;
  fruitsSliced: number;
  maxCombo: number;
  createdAt: number;
  userName?: string;
}

export default function Leaderboard() {
  const topScores = useQuery(api.scores.getTopScores);
  const userScores = useQuery(api.scores.getUserScores);
  const userStats = useQuery(api.scores.getUserStats);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-ninja text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
          🏆 Hall of Fame 🏆
        </h2>
        <p className="text-white/50 text-sm">The greatest ninja warriors</p>
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="mb-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
          <h3 className="font-display text-lg sm:text-xl text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🥷</span> Your Ninja Stats
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-white/50 text-xs mb-1">High Score</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-400 font-ninja">
                {userStats.highestScore}
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-white/50 text-xs mb-1">Games Played</p>
              <p className="text-2xl sm:text-3xl font-bold text-white font-ninja">
                {userStats.totalGamesPlayed}
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-white/50 text-xs mb-1">Total Fruits</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-400 font-ninja">
                {userStats.totalFruitsSliced}
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 sm:p-4 text-center">
              <p className="text-white/50 text-xs mb-1">Best Combo</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-400 font-ninja">
                x{userStats.highestCombo}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Leaderboard */}
      <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 mb-8">
        <h3 className="font-display text-lg sm:text-xl text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🌍</span> Global Rankings
        </h3>

        {topScores === undefined ? (
          <div className="text-center py-8">
            <div className="text-4xl animate-spin-slow mb-2">🗡️</div>
            <p className="text-white/50">Loading rankings...</p>
          </div>
        ) : topScores.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎮</div>
            <p className="text-white/50">No scores yet. Be the first ninja!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topScores.map((score: ScoreEntry, index: number) => (
              <div
                key={score._id}
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all hover:bg-white/5 ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
                    : index === 1
                    ? "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30"
                    : index === 2
                    ? "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="text-2xl sm:text-3xl w-10 sm:w-12 text-center flex-shrink-0">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-white text-sm sm:text-base truncate">{score.userName}</p>
                  <p className="text-white/40 text-xs">
                    {score.fruitsSliced} fruits · x{score.maxCombo} combo
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-ninja text-xl sm:text-2xl text-yellow-400">{score.score}</p>
                  <p className="text-white/30 text-xs">
                    {new Date(score.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Recent Scores */}
      {userScores && userScores.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6">
          <h3 className="font-display text-lg sm:text-xl text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📜</span> Your Recent Scores
          </h3>
          <div className="space-y-2">
            {userScores.map((score: ScoreEntry) => (
              <div
                key={score._id}
                className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 text-xs sm:text-sm">
                    {score.fruitsSliced} fruits sliced · x{score.maxCombo} max combo
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-ninja text-lg sm:text-xl text-yellow-400">{score.score}</p>
                  <p className="text-white/30 text-xs">
                    {new Date(score.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
