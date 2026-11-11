import * as SecureStore from "expo-secure-store";
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
const URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
export const hasAPI = !!URL;
export async function request(path: string, method = "GET", body?: unknown) {
  if (!URL)
    throw Error(
      "Servidor não configurado. Use Explorar demonstração para testar o app.",
    );
  const token = await SecureStore.getItemAsync("da-token");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(
        typeof data.message === "string"
          ? data.message
          : "Não foi possível concluir a operação.",
        response.status,
      );
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
export async function setToken(value: string | null) {
  if (value) await SecureStore.setItemAsync("da-token", value);
  else await SecureStore.deleteItemAsync("da-token");
}
export const getToken = () => SecureStore.getItemAsync("da-token");
