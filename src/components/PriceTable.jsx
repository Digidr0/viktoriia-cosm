import { Table, Tooltip } from "antd";
import { InfoCircleFilled } from "@ant-design/icons";
import { useMemo } from "react";

function formatPrice(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n.toLocaleString("ru-RU")} ₽`;
}

function PriceTable({ name, slug, description, subtitle, services = [] }) {
  const hasDuration = services.some((s) => s.duration);
  const hasVolume = services.some((s) => s.volume);

  const columns = useMemo(() => {
    const cols = [
      {
        title: "Процедура",
        dataIndex: "title",
        key: "title",
        render: (text, record) => (
          <div className="service-cell">
            <span className="service-title">{text}</span>
            {record.description ? (
              <div className="service-description">{record.description}</div>
            ) : null}
          </div>
        ),
      },
    ];

    if (hasDuration) {
      cols.push({
        title: "Время",
        dataIndex: "duration",
        key: "duration",
        width: 100,
        render: (v) => v || "—",
      });
    }

    if (hasVolume) {
      cols.push({
        title: "Объём",
        dataIndex: "volume",
        key: "volume",
        width: 100,
        render: (v) => v || "—",
      });
    }

    cols.push({
      title: "Цена",
      dataIndex: "price",
      key: "price",
      width: 120,
      align: "right",
      render: formatPrice,
    });

    return cols;
  }, [hasDuration, hasVolume]);

  const dataSource = useMemo(
    () =>
      services.map((s) => ({
        ...s,
        key: s.id,
      })),
    [services]
  );

  return (
    <div className="PriceTable Component" id={slug}>
      <div className="title">
        <div className="label-container">
          <div className="hr"></div>
          <div className="label-components">
            <h3 className="label">{name}</h3>
            {description ? (
              <Tooltip color="#fa8072" placement="topLeft" title={description}>
                <InfoCircleFilled
                  style={{ fontSize: "1.5em", margin: -10, padding: 10 }}
                />
              </Tooltip>
            ) : null}
          </div>
          <div className="hr"></div>
        </div>
        {subtitle ? <span className="description">{subtitle}</span> : null}
      </div>
      <Table
        className="Table"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        size="small"
        locale={{ emptyText: "Нет услуг в этой категории" }}
      />
    </div>
  );
}

export default PriceTable;
