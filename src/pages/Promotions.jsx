import "./promotions.css";
import Promotion from "../components/Promotion";
import BNCImage from "/docs/BNC.jpg";
import { useEffect, useState } from "react";
import { Spin, Alert } from "antd";
import { supabase } from "../utils/supabase";

function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("promotions")
        .select(
          "id, title, description, image_url, new_price, old_price, is_active, sort_order, updated_at"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setPromotions(data || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="Promotions Page" style={{ textAlign: "center", padding: "4em" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="Promotions Page" style={{ padding: "2em" }}>
        <Alert type="error" message="Не удалось загрузить акции" description={error} showIcon />
      </div>
    );
  }

  return (
    <div className="Promotions Page">
      <div className="promo-spacer layer1"></div>
      <div className="promo-header-title">Акции и новинки</div>

      <div className="promotions main">
        {promotions.map((promo, i) => (
          <Promotion
            title={promo.title}
            description={promo.description}
            newPrice={promo.new_price}
            oldPrice={promo.old_price}
            src={promo.image_url}
            position={i}
            key={promo.id}
          />
        ))}
        <div className="promo-header-title">NAD+ Complex</div>
        <img className="BNC-image" style={{ borderRadius: 10 }} src={BNCImage} alt="NAD+ Complex" />
      </div>
    </div>
  );
}

export default Promotions;
