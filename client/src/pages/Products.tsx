import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Link } from "wouter";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Products() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCategory = params.get("categoria") ? Number(params.get("categoria")) : undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategory);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const cat = params.get("categoria");
    setSelectedCategory(cat ? Number(cat) : undefined);
  }, [search]);

  const { data: productsData, isLoading } = trpc.products.list.useQuery({
    search: searchTerm || undefined,
    categoryId: selectedCategory,
  });
  const products = productsData?.products ?? [];
  const productsTotal = productsData?.total ?? 0;
  const { data: categories } = trpc.categories.list.useQuery();
  const { addItem, setDrawerOpen } = useCart();

  const handleAddToCart = (product: any) => {
    addItem({ productId: product.id, name: product.name, price: parseFloat(product.price), imageUrl: product.imageUrl, stock: product.stock });
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            CATÁLOGO DE PRODUTOS
          </h1>
          <p className="text-gray-500 mt-1">
            {productsData ? `${productsTotal} produto${productsTotal !== 1 ? "s" : ""} encontrado${productsTotal !== 1 ? "s" : ""}` : "Carregando..."}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search & Filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "border-red-600 text-red-600" : ""}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Category filters */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-700">Categorias</h3>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(undefined)} className="text-xs text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" /> Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(undefined)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                Todos
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category pills (always visible) */}
        {!showFilters && categories && categories.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-red-300"}`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-red-300"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-semibold">Nenhum produto encontrado</p>
            <p className="text-sm mt-2">Tente ajustar os filtros ou a busca</p>
            {(searchTerm || selectedCategory) && (
              <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(""); setSelectedCategory(undefined); }}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <div key={product.id} className="product-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <Link href={`/produto/${product.slug}`}>
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🏍️</div>
                    )}
                    {product.original_price && parseFloat(product.original_price) > parseFloat(product.price) && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                        -{Math.round((1 - parseFloat(product.price) / parseFloat(product.comparePrice)) * 100)}%
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded">ESGOTADO</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/produto/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-red-600 transition-colors">{product.name}</h3>
                  </Link>
                  <div className="mt-2 flex items-center gap-2">
                    {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                    )}
                    <span className="font-bold text-red-600">{formatPrice(product.price)}</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white text-xs"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? "Esgotado" : "Adicionar ao Carrinho"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
