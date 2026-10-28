import { withConnectionGuard } from "../utils/network";

export function requestData(request) {
  return withConnectionGuard(async (signal) => {
    if (typeof request === "function") request = request();
    // PostgREST builders are lazy: attach cancellation before starting a request.
    if (typeof request.abortSignal === "function") request = request.abortSignal(signal);
    if (typeof request.retry === "function") request = request.retry(false);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  });
}
