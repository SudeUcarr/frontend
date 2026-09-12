import { useState } from 'react';
import { BookOpen, CalendarDays, Dumbbell, ExternalLink, MapPin, RotateCcw, Utensils } from 'lucide-react';
import { density, examScenario } from '@kampuskit/shared/occupancy';
import type { VenueKind, Venue } from '@kampuskit/shared/occupancy';

const number = (value: number) => value.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
const parseCount = (value: string) => value.trim() && Number.isSafeInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 100000 ? Number(value) : null;
const kinds = [{ id: 'library', title: 'Kütüphane', icon: BookOpen }, { id: 'cafeteria', title: 'Yemekhane', icon: Utensils }, { id: 'gym', title: 'Spor salonu', icon: Dumbbell }] as const;

export function CapacityScenarios({ venues, nowEstimate, futureEstimate }: { venues: Venue[]; nowEstimate: number | null; futureEstimate: number | null }) {
  const [kind, setKind] = useState<VenueKind>('library');
  const [city, setCity] = useState('Tümü');
  const [exam, setExam] = useState(false);
  const [uplift, setUplift] = useState(30);
  const [manual, setManual] = useState<string | null>(null);
  const [manualFuture, setManualFuture] = useState('');
  const baseNow = manual === null ? (nowEstimate === null ? null : Math.round(nowEstimate)) : parseCount(manual);
  const baseFuture = manual === null ? (futureEstimate === null ? null : Math.round(futureEstimate)) : parseCount(manualFuture);
  const filtered = venues.filter(venue => venue.kind === kind && (city === 'Tümü' || venue.city === city));
  return <section className="ml-capacity-section" aria-labelledby="ml-capacity-title">
    <div className="ml-capacity-heading"><div><h2 id="ml-capacity-title">Kampüste yoğunluk senaryosu</h2><p>Resmî kapasiteyle karşılaştır. Kampüsün canlı doluluğu değildir.</p></div><label className="ml-city-select">Şehir<select aria-label="Şehir" value={city} onChange={event => setCity(event.target.value)}>{['Tümü', 'İstanbul', 'Ankara'].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <div className="ml-kind-tabs" aria-label="Mekân türü">{kinds.map(item => <button type="button" key={item.id} aria-pressed={kind === item.id} onClick={() => setKind(item.id)}><item.icon size={16}/>{item.title}</button>)}</div>
    {kind === 'library' && <div className="ml-exam-control"><label className="ml-exam-switch" htmlFor="exam-week"><CalendarDays size={17}/><span>Sınav haftası senaryosu</span><input id="exam-week" type="checkbox" checked={exam} onChange={event => setExam(event.target.checked)}/></label>{exam && <div className="ml-exam-settings"><label htmlFor="exam-uplift">Ek kişi varsayımı <strong>+%{uplift}</strong></label><input id="exam-uplift" aria-label="Sınav haftası artış varsayımı" type="range" min={0} max={100} step={5} value={uplift} onChange={event => setUplift(Number(event.target.value))}/><p>Yalnızca kütüphane sayılarına uygulanır. Bu etki model tarafından öğrenilmedi; %30 örnek bir varsayımdır.</p></div>}</div>}
    <details className="ml-scenario-edit"><summary>Kişi sayısıyla senaryo dene <span>{manual === null ? 'ML örneği kullanılıyor' : 'Manuel senaryo'}</span></summary><div className="ml-manual-fields"><label>Senaryo kişi sayısı<input aria-label="Senaryo kişi sayısı" type="number" min={0} max={100000} step={1} value={manual ?? (nowEstimate === null ? '' : String(Math.round(nowEstimate)))} onChange={event => setManual(event.target.value)}/></label><label>1 saat sonrası senaryo kişi sayısı<input aria-label="1 saat sonrası senaryo kişi sayısı" type="number" min={0} max={100000} step={1} placeholder="İsteğe bağlı" value={manual === null ? (futureEstimate === null ? '' : String(Math.round(futureEstimate))) : manualFuture} onChange={event => { if (manual === null) setManual(nowEstimate === null ? '' : String(Math.round(nowEstimate))); setManualFuture(event.target.value); }}/></label><button type="button" className="ml-text-button" onClick={() => { setManual(null); setManualFuture(''); }}><RotateCcw size={14}/>ML tahminini kullan</button></div><p>Manuel sayılar birer varsayımdır; ilk sayıyı değiştirmek gelecek tahminini yeniden hesaplamaz. İkinci sayıyı ayrıca girebilirsin.</p>{manual !== null && (baseNow === null || (manualFuture !== '' && baseFuture === null)) && <p className="ml-error" role="alert">0–100.000 arasında tam sayı gir.</p>}</details>
    <div className="ml-venue-grid">{filtered.map(venue => {
      const now = baseNow === null ? null : examScenario(baseNow, venue.kind, exam, uplift);
      const future = baseFuture === null ? null : examScenario(baseFuture, venue.kind, exam, uplift);
      const state = now === null ? null : density(now, venue.capacity);
      const next = future === null ? null : density(future, venue.capacity);
      const Icon = kinds.find(item => item.id === venue.kind)!.icon;
      return <article className="ml-venue" key={venue.id} data-testid={`venue-${venue.id}`}>
        <div className="ml-venue-top"><span className={`ml-venue-icon ${venue.kind}`}><Icon size={22}/></span><span className={`ml-level ${state?.tone ?? ''}`}>{state?.level ?? 'Sayı bekleniyor'}</span></div>
        <span className="ml-university">{venue.university}</span><h3>{venue.name}</h3><p className="ml-location"><MapPin size={13}/>{venue.city} · {venue.campus}</p>
        <div className="ml-ratio"><strong data-testid="density-value">{state ? `%${number(state.percent)}` : '—'}</strong><span><b data-testid="scenario-now">{now === null ? '—' : number(now)}</b> / {number(venue.capacity)} kişi<small>Seçilen anın senaryosu</small></span></div>
        <div className={`ml-progress ${state?.tone ?? ''}`}><i style={{ width: `${state?.barPercent ?? 0}%` }}/></div>
        <div className="ml-next-ratio"><span>1 saat sonra</span><strong data-testid="future-density">{next ? `%${number(next.percent)}` : '—'}</strong><small data-testid="scenario-future">{future === null ? (manual === null ? (nowEstimate === null ? 'Tahmin bekleniyor' : 'Demo kapsamı dışında') : 'Gelecek senaryosu girilmedi') : `${number(future)} kişi · ${next!.level}`}</small></div>
        {kind === 'library' && exam && <p className="ml-exam-applied">Sınav varsayımı: temel sayılara +%{uplift} eklendi.</p>}
        {kind === 'gym' && <p className="ml-gym-note">Ofis modelinin spor salonuna uyarlama senaryosu; spor salonu verisiyle doğrulanmadı.</p>}
        <p className="ml-capacity-meta">{venue.capacityType}: <strong>{number(venue.capacity)}</strong><span>{venue.sourceYear ? `${venue.sourceYear} verisi` : 'Kaynakta yıl yok'}</span></p>
        <details className="ml-source"><summary>Resmî kaynak ve kapsam <ExternalLink size={12}/></summary><p>{venue.scope}</p><a href={venue.sourceUrl} target="_blank" rel="noreferrer">{venue.sourceTitle}<ExternalLink size={12}/></a><small>Erişim: {venue.retrievedAt.slice(0, 10)}</small></details>
      </article>;
    })}</div>
    {!filtered.length && <p className="ml-empty">Bu şehir ve mekân türü için kayıt bulunamadı.</p>}
    <p className="ml-footnote">Yoğunluk = kişi / kapasite × 100. Sakin &lt; %40, orta %40–79, yoğun ≥ %80. Bunlar demo eşikleridir; oran boş sandalye veya boş spor aleti ölçümü değildir.</p>
  </section>;
}
