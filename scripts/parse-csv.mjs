import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inQuotes) {
      if (c === '"' && n === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || (c === "\r" && n === "\n")) {
      if (c === "\r") i++;
      row.push(field);
      field = "";
      if (row.some((x) => String(x).trim())) rows.push(row);
      row = [];
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((x) => String(x).trim())) rows.push(row);
  }
  return rows;
}

function detectColumns(header) {
  const h = header.map((x) =>
    String(x)
      .toLowerCase()
      .replace(/["']/g, "")
      .trim()
  );
  const idx = { title: 0, duration: -1, volume: -1, price: -1 };
  h.forEach((col, i) => {
    if (col.includes("время") || col.includes("врем")) idx.duration = i;
    else if (col.includes("объем") || col.includes("объём")) idx.volume = i;
    else if (col.includes("цена")) idx.price = i;
    else if (col.includes("процедура") || col.includes("препарат")) idx.title = i;
  });
  if (idx.price < 0) {
    for (let i = h.length - 1; i >= 0; i--) {
      if (h[i]) {
        idx.price = i;
        break;
      }
    }
  }
  return idx;
}

function parsePrice(s) {
  if (s == null || s === "") return null;
  const cleaned = String(s)
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function clean(s) {
  if (s == null) return null;
  const t = String(s).replace(/\s+/g, " ").trim();
  if (!t || t === "-") return null;
  return t;
}

const pricesMeta = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/prices.json"), "utf8")
);
const promotionsMeta = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/promotions.json"), "utf8")
);
const dir = path.join(root, "csv");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".csv"));

const categories = [];
for (const meta of pricesMeta) {
  const fname = files.find((f) => f.includes(meta.sheetName));
  if (!fname) {
    console.error("MISSING CSV for", meta.sheetName);
    continue;
  }
  const text = fs.readFileSync(path.join(dir, fname), "utf8");
  const rows = parseCSV(text);
  if (rows.length < 2) {
    console.error("empty", fname);
    continue;
  }
  const idx = detectColumns(rows[0]);
  const services = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const title = clean(row[idx.title]);
    if (!title) continue;

    let price = idx.price >= 0 ? parsePrice(row[idx.price]) : null;
    if (price == null) {
      for (let j = row.length - 1; j >= 0; j--) {
        const p = parsePrice(row[j]);
        if (p != null) {
          price = p;
          break;
        }
      }
    }

    let duration = idx.duration >= 0 ? clean(row[idx.duration]) : null;
    let volume = idx.volume >= 0 ? clean(row[idx.volume]) : null;
    if (duration && /(мл|ед)/i.test(duration) && !volume) {
      volume = duration;
      duration = null;
    }
    if (volume && /время/i.test(String(rows[0][idx.volume] || ""))) {
      // ignore
    }

    services.push({
      title,
      price,
      duration,
      volume,
      description: null,
      sort_order: services.length,
    });
  }

  categories.push({
    name: meta.sheetName,
    slug: meta.anchor,
    subtitle: meta.subtitie,
    description: meta.description,
    sort_order: categories.length,
    services,
  });
  console.log(`${meta.sheetName}: ${services.length} services`);
}

const promotions = promotionsMeta.map((p, i) => ({
  title: p.title,
  description: p.description,
  image_url: p.src,
  new_price: p.newPrice,
  old_price: p.oldPrice,
  is_active: true,
  sort_order: i,
}));

const out = { categories, promotions };
fs.writeFileSync(
  path.join(__dirname, "parsed-data.json"),
  JSON.stringify(out, null, 2),
  "utf8"
);

const totalServices = categories.reduce((a, c) => a + c.services.length, 0);
console.log(
  `\nOK: ${categories.length} categories, ${totalServices} services, ${promotions.length} promotions`
);
