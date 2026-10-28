import { supabase } from "../utils/supabase";
import { requestData } from "./request";

const categoryFields = "id, name, slug, subtitle, description, sort_order";
const serviceFields = "id, category_id, title, price, description, duration, volume, sort_order, updated_at";

export async function listCategories() {
  return (await requestData(
    supabase.from("categories").select(categoryFields).order("sort_order", { ascending: true })
  )) || [];
}

export async function listServices() {
  return (await requestData(
    supabase.from("services").select(serviceFields).order("sort_order", { ascending: true }).order("id", { ascending: true })
  )) || [];
}

export async function loadCatalog() {
  const [categories, services] = await Promise.all([listCategories(), listServices()]);
  return { categories, services };
}

export function saveCategory(id, payload) {
  return requestData(id == null
    ? supabase.from("categories").insert(payload)
    : supabase.from("categories").update(payload).eq("id", id));
}

export function deleteCategory(id) {
  return requestData(supabase.from("categories").delete().eq("id", id));
}

export function saveService(id, payload) {
  return requestData(id == null
    ? supabase.from("services").insert(payload)
    : supabase.from("services").update(payload).eq("id", id));
}

export function deleteService(id) {
  return requestData(supabase.from("services").delete().eq("id", id));
}

// Stop at the first failure. Never retry uncertain writes automatically.
// Existing REST API has no batch transaction: the caller must reload on failure.
export async function saveServiceOrder(changes) {
  for (const row of changes) {
    await saveService(row.id, { sort_order: row.sort_order });
  }
}
