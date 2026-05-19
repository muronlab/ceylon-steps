import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const res = await apiClient.get<{ csrfToken: string }>("/security/csrf");
      csrfToken = res.data.csrfToken;
      return csrfToken;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
}

export function clearCsrfToken() {
  csrfToken = null;
}

apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();
  if (method && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    try {
      const token = await ensureCsrfToken();
      config.headers["x-csrf-token"] = token;
    } catch {
      // CSRF endpoint is best-effort; the request will fail naturally if required.
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      clearCsrfToken();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
