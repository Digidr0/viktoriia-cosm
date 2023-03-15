import { Button, Menu, Space } from "antd";
import { Link, useLocation } from "react-router-dom";
import React, { useState } from "react";
import { MailOutlined, UnorderedListOutlined, SendOutlined } from "@ant-design/icons";
const items = [
  {
    label: <Link to={`/viktoriia-cosm/welcome`}>Главная</Link>,
    key: "/viktoriia-cosm/welcome",
    icon: <MailOutlined />,
  },

  {
    label: <Link to={`/viktoriia-cosm/prices`}>Прайсы</Link>,
    key: "/viktoriia-cosm/prices",
    icon: <UnorderedListOutlined />,
  },
  {
    label: (
      <Space>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => window.open("https://t.me/V_kosmy")}
        >
          Telegram
        </Button>
      </Space>
    ),
    key: "telegram",
  },
];
function Header(props) {
  const [current, setCurrent] = useState(useLocation().pathname);
  return (
    <div className="Header component">
      <Menu
        onClick={(e) => setCurrent(e.key)}
        selectedKeys={[current]}
        mode="horizontal"
        items={items}
        style={{ display: "flex", justifyContent: "center" }}
      />
    </div>
  );
}
export default Header;
