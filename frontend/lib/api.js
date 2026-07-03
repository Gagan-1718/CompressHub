// API configuration
// In production (Vercel), set NEXT_PUBLIC_API_URL to the deployed backend URL.
// Locally, .env.local points it at http://localhost:8000.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
}
