import "./promotions.css";
import Promotion from "../components/Promotion";
import data from "..//data/promotions.json";

function Promotions(props) {
  return (
    <div className="Promotions Page">
      <div className="promo-spacer layer1"></div>
      <div className="promo-header-title">
        Акции на{` ${new Date().toLocaleString("ru", { month: "long" })}`}
      </div>

      <div className="promotions main">
        {data.map((promo, i) => {
          return (
            <Promotion
              title={promo.title}
              description={promo.description}
              newPrice={promo.newPrice}
              oldPrice={promo.oldPrice}
              src={promo.src}
              position={i}
              key={i}
            ></Promotion>
          );
        })}
      </div>
    </div>
  );
}
export default Promotions;
