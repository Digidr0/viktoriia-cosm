import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { slugify } from "./slugify";

const empty = {
  name: "",
  slug: "",
  subtitle: "",
  description: "",
  sort_order: 0,
};

function CategoriesPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, subtitle, description, sort_order")
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
      name: row.name,
      slug: row.slug,
      subtitle: row.subtitle || "",
      description: row.description || "",
      sort_order: row.sort_order ?? 0,
    });
    setOpen(true);
  }

  async function onSave() {
    const values = await form.validateFields();
    setSaving(true);
    const payload = {
      name: values.name.trim(),
      slug: (values.slug || slugify(values.name)).trim(),
      subtitle: values.subtitle?.trim() || null,
      description: values.description?.trim() || null,
      sort_order: Number(values.sort_order) || 0,
    };

    const req = editing
      ? supabase.from("categories").update(payload).eq("id", editing.id)
      : supabase.from("categories").insert(payload);

    const { error } = await req;
    setSaving(false);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success(editing ? "Категория обновлена" : "Категория добавлена");
    setOpen(false);
    load();
  }

  async function onDelete(id) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("Категория удалена");
    load();
  }

  const columns = [
    {
      title: "Порядок",
      dataIndex: "sort_order",
      width: 90,
    },
    {
      title: "Название",
      dataIndex: "name",
      render: (v, r) => (
        <div>
          <strong>{v}</strong>
          <div style={{ opacity: 0.6, fontSize: 12 }}>{r.slug}</div>
        </div>
      ),
    },
    {
      title: "Подзаголовок",
      dataIndex: "subtitle",
      responsive: ["md"],
      render: (v) => v || "—",
    },
    {
      title: "Описание",
      dataIndex: "description",
      responsive: ["lg"],
      render: (v) =>
        v ? <span className="admin-desc">{v}</span> : <span>—</span>,
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
            title="Удалить категорию и все её услуги?"
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
          <strong>Категории</strong>
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
        title={editing ? "Редактировать категорию" : "Новая категория"}
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
            name="name"
            rules={[{ required: true, message: "Укажите название" }]}
          >
            <Input
              placeholder="Массаж лица"
              onBlur={(e) => {
                const slug = form.getFieldValue("slug");
                if (!slug) form.setFieldValue("slug", slugify(e.target.value));
              }}
            />
          </Form.Item>
          <Form.Item
            label="Якорь (slug)"
            name="slug"
            rules={[{ required: true, message: "Укажите slug" }]}
            extra="Латиницей, для ссылок: #/prices#massage"
          >
            <Input placeholder="massage" />
          </Form.Item>
          <Form.Item label="Подзаголовок" name="subtitle">
            <Input placeholder="Holy Land (Израиль)" />
          </Form.Item>
          <Form.Item label="Описание категории" name="description">
            <Input.TextArea rows={3} placeholder="Кратко о категории" />
          </Form.Item>
          <Form.Item label="Порядок" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CategoriesPanel;
