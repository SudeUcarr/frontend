import {useRef,useState} from 'react'
import {Soup,Plus,X,ExternalLink} from 'lucide-react'
import {errorText} from '../lib/store'
import {PageHead,Empty,ErrorBox} from '../components/ui'
import {recipesApi} from '../services/recipes'
import type {RecipeMatch} from '../services/recipes'
import {commonIngredients,toEnglishIngredient,toTurkishIngredient} from '../lib/ingredients-tr'
import './recipes.css'

export function RecipesPage(){
 const [draft,setDraft]=useState(''),[ingredients,setIngredients]=useState<string[]>([]),[items,setItems]=useState<RecipeMatch[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const sequence=useRef(0)
 function addIngredient(raw:string){const en=toEnglishIngredient(raw);if(!en)return;setIngredients(list=>list.includes(en)?list:[...list,en].slice(0,8));setDraft('')}
 function removeIngredient(en:string){setIngredients(list=>list.filter(i=>i!==en))}
 async function search(){
  if(!ingredients.length)return
  const current=++sequence.current;setBusy(true);setError('')
  try{const results=await recipesApi.findByIngredients(ingredients);if(current!==sequence.current)return;setItems(results)}
  catch(e){if(current===sequence.current){setItems(null);setError(errorText(e))}}
  finally{if(current===sequence.current)setBusy(false)}
 }
 return <>
  <PageHead eyebrow="DOLABINDAKİLERLE NE PİŞSE?" title="Ne pişirsem?" description="Elindeki malzemeleri ekle, Spoonacular'dan uygun tarifleri getirelim."/>
  <div className="panel recipe-panel">
   <form className="recipe-add-row" onSubmit={e=>{e.preventDefault();addIngredient(draft)}}>
    <input aria-label="Malzeme ekle" placeholder="ör. yumurta, peynir, domates" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={40}/>
    <button className="button secondary small" type="submit"><Plus size={16}/>Ekle</button>
   </form>
   <div className="recipe-suggestions">{commonIngredients.filter(c=>!ingredients.includes(c.en)).slice(0,12).map(c=>
    <button key={c.en} type="button" className="chip" onClick={()=>addIngredient(c.tr)}>{c.tr}</button>
   )}</div>
   {ingredients.length>0&&<div className="recipe-chips">{ingredients.map(en=>
    <span className="chip selected" key={en}>{toTurkishIngredient(en)}<button type="button" aria-label={toTurkishIngredient(en)+' malzemesini kaldır'} onClick={()=>removeIngredient(en)}><X size={13}/></button></span>
   )}</div>}
   <button className="button" disabled={!ingredients.length||busy} onClick={()=>void search()}>{busy?'Tarifler aranıyor…':'Tarif bul'}</button>
  </div>
  <ErrorBox message={error}/>
  {items&&items.length>0&&<div className="content-grid recipe-grid">{items.map(r=>
   <a className="panel recipe-card" key={r.id} href={r.url} target="_blank" rel="noreferrer">
    {r.image?<img src={r.image} alt={r.title} loading="lazy"/>:<div className="recipe-placeholder"><Soup size={32}/></div>}
    <div className="recipe-card-body">
     <h2>{r.title}</h2>
     <p>{r.usedCount} malzeme elinde{r.missedCount>0&&<>, {r.missedCount} eksik</>}</p>
     {r.missedIngredients.length>0&&<p className="recipe-missing">Eksik: {r.missedIngredients.map(m=>toTurkishIngredient(m.name)).join(', ')}</p>}
     <span className="text-button">Tarife git <ExternalLink size={14}/></span>
    </div>
   </a>
  )}</div>}
  {items&&!items.length&&<Empty title="Bu malzemelerle tarif bulunamadı." text="Farklı malzemeler dene veya listeyi kısalt."/>}
  {!items&&<Empty title="Malzemelerini ekle, tarif önerelim." text="En az bir malzeme eklemen yeterli; listeden hızlıca da seçebilirsin."/>}
  <p className="section-footnote">Tarifler Spoonacular'dan gelir, başlık ve adımlar İngilizcedir. Malzeme adları kısmen Türkçeye çevrilir.</p>
 </>
}
