import { Button, Descriptions, Divider, Image, Space } from "antd";
import Service from "../components/Service";
import "./welcome.css";
import portraitImg from "/portrait_abstract_2x.png";
function Welcome(props) {
  return (
    <div className="Welcome Page">
      <div className="greeting">
        <div className="greeting-text">
          <h3>Здравствуйте, я</h3>
          <h1>Виктория</h1>
          <p>
            ваш личный косметолог. Добро пожаловать на мой личный сайт. Здесь вы
            можете узанть цены на процедуры и записаться на прием.
          </p>
          <Button
            type="primary"
            onClick={() => window.open("https://t.me/V_kosmy")}
          >
            Записаться прямо сейчас
          </Button>
        </div>
        <Image width={"100%"} className="portrait" src={portraitImg} preview={false} />
      </div>
      <Divider style={{ marginTop: "1em", fontSize: "1.5em" }}>
        Процедуры
      </Divider>
      <Space
        direction={innerWidth > 700 ? "horizontal" : "vertical"}
        className="service-containers"
      >
        <Service
          src="https://img.freepik.com/free-photo/high-angle-woman-getting-injection_23-2149341879.jpg?w=900"
          descripion="Биоревитализация  – внутрикожное введение гиалуроновой кислоты.
             Процедура способна оказать быстрое омолаживающее действие и справляется со всеми возрастными изменениями."
          text="Биоревитализация"
          anchor="bionic"
        ></Service>
        <Service
          src="https://images.squarespace-cdn.com/content/v1/5aeac3d9365f02e0414daf30/1525426805710-C1ST3OEZEYGV2N2G38ZH/microcurrent.jpg"
          descripion="Микротоковая терапия – один из физиотерапевтических методов воздействия на организм, который основан на использовании слабого импульсного электрического тока."
          text="Микротоковая терапия"
          anchor="external"
        ></Service>
        <Service
          src="https://goldenmandarin.ru/wp-content/uploads/2020/10/377173c917b98042a71f70f21f87795f.jpg"
          descripion="Пилинг – используется для отшелушивания клеток кожи лица, удаляются мёртвые клетки, благодаря чему кожа становится более гладкой и красивой."
          text="Пилинг"
          anchor="piling"
        ></Service>
        <Service
          src="https://expertclinics.ru/upload/iblock/3a5/3a5a2d566c8c3c6cc4da3fd29cdec195.jpg"
          descripion="Ботокс – препарат на основе ботулотоксина, который блокирует нервно-мышечную передачу, тем самым устранает мимические морщины."
          text="Ботокс"
        ></Service>
        <Service
          src="https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f"
          descripion="Чистка лица – удаление рогового слоя эпидермиса и избыточного секрета сальных желез с поверхности кожи."
          text="Чистка"
          anchor="skin"
        ></Service>
        <Service
          src="https://img.freepik.com/free-photo/portrait-cosmetology-procedures-pretty-young-woman-beauty-salon-dermatology-procedure-botox-eyebrows-hands-blue-glows-work-healthcare-therapy-beauty-rejuvenation_197531-2799.jpg?w=900"
          descripion="Окраска, коррекция бровей и ресниц. "
          text="Брови, ресницы"
          anchor="eyes"
        ></Service>
        <Service
          src="https://img.freepik.com/free-photo/beautiful-young-girl-beauty-salon_1157-21119.jpg?w=900"
          descripion="Депиляция — временное удаление волосков механическим или химическим способом."
          text="Депиляция"
          anchor="depelation"
        ></Service>
        <Service
          src="https://img.freepik.com/free-photo/beautician-doing-injection-filler-on-female-client_23-2148875446.jpg?w=996"
          descripion="Мезотерапия – методика, при которой препарат в малых дозах вводится под кожу на небольшую глубину с помощью тонких, коротких игл."
          text="Мезотерапия"
          anchor="mezo_d"
        ></Service>
      </Space>
    </div>
  );
}
export default Welcome;
