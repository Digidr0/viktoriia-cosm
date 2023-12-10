function Promotion(props) {
  const videos = [
    "sugar-rush",
    "costa-brava",
    "spring",
    "cereal-milk",
    "mercury",
  ]
  console.log(props.position % 5);
  return (
    <div className="Promotion component neu-drop ">
      <div className="promotion-border neu-inner">
      <div className="video">
        <video src={`https://backgrounds.tella.tv/${videos[props.position % 5]}-4k.mp4`} preload="true" autoPlay loop muted />
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
