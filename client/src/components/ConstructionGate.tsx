import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, Truck, CreditCard, Headset } from "lucide-react";

const ACCESS_KEY = "confortride_early_access";
const ACCESS_PASSWORD = "veronez333";
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/LogoConfortRide_fb4b6e27.png";

const FEATURES = [
  { icon: ShieldCheck, title: "Qualidade Garantida", desc: "Produtos testados e aprovados por motociclistas" },
  { icon: Truck, title: "Entrega para Todo Brasil", desc: "Envio rapido e rastreavel para sua cidade" },
  { icon: CreditCard, title: "Pagamento Facilitado", desc: "PIX, cartao de credito e boleto bancario" },
  { icon: Headset, title: "Suporte Dedicado", desc: "Atendimento personalizado via WhatsApp" },
];

export default function ConstructionGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

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
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg text-center space-y-8">
          {/* Logo */}
          <div className="space-y-6">
            <img
              src={LOGO_URL}
              alt="ConfortRide"
              className="h-16 md:h-20 w-auto mx-auto brightness-0 invert drop-shadow-lg"
            />
            <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-400 text-sm font-medium">Nova loja online em breve</span>
            </div>
          </div>

          {/* Main message */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Sua proxima viagem merece
              <br />
              <span className="text-red-500">mais conforto</span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-md mx-auto">
              Estamos finalizando nossa loja online com os melhores acessorios para motociclistas. Conforto, seguranca e estilo para o seu dia a dia sobre duas rodas.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 text-left">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 space-y-2">
                <f.icon className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-zinc-500 text-xs leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA WhatsApp */}
          <div className="space-y-3">
            <a
              href="https://wa.me/554396021892?text=Ola%21%20Gostaria%20de%20saber%20mais%20sobre%20os%20produtos%20ConfortRide"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-8 rounded-xl transition-colors text-base shadow-lg shadow-green-600/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Fale conosco pelo WhatsApp
            </a>
            <p className="text-zinc-600 text-xs">Resposta rapida durante horario comercial</p>
          </div>

          {/* Social */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <a
              href="https://www.instagram.com/confortride/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              @confortride
            </a>
            <span className="text-zinc-800">|</span>
            <a
              href="mailto:contato@confortride.com.br"
              className="text-zinc-500 hover:text-white transition-colors text-sm"
            >
              contato@confortride.com.br
            </a>
          </div>
        </div>
      </div>

      {/* Footer with hidden access */}
      <footer className="border-t border-zinc-900 py-6 px-4">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-4">
          <p className="text-zinc-600 text-xs">
            &copy; 2026 ConfortRide - Acessorios para Motociclistas. Todos os direitos reservados.
          </p>
          <p className="text-zinc-700 text-xs">
            confortride.com.br
          </p>

          {/* Discreet access toggle */}
          {!showLogin ? (
            <button
              onClick={() => setShowLogin(true)}
              className="text-zinc-800 hover:text-zinc-600 transition-colors text-xs flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              Acesso restrito
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-xs">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="Senha de acesso"
                  className={`w-full bg-zinc-900 border ${
                    error ? "border-red-500/50" : "border-zinc-800 focus:border-zinc-700"
                  } rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder:text-zinc-600 outline-none transition-colors`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
              >
                Entrar
              </button>
            </form>
          )}
          {error && showLogin && (
            <p className="text-red-500/70 text-xs">Senha incorreta</p>
          )}
        </div>
      </footer>
    </div>
  );
}
