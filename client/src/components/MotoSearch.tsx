import { useState } from "react";
import { Link } from "wouter";
import { Search, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MotoSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = trpc.products.searchByModel.useQuery(
    { model: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  function handleChange(value: string) {
    setQuery(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedQuery(value.trim()), 400);
    setTimer(t);
  }

  const products = data?.products ?? [];

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Ex: Honda CB 500F, Yamaha MT-07, BMW R 1250 GS..."
          className="pl-10 h-12 bg-white text-gray-900 text-base rounded-xl border-0"
        />
      </div>

      {debouncedQuery.length >= 2 && (
        <div className="mt-3 text-left">
          {isLoading ? (
            <p className="text-gray-400 text-sm text-center py-3">Buscando...</p>
          ) : products.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-300 text-sm">Nenhum produto encontrado para "{debouncedQuery}"</p>
              <p className="text-gray-500 text-xs mt-1">Tente outro modelo ou entre em contato conosco</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((p: any) => (
                <Link key={p.id} href={`/produtos/${p.slug}`}>
                  <div className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors">
                    <div className="w-14 h-14 bg-gray-700 rounded-lg overflow-hidden shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏍️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{p.name}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {(p.compatible_models as string[])?.filter((m: string) => m.toLowerCase().includes(debouncedQuery.toLowerCase())).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-red-400 font-bold text-sm">{formatPrice(p.price)}</p>
                      <ChevronRight className="h-4 w-4 text-gray-500 ml-auto" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
