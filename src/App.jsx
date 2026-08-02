import "./App.css";
import {
  Routes,
  Route,
  Navigate,
  HashRouter as Router,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header";
import Welcome from "./pages/Welcome";
import Prices from "./pages/Prices";
import Promotions from "./pages/Promotions";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider, Layout, FloatButton } from "antd";
import ruRU from "antd/locale/ru_RU";

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="App" style={isAdmin ? { height: "auto", minHeight: "100%" } : undefined}>
      {!isAdmin ? (
        <Layout style={{ backgroundColor: "transparent " }}>
          <Header />
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>
      )}
      {!isAdmin ? <FloatButton.BackTop /> : null}
    </div>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: getComputedStyle(document.body).getPropertyValue(
            "--accent-color"
          ),
          colorText: "#555",
          fontFamily: [
            "Comfortaa",
            "cursive",
            "Helvetica",
            "Arial",
            "sans-serif",
          ],
          borderRadius: 10,
        },
        components: {
          Menu: {
            fontSize: 16,
            margin: 4,
          },
        },
      }}
    >
      <AuthProvider>
        <Router basename="">
          <AppShell />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
