import {useEffect, useRef, useState} from 'react'
import {useLocation} from 'react-router-dom'
import {Volume2, Play, Pause, Square, X, TextSelect} from 'lucide-react'
import {SpeechReader, readableRoot, selectedReadingText, visibleReadingText} from '../features/accessibility/speech'
import type {ReadingState} from '../features/accessibility/speech'
import './speech-reading.css'

const initial: ReadingState = {phase: 'idle', index: 0, total: 0, text: ''}
const labels = {idle: 'Okumaya hazır.', reading: 'Sesli okuma sürüyor.', paused: 'Okuma duraklatıldı.', finished: 'Okuma tamamlandı.', error: 'Ses başlatılamadı. Cihazının ses ayarlarını kontrol edip yeniden dene.'}

export function SpeechReading() {
  const [open, setOpen] = useState(false), [state, setState] = useState(initial)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceId, setVoiceId] = useState(''), [rate, setRate] = useState(1)
  const [notice, setNotice] = useState(''), [selected, setSelected] = useState({text: '', path: ''})
  const reader = useRef<SpeechReader | null>(null), launcher = useRef<HTMLButtonElement>(null), firstControl = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const selection = selected.path === location.pathname + location.search ? selected.text : ''
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  const active = state.phase === 'reading' || state.phase === 'paused'
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis
    reader.current = new SpeechReader(synth, text => new SpeechSynthesisUtterance(text), setState)
    const updateVoices = () => setVoices(synth.getVoices().sort((a, b) => Number(b.lang.toLowerCase().startsWith('tr')) - Number(a.lang.toLowerCase().startsWith('tr')) || a.name.localeCompare(b.name)))
    const updateSelection = () => setSelected({text: selectedReadingText(), path: window.location.hash.replace(/^#/u, '') || '/'})
    updateVoices(); synth.addEventListener('voiceschanged', updateVoices)
    document.addEventListener('selectionchange', updateSelection)
    const current = reader.current
    return () => {current.stop(false); reader.current = null; synth.removeEventListener('voiceschanged', updateVoices); document.removeEventListener('selectionchange', updateSelection)}
  }, [supported])
  useEffect(() => {reader.current?.stop()}, [location.pathname, location.search])
  useEffect(() => {if (open) firstControl.current?.focus()}, [open])
  const chosenVoice = voices.find(voice => voice.voiceURI === voiceId) || voices.find(voice => voice.lang.toLowerCase().startsWith('tr')) || null
  const close = () => {reader.current?.stop(); setOpen(false); setNotice(''); launcher.current?.focus()}
  const read = (selected: boolean) => {
    const text = selected ? selection : visibleReadingText(readableRoot())
    if (!text) {setNotice(selected ? 'Önce sayfa içeriğinden bir metin seç.' : 'Bu sayfada okunacak metin bulunamadı.'); return}
    setNotice(''); reader.current?.start(text, rate, chosenVoice)
  }
  return <div className="speech-reading" data-speech-ignore>
    <button className="speech-skip" onClick={() => {const main = readableRoot(); main.tabIndex = -1; main.focus()}}>Ana içeriğe geç</button>
    <button ref={launcher} className="speech-launcher" aria-expanded={open} aria-controls="speech-reading-panel" onClick={() => open ? close() : setOpen(true)}><Volume2 size={20} aria-hidden="true"/>Sesli oku{active && <span className="speech-indicator" aria-hidden="true"/>}</button>
    {open && <section id="speech-reading-panel" className="speech-panel" aria-labelledby="speech-reading-title" onKeyDown={event => {if (event.key === 'Escape') {event.stopPropagation(); close()}}}>
      <header><div className="speech-panel-icon"><Volume2 size={22} aria-hidden="true"/></div><div><h2 id="speech-reading-title">Sesli okuma</h2><p>KampüsKit’i dinleyerek keşfet.</p></div><button className="speech-close" onClick={close} aria-label="Sesli okumayı durdur ve paneli kapat"><X size={20} aria-hidden="true"/></button></header>
      <p className="speech-help">Sayfanın ana içeriğini dinle veya bir metin seçip yalnızca onu okut.</p>
      {!supported && <p className="speech-warning" role="status">Bu tarayıcı sesli okumayı desteklemiyor. Güncel Chrome, Edge veya Safari ile deneyebilirsin.</p>}
      <div className="speech-start-actions"><button ref={firstControl} className="speech-primary" disabled={!supported} onClick={() => read(false)}><Play size={18} aria-hidden="true"/>{active ? 'Sayfayı baştan oku' : 'Sayfayı oku'}</button><button className="speech-secondary" disabled={!supported || !selection} onClick={() => read(true)}><TextSelect size={18} aria-hidden="true"/>Seçili metni oku</button></div>
      <div className="speech-transport"><button disabled={!active} onClick={() => state.phase === 'paused' ? reader.current?.resume() : reader.current?.pause()}>{state.phase === 'paused' ? <Play size={17} aria-hidden="true"/> : <Pause size={17} aria-hidden="true"/>}{state.phase === 'paused' ? 'Devam et' : 'Duraklat'}</button><button disabled={!active} onClick={() => {reader.current?.stop(); firstControl.current?.focus()}}><Square size={16} aria-hidden="true"/>Durdur</button></div>
      <div className="speech-settings"><div><label htmlFor="speech-rate">Okuma hızı</label><select id="speech-rate" value={rate} disabled={active || !supported} onChange={event => setRate(Number(event.target.value))}><option value={0.75}>Yavaş · 0,75×</option><option value={1}>Normal · 1×</option><option value={1.25}>Hızlı · 1,25×</option><option value={1.5}>Çok hızlı · 1,5×</option></select></div><div><label htmlFor="speech-voice">Ses</label><select id="speech-voice" value={voiceId} disabled={active || !supported} onChange={event => setVoiceId(event.target.value)}><option value="">Türkçe · otomatik</option>{voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></div></div>
      {supported && voices.length > 0 && !voices.some(voice => voice.lang.toLowerCase().startsWith('tr')) && <p className="speech-warning">Cihazda Türkçe ses bulunamadı. Sistemine Türkçe konuşma sesi eklemek telaffuzu iyileştirir.</p>}
      <div className="speech-status"><span className={'speech-status-dot ' + (active ? 'active' : '')} aria-hidden="true"/><p role="status" aria-live="polite" aria-atomic="true">{notice || labels[state.phase]}</p></div>
      {state.total > 0 && <><progress aria-label="Okuma ilerlemesi" max={state.total} value={state.phase === 'finished' ? state.total : state.index}/><p className="speech-current" aria-hidden="true">{state.phase === 'finished' ? 'Sayfanın sonuna geldin.' : state.text}</p></>}
      <p className="speech-footnote">Ses, tarayıcının konuşma özelliğiyle okunur. Tab ile kontroller arasında ilerle; Esc ile durdurup kapat.</p>
    </section>}
  </div>
}
