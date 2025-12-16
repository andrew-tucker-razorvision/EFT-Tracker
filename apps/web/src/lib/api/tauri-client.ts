/**
 * API Client for Tauri Companion App
 *
 * This client detects if the app is running in Tauri and routes all API calls
 * to the production server at https://learntotarkov.com
 *
 * For the web version, it uses relative URLs to call the local API.
 */

// Detect if running in Tauri
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// API base URL
const API_BASE_URL = isTauri
  ? process.env.NEXT_PUBLIC_API_URL || "https://learntotarkov.com"
  : ""; // Use relative URLs in web version

/**
 * Generic fetch wrapper with credentials
 */
async function fetchWithCredentials(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include", // Send cookies for authentication
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return response;
}

/**
 * API Client
 */
export const tauriApiClient = {
  /**
   * GET request
   */
  get: async <T = unknown>(path: string): Promise<T> => {
    const response = await fetchWithCredentials(path, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * POST request
   */
  post: async <T = unknown>(path: string, data: unknown): Promise<T> => {
    const response = await fetchWithCredentials(path, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * PUT request
   */
  put: async <T = unknown>(path: string, data: unknown): Promise<T> => {
    const response = await fetchWithCredentials(path, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * PATCH request
   */
  patch: async <T = unknown>(path: string, data: unknown): Promise<T> => {
    const response = await fetchWithCredentials(path, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * DELETE request
   */
  delete: async <T = unknown>(path: string): Promise<T> => {
    const response = await fetchWithCredentials(path, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
};

/**
 * Check if running in Tauri
 */
export function isTauriApp(): boolean {
  return isTauri;
}

/**
 * Get the API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
