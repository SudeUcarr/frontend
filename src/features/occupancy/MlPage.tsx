import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BrainCircuit, ChevronRight, Clock3, Database, ExternalLink, FlaskConical, Info, Plus, RotateCcw } from 'lucide-react';
import { occupancyApi } from '../../services/occupancy';
import { ErrorBox } from '../../components/ui';
import { useAppPath } from '../../components/layout';
import { Link } from 'react-router-dom';
import type { OccupancyBundle, OccupancyPrediction } from '@kampuskit/shared/occupancy';

import { CapacityScenarios } from './CapacityScenarios';

import { DayChart } from './DayChart';
import './ml.css';

type Bundle = OccupancyBundle;
const number = (value: number, decimals = 0) => value.toLocaleString('tr-TR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
const formatDay = (day: string) => new Date(day + 'T12:00:00Z').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function Experiment({ demo, forecast, venues }: Bundle) {
  const days = useMemo(() => [...new Set(demo.rows.map(row => row.day))], [demo]);
  const futureByTime = useMemo(() => new Map(forecast.rows.map(row => [row.timestamp, row])), [forecast]);
  const [day, setDay] = useState(days[0]);
  const [index, setIndex] = useState(12);
  const [extra, setExtra] = useState(0);
  const rows = useMemo(() => demo.rows.filter(row => row.day === day), [demo, day]);
  const safeIndex = Math.min(index, rows.length - 1);
  const row = rows[safeIndex];
  const futureRow = futureByTime.get(row.timestamp);
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<{key: string; prediction: OccupancyPrediction | null; error: string} | null>(null);
  const requestKey = row.timestamp + '|' + extra + '|' + retry;
  useEffect(() => {
    const controller = new AbortController();
    void occupancyApi.predict(row.timestamp, extra, controller.signal).then(prediction => {
      if (!controller.signal.aborted) setResponse({key: requestKey, prediction, error: ''});
    }).catch(cause => {
      if (!controller.signal.aborted) setResponse({key: requestKey, prediction: null, error: cause instanceof Error ? cause.message : 'Tahmin hesaplanamadı.'});
    });
    return () => controller.abort();
  }, [row.timestamp, extra, requestKey]);
  const current = response?.key === requestKey ? response : null;
  const prediction = current?.prediction;
  const features = prediction?.features;
  const estimate = prediction?.nowEstimate;
  const futureEstimate = prediction?.futureEstimate ?? null;
  function selectTime(value: number) { setIndex(value); setExtra(0); }
  return <div className="ml-page ml-simple">
    <div className="ml-page-heading"><div><div className="ml-kicker"><span/>KAMPÜS YAŞAMI</div><h1>Girişten yoğunluğa.</h1><p>Şimdi ne kadar kalabalık, bir saat sonra nasıl olabilir?</p></div><span className="ml-tag"><FlaskConical size={14}/>Açık veri demosu</span></div>
    <div className="ml-disclosure"><Info size={18}/><p><strong>Bu ekran canlı kampüs verisi göstermez.</strong> Tahminler COD ofis verisine, kapasite senaryoları üniversitelerin resmî kaynaklarına dayanır.</p></div>
    <section className="ml-overview" aria-labelledby="ml-overview-title">
      <div className="ml-overview-heading"><div><h2 id="ml-overview-title">Bir an seç, tahmini gör.</h2><span>COD kayıtları · Kaynağın yerel saati</span></div><div className="ml-time-controls"><label>Test günü<select aria-label="Test günü" value={day} onChange={event => { setDay(event.target.value); selectTime(12); }}>{days.map(value => <option key={value} value={value}>{formatDay(value)}</option>)}</select></label><label>Kayıt saati<select aria-label="Kayıt saati" value={safeIndex} onChange={event => selectTime(Number(event.target.value))}>{rows.map((value, i) => <option value={i} key={value.timestamp}>{value.timestamp.slice(11, 16)}</option>)}</select></label></div></div>
      <ErrorBox message={current?.error || ''}/>
      {current?.error && <button type="button" className="button secondary small" onClick={() => setRetry(value => value + 1)}>Tahmini yeniden hesapla</button>}
      {!prediction && !current?.error && <p className="ml-calculating" role="status">Yoğunluk tahminleri hesaplanıyor…</p>}
      <div className="ml-dual-estimates">
        <div className="ml-estimate-card"><span><BrainCircuit size={17}/>Seçilen an · {row.timestamp.slice(11, 16)}</span><strong data-testid="ml-estimate">{estimate === undefined ? '…' : number(estimate, 1)}<small>kişi</small></strong><p>Giriş geçmişinden içerideki kişi tahmini</p></div>
        <div className="ml-estimate-card future"><span><Clock3 size={17}/>1 saat sonra{futureRow ? ` · ${futureRow.forecastTime.slice(11, 16)}` : ''}</span><strong data-testid="ml-forecast">{!prediction ? '…' : futureEstimate === null ? '—' : number(futureEstimate, 1)}<small>{futureEstimate === null ? '' : 'kişi'}</small></strong><p>{!prediction ? 'Seçilen anın girişleriyle hesaplanıyor.' : futureEstimate === null ? 'Bu günün son saatinde +60 dk demo kapsamı dışında.' : 'Yalnızca seçilen ana kadar olan girişlerle öngörü'}</p></div>
      </div>
      <details className="ml-records"><summary>Giriş kayıtlarını ve grafiği göster <ChevronRight size={16}/></summary>
        <div className="ml-input-stats"><div><span>Son 15 dk giriş</span><strong data-testid="ml-entries">{features?.[2] ?? '—'}</strong></div><div><span>Son 1 saat giriş</span><strong>{features?.[4] ?? '—'}</strong></div><div><span>Bugünkü girişler</span><strong>{features?.[7] ?? '—'}</strong></div></div>
        <div className="ml-chart-legend"><span><i/>Seçilen anı tahmin eden model</span><span><i/>Tarihsel sensör ölçümü</span></div>
        <DayChart rows={rows} selected={safeIndex}/>
        <input className="ml-time-slider" aria-label="Zaman çizelgesi" type="range" min={0} max={rows.length - 1} value={safeIndex} onChange={event => selectTime(Number(event.target.value))}/>
        <div className="ml-sim-actions"><button type="button" disabled={!prediction || extra >= 10000} onClick={() => setExtra(value => value + 1)}><Plus size={15}/>Deneme girişi ekle</button><button type="button" className="ml-text-button" disabled={!extra} onClick={() => setExtra(0)}><RotateCcw size={14}/>Sıfırla</button><small role="status">{extra ? `${extra} deneme girişi eklendi. ${prediction ? 'Tahminler güncellendi' : current?.error ? 'Tahmin hesaplanamadı' : 'Tahminler hesaplanıyor'}; tarihsel ölçümler değişmez.` : 'Giriş ekleyerek iki modeli yeniden çalıştır.'}</small></div>
        <p className="ml-comparison">Sensörün tarihsel sayımı: seçilen anda <strong>{row.target} kişi</strong>{futureRow && <>, bir saat sonra <strong>{futureRow.futureTarget} kişi</strong></>}. Bu değerler model girdisi değildir.</p>
      </details>
    </section>
    <CapacityScenarios venues={venues} nowEstimate={estimate ?? null} futureEstimate={futureEstimate}/>
    <details className="ml-technical"><summary><span><Database size={16}/>Model nasıl çalışıyor? Veri ve test sonuçları</span><ChevronRight size={16}/></summary><div>
      <p>İki ayrı Random Forest modeli aynı girdileri kullanır: saat, gün, son 15/30/60/120/240 dakikanın girişleri ve gün içi toplam. İlki o andaki, ikincisi tam 60 dakika sonraki kişi sayısını öğrenir. Gelecekteki girişler ve kişi sayımları girdi yapılmaz.</p>
      <div className="ml-table-wrap"><table><caption>Ofis verisinde kronolojik test · Düşük hata daha iyi</caption><thead><tr><th>Hedef</th><th>ML hata / MAE</th><th>Basit yöntem</th><th>Test kaydı</th></tr></thead><tbody><tr><td>Seçilen an</td><td>{number(demo.report.test.mae, 2)} kişi</td><td>{number(demo.report.baselines.fixedWindow.mae, 2)} kişi · giriş penceresi</td><td>{number(demo.report.split.test.rows)}</td></tr><tr><td>1 saat sonra</td><td>{number(forecast.report.test.mae, 2)} kişi</td><td>{number(forecast.report.baselines.holdCurrentEstimate.mae, 2)} kişi · mevcut tahmini sabit tutma</td><td>{number(forecast.report.split.test.rows)}</td></tr></tbody></table></div>
      <p>İlk {demo.report.split.train.days} gün eğitim, sonraki {demo.report.split.validation.days} gün model seçimi, son {demo.report.split.test.days} gün test. Seçilen modeller ilk iki bölümle yeniden eğitildi. Eğitim süreleri: mevcut an için {number(demo.report.trainingSeconds, 2)} sn, +60 dk için {number(forecast.report.trainingSeconds, 2)} sn. MAE güven aralığı veya kampüs doğruluğu değildir.</p>
      <p>Model hesaplamaları backend'de yapılır; kapasiteye göre manuel senaryolar tarayıcıda gösterilir.</p><a href={import.meta.env.BASE_URL + 'legal/occupancy-data-license.txt'} target="_blank" rel="noreferrer">Veri ve model lisans bildirimi</a>
      <h3>Girişler nereden geliyor?</h3><p>{number(demo.report.audit.rawRows)} kapı sensörü kaydındaki pozitif kişi değişimleri giriş olayına çevrildi. Bu bir öğrenci kartı veri seti değildir. Aynı saniyede birden fazla olay korunur. Her kayıt günü sıfırla bittiği için boş başlangıç varsayılır; eksik günler doldurulmaz. Kaynak sensör görüntü tabanlı olsa da uygulamada yalnızca sayısal veri işlenir.</p>
      <h3>Sınav haftasını öğrenebilir mi?</h3><p>Evet. Gerçek kütüphane girişleri ve kişi sayımlarına sınav dönemi, sınava kalan gün ve akademik takvim bilgisi eklenebilir. Sonraki sınav döneminde test ederek etkisinin öğrenilip öğrenilmediği ölçülür. COD verisinde bu bilgiler yoktur; ekrandaki artış yalnızca açıkça belirtilen bir varsayımdır. Resmî sınav takvimi bağlı değildir.</p>
      <h3>Spor salonunda kullanım</h3><p>Aynı giriş arayüzü ve yoğunluk hesabı kullanılır. Fitness kapasitesi, tribün koltuğuyla karıştırılmaz. Bu model spor salonu davranışını öğrenmedi; gerçek kullanım için salon girişleri, kişi sayımları, seanslar ve açılış saatleriyle yeniden eğitim gerekir. Yemekhane ve kütüphane için de yerel doğrulama gerekir.</p>
      <a href={demo.source.url} target="_blank" rel="noreferrer">Liu ve diğerleri · COD (2017) · {demo.source.license}<ExternalLink size={13}/></a>
      <details className="ml-method"><summary>Seçilen günün sayısal sonuçları <ChevronRight size={16}/></summary><div className="ml-table-wrap"><table><caption>{formatDay(day)} · Deneme girişleri hariç, tahminler satırdaki anda üretilir</caption><thead><tr><th>Girdi saati</th><th>O an / ML</th><th>O an / sensör</th><th>+60 dk / ML</th><th>+60 dk / sensör</th></tr></thead><tbody>{rows.map(sample => { const future = futureByTime.get(sample.timestamp); return <tr key={sample.timestamp}><td>{sample.timestamp.slice(11, 16)}</td><td>{number(sample.prediction, 1)}</td><td>{sample.target}</td><td>{future ? number(future.forecastPrediction, 1) : '—'}</td><td>{future?.futureTarget ?? '—'}</td></tr>; })}</tbody></table></div></details>
    </div></details>
  </div>;
}

export function MlPage() {
  const base = useAppPath();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void occupancyApi.demo(controller.signal).then(result => {
      if (!result.demo?.rows?.length || !result.venues?.length || !result.forecast?.rows?.length || result.forecast.report.sourceSha256 !== result.demo.report.audit.sha256)
        throw new Error('Model verisi eksik veya uyumsuz.');
      if (!controller.signal.aborted) setBundle(result);
    }).catch(cause => {if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Veriler yüklenemedi.');});
    return () => controller.abort();
  }, [retry]);
  if (error) return <div className="ml-load-error" role="alert"><h1>Yoğunluk tahmini yüklenemedi.</h1><p>{error}</p><button className="button secondary" onClick={() => {setError(''); setRetry(value => value + 1);}}>Yeniden dene</button><Link to={base + '/yogunluk'}>Öğrenci bildirimlerine dön <ArrowRight size={16}/></Link></div>;
  if (!bundle) return <div className="ml-loading" role="status"><BrainCircuit size={30}/><p>Yoğunluk demosu yükleniyor…</p></div>;
  return <Experiment {...bundle}/>;
}
