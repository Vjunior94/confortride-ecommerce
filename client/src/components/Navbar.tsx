import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, User, LogOut, Settings, Package, ChevronDown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/LogoConfortRide_fb4b6e27.png";

const NAV_LINKS = [
  { label: "Início", href: "/" },
  { label: "Produtos", href: "/produtos" },
  { label: "Categorias", href: "/categorias" },
  { label: "Sobre", href: "/sobre" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const utils = trpc.useUtils();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    await utils.auth.me.invalidate();
    toast.success("Até logo!");
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo — fills full header height */}
          <Link href="/" className="flex items-stretch shrink-0 h-full">
            <img src={LOGO_URL} alt="ConfortRide" className="h-full w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link href="/carrinho">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 hidden md:flex">
                    <User className="h-4 w-4" />
                    <span className="max-w-24 truncate text-sm">{user?.name?.split(" ")[0]}</span>
                    {user?.role === "admin" && <span className="badge-admin">Admin</span>}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/minha-conta">
                      <User className="h-4 w-4 mr-2" /> Minha Conta
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/minha-conta/pedidos">
                      <Package className="h-4 w-4 mr-2" /> Meus Pedidos
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Settings className="h-4 w-4 mr-2" /> Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="hidden md:flex bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => navigate("/login")}>
                Entrar
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-gray-700 hover:text-red-600 py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link href="/minha-conta" className="block text-sm font-medium text-gray-700 py-1" onClick={() => setMobileOpen(false)}>
                Minha Conta
              </Link>
              <Link href="/minha-conta/pedidos" className="block text-sm font-medium text-gray-700 py-1" onClick={() => setMobileOpen(false)}>
                Meus Pedidos
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="block text-sm font-medium text-red-600 py-1" onClick={() => setMobileOpen(false)}>
                  Painel Admin
                </Link>
              )}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="block text-sm font-medium text-red-600 py-1"
              >
                Sair
              </button>
            </>
          ) : (
            <Button
              size="sm"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
                         onClick={() => { navigate("/login"); setMobileOpen(false); }}>
              Entrar / Cadastrarar
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
