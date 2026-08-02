import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { formatUpdatedAt } from "./slugify";

const empty = {
  title: "",
  description: "",
  image_url: "",
  new_price: null,
  old_price: null,
  is_active: true,
  sort_order: 0,
};

function PromotionsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("promotions")
      .select(
        "id, title, description, image_url, new_price, old_price, is_active, sort_order, updated_at"
      )
      .order("sort_order", { ascending: true });
    if (error) message.error(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    form.setFieldsValue({ ...empty, sort_order: rows.length });
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      description: row.description || "",
      image_url: row.image_url || "",
      new_price: row.new_price,
      old_price: row.old_price,
      is_active: row.is_active,
      sort_order: row.sort_order ?? 0,
    });
    setOpen(true);
  }

  async function onSave() {
    const values = await form.validateFields();
    setSaving(true);
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      image_url: values.image_url?.trim() || null,
      new_price:
        values.new_price == null || values.new_price === ""
          ? null
          : Number(values.new_price),
      old_price:
        values.old_price == null || values.old_price === ""
          ? null
          : Number(values.old_price),
      is_active: !!values.is_active,
      sort_order: Number(values.sort_order) || 0,
    };

    const req = editing
      ? supabase.from("promotions").update(payload).eq("id", editing.id)
      : supabase.from("promotions").insert(payload);

    const { error } = await req;
    setSaving(false);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success(editing ? "Акция обновлена" : "Акция добавлена");
    setOpen(false);
    load();
  }

  async function onDelete(id) {
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("Акция удалена");
    load();
  }

  const columns = [
    {
      title: "Акция",
      dataIndex: "title",
      render: (v, r) => (
        <div>
          <strong>{v}</strong>
          {r.description ? (
            <div className="admin-desc" style={{ marginTop: 2 }}>
              {r.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Новая",
      dataIndex: "new_price",
      width: 100,
      render: (v) =>
        v == null ? "—" : `${Number(v).toLocaleString("ru-RU")} ₽`,
    },
    {
      title: "Старая",
      dataIndex: "old_price",
      width: 100,
      responsive: ["sm"],
      render: (v) =>
        v == null ? "—" : `${Number(v).toLocaleString("ru-RU")} ₽`,
    },
    {
      title: "Активна",
      dataIndex: "is_active",
      width: 90,
      render: (v) => (v ? "Да" : "Нет"),
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
            title="Удалить акцию?"
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
          <strong>Акции</strong>
          <span style={{ opacity: 0.65 }}>{rows.length} шт.</span>
        </div>
        <div className="right">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Добавить
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        scroll={{ x: true }}
      />

      <Modal
        title={editing ? "Редактировать акцию" : "Новая акция"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Название"
            name="title"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input placeholder="Миндальный пилинг" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            label="URL картинки"
            name="image_url"
            extra="Пока ссылка; позже перенесём в Supabase Storage"
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Space wrap style={{ display: "flex" }}>
            <Form.Item label="Новая цена" name="new_price">
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="Старая цена" name="old_price">
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="Порядок" name="sort_order">
              <InputNumber min={0} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item
              label="Активна"
              name="is_active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>
          {editing?.updated_at ? (
            <div style={{ opacity: 0.7 }}>
              Последнее обновление: {formatUpdatedAt(editing.updated_at)}
            </div>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}

export default PromotionsPanel;
