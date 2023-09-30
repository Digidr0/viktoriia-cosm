import { Space, Image, Button } from "antd";
import "..//pages/Welcome.css";
function Service(props) {
  return (
    <div className="Service component neu-drop">
      <div className="image-container neu-inner">
        <img src={props.src} className="services-photo" />
      </div>
        <div className="label-container  neu-drop">
          <span className="image-label">{props.text}</span>
        </div>
    </div>
  );
}
export default Service;
