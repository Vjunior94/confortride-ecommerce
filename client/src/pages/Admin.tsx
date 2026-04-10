import { useState } from "react";
import { Link } from "wouter";
import {
  Package, ShoppingBag, Users, TrendingUp, Plus, Pencil, Trash2, ChevronDown,
  LayoutDashboard, Tag, ArrowLeft, Check, X, Search, Upload,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Em Processamento",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

type AdminTab = "dashboard" | "products" | "orders" | "categories" | "users";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<AdminTab>("dashboard");

  if (!isAuthenticated || user?.role !== "admin") {
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

  const NAV_ITEMS = [
    { id: "dashboard" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "products" as AdminTab, label: "Produtos", icon: Package },
    { id: "orders" as AdminTab, label: "Pedidos", icon: ShoppingBag },
    { id: "categories" as AdminTab, label: "Categorias", icon: Tag },
    { id: "users" as AdminTab, label: "Usuários", icon: Users },
  ];

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
          { label: "Pedidos Pendentes", value: stats?.pending ?? 0, icon: Package, color: "bg-yellow-50 text-yellow-600" },
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
function ProductsTab() {
  const utils = trpc.useUtils();
  const { data: productsData, isLoading } = trpc.products.listAdmin.useQuery();
  const products = productsData?.products ?? [];
  const { data: categories } = trpc.categories.list.useQuery();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ categoryId: "", name: "", description: "", price: "", comparePrice: "", imageUrl: "", sku: "", stock: "0", featured: false });

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

  const resetForm = () => setForm({ categoryId: "", name: "", description: "", price: "", comparePrice: "", imageUrl: "", sku: "", stock: "0", featured: false });

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({ categoryId: String(p.category_id), name: p.name, description: p.description ?? "", price: String(p.price), comparePrice: String(p.original_price ?? ""), imageUrl: p.image_url ?? "", sku: p.sku ?? "", stock: String(p.stock), featured: p.featured });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.categoryId) { toast.error("Preencha nome, preço e categoria."); return; }
    const data = { category_id: Number(form.categoryId), name: form.name, description: form.description || undefined, price: Number(form.price), original_price: form.comparePrice ? Number(form.comparePrice) : undefined, image_url: form.imageUrl || undefined, sku: form.sku || undefined, stock: Number(form.stock), featured: form.featured };
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
                          <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                          {p.featured && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Destaque</span>}
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
              <Label>URL da Imagem</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="mt-1" />
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
  const { data: ordersData, isLoading } = trpc.orders.adminList.useQuery({ limit: 50 });
  const orders = ordersData?.orders ?? [];
  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { utils.orders.adminList.invalidate(); toast.success("Status atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>PEDIDOS</h2>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum pedido ainda.</div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">#{order.id}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">{order.profiles?.name ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell font-medium text-red-600">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: order.id, status: v as any })}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
  const { data: users } = trpc.users.list.useQuery();
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{u.role === "admin" ? "Admin" : "Cliente"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
