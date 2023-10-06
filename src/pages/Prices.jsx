import PriceTable from "../components/PriceTable";
import format from "date-fns/format";
import "./prices.css";
import { Divider, Space, Switch, Tooltip } from "antd";
import { useState } from "react";

function Prices(props) {
  const [sheetType, setSheetType] = useState(true);
  return (
    <div className="Prices Page">
      <Space align="start" size={30} className="price-tooltip">
        <Switch
          checked={sheetType}
          autoFocus
          checkedChildren="Встроенный"
          unCheckedChildren="Google"
          onClick={() => setSheetType((el) => !el)}
        />

        <div>
          ( Цены на
          {` ${new Date().toLocaleString("ru", { month: "long" })}
           ${new Date().getFullYear()}`}{" "}
          )
        </div>
      </Space>

      {sheetType ? (
        <div>
          <PriceTable sheetName="Массаж лица" anchor="massage" />
          <PriceTable sheetName="Брови, ресницы" anchor="eyes" />
          <PriceTable
            sheetName="Пилинги"
            anchor="pilings"
            title="Пилинг используется для отшелушивания клеток кожи лица, удаляются мёртвые клетки, благодаря чему кожа становится более гладкой и красивой."
          />
          <PriceTable sheetName="Уход за кожей" anchor="skin" />

          <PriceTable
            sheetName="Депиляция"
            anchor="depelation"
            description="на основе высококачественного воска ItalWax"
          />
          <PriceTable
            sheetName="Биоревитализация"
            anchor="bionic"
            title="Биоревитализация представляет собой внутрикожное введение гиалуроновой кислоты.
             Процедура способна оказать быстрое омолаживающее действие и справляется со всеми возрастными изменениями."
          />
          <PriceTable sheetName="Дополнительные процедуры" anchor="external" />
        </div>
      ) : (
        <iframe
          frameBorder="0"
          style={{
            minHeight: "75vh",
            border: "1px solid lightgrey",
            width: "90vw",
            marginTop: "1em",
          }}
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTPTCWm0XD7i143rZkLW7VzNpFTjAnWZ2gzyfdHAQhub1POqiM2PcDB041tJwr0O6sPNuC0YGoVWsms/pubhtml?widget=true&amp;headers=false"
        ></iframe>
      )}
    </div>
  );
}
export default Prices;
