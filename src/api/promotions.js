import { supabase } from "../utils/supabase";
import { requestData } from "./request";

const fields = "id, title, description, image_url, new_price, old_price, is_active, sort_order, updated_at";

export async function listPromotions({ activeOnly = false } = {}) {
  let query = supabase.from("promotions").select(fields);
  if (activeOnly) query = query.eq("is_active", true);
  return (await requestData(query.order("sort_order", { ascending: true }))) || [];
}

export function savePromotion(id, payload) {
  return requestData(id == null
    ? supabase.from("promotions").insert(payload)
    : supabase.from("promotions").update(payload).eq("id", id));
}

export function deletePromotion(id) {
  return requestData(supabase.from("promotions").delete().eq("id", id));
}
