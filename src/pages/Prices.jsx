import PriceTable from "../components/PriceTable";
import format from "date-fns/format";
import "./prices.css";
import { Divider, Space, Switch } from "antd";
import { useState } from "react";
import data from "..//data/prices.json";

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
          {data.map((table, i) => {
            return (
              <PriceTable
                sheetName={table.sheetName}
                description={table.description}
                anchor={table.anchor}
                subtitie={table.subtitie}
                key={i}
              ></PriceTable>
            );
          })}
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
