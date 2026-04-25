import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ConstructionGate from "./components/ConstructionGate";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import MyAccount from "./pages/MyAccount";
import Login from "./pages/Login";
import PaymentResult from "./pages/PaymentResult";
import EmailConfirmed from "./pages/EmailConfirmed";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import { trpc } from "./lib/trpc";

function usePWA() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[PWA] Service worker registered"))
        .catch((err) => console.warn("[PWA] SW registration failed:", err));
    }
  }, []);
}

function useSupabaseAuthSync() {
  const utils = trpc.useUtils();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      // Invalidate the auth.me query whenever auth state changes
      utils.auth.me.invalidate();
    });
    return () => subscription.unsubscribe();
  }, [utils]);
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/produtos" component={Products} />
      <Route path="/produto/:slug" component={ProductDetail} />
      <Route path="/carrinho" component={Cart} />
      <Route path="/pagamento/:status" component={PaymentResult} />
      <Route path="/minha-conta" component={MyAccount} />
      <Route path="/minha-conta/pedidos" component={MyAccount} />
      <Route path="/login" component={Login} />
      <Route path="/email-confirmado" component={EmailConfirmed} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  usePWA();
  useSupabaseAuthSync();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ConstructionGate>
        <ThemeProvider defaultTheme="light">
          <CartProvider>
            <TooltipProvider>
              <Toaster position="top-right" />
              <AppContent />
            </TooltipProvider>
          </CartProvider>
        </ThemeProvider>
      </ConstructionGate>
    </ErrorBoundary>
  );
}

export default App;
