import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { ShoppingCart, ArrowLeft, Package, Minus, Plus, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goNext = useCallback(() => goTo((current + 1) % images.length), [current, images.length, goTo]);
  const goPrev = useCallback(() => goTo((current - 1 + images.length) % images.length), [current, images.length, goTo]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(goNext, 4000);
    return () => clearInterval(timer);
  }, [goNext, images.length]);

  if (images.length === 1) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <img src={images[0]} alt={alt} className="w-full aspect-square object-cover" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group">
      {/* Slides */}
      <div className="aspect-square overflow-hidden relative">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((src, i) => (
            <img key={i} src={src} alt={`${alt} - ${i + 1}`} className="w-full h-full object-cover shrink-0" />
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={goPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="h-5 w-5 text-gray-700" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="h-5 w-5 text-gray-700" />
      </button>

      {/* Thumbnails */}
      <div className="flex gap-2 p-3 overflow-x-auto">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${i === current ? "border-red-600" : "border-transparent hover:border-gray-300"}`}
          >
            <img src={src} alt={`${alt} - ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const { data: product, isLoading } = trpc.products.bySlug.useQuery({ slug: slug! });
  const { addItem, items, setDrawerOpen } = useCart();

  const cartItem = items.find((i) => i.productId === product?.id);
  const cartQty = cartItem?.quantity ?? 0;

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({ productId: product.id, name: product.name, price: parseFloat(product.price), imageUrl: product.image_url, stock: product.stock });
    }
    setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
          <Link href="/produtos">
            <Button className="bg-red-600 hover:bg-red-700 text-white mt-4">Ver todos os produtos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.original_price && parseFloat(product.original_price) > parseFloat(product.price)
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.original_price)) * 100)
    : 0;

  const allImages: string[] = [
    ...(product.image_url ? [product.image_url] : []),
    ...((product.images as string[] | null) ?? []).filter((img: string) => img !== product.image_url),
  ];

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-red-600">Início</Link>
          <span>/</span>
          <Link href="/produtos" className="hover:text-red-600">Produtos</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Carousel */}
          {allImages.length > 0 ? (
            <ImageCarousel images={allImages} alt={product.name} />
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="aspect-square flex items-center justify-center text-8xl bg-gray-50">🏍️</div>
            </div>
          )}

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              {product.sku && <p className="text-sm text-gray-400 mt-1">SKU: {product.sku}</p>}
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-red-600">{formatPrice(product.price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.original_price!)}</span>
                  <span className="bg-red-100 text-red-700 text-sm font-bold px-2 py-0.5 rounded">-{discount}%</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700 font-medium">
                    {product.stock <= 5 ? `Apenas ${product.stock} em estoque!` : "Em estoque"}
                  </span>
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">Produto esgotado</span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Compatible Models */}
            {product.compatible_models && (product.compatible_models as string[]).length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Modelos de Moto Compatíveis</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(product.compatible_models as string[]).map((model: string, i: number) => (
                    <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">{model}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to cart */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock - cartQty, quantity + 1))}
                      className="px-3 py-2 hover:bg-gray-50 transition-colors"
                      disabled={quantity >= product.stock - cartQty}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {cartQty > 0 && <span className="text-xs text-gray-400">{cartQty} no carrinho</span>}
                </div>

                <Button
                  size="lg"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Adicionar ao Carrinho
                </Button>

                <Link href="/carrinho">
                  <Button size="lg" variant="outline" className="w-full border-gray-300">
                    Ver Carrinho
                  </Button>
                </Link>
              </div>
            )}

            {/* Back link */}
            <Link href="/produtos" className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar para produtos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
