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

export default API

// ── Issues ────────────────────────────────────────────────────────────────────

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