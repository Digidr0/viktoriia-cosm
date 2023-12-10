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
            sheetName="Уход за лицом"
            anchor="skin_holyland"
            description="Holy Land (Израиль)"
            title="Holyland Laboratories является одной из ведущих компаний по разработке и производству профессиональной косметической продукции для ухода за любым типом кожи."
          />
          <PriceTable
            sheetName="Ботулинотерапия"
            anchor="botox"
            title="Ботулинотерапия - эффективная косметологическая методика для борьбы с мимическими морщинами. Процедура заключается во введении под кожу препаратов на основе ботулинотоксина, которые точечно воздействуют на причину образования мимических морщин."
          />
          <PriceTable
            sheetName="Биоревитализация"
            anchor="bionic"
            title="Биоревитализация представляет собой внутрикожное введение гиалуроновой кислоты.
             Процедура способна оказать быстрое омолаживающее действие и справляется со всеми возрастными изменениями."
          />
          <PriceTable
            sheetName="Мезотерапия Dermaheal"
            anchor="mezo_d"
            description="Dermaheall (Корея)"
            title="Dermaheal – бренд профессиональной косметики от производителя из Южной Кореи Caregen Со. Ltd. Филлеры от компании прошли многократные проверки и допущены к использованию на территории европейских стран и России."
          />
          <PriceTable
            sheetName="Мезотерапия Fusion"
            anchor="mezo_f"
            description="Fusion  (Испания)"
            title="Fusion Meso - это многонациональная компания, специализирующаяся на разработке, производстве и коммерциализации эстетической медицины для ухода за кожей, косметики и медицинских приборов для врачей, дерматологов и специалистов в области красоты."
          />
          <PriceTable
            sheetName="Мезотерапия Beautyfarma"
            anchor="mezo_b"
            description="Beautyfarma (Франция)"
            title="Компания-производитель BeautyPharmaCo была сформирована в 2008 году в Париже и вскоре стала огромным дистрибьютором и партнером большинства известных европейских производителей."
          />
          <PriceTable
            sheetName="Депиляция"
            anchor="depelation"
            description="на основе высококачественного воска ItalWax"
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
