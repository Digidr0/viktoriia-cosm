import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const env = {};
  for (const file of [".env", ".env.local"]) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  if (process.env.VITE_SUPABASE_URL) {
    env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey =
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "parsed-data.json"), "utf8")
);

async function tableExists(name) {
  const { error } = await supabase.from(name).select("*").limit(1);
  if (!error) return true;
  if (error.code === "PGRST205" || /Could not find the table/i.test(error.message)) {
    return false;
  }
  // empty table or RLS still means table exists
  return true;
}

async function ensureEmpty(table) {
  const { error } = await supabase.from(table).delete().gte("id", 0);
  if (error) {
    // try neq trick
    const { error: e2 } = await supabase.from(table).delete().neq("id", -1);
    if (e2) console.warn("clear", table, e2.message);
  }
}

async function seed() {
  console.log("URL:", supabaseUrl);
  console.log(
    "Key:",
    env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "publishable"
  );

  for (const t of ["categories", "services", "promotions"]) {
    const exists = await tableExists(t);
    console.log(`table ${t}:`, exists ? "exists" : "MISSING");
    if (!exists) {
      console.error(
        `\nTable "${t}" is missing. Run scripts/schema.sql (or scripts/full-seed.sql) in Supabase SQL Editor, then re-run this script.`
      );
      process.exit(1);
    }
  }

  console.log("Clearing tables...");
  await ensureEmpty("services");
  await ensureEmpty("promotions");
  await ensureEmpty("categories");

  console.log("Inserting categories...");
  const catRows = data.categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    subtitle: c.subtitle,
    description: c.description,
    sort_order: c.sort_order,
  }));

  const { data: insertedCats, error: catErr } = await supabase
    .from("categories")
    .insert(catRows)
    .select("id, slug");

  if (catErr) {
    console.error("categories insert error:", catErr);
    process.exit(1);
  }

  const slugToId = Object.fromEntries(insertedCats.map((c) => [c.slug, c.id]));
  console.log("categories:", insertedCats.length);

  const serviceRows = [];
  for (const cat of data.categories) {
    const category_id = slugToId[cat.slug];
    for (const s of cat.services) {
      serviceRows.push({
        category_id,
        title: s.title,
        price: s.price,
        description: s.description,
        duration: s.duration,
        volume: s.volume,
        sort_order: s.sort_order,
      });
    }
  }

  console.log("Inserting services:", serviceRows.length);
  for (let i = 0; i < serviceRows.length; i += 80) {
    const batch = serviceRows.slice(i, i + 80);
    const { error } = await supabase.from("services").insert(batch);
    if (error) {
      console.error("services insert error at", i, error);
      process.exit(1);
    }
  }

  console.log("Inserting promotions...");
  const promoRows = data.promotions.map((p) => ({
    title: p.title,
    description: p.description,
    image_url: p.image_url,
    new_price: p.new_price,
    old_price: p.old_price,
    is_active: p.is_active,
    sort_order: p.sort_order,
  }));
  const { error: promoErr } = await supabase
    .from("promotions")
    .insert(promoRows);
  if (promoErr) {
    console.error("promotions insert error:", promoErr);
    process.exit(1);
  }

  const { count: catCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });
  const { count: svcCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true });
  const { count: promoCount } = await supabase
    .from("promotions")
    .select("*", { count: "exact", head: true });

  console.log("\nDone!");
  console.log("categories:", catCount);
  console.log("services:", svcCount);
  console.log("promotions:", promoCount);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
