import { Button, Descriptions, Divider, Image, Space } from "antd";
import Service from "../components/Service";
import "./welcome.css";
import portraitImg from "/Portrait-3_bg.jpg";
import data from "..//data/services.json";

function Welcome(props) {
  return (
    <div className="Welcome Page">
      <div className="greeting">
        <div className="greeting-text">
          <h3>Здравствуйте, я</h3>
          <h1>Виктория</h1>
          <p>
            ваш косметолог. Добро пожаловать на мой личный сайт. Здесь вы можете
            узанть цены на процедуры и записаться на прием.
          </p>
          <Button
            type="primary"
            onClick={() => window.open("https://t.me/V_kosmy")}
          >
            Записаться прямо сейчас
          </Button>
        </div>
        <Image
          width={"100%"}
          className="portrait"
          src={portraitImg}
          preview={false}
        />
      </div>
      <Divider
        style={{
          marginTop: "1em",
          fontSize: "1.5em",
          position: "relative",
          color: "var(--bg-color)",
        }}
      >
        <div className="spacer layer1"></div>
        Процедуры
      </Divider>

      <Space
        direction={innerWidth > 700 ? "horizontal" : "vertical"}
        className="service-containers"
      >
        {data.map((service, i) => {
          return (
            <Service
              src={service.src}
              descripion={service.descripion}
              text={service.text}
              anchor={service.anchor}
              key={i}
            ></Service>
            
          );
        })}
      </Space>
    </div>
  );
}
export default Welcome;
