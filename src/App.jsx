import "./App.css";
import { Routes, Route, Navigate, BrowserRouter as Router } from "react-router-dom";
import Header from "./components/Header";
import Welcome from "./pages/Welcome";
import Prices from "./pages/Prices";
import { ConfigProvider, Layout } from "antd";

function App() {
  return (
    <div className="App">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: getComputedStyle(document.body).getPropertyValue("--accent-color"),
            fontFamily: ['Comfortaa', "cursive", "Helvetica", "Arial", "sans-serif"]
          },
        }}
      >
        <Router>
        <Layout style={{backgroundColor:"transparent "}}>
          <Header />
          <Routes>
            <Route path="/welcome" element={<Welcome />}></Route>
            <Route path="/*" element={<Navigate to="welcome" />}></Route>
            <Route path="prices" element={<Prices />}></Route>
          </Routes>
          </Layout>
        </Router>
      </ConfigProvider>
    </div>
  );
}

export default App;
