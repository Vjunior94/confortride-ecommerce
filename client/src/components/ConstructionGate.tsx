import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Construction } from "lucide-react";

const ACCESS_KEY = "confortride_early_access";
const ACCESS_PASSWORD = "veronez333";

export default function ConstructionGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(ACCESS_KEY);
    if (stored === "true") {
      setAuthorized(true);
    }
    setLoading(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      localStorage.setItem(ACCESS_KEY, "true");
      setAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  }

  if (loading) return null;
  if (authorized) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <Construction className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            CONFORT<span className="text-red-500">RIDE</span>
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-200">
            Site em Construcao
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Estamos preparando algo incrivel para voce. Em breve, a melhor loja
            de acessorios para motos estara no ar.
          </p>
        </div>

        {/* Progress bar animation */}
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full animate-pulse"
            style={{ width: "35%" }}
          />
        </div>

        {/* Password form */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
            <Lock className="w-4 h-4" />
            <span>Acesso antecipado</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Digite a senha de acesso"
                className={`w-full bg-zinc-800 border ${
                  error ? "border-red-500" : "border-zinc-700 focus:border-red-500"
                } rounded-xl px-4 py-3 pr-12 text-white placeholder:text-zinc-500 outline-none transition-colors`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm">Senha incorreta. Tente novamente.</p>
            )}

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Acessar
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-zinc-600 text-xs">
          &copy; 2026 ConfortRide. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
