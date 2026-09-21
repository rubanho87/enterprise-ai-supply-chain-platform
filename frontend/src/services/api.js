import axios from "axios"

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1"

const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "")

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API request failed", {
      method: error?.config?.method?.toUpperCase(),
      url: error?.config?.url,
      params: error?.config?.params,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })

    return Promise.reject(error)
  }
)

// ============================================================
// STOCKOUTS
// ============================================================

export const stockoutApi = {
  alerts: (params = {}) =>
    api.get("/stockouts/alerts", {
      params,
    }),
}

// ============================================================
// STOCK TRANSFERS
// ============================================================

export const transferApi = {
  recommendations: (params = {}) =>
    api.get("/transfers/recommendations", {
      params,
    }),
}

// ============================================================
// CRITICAL ACTIONS
// ============================================================

export const actionsApi = {
  critical: (params = {}) =>
    api.get("/actions/critical", {
      params,
    }),
}

// ============================================================
// RISK INTELLIGENCE
// ============================================================

export const riskApi = {
  executive: (params = {}) =>
    api.get("/risk/executive", {
      params,
    }),

  stores: (params = {}) =>
    api.get("/risk/stores", {
      params,
    }),

  products: (params = {}) =>
    api.get("/risk/products", {
      params,
    }),
}

// ============================================================
// AI ASSISTANT
// ============================================================

export const aiApi = {
  ask: (payload) =>
    api.post("/ai/ask", payload),
}

export default api