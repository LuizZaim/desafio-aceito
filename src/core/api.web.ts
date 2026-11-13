import { createApiClient } from "./api-client";
export { ApiError } from "./api-client";
// Sessão efêmera para a prévia de interface. No aparelho, o token usa SecureStore.
const URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
export const hasAPI = !!URL;
let token: string | null = null;
export const getToken = async () => token;
export const setToken = async (value: string | null) => {
  token = value;
};
export const request = createApiClient({ baseURL: URL, getToken });
