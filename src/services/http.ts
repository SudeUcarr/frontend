import type {ApiErrorBody} from '@kampuskit/shared/api'

const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {super(message); this.status = status; this.code = code}
}
export async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response
  try {response = await fetch(base + path, {...init, credentials: 'include'})}
  catch {throw new ApiError(0, 'NETWORK', 'Backend bağlantısı kurulamadı. Bağlantıyı kontrol edip yeniden dene.')}
  if (!response.ok) {
    const body = await response.json().catch(() => null) as ApiErrorBody | null
    if (response.status === 401) window.dispatchEvent(new Event('kampuskit:unauthenticated'))
    throw new ApiError(response.status, body?.error?.code || 'API_ERROR', body?.error?.message || 'İşlem tamamlanamadı. Yeniden deneyebilirsin.')
  }
  return response
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await request(path, {method, ...(body === undefined ? {} : {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})})
  return response.json() as Promise<T>
}
