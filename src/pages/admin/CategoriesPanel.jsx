import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { deleteCategory, listCategories, saveCategory } from "../../api/catalog";
import { slugify } from "./slugify";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { saveErrorMessage } from "../../utils/network";

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
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const online = useOnlineStatus();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      setRows(await listCategories());
    } catch (error) {
      setLoadError(error.message || "Не удалось загрузить категории");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [online]);

  function openCreate() {
    setSaveError(null);
    setEditing(null);
    form.setFieldsValue({ ...empty, sort_order: rows.length });
    setOpen(true);
  }

  function openEdit(row) {
    setSaveError(null);
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
      name: values.name.trim(),
      slug: (values.slug || slugify(values.name)).trim(),
      subtitle: values.subtitle?.trim() || null,
      description: values.description?.trim() || null,
      sort_order: Number(values.sort_order) || 0,
    };

    try {
      await saveCategory(editing?.id, payload);
      message.success(editing ? "Категория обновлена" : "Категория добавлена");
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
    try {
      await deleteCategory(id);
      message.success("Категория удалена");
      await load();
    } catch (error) {
      message.error(error.message || "Не удалось удалить категорию");
    }
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
      {loadError && <Alert type="error" showIcon message="Не удалось обновить категории" description={loadError}
        action={<Button disabled={!online || loading} onClick={load}>Повторить</Button>}
        style={{ marginBottom: 16 }} />}
      <div className="admin-toolbar">
        <div className="left">
          <strong>Категории</strong>
          <span style={{ opacity: 0.65 }}>{rows.length} шт.</span>
        </div>
        <div className="right">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!online || saving}>
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
      >
        {saveError && <Alert type="error" showIcon message={saveError} role="alert" style={{ marginBottom: 16 }} />}
        <Spin spinning={saving} tip="Сохраняем изменения…">
        <Form form={form} layout="vertical" requiredMark={false} disabled={saving} aria-busy={saving}>
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
            extra="Латиницей, для ссылок: /prices#massage"
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
        </Spin>
      </Modal>
    </div>
  );
}

export default CategoriesPanel;
