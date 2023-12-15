import "./App.css";
import {
  Routes,
  Route,
  Navigate,
  HashRouter as Router,
} from "react-router-dom";
import Header from "./components/Header";
import Welcome from "./pages/Welcome";
import Prices from "./pages/Prices";
import Promotions from "./pages/Promotions";
import { ConfigProvider, Layout } from "antd";

function App() {
  return (
    <div className="App">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: getComputedStyle(document.body).getPropertyValue(
              "--accent-color"
            ),
            colorText:"#555",
            fontFamily: [
              "Comfortaa",
              "cursive",
              "Helvetica",
              "Arial",
              "sans-serif",
            ],
          },
          components: {
            Menu: {
              fontSize: 16,
              margin: 4,
            },
          },
        }}
      >
        <Router basename="">
          <Layout style={{ backgroundColor: "transparent " }}>
            <Header />
            <Routes>
              <Route path="/welcome" element={<Welcome />}></Route>
              <Route path="/*" element={<Navigate to="/welcome" />}></Route>
              <Route path="/prices" element={<Prices />}></Route>
              <Route path="/promotions" element={<Promotions />}></Route>
            </Routes>
          </Layout>
        </Router>
      </ConfigProvider>
    </div>
  );
}

export default App;
