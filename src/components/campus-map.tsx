import {useEffect,useRef,useState} from 'react'
import {loadMaps} from '../lib/maps'
import type {Point} from '../lib/place-ranking'
import {ErrorBox} from './ui'
export function CampusMap({center,label,zoom=15}:{center:Point;label:string;zoom?:number}){
 const element=useRef<HTMLDivElement>(null),[error,setError]=useState(''),{lat,lng}=center
 useEffect(()=>{
  let alive=true,info:google.maps.InfoWindow|undefined
  const failed=()=>setError('Google haritası açılamadı. Google Cloud API izinlerini kontrol et.')
  window.addEventListener('kampuskit:maps-error',failed)
  void loadMaps().then(async()=>{
   const {Map,InfoWindow}=await google.maps.importLibrary('maps') as google.maps.MapsLibrary
   if(!alive||!element.current)return
   setError('')
   const point={lat,lng}
   const map=new Map(element.current,{center:point,zoom,mapTypeControl:false,streetViewControl:false,gestureHandling:'cooperative'})
   const content=document.createElement('strong');content.textContent=label
   info=new InfoWindow({content,position:point});info.open({map,shouldFocus:false})
  }).catch(()=>{if(alive)failed()})
  return()=>{alive=false;info?.close();window.removeEventListener('kampuskit:maps-error',failed)}
 },[lat,lng,label,zoom])
 return <div><ErrorBox message={error}/><div ref={element} className="campus-map" aria-label={label+' haritası'}/></div>
}
