import {useEffect} from 'react'
import {useStore} from '../lib/store'
import {budgetSummary,monthKey,crowdSummary} from '@kampuskit/shared/domain'

type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown}
type ModelDocument=Document&{modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}
export function ToolkitTools(){
  const s=useStore()
  useEffect(()=>{
    const context=(document as ModelDocument).modelContext
    if(!context?.registerTool)return
    const lifecycle=new AbortController()
    const tool:Tool={name:'read_campus_overview',description:'Seçili üniversiteyi, görünür kampüs araçlarının özetini ve oturum sahibinin bu ayki bütçesini oku. Örnek kampüste sonuçlar temsili verilerdir.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){
      if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Bu araç boş bir nesne kabul eder.')
      const budget=budgetSummary(s.data.budget_entries,monthKey())
      return {example:s.demo,university:s.data.universities.find(u=>u.id===s.universityId)?.name??null,balance_kurus:budget.balance,active_listings:s.data.listings.filter(i=>i.university_id===s.universityId&&i.status==='active').length,crowd:s.data.crowd_locations.filter(l=>l.university_id===s.universityId).map(l=>({name:l.name,...crowdSummary(s.data.crowd_reports,l.id)}))}
    }}
    try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{/* Optional browser capability. */}
    return()=>lifecycle.abort()
  },[s.data,s.demo,s.universityId])
  return null
}
