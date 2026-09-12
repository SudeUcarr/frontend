import {PolicyPage} from './pages/policies'
import {PlacesPage} from './pages/places'
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import { SpeechReading } from './components/SpeechReading'
import { ThemeControl } from './components/ThemeControl'
import { Brand } from './components/Brand'
import { AuthPage, Gate, ScrollTop } from './components/auth'
import { Layout, ToolsPage } from './components/layout'
import Dashboard from './pages/dashboard'
import { NotesPage } from './pages/academic'
import { InternshipsPage } from './pages/internships'
import { ListingsPage } from './pages/listings'
import { BudgetPage } from './pages/budget'
import { CalendarPage, NotificationsPage } from './pages/calendar'
import { ClubsPage } from './pages/community'
import { CrowdPage } from './pages/crowd'
import ProfilePage from './pages/profile'
import { ArrowUpRight, ArrowRight, BookOpen, Wallet, House, Users, MapPin, GraduationCap, Check, Sparkles } from 'lucide-react'
const groups = [
{icon:BookOpen,title:'Dersler biraz daha kolay.',text:'Ders notları, sorular ve hiçbir zaman kaçırmadığın teslim tarihleri.',color:'blue'},
{icon:Wallet,title:'Ay sonu biraz daha rahat.',text:'Bütçeni takip et, ikinci el fırsatları ve öğrenci dostu mekanları keşfet.',color:'yellow'},
{icon:House,title:'Kendine bir yer bul.',text:'Kampüse yakın bir ev ya da aynı frekansta bir oda arkadaşı.',color:'pink'},
{icon:Users,title:'Birlikte daha güzel.',text:'Kulüplere göz at, etkinlikleri keşfet ve ilk stajına bir adım yaklaş.',color:'green'},
{icon:MapPin,title:'Kampüsün nabzını tut.',text:'Kütüphanede yer var mı? Yemekhane nasıl? Öğrencilerden öğren.',color:'lavender'}
]
export function Landing(){return <div className="landing">
<header className="landing-nav"><Brand/><nav><button onClick={()=>document.getElementById('araclar')?.scrollIntoView({behavior:'smooth'})}>Neler var?</button><button onClick={()=>document.getElementById('nasil')?.scrollIntoView({behavior:'smooth'})}>Nasıl çalışır?</button></nav><div className="landing-nav-actions"><Link className="button small" to="/giris">Giriş yap <ArrowUpRight size={16}/></Link><ThemeControl inline/></div></header>
<main><section className="landing-hero"><div className="hero-copy"><div className="eyebrow"><span className="tiny-dot"/> ÖĞRENCİ HAYATINA BİR KISA YOL</div><h1>Kampüs hayatın,<br/><span>bir arada.</span></h1><p>Dersler, yeni arkadaşlar, ay sonu hesapları…<br/>Üniversite hayatının bütün parçaları için tek bir kit.</p><div className="hero-actions"><Link to="/kayit" className="button">Kampüsüne katıl <ArrowRight size={19}/></Link><Link to="/demo" className="text-button">İçeriyi keşfet <ArrowUpRight size={18}/></Link></div><div className="hero-proof"><span className="avatar-stack"><i>ED</i><i>AK</i><i>ZM</i></span><span>Senin gibi öğrenciler için.<br/><strong>Her kampüste, her gün.</strong></span></div></div><div className="hero-visual"><img src="/campus.png" alt="Ağaçlar ve avlular arasında üniversite hayatı"/><div className="image-note"><span className="icon-tile yellow"><Sparkles size={22}/></span><div><strong>Yeni dönem, yeni ihtimaller.</strong><span>İhtiyacın olan her şey yanında.</span></div></div><span className="photo-caption">Kampüs hayatından ilham alan görsel</span></div></section>
<section className="landing-strip"><span><Check size={17}/> Tek hesap, bütün araçlar</span><span><Check size={17}/> Üniversitene özel içerik</span><span><Check size={17}/> Öğrenciden öğrenciye</span><span><Check size={17}/> Telefonunda da yanında</span></section>
<section className="landing-tools" id="araclar"><div className="section-intro"><div><span className="eyebrow">DAHA AZ SEKME, DAHA ÇOK KAMPÜS</span><h2>Bir gününe neler sığar?</h2></div><p>İhtiyacın olduğunda aç.<br/>Gerisini hayatına ayır.</p></div><div className="tool-grid">{groups.map(g=><Link to="/demo" className="tool-card" key={g.title}><span className={'icon-tile '+g.color}><g.icon size={25}/></span><h3>{g.title}</h3><p>{g.text}</p><ArrowUpRight size={20}/></Link>)}</div></section>
<section id="nasil" className="how-section"><span className="icon-tile yellow"><GraduationCap size={28}/></span><div><h2>Kendi kampüsünden başla.</h2><p>Hesabını oluştur. Üniversiteni seç. Sana ait alanı keşfet.</p></div><Link to="/kayit" className="button">Hadi başlayalım <ArrowRight size={18}/></Link></section></main>
<footer><Brand/><p>Öğrenci hayatını biraz kolaylaştırmak için.</p><span><Link to="/gizlilik">Gizlilik</Link> · <Link to="/kosullar">Koşullar</Link></span></footer></div>}
function HeaderlessThemeControl(){const {pathname}=useLocation();const hasOwnHeader=pathname==='/'||pathname.startsWith('/app')||pathname.startsWith('/demo');return hasOwnHeader?null:<ThemeControl/>}
function App(){return <HashRouter><StoreProvider><ScrollTop/><SpeechReading/><HeaderlessThemeControl/><Routes>
<Route path="/gizlilik" element={<PolicyPage privacy/>}/><Route path="/kosullar" element={<PolicyPage/>}/><Route path="/" element={<Landing/>}/><Route path="/giris" element={<AuthPage mode="login"/>}/><Route path="/kayit" element={<AuthPage mode="signup"/>}/><Route path="/sifremi-unuttum" element={<AuthPage mode="reset"/>}/><Route path="/sifre-yenile" element={<AuthPage mode="recovery"/>}/>
{['/app','/demo'].map(base=><Route key={base} path={base} element={<Gate><Layout/></Gate>}><Route index element={<Dashboard/>}/><Route path="notlar" element={<NotesPage/>}/><Route path="stajlar" element={<InternshipsPage/>}/><Route path="pazar" element={<ListingsPage kind="market"/>}/><Route path="evler" element={<ListingsPage kind="housing"/>}/><Route path="oda-arkadasi" element={<ListingsPage kind="roommate"/>}/><Route path="butce" element={<BudgetPage/>}/><Route path="takvim" element={<CalendarPage/>}/><Route path="mekanlar" element={<PlacesPage/>}/><Route path="kulupler" element={<ClubsPage/>}/><Route path="yogunluk" element={<CrowdPage/>}/><Route path="profil" element={<ProfilePage/>}/><Route path="bildirimler" element={<NotificationsPage/>}/><Route path="araclar" element={<ToolsPage/>}/></Route>)}
<Route path="*" element={<div className="empty"><h1>Bu sayfa kampüste değil.</h1><Link className="button" to="/">Ana sayfaya dön</Link></div>}/></Routes></StoreProvider></HashRouter>}
export default App
