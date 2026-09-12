import type {Point} from './place-ranking'
import {api} from '../services/http'
import type {GooglePlace} from '@kampuskit/shared/api'
export type {GooglePlace} from '@kampuskit/shared/api'
export const mapsConfigured=Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
let loading:Promise<void>|null=null
export function loadMaps(){
 if(loading)return loading
 if(!mapsConfigured)return Promise.reject(new Error('Harita bağlantısı henüz yapılandırılmadı.'))
 loading=new Promise<void>((resolve,reject)=>{
  const win=window as unknown as {kampuskitMapsReady?:()=>void;gm_authFailure?:()=>void}
  const script=document.createElement('script')
  const fail=()=>{clearTimeout(timer);loading=null;script.remove();reject(new Error('Google Maps yüklenemedi. Bağlantıyı veya Google Cloud API ve alan adı izinlerini kontrol et.'))}
  const timer=setTimeout(fail,20000)
  win.kampuskitMapsReady=()=>{clearTimeout(timer);resolve()}
  win.gm_authFailure=()=>{fail();window.dispatchEvent(new Event('kampuskit:maps-error'))}
  script.src='https://maps.googleapis.com/maps/api/js?'+new URLSearchParams({key:import.meta.env.VITE_GOOGLE_MAPS_API_KEY,v:'quarterly',loading:'async',language:'tr',region:'TR',callback:'kampuskitMapsReady'})
  script.async=true;script.onerror=fail;document.head.append(script)
 })
 return loading
}
export async function nearbyPlaces(center:Point,radius:number,category:string):Promise<GooglePlace[]>{
 return api<GooglePlace[]>('/places/nearby','POST',{...center,radius,category})
}
