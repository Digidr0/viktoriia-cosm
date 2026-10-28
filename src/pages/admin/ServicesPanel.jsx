import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteService, loadCatalog, saveService, saveServiceOrder } from "../../api/catalog";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortableServiceRow, { ServiceDragHandle } from "./SortableServiceRow";
import { moveService } from "../../utils/serviceOrder";
import { formatUpdatedAt } from "./slugify";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { saveErrorMessage } from "../../utils/network";

const empty = {
  category_id: null,
  title: "",
  price: null,
  description: "",
  duration: "",
  volume: "",
  sort_order: 0,
};

function ServicesPanel({ onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reordering, setReordering] = useState(false);
  const reorderRef = useRef(false);
  const [orderError, setOrderError] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const online = useOnlineStatus();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await loadCatalog();
      setCategories(data.categories);
      setRows(data.services);
      setFilterCat((current) =>
        data.categories.some((category) => String(category.id) === current)
          ? current
          : data.categories[0] ? String(data.categories[0].id) : undefined
      );
    } catch (error) {
      setLoadError(error.message || "Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [online]);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const categoryTitle = catMap[filterCat] || "";
  useEffect(() => {
    onCategoryChange?.(categoryTitle);
  }, [categoryTitle, onCategoryChange]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (String(r.category_id) !== filterCat) {
        return false;
      }
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        catMap[r.category_id]?.toLowerCase().includes(q)
      );
    });
  }, [rows, filterCat, search, catMap]);

  function openCreate() {
    setSaveError(null);
    setEditing(null);
    form.setFieldsValue({
      ...empty,
      category_id: categories.find((category) => String(category.id) === filterCat)?.id ?? null,
    });
    setOpen(true);
  }

  function openEdit(row) {
    setSaveError(null);
    setEditing(row);
    form.setFieldsValue({
      category_id: row.category_id,
      title: row.title,
      price: row.price,
      description: row.description || "",
      duration: row.duration || "",
      volume: row.volume || "",
      sort_order: row.sort_order ?? 0,
    });
    setOpen(true);
  }

  async function onSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    let values;
    try {
      values = await form.validateFields();
    } catch {
      savingRef.current = false;
      return;
    }
    setSaving(true);
    setSaveError(null);
    const payload = {
      category_id: values.category_id,
      title: values.title.trim(),
      price: values.price == null || values.price === "" ? null : Number(values.price),
      description: values.description?.trim() || null,
      duration: values.duration?.trim() || null,
      volume: values.volume?.trim() || null,
      sort_order: editing && String(editing.category_id) === String(values.category_id)
        ? editing.sort_order ?? 0
        : Math.max(-1, ...rows.filter((row) => String(row.category_id) === String(values.category_id)).map((row) => Number(row.sort_order) || 0)) + 1,
    };

    try {
      await saveService(editing?.id, payload);
      message.success(editing ? "Услуга обновлена" : "Услуга добавлена");
      setOpen(false);
      await load();
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  async function onDelete(id) {
    if (reorderRef.current) return;
    try {
      await deleteService(id);
      message.success("Услуга удалена");
      await load();
    } catch (error) {
      message.error(error.message || "Не удалось удалить услугу");
    }
  }

  const reorderDisabled = !online || loading || saving || reordering || !!search.trim() || !!loadError || !!orderError || open;
  const categoryRows = rows.filter((row) => String(row.category_id) === filterCat);
  const currentPage = Math.min(pagination.current, Math.max(1, Math.ceil(filtered.length / pagination.pageSize)));
  const visibleRows = filtered.slice((currentPage - 1) * pagination.pageSize, currentPage * pagination.pageSize);

  async function reorder(activeId, overId) {
    if (reorderRef.current || reorderDisabled) return;
    const result = moveService(rows, filterCat, activeId, overId);
    if (!result) return;
    reorderRef.current = true;
    setReordering(true);
    setRows(result.rows);
    try {
      await saveServiceOrder(result.changes);
      message.success("Порядок услуг сохранён");
      await load();
    } catch (error) {
      setOrderError(`Порядок мог сохраниться частично. ${saveErrorMessage(error)} Обновите таблицу перед следующим перемещением.`);
      await load();
    } finally {
      reorderRef.current = false;
      setReordering(false);
    }
  }

  function moveAdjacent(id, direction) {
    const index = categoryRows.findIndex((row) => row.id === id);
    const target = categoryRows[index + direction];
    if (target) reorder(id, target.id);
  }

  const columns = [
    {
      title: "",
      key: "sort",
      width: 88,
      render: (_, row) => <ServiceDragHandle row={row} disabled={reorderDisabled} onMove={moveAdjacent}
        first={categoryRows[0]?.id === row.id} last={categoryRows.at(-1)?.id === row.id} />,
    },
    {
      title: "Категория",
      dataIndex: "category_id",
      width: 150,
      render: (id) => catMap[id] || "—",
      responsive: ["md"],
    },
    {
      title: "Услуга",
      dataIndex: "title",
      render: (v, r) => (
        <div>
          <strong>{v}</strong>
          {r.description ? (
            <div className="admin-desc" style={{ marginTop: 2 }}>
              {r.description}
            </div>
          ) : null}
          <div
            style={{ opacity: 0.55, fontSize: 12, marginTop: 2 }}
            className="admin-cat-mobile"
          >
            {catMap[r.category_id]}
          </div>
        </div>
      ),
    },
    {
      title: "Время",
      dataIndex: "duration",
      width: 90,
      render: (v) => v || "—",
      responsive: ["sm"],
    },
    {
      title: "Объём",
      dataIndex: "volume",
      width: 90,
      render: (v) => v || "—",
      responsive: ["sm"],
    },
    {
      title: "Цена",
      dataIndex: "price",
      width: 100,
      align: "right",
      render: (v) =>
        v == null ? "—" : `${Number(v).toLocaleString("ru-RU")} ₽`,
    },
    {
      title: "Обновлено",
      dataIndex: "updated_at",
      width: 140,
      render: (v) => <span className="updated-cell">{formatUpdatedAt(v)}</span>,
    },
    {
      title: "",
      key: "actions",
      width: 110,
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={reordering}
            onClick={() => openEdit(row)}
          />
          <Popconfirm
            title="Удалить услугу?"
            okText="Удалить"
            cancelText="Отмена"
            onConfirm={() => onDelete(row.id)}
          >
            <Button size="small" danger disabled={reordering} icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {orderError && <Alert type="error" showIcon message="Не удалось сохранить весь порядок" description={orderError}
        action={<Button disabled={!online || loading || reordering} onClick={async () => { await load(); setOrderError(null); }}>Обновить таблицу</Button>}
        style={{ marginBottom: 16 }} />}
      {loadError && <Alert type="error" showIcon message="Не удалось обновить услуги" description={loadError}
        action={<Button disabled={!online || loading} onClick={load}>Повторить</Button>}
        style={{ marginBottom: 16 }} />}
      <div className="admin-toolbar">
        <div className="left">
          <Select
            style={{ minWidth: 200 }}
            aria-label="Категория услуг"
            placeholder="Нет категорий"
            disabled={!categories.length || saving || reordering}
            value={filterCat}
            onChange={(value) => {
              setFilterCat(value);
              setPagination((current) => ({ ...current, current: 1 }));
            }}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          />
          <Input.Search
            allowClear
            placeholder="Поиск..."
            style={{ width: 200 }}
            value={search}
            disabled={reordering}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((current) => ({ ...current, current: 1 }));
            }}
          />
          <span style={{ opacity: 0.65 }}>{filtered.length} шт.</span>
        </div>
        <div className="right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            disabled={!categories.length || !online || saving || reordering}
          >
            Добавить
          </Button>
        </div>
      </div>

      <p className="admin-reorder-hint" role="status">
        {reordering ? "Сохраняем порядок…" : search.trim() ? "Очистите поиск, чтобы менять порядок услуг." : "Перетаскивайте строки за ручку. В меню ⋮ можно перемещать услуги выше и ниже, в том числе между страницами."}
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]}
        accessibility={{
          screenReaderInstructions: { draggable: "Нажмите пробел, чтобы поднять строку. Стрелки вверх и вниз меняют позицию. Пробел сохраняет, Escape отменяет." },
          announcements: {
            onDragStart: () => "Строка поднята. Используйте стрелки вверх и вниз.",
            onDragOver: ({ over }) => over ? `Позиция ${categoryRows.findIndex((row) => row.id === over.id) + 1}.` : "Строка вне области перемещения.",
            onDragEnd: ({ over }) => over ? "Строка перемещена. Сохраняем порядок." : "Перемещение отменено.",
            onDragCancel: () => "Перемещение отменено.",
          },
        }}
        onDragEnd={({ active, over }) => { if (over) reorder(active.id, over.id); }}>
      <SortableContext items={visibleRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
      <Table
        rowKey="id"
        loading={loading || reordering}
        components={{ body: { row: SortableServiceRow } }}
        onRow={() => ({ reorderDisabled })}
        columns={columns}
        dataSource={filtered}
        pagination={{
          current: currentPage,
          disabled: reordering,
          pageSize: pagination.pageSize,
          showSizeChanger: { showSearch: false },
          pageSizeOptions: [10, 20, 50, 100],
          onChange: (current, pageSize) => setPagination({ current, pageSize }),
        }}
        size="middle"
        scroll={{ x: true }}
      />
      </SortableContext>
      </DndContext>

      <Modal
        title={editing ? "Редактировать услугу" : "Новая услуга"}
        open={open}
        onCancel={() => { if (!saving) setOpen(false); }}
        onOk={onSave}
        confirmLoading={saving}
        okText={saving ? "Сохраняем…" : "Сохранить"}
        okButtonProps={{ disabled: !online || saving }}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
        keyboard={!saving}
        cancelText="Отмена"
        destroyOnClose
        width={560}
      >
        {saveError && <Alert type="error" showIcon message={saveError} role="alert" style={{ marginBottom: 16 }} />}
        <Spin spinning={saving} tip="Сохраняем изменения…">
        <Form form={form} layout="vertical" requiredMark={false} disabled={saving} aria-busy={saving}>
          <Form.Item
            label="Категория"
            name="category_id"
            rules={[{ required: true, message: "Выберите категорию" }]}
          >
            <Select
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Категория"
            />
          </Form.Item>
          <Form.Item
            label="Название"
            name="title"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input placeholder="Классический массаж лица" />
          </Form.Item>
          <Form.Item label="Описание услуги" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Показывается на сайте, если заполнено"
            />
          </Form.Item>
          <Space style={{ display: "flex" }} size="middle" wrap>
            <Form.Item label="Цена, ₽" name="price" style={{ minWidth: 140 }}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="1500" />
            </Form.Item>
            <Form.Item label="Время" name="duration" style={{ minWidth: 140 }}>
              <Input placeholder="30 мин" />
            </Form.Item>
            <Form.Item label="Объём" name="volume" style={{ minWidth: 140 }}>
              <Input placeholder="1 мл / 1 ед." />
            </Form.Item>
          </Space>
          {editing?.updated_at ? (
            <div style={{ opacity: 0.7, marginBottom: 8 }}>
              Последнее обновление: {formatUpdatedAt(editing.updated_at)}
            </div>
          ) : null}
        </Form>
        </Spin>
      </Modal>
    </div>
  );
}

export default ServicesPanel;
