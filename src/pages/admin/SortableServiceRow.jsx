import { createContext, useContext } from "react";
import { Button, Dropdown } from "antd";
import { HolderOutlined, MoreOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const RowContext = createContext({});

export function ServiceDragHandle({ row, disabled, onMove, first, last }) {
  const { attributes, listeners, setActivatorNodeRef } = useContext(RowContext);
  return (
    <div className="service-reorder-controls">
      <Button
        type="text"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        disabled={disabled}
        className="service-drag-handle"
        aria-label={`Перетащить услугу «${row.title}»`}
        icon={<HolderOutlined />}
      />
      <Dropdown
        trigger={["click"]}
        disabled={disabled}
        menu={{
          items: [
            { key: "up", label: "Переместить выше", disabled: first },
            { key: "down", label: "Переместить ниже", disabled: last },
          ],
          onClick: ({ key }) => onMove(row.id, key === "up" ? -1 : 1),
        }}
      >
        <Button type="text" disabled={disabled} icon={<MoreOutlined />} aria-label={`Изменить позицию услуги «${row.title}»`} />
      </Dropdown>
    </div>
  );
}

export default function SortableServiceRow({ reorderDisabled, ...props }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props["data-row-key"],
    disabled: reorderDisabled,
  });
  return (
    <RowContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <tr
        {...props}
        ref={setNodeRef}
        style={{
          ...props.style,
          transform: CSS.Translate.toString(transform),
          transition,
          ...(isDragging ? { position: "relative", zIndex: 2 } : {}),
        }}
      />
    </RowContext.Provider>
  );
}
