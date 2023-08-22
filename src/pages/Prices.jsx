import PriceTable from "../components/PriceTable";
import format from "date-fns/format";
import "./prices.css";
import { Divider, Space, Switch } from "antd";
import { useState } from "react";

function Prices(props) {
  const [sheetType, setSheetType] = useState(true);
  return (
    <div className="Prices Page">
      <div>
        Цены на
        {` ${new Date().toLocaleString("default", { month: "long" })}
           ${new Date().getFullYear()}`}
      </div>
      <Space>
        <Switch
          checked={sheetType}
          style={{ marginBottom: "20px" }}
          autoFocus
          checkedChildren="Встроенный"
          unCheckedChildren="Google"
          onClick={() => setSheetType((el) => !el)}
        />
      </Space>

      {sheetType ? (
        <div>
          <Space>
          <div className="hr"></div>
            <h3>Уход за кожей</h3>
          <div className="hr"></div>
          </Space>
          <PriceTable sheetName="Уход за кожей" />
          <Space>
          <div className="hr"></div>
            <h3>Пилинги</h3>
            <div className="hr"></div>
          </Space>
          <PriceTable sheetName="Пилинги" />
          <Space>
          <div className="hr"></div>
            <h3>Массаж лица</h3>
            <div className="hr"></div>
          </Space>
          <PriceTable sheetName="Массаж лица" />
          <Space>
          <div className="hr"></div>
            <h3>Дополнительные процедуры</h3>
            <div className="hr"></div>
          </Space>
          <PriceTable sheetName="Дополнительные процедуры" />
        </div>
      ) : (
        <iframe
          frameBorder="0"
          style={{ minHeight: "75vh", border: "1px solid lightgrey" }}
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTPTCWm0XD7i143rZkLW7VzNpFTjAnWZ2gzyfdHAQhub1POqiM2PcDB041tJwr0O6sPNuC0YGoVWsms/pubhtml?gid=0&amp"
        ></iframe>
      )}
    </div>
  );
}
export default Prices;
