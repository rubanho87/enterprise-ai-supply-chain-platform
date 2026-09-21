import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

export const getExecutiveRisk = async () => {
  const response = await api.get("/risk/executive")
  return response.data
}

export const getStoreRisks = async () => {
  const response = await api.get("/risk/stores")
  return response.data
}

export const getProductRisks = async () => {
  const response = await api.get("/risk/products")
  return response.data
}

export const getStockoutAlerts = async () => {
  const response = await api.get("/stockouts/alerts")
  return response.data
}

export const getTransferRecommendations = async () => {
  const response = await api.get("/transfers/recommendations")
  return response.data
}

export const getCriticalActions = async () => {
  const response = await api.get("/actions/critical")
  return response.data
}

export const askSupplyChainAI = async (question) => {
  const response = await api.post("/ai/ask", {
    question,
  })

  return response.data
}

export const getAIDecision = async () => {
  const response = await api.get("/ai/decision")
  return response.data
}

export const getHealth = async () => {
  const response = await axios.get(
    "http://127.0.0.1:8000/health",
    {
      timeout: 10000,
    },
  )

  return response.data
}

export default api