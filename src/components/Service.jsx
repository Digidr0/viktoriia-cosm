import { Space, Image, Button } from "antd";
import "..//pages/Welcome.css";
function Service(props) {
  return (
    <div className="Service component">
      <Space direction="vertical" size={"middle"} className="service-space">
        <Image
            src={props.src}
            className="services-photo"
            width={innerWidth > 700 ? 150 : 200}
            height={innerWidth > 700 ? 150 : 200}
          />
        <span>{props.text}</span>
      </Space>
    </div>
  );
}
export default Service;
