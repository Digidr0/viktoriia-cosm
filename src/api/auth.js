import { supabase } from "../utils/supabase";
import { requestData } from "./request";

export async function getSession() {
  const data = await requestData(() => supabase.auth.getSession());
  return data.session ?? null;
}

export function subscribeToAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function checkAdminAccess() {
  return (await requestData(supabase.rpc("is_admin"))) === true;
}

export function signIn(email, password) {
  return requestData(() => supabase.auth.signInWithPassword({ email, password }));
}

export function signOut() {
  return requestData(() => supabase.auth.signOut());
}
