export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
// Sessão efêmera para a prévia de interface. No aparelho, o token usa SecureStore.
const URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
export const hasAPI = !!URL;
let token: string | null = null;
export const getToken = async () => token;
export const setToken = async (value: string | null) => {
  token = value;
};
export async function request(path: string, method = "GET", body?: unknown) {
  if (!URL)
    throw Error(
      "Servidor não configurado. Use Explorar demonstração para testar o app.",
    );
  const r = await fetch(URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 204) return null;
  const data = await r.json();
  if (!r.ok)
    throw new ApiError(data.message || "Não foi possível concluir.", r.status);
  return data;
}
