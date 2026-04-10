import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Categories
const cats = [
  { name: "Capacetes", slug: "capacetes", description: "Capacetes para motociclistas com máxima proteção e conforto", active: 1 },
  { name: "Luvas", slug: "luvas", description: "Luvas para todas as condições de pilotagem", active: 1 },
  { name: "Jaquetas", slug: "jaquetas", description: "Jaquetas com proteção e estilo para a estrada", active: 1 },
  { name: "Botas", slug: "botas", description: "Calçados especializados para motociclistas", active: 1 },
  { name: "Acessórios", slug: "acessorios", description: "Acessórios e equipamentos para sua moto e pilotagem", active: 1 },
  { name: "Proteções", slug: "protecoes", description: "Equipamentos de proteção corporal", active: 1 },
];

for (const cat of cats) {
  try {
    await conn.execute(
      "INSERT IGNORE INTO categories (name, slug, description, active) VALUES (?, ?, ?, ?)",
      [cat.name, cat.slug, cat.description, cat.active]
    );
  } catch (e) { console.log("Cat skip:", cat.name, e.message); }
}

const [catRows] = await conn.execute("SELECT id, slug FROM categories");
const catMap = Object.fromEntries(catRows.map(r => [r.slug, r.id]));
console.log("Categories seeded:", Object.keys(catMap));

// Products
const ts = Date.now();
const products = [
  { categorySlug: "capacetes", name: "Capacete Arai RX-7V", slug: `capacete-arai-rx7v-${ts}`, description: "Capacete integral premium com ventilação avançada e viseira anti-risco. Certificação ECE 22.06. Ideal para uso esportivo e touring.", price: "2899.90", comparePrice: "3299.90", sku: "CAP-ARAI-001", stock: 8, featured: 1, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80" },
  { categorySlug: "capacetes", name: "Capacete LS2 FF800 Storm", slug: `capacete-ls2-ff800-${ts}`, description: "Capacete integral com sistema de ventilação Storm e viseira solar integrada. Levíssimo e confortável para longas viagens.", price: "899.90", comparePrice: "1099.90", sku: "CAP-LS2-002", stock: 15, featured: 1, imageUrl: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=500&q=80" },
  { categorySlug: "luvas", name: "Luvas Alpinestars GP Pro R3", slug: `luvas-alpinestars-gp-pro-${ts}`, description: "Luvas de corrida em couro com proteção de carbono nos nós dos dedos e palma reforçada. Máxima aderência no guidão.", price: "649.90", comparePrice: "749.90", sku: "LUV-ALP-001", stock: 20, featured: 1, imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&q=80" },
  { categorySlug: "luvas", name: "Luvas Dainese Carbon 4 Short", slug: `luvas-dainese-carbon4-${ts}`, description: "Luvas curtas com proteção de carbono, palma em couro canguru e fecho de velcro ajustável. Perfeitas para uso urbano.", price: "489.90", comparePrice: null, sku: "LUV-DAI-002", stock: 12, featured: 0, imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80" },
  { categorySlug: "jaquetas", name: "Jaqueta Alpinestars Missile V2", slug: `jaqueta-alpinestars-missile-${ts}`, description: "Jaqueta de couro com proteções CE Nível 2 nos ombros e cotovelos, bolso para proteção dorsal. Design esportivo e moderno.", price: "3499.90", comparePrice: "3999.90", sku: "JAC-ALP-001", stock: 5, featured: 1, imageUrl: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=500&q=80" },
  { categorySlug: "jaquetas", name: "Jaqueta Texx Armor Textile", slug: `jaqueta-texx-armor-${ts}`, description: "Jaqueta têxtil impermeável com proteções removíveis e forro térmico destacável. Ideal para todas as estações.", price: "899.90", comparePrice: "1099.90", sku: "JAC-TEX-002", stock: 10, featured: 0, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80" },
  { categorySlug: "botas", name: "Bota Alpinestars SMX-6 V2", slug: `bota-alpinestars-smx6-${ts}`, description: "Bota de corrida com sistema de fechamento rápido, proteção de tornozelo e solado antiderrapante. Certificação CE.", price: "1299.90", comparePrice: "1499.90", sku: "BOT-ALP-001", stock: 7, featured: 1, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" },
  { categorySlug: "acessorios", name: "Intercomunicador Cardo Packtalk Bold", slug: `intercomunicador-cardo-packtalk-${ts}`, description: "Sistema de comunicação Bluetooth com DMesh, alcance de 1,6km, resistente à água IPX7. Conecte até 15 pilotos.", price: "1899.90", comparePrice: "2199.90", sku: "INT-CAR-001", stock: 6, featured: 1, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" },
  { categorySlug: "acessorios", name: "Suporte de Celular Quad Lock Moto", slug: `suporte-celular-quad-lock-${ts}`, description: "Suporte de celular com sistema de trava dupla, compatível com todos os smartphones. Instalação sem ferramentas.", price: "299.90", comparePrice: "349.90", sku: "SUP-QL-002", stock: 25, featured: 0, imageUrl: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&q=80" },
  { categorySlug: "protecoes", name: "Colete de Airbag Helite Turtle 2", slug: `colete-airbag-helite-${ts}`, description: "Colete de airbag com ativação mecânica, proteção total do tronco e coluna. Recarregável e reutilizável.", price: "2199.90", comparePrice: "2499.90", sku: "COL-HEL-001", stock: 4, featured: 1, imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80" },
];

for (const p of products) {
  const catId = catMap[p.categorySlug];
  if (!catId) { console.log("No cat for", p.categorySlug); continue; }
  try {
    await conn.execute(
      "INSERT IGNORE INTO products (categoryId, name, slug, description, price, comparePrice, sku, stock, active, featured, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
      [catId, p.name, p.slug, p.description, p.price, p.comparePrice || null, p.sku, p.stock, p.featured, p.imageUrl]
    );
    console.log("Inserted:", p.name);
  } catch (e) { console.log("Product skip:", p.name, e.message); }
}

await conn.end();
console.log("Seed complete!");
