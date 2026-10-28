import { HashLink as Link } from "react-router-hash-link";
import "../pages/welcome.css";
import { MenuUnfoldOutlined } from "@ant-design/icons";
import ContentImage from "./ContentImage";

function Service(props) {
  return (
    <div className="Service component neu-drop">
      <div className="image-container neu-inner">
        <ContentImage
          src={props.src}
          className="service-media"
          imageClassName="services-photo"
          alt={props.text}
          width={700}
          height={500}
          loading="lazy"
          decoding="async"
        />
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
