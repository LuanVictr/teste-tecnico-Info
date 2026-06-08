import axios from 'axios'

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jwt_token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)
