// import vid1 from "..//assets//videos/Cereal Milk 720P.mp4"
function Promotion(props) {
  return (
    <div className="Promotion component neu-drop ">
      <div className="promotion-border">
        <div className="promotion-video">
          <div className="video-shadow neu-inner"></div>
          <video
            src={`/videos/vid${props.position % 5}.webm`}
            preload="auto"
            autoPlay
            loop
            muted
          />
        </div>
        <div className="promotion-photo-container neu-drop">
          <img className="promotion-photo" src={props.src} />
        </div>

        <div className="promotion-title">
          <span>{props.title}</span>
        </div>
        <div className="promotion-description">
          <span>{props.description}</span>
        </div>
        <div className="promotion-newPrice">
          <span>{props.newPrice !== null ? props.newPrice + " ₽" : null}</span>
          <span className="promotion-oldPrice line-through">
            {props.oldPrice !== null ? props.oldPrice + "₽" : null}
          </span>
        </div>
      </div>
    </div>
  );
}
export default Promotion;
