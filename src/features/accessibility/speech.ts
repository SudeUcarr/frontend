export type ReadingState = {phase: 'idle' | 'reading' | 'paused' | 'finished' | 'error'; index: number; total: number; text: string}

export function splitReadingText(text: string): string[] {
  const words = text.replace(/\s+/gu, ' ').trim().split(' ').filter(Boolean)
  const chunks: string[] = []
  let chunk = ''
  for (const word of words) {
    if (chunk && (chunk.length + word.length > 180 || /[.!?…]$/u.test(chunk))) {chunks.push(chunk); chunk = ''}
    chunk += (chunk ? ' ' : '') + word
  }
  if (chunk) chunks.push(chunk)
  return chunks
}

// A generation guards against delayed end/error events after cancel or navigation.
export class SpeechReader {
  private generation = 0
  private chunks: string[] = []
  private index = 0
  private utterance: SpeechSynthesisUtterance | null = null
  private phase: ReadingState['phase'] = 'idle'
  private synth: SpeechSynthesis
  private makeUtterance: (text: string) => SpeechSynthesisUtterance
  private changed: (state: ReadingState) => void
  constructor(synth: SpeechSynthesis, makeUtterance: (text: string) => SpeechSynthesisUtterance, changed: (state: ReadingState) => void) {
    this.synth = synth; this.makeUtterance = makeUtterance; this.changed = changed
  }
  private emit() {this.changed({phase: this.phase, index: this.index, total: this.chunks.length, text: this.chunks[this.index] || ''})}
  stop(notify = true) {
    this.generation++; this.utterance = null; this.synth.cancel()
    this.phase = 'idle'; this.chunks = []; this.index = 0
    if (notify) this.emit()
  }
  start(text: string, rate: number, voice: SpeechSynthesisVoice | null) {
    this.stop(false); this.synth.resume()
    this.chunks = splitReadingText(text)
    if (!this.chunks.length) {this.emit(); return}
    const generation = this.generation
    const next = () => {
      if (generation !== this.generation) return
      if (this.index >= this.chunks.length) {this.phase = 'finished'; this.utterance = null; this.emit(); return}
      const utterance = this.makeUtterance(this.chunks[this.index])
      this.utterance = utterance
      utterance.lang = voice?.lang || 'tr-TR'; utterance.rate = rate
      if (voice) utterance.voice = voice
      utterance.onend = () => {if (generation === this.generation) {this.index++; next()}}
      utterance.onerror = () => {
        if (generation !== this.generation) return
        this.generation++; this.synth.cancel(); this.phase = 'error'; this.utterance = null; this.emit()
      }
      if (this.phase !== 'paused') this.phase = 'reading'
      this.emit()
      try {this.synth.speak(this.utterance)} catch {utterance.onerror?.({} as SpeechSynthesisErrorEvent)}
    }
    next()
  }
  pause() {if (this.phase === 'reading') {this.synth.pause(); this.phase = 'paused'; this.emit()}}
  resume() {if (this.phase === 'paused') {this.synth.resume(); this.phase = 'reading'; this.emit()}}
}

const excluded = 'script,style,noscript,svg,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[hidden],[aria-hidden="true"],[inert],[data-speech-ignore]'
export function readableRoot(): HTMLElement {
  return document.querySelector<HTMLElement>('dialog[open], main') || document.getElementById('root') || document.body
}
export function visibleReadingText(root: HTMLElement): string {
  const parts: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let node: Node | null = walker.currentNode
  while (node) {
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement
    if (element && !element.closest(excluded) && element.getClientRects().length) {
      const style = getComputedStyle(element)
      if (style.visibility !== 'hidden' && style.visibility !== 'collapse') {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() && !element.closest('button[aria-label],a[aria-label]')) parts.push(node.textContent.trim())
        else if (element instanceof HTMLImageElement && element.alt) parts.push(element.alt)
        else if (element.matches('button,a') && element.getAttribute('aria-label')) parts.push(element.getAttribute('aria-label')!)
      }
    }
    node = walker.nextNode()
  }
  return parts.join(' ')
}
export function selectedReadingText(): string {
  const selection = window.getSelection()
  if (!selection?.rangeCount || selection.isCollapsed) return ''
  const root = readableRoot(), range = selection.getRangeAt(0)
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return ''
  // Inspect the original nodes so CSS-hidden text and editable values stay excluded.
  const parts: string[] = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const parent = node.parentElement
    if (parent && range.intersectsNode(node) && !parent.closest(excluded) && parent.getClientRects().length) {
      const style = getComputedStyle(parent)
      if (style.visibility !== 'hidden' && style.visibility !== 'collapse') {
        let text = node.textContent || ''
        const end = node === range.endContainer ? range.endOffset : text.length
        const start = node === range.startContainer ? range.startOffset : 0
        text = text.slice(start, end)
        if (text.trim()) parts.push(text.trim())
      }
    }
    node = walker.nextNode()
  }
  return parts.join(' ')
}
