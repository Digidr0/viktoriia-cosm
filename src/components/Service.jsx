import { Space, Image, Button } from "antd";
import { HashLink as Link } from "react-router-hash-link";
import "..//pages/Welcome.css";
import { MenuUnfoldOutlined } from "@ant-design/icons";

function Service(props) {
  return (
    <div className="Service component neu-drop">
      <div className="image-container neu-inner">
        <img src={props.src} className="services-photo" />
      </div>
      <div className="description">
        <div className="label-container neu-inner">
          <span className="image-label" to="/prices">
            {props.text}
          <p className="image-description">{props.descripion}</p>
          </span>
        </div>
        {props.anchor && (
          <Link to={"/prices#" + props.anchor} className="accent-btn neu-drop">
              подробнее
              <MenuUnfoldOutlined />
          </Link>
        )}
      </div>
    </div>
  );
}
export default Service;
