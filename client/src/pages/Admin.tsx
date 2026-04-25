import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Package, ShoppingBag, Users, TrendingUp, Plus, Pencil, Trash2, ChevronDown,
  LayoutDashboard, Tag, ArrowLeft, Check, X, Search, Upload, Eye, ClipboardList,
  MessageSquarePlus, FileText, Lightbulb,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Aguardando Pagamento", pending: "Pendente", confirmed: "Confirmado", processing: "Em Processamento",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado", payment_failed: "Pagamento Recusado",
};

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: "bg-yellow-100 text-yellow-800",
  pending: "bg-orange-100 text-orange-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  payment_failed: "bg-red-100 text-red-800",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX", credit_card: "Cartão de Crédito", boleto: "Boleto Bancário",
};

type AdminTab = "dashboard" | "products" | "orders" | "categories" | "users" | "checklist";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<AdminTab>("dashboard");

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "staff")) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 mb-4">Você não tem permissão para acessar esta página.</p>
          <Link href="/"><Button className="bg-red-600 hover:bg-red-700 text-white">Voltar ao Início</Button></Link>
        </div>
      </div>
    );
  }

  const ALL_NAV_ITEMS = [
    { id: "dashboard" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "products" as AdminTab, label: "Produtos", icon: Package, adminOnly: true },
    { id: "orders" as AdminTab, label: "Pedidos", icon: ShoppingBag },
    { id: "categories" as AdminTab, label: "Categorias", icon: Tag, adminOnly: true },
    { id: "users" as AdminTab, label: "Usuários", icon: Users, adminOnly: true },
    { id: "checklist" as AdminTab, label: "Checklist", icon: ClipboardList, adminOnly: true },
  ];
  const NAV_ITEMS = user?.role === "admin" ? ALL_NAV_ITEMS : ALL_NAV_ITEMS.filter(i => !i.adminOnly);

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-gray-900 min-h-[calc(100vh-4rem)] hidden md:flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Painel Admin</p>
            <p className="text-white font-semibold text-sm mt-1 truncate">{user?.name}</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-red-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-800">
            <Link href="/">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar ao Site
              </button>
            </Link>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 flex border-t border-gray-800">
          {NAV_ITEMS.slice(0, 4).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex-1 flex flex-col items-center py-2 text-xs ${tab === id ? "text-red-400" : "text-gray-400"}`}>
              <Icon className="h-5 w-5 mb-0.5" />{label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {tab === "dashboard" && <DashboardTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "categories" && <CategoriesTab />}
          {tab === "users" && <UsersTab />}
          {tab === "checklist" && <ChecklistTab />}
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardTab() {
  const { data: stats } = trpc.orders.stats.useQuery();
  const { data: recentOrdersData } = trpc.orders.adminList.useQuery({ limit: 5 });
  const recentOrders = recentOrdersData?.orders ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>DASHBOARD</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Pedidos", value: stats?.total ?? 0, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
          { label: "Aguardando Pgto", value: stats?.awaiting_payment ?? 0, icon: ShoppingBag, color: "bg-yellow-50 text-yellow-600" },
          { label: "Confirmados", value: stats?.confirmed ?? 0, icon: Check, color: "bg-blue-50 text-blue-600" },
          { label: "Em Processamento", value: stats?.processing ?? 0, icon: Package, color: "bg-indigo-50 text-indigo-600" },
          { label: "Enviados", value: stats?.shipped ?? 0, icon: Package, color: "bg-purple-50 text-purple-600" },
          { label: "Entregues", value: stats?.delivered ?? 0, icon: Check, color: "bg-green-50 text-green-600" },
          { label: "Cancelados", value: stats?.cancelled ?? 0, icon: X, color: "bg-red-50 text-red-600" },
          { label: "Receita Total", value: formatPrice(stats?.revenue ?? 0), icon: TrendingUp, color: "bg-green-50 text-green-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {recentOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Pedidos Recentes</h3>
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">Pedido #{order.id}</p>
                  <p className="text-xs text-gray-400">{order.profiles?.name ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
/**
 * Parses a comma-separated model list, inheriting the prefix from the previous
 * named model when an entry is just a number.
 * E.g. "Ninja 250, 300, 400, Z900, Z500" → ["Ninja 250", "Ninja 300", "Ninja 400", "Z900", "Z500"]
 */
function parseModels(input: string): string[] {
  const raw = input.split(",").map(s => s.trim()).filter(Boolean);
  const result: string[] = [];
  let lastPrefix = "";

  for (const item of raw) {
    // If the item is purely numeric (e.g. "300", "1000"), inherit the last prefix
    if (/^\d+$/.test(item) && lastPrefix) {
      result.push(`${lastPrefix} ${item}`);
    } else {
      result.push(item);
      // Extract prefix: everything before the last space+number sequence
      // "Ninja 250" → "Ninja", "Fazer 250" → "Fazer", "Z900" → stays as-is (no space)
      const prefixMatch = item.match(/^(.+?)\s+\d+.*$/);
      if (prefixMatch) {
        lastPrefix = prefixMatch[1];
      }
      // If no space+number pattern (e.g. "Z900", "ZX-10R"), don't update prefix
    }
  }
  return result;
}

function ProductsTab() {
  const utils = trpc.useUtils();
  const { data: productsData, isLoading } = trpc.products.listAdmin.useQuery();
  const products = productsData?.products ?? [];
  const { data: categories } = trpc.categories.list.useQuery();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ categoryId: "", name: "", description: "", price: "", comparePrice: "", images: [] as string[], sku: "", stock: "0", featured: false, compatibleModels: [] as string[] });
  const [modelInput, setModelInput] = useState("");

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.listAdmin.invalidate(); toast.success("Produto criado!"); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.listAdmin.invalidate(); toast.success("Produto atualizado!"); setShowForm(false); setEditProduct(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.listAdmin.invalidate(); toast.success("Produto removido!"); },
  });
  const uploadMutation = trpc.upload.image.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const tooBig = files.filter(f => f.size > 5 * 1024 * 1024);
    if (tooBig.length) { toast.error(`${tooBig.length} imagem(ns) excede(m) 5MB.`); return; }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await uploadMutation.mutateAsync({ base64, fileName: file.name, contentType: file.type });
        urls.push(result.url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} imagem(ns) enviada(s)!`);
    } catch { /* error handled by mutation */ }
    setUploading(false);
    e.target.value = "";
  }

  const resetForm = () => { setForm({ categoryId: "", name: "", description: "", price: "", comparePrice: "", images: [], sku: "", stock: "0", featured: false, compatibleModels: [] }); setModelInput(""); };

  const openEdit = (p: any) => {
    setEditProduct(p);
    const existingImages = p.images?.length ? p.images : (p.image_url ? [p.image_url] : []);
    setForm({ categoryId: String(p.category_id), name: p.name, description: p.description ?? "", price: String(p.price), comparePrice: String(p.original_price ?? ""), images: existingImages, sku: p.sku ?? "", stock: String(p.stock), featured: p.featured, compatibleModels: p.compatible_models ?? [] });
    setShowForm(true);
  };

  const parsePrice = (v: string) => Number(v.replace(",", "."));

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.categoryId) { toast.error("Preencha nome, preço e categoria."); return; }
    const price = parsePrice(form.price);
    const originalPrice = form.comparePrice ? parsePrice(form.comparePrice) : undefined;
    if (isNaN(price)) { toast.error("Preço inválido."); return; }
    if (originalPrice !== undefined && isNaN(originalPrice)) { toast.error("Preço original inválido."); return; }
    // Captura modelos pendentes no campo de texto
    const pendingModels = parseModels(modelInput);
    const allModels = [...form.compatibleModels, ...pendingModels];
    setModelInput("");
    const data = { category_id: Number(form.categoryId), name: form.name, description: form.description || undefined, price, original_price: originalPrice, image_url: form.images[0] || undefined, images: form.images, sku: form.sku || undefined, stock: Number(form.stock), featured: form.featured, compatible_models: allModels };
    if (editProduct) updateMutation.mutate({ id: editProduct.id, ...data });
    else createMutation.mutate(data as any);
  };

  const filtered = products.filter((p: any) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>PRODUTOS</h2>
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { resetForm(); setEditProduct(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum produto cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Produto</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Preço</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Estoque</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🏍️</div>}
                        </div>
                        <div>
                          <a href={`/produto/${p.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-red-600 hover:underline line-clamp-1 transition-colors">{p.name}</a>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.featured && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Destaque</span>}
                            {p.compatible_models?.length > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{p.compatible_models.length} motos</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-medium text-red-600">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`font-medium ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-yellow-600" : "text-green-600"}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.active ? "Ativo" : "Inativo"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => { if (confirm("Remover produto?")) deleteMutation.mutate({ id: p.id }); }} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { setEditProduct(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Categoria *</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{categories?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$) *</Label>
                <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="99.90" className="mt-1" />
              </div>
              <div>
                <Label>Preço Original (R$)</Label>
                <Input value={form.comparePrice} onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))} placeholder="129.90" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Imagens do Produto</Label>
              <div className="mt-1 space-y-2">
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[10px] text-center py-0.5">Principal</span>}
                        <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="h-4 w-4 text-gray-500" />
                  {uploading ? "Enviando..." : "Enviar imagens"}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
                {form.images.length > 0 && <p className="text-xs text-gray-400">A primeira imagem será a principal. Arraste para reordenar em breve.</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Estoque</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} min="0" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Modelos de Moto Compatíveis</Label>
              <div className="mt-1 space-y-2">
                {form.compatibleModels.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {form.compatibleModels.map((model, i) => {
                        const isDuplicate = form.compatibleModels.indexOf(model) !== i;
                        return (
                          <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isDuplicate ? "bg-red-100 text-red-700 ring-1 ring-red-300" : "bg-gray-100 text-gray-700"}`}>
                            {model}
                            {isDuplicate && <span className="text-[10px]">(duplicado)</span>}
                            <button type="button" onClick={() => setForm(f => ({ ...f, compatibleModels: f.compatibleModels.filter((_, j) => j !== i) }))} className={`${isDuplicate ? "text-red-400 hover:text-red-600" : "text-gray-400 hover:text-red-500"}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    <button type="button" onClick={() => {
                      if (window.confirm(`Tem certeza que deseja remover todos os ${form.compatibleModels.length} modelos compatíveis?`)) {
                        setForm(f => ({ ...f, compatibleModels: [] }));
                      }
                    }} className="text-xs text-red-500 hover:text-red-700 underline">
                      Remover todos ({form.compatibleModels.length})
                    </button>
                  </div>
                )}
                <Input
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder="Ex: Honda CB 500F, Yamaha MT-07, BMW R 1250 — Enter para adicionar"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const models = parseModels(modelInput);
                      if (models.length > 0) {
                        setForm(f => ({ ...f, compatibleModels: [...f.compatibleModels, ...models] }));
                        setModelInput("");
                      }
                    }
                  }}
                />
                <p className="text-xs text-gray-400">Separe por vírgula para adicionar vários de uma vez. Pressione Enter.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-red-600" />
              <Label htmlFor="featured">Produto em destaque</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditProduct(null); resetForm(); }}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editProduct ? "Salvar" : "Criar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────
