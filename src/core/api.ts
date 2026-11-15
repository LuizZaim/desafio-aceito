import * as SecureStore from "expo-secure-store";
import { createApiClient } from "./api-client";
import { connectionWait } from "./connection-wait";
export { ApiError } from "./api-client";
const URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
export const hasAPI = !!URL;
export async function setToken(value: string | null) {
  if (value) await SecureStore.setItemAsync("da-token", value);
  else await SecureStore.deleteItemAsync("da-token");
}
export const getToken = () => SecureStore.getItemAsync("da-token");
export const request = createApiClient({ baseURL: URL, getToken, onSlowRequest: connectionWait.begin });
