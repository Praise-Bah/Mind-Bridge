import api from './api'

type ListResponse<T> = { results?: T } | T

export function unwrapList<T>(data: ListResponse<T>): T {
  if (data && typeof data === 'object' && 'results' in data) {
    return (data as { results: T }).results
  }
  return data as T
}

export async function getList<T>(url: string, params?: Record<string, string | number | boolean>) {
  const response = await api.get(url, { params })
  return unwrapList<T>(response.data)
}

export async function patchForm<T>(url: string, data: FormData): Promise<T> {
  const response = await api.patch(url, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
