import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";
import { formatUpdatedAt } from "./slugify";

const empty = {
  category_id: null,
  title: "",
  price: null,
  description: "",
  duration: "",
  volume: "",
  sort_order: 0,
};

function ServicesPanel() {
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    const [catRes, svcRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("services")
        .select(
          "id, category_id, title, price, description, duration, volume, sort_order, updated_at"
        )
        .order("sort_order", { ascending: true }),
    ]);

    if (catRes.error || svcRes.error) {
      message.error(catRes.error?.message || svcRes.error?.message);
    }
    setCategories(catRes.data || []);
    setRows(svcRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterCat !== "all" && String(r.category_id) !== String(filterCat)) {
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
    setEditing(null);
    form.setFieldsValue({
      ...empty,
      category_id:
        filterCat !== "all" ? Number(filterCat) : categories[0]?.id ?? null,
      sort_order: 0,
    });
    setOpen(true);
  }

  function openEdit(row) {
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
    const values = await form.validateFields();
    setSaving(true);
    const payload = {
      category_id: values.category_id,
      title: values.title.trim(),
      price: values.price == null || values.price === "" ? null : Number(values.price),
      description: values.description?.trim() || null,
      duration: values.duration?.trim() || null,
      volume: values.volume?.trim() || null,
      sort_order: Number(values.sort_order) || 0,
    };

    const req = editing
      ? supabase.from("services").update(payload).eq("id", editing.id)
      : supabase.from("services").insert(payload);

    const { error } = await req;
    setSaving(false);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success(editing ? "Услуга обновлена" : "Услуга добавлена");
    setOpen(false);
    load();
  }

  async function onDelete(id) {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("Услуга удалена");
    load();
  }

  const columns = [
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
            onClick={() => openEdit(row)}
          />
          <Popconfirm
            title="Удалить услугу?"
            okText="Удалить"
            cancelText="Отмена"
            onConfirm={() => onDelete(row.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-toolbar">
        <div className="left">
          <Select
            style={{ minWidth: 200 }}
            value={filterCat}
            onChange={setFilterCat}
            options={[
              { value: "all", label: "Все категории" },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
          <Input.Search
            allowClear
            placeholder="Поиск..."
            style={{ width: 200 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ opacity: 0.65 }}>{filtered.length} шт.</span>
        </div>
        <div className="right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            disabled={!categories.length}
          >
            Добавить
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        size="middle"
        scroll={{ x: true }}
      />

      <Modal
        title={editing ? "Редактировать услугу" : "Новая услуга"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
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
            <Form.Item label="Порядок" name="sort_order" style={{ minWidth: 100 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          {editing?.updated_at ? (
            <div style={{ opacity: 0.7, marginBottom: 8 }}>
              Последнее обновление: {formatUpdatedAt(editing.updated_at)}
            </div>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}

export default ServicesPanel;
