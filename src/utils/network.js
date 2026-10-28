export const REQUEST_TIMEOUT_MS = 15000;

export function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function subscribeToConnection(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function connectionError(code, message) {
  const error = new Error(message);
  error.name = "ConnectionError";
  error.code = code;
  return error;
}

export function withConnectionGuard(operation, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  if (!isOnline()) {
    return Promise.reject(connectionError("OFFLINE", "Нет соединения с интернетом. Подключитесь к сети и повторите действие."));
  }

  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    let finished = false;
    let timer;
    let unsubscribe = () => {};
    const finish = (error, data) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      unsubscribe();
      if (error) {
        controller.abort();
        if (/failed to fetch|fetch failed|networkerror|network request failed/i.test(error.message || "")) {
          error = connectionError("NETWORK_ERROR", "Не удалось связаться с сервером. Проверьте подключение к интернету.");
        }
        reject(error);
      } else {
        resolve(data);
      }
    };
    unsubscribe = subscribeToConnection(() => {
      if (!isOnline()) finish(connectionError("CONNECTION_LOST", "Соединение с интернетом потеряно."));
    });
    timer = setTimeout(() => finish(connectionError("TIMEOUT", "Сервер не ответил за 15 секунд. Проверьте соединение.")), timeoutMs);
    Promise.resolve().then(() => {
      if (!finished) return operation(controller.signal);
    }).then((data) => finish(null, data), (error) => finish(error));
  });
}

export function saveErrorMessage(error) {
  const message = error.message || "Не удалось сохранить изменения.";
  if (error.code === "TIMEOUT" || error.code === "CONNECTION_LOST" || error.code === "NETWORK_ERROR" || error.name === "TypeError"
    || /fetch|network|connection/i.test(message)) {
    return `${message} Результат сохранения не подтверждён. После восстановления связи проверьте данные перед повторной отправкой.`;
  }
  return message;
}
