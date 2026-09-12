import {api} from './http'
import type {AppSession, HealthResponse, SessionResponse} from '@kampuskit/shared/api'

const listeners = new Set<(session: AppSession | null) => void>()
function announce(session: AppSession | null) {for (const listener of listeners) listener(session); channel?.postMessage('changed')}
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('kampuskit-auth') : null
if (channel) channel.onmessage = () => {void auth.getSession().then(({session}) => {for (const listener of listeners) listener(session)}).catch(() => {})}
export const auth = {
  health: () => api<HealthResponse>('/health'),
  getSession: () => api<SessionResponse>('/auth/session'),
  subscribe(listener: (session: AppSession | null) => void) {listeners.add(listener); return () => {listeners.delete(listener)}},
  async login(email: string, password: string) {const result = await api<SessionResponse>('/auth/login', 'POST', {email, password}); announce(result.session); return result},
  async signup(email: string, password: string) {const result = await api<SessionResponse>('/auth/signup', 'POST', {email, password}); if (result.session) announce(result.session); return result},
  reset: (email: string) => api('/auth/reset', 'POST', {email}),
  async updatePassword(password: string) {const result = await api<SessionResponse>('/auth/password', 'POST', {password}); announce(result.session)},
  async logout() {await api('/auth/logout', 'POST'); announce(null)}
}
let callbackPromise: Promise<void> | undefined
export function handleAuthCallback() {return callbackPromise ??= exchangeCallback()}
async function exchangeCallback() {
  const url = new URL(window.location.href), code = url.searchParams.get('code'), error = url.searchParams.get('error_description')
  if (!code && !error) return
  let route = url.searchParams.get('flow') === 'recovery' ? '/sifre-yenile' : '/app'
  try {
    if (error) throw new Error(error)
    const result = await api<SessionResponse>('/auth/exchange', 'POST', {code,flowId:url.searchParams.get('sb_flow_id')||undefined}); announce(result.session)
  } catch (error) {
    sessionStorage.setItem('auth_error', error instanceof Error ? error.message : 'Bağlantı geçersiz.'); route = '/giris'
  }
  window.history.replaceState({}, '', url.pathname + '#' + route)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
