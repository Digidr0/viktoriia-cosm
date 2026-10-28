import { Button, Skeleton } from "antd";
import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import "./content-image.css";

function LoadingImage({ src, alt, className = "", imageClassName, loading = "lazy", ...imageProps }) {
  const imageRef = useRef(null);
  const cancelWait = useRef(() => {});
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const online = useOnlineStatus();

  useEffect(() => {
    const image = imageRef.current;
    if (image.complete && image.naturalWidth > 0) {
      setStatus("ready");
      return;
    }
    let timer;
    const fail = () => setStatus((current) => current === "loading" ? "error" : current);
    const startTimeout = () => {
      if (!timer) timer = setTimeout(fail, 15000);
    };
    let observer;
    if (loading === "eager" || typeof IntersectionObserver === "undefined") {
      startTimeout();
    } else {
      // Off-screen lazy images must not time out before the visitor reaches them.
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startTimeout();
          observer.disconnect();
        }
      }, { rootMargin: "1000px" });
      observer.observe(image);
    }
    const cleanup = () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
    cancelWait.current = cleanup;
    return cleanup;
  }, [attempt, loading]);

  useEffect(() => {
    if (!online) setStatus((current) => current === "loading" ? "error" : current);
  }, [online]);

  return (
    <div className={`content-image ${className}`} data-state={status} aria-busy={status === "loading"}>
      <img
        {...imageProps}
        key={attempt}
        ref={imageRef}
        src={src}
        alt={alt}
        className={`content-image-file ${imageClassName || ""}`}
        loading={loading}
        decoding="async"
        onLoad={() => { cancelWait.current(); setStatus("ready"); }}
        onError={() => { cancelWait.current(); setStatus("error"); }}
      />
      {status === "loading" && (
        <div className="content-image-placeholder" aria-hidden="true">
          <Skeleton.Node active rootClassName="content-image-skeleton" style={{ width: "100%", height: "100%", borderRadius: "inherit" }}>
            <span />
          </Skeleton.Node>
        </div>
      )}
      {status === "error" && (
        <div className="content-image-error">
          <span role="status">Фото не загрузилось</span>
          <Button size="small" disabled={!online} onClick={() => {
            setStatus("loading");
            setAttempt((value) => value + 1);
          }}>Загрузить снова</Button>
        </div>
      )}
    </div>
  );
}

export default function ContentImage(props) {
  return <LoadingImage key={props.src} {...props} />;
}
