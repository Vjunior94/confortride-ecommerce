/**
 * server/db.ts - All database queries using Supabase PostgreSQL client.
 */
import { supabaseAdmin } from "./supabase";

// ============================================================
// USER / PROFILE HELPERS
// ============================================================
export async function upsertUser(_user: unknown) {
  // No-op: Supabase Auth handles user creation
}
export async function getUserByOpenId(_openId: string) {
  return undefined;
}

export async function getProfileById(id: string) {
  const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getAllProfiles() {
  const { data, error } = await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateProfileRole(id: string, role: "user" | "admin") {
  const { error } = await supabaseAdmin.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ============================================================
// CATEGORY HELPERS
// ============================================================
export async function getCategories(activeOnly = true) {
  let query = supabaseAdmin.from("categories").select("*").order("name");
  if (activeOnly) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCategoryById(id: number) {
  const { data, error } = await supabaseAdmin.from("categories").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createCategory(input: { name: string; slug: string; description?: string; image_url?: string }) {
  const { data, error } = await supabaseAdmin.from("categories").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: number, input: Partial<{ name: string; slug: string; description: string; image_url: string; active: boolean }>) {
  const { data, error } = await supabaseAdmin.from("categories").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: number) {
  const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// PRODUCT HELPERS
// ============================================================
export async function getProducts(opts: { categoryId?: number; search?: string; featured?: boolean; activeOnly?: boolean; limit?: number; offset?: number } = {}) {
  let query = supabaseAdmin.from("products").select("*, categories(id, name, slug)", { count: "exact" }).order("created_at", { ascending: false });
  if (opts.activeOnly !== false) query = query.eq("active", true);
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.featured) query = query.eq("featured", true);
  if (opts.search) query = query.or(`name.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 20) - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { products: data ?? [], total: count ?? 0 };
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabaseAdmin.from("products").select("*, categories(id, name, slug)").eq("slug", slug).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getProductById(id: number) {
  const { data, error } = await supabaseAdmin.from("products").select("*, categories(id, name, slug)").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createProduct(input: { name: string; slug: string; description?: string; price: number; original_price?: number; category_id?: number; image_url?: string; images?: string[]; stock: number; sku?: string; featured?: boolean }) {
  const { data, error } = await supabaseAdmin.from("products").insert({ ...input, images: input.images ?? [] }).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: number, input: Partial<{ name: string; slug: string; description: string; price: number; original_price: number; category_id: number; image_url: string; images: string[]; stock: number; sku: string; featured: boolean; active: boolean }>) {
  const { data, error } = await supabaseAdmin.from("products").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function softDeleteProduct(id: number) {
  const { error } = await supabaseAdmin.from("products").update({ active: false }).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: number) {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// ADDRESS HELPERS
// ============================================================
export async function getAddressesByUserId(userId: string) {
  const { data, error } = await supabaseAdmin.from("addresses").select("*").eq("user_id", userId).order("is_default", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAddress(input: { user_id: string; label?: string; recipient_name: string; street: string; number: string; complement?: string; neighborhood: string; city: string; state: string; zip_code: string; is_default?: boolean }) {
  if (input.is_default) {
    await supabaseAdmin.from("addresses").update({ is_default: false }).eq("user_id", input.user_id);
  }
  const { data, error } = await supabaseAdmin.from("addresses").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAddress(id: number, userId: string) {
  const { error } = await supabaseAdmin.from("addresses").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// ============================================================
// ORDER HELPERS
// ============================================================
export async function createOrder(input: { user_id: string; total: number; subtotal: number; shipping_cost: number; discount: number; address_snapshot: object; notes?: string; items: Array<{ product_id?: number; product_name: string; product_image?: string; quantity: number; unit_price: number; total_price: number }> }) {
  const { items, ...orderData } = input;
  const { data: order, error: orderError } = await supabaseAdmin.from("orders").insert({ ...orderData, status: "pending" }).select().single();
  if (orderError) throw orderError;
  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(items.map(i => ({ ...i, order_id: order.id })));
  if (itemsError) throw itemsError;
  return order;
}

export async function getOrdersByUserId(userId: string) {
  const { data, error } = await supabaseAdmin.from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getOrderById(id: number) {
  const { data, error } = await supabaseAdmin.from("orders").select("*, order_items(*), profiles(name, email)").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getOrderItems(orderId: number) {
  const { data, error } = await supabaseAdmin.from("order_items").select("*").eq("order_id", orderId);
  if (error) throw error;
  return data ?? [];
}

export async function getAllOrders(opts: { status?: string; limit?: number; offset?: number } = {}) {
  let query = supabaseAdmin.from("orders").select("*, order_items(*), profiles(name, email)", { count: "exact" }).order("created_at", { ascending: false });
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.limit) query = query.limit(opts.limit);
  if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 20) - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { orders: data ?? [], total: count ?? 0 };
}

export async function updateOrderStatus(id: number, status: string, trackingCode?: string) {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (trackingCode) update.tracking_code = trackingCode;
  const { data, error } = await supabaseAdmin.from("orders").update(update).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function getOrderStats() {
  const { data: allOrders, error } = await supabaseAdmin.from("orders").select("status, total");
  if (error) throw error;
  const stats = { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, revenue: 0 };
  for (const o of allOrders ?? []) {
    stats.total++;
    if (o.status in stats) (stats as Record<string, number>)[o.status]++;
    if (o.status !== "cancelled") stats.revenue += Number(o.total);
  }
  return stats;
}

// ============================================================
// PUSH SUBSCRIPTION HELPERS
// ============================================================
export async function savePushSubscription(data: { user_id: string; endpoint: string; p256dh: string; auth: string }) {
  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(data, { onConflict: "endpoint" });
  if (error) throw error;
}

export async function getPushSubscriptionsByUserId(userId: string) {
  const { data, error } = await supabaseAdmin.from("push_subscriptions").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function getAllAdminPushSubscriptions() {
  const { data, error } = await supabaseAdmin.from("push_subscriptions").select("*, profiles!inner(role)").eq("profiles.role", "admin");
  if (error) throw error;
  return data ?? [];
}

export async function deletePushSubscription(endpoint: string, userId: string) {
  const { error } = await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", userId);
  if (error) throw error;
}
