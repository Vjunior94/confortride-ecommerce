import { Link } from "wouter";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/LogoConfortRide_fb4b6e27.png";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <img src={LOGO_URL} alt="ConfortRide" className="h-10 w-auto brightness-0 invert" />
            <p className="text-sm text-gray-400 leading-relaxed">
              Acessórios de alta qualidade para motociclistas que buscam conforto e performance em cada viagem.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Início", href: "/" },
                { label: "Produtos", href: "/produtos" },
                { label: "Categorias", href: "/categorias" },
                { label: "Sobre Nós", href: "/sobre" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-red-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-white font-semibold mb-4">Atendimento</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Minha Conta", href: "/minha-conta" },
                { label: "Meus Pedidos", href: "/minha-conta/pedidos" },
                { label: "Política de Troca", href: "/politica-troca" },
                { label: "Frete e Entrega", href: "/frete" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-red-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>contato@confortride.com.br</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>A definir</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} ConfortRide®. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-gray-300">Privacidade</Link>
            <Link href="/termos" className="hover:text-gray-300">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
