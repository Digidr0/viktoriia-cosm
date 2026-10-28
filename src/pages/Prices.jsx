import PriceTable from "../components/PriceTable";
import "./prices.css";
import { Space, Spin, Alert, Button } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { loadCatalog } from "../api/catalog";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

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

function Prices() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const online = useOnlineStatus();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await loadCatalog();
        if (cancelled) return;
        setCategories(data.categories);
        setServices(data.services);
      } catch (err) {
        if (!cancelled) setError(err.message || "Ошибка загрузки данных");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [online, reload]);

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
    let anchor;
    try {
      anchor = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
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
          action={<Button disabled={!online} onClick={() => setReload((value) => value + 1)}>Повторить</Button>}
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
