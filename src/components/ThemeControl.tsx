import {useEffect, useState} from 'react'
import {Moon, Sun, Monitor} from 'lucide-react'

type Preference = 'light' | 'dark' | 'system'
function initialPreference(): Preference {
  try {const value = localStorage.getItem('kampuskit-theme'); if (value === 'light' || value === 'dark') return value} catch { /* Storage can be unavailable. */ }
  return 'system'
}
export function ThemeControl() {
  const [preference, setPreference] = useState(initialPreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const dark = preference === 'dark' || (preference === 'system' && systemDark)
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const changed = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', changed); return () => query.removeEventListener('change', changed)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101827' : '#f6f8ff')
    try {if (preference === 'system') localStorage.removeItem('kampuskit-theme'); else localStorage.setItem('kampuskit-theme', preference)} catch { /* The current preference still works. */ }
  }, [dark, preference])
  return <div className="theme-control" data-speech-ignore role="group" aria-label="Görünüm tercihleri">
    <button className="theme-switch" onClick={() => setPreference(dark ? 'light' : 'dark')} aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}>{dark ? <Sun size={18} aria-hidden="true"/> : <Moon size={18} aria-hidden="true"/>}<span>{dark ? 'Açık tema' : 'Koyu tema'}</span></button>
    <button className="theme-system" aria-label="Cihazın tema tercihini kullan" aria-pressed={preference === 'system'} title="Cihazın temasını kullan" onClick={() => setPreference('system')}><Monitor size={17} aria-hidden="true"/></button>
    <span className="visually-hidden" role="status">{dark ? 'Koyu tema etkin.' : 'Açık tema etkin.'}{preference === 'system' ? ' Cihaz tercihi izleniyor.' : ''}</span>
  </div>
}
