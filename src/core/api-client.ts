/** Shared transport for native and web; the session storage stays platform-specific. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function createApiClient(options: {
  baseURL: string;
  getToken: () => Promise<string | null>;
  fetch?: typeof fetch;
  timeoutMs?: number;
}) {
  const baseURL = options.baseURL.replace(/\/+$/, "");
  return async function request<T = any>(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    if (!baseURL)
      throw Error(
        "O serviço de contas ainda não está disponível. Você pode cadastrar seu time neste aparelho ou explorar a demonstração.",
      );
    // Keep authenticated requests on the configured service, never on a supplied URL.
    if (!path.startsWith("/") || path.startsWith("//"))
      throw Error("Endereço de serviço inválido.");
    const token = await options.getToken();
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 15000,
    );
    try {
      const response = await (options.fetch ?? fetch)(baseURL + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (response.status === 204) return null as T;
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new ApiError(
          "O serviço retornou uma resposta inválida. Tente novamente.",
          response.status,
        );
      }
      if (!response.ok)
        throw new ApiError(
          typeof data?.message === "string" && response.status < 500
            ? data.message
            : "Não foi possível concluir a operação. Tente novamente.",
          response.status,
        );
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw Error(
        controller.signal.aborted
          ? "A conexão demorou mais que o esperado. Tente novamente."
          : "Não foi possível conectar ao serviço. Confira sua internet e tente novamente.",
      );
    } finally {
      clearTimeout(timeout);
    }
  };
}
