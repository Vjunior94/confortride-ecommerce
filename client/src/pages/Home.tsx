import { Link } from "wouter";
import { ArrowRight, Shield, Truck, Star, Headphones } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/LogoConfortRide_fb4b6e27.png";

const HERO_SLIDES = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/slide_5s_6df57508.jpg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/slide_12s_a7f3ee2c.jpg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/slide_22s_81be30b0.jpg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/slide_28s_a5d51b0d.jpg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/slide_32s_63332af5.jpg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/slide_39s_2abca589.jpg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/slide_41s_2dad3e68.jpg",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/slide_42s_95f4bd5d.jpg",
];

const FEATURES = [
  { icon: Shield, title: "Qualidade Garantida", desc: "Produtos testados e aprovados por motociclistas" },
  { icon: Truck, title: "Entrega Rápida", desc: "Envio para todo o Brasil com rastreamento" },
  { icon: Star, title: "Melhor Avaliados", desc: "Mais de 5 mil clientes satisfeitos" },
  { icon: Headphones, title: "Suporte Especializado", desc: "Atendimento por quem entende de motos" },
];

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Home() {
  const { data: featuredProductsData } = trpc.products.list.useQuery({ featured: true, limit: 8 });
  const featuredProducts = featuredProductsData?.products ?? [];
  const { data: categories } = trpc.categories.list.useQuery();
  const { addItem } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevSlide(currentSlide);
      setTransitioning(true);
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      setTimeout(() => {
        setPrevSlide(null);
        setTransitioning(false);
      }, 1200);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  const handleAddToCart = (product: any) => {
    addItem({ productId: product.id, name: product.name, price: parseFloat(product.price), imageUrl: product.imageUrl, stock: product.stock });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[75vh] min-h-[450px] flex items-center justify-center overflow-hidden">
        {/* Slideshow background */}
        {prevSlide !== null && (
          <img
            key={`prev-${prevSlide}`}
            src={HERO_SLIDES[prevSlide]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
        )}
        <img
          key={`curr-${currentSlide}`}
          src={HERO_SLIDES[currentSlide]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            zIndex: 1,
            animation: transitioning
              ? 'heroFadeIn 1.2s ease-in-out forwards, heroKenBurns 6s ease-out forwards'
              : 'heroKenBurns 6s ease-out forwards',
          }}
        />
        {/* Preload next slide */}
        <link rel="preload" as="image" href={HERO_SLIDES[(currentSlide + 1) % HERO_SLIDES.length]} />
        <div className="absolute inset-0 hero-overlay" style={{ zIndex: 2 }} />
        <div className="relative text-center text-white px-4 max-w-4xl mx-auto" style={{ zIndex: 3 }}>
          <img src={LOGO_URL} alt="ConfortRide" className="h-20 md:h-28 w-auto mx-auto mb-6 drop-shadow-2xl brightness-0 invert" />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}>
            CONFORTRIDE.<br /><span className="text-red-400">PARA HOMEM E MÁQUINA.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Produtos de qualidade e estilo, para expor suas maiores emoções.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/produtos">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-semibold">
                Ver Produtos <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/categorias">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg bg-transparent">
                Explorar Categorias
              </Button>
            </Link>
          </div>
        </div>
        {/* Slide indicators */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2" style={{ zIndex: 10 }}>
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setPrevSlide(currentSlide);
                setTransitioning(true);
                setCurrentSlide(i);
                setTimeout(() => { setPrevSlide(null); setTransitioning(false); }, 1200);
              }}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide
                  ? 'w-8 h-2 bg-red-500'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ zIndex: 10 }}>
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/70 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 text-white">
                <div className="bg-red-600 p-2 rounded-lg shrink-0"><Icon className="h-5 w-5" /></div>
                <div><p className="font-semibold text-sm">{title}</p><p className="text-xs text-gray-400 mt-0.5">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>CATEGORIAS</h2>
              <p className="text-gray-500 mt-2">Encontre o que você precisa</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/produtos?categoria=${cat.id}`}>
                  <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 aspect-square flex items-center justify-center cursor-pointer">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center"><span className="text-4xl">🏍️</span></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                      <span className="text-white font-semibold text-sm">{cat.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>PRODUTOS EM DESTAQUE</h2>
              <p className="text-gray-500 mt-1">Os mais procurados pelos motociclistas</p>
            </div>
            <Link href="/produtos">
              <Button variant="outline" className="hidden md:flex border-red-600 text-red-600 hover:bg-red-50">
                Ver todos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {featuredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Nenhum produto em destaque ainda.</p>
              <p className="text-sm mt-2">O administrador pode adicionar produtos pelo painel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="product-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <Link href={`/produto/${product.slug}`}>
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🏍️</div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/produto/${product.slug}`}>
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-red-600 transition-colors">{product.name}</h3>
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      {product.original_price && parseFloat(product.original_price) > parseFloat(product.price) && (
                        <span className="text-xs text-gray-400 line-through">{formatPrice(product.original_price)}</span>
                      )}
                      <span className="font-bold text-red-600">{formatPrice(product.price)}</span>
                    </div>
                    <Button size="sm" className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white text-xs" onClick={() => handleAddToCart(product)} disabled={product.stock === 0}>
                      {product.stock === 0 ? "Esgotado" : "Adicionar ao Carrinho"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-red-600 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            PRONTO PARA ELEVAR SUA EXPERIÊNCIA?
          </h2>
          <p className="text-red-100 mb-8 max-w-xl mx-auto">Cadastre-se e receba notificações exclusivas sobre novos produtos e promoções.</p>
          <Link href="/produtos">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 font-semibold px-8">Explorar Catálogo Completo</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
