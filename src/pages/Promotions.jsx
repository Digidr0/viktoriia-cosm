import "./promotions.css";
import Promotion from "../components/Promotion";
import BNCImage from "/docs/BNC.webp";
import { useEffect, useState } from "react";
import { Spin, Alert, Button } from "antd";
import { listPromotions } from "../api/promotions";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

function Promotions() {
  const [promotions, setPromotions] = useState([]);
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
        const data = await listPromotions({ activeOnly: true });
        if (!cancelled) setPromotions(data);
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
        <Alert type="error" message="Не удалось загрузить акции" description={error} showIcon
          action={<Button disabled={!online} onClick={() => setReload((value) => value + 1)}>Повторить</Button>}
        />
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
        <img
          className="BNC-image"
          style={{ borderRadius: 10 }}
          src={BNCImage}
          alt="NAD+ Complex"
          width={1000}
          height={11935}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

export default Promotions;
