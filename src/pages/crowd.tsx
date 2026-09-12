import {lazy, Suspense} from 'react'
import {useSearchParams} from 'react-router-dom'
import {Activity, BrainCircuit} from 'lucide-react'
import {CrowdReports} from './community'
import {Loading} from '../components/ui'
import '../features/occupancy/ml.css'

const MlPage = lazy(() => import('../features/occupancy/MlPage').then(module => ({default: module.MlPage})))
export function CrowdPage() {
  const [params, setParams] = useSearchParams()
  const ml = params.get('gorunum') === 'ml'
  return <>
    <div className="filter-bar crowd-view-tabs"><div className="tabs" aria-label="Yoğunluk görünümü">
      <button type="button" className={!ml ? 'active' : ''} aria-pressed={!ml} onClick={() => setParams({})}><Activity size={16}/>Öğrenci bildirimleri</button>
      <button type="button" className={ml ? 'active' : ''} aria-pressed={ml} onClick={() => setParams({gorunum: 'ml'})}><BrainCircuit size={16}/>Yoğunluk tahmini · ML</button>
    </div></div>
    {ml ? <Suspense fallback={<Loading/>}><MlPage/></Suspense> : <CrowdReports/>}
  </>
}