function OrdersTab() {
  const utils = trpc.useUtils();
  const PAGE_SIZE = 20;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: ordersData, isLoading } = trpc.orders.adminList.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const orders = ordersData?.orders ?? [];
  const totalOrders = ordersData?.total ?? 0;
  const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

  const filteredOrders = searchQuery.trim()
    ? orders.filter((o: any) => {
        const q = searchQuery.trim().toLowerCase();
        const idMatch = String(o.id).includes(q.replace("#", ""));
        const nameMatch = o.profiles?.name?.toLowerCase().includes(q);
        return idMatch || nameMatch;
      })
    : orders;
  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { utils.orders.adminList.invalidate(); toast.success("Status atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  // Order detail state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: orderDetail, isLoading: isDetailLoading } = trpc.orders.detail.useQuery(
    { id: selectedOrderId! },
    { enabled: selectedOrderId !== null }
  );

  // Shipping dialog state
  const [shippingDialog, setShippingDialog] = useState<{ orderId: number } | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [carrier, setCarrier] = useState("");

  function handleStatusChange(orderId: number, newStatus: string) {
    if (newStatus === "shipped") {
      setTrackingCode("");
      setCarrier("");
      setShippingDialog({ orderId });
      return;
    }
    updateStatusMutation.mutate({ id: orderId, status: newStatus as any });
  }

  function handleShippingConfirm() {
    if (!shippingDialog || !trackingCode.trim()) {
      toast.error("Informe o código de rastreio.");
      return;
    }
    updateStatusMutation.mutate({
      id: shippingDialog.orderId,
      status: "shipped",
      trackingCode: trackingCode.trim(),
      carrier: carrier.trim() || undefined,
    });
    setShippingDialog(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>PEDIDOS</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar #ID ou cliente..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="pl-8 w-48 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{searchQuery ? "Nenhum pedido encontrado." : "Nenhum pedido ainda."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Pedido</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Total</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Data</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">#{order.id}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">{order.profiles?.name ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell font-medium text-red-600">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v)}
                      >
                        <SelectTrigger className={`h-7 text-xs w-36 status-${order.status} border-0`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedOrderId(order.id)}>
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalOrders)} de {totalOrders}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {isDetailLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando detalhes...</div>
          ) : orderDetail ? (() => {
            const addr = orderDetail.address_snapshot as any;
            const payment = orderDetail.payment_data as any;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    Pedido #{orderDetail.id}
                    <Badge className={`${STATUS_COLORS[orderDetail.status] ?? "bg-gray-100 text-gray-800"} text-xs font-medium border-0`}>
                      {STATUS_LABELS[orderDetail.status] ?? orderDetail.status}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    {new Date(orderDetail.created_at).toLocaleString("pt-BR")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  {/* Cliente */}
                  <section>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Cliente</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                      <p><span className="text-gray-500">Nome:</span> {orderDetail.profiles?.name ?? "—"}</p>
                      <p><span className="text-gray-500">Email:</span> {orderDetail.profiles?.email ?? "—"}</p>
                      <p><span className="text-gray-500">Telefone:</span> {orderDetail.profiles?.phone ?? "—"}</p>
                    </div>
                  </section>

                  {/* Endereço de Entrega */}
                  {addr && (
                    <section>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Endereço de Entrega</h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p>{addr.street}{addr.number ? `, ${addr.number}` : ""}</p>
                        {addr.complement && <p>{addr.complement}</p>}
                        <p>{addr.neighborhood}{addr.city ? ` — ${addr.city}` : ""}{addr.state ? `/${addr.state}` : ""}</p>
                        <p className="text-gray-500">CEP: {addr.zipCode ?? addr.cep ?? "—"}</p>
                      </div>
                    </section>
                  )}

                  {/* Itens do Pedido */}
                  <section>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Itens do Pedido</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-3 py-2 text-gray-600 font-medium">Produto</th>
                            <th className="text-center px-3 py-2 text-gray-600 font-medium w-16">Qtd</th>
                            <th className="text-right px-3 py-2 text-gray-600 font-medium w-24">Unitário</th>
                            <th className="text-right px-3 py-2 text-gray-600 font-medium w-24">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(orderDetail.order_items as any[])?.map((item: any) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {item.productImageUrl && (
                                    <img src={item.productImageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                  )}
                                  <span className="text-gray-900">{item.productName ?? `Produto #${item.productId}`}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{formatPrice(item.unitPrice)}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">{formatPrice(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="border-t bg-gray-50 px-3 py-2 text-sm space-y-1">
                        {orderDetail.subtotal && (
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(orderDetail.subtotal)}</span>
                          </div>
                        )}
                        {orderDetail.shipping_cost != null && Number(orderDetail.shipping_cost) > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Frete</span>
                            <span>{formatPrice(orderDetail.shipping_cost)}</span>
                          </div>
                        )}
                        {orderDetail.discount != null && Number(orderDetail.discount) > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Desconto</span>
                            <span>-{formatPrice(orderDetail.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                          <span>Total</span>
                          <span className="text-red-600">{formatPrice(orderDetail.total)}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Pagamento */}
                  <section>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Pagamento</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                      <p><span className="text-gray-500">Método:</span> {PAYMENT_METHOD_LABELS[orderDetail.payment_method ?? ""] ?? orderDetail.payment_method ?? "—"}</p>
                      <p><span className="text-gray-500">Status:</span> {orderDetail.payment_status ?? "—"}</p>
                      {orderDetail.payment_id && (
                        <p><span className="text-gray-500">ID Pagamento:</span> <span className="font-mono text-xs">{orderDetail.payment_id}</span></p>
                      )}
                      {payment?.card_last_four && (
                        <p><span className="text-gray-500">Cartão:</span> **** {payment.card_last_four}</p>
                      )}
                      {payment?.installments && payment.installments > 1 && (
                        <p><span className="text-gray-500">Parcelas:</span> {payment.installments}x</p>
                      )}
                    </div>
                  </section>

                  {/* Rastreio */}
                  {orderDetail.tracking_code && (
                    <section>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Rastreio</h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                        <p><span className="text-gray-500">Código:</span> <span className="font-mono">{orderDetail.tracking_code}</span></p>
                        {orderDetail.carrier && (
                          <p><span className="text-gray-500">Transportadora:</span> {orderDetail.carrier}</p>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Observações */}
                  {orderDetail.notes && (
                    <section>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Observações</h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{orderDetail.notes}</div>
                    </section>
                  )}
                </div>
              </>
            );
          })() : null}
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog - asks for tracking code and carrier */}
      <Dialog open={!!shippingDialog} onOpenChange={(open) => !open && setShippingDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informações de Envio — Pedido #{shippingDialog?.orderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="trackingCode">Código de Rastreio *</Label>
              <Input
                id="trackingCode"
                placeholder="Ex: BR123456789XX"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier">Transportadora</Label>
              <Input
                id="carrier"
                placeholder="Ex: Correios, Jadlog, Total Express"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">
              O cliente será notificado por e-mail e WhatsApp com essas informações.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingDialog(null)}>Cancelar</Button>
            <Button onClick={handleShippingConfirm} disabled={updateStatusMutation.isPending}>
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoriesTab() {
  const utils = trpc.useUtils();
  const { data: categories } = trpc.categories.listAll.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.listAll.invalidate(); utils.categories.list.invalidate(); toast.success("Categoria criada!"); setShowForm(false); setForm({ name: "", description: "", imageUrl: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.listAll.invalidate(); utils.categories.list.invalidate(); toast.success("Categoria atualizada!"); setShowForm(false); setEditCat(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.listAll.invalidate(); utils.categories.list.invalidate(); toast.success("Categoria removida!"); },
  });

  const openEdit = (c: any) => { setEditCat(c); setForm({ name: c.name, description: c.description ?? "", imageUrl: c.imageUrl ?? "" }); setShowForm(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>CATEGORIAS</h2>
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { setEditCat(null); setForm({ name: "", description: "", imageUrl: "" }); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Categoria
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🏷️</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{cat.name}</p>
              <p className="text-xs text-gray-400 truncate">{cat.description || "Sem descrição"}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(cat)} className="text-gray-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => { if (confirm("Remover categoria?")) deleteMutation.mutate({ id: cat.id }); }} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditCat(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" /></div>
            <div><Label>URL da Imagem</Label><Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditCat(null); }}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => {
              if (!form.name) { toast.error("Nome obrigatório"); return; }
              if (editCat) updateMutation.mutate({ id: editCat.id, ...form });
              else createMutation.mutate(form);
            }}>
              {editCat ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
function UsersTab() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: users } = trpc.users.list.useQuery();
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success("Perfil atualizado!"); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>USUÁRIOS</h2>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Perfil</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Cadastro</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "staff" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{u.role === "admin" ? "Admin" : u.role === "staff" ? "Operador" : "Cliente"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">{new Date(u.created_at ?? u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.id === user?.id ? (
                      <span className="text-xs text-gray-400">Você</span>
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={(v) => updateRoleMutation.mutate({ id: u.id, role: v as any })}
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Cliente</SelectItem>
                          <SelectItem value="staff">Operador</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Checklist Reunião ────────────────────────────────────────────────────────
const CHECKLIST_SECTIONS = [
  {
    id: "meta",
    title: "1. Meta Business Manager",
    subtitle: "Resolver acesso + WhatsApp API",
    badge: "CRITICO",
    badgeColor: "bg-red-100 text-red-700",
    alert: { type: "danger" as const, text: "Problema: O convite enviado pelo cliente para administrar a conta Meta Business nao foi encontrado. Tentativa em 22/04 falhou. Resolver presencialmente." },
    steps: [
      { label: "1.1 Acessar o Meta Business do cliente", tag: "CLIENTE", desc: "Pedir para o Diomar logar em business.facebook.com no computador/celular dele. Verificar qual conta Business existe." },
      { label: "1.2 Verificar convites pendentes", tag: "JUNTOS", desc: "No Meta Business: Configuracoes > Pessoas. Ver se o convite aparece la. Se nao, remover e reenviar. Usar o email correto (confirmar com Diomar)." },
      { label: "1.3 Alternativa: Adicionar diretamente", tag: "CLIENTE", desc: "Se convite nao funcionar: Configuracoes > Pessoas > Adicionar. Adicionar seu email como Admin. Aceitar na hora pelo celular." },
      { label: "1.4 Verificar conta WhatsApp Business vinculada", tag: "JUNTOS", desc: "No Meta Business: Configuracoes > Contas > Conta do WhatsApp. Se nao existir, criar. Vincular o numero comercial (43) 9602-1892." },
      { label: "1.5 Criar App no Meta Developers", tag: "DEV", desc: "Ir em developers.facebook.com > Meus Apps > Criar App > Tipo: Business > Vincular a conta Business do cliente.\n\nTipo: Business\nNome: ConfortRide API\nConta Business: (selecionar a do Diomar)" },
      { label: "1.6 Ativar WhatsApp no App", tag: "DEV", desc: "No App criado: Adicionar Produto > WhatsApp > Configurar. Selecionar a conta WhatsApp Business vinculada." },
      { label: "1.7 Obter WHATSAPP_PHONE_ID", tag: "DEV", desc: "No App: WhatsApp > Configuracao da API. Copiar o Phone Number ID do numero vinculado.\n\nWHATSAPP_PHONE_ID=________________\n# Copiar daqui: App > WhatsApp > API Setup > Phone number ID" },
      { label: "1.8 Criar System User + Token permanente", tag: "DEV", desc: "business.facebook.com > Configuracoes > Usuarios do sistema > Adicionar\nNome: \"ConfortRide API\", Funcao: Admin.\nDepois: Gerar token > Selecionar o App > Permissoes: whatsapp_business_messaging, whatsapp_business_management.\n\nWHATSAPP_TOKEN=________________\n# Token permanente do System User (nao expira)" },
      { label: "1.9 Cadastrar os 5 templates de mensagem", tag: "DEV", desc: "No Meta Business: WhatsApp > Gerenciamento de conta > Modelos de mensagem > Criar modelo.\nCadastrar os 5 templates (copiar do arquivo whatsapp-templates-meta.md):\n\n1. order_confirmation - Pedido recebido\n2. payment_confirmed - Pagamento aprovado\n3. order_shipped - Pedido enviado\n4. delivery_thankyou - Pedido entregue\n5. payment_reminder - Lembrete de pagamento\n\nℹ Templates levam de minutos a 48h para aprovar. Cadastre todos de uma vez para nao perder tempo." },
    ],
  },
  {
    id: "mp",
    title: "2. Mercado Pago - Producao",
    subtitle: "Trocar credenciais TEST por PROD",
    badge: "CRITICO",
    badgeColor: "bg-red-100 text-red-700",
    alert: { type: "success" as const, text: "Codigo pronto! Integracao completa (PIX, cartao, boleto, webhook). So falta trocar as credenciais de teste pelas de producao." },
    steps: [
      { label: "2.1 Acessar conta Mercado Pago do cliente", tag: "CLIENTE", desc: "Pedir ao Diomar para logar em mercadopago.com.br. Ir em Seu negocio > Configuracoes > Gestao e administracao > Credenciais." },
      { label: "2.2 Selecionar \"Credenciais de producao\"", tag: "JUNTOS", desc: "Na pagina de credenciais, alternar para Producao (nao Teste). Copiar os dois valores abaixo." },
      { label: "2.3 Copiar Access Token e Public Key", tag: "DEV", desc: "MERCADO_PAGO_ACCESS_TOKEN=APP_USR-_______________\nMERCADO_PAGO_PUBLIC_KEY=APP_USR-_______________\nVITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-_______________\n# Public Key vai nos dois campos (MERCADO_PAGO_ e VITE_)" },
      { label: "2.4 Atualizar .env no Railway", tag: "DEV", desc: "Acessar railway.app > ConfortRide > Variables. Atualizar as 3 variaveis com as credenciais de producao. Fazer redeploy." },
      { label: "2.5 Configurar Webhook de producao", tag: "DEV", desc: "No Mercado Pago: Seu negocio > Webhooks (IPN). Cadastrar a URL de producao:\n\nURL: https://confortride.com.br/api/webhooks/mercadopago\nEventos: payment" },
      { label: "2.6 Testar pagamento real (PIX de R$1)", tag: "JUNTOS", desc: "Fazer um pedido de teste na loja com PIX de valor baixo. Confirmar que webhook atualiza o status automaticamente." },
    ],
  },
  {
    id: "email",
    title: "3. Email - Enviar Como no Gmail",
    subtitle: "Responder como contato@confortride.com.br",
    badge: "IMPORTANTE",
    badgeColor: "bg-yellow-100 text-yellow-700",
    alert: { type: "success" as const, text: "Recebimento funciona! Emails para contato@confortride.com.br ja chegam no Gmail do Diomar. Falta configurar o envio como esse endereco." },
    steps: [
      { label: "3.1 Ativar verificacao em 2 etapas no Google", tag: "CLIENTE", desc: "No Gmail (diomarconfortride@gmail.com): Gerenciar conta Google > Seguranca > Verificacao em duas etapas > Ativar." },
      { label: "3.2 Criar Senha de App", tag: "CLIENTE", desc: "Ainda em Seguranca: Senhas de app. Nome: \"Email ConfortRide\". Copiar a senha de 16 caracteres gerada." },
      { label: "3.3 Configurar \"Enviar como\" no Gmail", tag: "JUNTOS", desc: "Gmail: Configuracoes (engrenagem) > Ver todas > Contas e importacao > Enviar e-mail como > Adicionar outro endereco\n\nNome: ConfortRide\nEmail: contato@confortride.com.br\nTratar como alias: SIM\n---\nServidor SMTP: smtp.gmail.com\nPorta: 587\nUsuario: diomarconfortride@gmail.com\nSenha: (senha de app criada no passo anterior)\nConexao: TLS" },
      { label: "3.4 Confirmar codigo de verificacao", tag: "CLIENTE", desc: "O Google envia um email de confirmacao para o proprio Gmail (via Cloudflare routing). Abrir e confirmar o codigo." },
      { label: "3.5 Definir como padrao", tag: "CLIENTE", desc: "Em \"Enviar e-mail como\", clicar em \"tornar padrao\" ao lado de contato@confortride.com.br. Assim todas as respostas saem com o email profissional." },
    ],
  },
  {
    id: "railway",
    title: "4. Deploy - Atualizar Railway",
    subtitle: "Subir variaveis e redeploy",
    badge: "FINAL",
    badgeColor: "bg-blue-100 text-blue-700",
    steps: [
      { label: "4.1 Compilar todas as variaveis novas", tag: "DEV", desc: "Variaveis que precisam ser adicionadas/atualizadas no Railway:\n\nMERCADO_PAGO_ACCESS_TOKEN - Producao (APP_USR-...)\nMERCADO_PAGO_PUBLIC_KEY - Producao (APP_USR-...)\nVITE_MERCADO_PAGO_PUBLIC_KEY - Producao (mesmo valor)\nWHATSAPP_TOKEN - Token do System User\nWHATSAPP_PHONE_ID - ID do numero WhatsApp\nVAPID_PUBLIC_KEY - Ja gerada (atualizar no Railway)\nVAPID_PRIVATE_KEY - Ja gerada (atualizar no Railway)" },
      { label: "4.2 Fazer redeploy no Railway", tag: "DEV", desc: "Apos atualizar as variaveis, clicar em Deploy > Redeploy para aplicar as mudancas." },
      { label: "4.3 Teste completo end-to-end", tag: "JUNTOS", desc: "Testar o fluxo completo:\n1. Criar conta na loja\n2. Adicionar produto ao carrinho\n3. Fazer checkout com PIX\n4. Verificar email de confirmacao\n5. Verificar WhatsApp (se templates aprovados)\n6. Simular pagamento e verificar webhook" },
    ],
  },
  {
    id: "ml",
    title: "5. Mercado Livre - Integracao",
    subtitle: "Puxar dados/imagens de produtos",
    badge: "FUTURO",
    badgeColor: "bg-orange-100 text-orange-700",
    alert: { type: "warning" as const, text: "Nao esta no escopo da Fase 2. Se o cliente quiser, precisa ser negociado como adicional ou incluido numa Fase 3. Discutir com o Diomar." },
    steps: [
      { label: "5.1 Perguntar ao cliente se vende no ML", tag: "CLIENTE", desc: "Verificar se o Diomar ja tem conta de vendedor no Mercado Livre e se quer sincronizar os produtos entre ML e a loja propria." },
      { label: "5.2 Definir o que seria sincronizado", tag: "JUNTOS", desc: "Opcoes possiveis:\n- Importar do ML: Puxar fotos, descricoes e precos do ML para a loja\n- Sync de estoque: Quando vender num, atualizar no outro\n- Publicar no ML: Criar anuncios no ML a partir da loja" },
      { label: "5.3 Se quiser, anotar credenciais ML", tag: "DEV", desc: "Para integrar com ML futuramente, precisaria:\n\nML_APP_ID=_______________\nML_CLIENT_SECRET=_______________\nML_REDIRECT_URI=https://confortride.com.br/api/ml/callback\nML_SELLER_ID=_______________\n\n# Criar app em: developers.mercadolivre.com.br" },
    ],
  },
  {
    id: "ia",
    title: "6. API Agente de IA",
    subtitle: "Conectar API para o agente de noticias",
    badge: "CRITICO",
    badgeColor: "bg-red-100 text-red-700",
    steps: [
      { label: "6.1 Acessar conta OpenAI ou Anthropic", tag: "JUNTOS", desc: "Logar na conta do cliente na OpenAI (platform.openai.com) ou Anthropic (console.anthropic.com). Se nao tiver conta, criar juntos." },
      { label: "6.2 Gerar API Key para o projeto", tag: "DEV", desc: "Criar uma API Key dedicada para o projeto ConfortRide.\n\nOpenAI: platform.openai.com > API Keys > Create new secret key\nAnthropic: console.anthropic.com > API Keys > Create Key\n\nNome: ConfortRide-Agente" },
      { label: "6.3 Configurar billing da API", tag: "JUNTOS", desc: "Adicionar metodo de pagamento na conta da API.\n\nOpenAI: Settings > Billing > Add payment method\nAnthropic: Settings > Plans & Billing" },
      { label: "6.4 Adicionar variavel no Railway", tag: "DEV", desc: "Adicionar a variavel de ambiente no Railway:\n\nOPENAI_API_KEY=sk-_______________\nou\nANTHROPIC_API_KEY=sk-ant-_______________" },
    ],
  },
  {
    id: "next",
    title: "7. Proximos Passos - Alinhar",
    subtitle: "Semanas 3 e 4 do projeto",
    badge: "ALINHAR",
    badgeColor: "bg-purple-100 text-purple-700",
    steps: [
      { label: "7.1 Calculo de Frete (Melhor Envio)", tag: "CLIENTE", desc: "O Diomar ja tem conta no Melhor Envio? Se nao, criar juntos. Precisamos das dimensoes e peso de cada produto para calcular frete." },
      { label: "7.2 Fotos/conteudo dos produtos", tag: "CLIENTE", desc: "Pedir fotos profissionais dos produtos (ou tirar na hora) para usar na loja. Fotos do ML podem servir como base." },
      { label: "7.3 Dominio e DNS final", tag: "DEV", desc: "Apontar dominio confortride.com.br para o Railway (CNAME). Em andamento - aguardando emissao do certificado SSL pelo Railway." },
    ],
  },
];

const TAG_COLORS: Record<string, string> = {
  CLIENTE: "bg-amber-100 text-amber-700",
  DEV: "bg-blue-100 text-blue-700",
  JUNTOS: "bg-purple-100 text-purple-700",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  "Supabase (DB + Auth)": { label: "Completo", color: "text-green-600" },
  "Brevo (Emails)": { label: "Completo", color: "text-green-600" },
  "Cloudflare Email": { label: "Completo", color: "text-green-600" },
  "Push Notifications": { label: "Completo", color: "text-green-600" },
  "Mercado Pago": { label: "Teste", color: "text-yellow-600" },
  "WhatsApp / Meta": { label: "Bloqueado", color: "text-red-600" },
  "Melhor Envio (Frete)": { label: "Planejado", color: "text-gray-400" },
  "Mercado Livre": { label: "Nao planejado", color: "text-gray-400" },
};

type Observation = {
  id: string;
  sectionId: string;
  sectionTitle: string;
  stepIndex: number | null;
  stepLabel: string;
  text: string;
  createdAt: string;
};

function ChecklistTab() {
  const storageKey = "confortride_checklist_admin";

  const loadChecked = (): Record<string, boolean> => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  };

  const loadObs = (): Observation[] => {
    try { return JSON.parse(localStorage.getItem(storageKey + "_obs") || "[]"); }
    catch { return []; }
  };

  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);
  const [observations, setObservations] = useState<Observation[]>(loadObs);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ meta: true });
  const [editingObs, setEditingObs] = useState<string | null>(null);
  const [obsText, setObsText] = useState("");
  const [showReport, setShowReport] = useState(false);

  const totalSteps = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.steps.length, 0);
  const doneSteps = Object.values(checked).filter(Boolean).length;
  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  function toggle(key: string) {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function toggleSection(id: string) {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function startObs(key: string) {
    if (editingObs === key) {
      setEditingObs(null);
      setObsText("");
    } else {
      setEditingObs(key);
      const existing = observations.find(o => o.id === key);
      setObsText(existing?.text || "");
    }
  }

  function saveObs(sectionId: string, sectionTitle: string, stepIndex: number | null, stepLabel: string) {
    if (!obsText.trim()) return;
    const key = editingObs!;
    const existing = observations.filter(o => o.id !== key);
    const obs: Observation = {
      id: key,
      sectionId,
      sectionTitle,
      stepIndex,
      stepLabel,
      text: obsText.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [...existing, obs];
    setObservations(next);
    localStorage.setItem(storageKey + "_obs", JSON.stringify(next));
    setEditingObs(null);
    setObsText("");
    toast.success("Observacao salva");
  }

  function deleteObs(id: string) {
    const next = observations.filter(o => o.id !== id);
    setObservations(next);
    localStorage.setItem(storageKey + "_obs", JSON.stringify(next));
    toast("Observacao removida");
  }

  function getObsForKey(key: string) {
    return observations.find(o => o.id === key);
  }

  // Group observations by section for the report
  const obsBySection = useMemo(() => {
    const grouped: Record<string, Observation[]> = {};
    for (const obs of observations) {
      if (!grouped[obs.sectionId]) grouped[obs.sectionId] = [];
      grouped[obs.sectionId].push(obs);
    }
    return grouped;
  }, [observations]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            CHECKLIST REUNIAO
          </h2>
          <p className="text-gray-500 text-base">Sabado 26/04/2026 - Diomar</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowReport(!showReport)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showReport ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            {showReport ? "Voltar ao Checklist" : `Relatorio (${observations.length})`}
          </button>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{pct}%</p>
            <p className="text-sm text-gray-500">{doneSteps}/{totalSteps} concluidos</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-full bg-red-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {showReport ? (
        /* ─── RELATORIO DE OBSERVACOES ─── */
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Relatorio de Observacoes</h3>
            </div>
            <p className="text-xs text-gray-500">Observacoes organizadas por topico da reuniao. Use para consulta posterior.</p>
          </div>

          {observations.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <MessageSquarePlus className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma observacao adicionada ainda.</p>
              <p className="text-gray-400 text-xs mt-1">Use o botao "Obs" nos itens do checklist para adicionar.</p>
            </div>
          ) : (
            CHECKLIST_SECTIONS.map((section) => {
              const sectionObs = obsBySection[section.id];
              if (!sectionObs || sectionObs.length === 0) return null;

              return (
                <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${section.badgeColor}`}>
                        {section.badge}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">{sectionObs.length} obs.</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {sectionObs.map((obs) => (
                      <div key={obs.id} className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-medium text-gray-500">
                            {obs.stepIndex !== null ? `Item ${obs.stepIndex + 1}: ` : ""}
                            {obs.stepLabel.length > 80 ? obs.stepLabel.slice(0, 80) + "..." : obs.stepLabel}
                          </p>
                          <button
                            onClick={() => deleteObs(obs.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{obs.text}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {new Date(obs.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ─── CHECKLIST ─── */
        <>
          {/* Status das APIs */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-base">Status das Integracoes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(STATUS_MAP).map(([name, { label, color }]) => (
                <div key={name} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className={`text-sm font-bold ${color}`}>{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sections */}
          {CHECKLIST_SECTIONS.map((section) => {
            const sectionDone = section.steps.every((_, i) => checked[`${section.id}_${i}`]);
            const sectionCount = section.steps.filter((_, i) => checked[`${section.id}_${i}`]).length;
            const isOpen = openSections[section.id];
            const sectionObsKey = `section_${section.id}`;
            const sectionObs = getObsForKey(sectionObsKey);

            return (
              <div key={section.id} className={`bg-white border rounded-xl overflow-hidden ${sectionDone ? "border-green-200" : "border-gray-200"}`}>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex-1 flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold text-lg ${sectionDone ? "text-green-600 line-through" : "text-gray-900"}`}>
                          {section.title}
                        </h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${section.badgeColor}`}>
                          {section.badge}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{section.subtitle}</p>
                    </div>
                    <span className="text-sm text-gray-400">{sectionCount}/{section.steps.length}</span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); startObs(sectionObsKey); }}
                    className={`mr-3 flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                      sectionObs ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                    }`}
                    title="Adicionar observacao ao topico"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    Obs
                  </button>
                </div>

                {editingObs === sectionObsKey && (
                  <div className="px-4 pb-3 border-t border-gray-100 bg-amber-50/50">
                    <div className="flex items-center gap-2 mt-3 mb-2">
                      <MessageSquarePlus className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700">Observacao: {section.title}</span>
                    </div>
                    <textarea
                      value={obsText}
                      onChange={(e) => setObsText(e.target.value)}
                      placeholder="Descreva o que observou, problema encontrado, decisao tomada..."
                      className="w-full border border-amber-200 rounded-lg p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 resize-y min-h-[80px] bg-white"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => saveObs(section.id, section.title, null, section.title)}
                        className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => { setEditingObs(null); setObsText(""); }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {sectionObs && editingObs !== sectionObsKey && (
                  <div className="mx-4 mb-2 bg-amber-50 border border-amber-100 rounded-lg p-2 flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800 flex-1 whitespace-pre-wrap">{sectionObs.text}</p>
                    <button
                      onClick={() => startObs(sectionObsKey)}
                      className="text-amber-400 hover:text-amber-600 flex-shrink-0"
                      title="Editar"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteObs(sectionObsKey)}
                      className="text-amber-300 hover:text-red-500 flex-shrink-0"
                      title="Remover"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 pb-4">
                    {("alert" in section && section.alert) && (
                      <div className={`flex items-start gap-2 p-3 rounded-lg mt-3 mb-2 text-sm ${
                        section.alert.type === "danger" ? "bg-red-50 border border-red-200 text-red-800" :
                        section.alert.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
                        "bg-amber-50 border border-amber-200 text-amber-800"
                      }`}>
                        <span className="flex-shrink-0 mt-0.5">{section.alert.type === "danger" ? "⚠" : section.alert.type === "success" ? "✓" : "⚠"}</span>
                        <p>{section.alert.text}</p>
                      </div>
                    )}
                    {section.steps.map((step, i) => {
                      const key = `${section.id}_${i}`;
                      const isDone = checked[key];
                      const obsKey = `step_${key}`;
                      const stepObs = getObsForKey(obsKey);

                      return (
                        <div key={key} className="border-b border-gray-50 last:border-0">
                          <div className={`flex items-start gap-3 py-3 ${isDone ? "opacity-50" : ""}`}>
                            <input
                              type="checkbox"
                              checked={isDone || false}
                              onChange={() => toggle(key)}
                              className="mt-1 h-5 w-5 accent-red-600 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`text-base font-medium ${isDone ? "line-through text-gray-400" : "text-gray-700"}`}>
                                {step.label}
                              </span>
                              {"desc" in step && step.desc && (
                                <pre className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap font-sans ${isDone ? "text-gray-300" : "text-gray-500"}`}>
                                  {step.desc}
                                </pre>
                              )}
                            </div>
                            <button
                              onClick={() => startObs(obsKey)}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors flex-shrink-0 ${
                                stepObs ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                              }`}
                              title="Adicionar observacao"
                            >
                              <MessageSquarePlus className="h-3.5 w-3.5" />
                              {stepObs ? "1" : ""}
                            </button>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${TAG_COLORS[step.tag] || "bg-gray-100 text-gray-600"} flex-shrink-0`}>
                              {step.tag}
                            </span>
                          </div>

                          {editingObs === obsKey && (
                            <div className="ml-7 mb-3 bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                              <textarea
                                value={obsText}
                                onChange={(e) => setObsText(e.target.value)}
                                placeholder="Observacao sobre este item..."
                                className="w-full border border-amber-200 rounded-lg p-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 resize-y min-h-[60px] bg-white"
                                autoFocus
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => saveObs(section.id, section.title, i, step.label)}
                                  className="px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => { setEditingObs(null); setObsText(""); }}
                                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          {stepObs && editingObs !== obsKey && (
                            <div className="ml-7 mb-3 bg-amber-50 border border-amber-100 rounded-lg p-2 flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-800 flex-1 whitespace-pre-wrap">{stepObs.text}</p>
                              <button
                                onClick={() => startObs(obsKey)}
                                className="text-amber-400 hover:text-amber-600 flex-shrink-0"
                                title="Editar"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => deleteObs(obsKey)}
                                className="text-amber-300 hover:text-red-500 flex-shrink-0"
                                title="Remover"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
