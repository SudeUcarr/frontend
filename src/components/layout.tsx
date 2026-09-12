import {useState} from 'react'
import {ToolkitTools} from './webmcp'
import {Link,NavLink,Outlet,useLocation} from 'react-router-dom'
import {LayoutDashboard,BookOpen,BriefcaseBusiness,ShoppingBag,Wallet,Coffee,House,Users,CalendarDays,Activity,Bell,ArrowUpRight,ChevronRight,Plus,LogOut,UserRound,Grid2X2,MapPin} from 'lucide-react'
import {Brand,ErrorBox,Modal} from './ui'
import {ThemeControl} from './ThemeControl'
import {useStore,errorText} from '../lib/store'
import {auth} from '../services/auth'
export const modules=[
{path:'',label:'Genel bakış',icon:LayoutDashboard,group:'',color:'blue'},
{path:'notlar',label:'Notlar & sorular',icon:BookOpen,group:'DERS & KARİYER',color:'blue'},
{path:'stajlar',label:'Staj fırsatları',icon:BriefcaseBusiness,group:'',color:'lavender'},
{path:'takvim',label:'Takvimim',icon:CalendarDays,group:'',color:'pink'},
{path:'pazar',label:'İkinci el pazarı',icon:ShoppingBag,group:'YAŞAM & BÜTÇE',color:'yellow'},
{path:'butce',label:'Bütçem',icon:Wallet,group:'',color:'green'},
{path:'mekanlar',label:'Öğrenci dostu mekanlar',icon:Coffee,group:'',color:'pink'},
{path:'evler',label:'Ev devretme',icon:House,group:'',color:'blue'},
{path:'oda-arkadasi',label:'Oda arkadaşı',icon:Users,group:'',color:'lavender'},
{path:'kulupler',label:'Kulüpler & etkinlikler',icon:Users,group:'KAMPÜS HAYATI',color:'green'},
{path:'yogunluk',label:'Kampüs yoğunluğu',icon:Activity,group:'',color:'yellow'}
]
export function useAppPath(){return useStore().demo?'/demo':'/app'}
export function Layout(){const s=useStore(),base=useAppPath(),location=useLocation();const [quick,setQuick]=useState(false);const active=modules.find(m=>location.pathname===base+(m.path?'/'+m.path:''));const unread=s.data.notifications.filter(n=>!n.read_at).length;return <div className="app-shell"><ToolkitTools/>
<aside className="sidebar"><Brand/><div className="campus-label"><span>KAMPÜSÜN İÇİN, SENİN İÇİN</span></div><nav aria-label="Ana menü">{modules.map(m=><div key={m.path}>{m.group&&<span className="nav-group">{m.group}</span>}<NavLink to={base+(m.path?'/'+m.path:'')} end className={({isActive})=>'nav-item '+(isActive?'active':'')}><m.icon size={18}/><span>{m.label}</span>{m.path===''&&<ChevronRight size={14}/>}</NavLink></div>)}</nav><div className="sidebar-bottom"><div className="sidebar-note"><span className="icon-tile yellow"><GraduationMark/></span><strong>Birlikte daha kolay.</strong><p>Kampüsünü güzelleştiren<br/>küçük bir paylaşım olabilir.</p><Link to={base+'/notlar'}>Bir şey paylaş <ArrowUpRight size={15}/></Link></div><Link to={base+'/profil'} className="user-block"><span className="avatar">{(s.profile?.display_name||'Ö').slice(0,2).toLocaleUpperCase('tr')}</span><div><strong>{s.profile?.display_name||'Öğrenci'}</strong><span>{s.demo?'Örnek öğrenci':s.profile?.department}</span></div><ChevronRight size={16}/></Link></div></aside>
<div className="app-main"><header className="topbar"><div className="breadcrumb">Kampüsüm <ChevronRight size={14}/><strong>{active?.label||'Hesabım'}</strong></div><div className="topbar-actions"><label className="university-select"><MapPin size={16}/><select aria-label="Görüntülenen üniversite" value={s.universityId} onChange={e=>s.setUniversityId(e.target.value)}>{s.data.universities.map(u=><option key={u.id} value={u.id}>{u.short_name} · {u.city}</option>)}</select></label><Link to={base+'/bildirimler'} className="icon-button notification-button" aria-label="Bildirimler"><Bell size={20}/>{unread>0&&<span/>}</Link><button className="button small" onClick={()=>setQuick(true)}><Plus size={17}/><span>Hızlı ekle</span></button><ThemeControl inline/></div></header>
{s.demo&&<div className="demo-bar"><span>Demo hesabıyla geziyorsun. Değişiklikleri kaydetmek için giriş yap.</span><Link to="/giris">Hesabıma geç <ArrowUpRight size={14}/></Link></div>}
<main className="page-content" id="main-content">{s.error&&<div className="load-error"><ErrorBox message={s.error}/><button className="button secondary small" onClick={()=>void s.refresh()}>Yeniden dene</button></div>}<Outlet/></main><footer className="app-footer"><span>KampüsKit · Öğrenci hayatına bir kısa yol.</span><Link to="/">KampüsKit hakkında <ArrowUpRight size={13}/></Link></footer></div>
<nav className="mobile-nav" aria-label="Mobil menü"><NavLink to={base} end><LayoutDashboard size={21}/>Ana panel</NavLink><NavLink to={base+'/takvim'}><CalendarDays size={21}/>Takvim</NavLink><NavLink to={base+'/araclar'}><Grid2X2 size={21}/>Araçlar</NavLink><NavLink to={base+'/profil'}><UserRound size={21}/>Profil</NavLink></nav>
{s.notice&&<div className="toast" role="status">{s.notice}</div>}
{quick&&<Modal title="Bugün ne ekleyelim?" onClose={()=>setQuick(false)}><div className="quick-dialog">{[{path:'notlar',title:'Not veya soru paylaş',icon:BookOpen},{path:'pazar',title:'İkinci el ilanı oluştur',icon:ShoppingBag},{path:'butce',title:'Gelir veya gider ekle',icon:Wallet},{path:'takvim',title:'Sınav veya teslim tarihi ekle',icon:CalendarDays}].map(m=><Link key={m.path} to={base+'/'+m.path+'?yeni=1'} onClick={()=>setQuick(false)}><m.icon size={20}/>{m.title}<ChevronRight size={18}/></Link>)}</div></Modal>}
</div>}
function GraduationMark(){return <BookOpen size={24}/>}
export function ToolsPage(){const base=useAppPath();return <><div className="page-head"><div><span className="eyebrow">KAMPÜS KİTİN</span><h1>İhtiyacın olan araçlar.</h1><p>Bugün hayatını ne kolaylaştırsın?</p></div></div><div className="tools-page-grid">{modules.slice(1).map(m=><Link className="panel tool-link" to={base+'/'+m.path} key={m.path}><span className={'icon-tile '+m.color}><m.icon size={25}/></span><h3>{m.label}</h3><ArrowUpRight size={20}/></Link>)}</div></>}
export function SignOut(){const s=useStore();return <button className="button secondary" onClick={async()=>{try{await auth.logout()}catch(e){s.notify(errorText(e))}}}><LogOut size={17}/>Çıkış yap</button>}
