import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "parsed-data.json"), "utf8")
);
const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

function esc(v) {
  if (v == null) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

let sql = schema + "\n\n-- ========== SEED DATA ==========\n\n";

sql += "-- categories\n";
sql += "insert into public.categories (name, slug, subtitle, description, sort_order) values\n";
sql += data.categories
  .map(
    (c) =>
      `  (${esc(c.name)}, ${esc(c.slug)}, ${esc(c.subtitle)}, ${esc(c.description)}, ${c.sort_order})`
  )
  .join(",\n");
sql += ";\n\n";

sql += "-- services\n";
for (const cat of data.categories) {
  if (!cat.services.length) continue;
  sql += `-- ${cat.name}\n`;
  sql += "insert into public.services (category_id, title, price, description, duration, volume, sort_order)\n";
  sql += "select c.id, v.title, v.price, v.description, v.duration, v.volume, v.sort_order\n";
  sql += `from public.categories c\n`;
  sql += `cross join (values\n`;
  sql += cat.services
    .map(
      (s) =>
        `  (${esc(s.title)}, ${esc(s.price)}, ${esc(s.description)}, ${esc(s.duration)}, ${esc(s.volume)}, ${s.sort_order})`
    )
    .join(",\n");
  sql += `\n) as v(title, price, description, duration, volume, sort_order)\n`;
  sql += `where c.slug = ${esc(cat.slug)};\n\n`;
}

sql += "-- promotions\n";
sql += "insert into public.promotions (title, description, image_url, new_price, old_price, is_active, sort_order) values\n";
sql += data.promotions
  .map(
    (p) =>
      `  (${esc(p.title)}, ${esc(p.description)}, ${esc(p.image_url)}, ${esc(p.new_price)}, ${esc(p.old_price)}, ${esc(p.is_active)}, ${p.sort_order})`
  )
  .join(",\n");
sql += ";\n";

const out = path.join(__dirname, "full-seed.sql");
fs.writeFileSync(out, sql, "utf8");
console.log("Wrote", out, `(${(sql.length / 1024).toFixed(1)} KB)`);
