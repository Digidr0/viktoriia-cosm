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
  Switch,
  Table,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { deletePromotion, listPromotions, savePromotion } from "../../api/promotions";
import { formatUpdatedAt } from "./slugify";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { saveErrorMessage } from "../../utils/network";

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
      setRows(await listPromotions());
    } catch (error) {
      setLoadError(error.message || "Не удалось загрузить акции");
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

    try {
      await savePromotion(editing?.id, payload);
      message.success(editing ? "Акция обновлена" : "Акция добавлена");
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
      await deletePromotion(id);
      message.success("Акция удалена");
      await load();
    } catch (error) {
      message.error(error.message || "Не удалось удалить акцию");
    }
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
      {loadError && <Alert type="error" showIcon message="Не удалось обновить акции" description={loadError}
        action={<Button disabled={!online || loading} onClick={load}>Повторить</Button>}
        style={{ marginBottom: 16 }} />}
      <div className="admin-toolbar">
        <div className="left">
          <strong>Акции</strong>
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
        title={editing ? "Редактировать акцию" : "Новая акция"}
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
        </Spin>
      </Modal>
    </div>
  );
}

export default PromotionsPanel;
