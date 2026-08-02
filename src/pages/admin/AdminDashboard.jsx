import { Button, Spin, Tabs } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CategoriesPanel from "./CategoriesPanel";
import ServicesPanel from "./ServicesPanel";
import PromotionsPanel from "./PromotionsPanel";
import "./admin.css";

function AdminDashboard() {
  const { session, loading, signOut, user } = useAuth();

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
            defaultActiveKey="services"
            items={[
              {
                key: "services",
                label: "Услуги и цены",
                children: <ServicesPanel />,
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
