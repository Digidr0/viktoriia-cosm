import { Alert, Button, Spin, Tabs, message } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CategoriesPanel from "./CategoriesPanel";
import ServicesPanel from "./ServicesPanel";
import PromotionsPanel from "./PromotionsPanel";
import "./admin.css";

function AdminDashboard() {
  const { session, loading, signOut, user, isAdmin, accessError } = useAuth();
  const [activeTab, setActiveTab] = useState("services");
  const [categoryTitle, setCategoryTitle] = useState("");
  const sectionTitle = activeTab === "services"
    ? categoryTitle || "Услуги и цены"
    : activeTab === "categories" ? "Категории" : "Акции";

  if (loading) {
    return (
      <div className="admin-login-wrap">
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <h1>Нет доступа к управлению</h1>
          <Alert
            type="error"
            showIcon
            message={accessError || "У этого аккаунта нет прав администратора."}
          />
          <p>{user?.email}</p>
          <Button onClick={() => signOut().catch(() => message.error("Не удалось выйти. Попробуйте ещё раз."))}>
            Выйти и сменить аккаунт
          </Button>
          <Link to="/welcome"><Button type="link">На сайт</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="AdminPage">
      <div className="admin-shell">
        <div className="admin-topbar">
          <div>
            <h1>Управление сайтом</h1>
            <div className="meta">{user?.email}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link to="/welcome">
              <Button>На сайт</Button>
            </Link>
            <Button icon={<LogoutOutlined />} onClick={() => signOut()}>
              Выйти
            </Button>
          </div>
        </div>

        <div className="admin-card">
          <Tabs
            className="admin-tabs"
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarExtraContent={<h2 className="admin-section-title">{sectionTitle}</h2>}
            items={[
              {
                key: "services",
                label: "Услуги и цены",
                children: <ServicesPanel onCategoryChange={setCategoryTitle} />,
              },
              {
                key: "categories",
                label: "Категории",
                children: <CategoriesPanel />,
              },
              {
                key: "promotions",
                label: "Акции",
                children: <PromotionsPanel />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
