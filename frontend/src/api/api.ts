import axios from 'axios'

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/`
})

API.interceptors.request.use(config => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

//Auto-refresh on 401
let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // Only handle 401s, and only retry once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refresh = localStorage.getItem('refresh')
    if (!refresh) {
      // No refresh token available — force logout
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      // Queue this request until the in-flight refresh finishes
      return new Promise(resolve => {
        pendingRequests.push(newToken => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(API(originalRequest))
        })
      })
    }

    isRefreshing = true
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/token/refresh/`, {
        refresh,
      })
      const newAccess = res.data.access
      localStorage.setItem('access', newAccess)

      pendingRequests.forEach(cb => cb(newAccess))
      pendingRequests = []

      originalRequest.headers.Authorization = `Bearer ${newAccess}`
      return API(originalRequest)
    } catch (refreshError) {
      // Refresh token itself expired/invalid — force logout
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default API

// Issues

export const reportIssue = (fieldId: number, data: {
  issue_type: string
  severity: string
  description: string
}) => API.post(`fields/${fieldId}/issues/report/`, data)

export const getFieldIssues = (fieldId: number) =>
  API.get(`fields/${fieldId}/issues/`)

export const getAllIssues = () =>
  API.get('issues/')

export const getOpenIssuesCount = () =>
  API.get('issues/count/')

export const updateIssueStatus = (issueId: number, status: string) =>
  API.patch(`issues/${issueId}/status/`, { status })