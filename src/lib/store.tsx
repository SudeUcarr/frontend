import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react'
import type {ReactNode} from 'react'
import type {AppSession as Session} from '@kampuskit/shared/api'
import {useLocation} from 'react-router-dom'
import {auth,handleAuthCallback} from '../services/auth'
import {dataApi} from '../services/data'
import {createExampleData,demoProfile,demoUser} from '@kampuskit/shared/seed'
import {emptyData} from '@kampuskit/shared/types'
import type {DatabaseState,Profile,TableName,TableRows,Internship} from '@kampuskit/shared/types'
import {validateUpload} from '@kampuskit/shared/domain'
type WriteInput<K extends TableName>=Partial<TableRows[K]>
interface Store {data:DatabaseState;profile:Profile|null;session:Session|null;userId:string|null;demo:boolean;ready:boolean;loading:boolean;error:string;notice:string;universityId:string;setUniversityId:(id:string)=>void;refresh:()=>Promise<void>;notify:(text:string)=>void;save:<K extends TableName>(table:K,row:WriteInput<K>,id?:string)=>Promise<void>;remove:(table:TableName,id:string)=>Promise<void>;saveProfile:(row:Omit<Profile,'id'>)=>Promise<void>;upload:(file:File,bucket:'notes'|'listing-images')=>Promise<string>;download:(bucket:string,path:string,name:string)=>Promise<void>}
const Context=createContext<Store|null>(null)
export function StoreProvider({children}:{children:ReactNode}){
const location=useLocation(),demo=location.pathname.startsWith('/demo')
const sampleData=useMemo(createExampleData,[])
const [imported,setImported]=useState<Internship[]>([])
const examples=useMemo(()=>({...sampleData,internships:[...imported,...sampleData.internships]}),[sampleData,imported])
useEffect(()=>{let alive=true;if(demo)void dataApi.publicInternships().then(rows=>{if(alive)setImported(rows)}).catch(()=>{});return()=>{alive=false}},[demo])
const [data,setData]=useState(emptyData),[profile,setProfile]=useState<Profile|null>(null),[session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[universityId,setUniversity]=useState(examples.universities[0].id)
const sessionRef=useRef<Session|null>(null),epoch=useRef(0),refreshSequence=useRef(0),universityOwner=useRef<string|null>(null)
const notify=useCallback((text:string)=>setNotice(text),[])
useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(t)},[notice])
useEffect(()=>{const owner=demo?'demo':session?.user.id;if(!owner||(!demo&&!profile))return;if(universityOwner.current===owner)return;universityOwner.current=owner;const options=demo?examples.universities:data.universities;const saved=localStorage.getItem('kampuskit.university.'+owner);setUniversity(options.some(u=>u.id===saved)?saved!:(demo?demoProfile:profile)!.university_id)},[demo,session?.user.id,profile,examples,data.universities])
const setUniversityId=(id:string)=>{setUniversity(id);localStorage.setItem('kampuskit.university.'+(demo?'demo':sessionRef.current?.user.id||'guest'),id)}
const refresh=useCallback(async()=>{const user=sessionRef.current?.user,version=epoch.current,request=++refreshSequence.current;if(!user)return
try{const result=await dataApi.load();if(version!==epoch.current||request!==refreshSequence.current)return;setData(result.data);setProfile(result.profile);setError('')}catch(err){if(version===epoch.current&&request===refreshSequence.current)setError('Veriler yüklenemedi. Bağlantıyı kontrol edip yeniden dene. '+errorText(err))}finally{if(version===epoch.current&&request===refreshSequence.current)setLoading(false)}},[])
useEffect(()=>{let alive=true,revision=0;const apply=(s:Session|null)=>{if(!alive)return;const changed=sessionRef.current?.user.id!==s?.user.id;if(changed){epoch.current++;setData(emptyData());setProfile(null);setError('');setLoading(false);universityOwner.current=null}sessionRef.current=s;setSession(s);setReady(true);if(s){setLoading(changed);void refresh()}}
const unsubscribe=auth.subscribe(s=>{revision++;apply(s)}),unauthenticated=()=>{revision++;apply(null)};window.addEventListener('kampuskit:unauthenticated',unauthenticated)
const initialRevision=revision;void handleAuthCallback().then(()=>auth.getSession()).then(({session})=>{if(revision===initialRevision)apply(session)}).catch(err=>{if(alive&&revision===initialRevision){setError(errorText(err));setReady(true)}})
return()=>{alive=false;epoch.current++;unsubscribe();window.removeEventListener('kampuskit:unauthenticated',unauthenticated)}},[refresh])
useEffect(()=>{if(!session||demo)return;const onFocus=()=>void refresh();window.addEventListener('focus',onFocus);const timer=setInterval(onFocus,60000);return()=>{clearInterval(timer);window.removeEventListener('focus',onFocus)}},[session,demo,refresh])
function requireSession(){if(demo)throw new Error('Bu alan örnek içeriklerle gezilir. Kendi kayıtlarını oluşturmak için hesabına giriş yap.');if(!sessionRef.current)throw new Error('İşlemi kaydetmek için hesabına giriş yap.')}
async function save<K extends TableName>(table:K,row:WriteInput<K>,id?:string){requireSession();await dataApi.save(table,row,id);await refresh();notify(id?'Değişiklikler kaydedildi.':'Kaydedildi.')}
async function remove(table:TableName,id:string){requireSession();await dataApi.remove(table,id);await refresh();notify('Kayıt silindi.')}
async function saveProfile(row:Omit<Profile,'id'>){requireSession();await dataApi.saveProfile(row);setUniversityId(row.university_id);await refresh();notify('Profilin kaydedildi.')}
async function upload(file:File,bucket:'notes'|'listing-images'){requireSession();validateUpload(file,bucket);return dataApi.upload(file,bucket)}
async function download(bucket:string,path:string,name:string){requireSession();const data=await dataApi.file(bucket,path),url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
const value:Store={data:demo?examples:data,profile:demo?demoProfile:profile,session,userId:demo?demoUser:session?.user.id??null,demo,ready,loading,error:demo?'':error,notice,universityId,setUniversityId,refresh,notify,save,remove,saveProfile,upload,download}
return <Context.Provider value={value}>{children}</Context.Provider>}
export function useStore(){const store=useContext(Context);if(!store)throw new Error('Store missing');return store}
export function errorText(err:unknown){if(err&&typeof err==='object'&&'message' in err)return String(err.message);return 'İşlem tamamlanamadı. Yeniden deneyebilirsin.'}
