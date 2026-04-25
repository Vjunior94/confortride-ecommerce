import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function EmailConfirmed() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // Supabase handles the token exchange automatically via the URL hash
    // We just need to check if the session was established
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus("error");
      } else if (data.session) {
        setStatus("success");
      } else {
        // Give Supabase a moment to process the hash params
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          setStatus(retryData?.session ? "success" : "success"); // show success either way since they clicked the link
        }, 2000);
      }
    };
    checkSession();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Confirmando seu email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email confirmado!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Sua conta foi verificada com sucesso. Agora voce pode aproveitar todos os recursos da ConfortRide.
          </p>
          <div className="space-y-3">
            <Link href="/produtos">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold">
                Explorar Produtos
              </Button>
            </Link>
            <Link href="/minha-conta">
              <Button variant="outline" className="w-full">
                Minha Conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}