import PriceTable from "../components/PriceTable";
import "./prices.css";
import { Space, Spin, Alert } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

function formatUpdatedAt(date) {
  if (!date) return null;
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAnchorFromHash() {
  // HashRouter: #/prices or #/prices#botox or legacy #botox after path
  const raw = window.location.hash || "";
  const parts = raw.split("#").filter(Boolean);
  // e.g. ["/prices", "botox"] or ["botox"]
  if (parts.length >= 2) return decodeURIComponent(parts[parts.length - 1]);
  return null;
}

function Prices() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [catRes, svcRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, subtitle, description, sort_order")
          .order("sort_order", { ascending: true }),
        supabase
          .from("services")
          .select(
            "id, category_id, title, price, description, duration, volume, sort_order, updated_at"
          )
          .order("sort_order", { ascending: true }),
      ]);

      if (cancelled) return;

      if (catRes.error || svcRes.error) {
        setError(catRes.error?.message || svcRes.error?.message);
        setLoading(false);
        return;
      }

      setCategories(catRes.data || []);
      setServices(svcRes.data || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const servicesByCategory = useMemo(() => {
    const map = new Map();
    for (const s of services) {
      if (!map.has(s.category_id)) map.set(s.category_id, []);
      map.get(s.category_id).push(s);
    }
    return map;
  }, [services]);

  const lastUpdated = useMemo(() => {
    if (!services.length) return null;
    let max = null;
    for (const s of services) {
      if (!s.updated_at) continue;
      if (!max || s.updated_at > max) max = s.updated_at;
    }
    return max;
  }, [services]);

  useEffect(() => {
    if (loading) return;
    const anchor = getAnchorFromHash();
    if (!anchor || anchor.startsWith("/")) return;
    const el = document.getElementById(anchor);
    if (el) {
      const t = setTimeout(
        () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
        150
      );
      return () => clearTimeout(t);
    }
  }, [loading, categories, location.hash]);

  if (loading) {
    return (
      <div className="Prices Page" style={{ textAlign: "center", padding: "4em" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="Prices Page" style={{ padding: "2em" }}>
        <Alert
          type="error"
          message="Не удалось загрузить прайс"
          description={error}
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="Prices Page">
      <Space
        align="start"
        size={8}
        className="price-tooltip"
        direction="vertical"
      >
        <div>
          Цены на
          {` ${new Date().toLocaleString("ru", { month: "long" })}
           ${new Date().getFullYear()}`}{" "}

        </div>
      </Space>

      <div>
        {categories.map((cat) => (
          <PriceTable
            key={cat.id}
            name={cat.name}
            slug={cat.slug}
            description={cat.description}
            subtitle={cat.subtitle}
            services={servicesByCategory.get(cat.id) || []}
          />
        ))}
      </div>
    </div>
  );
}

export default Prices;
