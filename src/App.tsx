import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import Game from "./components/Game";
import Leaderboard from "./components/Leaderboard";

function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="fruit-bg fruit-1">🍎</div>
        <div className="fruit-bg fruit-2">🍊</div>
        <div className="fruit-bg fruit-3">🍋</div>
        <div className="fruit-bg fruit-4">🍇</div>
        <div className="fruit-bg fruit-5">🍉</div>
        <div className="fruit-bg fruit-6">🥝</div>
        <div className="fruit-bg fruit-7">🍑</div>
        <div className="fruit-bg fruit-8">🍒</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-ninja text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 mb-2 drop-shadow-glow animate-pulse-slow">
            AINUN NAIM
          </h1>
          <h2 className="font-ninja text-3xl md:text-4xl text-yellow-400 tracking-widest">
            NINJA
          </h2>
          <div className="mt-4 flex justify-center gap-2 text-4xl animate-bounce-slow">
            <span>🗡️</span>
            <span>🍎</span>
            <span>🍊</span>
            <span>🍋</span>
            <span>🗡️</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl"
        >
          <h3 className="font-display text-2xl text-white mb-6 text-center">
            {flow === "signIn" ? "Welcome Back, Ninja" : "Join the Dojo"}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              name="email"
              placeholder="Email"
              type="email"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <input name="flow" type="hidden" value={flow} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </span>
              ) : flow === "signIn" ? (
                "Enter the Arena"
              ) : (
                "Begin Training"
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              {flow === "signIn"
                ? "New ninja? Create an account"
                : "Already a ninja? Sign in"}
            </button>
          </div>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/40">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("anonymous")}
            className="mt-4 w-full py-3 bg-white/5 border border-white/20 text-white/80 font-medium rounded-xl hover:bg-white/10 hover:border-white/30 transition-all"
          >
            🎭 Continue as Guest Ninja
          </button>
        </form>

        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-8 text-center text-white/30 text-xs">
      Requested by{" "}
      <a
        href="https://twitter.com/Bagusprastbp"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-white/50 transition-colors"
      >
        @Bagusprastbp
      </a>
      {" · "}
      Built by{" "}
      <a
        href="https://twitter.com/clonkbot"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-white/50 transition-colors"
      >
        @clonkbot
      </a>
    </footer>
  );
}

function MainApp() {
  const { signOut } = useAuthActions();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🗡️</span>
          <h1 className="font-ninja text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-pink-500">
            AINUN NAIM NINJA
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
          >
            🏆 {showLeaderboard ? "Play Game" : "Leaderboard"}
          </button>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 text-sm font-medium transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto">
        {showLeaderboard ? <Leaderboard /> : <Game />}
      </main>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-spin-slow mb-4">🗡️</div>
          <p className="text-white/60 font-display">Loading the dojo...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return <MainApp />;
}
