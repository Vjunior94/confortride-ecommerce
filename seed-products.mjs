import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Get existing categories
  const { data: cats, error: catErr } = await supabase.from("categories").select("id, slug").order("id");
  if (catErr) { console.error("Error fetching categories:", catErr.message); return; }
  console.log("Categories found:", cats.map(c => `${c.id}:${c.slug}`).join(", "));
  
  const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));

  const products = [
    {
      category_id: catMap["capacetes"],
      name: "Capacete Shark Spartan RS",
      slug: "capacete-shark-spartan-rs",
      description: "Capacete esportivo com viseira Pinlock anti-embaçante, ventilação avançada e interior removível e lavável. Homologado ECE 22.06.",
      price: 1299.90,
      original_price: 1599.90,
      image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      stock: 15,
      sku: "CAP-SHARK-RS-01",
      featured: true,
      active: true,
      images: [],
    },
    {
      category_id: catMap["capacetes"],
      name: "Capacete Arai RX-7V",
      slug: "capacete-arai-rx7v",
      description: "Capacete premium japonês com calota em fibra de carbono, máxima aerodinâmica e conforto para longas distâncias.",
      price: 3499.90,
      original_price: null,
      image_url: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&q=80",
      stock: 8,
      sku: "CAP-ARAI-RX7V",
      featured: true,
      active: true,
      images: [],
    },
    {
      category_id: catMap["jaquetas"],
      name: "Jaqueta Dainese Tempest 3",
      slug: "jaqueta-dainese-tempest-3",
      description: "Jaqueta impermeável com proteções CE nível 2 nos ombros e cotovelos, forro térmico removível e ventilação regulável.",
      price: 1899.90,
      original_price: 2299.90,
      image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
      stock: 20,
      sku: "JAQ-DAINESE-T3",
      featured: true,
      active: true,
      images: [],
    },
    {
      category_id: catMap["jaquetas"],
      name: "Jaqueta Alpinestars T-GP Plus R V3",
      slug: "jaqueta-alpinestars-tgp-plus-r-v3",
      description: "Jaqueta têxtil de alta performance com proteções Bio Armor, malha de ventilação e compatível com airbag Tech-Air.",
      price: 2199.90,
      original_price: null,
      image_url: "https://images.unsplash.com/photo-1605908502724-9093a79a1b39?w=600&q=80",
      stock: 12,
      sku: "JAQ-ALPINESTARS-TGPR3",
      featured: false,
      active: true,
      images: [],
    },
    {
      category_id: catMap["luvas"],
      name: "Luvas Alpinestars GP Pro R3",
      slug: "luvas-alpinestars-gp-pro-r3",
      description: "Luvas de couro para pista com proteção de carbono nos nós dos dedos, palma reforçada e fecho de velcro ajustável.",
      price: 549.90,
      original_price: 699.90,
      image_url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80",
      stock: 30,
      sku: "LUV-ALPS-GPR3",
      featured: true,
      active: true,
      images: [],
    },
    {
      category_id: catMap["luvas"],
      name: "Luvas Dainese Carbon 4 Long",
      slug: "luvas-dainese-carbon-4-long",
      description: "Luvas de couro com proteções de carbono, palma perfurada para ventilação e punho longo para proteção extra.",
      price: 799.90,
      original_price: null,
      image_url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80",
      stock: 18,
      sku: "LUV-DAINESE-C4L",
      featured: false,
      active: true,
      images: [],
    },
    {
      category_id: catMap["botas"],
      name: "Bota Alpinestars SMX-6 V2",
      slug: "bota-alpinestars-smx6-v2",
      description: "Bota esportiva com proteção de tornozelo, palmilha anatômica, fecho de velcro e zíper lateral para fácil calçar.",
      price: 1099.90,
      original_price: 1399.90,
      image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
      stock: 10,
      sku: "BOT-ALPS-SMX6V2",
      featured: true,
      active: true,
      images: [],
    },
    {
      category_id: catMap["acessorios"],
      name: "Intercomunicador Sena 50S",
      slug: "intercomunicador-sena-50s",
      description: "Intercomunicador Bluetooth 5.0 com alcance de 2km, suporte a 8 riders em conferência e integração com GPS e música.",
      price: 2499.90,
      original_price: 2999.90,
      image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
      stock: 7,
      sku: "ACESS-SENA-50S",
      featured: true,
      active: true,
      images: [],
    },
    {
      category_id: catMap["acessorios"],
      name: "Suporte de Celular para Moto",
      slug: "suporte-celular-moto",
      description: "Suporte universal para smartphone com fixação no guidão, proteção contra vibração e encaixe rápido. Compatível com telas de 4 a 7 polegadas.",
      price: 149.90,
      original_price: 199.90,
      image_url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80",
      stock: 50,
      sku: "ACESS-SUPORTE-CEL",
      featured: false,
      active: true,
      images: [],
    },
    {
      category_id: catMap["manutencao"],
      name: "Kit Limpeza e Conservação Moto",
      slug: "kit-limpeza-conservacao-moto",
      description: "Kit completo com shampoo neutro, cera protetora, silicone para plásticos, pano de microfibra e esponja. Ideal para manutenção regular.",
      price: 89.90,
      original_price: 119.90,
      image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      stock: 40,
      sku: "MAN-KIT-LIMPEZA",
      featured: false,
      active: true,
      images: [],
    },
  ];

  console.log("Inserting products...");
  const { data, error } = await supabase.from("products").insert(products).select();
  if (error) { console.error("Error inserting products:", error.message, error.details); return; }
  console.log(`✅ Created ${data.length} products successfully!`);
}

main().catch(console.error);
