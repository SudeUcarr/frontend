import {test} from 'node:test'
import assert from 'node:assert/strict'
import {SpeechReader, splitReadingText} from './src/features/accessibility/speech.ts'

function setup() {
  const spoken = [], states = [], calls = {cancel: 0, pause: 0, resume: 0}
  const synth = {speak: utterance => spoken.push(utterance), cancel: () => calls.cancel++, pause: () => calls.pause++, resume: () => calls.resume++}
  const reader = new SpeechReader(synth, text => ({text}), state => states.push(state))
  return {reader, spoken, states, calls}
}
test('speech reads long content in order and completes with the chosen Turkish voice and speed', () => {
  const {reader, spoken, states} = setup()
  const voice = {lang: 'tr-TR', voiceURI: 'turkish'}
  reader.start('Dersler burada. Takvimini keşfet! KampüsKit.', 0.75, voice)
  assert.equal(spoken[0].text, 'Dersler burada.')
  assert.equal(spoken[0].voice, voice); assert.equal(spoken[0].rate, 0.75)
  spoken[0].onend(); assert.equal(spoken[1].text, 'Takvimini keşfet!')
  spoken[1].onend(); spoken[2].onend()
  assert.equal(states.at(-1).phase, 'finished'); assert.equal(states.at(-1).index, 3)
  assert.ok(splitReadingText('öğrenci '.repeat(100)).every(chunk => chunk.length <= 180))
})
test('stopping or restarting speech invalidates delayed browser callbacks', () => {
  const {reader, spoken, states} = setup()
  reader.start('Eski sayfa. Devamı.', 1, null)
  const old = spoken[0]
  reader.stop(); old.onend(); old.onerror()
  assert.equal(spoken.length, 1); assert.equal(states.at(-1).phase, 'idle')
  reader.start('Yeni sayfa.', 1.25, null)
  old.onend(); old.onerror()
  assert.equal(spoken.length, 2); assert.equal(spoken[1].lang, 'tr-TR')
  assert.equal(states.at(-1).phase, 'reading')
})
test('pause, resume and voice failure produce honest control states', () => {
  const {reader, spoken, states, calls} = setup()
  reader.start('Kampüs hayatı.', 1, null)
  reader.pause(); assert.equal(states.at(-1).phase, 'paused'); assert.equal(calls.pause, 1)
  reader.resume(); assert.equal(states.at(-1).phase, 'reading')
  spoken[0].onerror(); assert.equal(states.at(-1).phase, 'error')
  const count = states.length
  spoken[0].onend(); reader.resume(); assert.equal(states.length, count)
  reader.start('   ', 1, null); assert.equal(states.at(-1).phase, 'idle')
})
test('a delayed sentence end while paused keeps the queued sentence paused', () => {
  const {reader, spoken, states} = setup()
  reader.start('İlk cümle. İkinci cümle.', 1, null)
  reader.pause(); spoken[0].onend()
  assert.equal(spoken[1].text, 'İkinci cümle.'); assert.equal(states.at(-1).phase, 'paused')
  reader.resume(); assert.equal(states.at(-1).phase, 'reading')
})
